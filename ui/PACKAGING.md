# Packaging Concise Note Taker for Distribution

## Prerequisites

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Download Whisper Models**
   Place the Whisper model files in the `../models` directory:
   ```bash
   cd ..
   ./target/release/concise-note-taker download --model base
   ```

3. **Create App Icons** (if not already present)
   - **macOS**: `build-assets/icon.icns` (1024x1024)
   - **Windows**: `build-assets/icon.ico` (256x256)
   - **Linux**: `build-assets/icon.png` (512x512)

## Building for Different Platforms

### macOS (Universal Binary - Intel & Apple Silicon)
```bash
npm run dist:mac
```
Creates:
- `.dmg` installer (recommended for distribution)
- `.zip` archive (for manual installation)
- Supports both Intel (x64) and Apple Silicon (arm64)

### Windows
```bash
npm run dist:win
```
Creates:
- `.exe` installer (NSIS)
- Portable `.exe` (no installation needed)

### Linux
```bash
npm run dist:linux
```
Creates:
- `.AppImage` (universal, works on most distributions)
- `.deb` (Debian/Ubuntu)
- `.rpm` (Fedora/RHEL)
- `.snap` (Snap package)

### All Platforms (from macOS)
```bash
npm run dist:all
```
Note: Building for Windows from macOS requires Wine

## Platform-Specific Notes

### macOS
- App will be unsigned by default
- For distribution outside Mac App Store, you'll need an Apple Developer certificate
- To notarize the app:
  ```bash
  export APPLE_ID="your-apple-id@example.com"
  export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
  npm run dist:mac
  ```

### Windows
- Requires Windows or Wine on macOS/Linux
- For code signing, you'll need a Windows code signing certificate
- SmartScreen may warn users about unsigned apps

### Linux
- AppImage is the most universal format
- Snap packages require publishing to Snapcraft store
- Different distributions may have specific requirements

## Build Output

All packaged applications will be in the `dist-electron` directory:
```
dist-electron/
├── mac/
│   ├── Concise Note Taker.app
│   └── Concise Note Taker-1.0.0.dmg
├── win-unpacked/
│   └── Concise Note Taker.exe
├── linux-unpacked/
│   └── concise-note-taker
└── *.AppImage, *.deb, *.rpm, *.snap
```

## Important Considerations

### Native Dependencies
The app includes native dependencies (smart-whisper-electron). These are platform-specific:
- Ensure you're building on the target platform or using cross-compilation
- The build process will automatically rebuild native modules for the target platform

### File Size
The packaged app will be large due to:
- Electron runtime (~70MB)
- Whisper models (39MB - 3GB depending on model)
- Node modules and app code

Typical sizes:
- Base app (without models): ~150MB
- With Base model: ~290MB
- With Large model: ~3.2GB

### Performance
- Metal acceleration (macOS) only works on Apple Silicon
- CUDA acceleration (Windows/Linux) requires NVIDIA GPU
- CPU-only mode works everywhere but is slower

## Testing Packaged Apps

1. **macOS**: 
   ```bash
   open "dist-electron/mac/Concise Note Taker.app"
   ```

2. **Windows**:
   ```bash
   ./dist-electron/win-unpacked/Concise\ Note\ Taker.exe
   ```

3. **Linux**:
   ```bash
   ./dist-electron/linux-unpacked/concise-note-taker
   ```

## Troubleshooting

### "App is damaged" on macOS
```bash
xattr -cr "dist-electron/mac/Concise Note Taker.app"
```

### Missing native modules
```bash
npm rebuild
electron-builder install-app-deps
```

### Build fails with "Cannot find module"
Ensure all dependencies are in `dependencies` not `devDependencies` in package.json

## Distribution

### GitHub Releases (Recommended)
1. Create a GitHub release
2. Upload the installers from `dist-electron/`
3. Users can download directly

### Auto-Update
To enable auto-updates, configure the publish section in electron-builder.json with your GitHub repository details.

### App Stores
- **Mac App Store**: Requires additional configuration and Apple Developer Program membership
- **Microsoft Store**: Can submit the `.appx` package (additional build target needed)
- **Snap Store**: Can publish the `.snap` package