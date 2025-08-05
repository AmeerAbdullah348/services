#!/bin/bash

echo "🔧 Starting YouTube to WAV Server"
echo "================================="

# Kill any existing node processes on port 3002
echo "🧹 Cleaning up any existing processes..."
lsof -ti:3002 | xargs kill -9 2>/dev/null || echo "No processes found on port 3002"

# Navigate to server directory
cd "$(dirname "$0")"

echo "📍 Starting server in: $(pwd)"

# Start the server
echo "🚀 Starting server on port 3002..."
node server.js

echo "✅ Server stopped"
