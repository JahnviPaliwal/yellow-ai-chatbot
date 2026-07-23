"""Centralized Exception Handling and Custom Error Classes."""

from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class BaseAppException(HTTPException):
    """Base application exception returning standardized API error format."""

    def __init__(
        self,
        status_code: int,
        message: str,
        headers: Optional[Dict[str, str]] = None
    ) -> None:
        super().__init__(status_code=status_code, detail=message, headers=headers)
        self.message = message


class NotFoundException(BaseAppException):
    """Exception raised when a requested resource is missing."""

    def __init__(self, resource: str = "Resource") -> None:
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            message=f"{resource} not found."
        )


class UnauthorizedException(BaseAppException):
    """Exception raised when authentication credentials are invalid or missing."""

    def __init__(self, message: str = "Invalid authentication credentials.") -> None:
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message=message,
            headers={"WWW-Authenticate": "Bearer"}
        )


class ForbiddenException(BaseAppException):
    """Exception raised when user does not have permission to perform an action."""

    def __init__(self, message: str = "Access forbidden.") -> None:
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            message=message
        )


class BadRequestException(BaseAppException):
    """Exception raised for invalid user input or operations."""

    def __init__(self, message: str = "Invalid request payload.") -> None:
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            message=message
        )
