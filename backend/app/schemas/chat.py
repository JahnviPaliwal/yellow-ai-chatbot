"""Conversation and Chat Schemas."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class ConversationCreate(BaseModel):
    """Conversation creation payload schema."""

    project_id: Optional[int] = None
    title: Optional[str] = Field(default="New Conversation", max_length=255)


class MessageResponse(BaseModel):
    """Message item payload schema."""

    id: int
    conversation_id: int
    role: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationResponse(BaseModel):
    """Conversation detail payload schema."""

    id: int
    user_id: int
    project_id: Optional[int] = None
    project_name: Optional[str] = None
    title: str
    is_pinned: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationDetailResponse(ConversationResponse):
    """Conversation with full history."""

    messages: List[MessageResponse] = []


class ChatMessageSend(BaseModel):
    """Payload for POST /chat."""

    project_id: Optional[int] = None
    conversation_id: int
    message: str = Field(..., min_length=1)


class ChatResponse(BaseModel):
    """Response returned from POST /chat."""

    user_message: MessageResponse
    assistant_message: MessageResponse
