@echo off
REM Backend quick setup script for Windows

echo.
echo 🚀 Values Collection Tool - Backend Setup
echo ==========================================

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python 3.10+
    exit /b 1
)

for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo ✅ Python found: %PYTHON_VERSION%

REM Check PostgreSQL
where psql >nul 2>&1
if errorlevel 1 (
    echo ❌ PostgreSQL not found. Please install PostgreSQL 16
    exit /b 1
)

for /f "tokens=*" %%i in ('psql --version') do set PG_VERSION=%%i
echo ✅ PostgreSQL found: %PG_VERSION%

REM Create venv
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate venv
call venv\Scripts\activate.bat
echo ✅ Virtual environment activated

REM Install dependencies
echo 📥 Installing dependencies...
pip install -q -r requirements.txt

REM Database name
set DB_NAME=valuescollection
set /p DB_NAME="Enter database name (default: valuescollection): "

REM Create database
echo 🗄️  Creating database '%DB_NAME%'...
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = '%DB_NAME%'" | findstr /R "1" >nul
if errorlevel 1 (
    createdb -U postgres %DB_NAME%
)
echo ✅ Database ready

REM Load schema
echo 📋 Loading schema...
psql -U postgres %DB_NAME% < ..\valuescollection_schema.sql
echo ✅ Schema loaded

REM Run migrations
echo 🔄 Running migrations...
python -m alembic upgrade head
echo ✅ Migrations complete

REM Seed data
echo 🌱 Seeding test data...
python seed.py
echo ✅ Seed complete

REM Create .env if it doesn't exist
if not exist ".env" (
    echo 📝 Creating .env file...
    (
        echo DATABASE_URL=postgresql+asyncpg://postgres@localhost/%DB_NAME%
        echo JWT_SECRET=your-secret-key-change-in-production-min-32-chars
        echo UPLOAD_DIR=./uploads
        echo MAIL_DEV_CONSOLE=true
    ) > .env
    echo ✅ .env created (update JWT_SECRET for production)
)

REM Create uploads directory
if not exist "uploads" mkdir uploads

echo.
echo ==========================================
echo ✨ Backend setup complete!
echo.
echo Next steps:
echo 1. Update JWT_SECRET in .env for production
echo 2. Start server: python -m uvicorn app.main:app --reload
echo 3. API docs: http://localhost:8000/docs
echo 4. Seed user: alex.morgan@hartwell.com / password123
echo.
pause
