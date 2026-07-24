# Yellow.ai Enterprise AI Platform: Setup & Execution Instructions

This guide provides instructions to run the Yellow.ai Enterprise AI Platform locally and to deploy it for production.

---

## Environment Variables

To configure the application, create a `.env` file inside the `backend/` directory:

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

### 1. Run the Backend
Navigate to the `backend/` directory, install dependencies, and start the FastAPI server:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
* **API Endpoint**: `http://127.0.0.1:8000`
* **Swagger Interactive Docs**: `http://127.0.0.1:8000/docs`

### 2. Run the Frontend
Navigate to the `frontend/` directory, install dependencies, and run the development server:

```bash
cd frontend
npm install
npm run dev
```
* **App URL**: `http://localhost:3000`

---

## Verification & Testing

To run the automated backend test suite:

```bash
cd backend
pytest -v
```


