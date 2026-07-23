"""Project Business Logic Service."""

from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.exceptions import NotFoundException, ForbiddenException
from app.models.project import Project
from app.repositories.project_repository import ProjectRepository
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectService:
    """Service handling Project lifecycle and strict user ownership authorization."""

    def __init__(self, db: Session) -> None:
        self.project_repo = ProjectRepository(db)

    def get_user_projects(self, user_id: int) -> List[Project]:
        """List all projects created by user."""
        return self.project_repo.get_by_user_id(user_id)

    def create_project(self, user_id: int, project_in: ProjectCreate) -> Project:
        """Create a new project for user."""
        return self.project_repo.create(
            user_id=user_id,
            name=project_in.name,
            description=project_in.description
        )

    def get_project_with_auth(self, project_id: int, user_id: int) -> Project:
        """Fetch project and verify strict owner authorization."""
        project = self.project_repo.get_by_id(project_id)
        if not project:
            raise NotFoundException("Project")
        if project.user_id != user_id:
            raise ForbiddenException("You do not have permission to access this project.")
        return project

    def update_project(self, project_id: int, user_id: int, project_in: ProjectUpdate) -> Project:
        """Update existing project following owner authorization."""
        project = self.get_project_with_auth(project_id, user_id)
        return self.project_repo.update(
            project=project,
            name=project_in.name,
            description=project_in.description
        )

    def delete_project(self, project_id: int, user_id: int) -> None:
        """Delete project following owner authorization."""
        project = self.get_project_with_auth(project_id, user_id)
        self.project_repo.delete(project)
