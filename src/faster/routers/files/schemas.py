# @Description : 文件模块 Schemas
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class FileOut(BaseModel):
    """文件记录对外模型（不含存储内部信息）。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    key: str
    size: int
    content_type: str
    storage_backend: str
    etag: str
    is_public: bool
    owner_id: int
    created_at: datetime
    modified_at: datetime


class FileStats(BaseModel):
    total_files: int
    total_bytes: int
    backend: str
    storage_healthy: bool
