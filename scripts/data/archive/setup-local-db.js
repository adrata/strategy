#!/usr/bin/env node

/**
 * 🛠️ LOCAL DATABASE SETUP SCRIPT
 * Sets up the local adrata-local database from scratch
 */

import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

const DATABASE_URL =
  "postgresql://rosssylvester:Themill08!@localhost:5432/adrata-local";

console.log("🛠️ Setting up local database...");

try {
  // Step 1: Set environment variable and generate Prisma client
  console.log("📦 Generating Prisma client...");
  process.env.DATABASE_URL = DATABASE_URL;
  execSync("npx prisma generate", {
    stdio: "inherit",
    cwd: "/Users/rosssylvester/Development/adrata",
    env: { ...process.env, DATABASE_URL },
  });

  // Step 2: Push schema to database
  console.log("🗄️ Pushing schema to database...");
  execSync("npx prisma db push --force-reset", {
    stdio: "inherit",
    cwd: "/Users/rosssylvester/Development/adrata",
    env: { ...process.env, DATABASE_URL },
  });

  // Step 3: Test database connection
  console.log("🔍 Testing database connection...");
  const prisma = new PrismaClient({
    datasources: { db: { url: DATABASE_URL } },
  });

  await prisma.$connect();
  console.log("✅ Database connection successful!");

  // Step 4: Check if tables exist
  const tables = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `;

  console.log("📋 Tables in database:", tables.length);
  tables.forEach((table) => console.log(`  - ${table.table_name}`));

  await prisma.$disconnect();

  console.log("🎉 Local database setup completed successfully!");
  console.log("🚀 Ready to run seed script!");
} catch (error) {
  console.error("❌ Database setup failed:", error.message);
  process.exit(1);
}
