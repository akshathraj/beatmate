#!/bin/bash

# Start BeatMate Backend
echo "🎵 Starting BeatMate Backend..."

cd beatmate_backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies if needed
echo "Installing dependencies..."
pip install -r requirements.txt

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "Please create a .env file with your API keys:"
    echo "GEMINI_API_KEY=your_key_here"
    echo "MUSICGPT_API_KEY=your_key_here"
    echo "MUSICGPT_WEBHOOK_URL=http://localhost:8000/api/webhook/musicgpt"
fi

# Start the server
echo "🚀 Starting FastAPI server on http://localhost:8000"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

