/**
 * Trigger Bulk Enrichment for Existing Leads
 *
 * This script triggers the Monaco enrichment pipeline for all existing leads
 * in both development and production environments.
 */

const { PrismaClient } = require("@prisma/client");

// Environment configuration
const ENVIRONMENTS = {
  dev: {
    databaseUrl: "postgresql://rosssylvester:Themill08!@localhost:5432/magic",
    workspaceId: "c854dff0-27db-4e79-a47b-787b0618a353",
    userId: "6e90c006-12e3-4c4e-84fb-94cc2383585a",
    apiUrl: "http://localhost:3000",
    name: "Development",
  },
  prod: {
    databaseUrl:
      "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require",
    workspaceId: "adrata",
    userId: "dan-production-user-2025",
    apiUrl: "https://action.adrata.com",
    name: "Production",
  },
};

async function triggerEnrichment(envName) {
  const config = ENVIRONMENTS[envName];
  console.log(`\n🚀 Triggering bulk enrichment for ${config.name} environment`);
  console.log("=".repeat(60));

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: config.databaseUrl,
      },
    },
  });

  try {
    // Connect and verify
    await prisma.$connect();
    console.log("✅ Database connection established");

    // Get all leads for this workspace
    const leads = await prisma.lead.findMany({
      where: { workspaceId: config.workspaceId },
      select: {
        id: true,
        fullName: true,
        company: true,
        email: true,
        status: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`📊 Found ${leads.length} leads to enrich`);

    if (leads.length === 0) {
      console.log("⚠️ No leads found in workspace");
      return;
    }

    // Show sample of leads
    console.log(`\n📋 Sample leads to be enriched:`);
    leads.slice(0, 5).forEach((lead, index) => {
      console.log(
        `  ${index + 1}. ${lead.fullName} (${lead.company}) - ${lead.email}`,
      );
    });

    if (leads.length > 5) {
      console.log(`  ... and ${leads.length - 5} more leads`);
    }

    // Prepare enrichment request
    const enrichmentRequest = {
      type: "bulk_leads",
      leadIds: leads.map((lead) => lead.id),
      workspaceId: config.workspaceId,
      userId: config.userId,
      runFullPipeline: true,
      realTimeUpdates: true,
      maxCompanies: 50, // Limit for performance
    };

    console.log(`\n🧠 Triggering Monaco enrichment pipeline...`);
    console.log(`   Type: ${enrichmentRequest.type}`);
    console.log(`   Leads: ${enrichmentRequest.leadIds.length}`);
    console.log(`   Full Pipeline: ${enrichmentRequest.runFullPipeline}`);

    // For local development, use fetch directly
    if (envName === "dev") {
      try {
        const response = await fetch(`${config.apiUrl}/api/enrichment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(enrichmentRequest),
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`\n🎉 Enrichment triggered successfully!`);
          console.log(`📋 Execution ID: ${result.executionId}`);
          console.log(
            `⏱️  Estimated Duration: ${result.estimatedDuration || "calculating..."}`,
          );
          console.log(
            `🔗 Poll Status: GET ${config.apiUrl}/api/enrichment/${result.executionId}`,
          );

          // Start monitoring (optional for dev)
          if (process.argv.includes("--monitor")) {
            await monitorEnrichment(result.executionId, config);
          } else {
            console.log(
              "\n✨ Add --monitor flag to watch progress in real-time",
            );
          }
        } else {
          const errorText = await response.text();
          console.error("❌ Failed to trigger enrichment:", errorText);
        }
      } catch (error) {
        console.error("❌ Network error triggering enrichment:", error.message);
      }
    } else {
      // For production, actually trigger the enrichment
      try {
        console.log(`\n🚀 Triggering PRODUCTION enrichment...`);

        const response = await fetch(`${config.apiUrl}/api/enrichment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(enrichmentRequest),
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`\n🎉 Production enrichment triggered successfully!`);
          console.log(`📋 Execution ID: ${result.executionId}`);
          console.log(
            `⏱️  Estimated Duration: ${result.estimatedDuration || "calculating..."}`,
          );
          console.log(
            `🔗 Poll Status: GET ${config.apiUrl}/api/enrichment/${result.executionId}`,
          );
          console.log(
            `📊 Processing ${leads.length} leads in production environment`,
          );

          // Start monitoring for production if requested
          if (process.argv.includes("--monitor")) {
            await monitorEnrichment(result.executionId, config);
          } else {
            console.log(
              "\n✨ Add --monitor flag to watch progress in real-time",
            );
          }
        } else {
          const errorText = await response.text();
          console.error(
            "❌ Failed to trigger production enrichment:",
            errorText,
          );
        }
      } catch (error) {
        console.error(
          "❌ Network error triggering production enrichment:",
          error.message,
        );
      }
    }
  } catch (error) {
    console.error(`❌ Error in ${config.name} enrichment:`, error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function monitorEnrichment(executionId, config) {
  console.log(`\n👀 Monitoring enrichment progress for ${executionId}...`);

  const maxPolls = 120; // 10 minutes max
  let pollCount = 0;
  let lastProgress = -1;

  while (pollCount < maxPolls) {
    try {
      const response = await fetch(
        `${config.apiUrl}/api/enrichment/${executionId}?workspaceId=${config.workspaceId}`,
      );

      if (response.ok) {
        const data = await response.json();
        const { status, progress } = data;

        // Show progress updates
        const currentProgress = Math.round(
          (progress.currentStep / progress.totalSteps) * 100,
        );
        if (currentProgress !== lastProgress) {
          console.log(
            `📊 Progress: ${currentProgress}% | Step: ${progress.currentStep}/${progress.totalSteps} | Companies: ${progress.completedCompanies}/${progress.totalCompanies}`,
          );
          lastProgress = currentProgress;
        }

        if (status === "completed") {
          console.log("\n🎉 Enrichment completed successfully!");

          // Show results summary
          if (data.results) {
            console.log(
              `🏢 Companies enriched: ${data.results.companiesEnriched?.length || 0}`,
            );
            console.log(
              `👤 People enriched: ${data.results.peopleEnriched?.length || 0}`,
            );
            console.log(
              `👥 Buyer groups created: ${data.results.buyerGroupsCreated?.length || 0}`,
            );
            console.log(
              `🧠 Intelligence generated: ${Object.keys(data.results.intelligence || {}).length} companies`,
            );
          }

          return data;
        }

        if (status === "failed") {
          console.error("\n❌ Enrichment failed!");
          if (data.results?.errors) {
            console.log("Errors:", data.results.errors);
          }
          return data;
        }
      } else {
        console.error("❌ Failed to poll status:", response.status);
        break;
      }

      // Wait 5 seconds before next poll
      await new Promise((resolve) => setTimeout(resolve, 5000));
      pollCount++;
    } catch (error) {
      console.error("❌ Error polling status:", error.message);
      break;
    }
  }

  console.log("⏰ Monitoring timeout reached");
}

async function main() {
  const envArg = process.argv[2];

  if (!envArg || !["dev", "prod", "both"].includes(envArg)) {
    console.log(`
🧠 Monaco Bulk Enrichment Trigger

Usage:
  node scripts/trigger-bulk-enrichment.js <environment> [options]

Environments:
  dev     Trigger enrichment for development environment
  prod    Show what would be triggered for production
  both    Process both environments

Options:
  --monitor    Monitor enrichment progress in real-time (dev only)

Examples:
  node scripts/trigger-bulk-enrichment.js dev --monitor
  node scripts/trigger-bulk-enrichment.js prod  
  node scripts/trigger-bulk-enrichment.js both
    `);
    return;
  }

  if (envArg === "both") {
    await triggerEnrichment("dev");
    await triggerEnrichment("prod");
  } else {
    await triggerEnrichment(envArg);
  }
}

main().catch(console.error);
