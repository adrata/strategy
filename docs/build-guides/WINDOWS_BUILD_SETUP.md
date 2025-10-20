# Windows Build Setup for Adrata Tauri App

## Current Issue
The build is failing because **Visual Studio Build Tools are missing**. This is required to compile Rust on Windows.

## Solution Options

### Option 1: Install Visual Studio Build Tools (Recommended)

1. **Download Visual Studio Build Tools 2022:**
   - Go to: https://visualstudio.microsoft.com/downloads/
   - Download "Build Tools for Visual Studio 2022"

2. **Install with C++ Workload:**
   - Run the installer
   - Select "C++ build tools" workload
   - Make sure these components are included:
     - MSVC v143 - VS 2022 C++ x64/x86 build tools
     - Windows 11 SDK (latest version)
     - CMake tools for Visual Studio

3. **Restart your computer** after installation

4. **Verify installation:**
   ```cmd
   where cl
   where link
   ```
   Both commands should return paths to the Visual Studio tools.

### Option 2: Use Pre-built Tauri CLI (Alternative)

If you can't install Visual Studio Build Tools, you can download a pre-built Tauri CLI:

1. **Download from GitHub Releases:**
   - Go to: https://github.com/tauri-apps/tauri/releases
   - Download `tauri-cli-x86_64-pc-windows-msvc.exe` from the latest release
   - Rename it to `tauri.exe`
   - Add it to your PATH or place it in your project directory

### Option 3: Use GitHub Actions (No Local Setup)

Since you mentioned you can set up Actions later, this might be the easiest approach:

1. **Push your code to GitHub**
2. **Use the existing GitHub Actions workflow** (already created in `.github/workflows/tauri-build.yml`)
3. **Download the built apps** from the Actions artifacts

## Quick Test After Installing Build Tools

Once you have Visual Studio Build Tools installed:

```cmd
# Switch back to MSVC toolchain
rustup default stable-x86_64-pc-windows-msvc

# Install Tauri CLI
cargo install tauri-cli

# Build the app
cd src-tauri
cargo tauri build
```

## Expected Output

After successful build, you'll find these files in `src-tauri/target/release/bundle/`:

- **MSI Installer**: `msi/Adrata_1.0.2_x64_en-US.msi`
- **NSIS Installer**: `nsis/Adrata_1.0.2_x64-setup.exe`
- **Standalone Executable**: `../adrata.exe`

## Next Steps

1. **Install Visual Studio Build Tools** (Option 1 above)
2. **Restart your computer**
3. **Run the build commands**
4. **Test the app** by running the generated executable

## Troubleshooting

### "link.exe not found" Error
- **Solution**: Install Visual Studio Build Tools with C++ workload
- **Verify**: Run `where link` in command prompt

### Antivirus Blocking Build
- **Solution**: Temporarily disable real-time protection during build
- **Alternative**: Add build directories to antivirus exclusions

### Permission Errors
- **Solution**: Run command prompt as Administrator
- **Alternative**: Close any antivirus software temporarily

## Cross-Platform Building

### macOS
- Requires Mac with Xcode Command Line Tools
- Run: `xcode-select --install`
- Then: `cargo tauri build`

### Linux
- Requires system dependencies (varies by distribution)
- Ubuntu/Debian: `sudo apt install libwebkit2gtk-4.0-dev libayatana-appindicator3-dev librsvg2-dev`
- Then: `cargo tauri build`

## Recommendation

**Install Visual Studio Build Tools** - this is the most reliable approach for Windows development with Rust/Tauri.
