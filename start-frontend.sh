#!/bin/bash

# Start BeatMate Frontend
echo "🎨 Starting BeatMate Frontend..."

cd beatmate_frontend

echo "Installing dependencies..."
npm install

# Start the development server
echo "🚀 Starting React dev server..."
npm run dev
