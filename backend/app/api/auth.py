"""Authentication API Endpoints."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin, Token, UserResponse
from app.schemas.common import APIResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


class UserUpdate(BaseModel):
    """Schema for updating user details."""
    name: str


@router.post("/register", response_model=APIResponse[UserResponse], status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)) -> APIResponse[UserResponse]:
    """Register a new user account."""
    auth_service = AuthService(db)
    user = auth_service.register(user_in)
    return APIResponse(
        success=True,
        message="User registered successfully.",
        data=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=APIResponse[Token])
def login(login_in: UserLogin, db: Session = Depends(get_db)) -> APIResponse[Token]:
    """Authenticate credentials and return JWT token."""
    auth_service = AuthService(db)
    token = auth_service.login(login_in)
    return APIResponse(
        success=True,
        message="Login successful.",
        data=token
    )


@router.get("/me", response_model=APIResponse[UserResponse])
def get_me(current_user: User = Depends(get_current_user)) -> APIResponse[UserResponse]:
    """Retrieve active authenticated user profile."""
    return APIResponse(
        success=True,
        message="User profile retrieved.",
        data=UserResponse.model_validate(current_user)
    )


@router.put("/me", response_model=APIResponse[UserResponse])
def update_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> APIResponse[UserResponse]:
    """Update active user profile name."""
    current_user.name = user_update.name
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return APIResponse(
        success=True,
        message="User profile updated successfully.",
        data=UserResponse.model_validate(current_user)
    )
