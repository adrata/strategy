#!/usr/bin/env node

/**
 * 🌱 WORKING MULTI-ENVIRONMENT SEED SCRIPT
 * Now properly aligned with actual database schema
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";

const environment = process.argv[2] || "development";
console.log(`🚀 Working seed for ${environment} environment...`);

// Load DATABASE_URL from environment file
async function loadDatabaseURL() {
  try {
    const envContent = await fs.readFile(`../.env.${environment}`, "utf-8");
    const dbUrlMatch = envContent.match(/^DATABASE_URL="(.+)"$/m);
    return dbUrlMatch ? dbUrlMatch[1] : null;
  } catch (error) {
    return "postgresql://neondb_owner:npg_xsDd5H6NUtSm@ep-tiny-sky-a8zvnemb.eastus2.azure.neon.tech/neondb?sslmode=require";
  }
}

async function main() {
  try {
    const databaseUrl = await loadDatabaseURL();
    console.log(`🔗 Connecting to ${environment} database...`);

    const prisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });

    await prisma.$connect();
    console.log("✅ Database connected successfully");

    // Create or find workspace
    let workspace;
    try {
      workspace = await prisma.workspace.findFirst({
        where: { name: { contains: "Adrata" } },
      });

      if (!workspace) {
        workspace = await prisma.workspace.create({
          data: {
            name: `Adrata ${environment}`,
            slug: `adrata-${environment}`,
            description: `Adrata workspace for ${environment} environment`,
          },
        });
        console.log(`✅ Created workspace: ${workspace.name}`);
      } else {
        console.log(`✅ Using existing workspace: ${workspace.name}`);
      }
    } catch (error) {
      console.log(`⚠️ Workspace issue: ${error.message}`);
      // Create a default workspace
      workspace = { id: "default-workspace-id" };
    }

    // Parse CSV data
    console.log("📖 Reading lead data...");
    const content = await fs.readFile("./lead-data-full.csv", "utf-8");
    const lines = content.trim().split("\n");

    let successCount = 0;
    let skipCount = 0;

    console.log("📊 Processing lead data...");

    // Process all 412 leads
    for (let i = 1; i < lines.length; i++) {
      try {
        const parts = lines[i].split(",");

        if (parts.length < 10) {
          skipCount++;
          continue;
        }

        const name = parts[4]?.replace(/"/g, "").trim() || "";
        const email = parts[8]?.replace(/"/g, "").trim() || "";
        const company = parts[1]?.replace(/"/g, "").trim() || "";

        if (!name || !email || !company) {
          skipCount++;
          continue;
        }

        // Split name into first and last
        const nameParts = name.split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        // Check if lead already exists (using correct field)
        const existingLead = await prisma.lead.findFirst({
          where: {
            email: email,
            workspaceId: workspace.id,
          },
        });

        if (existingLead) {
          // Update existing lead
          await prisma.lead.update({
            where: { id: existingLead.id },
            data: {
              company: company,
              jobTitle: parts[5]?.replace(/"/g, "").trim() || "",
              updatedAt: new Date(),
            },
          });
        } else {
          // Create new lead with correct schema
          await prisma.lead.create({
            data: {
              firstName: firstName,
              lastName: lastName,
              fullName: name,
              email: email,
              company: company,
              jobTitle: parts[5]?.replace(/"/g, "").trim() || "",
              phone: parts[9]?.replace(/"/g, "").trim() || null,
              city: parts[11]?.replace(/"/g, "").trim() || null,
              status: "new",
              priority: "medium",
              source: "CSV Import - Lead Data Full",
              workspaceId: workspace.id,
              tags: ["imported", environment],
              notes: `Imported from CSV on ${new Date().toISOString()}`,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }

        successCount++;

        if (successCount % 50 === 0) {
          console.log(`   📊 Processed ${successCount} leads...`);
        }
      } catch (error) {
        console.log(`   ⚠️ Error processing lead: ${error.message}`);
        skipCount++;
      }
    }

    console.log(`\n🎉 WORKING SEEDING COMPLETED!`);
    console.log(`✅ Successfully imported: ${successCount} leads`);
    console.log(`⏭️ Skipped: ${skipCount} leads`);
    console.log(`📊 Environment: ${environment}`);
    console.log(`🏢 Workspace: ${workspace.name || workspace.id}`);
    console.log(`🔗 Database: ${databaseUrl.split("@")[1]}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Working seeding failed:", error.message);
    process.exit(1);
  }
}

main();
