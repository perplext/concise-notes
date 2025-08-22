#!/bin/bash

echo "═══════════════════════════════════════"
echo "  Setting up Electron Desktop App"
echo "═══════════════════════════════════════"

# Install Electron dependencies
echo "▶ Installing Electron..."
npm install --save-dev electron

echo "▶ Installing Electron Builder..."
npm install --save-dev electron-builder

echo "▶ Installing smart-whisper-electron..."
# This will use existing whisper models
npm install smart-whisper-electron

echo ""
echo "═══════════════════════════════════════"
echo "  Setup Complete!"
echo "═══════════════════════════════════════"
echo ""
echo "To run the Electron desktop app:"
echo "  Development: npm run electron-dev"
echo "  Production:  npm run electron"
echo ""
echo "To build installers:"
echo "  npm run dist"
echo ""
echo "Models directory: ../models/"
echo "Available models:"
ls -lh ../models/*.bin 2>/dev/null | awk '{print "  - " $9 ": " $5}'