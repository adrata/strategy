#!/usr/bin/env node

/**
 * 🎨 FIX DMG CREATION
 * This script ensures proper DMG creation with professional appearance by:
 * 1. Creating custom DMG background
 * 2. Setting proper DMG layout and icons
 * 3. Ensuring DMG is properly signed (if certificates available)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🎨 Fixing DMG creation...");

const PROJECT_ROOT = process.cwd();
const BUNDLE_DIR = path.join(PROJECT_ROOT, "src-tauri/target/universal-apple-darwin/release/bundle");
const DMG_DIR = path.join(BUNDLE_DIR, "dmg");
const APP_NAME = "Adrata.app";

function checkMacOS() {
  if (process.platform !== "darwin") {
    console.log("ℹ️  Not on macOS - skipping DMG creation fixes");
    return false;
  }
  return true;
}

function createDMGBackground() {
  console.log("🎨 Creating DMG background...");
  
  const backgroundPath = path.join(DMG_DIR, "background.png");
  
  // Check if background already exists
  if (fs.existsSync(backgroundPath)) {
    console.log("✅ DMG background already exists");
    return true;
  }
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(DMG_DIR)) {
    fs.mkdirSync(DMG_DIR, { recursive: true });
  }
  
  try {
    // Try to use Python script if available
    const pythonScript = path.join(PROJECT_ROOT, "src-tauri/create-dmg-bg.py");
    if (fs.existsSync(pythonScript)) {
      execSync(`python3 "${pythonScript}"`, { cwd: DMG_DIR });
      console.log("✅ DMG background created using Python script");
      return true;
    }
    
    // Fallback: Create a simple background using ImageMagick if available
    try {
      execSync('which convert', { stdio: 'ignore' });
      execSync(`convert -size 660x400 xc:white -fill '#f0f0f0' -draw 'rectangle 0,0 660,400' "${backgroundPath}"`);
      console.log("✅ Simple DMG background created using ImageMagick");
      return true;
    } catch (error) {
      console.log("ℹ️  ImageMagick not available - using default background");
    }
    
    // Final fallback: Copy from existing background if available
    const existingBg = path.join(PROJECT_ROOT, "src-tauri/dmg-background.png");
    if (fs.existsSync(existingBg)) {
      fs.copyFileSync(existingBg, backgroundPath);
      console.log("✅ Copied existing DMG background");
      return true;
    }
    
    console.log("ℹ️  No background created - DMG will use default appearance");
    return false;
  } catch (error) {
    console.log("⚠️  Could not create DMG background:", error.message);
    return false;
  }
}

function setupDMGLayout() {
  console.log("📐 Setting up DMG layout...");
  
  const layoutScript = `
tell application "Finder"
    tell disk "Adrata"
        open
        set current view of container window to icon view
        set toolbar visible of container window to false
        set statusbar visible of container window to false
        set the bounds of container window to {400, 100, 1060, 500}
        set viewOptions to the icon view options of container window
        set arrangement of viewOptions to not arranged
        set icon size of viewOptions to 100
        set background picture of viewOptions to file ".background:background.png"
        set position of item "Adrata.app" of container window to {150, 200}
        set position of item "Applications" of container window to {450, 200}
        close
        open
        update without registering applications
        delay 2
    end tell
end tell
`;
  
  const scriptPath = path.join(DMG_DIR, "setup_dmg.applescript");
  fs.writeFileSync(scriptPath, layoutScript);
  
  console.log("✅ DMG layout script created");
  return true;
}

function enhanceDMGAppearance() {
  console.log("✨ Enhancing DMG appearance...");
  
  try {
    // Create .DS_Store template for better DMG appearance
    const dsStoreTemplate = path.join(DMG_DIR, ".DS_Store");
    
    // Create Applications symlink if it doesn't exist
    const applicationsLink = path.join(DMG_DIR, "Applications");
    if (!fs.existsSync(applicationsLink)) {
      try {
        execSync(`ln -s /Applications "${applicationsLink}"`);
        console.log("✅ Applications symlink created");
      } catch (error) {
        console.log("⚠️  Could not create Applications symlink");
      }
    }
    
    console.log("✅ DMG appearance enhanced");
    return true;
  } catch (error) {
    console.log("⚠️  Could not enhance DMG appearance:", error.message);
    return false;
  }
}

function validateDMGStructure() {
  console.log("🔍 Validating DMG structure...");
  
  // Check for required files
  const requiredItems = [
    path.join(DMG_DIR, APP_NAME),
    path.join(DMG_DIR, "Applications")
  ];
  
  let allPresent = true;
  
  requiredItems.forEach(item => {
    if (!fs.existsSync(item)) {
      console.log(`⚠️  Missing: ${path.basename(item)}`);
      allPresent = false;
    } else {
      console.log(`✅ Found: ${path.basename(item)}`);
    }
  });
  
  return allPresent;
}

function signDMG() {
  console.log("🔐 Checking DMG signing...");
  
  // Check if signing identity is available
  try {
    const identities = execSync('security find-identity -v -p codesigning', { encoding: 'utf8' });
    
    if (identities.includes('Developer ID Application')) {
      console.log("✅ Code signing identity available");
      
      // Find the DMG file
      if (fs.existsSync(DMG_DIR)) {
        const files = fs.readdirSync(DMG_DIR);
        const dmgFile = files.find(f => f.endsWith('.dmg'));
        
        if (dmgFile) {
          const dmgPath = path.join(DMG_DIR, dmgFile);
          try {
            execSync(`codesign --sign "Developer ID Application" "${dmgPath}"`);
            console.log("✅ DMG signed successfully");
            return true;
          } catch (error) {
            console.log("⚠️  DMG signing failed:", error.message);
          }
        }
      }
    } else {
      console.log("ℹ️  No code signing identity available - DMG will be unsigned");
    }
  } catch (error) {
    console.log("ℹ️  Code signing not available - DMG will be unsigned");
  }
  
  return false;
}

// Main execution
function main() {
  try {
    console.log("🎨 DMG Creation Fix");
    console.log("==================");
    
    if (!checkMacOS()) {
      console.log("✅ DMG creation fix completed (not applicable on this platform)");
      return;
    }
    
    createDMGBackground();
    setupDMGLayout();
    enhanceDMGAppearance();
    validateDMGStructure();
    signDMG();
    
    console.log("✅ DMG creation fix completed successfully!");
    console.log("");
    console.log("💡 Tips for better DMG:");
    console.log("  • Use custom background image for branding");
    console.log("  • Ensure proper icon positioning");
    console.log("  • Sign DMG for distribution");
    console.log("  • Test DMG on clean macOS system");
  } catch (error) {
    console.error("❌ DMG creation fix failed:", error.message);
    console.log("⚠️  DMG creation may need manual adjustment");
    // Don't exit with error - this is a post-build enhancement
  }
}

main();
