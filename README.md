# Yellow.ai Enterprise AI Platform — Setup & Execution Instructions

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

---

## 24/7 Always-Free Deployment Guide (No Sleep, $0/month)

Deploy the entire stack for **$0/month** with **24/7 uptime and zero instance sleeping**:

| Component | Free Host | Strategy to Prevent Sleeping |
|---|---|---|
| **Frontend** | **Vercel** | Free forever, 24/7 uptime, 0 sleep |
| **Database** | **Neon.tech** / **Supabase** | Free Serverless PostgreSQL, 24/7 uptime |
| **Backend** | **Render.com** | Free Web Service + **UptimeRobot** 5-min pings (keeps it awake 24/7) |

### Step 1: Database Setup (Neon.tech)
1. Sign up at [Neon.tech](https://neon.tech) and create a free project.
2. Copy the PostgreSQL connection URI string.

### Step 2: Backend Setup (Render.com + UptimeRobot)
1. Connect your repository on [Render.com](https://render.com) and create a **Web Service** for `backend/`.
2. Build Command: `pip install -r requirements.txt`
3. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set Environment Variables (`DATABASE_URL`, `LLM_PROVIDER`, `OPENAI_API_KEY`, `GROQ_API_KEY`, `SECRET_KEY`).
5. **Keep-Alive (Prevent Sleeping)**: Set up a free monitor on [UptimeRobot.com](https://uptimerobot.com) to ping `https://your-backend.onrender.com/` every 5 minutes to prevent the Render free tier from sleeping.

### Step 3: Frontend Setup (Vercel)
1. Deploy `frontend/` on [Vercel.com](https://vercel.com).
2. Set Environment Variable: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`.
