"""Conversation Data Access Repository."""

from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.conversation import Conversation
from app.models.project import Project


class ConversationRepository:
    """Repository handling Conversation database operations."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, conversation_id: int) -> Optional[Conversation]:
        """Fetch conversation by ID."""
        return self.db.query(Conversation).filter(Conversation.id == conversation_id).first()

    def get_by_user_id(self, user_id: int) -> List[Tuple[Conversation, Optional[str]]]:
        """Fetch all user conversations joined with optional Project name."""
        results = (
            self.db.query(Conversation, Project.name)
            .outerjoin(Project, Conversation.project_id == Project.id)
            .filter(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
            .all()
        )
        return results

    def get_by_project_id(self, project_id: int) -> List[Conversation]:
        """Fetch all conversations within a project."""
        return (
            self.db.query(Conversation)
            .filter(Conversation.project_id == project_id)
            .order_by(Conversation.updated_at.desc())
            .all()
        )

    def create(self, user_id: int, title: str, project_id: Optional[int] = None) -> Conversation:
        """Create new conversation thread (standalone or project-linked)."""
        conversation = Conversation(
            user_id=user_id,
            project_id=project_id,
            title=title
        )
        self.db.add(conversation)
        self.db.commit()
        self.db.refresh(conversation)
        return conversation
