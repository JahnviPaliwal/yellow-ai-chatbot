# Yellow.ai Enterprise AI Platform

An enterprise-grade, multi-tenant AI chat platform built with FastAPI, Next.js 15, PostgreSQL, and a provider-agnostic LLM layer (supporting OpenAI and Groq with automatic provider fallback). Features multi-project isolation, custom system prompt management per project, persistent conversation history, file uploads with provider file ID integration, and strict owner-based authorization boundaries.

---

## Table of Contents

1. [High-Level Architecture & Design Explanation](#high-level-architecture--design-explanation)
2. [Technology Stack](#technology-stack)
3. [Provider-Agnostic LLM Layer & Fallback](#provider-agnostic-llm-layer--fallback)
4. [Project Directory Structure](#project-directory-structure)
5. [Database Schema](#database-schema)
6. [Environment Variables](#environment-variables)
7. [Local Run Instructions](#local-run-instructions)
8. [24/7 Always-Free Deployment Guide (No Sleep)](#247-always-free-deployment-guide-no-sleep)
9. [Alembic Migrations](#alembic-migrations)
10. [API Documentation](#api-documentation)
11. [Verification & Testing](#verification--testing)

---

## High-Level Architecture & Design Explanation

```text
                        Client (Next.js 15 on Vercel)
                                      │
                            HTTPS + Bearer JWT Token
                                      │
                            FastAPI Backend (Render)
                                      │
            ┌──────────────┬──────────┼─────────────┬──────────────┐
            │              │          │             │              │
        Auth Service   User Service Project Service Chat Service File Service
            │              │          │             │              │
            └──────────────┴──────────┼─────────────┴──────────────┘
                                      │
                         PostgreSQL DB (Neon/Supabase)
                                      │
                  Provider-Agnostic LLM Layer (OpenAI + Groq)
```

### Architecture Key Principles
- **Decoupled API-First Architecture**: Backend exposes REST APIs with FastAPI; frontend is built on Next.js 15 with App Router and Zustand state management.
- **Provider-Agnostic AI Pipeline**: Supports OpenAI (`gpt-4o-mini`) and Groq (`llama-3.3-70b-versatile`). Automatic failover to Groq if OpenAI API fails or key is unconfigured.
- **Strict Owner-Based Authorization**: Every request validates JWT claims against project user ID, returning `403 Forbidden` for unauthorized access.

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Dark Mode, Glassmorphism, Micro-animations)
- **State Management**: Zustand
- **Data Fetching**: React Query (`@tanstack/react-query`)
- **HTTP Client**: Axios (with Bearer Token Interceptor)
- **Form Handling & Validation**: React Hook Form + Zod

### Backend
- **Framework**: FastAPI
- **Database ORM**: SQLAlchemy 2.0 (Async/Sync pooling)
- **Migrations**: Alembic
- **Database**: PostgreSQL (with SQLite zero-config fallback)
- **Authentication**: JWT (JSON Web Tokens) with `PyJWT`
- **Password Security**: Passlib (Bcrypt) / SHA-256 PBKDF2
- **Validation**: Pydantic v2
- **AI Providers**: OpenAI and Groq with automatic fallback

---

## Provider-Agnostic LLM Layer & Fallback

- **Supported Providers**: OpenAI and Groq.
- **Provider Configuration**: Set `LLM_PROVIDER=openai` or `LLM_PROVIDER=groq`.
- **Automatic Fallback Strategy**:
  - If `LLM_PROVIDER=openai` is selected and the OpenAI API key is missing, invalid, out of quota, or experiences a provider outage, the system automatically falls back to **Groq**.
  - If `LLM_PROVIDER=groq` is selected, Groq is invoked directly.

---

## Project Directory Structure

```text
Yellow.ai/
├── backend/
│   ├── alembic/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── database/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   ├── services/
│   │   │   └── llm/
│   │   │       ├── base.py
│   │   │       ├── openai_provider.py
│   │   │       └── groq_provider.py
│   │   └── main.py
│   ├── alembic.ini
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── services/
│   │   ├── store/
│   │   └── types/
│   └── package.json
└── README.md
```

---

## Database Schema

### Table Overview
- `users`: User registration, email, bcrypt password hash.
- `projects`: Isolated workspace owned by user (`user_id` FK).
- `prompts`: One system prompt per project (`project_id` UNIQUE FK).
- `conversations`: Conversation threads (`project_id` FK).
- `messages`: Chronological chat messages (`conversation_id` FK, `role` system/user/assistant).
- `files`: File metadata and OpenAI `provider_file_id` (`project_id` FK).

---

## Environment Variables

Create `.env` inside `backend/`:

```env
PROJECT_NAME="Yellow.ai Enterprise Platform"
API_V1_STR=""
SECRET_KEY="super-secret-key-change-this-in-production-environments!"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Database Configuration (PostgreSQL by default)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/yellow_ai_db"

# AI Provider Configuration
LLM_PROVIDER="openai" # "openai" or "groq"
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"
GROQ_API_KEY="gsk_..."
GROQ_MODEL="llama-3.3-70b-versatile"
```

---

## Local Run Instructions

### 1. Run Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Backend API will run at `http://127.0.0.1:8000`. Swagger API docs at `http://127.0.0.1:8000/docs`.

### 2. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend app will run at `http://localhost:3000`.

---

## 24/7 Always-Free Deployment Guide (No Sleep, $0/month)

Deploy the entire stack for **$0/month** with **24/7 uptime and zero instance sleeping**:

| Component | Free Host | Strategy to Prevent Sleeping |
|---|---|---|
| **Frontend** | **Vercel** | Free forever, 24/7 uptime, 0 sleep |
| **Database** | **Neon.tech** / **Supabase** | Free Serverless PostgreSQL, 24/7 uptime |
| **Backend** | **Render.com** | Free Web Service + **UptimeRobot** 5-min pings (keeps it awake 24/7) |

### Step 1: Database (Neon.tech)
1. Sign up at [Neon.tech](https://neon.tech) and create a free project.
2. Copy the PostgreSQL connection URI string.

### Step 2: Backend (Render.com + UptimeRobot)
1. Connect repository on [Render.com](https://render.com) and create **Web Service** for `backend/`.
2. Build Command: `pip install -r requirements.txt`
3. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set Environment Variables (`DATABASE_URL`, `LLM_PROVIDER`, `OPENAI_API_KEY`, `GROQ_API_KEY`, `SECRET_KEY`).
5. **Keep-Alive (Prevent Sleeping)**: Set up a free monitor on [UptimeRobot.com](https://uptimerobot.com) to ping `https://your-backend.onrender.com/` every 5 minutes.

### Step 3: Frontend (Vercel)
1. Deploy `frontend/` on [Vercel.com](https://vercel.com).
2. Set Environment Variable: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`.

---

## Verification & Testing

Run automated backend tests:

```bash
cd backend
pytest -v
```
