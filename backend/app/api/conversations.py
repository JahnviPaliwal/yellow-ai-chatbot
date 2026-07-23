"""Conversations API Endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.chat import ConversationCreate, ConversationResponse, ConversationDetailResponse
from app.services.chat_service import ChatService

router = APIRouter(tags=["Conversations"])


@router.get("/conversations", response_model=APIResponse[List[ConversationResponse]])
def list_user_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> APIResponse[List[ConversationResponse]]:
    """List all user conversations across projects and standalone chats."""
    service = ChatService(db)
    conv_list = service.list_user_conversations(current_user.id)
    return APIResponse(
        success=True,
        message="User conversations retrieved successfully.",
        data=conv_list
    )


@router.get("/projects/{project_id}/conversations", response_model=APIResponse[List[ConversationResponse]])
def list_project_conversations(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> APIResponse[List[ConversationResponse]]:
    """List all conversations belonging to a specific project."""
    service = ChatService(db)
    conversations = service.list_project_conversations(project_id, current_user.id)
    conv_list = [ConversationResponse.model_validate(c) for c in conversations]
    return APIResponse(
        success=True,
        message="Project conversations retrieved successfully.",
        data=conv_list
    )


@router.post("/conversations", response_model=APIResponse[ConversationResponse], status_code=status.HTTP_201_CREATED)
def create_conversation(
    conv_in: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> APIResponse[ConversationResponse]:
    """Create a new conversation (standalone or project-linked)."""
    service = ChatService(db)
    title = conv_in.title if conv_in.title else "New Conversation"
    conversation = service.create_conversation(current_user.id, title, conv_in.project_id)
    return APIResponse(
        success=True,
        message="Conversation created successfully.",
        data=conversation
    )


@router.get("/conversations/{conversation_id}", response_model=APIResponse[ConversationDetailResponse])
def get_conversation_detail(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> APIResponse[ConversationDetailResponse]:
    """Get full conversation detail including complete message history."""
    service = ChatService(db)
    detail = service.get_conversation_detail(conversation_id, current_user.id)
    return APIResponse(
        success=True,
        message="Conversation history retrieved.",
        data=detail
    )


@router.delete("/conversations/{conversation_id}", response_model=APIResponse[None])
def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> APIResponse[None]:
    """Delete a conversation thread completely."""
    service = ChatService(db)
    service.delete_conversation(conversation_id, current_user.id)
    return APIResponse(
        success=True,
        message="Conversation deleted successfully.",
        data=None
    )


@router.put("/conversations/{conversation_id}/pin", response_model=APIResponse[ConversationResponse])
def toggle_pin(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> APIResponse[ConversationResponse]:
    """Toggle the pinned state of a conversation."""
    service = ChatService(db)
    conversation = service.toggle_conversation_pin(conversation_id, current_user.id)
    return APIResponse(
        success=True,
        message="Conversation pin state toggled.",
        data=ConversationResponse.model_validate(conversation)
    )
