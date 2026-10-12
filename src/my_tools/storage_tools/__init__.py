# @Description : 对象存储抽象层（本地磁盘 / S3 兼容，可扩展 OSS、COS、MinIO 等）
from __future__ import annotations

from .base import StoredObject, StorageBackend, StorageError
from .local import LocalStorage
from .manager import StorageManager, get_storage, init_storage

__all__ = (
    "StoredObject",
    "StorageBackend",
    "StorageError",
    "LocalStorage",
    "StorageManager",
    "get_storage",
    "init_storage",
)
