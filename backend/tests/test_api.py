"""Automated API Integration Tests."""

import pytest
import io
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.session import Base, get_db
from app.main import app
from app.services.llm_service import LLMService

# Setup test SQLite database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_yellow_ai.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

# Create fresh schema for testing
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)


def test_auth_and_project_lifecycle():
    # 1. Register User 1
    reg1 = client.post("/auth/register", json={
        "name": "Alice Developer",
        "email": "alice@example.com",
        "password": "securepassword123"
    })
    assert reg1.status_code == 201
    assert reg1.json()["success"] is True

    # 2. Login User 1
    log1 = client.post("/auth/login", json={
        "email": "alice@example.com",
        "password": "securepassword123"
    })
    assert log1.status_code == 200
    token1 = log1.json()["data"]["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    # 3. Create Project for User 1
    proj1 = client.post("/projects", json={
        "name": "Alice Bot Project",
        "description": "Custom customer support bot"
    }, headers=headers1)
    assert proj1.status_code == 201
    proj1_id = proj1.json()["data"]["id"]

    # 4. Register User 2
    reg2 = client.post("/auth/register", json={
        "name": "Bob Intruder",
        "email": "bob@example.com",
        "password": "bobpassword123"
    })
    assert reg2.status_code == 201

    log2 = client.post("/auth/login", json={
        "email": "bob@example.com",
        "password": "bobpassword123"
    })
    token2 = log2.json()["data"]["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # 5. Verify Bob CANNOT access Alice's Project (Must return 403 Forbidden)
    forbidden_get = client.get(f"/projects/{proj1_id}", headers=headers2)
    assert forbidden_get.status_code == 403

    # 6. Alice sets System Prompt
    prompt_res = client.put(f"/projects/{proj1_id}/prompt", json={
        "content": "You are a polite customer support agent."
    }, headers=headers1)
    assert prompt_res.status_code == 200

    # 7. Alice creates a Project Conversation
    conv_res = client.post("/conversations", json={
        "title": "Onboarding Help",
        "project_id": proj1_id
    }, headers=headers1)
    assert conv_res.status_code == 201
    conv_id = conv_res.json()["data"]["id"]
    assert conv_res.json()["data"]["project_name"] == "Alice Bot Project"

    # 8. Alice sends Chat Message
    chat_res = client.post("/chat", json={
        "project_id": proj1_id,
        "conversation_id": conv_id,
        "message": "Hello! How can you help me?"
    }, headers=headers1)
    assert chat_res.status_code == 200


def test_standalone_chat_and_file_quota_limiter():
    # 1. Register & Login User
    client.post("/auth/register", json={
        "name": "Charlie Tester",
        "email": "charlie@example.com",
        "password": "charliepassword123"
    })
    log = client.post("/auth/login", json={
        "email": "charlie@example.com",
        "password": "charliepassword123"
    })
    token = log.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Standalone Conversation (No Project ID required)
    conv_res = client.post("/conversations", json={
        "title": "General Standalone Chat"
    }, headers=headers)
    assert conv_res.status_code == 201
    conv_data = conv_res.json()["data"]
    assert conv_data["project_id"] is None
    assert conv_data["project_name"] is None
    conv_id = conv_data["id"]

    # 3. Send Standalone Chat Message
    chat_res = client.post("/chat", json={
        "conversation_id": conv_id,
        "message": "Hi, I am chatting directly without a project!"
    }, headers=headers)
    assert chat_res.status_code == 200
    assert chat_res.json()["data"]["user_message"]["content"] == "Hi, I am chatting directly without a project!"

    # 4. Upload 7 files (reaching daily limit)
    for i in range(1, 8):
        file_bytes = io.BytesIO(f"test content {i}".encode("utf-8"))
        upload_res = client.post(
            "/files/upload",
            files={"file": (f"test_file_{i}.py", file_bytes, "text/plain")},
            data={"conversation_id": conv_id},
            headers=headers
        )
        assert upload_res.status_code == 201

    # 5. Check Quota API
    quota_res = client.get("/files/quota", headers=headers)
    assert quota_res.status_code == 200
    assert quota_res.json()["data"]["daily_uploaded_count"] == 7
    assert quota_res.json()["data"]["remaining_uploads"] == 0

    # 6. Attempt 8th upload (Must fail with 400 Bad Request due to daily limit)
    file_bytes_8 = io.BytesIO(b"over limit content")
    fail_res = client.post(
        "/files/upload",
        files={"file": ("test_file_8.pdf", file_bytes_8, "application/pdf")},
        data={"conversation_id": conv_id},
        headers=headers
    )
    assert fail_res.status_code == 400
    assert "Daily file upload limit reached" in fail_res.json()["message"]
