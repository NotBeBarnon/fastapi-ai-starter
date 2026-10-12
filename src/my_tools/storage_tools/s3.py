# @Description : S3 兼容对象存储后端模板（MinIO / AWS S3 / 阿里 OSS / 腾讯 COS 等 S3 协议服务）
#
# 使用方式：
#   1. pip install aioboto3（未在默认依赖中，按需安装）
#   2. pyproject.toml:
#        [myproject.storage]
#        backend = "s3"
#        s3_endpoint = "http://localhost:9000"   # MinIO 用本地地址；AWS 留空或填官方 endpoint
#        s3_bucket = "fastapi-ai-starter"
#        s3_region = "us-east-1"
#      密钥走环境变量（不要写进仓库）：
#        FS_S3_ACCESS_KEY / FS_S3_SECRET_KEY
#   3. 业务路由完全不变，StorageBackend 接口一致。
from __future__ import annotations

from datetime import datetime, timezone
from urllib.parse import quote

from .base import StoredObject, StorageBackend, StorageError

try:  # aioboto3 为可选依赖
    import aioboto3  # type: ignore
    from botocore.config import Config as _BotoConfig  # type: ignore
    from botocore.exceptions import ClientError  # type: ignore
except ImportError as exc:  # pragma: no cover
    aioboto3 = None
    ClientError = Exception
    _BotoConfig = None
    _IMPORT_ERROR = exc
else:
    _IMPORT_ERROR = None


class S3Storage(StorageBackend):
    """S3 兼容后端（线程安全的 client 在首次使用时惰性创建）。"""

    name = "s3"

    def __init__(
        self,
        endpoint: str,
        bucket: str,
        access_key: str,
        secret_key: str,
        region: str = "us-east-1",
        *,
        public_base_url: str = "",
    ) -> None:
        if aioboto3 is None:
            raise StorageError(
                "S3Storage requires 'aioboto3'. Install it with: pip install aioboto3"
            ) from _IMPORT_ERROR
        self.endpoint = endpoint.rstrip("/")
        self.bucket = bucket
        self.access_key = access_key
        self.secret_key = secret_key
        self.region = region
        self.public_base_url = public_base_url.rstrip("/")
        self._session = aioboto3.Session()

    def _client(self):
        kwargs = {
            "region_name": self.region,
            "aws_access_key_id": self.access_key,
            "aws_secret_access_key": self.secret_key,
            "config": _BotoConfig(s3={"addressing_style": "path"}, signature_version="s3v4"),
        }
        if self.endpoint:
            kwargs["endpoint_url"] = self.endpoint
        return self._session.client("s3", **kwargs)

    def _make_url(self, key: str) -> str:
        if self.public_base_url:
            return f"{self.public_base_url}/{quote(key)}"
        if self.endpoint:
            return f"{self.endpoint}/{self.bucket}/{quote(key)}"
        return f"https://{self.bucket}.s3.{self.region}.amazonaws.com/{quote(key)}"

    @staticmethod
    def _to_object(key: str, head: dict, url: str) -> StoredObject:
        last = head.get("LastModified")
        if isinstance(last, datetime) and last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)
        return StoredObject(
            key=key,
            size=int(head.get("ContentLength", 0)),
            content_type=head.get("ContentType", "application/octet-stream"),
            etag=str(head.get("ETag", "")).strip('"'),
            last_modified=last,
            url=url,
        )

    async def save(self, key: str, data: bytes, content_type: str = "application/octet-stream") -> StoredObject:
        try:
            async with self._client() as client:
                await client.put_object(
                    Bucket=self.bucket, Key=key, Body=data, ContentType=content_type
                )
                head = await client.head_object(Bucket=self.bucket, Key=key)
            return self._to_object(key, head, self._make_url(key))
        except ClientError as exc:
            raise StorageError(f"s3 save failed: {exc}") from exc

    async def save_stream(self, key: str, source, content_type: str = "application/octet-stream") -> StoredObject:
        # aioboto3 支持 file-like 对象作为 Body，自动分段上传
        try:
            async with self._client() as client:
                await client.put_object(
                    Bucket=self.bucket, Key=key, Body=source, ContentType=content_type
                )
                head = await client.head_object(Bucket=self.bucket, Key=key)
            return self._to_object(key, head, self._make_url(key))
        except ClientError as exc:
            raise StorageError(f"s3 save stream failed: {exc}") from exc

    async def read(self, key: str) -> bytes:
        try:
            async with self._client() as client:
                resp = await client.get_object(Bucket=self.bucket, Key=key)
                async with resp["Body"] as stream:
                    return await stream.read()
        except ClientError as exc:
            raise StorageError(f"s3 read failed: {exc}") from exc

    async def stat(self, key: str) -> StoredObject:
        try:
            async with self._client() as client:
                head = await client.head_object(Bucket=self.bucket, Key=key)
            return self._to_object(key, head, self._make_url(key))
        except ClientError as exc:
            raise StorageError(f"s3 stat failed: {exc}") from exc

    async def delete(self, key: str) -> None:
        try:
            async with self._client() as client:
                await client.delete_object(Bucket=self.bucket, Key=key)
        except ClientError as exc:
            raise StorageError(f"s3 delete failed: {exc}") from exc

    async def exists(self, key: str) -> bool:
        try:
            await self.stat(key)
            return True
        except StorageError:
            return False

    async def list_keys(self, prefix: str = "", limit: int = 100, offset: int = 0) -> tuple[list[StoredObject], int]:
        try:
            async with self._client() as client:
                paginator = client.get_paginator("list_objects_v2")
                items: list[StoredObject] = []
                total = 0
                async for page in paginator.paginate(Bucket=self.bucket, Prefix=prefix):
                    contents = page.get("Contents", [])
                    total += len(contents)
                    for item in contents:
                        key = item["Key"]
                        if key.endswith("/"):
                            continue
                        items.append(
                            StoredObject(
                                key=key,
                                size=int(item.get("Size", 0)),
                                content_type="application/octet-stream",
                                etag=str(item.get("ETag", "")).strip('"'),
                                last_modified=item.get("LastModified"),
                                url=self._make_url(key),
                            )
                        )
                return items[offset : offset + limit], total
        except ClientError as exc:
            raise StorageError(f"s3 list failed: {exc}") from exc

    async def health(self) -> bool:
        try:
            async with self._client() as client:
                await client.head_bucket(Bucket=self.bucket)
            return True
        except Exception:
            return False
