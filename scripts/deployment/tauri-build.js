#!/usr/bin/env node

/**
 * TAURI BUILD - Custom build script for Tauri that handles API conflicts
 * This script builds the app and fixes API conflicts before static export
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

async function executeCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`📋 Executing: ${command} ${args.join(" ")}`);

    const child = spawn(command, args, {
      stdio: "inherit",
      env: process.env,
      shell: process.platform === "win32",
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on("error", reject);
  });
}

async function fixApiConflicts() {
  console.log("🔧 Fixing API export conflicts...");

  const conflictingFiles = [
    ".next/server/app/api.body",
    ".next/server/app/api.meta",
  ];

  conflictingFiles.forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`✅ Removed conflicting file: ${filePath}`);
      } catch (error) {
        console.error(`❌ Failed to remove ${filePath}:`, error.message);
      }
    } else {
      console.log(`ℹ️  File not found: ${filePath}`);
    }
  });

  console.log("✅ API conflict fix completed");
}

async function main() {
  try {
    console.log("🏗️ Building Next.js application for Tauri (online-only desktop app)...");

    // Step 1: Clean any existing build artifacts to prevent conflicts
    console.log("🧹 Cleaning build artifacts...");
    const cleanPaths = [path.join(__dirname, '..', '..', '.next'), path.join(__dirname, '..', '..', 'out')];
    for (const cleanPath of cleanPaths) {
      if (fs.existsSync(cleanPath)) {
        fs.rmSync(cleanPath, { recursive: true, force: true });
        console.log(`✅ Cleaned: ${cleanPath}`);
      }
    }

    // Step 2: Build with static export (enabled conditionally in next.config.mjs)
    console.log("📦 Building Next.js application with static export...");
    await executeCommand("npx", [
      "cross-env",
      "NODE_OPTIONS=--max-old-space-size=8192",
      "TAURI_BUILD=true",
      "NEXT_PUBLIC_IS_DESKTOP=true",
      // Set API base URL if not already set (defaults to https://adrata.com/api in desktop-config.ts)
      process.env.NEXT_PUBLIC_API_BASE_URL ? `NEXT_PUBLIC_API_BASE_URL=${process.env.NEXT_PUBLIC_API_BASE_URL}` : "",
      "next",
      "build",
    ].filter(Boolean)); // Remove empty strings
    console.log("✅ Next.js static export build completed");

    console.log("🎉 Tauri build preparation completed successfully!");
    console.log("ℹ️  Note: Next.js static export is configured in next.config.mjs");
    console.log("ℹ️  API calls will be routed to backend server (online-only mode)");
  } catch (error) {
    console.error("❌ Tauri build failed:", error.message);
    process.exit(1);
  }
}

main();
