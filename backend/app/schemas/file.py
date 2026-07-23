"""File Pydantic Schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class FileResponse(BaseModel):
    """File metadata response schema."""

    id: int
    user_id: int
    project_id: Optional[int] = None
    conversation_id: Optional[int] = None
    filename: str
    provider_file_id: str
    file_type: Optional[str] = None
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FileUploadQuotaResponse(BaseModel):
    """Daily upload quota status schema."""

    daily_uploaded_count: int
    daily_limit: int = 7
    remaining_uploads: int
