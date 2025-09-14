#!/usr/bin/env node

/**
 * ENSURE API STATIC SAFEGUARDS
 * Automatically adds 'export const dynamic = "force-static";' to all API routes
 * Run this script to ensure all API routes are compatible with static export builds
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🛡️  Ensuring all API routes have static export safeguards...");

const STATIC_EXPORT_LINE = 'export const dynamic = "force-static";';
const COMMENT_LINE = "// Required for static export compatibility";

function findApiRoutes() {
  try {
    const result = execSync('find src/app -name "route.ts" -path "*/api/*"', {
      encoding: "utf8",
    });
    return result
      .trim()
      .split("\n")
      .filter((line) => line.length > 0);
  } catch (error) {
    console.log("ℹ️  No API routes found");
    return [];
  }
}

function hasStaticSafeguard(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return content.includes('export const dynamic = "force-static"');
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
    return false;
  }
}

function addStaticSafeguard(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    // Find the first import or first non-comment line
    let insertIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("import ") || line.startsWith("export ")) {
        insertIndex = i;
        break;
      }
    }

    // Insert the safeguard at the appropriate location
    lines.splice(insertIndex, 0, COMMENT_LINE, STATIC_EXPORT_LINE, "");

    const newContent = lines.join("\n");
    fs.writeFileSync(filePath, newContent, "utf8");

    console.log(`✅ Added static safeguard to: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error adding safeguard to ${filePath}:`, error.message);
    return false;
  }
}

function validateApiRoute(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");

    // Check if it's actually an API route (has GET, POST, PUT, DELETE exports)
    const hasApiMethods =
      /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)/i.test(content);

    if (!hasApiMethods) {
      console.log(
        `ℹ️  Skipping ${filePath} - doesn't appear to be an API route`,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(`❌ Error validating ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  const apiRoutes = findApiRoutes();

  if (apiRoutes.length === 0) {
    console.log("ℹ️  No API routes found to process");
    return;
  }

  console.log(`📋 Found ${apiRoutes.length} potential API routes:`);
  apiRoutes.forEach((route) => console.log(`  - ${route}`));
  console.log();

  let processedCount = 0;
  let addedCount = 0;
  let skippedCount = 0;

  for (const route of apiRoutes) {
    // Validate it's actually an API route
    if (!validateApiRoute(route)) {
      skippedCount++;
      continue;
    }

    processedCount++;

    if (hasStaticSafeguard(route)) {
      console.log(`✅ Already protected: ${route}`);
    } else {
      if (addStaticSafeguard(route)) {
        addedCount++;
      }
    }
  }

  console.log("\n📊 Summary:");
  console.log(`  - Total routes found: ${apiRoutes.length}`);
  console.log(`  - Valid API routes: ${processedCount}`);
  console.log(`  - Already protected: ${processedCount - addedCount}`);
  console.log(`  - Safeguards added: ${addedCount}`);
  console.log(`  - Skipped: ${skippedCount}`);

  if (addedCount > 0) {
    console.log(
      `\n✅ Added static export safeguards to ${addedCount} API routes`,
    );
    console.log(
      "🛡️  All API routes are now protected against static export build errors",
    );
  } else {
    console.log("\n✅ All API routes already have static export safeguards");
    console.log("🛡️  Your API routes are fully protected");
  }
}

main();
