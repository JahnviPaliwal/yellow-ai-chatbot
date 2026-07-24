"""File Chunk Model ORM Definition."""

from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base

if TYPE_CHECKING:
    from app.models.file import FileModel


class FileChunkModel(Base):
    """Model representing parsed text chunks and their OpenAI embeddings."""

    __tablename__ = "file_chunks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    file_id: Mapped[int] = mapped_column(ForeignKey("files.id", ondelete="CASCADE"), index=True, nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[str] = mapped_column(Text, nullable=False)  # JSON-serialized array of 1536 floats

    file: Mapped["FileModel"] = relationship("FileModel")
