# Concise Notes

A powerful desktop application for transcribing audio and video files using OpenAI's Whisper model. Create concise notes from audio and video files completely offline with no API costs.

## Features

- 🎙️ **Audio/Video Transcription**: Transcribe various formats (MP4, MKV, AVI, MOV, MP3, M4A, WAV)
- 📁 **Batch Processing**: Process multiple files at once with progress tracking
- 🔴 **Real-time Transcription**: Live microphone transcription
- 🤖 **AI Summaries**: Generate concise summaries using Ollama integration
- 🌐 **Network Share Support**: Access files from network locations
- ⌨️ **Keyboard Shortcuts**: Cross-platform shortcuts for efficient workflow
- 🎨 **Modern UI**: Beautiful interface built with NextUI/HeroUI
- 💾 **100% Local & Private**: All processing happens on your machine
- ⚡ **Fast Performance**: 4-10x faster than realtime on modern hardware
- 🚀 **GPU Acceleration**: Optional Metal (macOS), CUDA (NVIDIA), and CoreML support
- 🌍 **100+ Languages**: Automatic language detection or specify manually
- 💰 **Zero Cost**: No API fees, usage limits, or subscriptions

## Prerequisites

1. **Node.js 18+** - Required for running the application
   ```bash
   # Download from https://nodejs.org/
   ```

2. **FFmpeg** - Required for audio/video processing
   ```bash
   # macOS
   brew install ffmpeg
   
   # Ubuntu/Debian
   sudo apt install ffmpeg
   
   # Windows
   # Download from https://ffmpeg.org/download.html
   ```

## Installation

```bash
# Clone the repository
git clone https://github.com/perplext/concise-notes.git
cd concise-notes

# Install dependencies
cd ui
npm install
```

## Running the Application

### Development Mode
```bash
cd ui
npm run dev
```

### Production Mode
```bash
cd ui
npm run build
npm run electron
```

## Quick Start

1. **Launch the application**:
   ```bash
   cd ui
   npm run electron
   ```

2. **Download models**: Navigate to the Models page and download your preferred model (models are downloaded automatically on first use)

3. **Start transcribing**: 
   - Use the **Transcribe** tab for single file transcription
   - Use the **Batch** tab for processing multiple files
   - Use the **Real-time** tab for live microphone transcription

## Available Whisper Models

Models can be downloaded through the Models page in the application:

| Model | Size | Speed | Accuracy | Use Case |
|-------|------|-------|----------|----------|
| tiny | 39MB | 10-15x realtime | Good | Quick drafts |
| base | 142MB | 8-10x realtime | Better | General use |
| small | 466MB | 6-8x realtime | Good | Better accuracy |
| medium | 1.5GB | 4-6x realtime | Very Good | Professional |
| large-v3 | 3GB | 4-5x realtime | Best | Maximum accuracy |

## Keyboard Shortcuts

### Global Shortcuts
- `Cmd/Ctrl + O`: Open file for transcription
- `Cmd/Ctrl + S`: Save transcription
- `Cmd/Ctrl + N`: New transcription
- `Cmd/Ctrl + B`: Batch processing
- `Cmd/Ctrl + R`: Real-time transcription
- `Cmd/Ctrl + M`: Models management
- `Cmd/Ctrl + ,`: Settings

### Transcription Page
- `Space`: Play/Pause audio
- `Escape`: Stop transcription
- `Cmd/Ctrl + E`: Export transcription
- `Cmd/Ctrl + Shift + S`: Save with custom format


## Building for Distribution

### macOS
```bash
cd ui
npm run dist:mac
# Creates .dmg and .app bundle in ui/release/
```

### Windows
```bash
cd ui
npm run dist:win
# Creates installer in ui/release/
```

### Linux
```bash
cd ui
npm run dist:linux
# Creates AppImage/deb/rpm in ui/release/
```

## Configuration

The application stores configuration in:
- **macOS**: `~/Library/Application Support/concise-note-taker/`
- **Windows**: `%APPDATA%/concise-note-taker/`
- **Linux**: `~/.config/concise-note-taker/`

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **UI Framework**: NextUI/HeroUI with Tailwind CSS
- **Desktop**: Electron
- **AI Model**: OpenAI Whisper (via smart-whisper-electron)
- **Audio Processing**: FFmpeg
- **Transcription**: Whisper.cpp bindings

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/perplext/concise-notes/issues) page.

## Acknowledgments

- OpenAI for the Whisper model
- whisper.cpp for the C++ implementation
- smart-whisper-electron for the Node.js bindings
- NextUI/HeroUI for the beautiful UI components