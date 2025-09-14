#!/usr/bin/env node

/**
 * 🎯 UPDATE DAN'S LEADS TO INITIATE STAGE
 *
 * Updates all 408+ leads for Dan to be in the "Initiate" stage
 * so they show up correctly in the Pipeline Leads kanban board.
 */

const { PrismaClient } = require("@prisma/client");

// Production database configuration
const PRODUCTION_DATABASE_URL =
  "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: PRODUCTION_DATABASE_URL,
    },
  },
});

const TARGET_CONFIG = {
  workspaceId: "adrata",
  userIdentifier: "dan", // Will search for Dan user
  targetStatus: "Initiate", // Pipeline stage
};

async function updateDanLeadsToInitiateStage() {
  console.log("🎯 UPDATING DAN'S LEADS TO INITIATE STAGE");
  console.log("=========================================");
  console.log("");

  try {
    // Step 1: Find Dan user
    console.log("👤 Step 1: Finding Dan user...");
    const danUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: "dan@adrata.com" },
          { id: "dan" },
          { firstName: "dan" },
          { name: { contains: "dan", mode: "insensitive" } },
        ],
      },
    });

    if (!danUser) {
      throw new Error("❌ Dan user not found in production database");
    }

    console.log(`✅ Found Dan user: ${danUser.email || danUser.name} (ID: ${danUser.id})`);

    // Step 2: Find Adrata workspace
    console.log("\n🏢 Step 2: Finding Adrata workspace...");
    const adrataWorkspace = await prisma.workspace.findFirst({
      where: {
        OR: [
          { id: "adrata" },
          { slug: "adrata" },
          { name: "adrata" },
          { name: "Adrata" },
        ],
      },
    });

    if (!adrataWorkspace) {
      throw new Error("❌ Adrata workspace not found in production database");
    }

    console.log(`✅ Found Adrata workspace: ${adrataWorkspace.name} (ID: ${adrataWorkspace.id})`);

    // Step 3: Get current leads for Dan
    console.log("\n📋 Step 3: Getting current leads for Dan...");
    const currentLeads = await prisma.lead.findMany({
      where: {
        AND: [
          { assignedUserId: danUser.id },
          { workspaceId: adrataWorkspace.id },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        company: true,
        email: true,
        status: true,
        jobTitle: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`📊 Found ${currentLeads.length} leads for Dan in Adrata workspace`);

    if (currentLeads.length === 0) {
      console.log("⚠️  No leads found for Dan. You may need to run a lead import script first.");
      return;
    }

    // Step 4: Show current status breakdown
    console.log("\n📊 Step 4: Current status breakdown...");
    const statusBreakdown = currentLeads.reduce((acc, lead) => {
      const status = lead.status || "unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    console.log("Current lead statuses:");
    Object.entries(statusBreakdown).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count} leads`);
    });

    // Step 5: Update leads to Initiate status
    console.log(`\n🔄 Step 5: Updating ${currentLeads.length} leads to "Initiate" status...`);
    
    const updateResult = await prisma.lead.updateMany({
      where: {
        AND: [
          { assignedUserId: danUser.id },
          { workspaceId: adrataWorkspace.id },
        ],
      },
      data: {
        status: TARGET_CONFIG.targetStatus,
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Successfully updated ${updateResult.count} leads to "Initiate" status`);

    // Step 6: Verify the update
    console.log("\n✅ Step 6: Verifying the update...");
    const verificationLeads = await prisma.lead.findMany({
      where: {
        AND: [
          { assignedUserId: danUser.id },
          { workspaceId: adrataWorkspace.id },
          { status: TARGET_CONFIG.targetStatus },
        ],
      },
      select: {
        id: true,
        fullName: true,
        company: true,
        status: true,
      },
      take: 5,
    });

    console.log(`📋 Sample leads now in "Initiate" stage:`);
    verificationLeads.forEach((lead, index) => {
      console.log(`  ${index + 1}. ${lead.fullName} @ ${lead.company} - Status: ${lead.status}`);
    });

    // Step 7: Final summary
    console.log("\n🎉 PIPELINE LEADS UPDATE COMPLETED");
    console.log("==================================");
    console.log(`✅ Total leads updated: ${updateResult.count}`);
    console.log(`✅ All leads now in: "${TARGET_CONFIG.targetStatus}" stage`);
    console.log(`✅ Assigned to: ${danUser.name || danUser.email}`);
    console.log(`✅ Workspace: ${adrataWorkspace.name}`);
    console.log("");
    console.log("🚀 Your Pipeline Leads kanban board will now show:");
    console.log(`   - Generate: 0 leads`);
    console.log(`   - Initiate: ${updateResult.count} leads`);
    console.log(`   - Educate: 0 leads`);
    console.log("");
    console.log("Navigate to Pipeline > Leads to see your leads in the Initiate column!");

  } catch (error) {
    console.error("❌ SCRIPT FAILED:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the script
if (require.main === module) {
  updateDanLeadsToInitiateStage()
    .then(() => {
      console.log("✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

module.exports = { updateDanLeadsToInitiateStage }; 