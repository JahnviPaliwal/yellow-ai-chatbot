"""User Data Access Repository."""

from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User


class UserRepository:
    """Repository handling User database operations."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, user_id: int) -> Optional[User]:
        """Fetch user by primary key ID."""
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> Optional[User]:
        """Fetch user by unique email address."""
        return self.db.query(User).filter(User.email == email).first()

    def create(self, name: str, email: str, password_hash: str) -> User:
        """Create and persist a new user record."""
        user = User(
            name=name,
            email=email,
            password_hash=password_hash
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
