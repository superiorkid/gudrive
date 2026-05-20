# KandangData

KandangData is a cloud storage application inspired by Google Drive, built with a modern full-stack architecture using FastAPI, PostgreSQL, Redis, Celery, and Next.js.

The project focuses on scalable file management, chunked uploads, background processing, caching strategies, and production-style backend architecture.

---

## Features

### Authentication
- JWT Authentication
- Secure HTTP-only cookies
- Authentication middleware & protected routes
- Refresh token support is planned but not implemented yet

### File & Folder Management
- Create folders
- Rename files/folders
- Recursive soft delete
- Restore deleted items
- Starred files/folders
- Breadcrumb navigation
- Duplicate filename prevention in the same folder

### Upload System
- Chunked uploads
- Upload session tracking
- Upload offset validation
- Large file support
- Upload progress caching using Redis
- File finalization system
- Upload integrity validation

### File Preview System
- Background preview generation using Celery
- Image thumbnail generation
- PDF thumbnail generation
- Async preview processing
- Preview status tracking

### Search & Filtering
- PostgreSQL full-text search
- File type filtering
- Modified date filtering
- Sorting system
- Folder grouping
- Starred scope filtering

### Performance & Caching
- Redis cache layer
- Cache-aside strategy
- Smart cache invalidation
- Folder listing cache
- Node detail cache
- Upload progress cache
- Search cache invalidation

### Frontend
- Next.js App Router
- Tanstack Query
- Nuqs state management
- React Hook Form + Zod
- TailwindCSS
- Responsive UI

---

## Tech Stack

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL
- Redis
- Celery
- Pillow
- pypdfium2

### Frontend
- Next.js
- TypeScript
- TailwindCSS
- Tanstack Query
- React Hook Form
- Zod

### Infrastructure
- Docker
- Redis
- Celery Workers

---

## Current Architecture Highlights

### Chunk Upload Architecture
The upload system is designed similarly to resumable upload systems used by cloud storage providers.

Flow:
1. Initialize upload session
2. Upload file chunks
3. Track upload offset
4. Finalize upload
5. Background preview generation

### Caching Strategy
The application uses Redis with cache invalidation patterns:
- Folder listing cache
- Node detail cache
- Upload progress cache
- Search cache

Caches are invalidated automatically after:
- Upload completion
- Rename operations
- Delete/restore actions
- Preview generation
- Star/unstar actions

### Background Jobs
Celery is used for:
- Image thumbnail generation
- PDF preview generation
- Async file processing

---

## Current Limitations / Missing Features

### Upload UX
Currently uploads only support drag & drop.

Known issues:
- Some drag & drop edge cases are still unstable
- Upload flow still needs refinement
- Upload error handling can be improved

Planned improvements:
- Upload via file picker/dropdown
- Better upload retry handling
- Pause/resume upload support
- Improved upload progress UX

### Missing Features
- Permanent delete
- Move file/folder operation
- File sharing system
- Public share links
- Shared folders
- Shared-with-me page
- Refresh token authentication flow

---

## Running Locally

### Requirements
Make sure these are installed on your machine:
- Python 3.13+
- Node.js
- Docker
- uv

---

## Infrastructure Setup

This project uses Docker only for infrastructure services:
- PostgreSQL
- Redis

Start containers:

```bash
docker compose up -d
```

## Backend Setup

### Install Dependencies

Using uv:

```bash
uv sync
```

### Active Virtual Environment

Linux/MacOS

```bash
source .venv/bin/activate
```

Windows

```bash
.venv\Scripts\activate
```

### Running Database Migrations

Using alembic

```bash
alembic upgrade head
```

### Start FastAPI Server

```bash
uv run fastapi dev
```

### Start Celery worker

```bash
celery -A celery_app.celery_app worker --loglevel=info --pool=prefork --concurrency=4 --hostname=worker1
```

## Frontend Setup

### Install Dependencies
```bash
pnpm install
```

### Start Development Server

```bash
pnpm run dev
```

## Environment Variable

### Backend

```bash
APP_ENV=dev # "dev" | "prod"

DATABASE_URL=postgresql+asyncpg://<username>:<password>@<hostname>:<port>/<dbname>

SECRET_KEY=very-very-secret
ALGORITHM=HS256

ACCESS_TOKEN_EXPIRE_MINUTES=
ACCESS_TOKEN_KEY=

UPLOAD_TMP_DIR="./tmp"
UPLOAD_FINAL_DIR="./file-upload-storage"
REDIS_URL=redis://localhost:6380

```

### Frontend

```bash
BASE_API_URL="http://localhost:8000/api"
NEXT_PUBLIC_BASE_API_URL="http://localhost:8000/api"

NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"

```
