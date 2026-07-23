"""Prompt Data Access Repository."""

from typing import Optional
from sqlalchemy.orm import Session
from app.models.prompt import Prompt


class PromptRepository:
    """Repository handling System Prompt database operations."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_project_id(self, project_id: int) -> Optional[Prompt]:
        """Fetch active system prompt for a project."""
        return self.db.query(Prompt).filter(Prompt.project_id == project_id).first()

    def upsert(self, project_id: int, content: str) -> Prompt:
        """Create or update system prompt for a project."""
        prompt = self.get_by_project_id(project_id)
        if prompt:
            prompt.content = content
        else:
            prompt = Prompt(project_id=project_id, content=content)
            self.db.add(prompt)
        self.db.commit()
        self.db.refresh(prompt)
        return prompt
