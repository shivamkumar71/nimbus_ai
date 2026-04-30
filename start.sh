#!/bin/bash

echo ""
echo " =========================================="
echo "   NIMBUS Weather App - Local Development"
echo " =========================================="
echo ""

# Check Python
if ! command -v python3 &>/dev/null && ! command -v python &>/dev/null; then
  echo " [ERROR] Python not found. Install from https://python.org"
  exit 1
fi
PYTHON=$(command -v python3 || command -v python)
echo " [OK] Python found: $($PYTHON --version)"

# Check Node
if ! command -v node &>/dev/null; then
  echo " [ERROR] Node.js not found. Install from https://nodejs.org"
  exit 1
fi
echo " [OK] Node.js found: $(node --version)"

# Install Python dependencies
echo ""
echo " Installing Python packages..."
$PYTHON -m pip install -r artifacts/api-server/python/requirements.txt --quiet
echo " [OK] Python packages ready"

# Install Node dependencies
echo " Installing Node packages..."
if command -v pnpm &>/dev/null; then
  pnpm install --silent
else
  npm install --silent
fi
echo " [OK] Node packages ready"

echo ""
echo " Starting servers..."
echo " - Python API  : http://localhost:8080"
echo " - Frontend    : http://localhost:5173"
echo ""

# Start Python API in background
$PYTHON artifacts/api-server/python/main.py &
PYTHON_PID=$!
echo " [OK] Python API started (PID $PYTHON_PID)"

# Wait for Python to be ready
sleep 3

# Start frontend in background
(cd artifacts/weather-app && npx vite --config vite.config.local.ts) &
VITE_PID=$!
echo " [OK] Frontend started (PID $VITE_PID)"

sleep 4

# Open browser
if command -v xdg-open &>/dev/null; then
  xdg-open http://localhost:5173
elif command -v open &>/dev/null; then
  open http://localhost:5173
fi

echo ""
echo " App is running at: http://localhost:5173"
echo " Press Ctrl+C to stop both servers."
echo ""

# Wait and clean up on exit
trap "kill $PYTHON_PID $VITE_PID 2>/dev/null; echo 'Servers stopped.'" EXIT
wait
