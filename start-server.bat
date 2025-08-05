@echo off
echo 🔧 Starting YouTube to WAV Server
echo =================================

REM Kill any existing node processes on port 3002
echo 🧹 Cleaning up any existing processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3002') do (
    taskkill /PID %%a /F >nul 2>&1
)

REM Navigate to server directory
cd /d "%~dp0"

echo 📍 Starting server in: %cd%

REM Start the server
echo 🚀 Starting server on port 3002...
node server.js

echo ✅ Server stopped
pause
