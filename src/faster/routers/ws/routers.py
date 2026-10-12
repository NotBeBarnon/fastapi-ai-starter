# @Description : WebSocket 实时通信路由（JWT 握手鉴权 + 频道房间 + 聊天广播 + 心跳 + 在线状态）
from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect, status
from loguru import logger
from pydantic import BaseModel, Field

from src.my_tools.security_tools import verify_jwt
from src.my_tools.security_tools.auth import require_jwt_role
from src.my_tools.security_tools.jwt_tools import TokenError, decode_token
from src.my_tools.ws_tools import ConnectionManager, WSConnection
from src.settings import SECURITY_CONFIG

ws_router = APIRouter(prefix="/ws", tags=["websocket"])

_ROOM_RE = re.compile(r"^[a-zA-Z0-9_\-]{1,32}$")
_MAX_CONTENT_LEN = 2000


def _now_iso() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


def _authenticate_ws(websocket: WebSocket) -> dict:
    """WebSocket 握手鉴权：浏览器无法为 WS 自定义请求头，token 走 ?token= 查询参数。

    未通过时在 accept 前关闭（code 1008 = policy violation），避免建立未授权连接。
    """
    token = websocket.query_params.get("token", "").strip()
    if not token:
        # 兼容 Sec-WebSocket-Protocol 传 token 的场景
        token = websocket.query_params.get("access_token", "").strip()
    if not token:
        websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "missing token")
    try:
        return decode_token(
            token,
            SECURITY_CONFIG["jwt_secret"],
            algorithms=(SECURITY_CONFIG["jwt_algorithm"],),
        )
    except TokenError as exc:
        websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"invalid token: {exc}") from exc


@ws_router.websocket("/rooms/{room}")
async def ws_room(websocket: WebSocket, room: str) -> None:
    """频道房间 WebSocket。

    - 连接：``/api/sample/ws/rooms/<room>?token=<JWT>``
    - 客户端消息（JSON）：
        - ``{"type":"chat","data":{"content":"..."}}``  群聊消息，广播给房间所有人
        - ``{"type":"typing"}``                          正在输入，广播给其他人
        - ``{"type":"ping"}``                            心跳，服务端回 ``{"type":"pong"}``
    - 服务端消息（JSON）：
        - ``system`` 欢迎/系统提示
        - ``chat``   群聊消息（含发送者公开信息 + 消息 ID + 时间戳）
        - ``presence`` 在线人数/用户列表（成员变化时自动下发）
        - ``typing`` 正在输入指示
        - ``pong`` / ``error``
    """
    if not _ROOM_RE.match(room):
        # 房间名非法：鉴权前先校验格式，直接拒绝
        websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    payload = _authenticate_ws(websocket)
    uid = payload.get("uid")
    if not isinstance(uid, int):
        websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    conn = WSConnection(
        ws=websocket,
        user_id=uid,
        username=str(payload.get("sub", f"user{uid}")),
        role=str(payload.get("role", "user")),
        room=room,
    )
    manager: ConnectionManager = websocket.app.state.ws_manager
    await manager.connect(conn)

    await manager.send_json(
        conn,
        {
            "type": "system",
            "ts": _now_iso(),
            "data": {"message": f"joined room '{room}'", "room": room, "you": conn.public},
        },
    )
    # 加入时通知其他人（不重复发给自己）
    await manager.broadcast(
        room,
        {
            "type": "system",
            "ts": _now_iso(),
            "data": {"message": f"{conn.username} joined", "event": "join"},
        },
        exclude=conn,
    )

    try:
        while True:
            message = await websocket.receive_json()
            msg_type = message.get("type") if isinstance(message, dict) else None

            if msg_type == "ping":
                await manager.send_json(conn, {"type": "pong", "ts": _now_iso()})

            elif msg_type == "chat":
                content = str((message.get("data") or {}).get("content", "")).strip()
                if not content:
                    await manager.send_json(conn, {"type": "error", "data": {"message": "empty content"}})
                    continue
                if len(content) > _MAX_CONTENT_LEN:
                    await manager.send_json(
                        conn, {"type": "error", "data": {"message": f"content too long (>{_MAX_CONTENT_LEN})"}}
                    )
                    continue
                event = {
                    "type": "chat",
                    "ts": _now_iso(),
                    "data": {
                        "id": uuid.uuid4().hex,
                        "room": room,
                        "user": conn.public,
                        "content": content,
                    },
                }
                await manager.broadcast(room, event)

            elif msg_type == "typing":
                await manager.broadcast(
                    room,
                    {"type": "typing", "ts": _now_iso(), "data": {"user": conn.public, "room": room}},
                    exclude=conn,
                )

            else:
                await manager.send_json(
                    conn,
                    {"type": "error", "data": {"message": f"unknown message type: {msg_type!r}"}},
                )
    except WebSocketDisconnect:
        await manager.disconnect(conn)
        await manager.broadcast(
            room,
            {
                "type": "system",
                "ts": _now_iso(),
                "data": {"message": f"{conn.username} left", "event": "leave"},
            },
        )
    except Exception as exc:  # 非法 JSON 等异常不中断进程
        logger.bind(room=room, user=conn.username).warning(f"ws loop error: {exc.__class__.__name__}: {exc}")
        await manager.disconnect(conn)


# ————————————————————————————————————————
#  辅助 HTTP 端点
# ————————————————————————————————————————

class BroadcastRequest(BaseModel):
    room: str = Field(..., min_length=1, max_length=32, description="目标房间")
    content: str = Field(..., min_length=1, max_length=_MAX_CONTENT_LEN, description="广播内容")
    level: str = Field("info", description="消息级别：info / warning / critical")


@ws_router.get("/stats", summary="WebSocket 在线连接统计（Bearer JWT）")
async def ws_stats(request: Request, payload: dict = Depends(verify_jwt)) -> dict[str, Any]:
    manager: ConnectionManager = request.app.state.ws_manager
    return manager.stats()


@ws_router.post(
    "/broadcast",
    summary="管理员：向指定房间服务端推送一条系统消息（admin）",
    dependencies=[Depends(require_jwt_role("admin"))],
)
async def ws_broadcast(body: BroadcastRequest, request: Request) -> dict[str, Any]:
    if not _ROOM_RE.match(body.room):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "invalid room name")
    manager: ConnectionManager = request.app.state.ws_manager
    event = {
        "type": "system",
        "ts": _now_iso(),
        "data": {"message": body.content, "event": "server_broadcast", "level": body.level, "from": "server"},
    }
    delivered = await manager.broadcast(body.room, event)
    return {"room": body.room, "delivered": delivered}
