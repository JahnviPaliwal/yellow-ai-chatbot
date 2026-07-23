"""Authentication and User Pydantic Schemas."""

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserCreate(BaseModel):
    """Registration request payload validation schema."""

    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)


class UserLogin(BaseModel):
    """Login request payload schema."""

    email: EmailStr
    password: str = Field(..., min_length=1)


class Token(BaseModel):
    """JWT Token response schema."""

    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """Public user profile data schema."""

    id: int
    name: str
    email: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
