"""Unit Tests for RAG Chunking and Ingestion utilities."""

from app.services.file_service import chunk_text


def test_chunk_text_basic():
    """Verify that chunk_text splits a string correctly with given size and overlap."""
    text = "abcdefghijklmnopqrstuvwxyz"
    # Chunk size 10, overlap 2
    # Chunk 0: text[0:10] = "abcdefghij"
    # Chunk 1: text[8:18] = "ijklmnopqr"
    # Chunk 2: text[16:26] = "qrstuvwxyz"
    chunks = chunk_text(text, chunk_size=10, overlap=2)
    assert len(chunks) == 3
    assert chunks[0] == "abcdefghij"
    assert chunks[1] == "ijklmnopqr"
    assert chunks[2] == "qrstuvwxyz"


def test_chunk_text_empty():
    """Verify that chunking an empty string returns an empty list."""
    assert chunk_text("") == []
