"""Memory Service for CRUD operations on User Memories."""

from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.memory import Memory
from app.schemas.memory import MemoryCreate
from app.core.exceptions import NotFoundException, ForbiddenException


class MemoryService:
    """Service handling saving, listing, and deleting user memories."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def list_memories(self, user_id: int, conversation_id: Optional[int] = None) -> List[Memory]:
        """List memories saved by user, optionally filtered by conversation thread."""
        query = self.db.query(Memory).filter(Memory.user_id == user_id)
        if conversation_id is not None:
            query = query.filter(Memory.conversation_id == conversation_id)
        return query.order_by(Memory.created_at.desc()).all()

    def create_memory(self, user_id: int, conversation_id: int, content: str) -> Memory:
        """Create a new conversation-scoped memory."""
        memory = Memory(user_id=user_id, conversation_id=conversation_id, content=content)
        self.db.add(memory)
        self.db.commit()
        self.db.refresh(memory)
        return memory

    def delete_memory(self, memory_id: int, user_id: int) -> None:
        """Delete a saved memory after authorizing ownership."""
        memory = self.db.query(Memory).filter(Memory.id == memory_id).first()
        if not memory:
            raise NotFoundException("Memory")
        if memory.user_id != user_id:
            raise ForbiddenException("You do not have permission to delete this memory.")
        self.db.delete(memory)
        self.db.commit()
