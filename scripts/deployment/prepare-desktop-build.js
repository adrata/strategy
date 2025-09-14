#!/usr/bin/env node

/**
 * CRITICAL: Prepare for Desktop Build
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
  const nextConfigPath = "./next.config.js";

  if (fs.existsSync(nextConfigPath)) {
    console.log(
      "✅ Next.js config exists (conditional static export configured)",
    );
  } else {
    console.log("ℹ️  Next.js config will use default configuration");
  }
}

function validatePreparation() {
  const checks = [
    { path: API_BACKUP_DIR, name: "API backup directory" },
    { path: API_DIR, name: "Empty API directory" },
  ];

  let allValid = true;

  for (const check of checks) {
    if (fs.existsSync(check.path)) {
      console.log(`✅ ${check.name} exists`);
    } else {
      console.log(`❌ ${check.name} missing`);
      allValid = false;
    }
  }

  return allValid;
}

function setDesktopEnvironmentVariables() {
  console.log("🔧 Setting comprehensive desktop environment variables...");

  // CORE DESKTOP VARIABLES
  process.env.NODE_ENV = "production";
  process.env.NEXT_PUBLIC_IS_DESKTOP = "true";
  process.env.NEXT_PUBLIC_USE_STATIC_EXPORT = "true";
  process.env.TAURI_BUILD = "true";

  // DATABASE (Production Neon)
  process.env.DATABASE_URL =
    "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require";
  process.env.POSTGRES_URL = process.env.DATABASE_URL;
  process.env.POSTGRES_PRISMA_URL = process.env.DATABASE_URL;
  process.env.POSTGRES_URL_NON_POOLING = process.env.DATABASE_URL;

  // AUTHENTICATION
  process.env.NEXTAUTH_URL = "http://localhost:3000";
  process.env.NEXTAUTH_SECRET = "desktop-secret-key-for-local-development";
  process.env.JWT_SECRET = "desktop-jwt-secret";

  // WORKSPACE CONFIGURATION
  process.env.NEXT_PUBLIC_WORKSPACE_ID = "adrata";
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:3000";
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

  // DISABLE FEATURES THAT REQUIRE EXTERNAL SERVICES
  process.env.NEXT_PUBLIC_PUSHER_APP_ID = "";
  process.env.NEXT_PUBLIC_PUSHER_KEY = "";
  process.env.NEXT_PUBLIC_PUSHER_SECRET = "";
  process.env.OPENAI_API_KEY = "";

  console.log("✅ Desktop environment variables configured:");
  console.log(
    "  - NEXT_PUBLIC_IS_DESKTOP:",
    process.env.NEXT_PUBLIC_IS_DESKTOP,
  );
  console.log("  - TAURI_BUILD:", process.env.TAURI_BUILD);
  console.log(
    "  - DATABASE_URL:",
    process.env.DATABASE_URL ? "SET" : "MISSING",
  );
  console.log(
    "  - NEXTAUTH_SECRET:",
    process.env.NEXTAUTH_SECRET ? "SET" : "MISSING",
  );
  console.log(
    "  - NEXT_PUBLIC_WORKSPACE_ID:",
    process.env.NEXT_PUBLIC_WORKSPACE_ID,
  );
}

function main() {
  try {
    setDesktopEnvironmentVariables();
    moveApiRoutes();
    createEmptyApiDir();
    validateNextConfig();

    if (validatePreparation()) {
      console.log("✅ Desktop build preparation complete");
      console.log(
        "💡 API routes are safely backed up and excluded from static export",
      );
      console.log("🔧 Ready for desktop build with static export");
    } else {
      console.error("❌ Desktop build preparation failed validation");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error preparing desktop build:", error);
    process.exit(1);
  }
}

main();
