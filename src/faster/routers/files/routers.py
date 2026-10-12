# @Description : 文件上传/对象存储模板路由（流式上传 + 元数据落库 + 权限隔离 + 下载 + 统计）
from __future__ import annotations

import contextlib
import re
import uuid
from collections.abc import Coroutine
from datetime import datetime, timezone
from pathlib import PurePosixPath
from typing import Any
from urllib.parse import quote

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, Response, UploadFile, status
from fastapi.responses import StreamingResponse
from loguru import logger
from tortoise.exceptions import ConfigurationError, DoesNotExist, IntegrityError, OperationalError
from tortoise.functions import Max, Sum
from tortoise.queryset import QuerySet

from src.my_tools.security_tools import verify_jwt
from src.my_tools.security_tools.auth import require_jwt_role
from src.my_tools.security_tools.jwt_tools import TokenError, decode_token
from src.my_tools.storage_tools import StorageError
from src.my_tools.tortoise_tools.pagination import (
    OrderByParams,
    PageResult,
    PaginationParams,
    make_order_by_params,
)
from src.settings import SECURITY_CONFIG

from .models import FileRecord
from .schemas import FileOut, FileStats

files_router = APIRouter(prefix="/files", tags=["files"])

_DB_UNAVAILABLE = (OperationalError, ConfigurationError)
_BUSINESS_ERRORS = (IntegrityError, DoesNotExist)

_ALLOWED_SORT_FIELDS = {"id", "filename", "size", "created_at", "modified_at"}
_FileOrderBy = make_order_by_params(allowed_fields=_ALLOWED_SORT_FIELDS, default_sort="-created_at")

_UNSAFE_NAME = re.compile(r"[\\/:*?\"<>|\x00-\x1f]+")


async def _safe(coro: Coroutine) -> Any:
    """ORM 调用安全包装：DB 不可用转 503。"""
    try:
        return await coro
    except _BUSINESS_ERRORS:
        raise
    except _DB_UNAVAILABLE as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, f"Database unavailable: {exc.__class__.__name__}") from exc
    except RuntimeError as exc:
        if "TortoiseContext" not in str(exc):
            raise
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Database unavailable") from exc


def _current_user_id(payload: dict) -> int:
    uid = payload.get("uid")
    if not isinstance(uid, int):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token: uid missing")
    return uid


def _is_admin(payload: dict) -> bool:
    return payload.get("role") == "admin"


def _scoped_query(payload: dict) -> QuerySet[FileRecord]:
    qs = FileRecord.all()
    if not _is_admin(payload):
        qs = qs.filter(owner_id=_current_user_id(payload))
    return qs


async def _get_file_or_404(payload: dict, file_id: int) -> FileRecord:
    try:
        return await _safe(_scoped_query(payload).get(id=file_id))
    except DoesNotExist as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"File {file_id} not found") from exc


def _sanitize_filename(name: str) -> str:
    """清洗文件名：去路径、去非法字符、防穿越，保留中文等 Unicode。"""
    name = PurePosixPath(name).name  # 只保留最后一段
    name = _UNSAFE_NAME.sub("_", name).strip().strip(".")
    return name[:180] or "unnamed"


def _build_key(owner_id: int, filename: str) -> str:
    """生成对象键：users/<uid>/<YYYYMMDD>/<uuid>_<filename>。"""
    day = datetime.now(tz=timezone.utc).strftime("%Y%m%d")
    safe = _sanitize_filename(filename)
    return f"users/{owner_id}/{day}/{uuid.uuid4().hex}_{safe}"


class _CountingReader:
    """包裹上传流：统计字节数，落盘过程中拦截超大文件。"""

    def __init__(self, source: Any, max_size: int) -> None:
        self._source = source
        self._max = max_size
        self.size = 0

    def read(self, size: int = -1) -> bytes:
        chunk = self._source.read(size)
        self.size += len(chunk or b"")
        if self._max and self.size > self._max:
            raise HTTPException(
                status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                f"File too large: limit is {self._max} bytes",
            )
        return chunk


