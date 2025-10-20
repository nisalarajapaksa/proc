# Task Breakdown & Anti-Procrastination App

A web application that helps you break down daily tasks into micro-goals using AI and track them to stop procrastination.

## Project Structure

```
/proc
├── /backend          # FastAPI Python backend
├── /frontend         # React + TypeScript + Vite frontend
├── setup.bat         # Automated setup script (Windows)
├── start-dev.bat     # Start both servers (Windows)
├── stop-dev.bat      # Stop both servers (Windows)
└── README.md
```

## Features (Phase 1)

- **Daily Task Input**: Enter all your tasks for the day in a single text input
- **AI-Powered Breakdown**: Google Gemini processes tasks and creates micro-goals with time estimates
- **Interactive Review**: View, edit, and confirm the generated micro-goals
- **Persistent Storage**: Save confirmed tasks to database for future tracking

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- React Query (API state management)
- Axios (HTTP client)

### Backend
- FastAPI (Python)
- Pydantic (data validation)
- SQLAlchemy (ORM)
- SQLite (database)
- Google Gemini API (LLM integration)

## Quick Start (Windows)

### Option 1: Automated Setup (Recommended)

1. **Run the setup script:**
   ```bash
   setup.bat
   ```
   This will install all dependencies for both backend and frontend.

   **Note:** The setup may take a few minutes. If you see any warnings about package versions, that's normal.

2. **Get Google Gemini API Key:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the generated API key

3. **Configure environment:**
   - Copy `backend\.env.example` to `backend\.env`:
     ```bash
     copy backend\.env.example backend\.env
     ```
   - Open `backend\.env` in a text editor and add your API key:
     ```env
     GEMINI_API_KEY=your_actual_api_key_here
     GEMINI_MODEL=gemini-pro
     DATABASE_URL=sqlite:///./tasks.db
     CORS_ORIGINS=http://localhost:5173,http://localhost:3000
     ```

4. **Initialize the database:**
   ```bash
   cd backend
   venv\Scripts\activate
   python -c "from app.core.database import Base, engine; from app.models import Task, MicroGoal; Base.metadata.create_all(bind=engine)"
   cd ..
   ```

   This creates a `tasks.db` file in the backend directory.

5. **Start the application:**
   ```bash
   start-dev.bat
   ```

   This will open two command prompt windows - one for backend, one for frontend.

6. **Access the app:**
   - **Frontend**: http://localhost:5173 (Main application)
   - **Backend API**: http://localhost:8000
   - **API Docs**: http://localhost:8000/docs (Interactive API documentation)

7. **Stop the servers:**
   - Run `stop-dev.bat` or close both CMD windows

### Option 2: Manual Setup

#### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

# Upgrade pip (recommended)
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env  # Windows
# cp .env.example .env  # Mac/Linux
# Edit .env and add your GEMINI_API_KEY

# Initialize database
python -c "from app.core.database import Base, engine; from app.models import Task, MicroGoal; Base.metadata.create_all(bind=engine)"

# Run server
uvicorn app.main:app --reload
```

**Database:** Uses SQLite (no PostgreSQL installation needed). The `tasks.db` file will be created automatically.

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Configure environment (optional)
copy .env.example .env.local
# Edit .env.local if needed

# Run development server
npm run dev
```

## Usage

1. Open the app at http://localhost:5173
2. Enter all your tasks for the day in the text area
3. Click "Break Down My Tasks"
4. Review the AI-generated micro-goals
5. Edit titles, descriptions, or time estimates as needed
6. Click "Confirm & Save" to save to database

## Environment Variables

### Backend (`backend/.env`)
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-pro
DATABASE_URL=sqlite:///./tasks.db
DEBUG=True
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (`frontend/.env.local`)
```env
VITE_API_URL=http://localhost:8000
```

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Main Endpoints
- `POST /api/tasks/breakdown` - Break down tasks using AI
- `POST /api/tasks/confirm` - Save confirmed micro-goals
- `GET /api/tasks/` - Get all tasks
- `GET /api/tasks/{id}` - Get specific task
- `DELETE /api/tasks/{id}` - Delete task

## Troubleshooting

### Installation Issues

**Problem:** `psycopg2-binary` fails to install
- **Solution:** This has been fixed. We removed PostgreSQL dependency. Make sure you have the latest `requirements.txt` without `psycopg2-binary`.

**Problem:** Python package requires Rust compiler
- **Solution:** Upgrade pip first: `python -m pip install --upgrade pip`, then use `pip install -r requirements.txt` with version ranges (already configured).

**Problem:** `CORS_ORIGINS` parsing error
- **Solution:** Make sure `backend/.env` has `CORS_ORIGINS` as a comma-separated string:
  ```
  CORS_ORIGINS=http://localhost:5173,http://localhost:3000
  ```

### Backend won't start
- Make sure Python virtual environment is activated: `venv\Scripts\activate`
- Check that all dependencies are installed: `pip install -r requirements.txt`
- Verify `GEMINI_API_KEY` is set in `backend/.env`
- Ensure database is initialized (check if `backend/tasks.db` file exists)

### Frontend won't start
- Make sure Node.js is installed (v16 or higher recommended)
- Run `npm install` in the frontend directory
- Check that backend is running on port 8000

### API calls failing
- Verify backend is running at http://localhost:8000
- Check CORS settings in `backend/.env` (should include http://localhost:5173)
- Verify `VITE_API_URL` in frontend `.env.local` (optional, defaults to http://localhost:8000)
- Check browser console for specific error messages

### Gemini API errors
- Verify your API key is correct in `backend/.env`
- Check your API key hasn't expired at [Google AI Studio](https://makersuite.google.com/app/apikey)
- Ensure you have API quota available
- Check backend logs for specific error messages

## Future Features (Phase 2)
- Trello-style board view
- Pomodoro timer integration
- Progress tracking and analytics
- Daily/weekly statistics
- Task completion history
