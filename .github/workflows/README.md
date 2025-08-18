# GitHub Workflows for Journal Blocks

This directory contains GitHub Actions workflows for building and releasing the Journal Blocks Electron application.

## Workflows

### 1. Build Workflow (`build.yml`)
- **Trigger**: Push to main/master branches, pull requests
- **Purpose**: Continuous integration - builds the app on all platforms to ensure it compiles
- **Platforms**: Windows (x64), macOS (Universal), Linux (x64)
- **Artifacts**: Uploads build artifacts for 30 days

### 2. Release Workflow (`release.yml`)
- **Trigger**: Manual dispatch via GitHub Actions tab
- **Purpose**: Creates official releases with downloadable binaries
- **Versioning**: Automatic timestamp-based versioning (YYYY.MM.DDHHSS format)
- **Platforms**: Windows (x64), macOS (Universal), Linux (x64)

## Versioning System

The release system uses a custom versioning format: **YYYY.MM.DDHHSS**

Examples:
- `2024.01.150930` = January 15, 2024 at 09:30
- `2024.12.311445` = December 31, 2024 at 14:45

### Manual Version Override
You can specify a custom version when triggering the release workflow:
1. Go to Actions → Release → Run workflow
2. Enter a custom version (e.g., "1.0.0") or leave empty for automatic versioning

## Creating a Release

### Method 1: GitHub UI (Recommended)
1. Go to your repository on GitHub
2. Click **Actions** tab
3. Select **Release** workflow
4. Click **Run workflow**
5. Optionally enter a custom version or leave empty
6. Click **Run workflow** button

### Method 2: Command Line (Advanced)
```bash
# Trigger release via GitHub CLI
gh workflow run release.yml

# Trigger with custom version
gh workflow run release.yml -f version="1.0.0"
```

## Build Outputs

Each platform produces different file types:

### Windows
- `.exe` - NSIS installer (recommended for distribution)

### macOS
- `.dmg` - Disk image (recommended for distribution)
- Universal binary supporting both Intel and Apple Silicon

### Linux
- `.AppImage` - Portable application (recommended for distribution)
- Works on most Linux distributions without installation

## Requirements

### Repository Setup
1. **Secrets**: No additional secrets required (uses built-in `GITHUB_TOKEN`)
2. **Permissions**: Ensure Actions have write permissions for releases
3. **Icons**: Place icon files in `build/` directory (see build/README.md)

### Local Development
```bash
# Install dependencies
npm install

# Test builds locally
npm run build:win      # Windows
npm run build:mac      # macOS  
npm run build:linux    # Linux
npm run build:electron # All platforms

# Test version script
npm run set-version
npm run set-version "1.0.0"  # Custom version
```

## Troubleshooting

### Common Issues

1. **Build fails on macOS**: Ensure you have proper code signing certificates or disable signing
2. **Icons missing**: Check that icon files exist in `build/` directory
3. **Permission denied**: Ensure repository has Actions write permissions
4. **Version script fails**: Check Node.js version and script permissions

### Debug Steps

1. Check workflow logs in Actions tab
2. Test builds locally first
3. Verify package.json configuration
4. Ensure all dependencies are properly installed

## Configuration Files

- `package.json` - Contains electron-builder configuration
- `scripts/set-version.js` - Version generation script
- `.github/workflows/build.yml` - CI build workflow
- `.github/workflows/release.yml` - Release workflow

## Customization

### Adding New Platforms
Edit the matrix strategy in workflow files to add new build targets.

### Changing Version Format
Modify `scripts/set-version.js` to implement different versioning schemes.

### Custom Build Steps
Add additional steps to workflows for code signing, notarization, or other custom requirements.
