#!/usr/bin/env node

/**
 * RESTORE API ROUTES - Fix Build Process
 * This script restores API routes from temp-api-backup and prevents future issues
 */

const fs = require("fs");
const path = require("path");

console.log("🔧 Restoring API routes...");

const API_DIR = "./src/app/api";
const API_BACKUP_DIR = "./temp-api-backup";

function restoreApiRoutes() {
  // Check if backup exists
  if (!fs.existsSync(API_BACKUP_DIR)) {
    console.log("ℹ️  No API backup found - APIs are likely already in place");
    return true;
  }

  // Remove empty API directory if it exists
  if (fs.existsSync(API_DIR)) {
    console.log("📦 Removing placeholder API directory...");
    fs.rmSync(API_DIR, { recursive: true, force: true });
  }

  // Restore APIs from backup
  console.log("📦 Restoring API routes from backup...");
  fs.renameSync(API_BACKUP_DIR, API_DIR);
  console.log("✅ API routes restored successfully!");

  return true;
}

function validateRestoration() {
  if (!fs.existsSync(API_DIR)) {
    console.error("❌ API directory missing after restoration");
    return false;
  }

  // Count API routes
  const apiRoutes = [];

  function findRoutes(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      if (fs.statSync(fullPath).isDirectory()) {
        findRoutes(fullPath);
      } else if (item === "route.ts") {
        apiRoutes.push(fullPath);
      }
    }
  }

  findRoutes(API_DIR);

  console.log("✅ Restored", apiRoutes.length, "API routes:");
  apiRoutes.forEach((route) => {
    console.log("  -", route);
  });

  return apiRoutes.length > 0;
}

function main() {
  try {
    if (restoreApiRoutes() && validateRestoration()) {
      console.log("✅ API routes restoration completed successfully");
      console.log("💡 APIs are now available for development and production");
    } else {
      console.error("❌ API routes restoration failed");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error restoring API routes:", error);
    process.exit(1);
  }
}

main();
