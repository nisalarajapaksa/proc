# Backend - FastAPI

FastAPI backend for the Task Breakdown application.

## Setup

### 1. Create Virtual Environment

```bash
python -m venv venv
```

### 2. Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

**Important:** The requirements have been updated to remove PostgreSQL dependency (psycopg2-binary). We're using SQLite which is built into Python.

```bash
pip install -r requirements.txt
```

**Note:** If you encounter any installation issues, make sure you have the latest pip:
```bash
python -m pip install --upgrade pip
```

### 4. Configure Environment

Copy `.env.example` to `.env`:

**Windows:**
```bash
copy .env.example .env
```

**Mac/Linux:**
```bash
cp .env.example .env
```

**Required:** Get your Google Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey) and add it to `.env`:
```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-pro
DATABASE_URL=sqlite:///./tasks.db
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 5. Initialize Database

**Important:** Make sure your virtual environment is activated before running this command.

```bash
python -c "from app.core.database import Base, engine; from app.models import Task, MicroGoal; Base.metadata.create_all(bind=engine)"
```

This will create a `tasks.db` file in the backend directory with the necessary tables.

### 6. Run the Server

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## Database

This project uses **SQLite** for local development:
- Database file: `tasks.db`
- No installation required (built into Python)
- Easy to reset: just delete `tasks.db` and re-initialize

To switch to PostgreSQL in production, uncomment `psycopg2-binary` in `requirements.txt` and update `DATABASE_URL` in `.env`.

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### POST `/api/tasks/breakdown`
Break down user's tasks into micro-goals using AI

**Request:**
```json
{
  "tasks_text": "Write report, respond to emails, prepare presentation"
}
```

**Response:**
```json
{
  "task_id": 1,
  "micro_goals": [
    {
      "id": 1,
      "title": "Outline report structure",
      "description": "Create headings and main sections",
      "estimated_minutes": 15,
      "order": 0,
      "completed": false
    }
  ],
  "total_estimated_minutes": 120
}
```

### POST `/api/tasks/confirm`
Confirm and save edited micro-goals

### GET `/api/tasks/`
Get all tasks

### GET `/api/tasks/{task_id}`
Get specific task by ID

### DELETE `/api/tasks/{task_id}`
Delete a task

## Project Structure

```
backend/
├── app/
│   ├── api/           # API routes
│   │   └── tasks.py   # Task endpoints
│   ├── core/          # Core functionality
│   │   ├── config.py  # Settings
│   │   └── database.py # DB setup
│   ├── models/        # SQLAlchemy models
│   │   └── task.py
│   ├── schemas/       # Pydantic schemas
│   │   └── task.py
│   ├── services/      # Business logic
│   │   └── llm_service.py # Google Gemini integration
│   └── main.py        # FastAPI app
├── requirements.txt
└── .env
```

## Development

### Code Formatting
```bash
black app/
```

### Linting
```bash
flake8 app/
```

### Testing
```bash
pytest
```
