#!/usr/bin/env node

/**
 * Simple Lead Seeding Script
 * Direct import that bypasses schema validation issues
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";

const environment = process.argv[2] || "development";

console.log(`🌱 Simple lead seeding for ${environment} environment...`);

// Load DATABASE_URL from environment file
async function loadDatabaseURL() {
  try {
    const envContent = await fs.readFile(`../.env.${environment}`, "utf-8");
    const dbUrlMatch = envContent.match(/^DATABASE_URL="(.+)"$/m);
    return dbUrlMatch ? dbUrlMatch[1] : null;
  } catch (error) {
    console.log("Using fallback database URL");
    return "postgresql://rosssylvester:Themill08!@localhost:5432/magic";
  }
}

async function main() {
  try {
    const databaseUrl = await loadDatabaseURL();
    console.log(`🔗 Connecting to database...`);

    const prisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });

    await prisma.$connect();
    console.log("✅ Database connected successfully");

    // Parse CSV data
    console.log("📖 Reading lead data...");
    const content = await fs.readFile("./lead-data-full.csv", "utf-8");
    const lines = content.trim().split("\n");

    let successCount = 0;
    let errorCount = 0;

    // Process first 50 leads for testing
    console.log("📊 Processing lead data...");
    for (let i = 1; i <= Math.min(50, lines.length - 1); i++) {
      try {
        const parts = lines[i].split(",");

        if (parts.length < 10) continue;

        const name = parts[4]?.replace(/"/g, "") || "";
        const email = parts[8]?.replace(/"/g, "") || "";
        const company = parts[1]?.replace(/"/g, "") || "";

        if (!name || !email || !company) continue;

        // Create lead record using raw SQL to bypass schema validation
        await prisma.$executeRaw`
          INSERT INTO leads (
            id, name, email, company, title, status, source, 
            "buyerGroupRole", relationship, notes, "workspaceId", 
            "createdBy", "assignedTo", "assignedAt", "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid(),
            ${name},
            ${email}, 
            ${company},
            ${parts[5]?.replace(/"/g, "") || ""},
            'Generate',
            'CSV Import - Lead Data Full',
            'Stakeholder',
            'Cold',
            'Imported via simple seed script',
            'c854dff0-27db-4e79-a47b-787b0618a353',
            '6e90c006-12e3-4c4e-84fb-94cc2383585a',
            '6e90c006-12e3-4c4e-84fb-94cc2383585a',
            NOW(),
            NOW(),
            NOW()
          )
          ON CONFLICT (email, "workspaceId") DO UPDATE SET
            "updatedAt" = NOW(),
            company = EXCLUDED.company,
            title = EXCLUDED.title
        `;

        successCount++;

        if (successCount % 10 === 0) {
          console.log(`   📊 Imported ${successCount} leads...`);
        }
      } catch (error) {
        errorCount++;
        if (errorCount <= 5) {
          console.log(`   ⚠️ Error importing lead: ${error.message}`);
        }
      }
    }

    console.log(`\n🎉 Simple seeding completed!`);
    console.log(`✅ Successfully imported: ${successCount} leads`);
    console.log(`❌ Errors: ${errorCount} leads`);
    console.log(`\n📊 Environment: ${environment}`);
    console.log(`🔗 Database: ${databaseUrl.split("@")[1] || "localhost"}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
}

main();
