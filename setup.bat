@echo off
echo ========================================
echo Task Breakdown App - Initial Setup
echo ========================================
echo.

echo Step 1: Setting up Backend...
cd backend
echo Creating Python virtual environment...
python -m venv venv
call venv\Scripts\activate
echo Installing Python dependencies...
pip install -r requirements.txt
echo.
echo Backend setup complete!
echo IMPORTANT: Copy .env.example to .env and add your GEMINI_API_KEY
echo.
cd ..

echo Step 2: Setting up Frontend...
cd frontend
echo Installing Node.js dependencies...
call npm install
echo.
echo Frontend setup complete!
echo IMPORTANT: Copy .env.example to .env.local if you need to change API URL
echo.
cd ..

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Get your Google Gemini API key from https://makersuite.google.com/app/apikey
echo 2. Add your GEMINI_API_KEY to backend\.env
echo 3. Initialize the database:
echo    cd backend
echo    venv\Scripts\activate
echo    python -c "from app.core.database import Base, engine; from app.models import Task, MicroGoal; Base.metadata.create_all(bind=engine)"
echo.
echo 4. Run the app using: start-dev.bat
echo.
pause
