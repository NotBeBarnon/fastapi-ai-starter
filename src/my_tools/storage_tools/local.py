# @Description : 本地磁盘存储后端（零依赖，默认；生产可替换为 S3 后端）
from __future__ import annotations

import asyncio
import hashlib
import os
import shutil
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

from .base import StoredObject, StorageBackend, StorageError


class LocalStorage(StorageBackend):
    """把对象写到本地目录：root/<key>。

    - key 做路径规范化，禁止目录穿越（../）
    - 写文件采用临时文件 + 原子替换，避免读到半截文件
    - 大文件由路由层流式落盘，本类的 save 用于一次性写入（小文件/测试）
    """

    name = "local"

    def __init__(self, root: str | Path, url_prefix: str = "/api/sample/files/objects") -> None:
        self.root = Path(root).resolve()
        self.url_prefix = url_prefix.rstrip("/")
        self.root.mkdir(parents=True, exist_ok=True)

    # ---------- 内部工具 ----------
    def _resolve(self, key: str) -> Path:
        """把对象键解析为安全的绝对路径，拦截目录穿越。"""
        key = key.lstrip("/")
        target = (self.root / key).resolve()
        if not str(target).startswith(str(self.root)):
            raise StorageError(f"invalid key (path traversal blocked): {key}")
        return target

    def _to_object(self, path: Path, key: str | None = None) -> StoredObject:
        try:
            stat = path.stat()
        except OSError as exc:
            raise StorageError(f"object not found: {key or path.name}") from exc
        rel = key or str(path.relative_to(self.root)).replace(os.sep, "/")
        return StoredObject(
            key=rel,
            size=stat.st_size,
            content_type="application/octet-stream",
            etag=hashlib.md5(f"{rel}:{stat.st_size}:{stat.st_mtime_ns}".encode()).hexdigest(),
            last_modified=datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc),
            url=f"{self.url_prefix}/{quote(rel)}",
        )

    # ---------- StorageBackend ----------
    async def save(self, key: str, data: bytes, content_type: str = "application/octet-stream") -> StoredObject:
        target = self._resolve(key)
        target.parent.mkdir(parents=True, exist_ok=True)
        tmp = target.with_suffix(target.suffix + ".tmp")

        def _write() -> None:
            with tmp.open("wb") as f:
                f.write(data)
            os.replace(tmp, target)

        try:
            await asyncio.to_thread(_write)
        except OSError as exc:
            raise StorageError(f"save failed: {exc}") from exc
        obj = self._to_object(target, key)
        obj.content_type = content_type
        return obj

    async def save_stream(self, key: str, source, content_type: str = "application/octet-stream") -> StoredObject:
        """流式写入：source 为 file-like（UploadFile.file），避免大文件一次性进内存。"""
        target = self._resolve(key)
        target.parent.mkdir(parents=True, exist_ok=True)
        tmp = target.with_suffix(target.suffix + ".tmp")

        def _write_stream() -> None:
            with tmp.open("wb") as out:
                shutil.copyfileobj(source, out, length=1024 * 1024)
            os.replace(tmp, target)

        try:
            await asyncio.to_thread(_write_stream)
        except OSError as exc:
            raise StorageError(f"save stream failed: {exc}") from exc
        obj = self._to_object(target, key)
        obj.content_type = content_type
        return obj

    async def read(self, key: str) -> bytes:
        target = self._resolve(key)
        if not target.is_file():
            raise StorageError(f"object not found: {key}")
        return await asyncio.to_thread(target.read_bytes)

    async def stat(self, key: str) -> StoredObject:
        target = self._resolve(key)
        if not target.is_file():
            raise StorageError(f"object not found: {key}")
        return self._to_object(target, key)

    async def delete(self, key: str) -> None:
        target = self._resolve(key)
        if target.is_file():
            await asyncio.to_thread(target.unlink)

    async def exists(self, key: str) -> bool:
        return self._resolve(key).is_file()

    async def list_keys(self, prefix: str = "", limit: int = 100, offset: int = 0) -> tuple[list[StoredObject], int]:
        base = self._resolve(prefix) if prefix else self.root

        def _scan() -> list[Path]:
            if prefix and not base.exists():
                return []
            start = base if base.is_dir() else self.root
            return sorted((p for p in start.rglob("*") if p.is_file()), key=lambda p: p.stat().st_mtime, reverse=True)

        files = await asyncio.to_thread(_scan)
        total = len(files)
        objs = []
        for p in files[offset : offset + limit]:
            rel = str(p.relative_to(self.root)).replace(os.sep, "/")
            objs.append(self._to_object(p, rel))
        return objs, total

    async def health(self) -> bool:
        """写/读/删一个临时探针文件，验证目录真实可写（而不只是存在）。"""

        probe = self.root / f".healthcheck_{os.getpid()}.tmp"

        def _probe() -> bool:
            try:
                self.root.mkdir(parents=True, exist_ok=True)
                probe.write_bytes(b"ok")
                ok = probe.read_bytes() == b"ok"
                probe.unlink(missing_ok=True)
                return ok
            except OSError:
                return False

        return await asyncio.to_thread(_probe)

    async def aclose(self) -> None:
        # 本地后端无连接池；保留方法以对齐接口
        return None
