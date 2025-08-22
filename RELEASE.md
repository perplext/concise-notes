# Release Process

This document describes how to create and publish releases for Concise Notes.

## Automated Release Process

The project uses GitHub Actions to automatically build and release binaries for all platforms when a new version tag is pushed.

### Prerequisites

1. Ensure all changes are committed and pushed to the `main` branch
2. Update the version in `ui/package.json`
3. Ensure all tests pass locally

### Creating a Release

1. **Tag the release:**
   ```bash
   # Update version in package.json first
   cd ui
   npm version patch  # or minor, or major
   cd ..
   
   # Create and push tag
   git add .
   git commit -m "Release v1.0.0"
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin main
   git push origin v1.0.0
   ```

2. **GitHub Actions will automatically:**
   - Build the application for all platforms:
     - Windows (x64): `.exe` installer and portable
     - macOS (x64): `.dmg` and `.zip` for Intel Macs
     - macOS (arm64): `.dmg` and `.zip` for Apple Silicon
     - Linux (x64): `.AppImage`, `.deb`, `.rpm`, `.snap`
   - Create a GitHub release with all artifacts
   - Upload all binaries to the release

3. **Monitor the build:**
   - Go to the [Actions tab](https://github.com/perplext/concise-notes/actions)
   - Watch the "Build and Release" workflow
   - Check for any build failures

## Manual Release Process

If you need to build releases locally:

### Windows
```bash
cd ui
npm run dist:win
# Output: release/*.exe
```

### macOS
```bash
cd ui
npm run dist:mac
# Output: release/*.dmg, release/*.zip
```

### Linux
```bash
cd ui
npm run dist:linux
# Output: release/*.AppImage, release/*.deb, release/*.rpm
```

### All Platforms (on respective OS)
```bash
cd ui
npm run dist:all
```

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Incompatible API changes
- **MINOR**: New functionality in a backwards compatible manner
- **PATCH**: Backwards compatible bug fixes

## Pre-release Checklist

Before creating a release:

- [ ] All tests pass
- [ ] Documentation is updated
- [ ] CHANGELOG is updated
- [ ] Version number is updated in `package.json`
- [ ] Code is committed and pushed
- [ ] Previous issues are closed

## Post-release Checklist

After the release is published:

- [ ] Verify all platform binaries are uploaded
- [ ] Test download links
- [ ] Update project README if needed
- [ ] Announce the release (if applicable)

## Troubleshooting

### Build Failures

If the GitHub Actions build fails:

1. Check the [Actions logs](https://github.com/perplext/concise-notes/actions)
2. Common issues:
   - Missing dependencies
   - Node version mismatch
   - Platform-specific build issues

### Missing Artifacts

If artifacts are missing from the release:

1. Check if the build completed successfully
2. Manually trigger the workflow from Actions tab
3. Upload missing artifacts manually if needed

## Manual Upload

To manually upload artifacts to an existing release:

```bash
# Using GitHub CLI
gh release upload v1.0.0 path/to/artifact.dmg

# Or use the GitHub web interface
# Go to Releases > Edit Release > Upload files
```

## Testing Releases

Before announcing a release:

1. Download and test on each platform
2. Verify basic functionality:
   - Application launches
   - Can transcribe a file
   - Settings persist
   - Models can be downloaded

## Platform-Specific Notes

### Windows
- Requires code signing certificate for trusted installation
- Windows Defender may flag unsigned builds

### macOS
- Requires Apple Developer certificate for notarization
- Gatekeeper may block unsigned apps
- Users can bypass with: Right-click > Open

### Linux
- AppImage is the most universal format
- Some distributions may require additional dependencies
- Make AppImage executable: `chmod +x *.AppImage`

## Support

For release-related issues, open an issue on GitHub or contact the maintainers.