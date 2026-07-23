"""Authentication Service Logic."""

from sqlalchemy.orm import Session
from app.core.exceptions import BadRequestException, UnauthorizedException
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import UserCreate, UserLogin, Token


class AuthService:
    """Service class encapsulating authentication business logic."""

    def __init__(self, db: Session) -> None:
        self.user_repo = UserRepository(db)

    def register(self, user_in: UserCreate) -> User:
        """Register a new user after verifying email uniqueness."""
        existing_user = self.user_repo.get_by_email(user_in.email)
        if existing_user:
            raise BadRequestException("Email is already registered.")

        hashed_pwd = hash_password(user_in.password)
        return self.user_repo.create(
            name=user_in.name,
            email=user_in.email,
            password_hash=hashed_pwd
        )

    def login(self, login_in: UserLogin) -> Token:
        """Authenticate user credentials and issue a signed JWT access token."""
        user = self.user_repo.get_by_email(login_in.email)
        if not user or not verify_password(login_in.password, user.password_hash):
            raise UnauthorizedException("Invalid email or password.")

        token_str = create_access_token(subject=str(user.id))
        return Token(access_token=token_str, token_type="bearer")

    def get_current_user(self, user_id: int) -> User:
        """Retrieve user by ID or raise unauthorized error."""
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise UnauthorizedException("User account not found.")
        return user
