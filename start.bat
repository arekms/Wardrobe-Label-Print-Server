@echo off
REM Wardrobe Label Print Server - Standalone Launcher
REM This batch file starts the application directly (not as a service)

REM Change to script directory
cd /d "%~dp0"

REM Check if .env exists
if not exist ".env" (
    echo ERROR: .env file not found
    echo Please copy .env.example to .env and configure your credentials
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install --omit=dev
)

REM Start the application
echo.
echo ============================================================
echo Wardrobe Label Print Server - Starting
echo ============================================================
echo.
echo Press Ctrl+C to stop the application
echo.

node src/app.js

pause
