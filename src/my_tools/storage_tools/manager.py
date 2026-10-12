# @Description : 存储管理器（按配置实例化后端，全局单例，路由从 app.state.storage 取用）
from __future__ import annotations

from pathlib import Path
from typing import Any

from loguru import logger

from .base import StorageBackend
from .local import LocalStorage

__all__ = ("StorageManager", "get_storage", "init_storage")


class StorageManager:
    """聚合一个默认存储后端 + 命名空间隔离。

    - local：本地磁盘（默认，零依赖）
    - s3：S3 兼容对象存储（需安装 aioboto3 并填配置，见 s3.py）
    """

    def __init__(self, backend: StorageBackend, namespace: str = "files") -> None:
        self.backend = backend
        self.namespace = namespace.strip("/")

    @property
    def backend_name(self) -> str:
        return self.backend.name

    def _namespaced(self, key: str) -> str:
        key = key.lstrip("/")
        return f"{self.namespace}/{key}" if self.namespace else key

    def raw_key(self, namespaced_key: str) -> str:
        """去掉命名空间前缀，返回业务侧的相对 key。"""
        if self.namespace and namespaced_key.startswith(self.namespace + "/"):
            return namespaced_key[len(self.namespace) + 1 :]
        return namespaced_key

    async def save(self, key: str, data: bytes, content_type: str = "application/octet-stream"):
        return await self.backend.save(self._namespaced(key), data, content_type)

    async def save_stream(self, key: str, source, content_type: str = "application/octet-stream"):
        return await self.backend.save_stream(self._namespaced(key), source, content_type)

    async def read(self, key: str) -> bytes:
        return await self.backend.read(self._namespaced(key))

    async def stat(self, key: str):
        return await self.backend.stat(self._namespaced(key))

    async def delete(self, key: str) -> None:
        await self.backend.delete(self._namespaced(key))

    async def exists(self, key: str) -> bool:
        return await self.backend.exists(self._namespaced(key))

    async def list_objects(self, prefix: str = "", limit: int = 100, offset: int = 0):
        ns_prefix = self._namespaced(prefix) if prefix else self.namespace
        objs, total = await self.backend.list_keys(ns_prefix, limit=limit, offset=offset)
        # 还原成业务 key（去掉命名空间前缀）
        for o in objs:
            o.key = self.raw_key(o.key)
        return objs, total

    async def health(self) -> bool:
        return await self.backend.health()

    async def aclose(self) -> None:
        await self.backend.aclose()


_STORAGE: StorageManager | None = None


def init_storage(storage_config: dict[str, Any], project_dir: Path | str) -> StorageManager:
    """根据配置初始化全局存储管理器。

    config 示例（pyproject.toml [myproject.storage]）：
        backend = "local"
        namespace = "files"
        local_root = "uploads"
        # backend = "s3" 时：
        # s3_endpoint = "https://s3.amazonaws.com"
        # s3_bucket = "my-bucket"
        # s3_access_key = ""   # 建议用环境变量 FS_S3_ACCESS_KEY 注入
        # s3_secret_key = ""
        # s3_region = "us-east-1"
    """
    global _STORAGE
    backend_name = storage_config.get("backend", "local")
    namespace = storage_config.get("namespace", "files")

    if backend_name == "local":
        root = Path(storage_config.get("local_root", "uploads"))
        if not root.is_absolute():
            root = Path(project_dir) / root
        backend: StorageBackend = LocalStorage(root)
    elif backend_name == "s3":
        from .s3 import S3Storage

        backend = S3Storage(
            endpoint=storage_config.get("s3_endpoint", ""),
            bucket=storage_config.get("s3_bucket", ""),
            access_key=storage_config.get("s3_access_key", ""),
            secret_key=storage_config.get("s3_secret_key", ""),
            region=storage_config.get("s3_region", "us-east-1"),
        )
    else:
        raise ValueError(f"unsupported storage backend: {backend_name}")

    _STORAGE = StorageManager(backend, namespace=namespace)
    logger.info(f"Storage initialized: backend={backend_name}, namespace={namespace}")
    return _STORAGE


def get_storage() -> StorageManager:
    """获取已初始化的存储管理器（未初始化抛错，避免静默 None）。"""
    if _STORAGE is None:
        raise RuntimeError("Storage not initialized; call init_storage() in lifespan first")
    return _STORAGE
