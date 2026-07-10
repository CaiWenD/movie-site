@echo off
title Movie Server
cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel% equ 0 (
    echo Starting Python HTTP server on port 8080...
    echo Open browser: http://localhost:8080
    python -m http.server 8080
    pause
    exit /b
)

where node >nul 2>nul
if %errorlevel% equ 0 (
    echo Starting Node server on port 8080...
    echo Open browser: http://localhost:8080
    npx -y serve -l 8080
    pause
    exit /b
)

echo No Python or Node.js found.
echo Please install Python: https://www.python.org/downloads/
echo Or run manually: python -m http.server 8080
pause
