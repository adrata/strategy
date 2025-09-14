#!/usr/bin/env node

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://rosssylvester:Themill08!@localhost:5432/magic",
    },
  },
});

async function main() {
  try {
    console.log("🔗 Testing database connection...");
    await prisma.$connect();
    console.log("✅ Database connection successful!");

    // Test a simple query
    const result =
      await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`;
    console.log(
      "📊 Available tables:",
      result.map((r) => r.table_name),
    );

    console.log("\n🎯 Database is ready for seeding!");
  } catch (error) {
    console.error("❌ Database test failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
