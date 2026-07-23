"""Prompt Pydantic Schemas."""

from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class PromptUpdate(BaseModel):
    """System prompt update payload validation schema."""

    content: str = Field(..., max_length=10000)


class PromptResponse(BaseModel):
    """Prompt response schema."""

    id: int
    project_id: int
    content: str
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
