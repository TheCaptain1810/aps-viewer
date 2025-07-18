#!/bin/bash

# APS Viewer Startup Script

echo "🚀 Starting APS Viewer Application..."

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo "❌ Backend .env file not found. Please copy backend/.env.example to backend/.env and configure it."
    exit 1
fi

if [ ! -f "frontend/.env" ]; then
    echo "⚠️  Frontend .env file not found. Copying example..."
    cp frontend/.env.example frontend/.env
fi

# Install dependencies if node_modules don't exist
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Create uploads directory if it doesn't exist
mkdir -p backend/uploads

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Configure backend/.env with your APS credentials"
echo "2. Start backend: cd backend && npm start"
echo "3. Start frontend: cd frontend && npm run dev"
echo "4. Open http://localhost:5173 in your browser"
echo ""
echo "📚 For detailed setup instructions, see README.md"
