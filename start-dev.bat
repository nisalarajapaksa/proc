@echo off
echo Starting Task Breakdown App...
echo.

echo Starting Backend (FastAPI)...
start cmd /k "cd backend && venv\Scripts\activate && uvicorn app.main:app --reload"

timeout /t 3 /nobreak > nul

echo Starting Frontend (React + Vite)...
start cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
