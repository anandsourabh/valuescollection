#!/bin/bash
# Values Collection Tool - Complete Setup Script

set -e

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║  Values Collection Tool - Complete Setup      ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Get setup choice
echo "What would you like to setup?"
echo "1) Backend only"
echo "2) Frontend only"
echo "3) Both (full setup)"
echo ""
read -p "Enter choice (1-3): " CHOICE

case $CHOICE in
    1)
        echo ""
        echo "🔧 Setting up Backend..."
        cd backend
        bash setup.sh
        cd ..
        ;;
    2)
        echo ""
        echo "🎨 Setting up Frontend..."
        cd frontend
        bash setup.sh
        cd ..
        ;;
    3)
        echo ""
        echo "🔧 Setting up Backend..."
        cd backend
        bash setup.sh
        cd ..
        echo ""
        echo "🎨 Setting up Frontend..."
        cd frontend
        bash setup.sh
        cd ..
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║  🎉 Setup Complete!                           ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo "📖 Next Steps:"
echo "1. Read SETUP.md for detailed information"
echo "2. Start backend: cd backend && source venv/bin/activate && python -m uvicorn app.main:app --reload"
echo "3. Start frontend (new terminal): cd frontend && npm start"
echo "4. Open http://localhost:4200"
echo "5. Login: alex.morgan@hartwell.com / password123"
echo ""
