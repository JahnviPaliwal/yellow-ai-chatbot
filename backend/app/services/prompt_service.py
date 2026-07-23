"""Prompt Business Logic Service."""

from sqlalchemy.orm import Session
from app.models.prompt import Prompt
from app.repositories.prompt_repository import PromptRepository
from app.services.project_service import ProjectService
from app.schemas.prompt import PromptUpdate


class PromptService:
    """Service handling project system prompt operations."""

    def __init__(self, db: Session) -> None:
        self.prompt_repo = PromptRepository(db)
        self.project_service = ProjectService(db)

    def get_prompt(self, project_id: int, user_id: int) -> Prompt:
        """Get project prompt ensuring ownership."""
        self.project_service.get_project_with_auth(project_id, user_id)
        prompt = self.prompt_repo.get_by_project_id(project_id)
        if not prompt:
            # Upsert default empty prompt if missing
            prompt = self.prompt_repo.upsert(project_id=project_id, content="")
        return prompt

    def update_prompt(self, project_id: int, user_id: int, prompt_in: PromptUpdate) -> Prompt:
        """Update system prompt for a project after authorization check."""
        self.project_service.get_project_with_auth(project_id, user_id)
        return self.prompt_repo.upsert(project_id=project_id, content=prompt_in.content)
