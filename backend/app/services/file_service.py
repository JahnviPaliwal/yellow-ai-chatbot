"""File Handling Business Logic Service with 7 Files/Day Rate Limiter."""

import uuid
import os
import json
import logging
from typing import List, Optional
from fastapi import UploadFile, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.exceptions import BadRequestException
from app.models.file import FileModel
from app.models.file_chunk import FileChunkModel
from app.database.session import SessionLocal
from app.repositories.file_repository import FileRepository
from app.services.project_service import ProjectService

logger = logging.getLogger(__name__)
DAILY_UPLOAD_LIMIT = 7


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 100) -> List[str]:
    """Split text into overlapping chunks."""
    chunks = []
    if not text:
        return chunks
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks


def process_file_chunks_task(file_id: int, file_bytes: bytes, filename: str) -> None:
    """FastAPI background task to decode text, chunk it, request OpenAI embeddings, and persist in db."""
    db = SessionLocal()
    try:
        try:
            content_str = file_bytes.decode('utf-8', errors='ignore')
        except Exception as exc:
            logger.error(f"Failed to decode file {filename} to string: {exc}")
            return

        chunks = chunk_text(content_str)
        if not chunks:
            logger.info(f"File {filename} has no parseable text chunks.")
            return

        # Fetch embeddings in a single batch call if OpenAI key is present
        embeddings = []
        if settings.OPENAI_API_KEY:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=settings.OPENAI_API_KEY)
                response = client.embeddings.create(
                    input=chunks,
                    model="text-embedding-3-small"
                )
                embeddings = [item.embedding for item in response.data]
            except Exception as exc:
                logger.error(f"Error fetching batch embeddings for {filename}: {exc}")

        for i, chunk in enumerate(chunks):
            embedding_vector = embeddings[i] if i < len(embeddings) else [0.0] * 1536
            chunk_db = FileChunkModel(
                file_id=file_id,
                chunk_index=i,
                content=chunk,
                embedding=json.dumps(embedding_vector)
            )
            db.add(chunk_db)
        db.commit()
        logger.info(f"Successfully processed and embedded {len(chunks)} chunks for file_id={file_id}.")
    except Exception as exc:
        logger.error(f"Exception in process_file_chunks_task for file_id={file_id}: {exc}")
        db.rollback()
    finally:
        db.close()


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
        conversation_id: Optional[int] = None,
        background_tasks: Optional[BackgroundTasks] = None
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

        # Read the file content bytes for background task chunking
        try:
            file.file.seek(0)
            file_bytes = file.file.read()
            file.file.seek(0)
        except Exception:
            file_bytes = b""

        # Generate provider file ID
        provider_file_id = f"file-{uuid.uuid4().hex[:16]}"

        if settings.OPENAI_API_KEY:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=settings.OPENAI_API_KEY)
                response = client.files.create(
                    file=(file.filename, file_bytes),
                    purpose="user_data"
                )
                provider_file_id = response.id
            except Exception:
                pass

        file_record = self.file_repo.create(
            user_id=user_id,
            project_id=project_id,
            conversation_id=conversation_id,
            filename=file.filename,
            provider_file_id=provider_file_id,
            file_type=file_type
        )

        if background_tasks and file_bytes:
            background_tasks.add_task(
                process_file_chunks_task,
                file_id=file_record.id,
                file_bytes=file_bytes,
                filename=file.filename
            )

        return file_record

    def get_project_files(self, project_id: int, user_id: int) -> List[FileModel]:
        """List all files belonging to project."""
        self.project_service.get_project_with_auth(project_id, user_id)
        return self.file_repo.get_by_project_id(project_id)

    def get_conversation_files(self, conversation_id: int) -> List[FileModel]:
        """List all files attached directly to a conversation."""
        return self.file_repo.get_by_conversation_id(conversation_id)
