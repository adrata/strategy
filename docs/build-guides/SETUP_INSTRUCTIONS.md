# 🚀 Desktop App Download Setup - Complete Instructions

## Current Status
✅ **Infrastructure Ready**: Downloads folder, scripts, and documentation created  
⚠️ **Blocked**: Need Visual Studio Build Tools to compile Rust/Tauri

## What We've Built

### ✅ Completed Infrastructure
- `public/downloads/` folder created
- `.gitignore` configured for installer files
- `build-and-deploy-desktop.bat` automated build script
- `DESKTOP_APP_DEPLOYMENT.md` comprehensive guide
- ProfileBox download button already configured

### ⚠️ Current Blocker
**Error**: `linker 'link.exe' not found`

**Solution**: Install Visual Studio Build Tools 2022

## Step-by-Step Solution

### Step 1: Install Visual Studio Build Tools (REQUIRED)

1. **Download**: https://visualstudio.microsoft.com/downloads/
2. **Select**: "Build Tools for Visual Studio 2022"
3. **Install with**: "C++ build tools" workload
4. **Restart**: Your computer after installation

### Step 2: Verify Installation

Open a **new** command prompt and run:
```cmd
where cl
where link
```

Both should return paths to Visual Studio tools.

### Step 3: Build the App

Once Visual Studio Build Tools are installed:

```cmd
# Run the automated build script
.\build-and-deploy-desktop.bat
```

This will:
- ✅ Configure Rust toolchain
- ✅ Install Tauri CLI
- ✅ Build Windows MSI installer
- ✅ Copy to `public/downloads/`
- ✅ Show deployment instructions

### Step 4: Deploy to Vercel

**Option A - Git Commit (Recommended for testing):**
```cmd
git add public/downloads/README.md
git add public/downloads/.gitkeep
git add -f public/downloads/Adrata_1.0.2_x64_en-US.msi
git commit -m "Add Windows desktop app installer"
git push origin main
```

**Option B - Manual Upload (Recommended for production):**
1. Go to Vercel Dashboard
2. Navigate to your project
3. Upload `public/downloads/Adrata_1.0.2_x64_en-US.msi`
4. Redeploy

### Step 5: Test Download

1. Visit https://www.adrata.com
2. Sign in as admin user
3. Click profile icon (top-right)
4. Click "Download" button
5. Should download Windows MSI installer

## Alternative: Test Without Building

If you want to test the download functionality without building:

### Create a Test Installer

1. **Create a dummy MSI file:**
```cmd
echo "This is a test installer" > public\downloads\Adrata_1.0.2_x64_en-US.msi
```

2. **Test locally:**
```cmd
npm run dev
# Visit http://localhost:3000
# Try the download button
```

3. **Deploy test:**
```cmd
git add public/downloads/Adrata_1.0.2_x64_en-US.msi
git commit -m "Add test installer"
git push origin main
```

## File Structure (Current)

```
public/
  downloads/
    README.md              ✅ Created
    .gitkeep               ✅ Created
    # Adrata_1.0.2_x64_en-US.msi  ⏳ Will be created after build
```

## Expected Download URLs

Once deployed:
- **Windows**: https://www.adrata.com/downloads/Adrata_1.0.2_x64_en-US.msi
- **macOS**: https://www.adrata.com/downloads/Adrata_1.0.2_universal.dmg (future)
- **Linux**: https://www.adrata.com/downloads/adrata_1.0.2_amd64.deb (future)

## ProfileBox Integration

The download button is already configured in `src/platform/ui/components/ProfileBox.tsx`:

```typescript
// Lines 480-508
const handleDownloadDesktopApp = () => {
  // Platform detection
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

## Troubleshooting

### "link.exe not found"
- **Solution**: Install Visual Studio Build Tools with C++ workload
- **Verify**: Run `where link` in command prompt

### "Antivirus blocking build"
- **Solution**: Temporarily disable real-time protection
- **Alternative**: Add exclusions for Rust build directories

### "Download button not showing"
- **Check**: User must be admin (`isAdminUser` flag)
- **Check**: Must be web context (not desktop app)
- **Check**: Browser console for errors

### "404 on download"
- **Check**: File exists in `public/downloads/`
- **Check**: Vercel deployment successful
- **Check**: File uploaded correctly

## Next Steps Summary

1. **Install Visual Studio Build Tools** (required)
2. **Run build script**: `.\build-and-deploy-desktop.bat`
3. **Deploy to Vercel** (git push or manual upload)
4. **Test download** from profile popup

## Files Ready for You

- ✅ `build-and-deploy-desktop.bat` - Automated build script
- ✅ `DESKTOP_APP_DEPLOYMENT.md` - Full deployment guide
- ✅ `public/downloads/README.md` - User installation guide
- ✅ `.gitignore` - Configured for installer files

**You're literally one Visual Studio Build Tools installation away from having working desktop app downloads!** 🚀
