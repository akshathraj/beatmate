#!/bin/bash

# Start BeatMate Frontend
echo "🎨 Starting BeatMate Frontend..."

cd beatmate_frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the development server
echo "🚀 Starting React dev server..."
npm run dev
