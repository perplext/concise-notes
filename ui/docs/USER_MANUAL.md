# Concise Note Taker - User Manual

## Table of Contents

1. [Getting Started](#getting-started)
2. [Installation](#installation)
3. [First Time Setup](#first-time-setup)
4. [Core Features](#core-features)
5. [Using the Application](#using-the-application)
6. [Advanced Features](#advanced-features)
7. [Troubleshooting](#troubleshooting)
8. [Keyboard Shortcuts](#keyboard-shortcuts)

## Getting Started

Concise Note Taker is a powerful desktop application for transcribing audio and video files using OpenAI's Whisper models. All processing happens locally on your computer, ensuring complete privacy and no API costs.

### System Requirements

- **Operating System**: Windows 10+, macOS 11+, or Linux (Ubuntu 20.04+)
- **RAM**: Minimum 8GB (16GB recommended for large models)
- **Storage**: 5GB free space for models
- **Processor**: Multi-core CPU (GPU acceleration optional)

## Installation

### macOS

1. Download the `.dmg` file from the releases page
2. Open the downloaded file
3. Drag Concise Note Taker to your Applications folder
4. On first launch, you may need to right-click and select "Open" to bypass Gatekeeper

### Windows

1. Download the `.exe` installer
2. Run the installer
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

### Linux

1. Download the `.AppImage` file
2. Make it executable: `chmod +x concise-note-taker.AppImage`
3. Run the application: `./concise-note-taker.AppImage`

## First Time Setup

### 1. Download a Whisper Model

When you first launch the app:

1. Click on "Download Models" from the home screen
2. Choose a model based on your needs:
   - **Tiny (39MB)**: Fastest, good for quick drafts
   - **Base (142MB)**: Best balance of speed and accuracy
   - **Small (466MB)**: Better accuracy for important content
   - **Medium (1.5GB)**: Professional quality
   - **Large (3GB)**: Maximum accuracy

3. Click "Download" and wait for completion

### 2. Configure Settings

Navigate to Settings (gear icon) to customize:

- **Default Model**: Select your preferred model
- **Output Format**: Choose between TXT, SRT, VTT, or JSON
- **Language**: Set default language or use auto-detection
- **GPU Acceleration**: Enable if you have a compatible GPU

## Core Features

### Single File Transcription

1. Click "Transcribe Audio" from the home screen
2. Either:
   - Drag and drop a file onto the drop zone
   - Click "Browse" to select a file
   - Paste a file from clipboard
3. Configure options:
   - Model size
   - Output format
   - Language (optional)
   - Timestamps (for subtitles)
4. Click "Start Transcription"
5. Save the result when complete

**Supported Formats**: MP4, MKV, AVI, MOV, MP3, M4A, WAV, FLAC, AAC, OGG

### Batch Processing

Process multiple files at once:

1. Navigate to "Batch Process"
2. Click "Select Directory" or drag a folder
3. Review the discovered media files
4. Configure options:
   - Output format
   - Summary generation
   - Summary format (if enabled)
5. Click "Process All Files"
6. Monitor progress for each file

### Real-time Transcription

Transcribe live audio from your microphone:

1. Go to "Real-time Mode"
2. Grant microphone permissions when prompted
3. Click "Start Recording"
4. Speak clearly into your microphone
5. Click "Stop" when finished
6. Review and save the transcription

## Using the Application

### File Selection Methods

The app supports multiple ways to select files:

1. **Drag and Drop**: Drag files directly onto the application
2. **Browse Button**: Use the system file picker
3. **Keyboard Paste**: Copy a file and paste with Cmd/Ctrl+V
4. **Directory Selection**: For batch processing

### Transcription Options

#### Model Selection
- Larger models are more accurate but slower
- GPU acceleration speeds up processing significantly

#### Language Settings
- **Auto**: Automatically detects language
- **Specific Language**: Force detection for better accuracy
- **Translation**: Translate to English (available with some models)

#### Output Formats
- **Text (.txt)**: Plain text transcription
- **SRT (.srt)**: Subtitles with timestamps
- **VTT (.vtt)**: WebVTT format for web videos
- **JSON (.json)**: Structured data with segments

### AI Summaries

When enabled, the app can generate concise summaries:

1. Enable "Generate AI Summary" option
2. Select summary format:
   - Brief (2-3 sentences)
   - Detailed (paragraph)
   - Bullet Points
   - Key Points
3. Summaries are appended to transcriptions

## Advanced Features

### GPU Acceleration

For faster processing:

1. Go to Settings
2. Enable "Use GPU Acceleration"
3. Restart the application
4. Supported: NVIDIA CUDA, Apple Metal, Intel/AMD via OpenCL

### Network Share Support

The app can process files from network drives:

1. Mount the network share on your system
2. Navigate to it using the directory selector
3. Processing may be slower depending on network speed

### Custom Output Directory

Set a default output location:

1. Open Settings
2. Click "Output Directory"
3. Select your preferred folder
4. All transcriptions will save there by default

### Keyboard Shortcuts

- **Cmd/Ctrl + O**: Open file
- **Cmd/Ctrl + S**: Save transcription
- **Cmd/Ctrl + N**: New transcription
- **Cmd/Ctrl + B**: Batch processing
- **Cmd/Ctrl + R**: Real-time mode
- **Cmd/Ctrl + ,**: Open settings
- **Escape**: Cancel operation

## Troubleshooting

### Common Issues

#### "Model not found"
- Download a model from the Models page
- Ensure the model file isn't corrupted
- Check available disk space

#### "FFmpeg not found"
- The app includes FFmpeg, but if issues occur:
  - macOS: `brew install ffmpeg`
  - Windows: Download from ffmpeg.org
  - Linux: `sudo apt install ffmpeg`

#### "Out of memory"
- Use a smaller model
- Close other applications
- Process files one at a time
- Consider upgrading RAM

#### Slow Performance
- Enable GPU acceleration if available
- Use a smaller model for drafts
- Check CPU usage in System Monitor
- Ensure adequate cooling

#### Network Share Issues
- Verify network connection
- Check file permissions
- Try copying files locally first
- Ensure share is properly mounted

### Getting Help

- **Documentation**: Check the built-in help
- **GitHub Issues**: Report bugs and request features
- **Community Forum**: Get help from other users
- **Email Support**: support@example.com

## Best Practices

1. **Model Selection**: Start with Base model, upgrade if needed
2. **File Preparation**: Ensure good audio quality in source files
3. **Batch Processing**: Group similar files for consistent settings
4. **Storage**: Keep original files until satisfied with transcriptions
5. **Regular Updates**: Check for app updates monthly

## Privacy & Security

- **100% Local**: No data leaves your computer
- **No Internet Required**: Works completely offline
- **No Accounts**: No registration or login needed
- **Your Data**: You own all transcriptions
- **Open Source**: Auditable codebase

## Appendix

### File Size Limits
- Maximum file size: 20GB
- Recommended: Under 5GB for optimal performance
- For larger files, consider splitting

### Language Support
Supports 99+ languages including:
- English, Spanish, French, German, Italian
- Chinese, Japanese, Korean
- Arabic, Hebrew, Hindi
- And many more...

### Performance Expectations
On a modern computer (M1 Mac, RTX 3060, etc.):
- Tiny: 10-15x faster than real-time
- Base: 8-10x faster than real-time
- Large: 3-5x faster than real-time

---

© 2024 Concise Note Taker. All rights reserved.