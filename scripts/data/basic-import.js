console.log("🌱 Starting basic lead data import...");

import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://rosssylvester:Themill08!@localhost:5432/magic",
    },
  },
});

async function basicImport() {
  try {
    console.log("�� Connecting to database...");
    await prisma.$connect();

    console.log("📊 Reading first 20 leads from CSV...");
    const content = await fs.readFile("./lead-data-full.csv", "utf-8");
    const lines = content.trim().split("\n");

    // Parse just the first 20 leads for testing
    const leads = [];
    for (let i = 1; i <= 20; i++) {
      const line = lines[i];
      if (line) {
        const parts = line.split(",");
        if (parts.length > 5) {
          leads.push({
            rank: parts[0],
            company: parts[1]?.replace(/"/g, ""),
            name: parts[4]?.replace(/"/g, ""),
            title: parts[5]?.replace(/"/g, ""),
            email: parts[8]?.replace(/"/g, ""),
          });
        }
      }
    }

    console.log(`✅ Parsed ${leads.length} sample leads`);
    console.log("\n📋 Sample data:");
    leads.slice(0, 5).forEach((lead, i) => {
      console.log(`${i + 1}. ${lead.name} at ${lead.company} (${lead.email})`);
    });

    console.log("\n🎯 Database connection and CSV parsing successful!");
    console.log("📊 Ready to implement full import once schema is updated");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

basicImport();
