# Rust Installation Guide for Tauri Desktop

## Quick Installation (Windows)

### Option 1: Using winget (Recommended)
```bash
# Run PowerShell as Administrator
winget install Rustlang.Rustup
```

### Option 2: Direct Download
1. Go to https://rustup.rs/
2. Download the installer for Windows
3. Run the installer and follow the prompts
4. Choose "1) Proceed with installation (default)"

### Option 3: Using Chocolatey
```bash
# If you have Chocolatey installed
choco install rust
```

## After Installation

### 1. Restart Your Terminal
Close and reopen your PowerShell/Command Prompt to refresh the PATH.

### 2. Verify Installation
```bash
cargo --version
rustc --version
```

You should see output like:
```
cargo 1.75.0 (1d8b05cdd 2023-11-20)
rustc 1.75.0 (82e1608df 2023-12-21)
```

### 3. Install Tauri CLI
```bash
cargo install tauri-cli
```

### 4. Verify Tauri CLI
```bash
cargo tauri --version
```

## Test the Installation

Run our validation script to confirm everything is working:
```bash
node test-tauri-desktop.js
```

## Troubleshooting

### "cargo not found" Error
- **Solution**: Restart your terminal after installation
- **Alternative**: Add Rust to PATH manually:
  - Add `C:\Users\{username}\.cargo\bin` to your system PATH
  - Restart terminal

### Installation Fails
- **Check**: You have administrator privileges
- **Try**: Running PowerShell as Administrator
- **Alternative**: Use the direct download method

### Tauri CLI Installation Fails
- **Check**: Rust is properly installed first
- **Try**: `cargo install tauri-cli --force`
- **Alternative**: Use npm: `npm install -g @tauri-apps/cli`

## Next Steps

Once Rust is installed:

1. **Test Development Build:**
   ```bash
   npm run desktop:dev
   ```

2. **Test Production Build:**
   ```bash
   npm run desktop:build:legacy
   ```

3. **Run Validation Script:**
   ```bash
   node test-tauri-desktop.js
   ```

## System Requirements

- **Windows**: Windows 10 or later
- **Memory**: At least 4GB RAM
- **Disk Space**: ~1GB for Rust toolchain
- **Network**: Internet connection for downloading dependencies

## Additional Tools (Optional)

### Visual Studio Build Tools
If you encounter build errors, you may need Visual Studio Build Tools:
```bash
# Install via winget
winget install Microsoft.VisualStudio.2022.BuildTools
```

### Git (if not already installed)
```bash
winget install Git.Git
```

---

**Note**: This installation is required for Tauri desktop builds. The web version of Adrata works without Rust.
