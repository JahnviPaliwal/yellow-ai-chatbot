"""Memories API Endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.memory import MemoryResponse, MemoryCreate
from app.services.memory_service import MemoryService

router = APIRouter(tags=["Memories"])


@router.get("/memories", response_model=APIResponse[List[MemoryResponse]])
def list_memories(
    conversation_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> APIResponse[List[MemoryResponse]]:
    """List saved memories for the authenticated user, optionally filtered by conversation thread."""
    service = MemoryService(db)
    memories = service.list_memories(current_user.id, conversation_id)
    
    mem_list = []
    for m in memories:
        resp = MemoryResponse.model_validate(m)
        resp.conversation_title = m.conversation.title if m.conversation else "General Chat"
        mem_list.append(resp)
        
    return APIResponse(
        success=True,
        message="User memories retrieved successfully.",
        data=mem_list
    )


@router.post("/memories", response_model=APIResponse[MemoryResponse], status_code=status.HTTP_201_CREATED)
def create_memory(
    memory_in: MemoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> APIResponse[MemoryResponse]:
    """Manually add a fact/memory to a specific conversation thread."""
    service = MemoryService(db)
    memory = service.create_memory(current_user.id, memory_in.conversation_id, memory_in.content)
    resp = MemoryResponse.model_validate(memory)
    resp.conversation_title = memory.conversation.title if memory.conversation else "General Chat"
    return APIResponse(
        success=True,
        message="Memory saved successfully.",
        data=resp
    )


@router.delete("/memories/{memory_id}", response_model=APIResponse[None])
def delete_memory(
    memory_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> APIResponse[None]:
    """Delete a specific saved memory by ID."""
    service = MemoryService(db)
    service.delete_memory(memory_id, current_user.id)
    return APIResponse(
        success=True,
        message="Memory deleted successfully.",
        data=None
    )
