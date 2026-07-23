"""Projects API Endpoints."""

from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.services.project_service import ProjectService

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=APIResponse[List[ProjectResponse]])
def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> APIResponse[List[ProjectResponse]]:
    """List all projects owned by the authenticated user."""
    service = ProjectService(db)
    projects = service.get_user_projects(current_user.id)
    project_list = [ProjectResponse.model_validate(p) for p in projects]
    return APIResponse(
        success=True,
        message="Projects retrieved successfully.",
        data=project_list
    )


@router.post("", response_model=APIResponse[ProjectResponse], status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> APIResponse[ProjectResponse]:
    """Create a new project for the authenticated user."""
    service = ProjectService(db)
    project = service.create_project(current_user.id, project_in)
    return APIResponse(
        success=True,
        message="Project created successfully.",
        data=ProjectResponse.model_validate(project)
    )


@router.get("/{project_id}", response_model=APIResponse[ProjectResponse])
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> APIResponse[ProjectResponse]:
    """Retrieve details of a specific project."""
    service = ProjectService(db)
    project = service.get_project_with_auth(project_id, current_user.id)
    return APIResponse(
        success=True,
        message="Project details retrieved.",
        data=ProjectResponse.model_validate(project)
    )


@router.put("/{project_id}", response_model=APIResponse[ProjectResponse])
def update_project(
    project_id: int,
    project_in: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> APIResponse[ProjectResponse]:
    """Update project title or description."""
    service = ProjectService(db)
    project = service.update_project(project_id, current_user.id, project_in)
    return APIResponse(
        success=True,
        message="Project updated successfully.",
        data=ProjectResponse.model_validate(project)
    )


@router.delete("/{project_id}", response_model=APIResponse[None])
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> APIResponse[None]:
    """Delete a project and all associated resources."""
    service = ProjectService(db)
    service.delete_project(project_id, current_user.id)
    return APIResponse(
        success=True,
        message="Project deleted successfully.",
        data=None
    )
