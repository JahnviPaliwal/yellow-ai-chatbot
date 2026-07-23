"""Database Session Manager and Engine Initialization with Automatic Fallback."""

import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    """Base declarative class for all SQLAlchemy ORM models."""
    pass


def create_db_engine():
    """Initialize database engine with fallback to SQLite if PostgreSQL is unavailable."""
    db_url = settings.DATABASE_URL
    connect_args = {}

    if db_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
        return create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)

    try:
        engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)
        # Test connection
        with engine.connect():
            pass
        return engine
    except Exception as exc:
        logger.warning(f"PostgreSQL connection failed ({exc}). Falling back to local SQLite database.")
        sqlite_url = "sqlite:///./yellow_ai.db"
        return create_engine(sqlite_url, connect_args={"check_same_thread": False}, pool_pre_ping=True)


engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Provide a transactional database session context per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
