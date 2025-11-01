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

/**
 * Add static export configuration to API routes that need it
 */
async function configureApiRoutesForStaticExport() {
  console.log("🔧 Configuring API routes for static export...");

  const apiDir = path.join(__dirname, '..', '..', 'src', 'app', 'api');
  if (!fs.existsSync(apiDir)) {
    console.log("ℹ️  No API directory found, skipping...");
    return;
  }

  const routeFiles = [];
  
  // Recursively find all route.ts files
  function findRouteFiles(dir) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      try {
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          findRouteFiles(fullPath);
        } else if (item === 'route.ts' || item === 'route.tsx') {
          routeFiles.push(fullPath);
        }
      } catch (error) {
        // Skip if can't read
      }
    }
  }

  findRouteFiles(apiDir);
  
  let modifiedCount = 0;
  const backupDir = path.join(__dirname, '..', '..', '.api-routes-backup');
  
  // Create backup directory
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Process each route file
  for (const filePath of routeFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check if file already has dynamic export
      if (content.includes('export const dynamic')) {
        continue; // Skip if already configured
      }
      
      // Check if file has exports - if not, might be a special case
      if (!content.includes('export')) {
        continue;
      }
      
      // Create backup
      const relativePath = path.relative(apiDir, filePath);
      const backupPath = path.join(backupDir, relativePath);
      const backupFileDir = path.dirname(backupPath);
      if (!fs.existsSync(backupFileDir)) {
        fs.mkdirSync(backupFileDir, { recursive: true });
      }
      fs.copyFileSync(filePath, backupPath);
      
      // Add dynamic export after imports but before other exports
      const lines = content.split('\n');
      let insertIndex = 0;
      
      // Find the end of imports (first non-import/comment line or first export)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === '' || line.startsWith('//') || line.startsWith('import') || line.startsWith('/*')) {
          insertIndex = i + 1;
        } else if (line.startsWith('export')) {
          // Found first export statement, insert before it
          insertIndex = i;
          break;
        } else {
          // Found non-import, non-comment, non-export line - insert here
          insertIndex = i;
          break;
        }
      }
      
      // Insert dynamic export configuration
      const dynamicExport = "// Required for static export (desktop build)\nexport const dynamic = 'force-static';\n";
      lines.splice(insertIndex, 0, dynamicExport);
      
      // Write updated content
      fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
      modifiedCount++;
      
    } catch (error) {
      console.error(`⚠️  Failed to process ${filePath}:`, error.message);
    }
  }
  
  if (modifiedCount > 0) {
    console.log(`✅ Added static export config to ${modifiedCount} API route(s)`);
  } else {
    console.log("ℹ️  No API routes needed configuration");
  }
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

    // Step 2: Configure API routes for static export
    await configureApiRoutesForStaticExport();

    // Step 3: Build with static export (enabled conditionally in next.config.mjs)
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
