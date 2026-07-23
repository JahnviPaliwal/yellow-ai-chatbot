"""Prompts API Endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.prompt import PromptUpdate, PromptResponse
from app.services.prompt_service import PromptService

router = APIRouter(prefix="/projects", tags=["Prompts"])


@router.get("/{project_id}/prompt", response_model=APIResponse[PromptResponse])
def get_prompt(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> APIResponse[PromptResponse]:
    """Retrieve system prompt for a project."""
    service = PromptService(db)
    prompt = service.get_prompt(project_id, current_user.id)
    return APIResponse(
        success=True,
        message="Project prompt retrieved.",
        data=PromptResponse.model_validate(prompt)
    )


@router.put("/{project_id}/prompt", response_model=APIResponse[PromptResponse])
def update_prompt(
    project_id: int,
    prompt_in: PromptUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> APIResponse[PromptResponse]:
    """Update system prompt instructions for a project."""
    service = PromptService(db)
    prompt = service.update_prompt(project_id, current_user.id, prompt_in)
    return APIResponse(
        success=True,
        message="Project prompt updated successfully.",
        data=PromptResponse.model_validate(prompt)
    )
