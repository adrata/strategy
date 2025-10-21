# Adrata Desktop App Build System

This directory contains all documentation and guides for building the Adrata desktop application.

## Quick Start

**For Windows users:**
```cmd
# Run the main build script from project root
build-desktop.bat
```

**For manual builds:**
```cmd
# Navigate to scripts/build/ and run specific scripts
cd scripts/build
build-and-deploy-desktop.bat
```

## Documentation Files

### 📖 Build Guides
- **[CROSS_PLATFORM_BUILD_GUIDE.md](./CROSS_PLATFORM_BUILD_GUIDE.md)** - Complete guide for building on Windows, macOS, and Linux
- **[DESKTOP_APP_DEPLOYMENT.md](./DESKTOP_APP_DEPLOYMENT.md)** - How to deploy desktop apps through Vercel
- **[WINDOWS_BUILD_GUIDE.md](./WINDOWS_BUILD_GUIDE.md)** - Windows-specific build instructions
- **[WINDOWS_BUILD_SETUP.md](./WINDOWS_BUILD_SETUP.md)** - Windows environment setup
- **[SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)** - Quick setup instructions

### 🛠️ Build Scripts
Located in `scripts/build/`:

- **`build-and-deploy-desktop.bat`** - Complete build and deployment (recommended)
- **`build-simple.bat`** - Simple build process
- **`build-tauri-only.bat`** - Tauri-only build (bypasses frontend issues)
- **`build-windows-final.bat`** - Comprehensive Windows build
- **`build-windows.bat`** - Basic Windows build
- **`install-build-tools.bat`** - Install Visual Studio Build Tools
- **`install-build-tools.ps1`** - PowerShell version of build tools installer

## Prerequisites

### Windows
1. **Visual Studio Build Tools 2022** (Required)
   - Download: https://visualstudio.microsoft.com/downloads/
   - Install "Build Tools for Visual Studio 2022"
   - Select "C++ build tools" workload

2. **Rust** (Already installed)
   - Verify: `rustup show`
   - Toolchain: `stable-x86_64-pc-windows-msvc`

3. **Node.js** (Already installed)
   - Version: 18.x or later

### macOS
1. **Xcode Command Line Tools**
   ```bash
   xcode-select --install
   ```

2. **Rust**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

### Linux (Ubuntu/Debian)
1. **System Dependencies**
   ```bash
   sudo apt install libwebkit2gtk-4.0-dev libayatana-appindicator3-dev librsvg2-dev
   ```

2. **Rust**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

## Build Process

### 1. Install Prerequisites
```cmd
# Windows - Install Visual Studio Build Tools
scripts\build\install-build-tools.bat
```

### 2. Build the App
```cmd
# Windows - Full build and deploy
scripts\build\build-and-deploy-desktop.bat
```

### 3. Deploy to Vercel
The build script will copy installers to `public/downloads/`. Deploy to Vercel:

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

## Output Files

After successful build, you'll find:

### Windows
- **MSI Installer**: `src-tauri/target/release/bundle/msi/Adrata_1.0.2_x64_en-US.msi`
- **NSIS Installer**: `src-tauri/target/release/bundle/nsis/Adrata_1.0.2_x64-setup.exe`
- **Standalone EXE**: `src-tauri/target/release/adrata.exe`

### macOS
- **DMG Installer**: `src-tauri/target/release/bundle/dmg/Adrata_1.0.2_universal.dmg`
- **App Bundle**: `src-tauri/target/release/bundle/macos/Adrata.app`

### Linux
- **AppImage**: `src-tauri/target/release/bundle/appimage/adrata_1.0.2_amd64.AppImage`
- **DEB Package**: `src-tauri/target/release/bundle/deb/adrata_1.0.2_amd64.deb`
- **RPM Package**: `src-tauri/target/release/bundle/rpm/adrata-1.0.2-1.x86_64.rpm`

## Download URLs

Once deployed, installers are available at:
- **Windows**: https://www.adrata.com/downloads/Adrata_1.0.2_x64_en-US.msi
- **macOS**: https://www.adrata.com/downloads/Adrata_1.0.2_universal.dmg
- **Linux**: https://www.adrata.com/downloads/adrata_1.0.2_amd64.deb

## Troubleshooting

### Windows Issues
- **"link.exe not found"**: Install Visual Studio Build Tools
- **Antivirus blocking**: Temporarily disable real-time protection
- **Permission errors**: Run as Administrator

### macOS Issues
- **"xcode-select: error"**: Install Xcode Command Line Tools
- **Code signing**: Set up Apple Developer account for distribution

### Linux Issues
- **Missing dependencies**: Install system packages listed above
- **Permission errors**: Use `sudo` for system package installation

### Download Issues
- **404 on download**: Verify files exist in `public/downloads/`
- **Download button not showing**: Verify user is admin and in web context

## File Structure

```
docs/build-guides/           # All build documentation
├── README.md               # This file
├── CROSS_PLATFORM_BUILD_GUIDE.md
├── DESKTOP_APP_DEPLOYMENT.md
├── WINDOWS_BUILD_GUIDE.md
├── WINDOWS_BUILD_SETUP.md
└── SETUP_INSTRUCTIONS.md

scripts/build/              # All build scripts
├── build-and-deploy-desktop.bat
├── build-simple.bat
├── build-tauri-only.bat
├── build-windows-final.bat
├── build-windows.bat
├── install-build-tools.bat
└── install-build-tools.ps1

public/downloads/           # Desktop app installers
├── README.md
├── .gitkeep
└── [installer files]      # MSI, DMG, DEB files
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the specific build guides
3. Check Tauri documentation: https://tauri.app/
4. Check Vercel documentation: https://vercel.com/docs

## Next Steps

1. **Install Visual Studio Build Tools** (Windows)
2. **Run build script**: `build-desktop.bat`
3. **Deploy to Vercel** (git push or manual upload)
4. **Test download** from profile popup
5. **Set up GitHub Actions** for automated builds (future)
