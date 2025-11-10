#!/usr/bin/env node

/**
 * 🧹 CLEAN COMPANY TRAILING SPACES
 * 
 * Migration script to clean trailing spaces, leading spaces, and multiple spaces
 * from company name fields. This ensures consistent data quality.
 */

const { PrismaClient } = require("@prisma/client");

// SECURITY: Never hardcode database credentials - always use environment variables
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL environment variable is required");
  console.error("Please set it in your .env file or environment before running this script");
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
  log: ["error", "warn"],
});

/**
 * Normalize a name by trimming and normalizing spaces
 */
function normalizeName(name) {
  if (!name) return null;
  const normalized = name.trim().replace(/\s+/g, ' ');
  return normalized === '' ? null : normalized;
}

async function cleanCompanyTrailingSpaces() {
  console.log("🧹 CLEANING COMPANY TRAILING SPACES");
  console.log("===================================");
  console.log("");

  try {
    // Step 1: Find all companies with whitespace issues
    console.log("📊 Step 1: Finding companies with whitespace issues...");
    
    const allCompanies = await prisma.companies.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        workspaceId: true,
        createdAt: true,
      },
    });

    console.log(`✅ Found ${allCompanies.length} total companies`);

    // Step 2: Identify records that need cleaning
    const recordsToClean = [];
    
    for (const company of allCompanies) {
      if (!company.name) continue;
      
      const normalized = normalizeName(company.name);
      
      if (company.name !== normalized) {
        recordsToClean.push({
          id: company.id,
          oldName: company.name,
          newName: normalized,
          workspaceId: company.workspaceId,
          createdAt: company.createdAt,
        });
      }
    }

    console.log(`\n📋 Step 2: Found ${recordsToClean.length} records that need cleaning`);
    
    if (recordsToClean.length === 0) {
      console.log("\n✅ No records need cleaning! All company names are already normalized.");
      return;
    }

    // Step 3: Show sample of records to be cleaned
    console.log("\n📝 Step 3: Records to be cleaned:");
    recordsToClean.forEach((record, index) => {
      console.log(`\n  ${index + 1}. ID: ${record.id}`);
      console.log(`     Name: "${record.oldName}"`);
      console.log(`     → "${record.newName}"`);
      console.log(`     Workspace: ${record.workspaceId}`);
      console.log(`     Created: ${new Date(record.createdAt).toLocaleDateString()}`);
    });

    // Step 4: Clean records
    console.log("\n🧹 Step 4: Cleaning records...");
    let cleaned = 0;
    let errors = 0;

    for (const record of recordsToClean) {
      try {
        await prisma.companies.update({
          where: { id: record.id },
          data: {
            name: record.newName,
          },
        });
        cleaned++;
        console.log(`  ✅ Cleaned: "${record.oldName}" → "${record.newName}"`);
      } catch (error) {
        console.error(`  ❌ Error cleaning record ${record.id}:`, error.message);
        errors++;
      }
    }

    // Step 5: Summary
    console.log("\n\n📊 SUMMARY");
    console.log("=".repeat(50));
    console.log(`✅ Cleaned: ${cleaned} records`);
    if (errors > 0) {
      console.log(`❌ Errors: ${errors} records`);
    }
    console.log(`📋 Total processed: ${recordsToClean.length} records`);
    console.log("\n✨ Cleanup completed successfully!");

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanCompanyTrailingSpaces()
  .then(() => {
    console.log("\n✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

