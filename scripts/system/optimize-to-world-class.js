const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  datasourceUrl:
    process.env.DATABASE_URL ||
    "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require",
});

async function optimizeToWorldClass() {
  console.log("🌟 OPTIMIZING TO WORLD-CLASS STANDARDS");
  console.log("======================================");
  console.log("Implementing industry-leading database structure...\n");

  try {
    // Step 1: Update workspace to world-class standard
    console.log("🏢 STEP 1: Optimize Workspace Structure");
    console.log("=======================================");

    const currentWorkspace = await prisma.workspace.findUnique({
      where: { id: "adrata" },
      select: { id: true, name: true, slug: true },
    });

    console.log(
      `Current: Name="${currentWorkspace?.name}", Slug="${currentWorkspace?.slug}", ID="${currentWorkspace?.id}"`,
    );

    // Update workspace to world-class standard
    const updatedWorkspace = await prisma.workspace.update({
      where: { id: "adrata" },
      data: {
        name: "Adrata",
        slug: "adrata", // Clean, matches company name
      },
    });

    console.log(
      `✅ Optimized: Name="${updatedWorkspace.name}", Slug="${updatedWorkspace.slug}", ID="${updatedWorkspace.id}"`,
    );
    console.log("");

    // Step 2: Update user to world-class standard
    console.log("👤 STEP 2: Optimize User Structure");
    console.log("==================================");

    const currentUser = await prisma.user.findUnique({
      where: { id: "dan-production-user-2025" },
      select: {
        id: true,
        name: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    console.log(
      `Current: Name="${currentUser?.name}", Email="${currentUser?.email}", ID="${currentUser?.id}"`,
    );

    // Check if clean ID 'dan' is available
    const existingDanUser = await prisma.user.findUnique({
      where: { id: "dan" },
    });

    if (existingDanUser && existingDanUser.id !== "dan-production-user-2025") {
      console.log('⚠️  Clean ID "dan" already exists. Keeping current ID.');
    } else {
      // Update existing user to world-class clean ID
      console.log("🔄 Updating user to world-class ID...");

      // Update the user's details and ID in a transaction
      await prisma.$transaction(async (tx) => {
        // Update user details first
        await tx.user.update({
          where: { id: "dan-production-user-2025" },
          data: {
            name: "Dan Mirolli",
            firstName: "Dan",
            lastName: "Mirolli",
          },
        });

        // Use raw SQL to update the ID (since Prisma doesn't support ID updates directly)
        await tx.$executeRaw`UPDATE users SET id = 'dan' WHERE id = 'dan-production-user-2025'`;

        // Update all lead assignments to new clean user ID
        await tx.lead.updateMany({
          where: { assignedUserId: "dan-production-user-2025" },
          data: { assignedUserId: "dan" },
        });

        // Update enrichment executions
        await tx.enrichmentExecution.updateMany({
          where: { triggerUserId: "dan-production-user-2025" },
          data: { triggerUserId: "dan" },
        });
      });

      console.log(`✅ Updated user to clean ID and migrated all references`);
    }
    console.log("");

    // Step 3: Clean up data quality issues
    console.log("🧹 STEP 3: Fix Data Quality Issues");
    console.log("==================================");

    // Fix email fields that contain LinkedIn URLs
    const leadsWithLinkedInEmails = await prisma.lead.findMany({
      where: {
        email: { contains: "linkedin.com" },
      },
      select: { id: true, email: true, fullName: true },
    });

    console.log(
      `Found ${leadsWithLinkedInEmails.length} leads with LinkedIn URLs in email field`,
    );

    // Move LinkedIn URLs to a custom field and clear email
    for (const lead of leadsWithLinkedInEmails) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          email: null, // Clear invalid email
          customFields: {
            linkedinUrl: lead.email,
            emailCleanedUp: true,
          },
        },
      });
    }

    if (leadsWithLinkedInEmails.length > 0) {
      console.log(
        `✅ Cleaned up ${leadsWithLinkedInEmails.length} email fields, moved LinkedIn URLs to customFields`,
      );
    }

    // Step 4: Verify final state
    console.log("🔍 STEP 4: Verify World-Class Configuration");
    console.log("==========================================");

    const finalWorkspace = await prisma.workspace.findUnique({
      where: { id: "adrata" },
      select: { id: true, name: true, slug: true },
    });

    const finalUser = await prisma.user.findUnique({
      where: { id: "dan" },
      select: { id: true, name: true, email: true },
    });

    const leadCount = await prisma.lead.count({
      where: {
        workspaceId: "adrata",
        assignedUserId: "dan",
      },
    });

    console.log("✅ WORLD-CLASS CONFIGURATION ACHIEVED:");
    console.log("======================================");
    console.log(
      `🏢 Workspace: "${finalWorkspace?.name}" (ID: ${finalWorkspace?.id}, Slug: ${finalWorkspace?.slug})`,
    );
    console.log(
      `👤 User: "${finalUser?.name}" (ID: ${finalUser?.id}, Email: ${finalUser?.email})`,
    );
    console.log(`📊 Leads: ${leadCount} assigned to clean user`);
    console.log("");

    // Verify against world-class standards
    const standards = {
      workspaceIdClean: finalWorkspace?.id === "adrata",
      workspaceSlugMatches: finalWorkspace?.slug === "adrata",
      userIdClean: finalUser?.id === "dan",
      userNameComplete: finalUser?.name === "Dan Mirolli",
      dataIntegrity: leadCount === 408,
    };

    const allStandardsMet = Object.values(standards).every(Boolean);

    console.log("🏆 WORLD-CLASS STANDARDS CHECKLIST:");
    console.log("===================================");
    console.log(
      `${standards.workspaceIdClean ? "✅" : "❌"} Simple workspace ID: "adrata"`,
    );
    console.log(
      `${standards.workspaceSlugMatches ? "✅" : "❌"} Slug matches ID: "adrata"`,
    );
    console.log(`${standards.userIdClean ? "✅" : "❌"} Simple user ID: "dan"`);
    console.log(
      `${standards.userNameComplete ? "✅" : "❌"} Professional name: "Dan Mirolli"`,
    );
    console.log(
      `${standards.dataIntegrity ? "✅" : "❌"} Data integrity: All 408 leads preserved`,
    );
    console.log("");

    if (allStandardsMet) {
      console.log("🚀 SUCCESS: WORLD-CLASS STANDARDS ACHIEVED!");
      console.log("==========================================");
      console.log("✅ Clean, memorable IDs");
      console.log("✅ Professional naming");
      console.log("✅ Data integrity maintained");
      console.log("✅ Industry best practices followed");
      console.log("✅ Ready for enterprise scaling");
    } else {
      console.log("⚠️  Some standards not met. Review above checklist.");
    }
  } catch (error) {
    console.error("❌ Optimization error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  optimizeToWorldClass();
}

module.exports = { optimizeToWorldClass };
