# Windows Build Guide for Adrata Tauri App

## Prerequisites

To build the Tauri app on Windows, you need to install the following:

### 1. Node.js (if not already installed)
- Download from: https://nodejs.org/
- Install the LTS version (18.x or later)

### 2. Rust (if not already installed)
- Download from: https://rustup.rs/
- Run the installer and follow the prompts
- After installation, restart your command prompt

### 3. Visual Studio Build Tools (REQUIRED)
- Download from: https://visualstudio.microsoft.com/downloads/
- Install "Build Tools for Visual Studio 2022"
- **IMPORTANT**: Make sure to include the "C++ build tools" workload
- This includes the MSVC compiler and Windows SDK

## Quick Build (Automated)

1. **Run the automated build script:**
   ```cmd
   build-windows.bat
   ```

2. **The script will:**
   - Check all prerequisites
   - Install dependencies
   - Build the frontend
   - Build the Tauri app
   - Copy the installer to your Desktop

## Manual Build (Step by Step)

If the automated script doesn't work, follow these steps:

### Step 1: Install Dependencies
```cmd
npm install --force
```

### Step 2: Build Frontend
```cmd
npm run build
```

### Step 3: Install Tauri CLI
```cmd
cargo install tauri-cli
```

### Step 4: Build Tauri App
```cmd
cd src-tauri
cargo tauri build
cd ..
```

### Step 5: Copy to Desktop
```cmd
copy "src-tauri\target\release\bundle\msi\Adrata_1.0.2_x64_en-US.msi" "%USERPROFILE%\Desktop\"
copy "src-tauri\target\release\bundle\nsis\Adrata_1.0.2_x64-setup.exe" "%USERPROFILE%\Desktop\"
copy "src-tauri\target\release\adrata.exe" "%USERPROFILE%\Desktop\"
```

## What You'll Get

After a successful build, you'll find these files on your Desktop:

1. **`Adrata_1.0.2_x64_en-US.msi`** - Windows MSI installer (recommended)
2. **`Adrata_1.0.2_x64-setup.exe`** - NSIS installer
3. **`adrata.exe`** - Direct executable (for testing)

## Running the App

### Option 1: Install with MSI (Recommended)
1. Double-click `Adrata_1.0.2_x64_en-US.msi`
2. Follow the installation wizard
3. Launch from Start Menu or Desktop shortcut

### Option 2: Run Directly
1. Double-click `adrata.exe`
2. The app will run directly (no installation required)

## Troubleshooting

### "link.exe not found" Error
- **Solution**: Install Visual Studio Build Tools with C++ workload
- **Alternative**: Install full Visual Studio Community

### "Node.js not found" Error
- **Solution**: Install Node.js from https://nodejs.org/
- **Verify**: Run `node --version` in command prompt

### "Rust not found" Error
- **Solution**: Install Rust from https://rustup.rs/
- **Verify**: Run `cargo --version` in command prompt

### Frontend Build Fails
- **Solution**: Run `npm install --force` to bypass Prisma issues
- **Alternative**: Skip frontend build and build Tauri only

### Permission Errors
- **Solution**: Run command prompt as Administrator
- **Alternative**: Close any antivirus software temporarily

## Development Mode

To run the app in development mode (with hot reload):

```cmd
npm run tauri dev
```

This will:
- Start the frontend development server
- Launch the Tauri app
- Enable hot reload for development

## File Locations

- **Built app**: `src-tauri\target\release\adrata.exe`
- **Installers**: `src-tauri\target\release\bundle\`
- **Desktop copies**: `%USERPROFILE%\Desktop\`

## Support

If you encounter issues:
1. Make sure all prerequisites are installed
2. Try running the build script as Administrator
3. Check that Visual Studio Build Tools are properly installed
4. Verify Rust is up to date: `rustup update`
