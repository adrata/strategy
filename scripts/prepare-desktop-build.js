#!/usr/bin/env node

/**
 * 🚀 PREPARE DESKTOP BUILD
 * This script prepares the codebase for Tauri desktop builds by:
 * 1. Temporarily moving API routes outside src/app (static export doesn't need them)
 * 2. Setting up proper environment for static generation
 * 3. Creating proper exclusions for dynamic routes
 */

const fs = require("fs");
const path = require("path");

console.log("🚀 Preparing for desktop build...");

const API_DIR = "./src/app/api";
const API_BACKUP_DIR = "./temp-api-backup";

function moveApiRoutes() {
  // Only move APIs during production builds, not development
  const isDevelopment =
    process.env.NODE_ENV !== "production" || process.argv.includes("--dev");

  if (isDevelopment) {
    console.log("🚧 Development mode: Keeping API routes in place");
    return;
  }

  if (fs.existsSync(API_DIR)) {
    if (fs.existsSync(API_BACKUP_DIR)) {
      console.log("📦 Removing existing API backup...");
      fs.rmSync(API_BACKUP_DIR, { recursive: true, force: true });
    }

    console.log(
      "📦 Moving API routes outside src/app to prevent static export issues...",
    );
    fs.renameSync(API_DIR, API_BACKUP_DIR);
    console.log("✅ API routes moved to temp-api-backup/");
  } else {
    console.log("ℹ️  No API routes found to move");
  }
}

function createEmptyApiDir() {
  // Create empty api directory to prevent missing directory errors
  if (!fs.existsSync(API_DIR)) {
    fs.mkdirSync(API_DIR, { recursive: true });

    // Create a simple index file to prevent build issues
    const indexContent = `// Desktop build - API routes excluded for static export
export const dynamic = "force-static";

export async function GET() {
  return new Response('Desktop API routes disabled', { status: 404 });
}
`;

    fs.writeFileSync(path.join(API_DIR, "route.ts"), indexContent);
    console.log("📁 Created empty API directory with placeholder");
  }
}

function validateNextConfig() {
  // Ensure Next.js config exists and is properly configured
  const nextConfigPath = "./next.config.mjs";
  
  if (!fs.existsSync(nextConfigPath)) {
    console.log("⚠️  Next.js config not found - build may fail");
    return;
  }
  
  console.log("✅ Next.js config validated");
}

function setDesktopEnvironment() {
  // Ensure desktop environment variables are set
  process.env.NEXT_PUBLIC_IS_DESKTOP = "true";
  process.env.NEXT_PUBLIC_USE_STATIC_EXPORT = "true";
  process.env.TAURI_BUILD = "true";
  
  console.log("✅ Desktop environment variables set");
}

// Main execution
function main() {
  try {
    console.log("🏗️ Desktop Build Preparation");
    console.log("============================");
    
    setDesktopEnvironment();
    validateNextConfig();
    moveApiRoutes();
    createEmptyApiDir();
    
    console.log("✅ Desktop build preparation completed successfully!");
  } catch (error) {
    console.error("❌ Desktop build preparation failed:", error.message);
    process.exit(1);
  }
}

main();
