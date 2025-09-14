#!/usr/bin/env node

/**
 * TAURI BUILD - Custom build script for Tauri that handles API conflicts
 * This script builds the app and fixes API conflicts before static export
 */

const { spawn } = require("child_process");
const fs = require("fs");

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
    console.log("🏗️ Building Next.js application for Tauri...");

    // Step 1: Clean any existing build artifacts to prevent conflicts
    console.log("🧹 Cleaning build artifacts...");
    await executeCommand("rm", ["-rf", ".next", "out"]);

    // Step 2: Run a standard Next.js build first (without export)
    console.log("📦 Building Next.js application...");
    await executeCommand("npx", [
      "cross-env",
      "NODE_OPTIONS=--max-old-space-size=8192",
      "TAURI_BUILD=true",
      "NEXT_PUBLIC_IS_DESKTOP=true",
      "next",
      "build",
    ]);
    console.log("✅ Next.js build completed");

    // Step 3: Fix API conflicts before export
    console.log("🔧 Fixing API conflicts before export...");
    await fixApiConflicts();

    // Step 4: Run second build with export enabled (Next.js 15 approach)
    console.log("📦 Running static export build...");
    await executeCommand("npx", [
      "cross-env",
      "NODE_OPTIONS=--max-old-space-size=8192",
      "TAURI_BUILD=true",
      "TAURI_EXPORT=true",
      "NEXT_PUBLIC_IS_DESKTOP=true",
      "next",
      "build",
    ]);
    console.log("✅ Static export completed");

    console.log("🎉 Tauri build completed successfully!");
  } catch (error) {
    console.error("❌ Tauri build failed:", error.message);
    process.exit(1);
  }
}

main();
