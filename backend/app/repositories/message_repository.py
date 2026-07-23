"""Message Data Access Repository."""

from typing import List
from sqlalchemy.orm import Session
from app.models.message import Message


class MessageRepository:
    """Repository handling Message database operations for full chat persistence."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_conversation_id(self, conversation_id: int) -> List[Message]:
        """Fetch all messages for a conversation ordered chronologically."""
        return (
            self.db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .all()
        )

    def create(self, conversation_id: int, role: str, content: str) -> Message:
        """Create and persist a new message turn."""
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message
