"""Project Data Access Repository."""

from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.project import Project


class ProjectRepository:
    """Repository handling Project database operations."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, project_id: int) -> Optional[Project]:
        """Fetch project by ID."""
        return self.db.query(Project).filter(Project.id == project_id).first()

    def get_by_user_id(self, user_id: int) -> List[Project]:
        """Fetch all projects owned by a specific user."""
        return (
            self.db.query(Project)
            .filter(Project.user_id == user_id)
            .order_by(Project.created_at.desc())
            .all()
        )

    def create(self, user_id: int, name: str, description: Optional[str] = None) -> Project:
        """Create a new project entry for a user."""
        project = Project(
            user_id=user_id,
            name=name,
            description=description
        )
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        return project

    def update(self, project: Project, name: Optional[str] = None, description: Optional[str] = None) -> Project:
        """Update fields of an existing project."""
        if name is not None:
            project.name = name
        if description is not None:
            project.description = description
        self.db.commit()
        self.db.refresh(project)
        return project

    def delete(self, project: Project) -> None:
        """Remove project and cascade delete associated resources."""
        self.db.delete(project)
        self.db.commit()
