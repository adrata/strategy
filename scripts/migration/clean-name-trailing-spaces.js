#!/usr/bin/env node

/**
 * 🧹 CLEAN NAME TRAILING SPACES
 * 
 * Migration script to clean trailing spaces from firstName, lastName, and fullName
 * fields in the people table. This ensures consistent data quality and fixes search issues.
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

/**
 * Generate fullName from firstName and lastName
 */
function generateFullName(firstName, lastName) {
  const normFirst = normalizeName(firstName);
  const normLast = normalizeName(lastName);
  
  if (!normFirst && !normLast) return null;
  if (!normFirst) return normLast;
  if (!normLast) return normFirst;
  
  return `${normFirst} ${normLast}`;
}

async function cleanNameTrailingSpaces() {
  console.log("🧹 CLEANING NAME TRAILING SPACES");
  console.log("=================================");
  console.log("");

  try {
    // Step 1: Find all people with trailing spaces
    console.log("📊 Step 1: Finding people with trailing spaces...");
    
    const allPeople = await prisma.people.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        workspaceId: true,
      },
    });

    console.log(`✅ Found ${allPeople.length} total people`);

    // Step 2: Identify records that need cleaning
    const recordsToClean = [];
    
    for (const person of allPeople) {
      const normalizedFirst = normalizeName(person.firstName);
      const normalizedLast = normalizeName(person.lastName);
      const normalizedFull = normalizeName(person.fullName);
      const expectedFull = generateFullName(normalizedFirst, normalizedLast);
      
      const needsCleaning = 
        (person.firstName && person.firstName !== normalizedFirst) ||
        (person.lastName && person.lastName !== normalizedLast) ||
        (person.fullName && person.fullName !== normalizedFull) ||
        (person.fullName && expectedFull && person.fullName !== expectedFull);
      
      if (needsCleaning) {
        recordsToClean.push({
          id: person.id,
          oldFirstName: person.firstName,
          oldLastName: person.lastName,
          oldFullName: person.fullName,
          newFirstName: normalizedFirst,
          newLastName: normalizedLast,
          newFullName: expectedFull || normalizedFull,
          workspaceId: person.workspaceId,
        });
      }
    }

    console.log(`\n📋 Step 2: Found ${recordsToClean.length} records that need cleaning`);
    
    if (recordsToClean.length === 0) {
      console.log("\n✅ No records need cleaning! All names are already normalized.");
      return;
    }

    // Step 3: Show sample of records to be cleaned
    console.log("\n📝 Step 3: Sample of records to be cleaned (first 10):");
    recordsToClean.slice(0, 10).forEach((record, index) => {
      console.log(`\n  ${index + 1}. ID: ${record.id}`);
      console.log(`     firstName: "${record.oldFirstName}" → "${record.newFirstName}"`);
      console.log(`     lastName: "${record.oldLastName}" → "${record.newLastName}"`);
      console.log(`     fullName: "${record.oldFullName}" → "${record.newFullName}"`);
    });

    if (recordsToClean.length > 10) {
      console.log(`\n     ... and ${recordsToClean.length - 10} more records`);
    }

    // Step 4: Ask for confirmation (in production, you might want to add a --dry-run flag)
    console.log("\n⚠️  This will update the database. Proceeding with cleanup...");

    // Step 5: Clean records in batches
    console.log("\n🧹 Step 4: Cleaning records...");
    let cleaned = 0;
    let errors = 0;
    const batchSize = 100;

    for (let i = 0; i < recordsToClean.length; i += batchSize) {
      const batch = recordsToClean.slice(i, i + batchSize);
      console.log(`\n  Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(recordsToClean.length / batchSize)} (${batch.length} records)...`);

      for (const record of batch) {
        try {
          await prisma.people.update({
            where: { id: record.id },
            data: {
              firstName: record.newFirstName,
              lastName: record.newLastName,
              fullName: record.newFullName,
            },
          });
          cleaned++;
        } catch (error) {
          console.error(`    ❌ Error cleaning record ${record.id}:`, error.message);
          errors++;
        }
      }
    }

    // Step 6: Summary
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
cleanNameTrailingSpaces()
  .then(() => {
    console.log("\n✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

