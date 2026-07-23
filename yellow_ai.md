

# High-Level System Architecture

```text
                        Client (Next.js)
                              │
                    HTTPS + JWT Authentication
                              │
                     -----------------------
                     |                     |
             Authentication API      Application API
                     │                     │
                     └──────────┬──────────┘
                                │
                        FastAPI Backend
                                │
      ┌──────────────┬──────────┼─────────────┬──────────────┐
      │              │          │             │              │
  Auth Service   User Service Project Service Chat Service File Service
      │              │          │             │              │
      └──────────────┴──────────┼─────────────┴──────────────┘
                                │
                        PostgreSQL Database
                                │
                       OpenAI / OpenRouter API
```

---

# Technology Stack

## Frontend

* Next.js 15
* TypeScript
* Tailwind CSS
* React Query
* Zustand
* Axios
* React Hook Form + Zod

---

## Backend

* FastAPI
* SQLAlchemy 2.0
* Alembic
* PostgreSQL
* JWT Authentication
* Passlib (bcrypt)
* Pydantic v2

---

## AI

* OpenAI Responses API
* Provider abstraction (easy to switch to OpenRouter)

---

# Functional Modules

```
1. Authentication
2. User Management
3. Project Management
4. Prompt Management
5. Chat Engine
6. Conversation Storage
7. File Upload (Good to Have)
```

Each module is completely isolated.

---

# Folder Structure

## Backend

```text
backend/

app/

│

├── api/

│   ├── auth.py

│   ├── users.py

│   ├── projects.py

│   ├── prompts.py

│   ├── chat.py

│   └── files.py

│

├── models/

├── schemas/

├── services/

├── repositories/

├── database/

├── core/

├── middleware/

├── utils/

└── main.py
```

---

## Frontend

```text
frontend/

src/

│

├── app/

├── components/

├── features/

│     ├── auth/

│     ├── projects/

│     ├── prompts/

│     ├── chat/

│     └── files/

│

├── services/

├── hooks/

├── store/

├── types/

└── utils/
```

---

# Database Design

## Users

```text
User

-----

id

name

email

password_hash

created_at

updated_at
```

---

## Projects

Every project belongs to one user.

```text
Project

-------

id

user_id

name

description

created_at
```

---

## Prompts

One active system prompt per project.

```text
Prompt

------

id

project_id

content

updated_at
```

---

## Conversations

Each project can have multiple conversations.

```text
Conversation

------------

id

project_id

title

created_at
```

---

## Messages

Stores complete chat history.

```text
Message

-------

id

conversation_id

role

content

created_at
```

Roles

```
system

user

assistant
```

---

## Files (Optional)

```text
File

----

id

project_id

filename

provider_file_id

uploaded_at
```

---

# Authentication Flow

## Registration

```
User

↓

POST /auth/register

↓

Validate Input

↓

Check Existing Email

↓

Hash Password

↓

Create User

↓

Return Success
```

---

## Login

```
Email + Password

↓

Verify Password

↓

Generate JWT

↓

Return Access Token
```

JWT is sent with

```
Authorization

Bearer <token>
```

Every protected endpoint verifies it.

---

# Authorization

Every request checks ownership.

```
User

↓

JWT

↓

Project Owner?

↓

Yes → Continue

No → 403 Forbidden
```

No user can access another user's projects.

---

# API Design

## Authentication

```
POST /auth/register

POST /auth/login

GET /auth/me
```

---

## Projects

```
GET /projects

POST /projects

GET /projects/{id}

PUT /projects/{id}

DELETE /projects/{id}
```

---

## Prompt

```
GET /projects/{id}/prompt

PUT /projects/{id}/prompt
```

---

## Conversations

```
GET /projects/{id}/conversations

POST /projects/{id}/conversations

GET /conversations/{id}
```

---

## Chat

```
POST /chat
```

Payload

```json
{
  "project_id": 1,
  "conversation_id": 5,
  "message": "Hello"
}
```

---

## Files

```
POST /projects/{id}/files

GET /projects/{id}/files
```

---

# Chat Processing Pipeline

```
User Message

↓

Authenticate User

↓

Verify Project Ownership

↓

Load Project

↓

Load Prompt

↓

Load Conversation History

↓

Build Context

↓

Call OpenAI Responses API

↓

Receive Response

↓

Store Assistant Message

↓

Return Response
```

---

# Context Sent to LLM

Every request includes

```
System Prompt

+

Conversation History

+

Latest User Message
```

If files are uploaded

```
System Prompt

+

Files

+

Conversation History

+

Latest User Message
```

---

# Frontend Pages

## Authentication

```
Login

Register
```

---

## Dashboard

```
Projects

+

Create Project
```

---

## Project Page

Split layout

```
Left Panel

-----------

Project Details

System Prompt

Uploaded Files



Right Panel

------------

Conversation List

Chat Window

Message Input
```

---

# Chat Interface

```
Conversation History

↓

Assistant Messages

↓

User Messages

↓

Input Box

↓

Send Button
```

Responses appear in real time with loading states.

---

# File Upload Flow (Good to Have)

```
Choose File

↓

Validate

↓

Upload to Backend

↓

Upload to OpenAI Files API

↓

Store OpenAI File ID

↓

Associate File with Project
```

---

# Security

Passwords

* bcrypt hashing

Authentication

* JWT
* Token expiration
* Protected routes

Validation

* Pydantic
* Input sanitization

Authorization

* Project ownership checks

Database

* SQLAlchemy ORM (prevents SQL injection)

API

* Rate limiting
* CORS configuration
* Environment variables for secrets

---

# Error Handling

Standard API responses.

Example

```json
{
    "success": false,
    "message": "Project not found."
}
```

HTTP status codes:

* `200` – Success
* `201` – Resource created
* `400` – Invalid request
* `401` – Unauthorized
* `403` – Forbidden
* `404` – Resource not found
* `500` – Internal server error

---

# Scalability

The system is designed to support many users and projects concurrently by:

* Stateless backend using JWT authentication
* Normalized PostgreSQL schema with indexed foreign keys
* Modular services (auth, projects, prompts, chat, files)
* Connection pooling for database access
* Asynchronous calls to the LLM provider
* Separation of API, business logic, and data access layers

No architectural changes are required to horizontally scale the backend.

---

# Extensibility

Although the implementation stays within the assignment scope, the structure allows future additions without refactoring existing modules, such as:

* Multiple prompts per project
* Conversation search
* Streaming responses
* Analytics dashboard
* Multiple LLM providers
* Vector database integration
* Team collaboration
* Model configuration (temperature, max tokens)

---

# End-to-End User Journey

```text
1. User registers an account
          │
          ▼
2. User logs in and receives a JWT
          │
          ▼
3. User creates a new Project
          │
          ▼
4. User defines the Project's System Prompt
          │
          ▼
5. (Optional) User uploads supporting files
          │
          ▼
6. User starts a Conversation
          │
          ▼
7. User sends a message
          │
          ▼
8. Backend validates JWT and project ownership
          │
          ▼
9. Backend loads:
      • Project Prompt
      • Conversation History
      • Uploaded Files (if any)
          │
          ▼
10. Backend sends the complete context to the OpenAI Responses API
          │
          ▼
11. AI generates a response
          │
          ▼
12. Response is stored in the conversation history
          │
          ▼
13. Frontend displays the assistant's reply
          │
          ▼
14. User continues the conversation with full context preserved
```

