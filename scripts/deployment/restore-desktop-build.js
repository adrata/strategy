#!/usr/bin/env node

/**
 * CRITICAL: Restore After Desktop Build
 * This script restores the codebase after Tauri desktop builds by:
 * 1. Restoring API routes from backup outside src/app
 * 2. Cleaning up temporary changes
 */

const fs = require("fs");
const path = require("path");

console.log("🔄 Restoring after desktop build...");

const API_DIR = "./src/app/api";
const API_BACKUP_DIR = "./temp-api-backup"; // Match the new backup location

function restoreApiRoutes() {
  if (fs.existsSync(API_BACKUP_DIR)) {
    console.log("📦 Restoring API routes from backup...");

    // Remove empty api directory if it exists
    if (fs.existsSync(API_DIR)) {
      fs.rmSync(API_DIR, { recursive: true, force: true });
    }

    // Restore from backup
    fs.renameSync(API_BACKUP_DIR, API_DIR);
    console.log("✅ API routes restored");
  } else {
    console.log("ℹ️  No API backup found to restore");
  }
}

function main() {
  try {
    restoreApiRoutes();
    console.log("✅ Desktop build restoration complete");
  } catch (error) {
    console.error("❌ Error restoring after desktop build:", error);
    process.exit(1);
  }
}

main();
