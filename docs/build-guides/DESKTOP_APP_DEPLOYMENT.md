# Desktop App Deployment Guide

## Overview
This guide explains how to build, deploy, and distribute the Adrata desktop application through Vercel.

## Architecture
- **Web App**: Next.js on Vercel (www.adrata.com)
- **Desktop Downloads**: Static files in `public/downloads/`
- **Download Button**: ProfileBox.tsx component (admin users only)

## Quick Start

### Step 1: Build the Desktop App

**Windows (Requires Visual Studio Build Tools):**
```bash
# Install VS Build Tools from https://visualstudio.microsoft.com/downloads/
# Select "C++ build tools" workload

# Set Rust toolchain
rustup default stable-x86_64-pc-windows-msvc

# Build
cd src-tauri
cargo tauri build
cd ..

# Output: src-tauri/target/release/bundle/msi/Adrata_1.0.2_x64_en-US.msi
```

**macOS (Requires Xcode Command Line Tools):**
```bash
# Install Xcode tools
xcode-select --install

# Build
cd src-tauri
cargo tauri build
cd ..

# Output: src-tauri/target/release/bundle/dmg/Adrata_1.0.2_universal.dmg
```

**Linux (Ubuntu/Debian):**
```bash
# Install dependencies
sudo apt install libwebkit2gtk-4.0-dev libayatana-appindicator3-dev librsvg2-dev

# Build
cd src-tauri
cargo tauri build
cd ..

# Output: src-tauri/target/release/bundle/deb/adrata_1.0.2_amd64.deb
```

### Step 2: Copy Installers to Public Folder

**Windows:**
```cmd
copy src-tauri\target\release\bundle\msi\Adrata_1.0.2_x64_en-US.msi public\downloads\
```

**macOS:**
```bash
cp src-tauri/target/release/bundle/dmg/Adrata_1.0.2_universal.dmg public/downloads/
```

**Linux:**
```bash
cp src-tauri/target/release/bundle/deb/adrata_1.0.2_amd64.deb public/downloads/
```

### Step 3: Deploy to Vercel

**Option A: Manual Upload (Recommended for Large Files)**

1. Go to Vercel Dashboard → Your Project
2. Navigate to Storage or Settings
3. Upload files directly to the deployment
4. Files will be available at `/downloads/` path

**Option B: Git Commit (For Testing)**

```bash
# Temporarily allow installer files
git add -f public/downloads/*.msi
git add -f public/downloads/*.dmg
git add -f public/downloads/*.deb

git commit -m "Add desktop app installers"
git push origin main

# Vercel auto-deploys
```

**Option C: Vercel CLI**

```bash
# Deploy specific directory
vercel --prod

# Or deploy with environment
vercel deploy --prod
```

### Step 4: Test the Download

1. Visit https://www.adrata.com
2. Sign in as admin user
3. Click profile icon (top-right)
4. Click "Download" button
5. Should download the appropriate installer for your OS

## File Structure

```
public/
  downloads/
    README.md              # Documentation
    .gitkeep               # Ensures directory is tracked
    # Actual installers (gitignored, uploaded separately)
    Adrata_1.0.2_x64_en-US.msi      # Windows (gitignored)
    Adrata_1.0.2_universal.dmg      # macOS (gitignored)
    adrata_1.0.2_amd64.deb          # Linux (gitignored)
```

## Download URLs

Once deployed, installers are available at:
- **Windows**: https://www.adrata.com/downloads/Adrata_1.0.2_x64_en-US.msi
- **macOS**: https://www.adrata.com/downloads/Adrata_1.0.2_universal.dmg
- **Linux**: https://www.adrata.com/downloads/adrata_1.0.2_amd64.deb

## ProfileBox Component

The download button is already configured in `src/platform/ui/components/ProfileBox.tsx`:

```typescript
const handleDownloadDesktopApp = () => {
  const platform = navigator.platform.toLowerCase();
  const userAgent = navigator.userAgent.toLowerCase();
  
  let downloadUrl = '';
  
  if (platform.includes('mac') || userAgent.includes('mac')) {
    downloadUrl = '/downloads/Adrata_1.0.2_universal.dmg';
  } else if (platform.includes('win') || userAgent.includes('windows')) {
    downloadUrl = '/downloads/Adrata_1.0.2_x64_en-US.msi';
  } else {
    downloadUrl = '/downloads/adrata_1.0.2_amd64.deb';
  }
  
  // Trigger download
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = '';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
```

## Updating to New Version

When releasing a new version (e.g., v1.0.3):

1. **Update version in `src-tauri/tauri.conf.json`:**
   ```json
   {
     "version": "1.0.3"
   }
   ```

2. **Update version in `src-tauri/Cargo.toml`:**
   ```toml
   [package]
   version = "1.0.3"
   ```

3. **Update download URLs in `ProfileBox.tsx`** (if needed)

4. **Build new installers** (steps above)

5. **Replace files in `public/downloads/`**

6. **Deploy to Vercel**

## Troubleshooting

### Windows Build Issues
- **Error: "link.exe not found"**
  - Install Visual Studio Build Tools
  - Include C++ build tools workload

- **Error: "Antivirus blocking build"**
  - Temporarily disable real-time protection
  - Add exclusions for Rust build directories

### macOS Build Issues
- **Error: "xcode-select: error"**
  - Run: `xcode-select --install`
  - Accept the license: `sudo xcodebuild -license accept`

### Linux Build Issues
- **Error: "webkit2gtk not found"**
  - Install dependencies: `sudo apt install libwebkit2gtk-4.0-dev`

### Download Issues
- **404 on download**
  - Verify files exist in `public/downloads/`
  - Check Vercel deployment logs
  - Ensure files were uploaded correctly

- **Download button not showing**
  - Verify user is admin (`isAdminUser` flag)
  - Check that `isDesktop` is false (web context)
  - Inspect browser console for errors

## File Size Limits

**Vercel:**
- ✅ No file size limit for static assets
- ✅ 100GB bandwidth/month (Pro plan)
- ✅ Unlimited (Enterprise plan)

**Typical Sizes:**
- Windows MSI: ~50-80 MB
- macOS DMG: ~60-90 MB  
- Linux DEB: ~40-70 MB

## Security Considerations

1. **Code Signing** (Recommended for production):
   - Windows: Sign MSI with code signing certificate
   - macOS: Notarize app with Apple Developer account
   - Linux: Sign packages with GPG

2. **Checksum Verification**:
   - Generate SHA256 checksums
   - Publish on website for users to verify

3. **Auto-Update** (Future):
   - Configure Tauri updater
   - Use signed update manifests
   - Implement version checking

## Automated Deployment (Future)

Use GitHub Actions for fully automated builds:

1. **Workflow triggers** on version tag (e.g., `v1.0.3`)
2. **Builds all platforms** (Windows, macOS, Linux)
3. **Uploads to GitHub Releases**
4. **Copies to `public/downloads/`** via webhook
5. **Triggers Vercel deployment**
6. **Downloads available** automatically

See `.github/workflows/tauri-build.yml` for the workflow configuration.

## Support

For issues or questions:
1. Check this guide
2. Review build logs
3. Check Tauri documentation: https://tauri.app/
4. Check Vercel documentation: https://vercel.com/docs
