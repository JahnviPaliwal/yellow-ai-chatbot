"""File Data Access Repository."""

from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.file import FileModel


class FileRepository:
    """Repository handling File database metadata operations."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, file_id: int) -> Optional[FileModel]:
        """Fetch file metadata by primary key ID."""
        return self.db.query(FileModel).filter(FileModel.id == file_id).first()

    def get_by_project_id(self, project_id: int) -> List[FileModel]:
        """Fetch all file records attached to a project."""
        return (
            self.db.query(FileModel)
            .filter(FileModel.project_id == project_id)
            .order_by(FileModel.uploaded_at.desc())
            .all()
        )

    def get_by_conversation_id(self, conversation_id: int) -> List[FileModel]:
        """Fetch all file records attached to a specific conversation."""
        return (
            self.db.query(FileModel)
            .filter(FileModel.conversation_id == conversation_id)
            .order_by(FileModel.uploaded_at.desc())
            .all()
        )

    def get_daily_upload_count(self, user_id: int) -> int:
        """Count files uploaded by user since 00:00:00 UTC of current day."""
        now = datetime.now(timezone.utc)
        start_of_today = datetime(now.year, now.month, now.day, 0, 0, 0, tzinfo=timezone.utc)
        
        return (
            self.db.query(func.count(FileModel.id))
            .filter(FileModel.user_id == user_id, FileModel.uploaded_at >= start_of_today)
            .scalar() or 0
        )

    def create(
        self,
        user_id: int,
        filename: str,
        provider_file_id: str,
        project_id: Optional[int] = None,
        conversation_id: Optional[int] = None,
        file_type: Optional[str] = None
    ) -> FileModel:
        """Create a new file metadata record."""
        file_record = FileModel(
            user_id=user_id,
            project_id=project_id,
            conversation_id=conversation_id,
            filename=filename,
            provider_file_id=provider_file_id,
            file_type=file_type
        )
        self.db.add(file_record)
        self.db.commit()
        self.db.refresh(file_record)
        return file_record
