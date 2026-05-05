@echo off
title Nimbus Weather App
color 0B
echo.
echo  ==========================================
echo    NIMBUS Weather App - Local Development
echo  ==========================================
echo.

REM --- Check Python ---
python --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python not found. Download from https://python.org
    pause
    exit /b 1
)
echo  [OK] Python found

REM --- Check Node ---
node --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js not found. Download from https://nodejs.org
    pause
    exit /b 1
)
echo  [OK] Node.js found

REM --- Install Python dependencies ---
echo.
echo  Installing Python packages...
pip install -r artifacts\api-server\python\requirements.txt --quiet
echo  [OK] Python packages ready

REM --- Install Node dependencies ---
echo  Installing Node packages...
call pnpm install --silent 2>nul || call npm install --silent
echo  [OK] Node packages ready

echo.
echo  Starting servers...
echo  - Python API  : http://localhost:8080
echo  - Frontend    : http://localhost:5173
echo.
echo  Open your browser at: http://localhost:5173
echo.

REM --- Start Python in a new window ---
start "Nimbus - Python API" cmd /k "python artifacts\api-server\python\main.py"

REM --- Wait 3 seconds for Python to boot ---
timeout /t 3 /nobreak >nul

REM --- Start Frontend in a new window ---
start "Nimbus - Frontend" cmd /k "cd artifacts\weather-app && npx vite --config vite.config.local.ts"

REM --- Open browser after 5 seconds ---
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo  Both servers are running in separate windows.
echo  Close those windows to stop the app.
echo.
pause
git init
