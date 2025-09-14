#!/usr/bin/env node

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require",
    },
  },
});

async function main() {
  try {
    console.log("🔍 Checking Production Database...\n");

    // Get workspaces
    const workspaces = await prisma.workspace.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("🏢 Workspaces:");
    workspaces.forEach((ws) => {
      console.log(`  ID: ${ws.id}`);
      console.log(`  Name: ${ws.name}`);
      console.log(`  Created: ${ws.createdAt.toISOString()}`);
      console.log("  ---");
    });

    console.log(`\n📊 Total workspaces: ${workspaces.length}`);

    // Get users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    console.log("\n👥 Recent Users:");
    users.forEach((user) => {
      console.log(`  ID: ${user.id}`);
      console.log(`  Name: ${user.name || "No name"}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Created: ${user.createdAt.toISOString()}`);
      console.log("  ---");
    });

    console.log(`\n📊 Showing last ${users.length} users`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
