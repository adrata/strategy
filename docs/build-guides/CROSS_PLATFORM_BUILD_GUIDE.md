# Cross-Platform Build Guide for Adrata Tauri App

## Overview
This guide explains how to build the Adrata Tauri desktop app for Windows, macOS, and Linux platforms.

## Current Status
- ✅ **Tauri app modernization**: Complete
- ✅ **Database schema**: Updated to match PostgreSQL
- ✅ **API commands**: All V1 APIs mirrored as Tauri commands
- ✅ **Sync engine**: Offline-first architecture implemented
- ✅ **Authentication**: Secure keychain storage with JWT
- ⚠️ **Windows build**: Requires Visual Studio Build Tools
- ⚠️ **macOS build**: Requires Mac with Xcode
- ⚠️ **Linux build**: Requires Linux with system dependencies

## Windows Build

### Prerequisites
1. **Visual Studio Build Tools 2022** (Required)
   - Download: https://visualstudio.microsoft.com/downloads/
   - Install "Build Tools for Visual Studio 2022"
   - Select "C++ build tools" workload
   - Include: MSVC v143, Windows 11 SDK, CMake tools

2. **Rust** (Already installed)
   - Verify: `rustup show`
   - Toolchain: `stable-x86_64-pc-windows-msvc`

3. **Node.js** (Already installed)
   - Version: 18.x or later

### Build Steps
1. **Run the build script:**
   ```cmd
   build-windows-final.bat
   ```

2. **Or build manually:**
   ```cmd
   # Set up Rust toolchain
   rustup default stable-x86_64-pc-windows-msvc
   
   # Install Tauri CLI
   cargo install tauri-cli
   
   # Build the app
   cd src-tauri
   cargo tauri build
   ```

### Output Files
- **MSI Installer**: `src-tauri/target/release/bundle/msi/Adrata_1.0.2_x64_en-US.msi`
- **NSIS Installer**: `src-tauri/target/release/bundle/nsis/Adrata_1.0.2_x64-setup.exe`
- **Standalone EXE**: `src-tauri/target/release/adrata.exe`

## macOS Build

### Prerequisites
1. **Xcode Command Line Tools**
   ```bash
   xcode-select --install
   ```

2. **Rust**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source ~/.cargo/env
   ```

3. **Node.js**
   ```bash
   # Using Homebrew
   brew install node
   ```

### Build Steps
1. **Install Tauri CLI:**
   ```bash
   cargo install tauri-cli
   ```

2. **Build the app:**
   ```bash
   cd src-tauri
   cargo tauri build
   ```

### Output Files
- **DMG Installer**: `src-tauri/target/release/bundle/dmg/Adrata_1.0.2_x64.dmg`
- **App Bundle**: `src-tauri/target/release/bundle/macos/Adrata.app`

## Linux Build

### Prerequisites (Ubuntu/Debian)
1. **System Dependencies**
   ```bash
   sudo apt update
   sudo apt install libwebkit2gtk-4.0-dev libayatana-appindicator3-dev librsvg2-dev
   ```

2. **Rust**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source ~/.cargo/env
   ```

3. **Node.js**
   ```bash
   # Using NodeSource repository
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

### Build Steps
1. **Install Tauri CLI:**
   ```bash
   cargo install tauri-cli
   ```

2. **Build the app:**
   ```bash
   cd src-tauri
   cargo tauri build
   ```

### Output Files
- **AppImage**: `src-tauri/target/release/bundle/appimage/adrata_1.0.2_amd64.AppImage`
- **DEB Package**: `src-tauri/target/release/bundle/deb/adrata_1.0.2_amd64.deb`
- **RPM Package**: `src-tauri/target/release/bundle/rpm/adrata-1.0.2-1.x86_64.rpm`

## GitHub Actions (Recommended)

The easiest way to build for all platforms is using GitHub Actions:

1. **Push your code to GitHub**
2. **The workflow will automatically build for all platforms**
3. **Download the built apps from the Actions artifacts**

### Workflow File
The workflow is already configured in `.github/workflows/tauri-build.yml` and will:
- Build for Windows (MSI, NSIS, EXE)
- Build for macOS (DMG, APP)
- Build for Linux (AppImage, DEB, RPM)
- Create release artifacts for download

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

## Development Mode

To run the app in development mode (with hot reload):

```bash
# Windows
npm run desktop:dev

# macOS/Linux
npm run desktop:dev
```

This will:
- Start the frontend development server
- Launch the Tauri app
- Enable hot reload for development

## File Locations

### Build Outputs
- **Windows**: `src-tauri/target/release/bundle/`
- **macOS**: `src-tauri/target/release/bundle/`
- **Linux**: `src-tauri/target/release/bundle/`

### Configuration Files
- **Tauri Config**: `src-tauri/tauri.conf.json`
- **Rust Dependencies**: `src-tauri/Cargo.toml`
- **Build Scripts**: `package.json`

## Next Steps

1. **Install Visual Studio Build Tools** for Windows
2. **Test the Windows build** using `build-windows-final.bat`
3. **Set up GitHub Actions** for automated cross-platform builds
4. **Test on each platform** to ensure compatibility

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Try building in development mode first
4. Check the Tauri documentation: https://tauri.app/
