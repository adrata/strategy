#!/usr/bin/env node

/**
 * 🔄 RESTORE API ROUTES
 * This script restores API routes that were moved during desktop builds
 * and ensures the development environment is properly restored
 */

const fs = require("fs");
const path = require("path");

console.log("🔄 Restoring API routes...");

const API_DIR = "./src/app/api";
const API_BACKUP_DIR = "./temp-api-backup";
const TAURI_BACKUP_DIR = "./.tauri-backup";

function restoreFromBackup() {
  if (fs.existsSync(API_BACKUP_DIR)) {
    // Remove current API directory if it exists
    if (fs.existsSync(API_DIR)) {
      console.log("🗑️  Removing current API directory...");
      fs.rmSync(API_DIR, { recursive: true, force: true });
    }

    console.log("📦 Restoring API routes from backup...");
    fs.renameSync(API_BACKUP_DIR, API_DIR);
    console.log("✅ API routes restored from temp-api-backup");
    return true;
  }

  if (fs.existsSync(TAURI_BACKUP_DIR)) {
    console.log("📦 Restoring from Tauri backup...");
    
    const backupApiDir = path.join(TAURI_BACKUP_DIR, "api");
    if (fs.existsSync(backupApiDir)) {
      if (fs.existsSync(API_DIR)) {
        fs.rmSync(API_DIR, { recursive: true, force: true });
      }
      
      // Ensure parent directory exists
      fs.mkdirSync(path.dirname(API_DIR), { recursive: true });
      fs.renameSync(backupApiDir, API_DIR);
      console.log("✅ API routes restored from Tauri backup");
      return true;
    }
  }

  return false;
}

function ensureApiDirectoryExists() {
  if (!fs.existsSync(API_DIR)) {
    console.log("📁 Creating API directory structure...");
    fs.mkdirSync(API_DIR, { recursive: true });
    
    // Create a basic health check route
    const healthRouteContent = `import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
}
`;
    
    fs.writeFileSync(path.join(API_DIR, "health", "route.ts"), healthRouteContent);
    fs.mkdirSync(path.join(API_DIR, "health"), { recursive: true });
    fs.writeFileSync(path.join(API_DIR, "health", "route.ts"), healthRouteContent);
    
    console.log("✅ Basic API structure created");
  }
}

function cleanupBackupDirectories() {
  const backupDirs = [API_BACKUP_DIR, TAURI_BACKUP_DIR];
  
  backupDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`🗑️  Cleaning up ${dir}...`);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
  
  console.log("✅ Backup directories cleaned up");
}

function validateApiRoutes() {
  if (!fs.existsSync(API_DIR)) {
    console.log("⚠️  API directory not found after restoration");
    return false;
  }

  const apiFiles = fs.readdirSync(API_DIR);
  console.log(`✅ API directory contains ${apiFiles.length} items`);
  
  return true;
}

// Main execution
function main() {
  try {
    console.log("🔄 API Routes Restoration");
    console.log("=========================");
    
    const restored = restoreFromBackup();
    
    if (!restored) {
      console.log("ℹ️  No backup found - ensuring API directory exists");
      ensureApiDirectoryExists();
    }
    
    validateApiRoutes();
    cleanupBackupDirectories();
    
    console.log("✅ API routes restoration completed successfully!");
  } catch (error) {
    console.error("❌ API routes restoration failed:", error.message);
    console.log("⚠️  Attempting to create basic API structure...");
    
    try {
      ensureApiDirectoryExists();
      console.log("✅ Basic API structure created as fallback");
    } catch (fallbackError) {
      console.error("❌ Fallback API creation failed:", fallbackError.message);
      process.exit(1);
    }
  }
}

main();
