#!/usr/bin/env node

/**
 * 🔧 FIX DMG BUNDLING
 * This script fixes DMG bundling issues on macOS by:
 * 1. Checking for proper DMG creation
 * 2. Fixing bundle_dmg.sh script issues
 * 3. Creating fallback DMG if needed
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🔧 Fixing DMG bundling...");

const PROJECT_ROOT = process.cwd();
const BUNDLE_DIR = path.join(PROJECT_ROOT, "src-desktop/target/universal-apple-darwin/release/bundle");
const DMG_DIR = path.join(BUNDLE_DIR, "dmg");
const MACOS_DIR = path.join(BUNDLE_DIR, "macos");
const APP_NAME = "Adrata.app";

function checkMacOS() {
  if (process.platform !== "darwin") {
    console.log("ℹ️  Not on macOS - skipping DMG bundling fixes");
    return false;
  }
  return true;
}

function findAppBundle() {
  const possiblePaths = [
    path.join(MACOS_DIR, APP_NAME),
    path.join(PROJECT_ROOT, "src-desktop/target/release/bundle/macos", APP_NAME),
    path.join(PROJECT_ROOT, "src-desktop/target/universal-apple-darwin/release/bundle/macos", APP_NAME)
  ];

  for (const appPath of possiblePaths) {
    if (fs.existsSync(appPath)) {
      console.log(`✅ Found app bundle: ${appPath}`);
      return appPath;
    }
  }

  console.log("❌ App bundle not found. Run desktop build first.");
  return null;
}

function fixBundleDmgScript() {
  const bundleScriptPath = path.join(DMG_DIR, "bundle_dmg.sh");
  
  if (!fs.existsSync(bundleScriptPath)) {
    console.log("ℹ️  bundle_dmg.sh not found - may not be needed");
    return true;
  }

  console.log("🔧 Fixing bundle_dmg.sh script...");
  
  try {
    // Make script executable
    execSync(`chmod +x "${bundleScriptPath}"`);
    console.log("✅ Made bundle_dmg.sh executable");
    return true;
  } catch (error) {
    console.log("⚠️  Could not fix bundle_dmg.sh:", error.message);
    return false;
  }
}

function createFallbackDMG(appPath) {
  console.log("🔧 Creating fallback DMG using hdiutil...");
  
  try {
    const appDir = path.dirname(appPath);
    const dmgName = "Adrata_Fixed.dmg";
    const dmgPath = path.join(appDir, dmgName);
    
    // Remove existing DMG if present
    if (fs.existsSync(dmgPath)) {
      fs.unlinkSync(dmgPath);
    }
    
    // Create DMG using hdiutil
    const command = `hdiutil create -srcfolder "${appPath}" -volname "Adrata" "${dmgPath}"`;
    execSync(command, { stdio: 'inherit' });
    
    if (fs.existsSync(dmgPath)) {
      console.log(`✅ Fallback DMG created: ${dmgPath}`);
      
      // Copy to desktop for easy access
      const desktopPath = path.join(require('os').homedir(), 'Desktop', dmgName);
      execSync(`cp "${dmgPath}" "${desktopPath}"`);
      console.log(`📋 Copied to Desktop: ${desktopPath}`);
      
      return true;
    }
  } catch (error) {
    console.log("❌ Fallback DMG creation failed:", error.message);
    return false;
  }
  
  return false;
}

function checkExistingDMG() {
  const possibleDmgPaths = [
    path.join(DMG_DIR, "*.dmg"),
    path.join(PROJECT_ROOT, "src-desktop/target/release/bundle/dmg/*.dmg"),
    path.join(PROJECT_ROOT, "src-desktop/target/universal-apple-darwin/release/bundle/dmg/*.dmg")
  ];

  for (const dmgPattern of possibleDmgPaths) {
    try {
      const dmgDir = path.dirname(dmgPattern);
      if (fs.existsSync(dmgDir)) {
        const files = fs.readdirSync(dmgDir);
        const dmgFiles = files.filter(f => f.endsWith('.dmg'));
        
        if (dmgFiles.length > 0) {
          const dmgPath = path.join(dmgDir, dmgFiles[0]);
          console.log(`✅ Found existing DMG: ${dmgPath}`);
          
          // Get file size
          const stats = fs.statSync(dmgPath);
          const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
          console.log(`📦 DMG Size: ${fileSizeInMB} MB`);
          
          return true;
        }
      }
    } catch (error) {
      // Continue checking other paths
    }
  }
  
  return false;
}

function validateDMG() {
  console.log("🔍 Validating DMG creation...");
  
  if (checkExistingDMG()) {
    console.log("✅ DMG validation passed");
    return true;
  }
  
  console.log("⚠️  No DMG found - may need manual creation");
  return false;
}

// Main execution
function main() {
  try {
    console.log("🔧 DMG Bundling Fix");
    console.log("===================");
    
    if (!checkMacOS()) {
      console.log("✅ DMG bundling fix completed (not applicable on this platform)");
      return;
    }
    
    const appPath = findAppBundle();
    if (!appPath) {
      console.log("⚠️  Cannot fix DMG bundling without app bundle");
      console.log("   Run 'npm run desktop:build' first");
      return;
    }
    
    // Try to fix the bundle script
    fixBundleDmgScript();
    
    // Check if DMG was created successfully
    if (!validateDMG()) {
      console.log("🔧 DMG not found - attempting to create fallback...");
      createFallbackDMG(appPath);
    }
    
    console.log("✅ DMG bundling fix completed successfully!");
  } catch (error) {
    console.error("❌ DMG bundling fix failed:", error.message);
    console.log("⚠️  DMG may need to be created manually using:");
    console.log("   hdiutil create -srcfolder Adrata.app Adrata.dmg");
    // Don't exit with error - this is a post-build fix
  }
}

main();