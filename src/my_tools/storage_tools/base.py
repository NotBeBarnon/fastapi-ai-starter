# @Description : 存储后端抽象基类 + 统一数据结构
from __future__ import annotations

import abc
from dataclasses import dataclass
from datetime import datetime


class StorageError(Exception):
    """存储层统一异常（读写失败、对象不存在、后端不可用等）。"""


@dataclass
class StoredObject:
    """存储对象的元数据（与具体后端无关）。"""

    key: str  # 对象键（相对路径 / object key），全局唯一
    size: int  # 字节数
    content_type: str  # MIME 类型
    etag: str = ""  # 内容哈希 / ETag
    last_modified: datetime | None = None
    url: str = ""  # 访问地址（本地为下载路由，S3 为预签名/公共 URL）

    def to_dict(self) -> dict:
        return {
            "key": self.key,
            "size": self.size,
            "content_type": self.content_type,
            "etag": self.etag,
            "last_modified": self.last_modified.isoformat() if self.last_modified else None,
            "url": self.url,
        }


class StorageBackend(abc.ABC):
    """对象存储后端统一接口。

    生产环境实现新后端（S3/OSS/COS/MinIO）只需继承并实现以下方法，
    再在 manager.init_storage 中按 backend 名称实例化即可，业务路由零改动。
    """

    #: 后端标识（local / s3 / oss ...）
    name: str = "base"

    @abc.abstractmethod
    async def save(
        self,
        key: str,
        data: bytes,
        content_type: str = "application/octet-stream",
    ) -> StoredObject:
        """写入对象（覆盖语义）。key 为相对对象键。"""

    @abc.abstractmethod
    async def read(self, key: str) -> bytes:
        """读取对象全部内容；不存在抛 StorageError。"""

    @abc.abstractmethod
    async def stat(self, key: str) -> StoredObject:
        """获取对象元数据；不存在抛 StorageError。"""

    @abc.abstractmethod
    async def delete(self, key: str) -> None:
        """删除对象；对象不存在应幂等返回。"""

    @abc.abstractmethod
    async def exists(self, key: str) -> bool:
        """对象是否存在。"""

    @abc.abstractmethod
    async def list_keys(self, prefix: str = "", limit: int = 100, offset: int = 0) -> tuple[list[StoredObject], int]:
        """按前缀列举对象，返回 (对象列表, 总数)。"""

    @abc.abstractmethod
    async def health(self) -> bool:
        """后端健康检查（探针用）。"""

    async def aclose(self) -> None:
        """释放连接池等资源（可选）。"""
