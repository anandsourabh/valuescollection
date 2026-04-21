#!/bin/bash
# Backend quick setup script

set -e

echo "🚀 Values Collection Tool - Backend Setup"
echo "=========================================="

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.10+"
    exit 1
fi

echo "✅ Python found: $(python3 --version)"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL not found. Please install PostgreSQL 16"
    exit 1
fi

echo "✅ PostgreSQL found: $(psql --version | head -1)"

# Create venv
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate
echo "✅ Virtual environment activated"

# Install dependencies
echo "📥 Installing dependencies..."
pip install -q -r requirements.txt

# Ask for database name
read -p "Enter database name (default: valuescollection): " DB_NAME
DB_NAME=${DB_NAME:-valuescollection}

# Create database if it doesn't exist
echo "🗄️  Creating database '$DB_NAME'..."
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || createdb -U postgres $DB_NAME
echo "✅ Database ready"

# Load schema
echo "📋 Loading schema..."
psql -U postgres $DB_NAME < ../valuescollection_schema.sql
echo "✅ Schema loaded"

# Run migrations
echo "🔄 Running migrations..."
python -m alembic upgrade head
echo "✅ Migrations complete"

# Seed data
echo "🌱 Seeding test data..."
python seed.py
echo "✅ Seed complete"

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
DATABASE_URL=postgresql+asyncpg://postgres@localhost/$DB_NAME
JWT_SECRET=your-secret-key-change-in-production-min-32-chars
UPLOAD_DIR=./uploads
MAIL_DEV_CONSOLE=true
EOF
    echo "✅ .env created (update JWT_SECRET for production)"
fi

# Create uploads directory
mkdir -p uploads

echo ""
echo "=========================================="
echo "✨ Backend setup complete!"
echo ""
echo "Next steps:"
echo "1. Update JWT_SECRET in .env for production"
echo "2. Start server: python -m uvicorn app.main:app --reload"
echo "3. API docs: http://localhost:8000/docs"
echo "4. Seed user: alex.morgan@hartwell.com / password123"
echo ""
