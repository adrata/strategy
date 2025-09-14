#!/usr/bin/env node

/**
 * Simple Lead Data Seeder for Testing
 * Basic import that works with current database schema
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";

console.log("🌱 Starting simple lead data seeding...");

const DATABASE_URL =
  "postgresql://rosssylvester:Themill08!@localhost:5432/magic";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

async function parseCSV() {
  console.log("📖 Reading lead data CSV...");

  const content = await fs.readFile("./lead-data-full.csv", "utf-8");
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());

  const leads = [];
  for (let i = 1; i < Math.min(lines.length, 21); i++) {
    // Just first 20 for testing
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const lead = {};
    headers.forEach((header, index) => {
      lead[header] = values[index] || "";
    });

    if (lead.name && lead.Email && lead.company) {
      leads.push({
        name: lead.name,
        email: lead.Email,
        company: lead.company,
        title: lead.Title || "",
        phone: lead["Mobile Phone"] || lead["Work Phone"] || "",
        location: [lead.City, lead.State, lead.Country]
          .filter(Boolean)
          .join(", "),
      });
    }
  }

  return leads;
}

async function main() {
  try {
    console.log("🔗 Connecting to database...");
    await prisma.$connect();

    console.log("📊 Parsing CSV data...");
    const leads = await parseCSV();

    console.log(`✅ Found ${leads.length} valid leads for testing`);

    // Just log the data for now to verify everything works
    console.log("\n📋 Sample lead data:");
    leads.slice(0, 5).forEach((lead, index) => {
      console.log(
        `${index + 1}. ${lead.name} at ${lead.company} (${lead.email})`,
      );
    });

    console.log("\n🎯 Database connection successful!");
    console.log("📊 CSV parsing successful!");
    console.log(`✅ Ready to import ${leads.length} leads`);

    console.log("\n🔧 Next steps:");
    console.log("1. Fix database schema if needed");
    console.log("2. Run full import with all 412 leads");
    console.log("3. Test in your Action Platform");
  } catch (error) {
    console.error("❌ Simple seed failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
