#!/bin/bash

echo "🔧 YouTube Audio Download Fix Script"
echo "===================================="

# Navigate to server directory
cd "$(dirname "$0")"

echo "📍 Current directory: $(pwd)"

# Remove old ytdl-core and install the updated one
echo "🗑️  Removing old ytdl-core..."
npm uninstall ytdl-core

echo "📦 Installing updated @distube/ytdl-core..."
npm install @distube/ytdl-core@latest

echo "🔍 Testing YouTube download functionality..."
node fix-youtube-download.js

echo "✅ Setup complete!"
echo ""
echo "🚀 Next steps:"
echo "1. Start your server: npm run dev"
echo "2. Test with a YouTube URL in your application"
echo ""
echo "💡 If you still get dummy audio, try:"
echo "   - Using different YouTube URLs"
echo "   - Checking that the videos are not restricted"
echo "   - Ensuring videos are not live streams"
