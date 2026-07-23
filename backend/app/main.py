"""Main FastAPI Application Entrypoint."""

import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.core.config import settings
from app.core.exceptions import BaseAppException
from app.database.session import Base, engine
from app.api import auth, projects, prompts, conversations, chat, files, memories

logger = logging.getLogger(__name__)


def fix_sqlite_constraints_and_columns():
    """Migrate SQLite schema automatically or drop tables if legacy NOT NULL constraints exist."""
    if engine.url.drivername == "sqlite":
        try:
            inspector = inspect(engine)
            tables = inspector.get_table_names()

            if "conversations" in tables:
                with engine.connect() as conn:
                    table_info = conn.execute(text("PRAGMA table_info(conversations);")).fetchall()
                    proj_col = next((r for r in table_info if r[1] == "project_id"), None)
                    pin_col = next((r for r in table_info if r[1] == "is_pinned"), None)
                    
                    # If project_id is NOT NULL or is_pinned is missing, drop all tables to rebuild correct constraints
                    if (proj_col and proj_col[3] == 1) or (not pin_col):
                        logger.warning("Legacy conversations constraints or columns detected. Dropping old tables to recreate clean schema.")
                        conn.close()
                        Base.metadata.drop_all(bind=engine)
                        return

            if "memories" in tables:
                with engine.connect() as conn:
                    table_info = conn.execute(text("PRAGMA table_info(memories);")).fetchall()
                    conv_col = next((r for r in table_info if r[1] == "conversation_id"), None)
                    if not conv_col:
                        logger.warning("Legacy memories schema without conversation_id detected. Dropping old tables to recreate clean schema.")
                        conn.close()
                        Base.metadata.drop_all(bind=engine)
                        return
        except Exception as exc:
            logger.warning(f"SQLite migration check info: {exc}")


fix_sqlite_constraints_and_columns()
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise Multi-Tenant AI Platform API Backend",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(BaseAppException)
async def custom_app_exception_handler(request: Request, exc: BaseAppException) -> JSONResponse:
    """Handle custom application domain exceptions with standardized envelope."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.message,
            "data": None
        },
        headers=exc.headers
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Fallback handler for unhandled internal server errors."""
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "An unexpected internal error occurred.",
            "data": None
        }
    )


# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(projects.router, prefix=settings.API_V1_STR)
app.include_router(prompts.router, prefix=settings.API_V1_STR)
app.include_router(conversations.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)
app.include_router(files.router, prefix=settings.API_V1_STR)
app.include_router(memories.router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health"])
def health_check() -> dict:
    """Root health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME
    }
