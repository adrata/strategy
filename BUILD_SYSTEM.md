# 🚀 Adrata Desktop App Build System

## Quick Start

**Build the desktop app:**
```cmd
build-desktop.bat
```

## Overview

The Adrata desktop app is built using Tauri (Rust + Next.js) and deployed through Vercel static hosting.

## File Organization

### 📁 Build Documentation
- **`docs/build-guides/`** - All build guides and documentation
  - `README.md` - Complete build system overview
  - `CROSS_PLATFORM_BUILD_GUIDE.md` - Windows, macOS, Linux builds
  - `DESKTOP_APP_DEPLOYMENT.md` - Vercel deployment guide
  - `WINDOWS_BUILD_GUIDE.md` - Windows-specific instructions
  - `WINDOWS_BUILD_SETUP.md` - Windows environment setup
  - `SETUP_INSTRUCTIONS.md` - Quick setup guide

### 🛠️ Build Scripts
- **`scripts/build/`** - All build scripts
  - `build-and-deploy-desktop.bat` - Complete build and deployment (recommended)
  - `build-simple.bat` - Simple build process
  - `build-tauri-only.bat` - Tauri-only build
  - `install-build-tools.bat` - Install Visual Studio Build Tools
  - `install-build-tools.ps1` - PowerShell installer

### 📦 Desktop App Files
- **`public/downloads/`** - Desktop app installers
  - `README.md` - Installation instructions
  - `[installer files]` - MSI, DMG, DEB files (gitignored)

### 🏗️ Tauri Configuration
- **`src-tauri/`** - Tauri desktop app source code
  - `Cargo.toml` - Rust dependencies
  - `tauri.conf.json` - Tauri configuration
  - `src/` - Rust backend code

## Prerequisites

### Windows (Current Platform)
1. **Visual Studio Build Tools 2022**
   - Download: https://visualstudio.microsoft.com/downloads/
   - Install "Build Tools for Visual Studio 2022"
   - Select "C++ build tools" workload

2. **Rust** (Already installed)
   - Toolchain: `stable-x86_64-pc-windows-msvc`

3. **Node.js** (Already installed)
   - Version: 18.x or later

## Build Process

### 1. Install Prerequisites
```cmd
# Install Visual Studio Build Tools
scripts\build\install-build-tools.bat
```

### 2. Build the App
```cmd
# Complete build and deployment
build-desktop.bat
# OR
scripts\build\build-and-deploy-desktop.bat
```

### 3. Deploy to Vercel
The build script copies installers to `public/downloads/`. Deploy:

**Option A - Git Commit:**
```cmd
git add public/downloads/README.md
git add public/downloads/.gitkeep
git add -f public/downloads/*.msi
git commit -m "Add Windows desktop installer"
git push origin main
```

**Option B - Manual Upload:**
1. Go to Vercel Dashboard
2. Upload files from `public/downloads/`
3. Redeploy

### 4. Test Download
1. Visit https://www.adrata.com
2. Sign in as admin user
3. Click profile icon → Download
4. Should download Windows MSI installer

## Download URLs

Once deployed:
- **Windows**: https://www.adrata.com/downloads/Adrata_1.0.2_x64_en-US.msi
- **macOS**: https://www.adrata.com/downloads/Adrata_1.0.2_universal.dmg (future)
- **Linux**: https://www.adrata.com/downloads/adrata_1.0.2_amd64.deb (future)

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web App       │    │  Desktop App    │    │   Downloads     │
│   (Next.js)     │    │   (Tauri)       │    │   (Vercel)      │
│                 │    │                 │    │                 │
│ • ProfileBox    │───▶│ • Rust Backend  │───▶│ • MSI Installer │
│ • Download Btn  │    │ • Next.js UI    │    │ • DMG Installer │
│ • Admin Only    │    │ • Offline Sync  │    │ • DEB Package   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Current Status

- ✅ **Infrastructure**: Downloads folder, scripts, documentation
- ✅ **ProfileBox**: Download button configured
- ✅ **Vercel**: Static file hosting ready
- ⚠️ **Windows Build**: Requires Visual Studio Build Tools
- ⚠️ **macOS Build**: Requires Mac with Xcode
- ⚠️ **Linux Build**: Requires Linux with dependencies

## Next Steps

1. **Install Visual Studio Build Tools** (Windows)
2. **Run build script**: `build-desktop.bat`
3. **Deploy to Vercel** (git push or manual upload)
4. **Test download** from profile popup
5. **Set up GitHub Actions** for automated builds (future)

## Documentation

For detailed information, see:
- **`docs/build-guides/README.md`** - Complete build system documentation
- **`scripts/build/README.md`** - Build scripts documentation

## Support

For issues:
1. Check `docs/build-guides/` for troubleshooting
2. Verify prerequisites are installed
3. Check Tauri documentation: https://tauri.app/
4. Check Vercel documentation: https://vercel.com/docs
