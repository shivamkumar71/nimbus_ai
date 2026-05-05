#!/bin/bash
# Build script for Render deployment

echo "=== Building Nimbus Weather for Production ==="

# Build frontend
echo "Building frontend..."
cd artifacts/weather-app
pnpm install
pnpm run build
cd ../..

# Install Python dependencies
echo "Installing Python dependencies..."
cd artifacts/api-server/python
pip install -r requirements.txt
cd ../../..

echo "=== Build Complete ==="
echo "Frontend built at: artifacts/weather-app/dist/public"
echo "Backend ready at: artifacts/api-server/python"
