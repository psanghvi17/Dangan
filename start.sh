#!/bin/bash

# Dangan - Development Startup Script
echo "🚀 Starting Dangan Development Environment..."

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    echo "   On macOS: brew services start postgresql"
    echo "   On Ubuntu: sudo systemctl start postgresql"
    exit 1
fi

# Start backend
echo "🔧 Starting FastAPI backend..."
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "📥 Installing Python dependencies..."
pip install -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit backend/.env with your database credentials before continuing."
    echo "   Press Enter when ready..."
    read
fi

# Run database migrations
echo "🗄️  Running database migrations..."
alembic upgrade head

# Start backend server in background
echo "🚀 Starting backend server on http://localhost:8000"
python run.py &
BACKEND_PID=$!

# Go back to root directory
cd ..

# Start frontend
echo "🎨 Starting React frontend..."
cd frontend

# Install dependencies
echo "📥 Installing Node.js dependencies..."
npm install

# Start frontend server
echo "🚀 Starting frontend server on http://localhost:3000"
npm start &
FRONTEND_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

echo "✅ Development environment started!"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for background processes
wait
