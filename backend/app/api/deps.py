"""API Dependencies for Authentication and Database Context."""

from typing import Generator
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.exceptions import UnauthorizedException
from app.core.security import decode_access_token
from app.database.session import get_db
from app.models.user import User
from app.services.auth_service import AuthService

security_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Validate Bearer JWT token and inject current authenticated User instance."""
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise UnauthorizedException("Could not validate credentials.")

    try:
        user_id = int(payload["sub"])
    except (ValueError, TypeError):
        raise UnauthorizedException("Invalid token subject.")

    auth_service = AuthService(db)
    return auth_service.get_current_user(user_id)