async def _optional_jwt(request: Request) -> dict | None:
    """可选 JWT 鉴权：无 Authorization 头或 token 非法时返回 None（不抛错），用于公开文件下载。"""
    auth = request.headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        return None
    try:
        return decode_token(
            auth[7:].strip(),
            SECURITY_CONFIG["jwt_secret"],
            algorithms=(SECURITY_CONFIG["jwt_algorithm"],),
        )
    except TokenError:
        return None


def _can_access(payload: dict | None, record: FileRecord) -> bool:
    if payload is None:
        return False
    return _is_admin(payload) or record.owner_id == payload.get("uid")


# ————————————————————————————————————————
#  上传 / 列表 / 统计（具体路径必须在 /{file_id} 之前注册）
# ————————————————————————————————————————

@files_router.post(
    "/upload",
    summary="上传文件（Bearer JWT，multipart/form-data，流式落盘）",
    response_model=FileOut,
    status_code=status.HTTP_201_CREATED,
)
async def upload_file(
    request: Request,
    file: UploadFile = File(..., description="文件二进制"),
    is_public: bool = Form(False, description="是否公开（公开文件免登录可下载）"),
    payload: dict = Depends(verify_jwt),
) -> FileOut:
    storage = request.app.state.storage
    storage_cfg = request.app.state.storage_config
    uid = _current_user_id(payload)

    # 扩展名白名单（[myproject.storage] allowed_extensions；空列表表示不限）
    allowed: set[str] = set(storage_cfg.get("allowed_extensions", []))
    if allowed:
        ext = PurePosixPath(file.filename or "").suffix.lower()
        if ext not in allowed:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"File extension '{ext}' not allowed. Allowed: {sorted(allowed)}",
            )

    key = _build_key(uid, file.filename or "unnamed")
    content_type = file.content_type or "application/octet-stream"
    max_size = int(storage_cfg.get("max_size", 50 * 1024 * 1024))

    reader = _CountingReader(file.file, max_size)
    try:
        obj = await storage.save_stream(key, reader, content_type=content_type)
    except HTTPException:
        raise
    except StorageError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Storage error: {exc}") from exc

    try:
        record = await _safe(
            FileRecord.create(
                filename=_sanitize_filename(file.filename or "unnamed"),
                key=key,  # 存业务 key（不含存储命名空间前缀）
                size=obj.size,
                content_type=obj.content_type,
                storage_backend=storage.backend_name,
                etag=obj.etag,
                is_public=is_public,
                owner_id=uid,
            )
        )
    except Exception:
        # DB 落库失败时回滚已写入的存储对象，避免孤儿文件
        with contextlib.suppress(StorageError):
            await storage.delete(key)
        raise

    logger.bind(username=payload.get("sub"), file_id=record.id, size=record.size).info(
        f"file uploaded: {record.filename}"
    )
    return FileOut.model_validate(record, from_attributes=True)


@files_router.get("", summary="分页查询我的文件（Bearer JWT）", response_model=PageResult[FileOut])
async def list_my_files(
    page: PaginationParams = Depends(),
    sort: OrderByParams = Depends(_FileOrderBy),
    filename: str | None = Query(None, min_length=1, max_length=100, description="按文件名模糊搜索"),
    payload: dict = Depends(verify_jwt),
) -> PageResult[FileOut]:
    qs = _scoped_query(payload)
    if filename:
        qs = qs.filter(filename__icontains=filename)
    total = await _safe(qs.count())
    qs = sort.apply(qs)
    items = await _safe(qs.offset(page.offset).limit(page.limit))
    return PageResult(
        total=total,
        page=page.page,
        page_size=page.page_size,
        items=[FileOut.model_validate(f, from_attributes=True) for f in items],
    )


