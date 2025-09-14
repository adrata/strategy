#!/usr/bin/env node

/**
 * 🔄 RESTORE DESKTOP BUILD
 * This script restores the codebase after Tauri desktop builds by:
 * 1. Moving API routes back to src/app
 * 2. Cleaning up temporary files
 * 3. Restoring normal development environment
 */

const fs = require("fs");
const path = require("path");

console.log("🔄 Restoring after desktop build...");

const API_DIR = "./src/app/api";
const API_BACKUP_DIR = "./temp-api-backup";

function restoreApiRoutes() {
  if (fs.existsSync(API_BACKUP_DIR)) {
    // Remove the placeholder API directory if it exists
    if (fs.existsSync(API_DIR)) {
      console.log("🗑️  Removing placeholder API directory...");
      fs.rmSync(API_DIR, { recursive: true, force: true });
    }

    console.log("📦 Restoring API routes to src/app/api...");
    fs.renameSync(API_BACKUP_DIR, API_DIR);
    console.log("✅ API routes restored successfully");
  } else {
    console.log("ℹ️  No API backup found to restore");
  }
}

function cleanupTempFiles() {
  const tempFiles = [
    "./temp-api-backup",
    "./.tauri-backup",
    "./out", // Next.js static export output
  ];

  tempFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`🗑️  Cleaning up ${file}...`);
      fs.rmSync(file, { recursive: true, force: true });
    }
  });

  console.log("✅ Temporary files cleaned up");
}

function restoreEnvironment() {
  // Clear desktop-specific environment variables
  delete process.env.NEXT_PUBLIC_USE_STATIC_EXPORT;
  delete process.env.TAURI_BUILD;
  
  console.log("✅ Environment variables restored");
}

// Main execution
function main() {
  try {
    console.log("🔄 Desktop Build Restoration");
    console.log("============================");
    
    restoreApiRoutes();
    cleanupTempFiles();
    restoreEnvironment();
    
    console.log("✅ Desktop build restoration completed successfully!");
  } catch (error) {
    console.error("❌ Desktop build restoration failed:", error.message);
    // Don't exit with error code - restoration issues shouldn't break builds
    console.log("⚠️  Continuing despite restoration issues...");
  }
}

main();
