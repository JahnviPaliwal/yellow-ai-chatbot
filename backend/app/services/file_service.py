"""File Handling Business Logic Service with 7 Files/Day Rate Limiter."""

import uuid
import os
from typing import List, Optional
from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.exceptions import BadRequestException
from app.models.file import FileModel
from app.repositories.file_repository import FileRepository
from app.services.project_service import ProjectService

DAILY_UPLOAD_LIMIT = 7


class FileService:
    """Service handling multi-format file uploads, OpenAI provider registration, and 7 files/day quota."""

    def __init__(self, db: Session) -> None:
        self.file_repo = FileRepository(db)
        self.project_service = ProjectService(db)

    def get_user_daily_upload_quota(self, user_id: int) -> dict:
        """Return daily upload usage and remaining quota."""
        count = self.file_repo.get_daily_upload_count(user_id)
        remaining = max(0, DAILY_UPLOAD_LIMIT - count)
        return {
            "daily_uploaded_count": count,
            "daily_limit": DAILY_UPLOAD_LIMIT,
            "remaining_uploads": remaining
        }

    def _determine_file_type(self, filename: str) -> str:
        """Detect file category based on extension."""
        ext = os.path.splitext(filename)[1].lower()
        if ext in ['.mp4', '.webm', '.mov', '.avi', '.mkv']:
            return 'video'
        elif ext in ['.mp3', '.wav', '.ogg', '.m4a', '.flac']:
            return 'audio'
        elif ext in ['.pdf', '.docx', '.pptx', '.xlsx', '.doc', '.ppt', '.xls']:
            return 'document'
        elif ext in ['.py', '.java', '.js', '.ts', '.cpp', '.c', '.h', '.html', '.css', '.json', '.md', '.csv', '.txt', '.sql', '.sh']:
            return 'code'
        return 'data'

    def upload_file(
        self,
        user_id: int,
        file: UploadFile,
        project_id: Optional[int] = None,
        conversation_id: Optional[int] = None
    ) -> FileModel:
        """Upload file, verify daily limit (7 max/day), assign provider file ID, and persist metadata."""
        if not file.filename:
            raise BadRequestException("Invalid or missing file name.")

        # Check 7 uploads per day limit
        daily_count = self.file_repo.get_daily_upload_count(user_id)
        if daily_count >= DAILY_UPLOAD_LIMIT:
            raise BadRequestException(
                f"Daily file upload limit reached ({DAILY_UPLOAD_LIMIT} files max per day). Please try again tomorrow."
            )

        # If project_id provided, verify ownership
        if project_id:
            self.project_service.get_project_with_auth(project_id, user_id)

        file_type = self._determine_file_type(file.filename)

        # Generate provider file ID
        provider_file_id = f"file-{uuid.uuid4().hex[:16]}"

        if settings.OPENAI_API_KEY:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=settings.OPENAI_API_KEY)
                file_content = file.file.read()
                response = client.files.create(
                    file=(file.filename, file_content),
                    purpose="user_data"
                )
                provider_file_id = response.id
            except Exception:
                pass

        return self.file_repo.create(
            user_id=user_id,
            project_id=project_id,
            conversation_id=conversation_id,
            filename=file.filename,
            provider_file_id=provider_file_id,
            file_type=file_type
        )

    def get_project_files(self, project_id: int, user_id: int) -> List[FileModel]:
        """List all files belonging to project."""
        self.project_service.get_project_with_auth(project_id, user_id)
        return self.file_repo.get_by_project_id(project_id)

    def get_conversation_files(self, conversation_id: int) -> List[FileModel]:
        """List all files attached directly to a conversation."""
        return self.file_repo.get_by_conversation_id(conversation_id)
