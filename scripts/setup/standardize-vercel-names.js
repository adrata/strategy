#!/usr/bin/env node

/**
 * 🔧 STANDARDIZE VERCEL PROJECT NAMES
 * Updates all references to use consistent adrata-{environment}-adrata pattern
 */

import { readFileSync, writeFileSync } from "fs";

const standardNameMap = {
  "staging-lyr18e0tx-adrata": "adrata-staging-adrata",
  "development-dxsnzvw4q-adrata": "adrata-development-adrata",
  "sandbox-n9jn4m9e6-adrata": "adrata-sandbox-adrata",
};

const urlMap = {
  "staging-lyr18e0tx-adrata.vercel.app": "adrata-staging-adrata.vercel.app",
  "development-dxsnzvw4q-adrata.vercel.app":
    "adrata-development-adrata.vercel.app",
  "sandbox-n9jn4m9e6-adrata.vercel.app": "adrata-sandbox-adrata.vercel.app",
};

const filesToUpdate = [
  "scripts/setup-environments.js",
  "scripts/production-api-sync.js",
  "MONACO_INTELLIGENCE_SUMMARY.md",
];

function updateFile(filePath) {
  try {
    let content = readFileSync(filePath, "utf8");
    let updated = false;

    // Update Vercel project names
    Object.entries(standardNameMap).forEach(([oldName, newName]) => {
      const before = content;
      content = content.replace(new RegExp(oldName, "g"), newName);
      if (content !== before) updated = true;
    });

    // Update domain URLs
    Object.entries(urlMap).forEach(([oldUrl, newUrl]) => {
      const before = content;
      content = content.replace(new RegExp(oldUrl, "g"), newUrl);
      if (content !== before) updated = true;
    });

    if (updated) {
      writeFileSync(filePath, content);
      console.log(`✅ Updated ${filePath}`);
      return true;
    } else {
      console.log(`⚪ No changes needed in ${filePath}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error updating ${filePath}: ${error.message}`);
    return false;
  }
}

function main() {
  console.log("🔧 STANDARDIZING VERCEL PROJECT NAMES\n");

  console.log("📋 Standardized naming pattern: adrata-{environment}-adrata\n");

  let totalUpdated = 0;

  for (const file of filesToUpdate) {
    if (updateFile(file)) {
      totalUpdated++;
    }
  }

  console.log(
    `\n✅ Updated ${totalUpdated} files with standardized Vercel project names`,
  );

  console.log("\n📊 STANDARDIZED VERCEL PROJECT NAMES:");
  console.log("✅ adrata-production-adrata");
  console.log("✅ adrata-staging-adrata");
  console.log("✅ adrata-development-adrata");
  console.log("✅ adrata-demo-adrata");
  console.log("✅ adrata-sandbox-adrata");

  console.log("\n🌐 STANDARDIZED DEPLOYMENT URLS:");
  console.log("✅ https://adrata-production-adrata.vercel.app");
  console.log("✅ https://adrata-staging-adrata.vercel.app");
  console.log("✅ https://adrata-development-adrata.vercel.app");
  console.log("✅ https://adrata-demo-adrata.vercel.app");
  console.log("✅ https://adrata-sandbox-adrata.vercel.app");
}

main();