@files_router.get("/stats", summary="文件存储统计（Bearer JWT）", response_model=FileStats)
async def file_stats(request: Request, payload: dict = Depends(verify_jwt)) -> FileStats:
    qs = _scoped_query(payload)
    total_files = await _safe(qs.count())
    agg = await _safe(qs.annotate(total_bytes=Sum("size"), max_id=Max("id")).first())
    total_bytes = int(getattr(agg, "total_bytes", 0) or 0)
    healthy = await request.app.state.storage.health()
    return FileStats(
        total_files=total_files,
        total_bytes=total_bytes,
        backend=request.app.state.storage.backend_name,
        storage_healthy=healthy,
    )


@files_router.get(
    "/admin/list",
    summary="管理员：全量文件列表（admin 角色）",
    response_model=PageResult[FileOut],
    dependencies=[Depends(require_jwt_role("admin"))],
)
async def admin_list_files(
    page: PaginationParams = Depends(),
    sort: OrderByParams = Depends(_FileOrderBy),
    owner_id: int | None = Query(None, description="按所属用户 ID 过滤"),
    filename: str | None = Query(None, min_length=1, max_length=100, description="按文件名模糊搜索"),
) -> PageResult[FileOut]:
    qs = FileRecord.all()
    if owner_id is not None:
        qs = qs.filter(owner_id=owner_id)
    if filename:
        qs = qs.filter(filename__icontains=filename)
    total = await _safe(qs.count())
    qs = sort.apply(qs)
    items = await _safe(qs.offset(page.offset).limit(page.limit))
    return PageResult(
        total=total,
        page=page.page,
        page_size=page.page_size,
        items=[FileOut.model_validate(f, from_attributes=True) for f in items],
    )


# ————————————————————————————————————————
#  按 ID 操作（下载支持：Bearer / query token / 公开文件）
# ————————————————————————————————————————

@files_router.get(
    "/{file_id}",
    summary="获取文件元数据（Bearer JWT，越权 404）",
    response_model=FileOut,
)
async def get_file(file_id: int, payload: dict = Depends(verify_jwt)) -> FileOut:
    record = await _get_file_or_404(payload, file_id)
    return FileOut.model_validate(record, from_attributes=True)


@files_router.get(
    "/{file_id}/download",
    summary="下载文件（所有者/admin；is_public 文件免鉴权；支持 ?token= 直链）",
)
async def download_file(
    file_id: int,
    request: Request,
    token: str | None = Query(None, description="可选：URL query 传 JWT（用于浏览器 <img>/<a> 直链）"),
    payload: dict | None = Depends(_optional_jwt),
) -> StreamingResponse:
    try:
        record = await _safe(FileRecord.get(id=file_id))
    except DoesNotExist:
        # 统一 404，不暴露文件是否存在
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"File {file_id} not found") from None

    authorized = _can_access(payload, record)

    if not authorized and token:
        try:
            token_payload = decode_token(
                token,
                SECURITY_CONFIG["jwt_secret"],
                algorithms=(SECURITY_CONFIG["jwt_algorithm"],),
            )
            authorized = _can_access(token_payload, record)
        except TokenError:
            authorized = False

    if not authorized and not record.is_public:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"File {file_id} not found")

    storage = request.app.state.storage
    try:
        data = await storage.read(record.key)
    except StorageError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"object missing in storage: {exc}") from exc

    download_name = quote(record.filename)
    return StreamingResponse(
        iter([data]),
        media_type=record.content_type,
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{download_name}",
            "Content-Length": str(record.size),
        },
    )


@files_router.delete(
    "/{file_id}",
    summary="删除文件（Bearer JWT，同时删除存储对象，204）",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
async def delete_file(file_id: int, request: Request, payload: dict = Depends(verify_jwt)) -> Response:
    record = await _get_file_or_404(payload, file_id)
    storage = request.app.state.storage
    with contextlib.suppress(StorageError):
        await storage.delete(record.key)
    await _safe(record.delete())
    logger.bind(username=payload.get("sub"), file_id=file_id).info("file deleted")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
