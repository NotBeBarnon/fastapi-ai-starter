# @Description : WebSocket 连接管理器（频道房间 + 广播 + 在线状态 + 心跳支持）
from __future__ import annotations

import asyncio
import contextlib
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from fastapi import WebSocket
from loguru import logger

__all__ = ("WSConnection", "ConnectionManager", "get_ws_manager")


def _now_iso() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


@dataclass(eq=False)
class WSConnection:
    """单条 WebSocket 连接及其归属用户/房间。

    eq=False：按对象身份放入 set（含 WebSocket，不可按值比较/哈希）。
    """

    ws: WebSocket
    user_id: int
    username: str
    role: str
    room: str

    def __hash__(self) -> int:
        return id(self)

    @property
    def public(self) -> dict[str, Any]:
        """对外暴露的用户信息（不包含敏感字段）。"""
        return {"user_id": self.user_id, "username": self.username, "role": self.role}


@dataclass
class ConnectionManager:
    """频道房间连接管理（单进程内存版，可平滑替换为 Redis Pub/Sub 多实例版）。

    - rooms: room -> set[WSConnection]
    - 广播失败的死连接会被自动剔除
    - 所有发送加锁/异常兜底，单个连接异常不影响房间内其他人
    """

    rooms: dict[str, set[WSConnection]] = field(default_factory=dict)
    _lock: asyncio.Lock = field(default_factory=asyncio.Lock)

    async def connect(self, conn: WSConnection) -> None:
        await conn.ws.accept()
        async with self._lock:
            self.rooms.setdefault(conn.room, set()).add(conn)
        logger.bind(room=conn.room, user=conn.username).debug("ws connected")
        await self._notify_presence(conn.room)

    async def disconnect(self, conn: WSConnection) -> None:
        async with self._lock:
            members = self.rooms.get(conn.room)
            if members:
                members.discard(conn)
                if not members:
                    self.rooms.pop(conn.room, None)
        logger.bind(room=conn.room, user=conn.username).debug("ws disconnected")
        with contextlib.suppress(Exception):
            await conn.ws.close()
        await self._notify_presence(conn.room)

    async def send_json(self, conn: WSConnection, payload: dict[str, Any]) -> bool:
        """向单个连接发送 JSON；失败返回 False。"""
        try:
            await conn.ws.send_json(payload)
            return True
        except Exception:
            return False

    async def broadcast(
        self,
        room: str,
        payload: dict[str, Any],
        *,
        exclude: WSConnection | None = None,
    ) -> int:
        """向房间内所有连接广播，返回成功发送数。死连接自动清理。"""
        members = list(self.rooms.get(room, set()))
        sent = 0
        dead: list[WSConnection] = []
        for conn in members:
            if exclude is not None and conn is exclude:
                continue
            if await self.send_json(conn, payload):
                sent += 1
            else:
                dead.append(conn)
        for conn in dead:
            await self.disconnect(conn)
        return sent

    async def _notify_presence(self, room: str) -> None:
        """房间成员变化时广播在线列表。"""
        members = list(self.rooms.get(room, set()))
        # 同一用户多标签页会有多条连接，在线列表按用户去重
        users: dict[int, dict[str, Any]] = {}
        for c in members:
            users.setdefault(c.user_id, c.public)
        await self.broadcast(
            room,
            {
                "type": "presence",
                "ts": _now_iso(),
                "data": {"room": room, "online": len(members), "users": list(users.values())},
            },
        )

    def stats(self) -> dict[str, Any]:
        """在线统计（供 HTTP 端点/监控查看）。"""
        rooms = {room: len(conns) for room, conns in self.rooms.items()}
        return {"connections": sum(rooms.values()), "rooms": len(rooms), "room_connections": rooms}


# 全局单例（无需 IO，直接在模块级创建）
_ws_manager = ConnectionManager()


def get_ws_manager() -> ConnectionManager:
    return _ws_manager
