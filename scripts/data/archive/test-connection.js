#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests connectivity to both dev and production environments
 *
 * Usage: node test-connection.js [dev|prod|both]
 */

import { PrismaClient } from "@prisma/client";

// Environment configuration
const ENVIRONMENTS = {
  dev: {
    databaseUrl: "postgresql://rosssylvester:Themill08!@localhost:5432/magic",
    workspaceId: "c854dff0-27db-4e79-a47b-787b0618a353",
    userId: "6e90c006-12e3-4c4e-84fb-94cc2383585a",
    name: "Development",
  },
  prod: {
    databaseUrl:
      "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require",
    workspaceId: "6c224ee0-2484-4af1-ab42-918e4546e0f0",
    userId: "2feca06d-5e57-4eca-b44e-0947f755a930",
    name: "Production",
  },
};

async function testEnvironment(envName) {
  const config = ENVIRONMENTS[envName];
  console.log(`\n🔍 Testing ${config.name} Environment`);
  console.log("=".repeat(40));

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: config.databaseUrl,
      },
    },
  });

  try {
    // Test basic connection
    console.log("📡 Testing database connection...");
    await prisma.$connect();
    console.log("✅ Database connection successful");

    // Test workspace existence
    console.log("🏢 Checking workspace...");
    const workspace = await prisma.workspace.findUnique({
      where: { id: config.workspaceId },
    });

    if (workspace) {
      console.log(`✅ Workspace found: ${workspace.name}`);
    } else {
      console.log(`❌ Workspace ${config.workspaceId} not found`);
      return false;
    }

    // Test user existence
    console.log("👤 Checking user...");
    const user = await prisma.user.findUnique({
      where: { id: config.userId },
    });

    if (user) {
      console.log(`✅ User found: ${user.name || user.email}`);
    } else {
      console.log(`❌ User ${config.userId} not found`);
      return false;
    }

    // Check current lead count
    console.log("📊 Checking current lead count...");
    const leadCount = await prisma.lead.count({
      where: { workspaceId: config.workspaceId },
    });
    console.log(`📈 Current leads in workspace: ${leadCount}`);

    // Check current person count
    const personCount = await prisma.person.count({
      where: { workspaceId: config.workspaceId },
    });
    console.log(`👥 Current people in workspace: ${personCount}`);

    console.log(`✅ ${config.name} environment is ready for import!`);
    return true;
  } catch (error) {
    console.log(`❌ ${config.name} environment test failed:`);
    console.log(`   Error: ${error.message}`);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const env = process.argv[2] || "both";

  console.log("🚀 Adrata Database Connection Test");
  console.log(`Environment: ${env}`);

  let environments = [];
  if (env === "both") {
    environments = ["dev", "prod"];
  } else if (ENVIRONMENTS[env]) {
    environments = [env];
  } else {
    console.error("❌ Invalid environment. Use: dev, prod, or both");
    process.exit(1);
  }

  let allPassed = true;

  for (const envName of environments) {
    const passed = await testEnvironment(envName);
    if (!passed) {
      allPassed = false;
    }
  }

  console.log("\n" + "=".repeat(50));
  if (allPassed) {
    console.log("🎉 All tests passed! Ready to import data.");
    console.log("\nTo import lead data:");
    console.log("  Development: ./data-import/deploy.sh dev");
    console.log("  Production:  ./data-import/deploy.sh prod");
  } else {
    console.log("❌ Some tests failed. Please fix issues before importing.");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
