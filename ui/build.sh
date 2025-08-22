#!/bin/bash

# Build script for Concise Note Taker
# Handles native module rebuilding and packaging

echo "🔨 Building Concise Note Taker..."

# Clean previous builds
echo "📦 Cleaning previous builds..."
rm -rf dist dist-electron

# Build the web app
echo "⚡ Building web app with Vite..."
npm run build

# Rebuild native modules for Electron
echo "🔧 Rebuilding native modules for Electron..."
npx electron-rebuild

# Determine platform
PLATFORM=""
if [[ "$OSTYPE" == "darwin"* ]]; then
    PLATFORM="mac"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    PLATFORM="linux"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    PLATFORM="win"
fi

# Build for current platform
if [ -n "$PLATFORM" ]; then
    echo "📱 Building for $PLATFORM..."
    npm run dist:$PLATFORM
else
    echo "⚠️  Unknown platform, building for all..."
    npm run dist
fi

echo "✅ Build complete! Check dist-electron/ for packaged app"