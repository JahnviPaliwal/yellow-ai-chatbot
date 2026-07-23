"""Standard API Response Envelope Schemas."""

from typing import Generic, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """Unified API response structure."""

    success: bool
    message: str
    data: Optional[T] = None
