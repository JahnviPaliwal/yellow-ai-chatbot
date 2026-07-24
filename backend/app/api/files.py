"""File Upload & Management API Endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, UploadFile, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.file import FileResponse, FileUploadQuotaResponse
from app.services.file_service import FileService

router = APIRouter(tags=["Files"])


@router.get("/files/quota", response_model=APIResponse[FileUploadQuotaResponse])
def get_file_quota(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> APIResponse[FileUploadQuotaResponse]:
    """Check daily file upload usage and remaining quota (7 files/day)."""
    service = FileService(db)
    quota = service.get_user_daily_upload_quota(current_user.id)
    return APIResponse(
        success=True,
        message="Upload quota retrieved.",
        data=FileUploadQuotaResponse(**quota)
    )


@router.post("/files/upload", response_model=APIResponse[FileResponse], status_code=status.HTTP_201_CREATED)
def upload_file_universal(
    file: UploadFile = File(...),
    project_id: Optional[int] = Form(None),
    conversation_id: Optional[int] = Form(None),
    current_user: User = Depends(get_current_user),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
) -> APIResponse[FileResponse]:
    """Upload a file (standalone/in-chat or project-linked), enforcing 7 files/day limit."""
    service = FileService(db)
    file_record = service.upload_file(
        user_id=current_user.id,
        file=file,
        project_id=project_id,
        conversation_id=conversation_id,
        background_tasks=background_tasks
    )
    return APIResponse(
        success=True,
        message="File uploaded successfully.",
        data=FileResponse.model_validate(file_record)
    )


@router.post("/projects/{project_id}/files", response_model=APIResponse[FileResponse], status_code=status.HTTP_201_CREATED)
def upload_project_file(
    project_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
) -> APIResponse[FileResponse]:
    """Upload file for a specific project."""
    service = FileService(db)
    file_record = service.upload_file(
        user_id=current_user.id,
        file=file,
        project_id=project_id,
        background_tasks=background_tasks
    )
    return APIResponse(
        success=True,
        message="Project file uploaded successfully.",
        data=FileResponse.model_validate(file_record)
    )


@router.get("/projects/{project_id}/files", response_model=APIResponse[List[FileResponse]])
def get_project_files(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> APIResponse[List[FileResponse]]:
    """Retrieve all files associated with a project."""
    service = FileService(db)
    files = service.get_project_files(project_id, current_user.id)
    file_list = [FileResponse.model_validate(f) for f in files]
    return APIResponse(
        success=True,
        message="Project files retrieved.",
        data=file_list
    )
