# @Description : 文件记录模型（对象存储元数据落库，实体文件在 Local/S3 后端）
from __future__ import annotations

from tortoise import fields, models

from . import app_name


class FileRecord(models.Model):
    """上传文件记录：一个文件对应一条记录 + 一个存储对象 key。"""

    id = fields.IntField(pk=True, description="文件 ID")
    filename = fields.CharField(max_length=255, description="原始文件名")
    key = fields.CharField(max_length=500, unique=True, description="对象存储 key（全局唯一）")
    size = fields.BigIntField(default=0, description="文件大小（字节）")
    content_type = fields.CharField(max_length=128, default="application/octet-stream", description="MIME 类型")
    storage_backend = fields.CharField(max_length=32, default="local", description="存储后端：local / s3")
    etag = fields.CharField(max_length=128, default="", description="内容哈希 / ETag")
    is_public = fields.BooleanField(default=False, description="是否公开（公开文件免登录可下载）")
    owner = fields.ForeignKeyField(
        "users.User",
        related_name="files",
        on_delete=fields.OnDelete.CASCADE,
        description="所属用户",
    )
    created_at = fields.DatetimeField(auto_now_add=True, description="上传时间")
    modified_at = fields.DatetimeField(auto_now=True, description="修改时间")

    class Meta:
        table = f"{app_name}_record"
        table_description = "文件上传记录表"
        indexes = [("owner_id", "is_public"), ("filename",), ("created_at",)]
