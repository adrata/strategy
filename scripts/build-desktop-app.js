#!/usr/bin/env node

/**
 * Clean Tauri Desktop Build Script
 * 
 * This script creates a working desktop app by:
 * 1. Backing up the current Next.js config
 * 2. Using the desktop-specific config (next.config.desktop.mjs)
 * 3. Building Next.js with static export
 * 4. Building Tauri app
 * 5. Restoring the original config
 * 6. Copying the DMG to Desktop
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Clean Tauri Desktop Build...');
console.log('=====================================\n');

// Configuration
const DESKTOP_CONFIG = 'next.config.desktop.mjs';
const MAIN_CONFIG = 'next.config.mjs';
const BACKUP_CONFIG = 'next.config.mjs.backup';
const DESKTOP_POSTCSS = 'postcss.desktop.config.mjs';
const MAIN_POSTCSS = 'postcss.config.mjs';
const BACKUP_POSTCSS = 'postcss.config.mjs.backup';
const API_DIR = 'src/app/api';
const API_BACKUP_DIR = 'src/app/api.backup';
const OUTPUT_DIR = 'out';
const TAURI_DIR = 'src-tauri';
const DESKTOP_PATH = '/Users/rosssylvester/Desktop';

// Environment variables for desktop build
const desktopEnv = {
  ...process.env,
  TAURI_BUILD: 'true',
  NEXT_PUBLIC_IS_DESKTOP: 'true',
  NEXT_PUBLIC_USE_STATIC_EXPORT: 'true',
  NODE_ENV: 'production',
  ADRATA_VERBOSE_CONFIG: 'true'
};

function executeCommand(command, options = {}) {
  console.log(`📋 Executing: ${command}`);
  try {
    execSync(command, {
      stdio: 'inherit',
      env: { ...desktopEnv, ...options.env },
      ...options
    });
    return true;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error.message);
    return false;
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function copyFile(src, dest) {
  try {
    fs.copyFileSync(src, dest);
    console.log(`✅ Copied ${src} → ${dest}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to copy ${src} → ${dest}:`, error.message);
    return false;
  }
}

function cleanup() {
  console.log('\n🧹 Cleaning up...');
  
  // Restore original configs if backups exist
  if (fileExists(BACKUP_CONFIG)) {
    if (copyFile(BACKUP_CONFIG, MAIN_CONFIG)) {
      fs.unlinkSync(BACKUP_CONFIG);
      console.log('✅ Restored original Next.js config');
    }
  }
  
  if (fileExists(BACKUP_POSTCSS)) {
    if (copyFile(BACKUP_POSTCSS, MAIN_POSTCSS)) {
      fs.unlinkSync(BACKUP_POSTCSS);
      console.log('✅ Restored original PostCSS config');
    }
  }
  
  // Restore API directory if backup exists
  if (fileExists(API_BACKUP_DIR)) {
    try {
      if (fileExists(API_DIR)) {
        fs.rmSync(API_DIR, { recursive: true, force: true });
      }
      fs.renameSync(API_BACKUP_DIR, API_DIR);
      console.log('✅ Restored API routes');
    } catch (error) {
      console.warn('⚠️ Could not restore API routes:', error.message);
    }
  } else {
    console.log('ℹ️ API backup directory was removed during build (this is normal for desktop builds)');
  }
  
  // Clean up build artifacts
  if (fileExists(OUTPUT_DIR)) {
    try {
      fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
      console.log('✅ Cleaned up output directory');
    } catch (error) {
      console.warn('⚠️ Could not clean output directory:', error.message);
    }
  }
}

async function main() {
  try {
    // Step 1: Verify prerequisites
    console.log('🔍 Verifying prerequisites...');
    
    if (!fileExists(DESKTOP_CONFIG)) {
      throw new Error(`Desktop config not found: ${DESKTOP_CONFIG}`);
    }
    
    if (!fileExists(MAIN_CONFIG)) {
      throw new Error(`Main config not found: ${MAIN_CONFIG}`);
    }
    
    if (!fileExists(TAURI_DIR)) {
      throw new Error(`Tauri directory not found: ${TAURI_DIR}`);
    }
    
    if (!fileExists(DESKTOP_POSTCSS)) {
      throw new Error(`Desktop PostCSS config not found: ${DESKTOP_POSTCSS}`);
    }
    
    if (!fileExists(API_DIR)) {
      throw new Error(`API directory not found: ${API_DIR}`);
    }
    
    console.log('✅ Prerequisites verified\n');
    
    // Step 2: Backup current configs
    console.log('💾 Backing up current configs...');
    if (!copyFile(MAIN_CONFIG, BACKUP_CONFIG)) {
      throw new Error('Failed to backup main config');
    }
    if (!copyFile(MAIN_POSTCSS, BACKUP_POSTCSS)) {
      throw new Error('Failed to backup PostCSS config');
    }
    
    // Step 3: Switch to desktop configs
    console.log('🔄 Switching to desktop configuration...');
    if (!copyFile(DESKTOP_CONFIG, MAIN_CONFIG)) {
      throw new Error('Failed to switch to desktop config');
    }
    if (!copyFile(DESKTOP_POSTCSS, MAIN_POSTCSS)) {
      throw new Error('Failed to switch to desktop PostCSS config');
    }
    
    // Step 4: Temporarily move API routes (not needed for desktop)
    console.log('📁 Temporarily moving API routes...');
    try {
      if (fileExists(API_BACKUP_DIR)) {
        fs.rmSync(API_BACKUP_DIR, { recursive: true, force: true });
      }
      fs.renameSync(API_DIR, API_BACKUP_DIR);
      console.log('✅ API routes moved temporarily');
    } catch (error) {
      throw new Error(`Failed to move API routes: ${error.message}`);
    }
    
    // Step 4.5: Remove API backup directory to avoid import conflicts
    console.log('🗑️ Removing API backup directory to avoid import conflicts...');
    try {
      if (fileExists(API_BACKUP_DIR)) {
        fs.rmSync(API_BACKUP_DIR, { recursive: true, force: true });
        console.log('✅ API backup directory removed');
      }
    } catch (error) {
      console.warn('⚠️ Could not remove API backup directory:', error.message);
    }
    
    // Step 5: Clean previous builds
    console.log('\n🧹 Cleaning previous builds...');
    executeCommand('npm run clean');
    
    // Step 6: Install dependencies
    console.log('\n📦 Installing dependencies...');
    if (!executeCommand('npm install')) {
      throw new Error('Failed to install dependencies');
    }
    
    // Step 7: Build Next.js with static export
    console.log('\n🏗️ Building Next.js with static export...');
    if (!executeCommand('npm run build')) {
      throw new Error('Failed to build Next.js app');
    }
    
    // Verify output directory exists
    if (!fileExists(OUTPUT_DIR)) {
      throw new Error(`Output directory not created: ${OUTPUT_DIR}`);
    }
    
    console.log('✅ Next.js build completed successfully');
    
    // Step 8: Build Tauri app
    console.log('\n🦀 Building Tauri application...');
    
    // Change to Tauri directory for build
    process.chdir(TAURI_DIR);
    
    if (!executeCommand('cargo tauri build --target universal-apple-darwin')) {
      throw new Error('Failed to build Tauri app');
    }
    
    console.log('✅ Tauri build completed successfully');
    
    // Step 9: Find and copy DMG to Desktop
    console.log('\n📦 Locating build artifacts...');
    
    const dmgPath = path.join('target', 'universal-apple-darwin', 'release', 'bundle', 'dmg');
    
    if (!fileExists(dmgPath)) {
      throw new Error(`DMG directory not found: ${dmgPath}`);
    }
    
    // Find the DMG file
    const dmgFiles = fs.readdirSync(dmgPath).filter(file => file.endsWith('.dmg'));
    
    if (dmgFiles.length === 0) {
      throw new Error('No DMG file found in build output');
    }
    
    const dmgFile = dmgFiles[0];
    const sourcePath = path.join(dmgPath, dmgFile);
    const destPath = path.join(DESKTOP_PATH, dmgFile);
    
    console.log(`📁 Found DMG: ${dmgFile}`);
    console.log(`📋 Size: ${(fs.statSync(sourcePath).size / 1024 / 1024).toFixed(2)} MB`);
    
    // Copy to Desktop
    if (!copyFile(sourcePath, destPath)) {
      throw new Error('Failed to copy DMG to Desktop');
    }
    
    console.log(`\n🎉 SUCCESS! Desktop app built and saved to Desktop`);
    console.log(`📱 File: ${dmgFile}`);
    console.log(`📍 Location: ${destPath}`);
    console.log(`\n🚀 You can now install and run the desktop app!`);
    
  } catch (error) {
    console.error(`\n❌ Build failed: ${error.message}`);
    process.exit(1);
  } finally {
    // Always cleanup
    cleanup();
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⚠️ Build interrupted by user');
  cleanup();
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('\n❌ Unexpected error:', error.message);
  cleanup();
  process.exit(1);
});

// Run the build
main().catch((error) => {
  console.error('\n❌ Build failed:', error.message);
  cleanup();
  process.exit(1);
});
