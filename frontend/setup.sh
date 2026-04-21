#!/bin/bash
# Frontend quick setup script

set -e

echo "🚀 Values Collection Tool - Frontend Setup"
echo "=========================================="

# Check Node
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

echo "✅ Node found: $(node --version)"
echo "✅ npm found: $(npm --version)"

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "⚠️  node_modules found. Running 'npm install' to ensure dependencies are up to date..."
else
    echo "📦 Installing dependencies..."
fi

# Install with legacy peer deps for PrimeNG
npm install --legacy-peer-deps

# Create environment if it doesn't exist
if [ ! -f "src/environments/environment.ts" ]; then
    echo "📝 Creating environment configuration..."
    cat > src/environments/environment.ts << 'EOF'
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api'
};
EOF
    echo "✅ Environment created"
fi

echo ""
echo "=========================================="
echo "✨ Frontend setup complete!"
echo ""
echo "Next steps:"
echo "1. Start backend first: cd ../backend && python -m uvicorn app.main:app --reload"
echo "2. Start frontend: npm start"
echo "3. Open: http://localhost:4200"
echo "4. Login: alex.morgan@hartwell.com / password123"
echo ""
