"""Memory Pydantic Schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class MemoryBase(BaseModel):
    """Base memory schema."""
    content: str
    conversation_id: int


class MemoryCreate(MemoryBase):
    """Schema for memory creation."""
    pass


class MemoryResponse(MemoryBase):
    """Schema for memory response."""
    id: int
    user_id: int
    created_at: datetime
    conversation_title: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
