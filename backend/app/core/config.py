"""Application Configuration Settings."""

import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """System configuration parameters loaded from environment variables."""

    PROJECT_NAME: str = "Yellow.ai Enterprise Platform"
    API_V1_STR: str = ""
    SECRET_KEY: str = "super-secret-key-change-this-in-production-environments!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    DATABASE_URL: str = "sqlite:///./yellow_ai.db"
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # AI Provider Configuration
    LLM_PROVIDER: str = "openai"  # "openai" or "groq"
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    MAX_UPLOAD_SIZE_BYTES: int = 10485760

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
