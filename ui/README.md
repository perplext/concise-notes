# Concise Note Taker - Electron UI

The modern desktop interface for the Concise Note Taker transcription application.

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev          # Web interface only
npm run electron-dev # Full desktop app

# Build for production
npm run build
npm run electron-build
```

## Features

- **Modern React Interface**: Built with React 18, TypeScript, and Vite
- **Beautiful UI**: NextUI components with gradient designs
- **Dark Mode**: Full dark mode support
- **Real-time Transcription**: Live microphone transcription
- **Batch Processing**: Process multiple files simultaneously
- **AI Summaries**: Generate summaries with local LLMs
- **Cross-platform**: Works on Windows, macOS, and Linux

## Development

### Prerequisites

- Node.js 18+ 
- npm or yarn
- FFmpeg installed
- Ollama (optional, for AI features)

### Project Structure

```
ui/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Application pages
│   ├── services/       # API and Electron services
│   ├── lib/           # Utilities and helpers
│   ├── hooks/         # Custom React hooks
│   └── types/         # TypeScript definitions
├── electron-main.cjs   # Electron main process
├── electron-preload.cjs # Electron preload script
└── electron-whisper.cjs # Whisper integration
```

### Available Scripts

- `npm run dev` - Start Vite dev server
- `npm run electron-dev` - Start Electron app in dev mode
- `npm run build` - Build for production
- `npm run electron-build` - Build Electron distributables
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks

## Building

### For Distribution

```bash
# macOS
npm run electron-build:mac

# Windows
npm run electron-build:win

# Linux
npm run electron-build:linux
```

### Output

Built applications will be in the `dist/` directory:
- macOS: `.dmg` and `.app`
- Windows: `.exe` installer
- Linux: `.AppImage` and `.deb`

## Configuration

The app stores configuration in:
- macOS: `~/Library/Application Support/concise-note-taker/`
- Windows: `%APPDATA%/concise-note-taker/`
- Linux: `~/.config/concise-note-taker/`

## License

MIT