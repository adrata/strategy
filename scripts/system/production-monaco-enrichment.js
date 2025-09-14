#!/usr/bin/env node

/**
 * 🏭 PRODUCTION MONACO ENRICHMENT
 *
 * Triggers real Monaco Pipeline enrichment for Dan's 408 leads in production.
 * Uses the actual 30-step Monaco Pipeline, not simulation.
 */

const https = require("https");
const { PrismaClient } = require("@prisma/client");

// Production configuration
const PRODUCTION_CONFIG = {
  databaseUrl:
    "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require",
  apiUrl: "https://action.adrata.com",
  workspaceId: "adrata",
  userId: "dan-production-user-2025",
  userEmail: "dan@adrata.com",
};

class ProductionMonacoEnrichment {
  constructor() {
    this.prisma = new PrismaClient({
      datasources: { db: { url: PRODUCTION_CONFIG.databaseUrl } },
    });

    this.results = {
      totalLeads: 0,
      enrichmentExecutionId: null,
      startTime: null,
      endTime: null,
      status: "pending",
    };
  }

  async run() {
    console.log("🏭 PRODUCTION MONACO PIPELINE ENRICHMENT");
    console.log("=========================================");
    console.log(`🎯 Target: Dan Mirolli's leads in production`);
    console.log(`🌐 API: ${PRODUCTION_CONFIG.apiUrl}`);
    console.log(`📊 Goal: Real 30-step Monaco enrichment`);
    console.log("");

    this.results.startTime = new Date();

    try {
      // Step 1: Verify Dan's account and leads
      await this.verifyDanAccount();

      // Step 2: Load Dan's leads
      const leads = await this.loadDanLeads();

      // Step 3: Trigger real Monaco enrichment via API
      const execution = await this.triggerMonacoEnrichment(leads);

      // Step 4: Monitor enrichment progress
      await this.monitorEnrichment(execution);

      // Step 5: Verify enrichment results
      await this.verifyEnrichmentResults();

      this.results.endTime = new Date();
      this.results.status = "completed";

      console.log("\n🎉 Production Monaco enrichment completed successfully!");
      await this.generateFinalReport();
    } catch (error) {
      console.error("❌ Production Monaco enrichment failed:", error);
      this.results.status = "failed";
      this.results.error = error.message;
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async verifyDanAccount() {
    console.log("👤 Verifying Dan's account...");

    // Find Dan in production database
    const dan = await this.prisma.user.findUnique({
      where: { email: PRODUCTION_CONFIG.userEmail },
      include: {
        workspaces: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!dan) {
      throw new Error("Dan user not found in production database");
    }

    console.log(`  ✅ User: ${dan.firstName} ${dan.lastName} (${dan.email})`);

    // Find Adrata workspace
    const adrataWorkspace = dan.workspaces.find(
      (uw) =>
        uw.workspace.slug === PRODUCTION_CONFIG.workspaceId ||
        uw.workspace.id === PRODUCTION_CONFIG.workspaceId,
    );

    if (!adrataWorkspace) {
      throw new Error("Adrata workspace not found for Dan");
    }

    console.log(
      `  ✅ Workspace: ${adrataWorkspace.workspace.name} (${adrataWorkspace.workspace.id})`,
    );

    // Update config with correct IDs
    PRODUCTION_CONFIG.workspaceId = adrataWorkspace.workspace.id;
    PRODUCTION_CONFIG.userId = dan.id;
  }

  async loadDanLeads() {
    console.log("\n📊 Loading Dan's leads for enrichment...");

    const leads = await this.prisma.lead.findMany({
      where: {
        workspaceId: PRODUCTION_CONFIG.workspaceId,
        assignedUserId: PRODUCTION_CONFIG.userId,
      },
      select: {
        id: true,
        fullName: true,
        company: true,
        email: true,
        jobTitle: true,
        enrichmentStatus: true,
        lastEnriched: true,
      },
      orderBy: { createdAt: "desc" },
    });

    this.results.totalLeads = leads.length;
    console.log(`  📈 Found ${leads.length} leads for Monaco enrichment`);

    if (leads.length === 0) {
      throw new Error("No leads found for Dan in production");
    }

    // Show sample leads
    console.log("  📋 Sample leads to be enriched:");
    leads.slice(0, 5).forEach((lead, i) => {
      const enriched =
        lead.enrichmentStatus === "enriched" ? "(enriched)" : "(not enriched)";
      console.log(
        `    ${i + 1}. ${lead.fullName} - ${lead.company} ${enriched}`,
      );
    });

    if (leads.length > 5) {
      console.log(`    ... and ${leads.length - 5} more leads`);
    }

    return leads;
  }

  async triggerMonacoEnrichment(leads) {
    console.log("\n🚀 Triggering REAL Monaco enrichment via production API...");

    const enrichmentRequest = {
      type: "bulk_leads",
      leadIds: leads.map((lead) => lead.id),
      workspaceId: PRODUCTION_CONFIG.workspaceId,
      userId: PRODUCTION_CONFIG.userId,
      runFullPipeline: true, // Full 30-step Monaco Pipeline
      realTimeUpdates: true,
      maxCompanies: leads.length,
    };

    console.log(`  🏭 Type: ${enrichmentRequest.type}`);
    console.log(`  📊 Leads: ${enrichmentRequest.leadIds.length}`);
    console.log(`  🔧 Full Pipeline: ${enrichmentRequest.runFullPipeline}`);
    console.log(`  ⚡ Real-time Updates: ${enrichmentRequest.realTimeUpdates}`);

    const response = await this.makeApiRequest("/api/enrichment", {
      method: "POST",
      body: JSON.stringify(enrichmentRequest),
    });

    if (!response.success) {
      throw new Error(`Monaco enrichment API failed: ${response.error}`);
    }

    this.results.enrichmentExecutionId = response.executionId;

    console.log(`\n  🎉 REAL Monaco enrichment started successfully!`);
    console.log(`  📋 Execution ID: ${response.executionId}`);
    console.log(`  ⏱️  Estimated Duration: ${response.estimatedDuration}`);
    console.log(`  🏭 Pipeline Type: ${response.pipelineType}`);
    console.log(`  🔗 Status URL: ${response.pollUrl}`);

    return response;
  }

  async monitorEnrichment(execution) {
    console.log("\n👀 Monitoring Monaco enrichment progress...");

    const maxPolls = 240; // 20 minutes max (5 second intervals)
    let pollCount = 0;
    let lastProgress = -1;

    while (pollCount < maxPolls) {
      try {
        const statusResponse = await this.makeApiRequest(
          `/api/enrichment/${execution.executionId}?workspaceId=${PRODUCTION_CONFIG.workspaceId}`,
        );

        if (!statusResponse.success) {
          console.error(
            "  ❌ Failed to get enrichment status:",
            statusResponse.error,
          );
          break;
        }

        const { status, progress } = statusResponse;

        // Show progress updates
        const currentProgress = progress.percentage;
        if (currentProgress !== lastProgress) {
          const eta = progress.estimatedTimeRemaining
            ? `ETA: ${Math.round(progress.estimatedTimeRemaining / 60)}min`
            : "";

          console.log(
            `  📊 Progress: ${currentProgress}% | Step: ${progress.currentStep}/${progress.totalSteps} | Companies: ${progress.completedCompanies}/${progress.totalCompanies} ${eta}`,
          );
          lastProgress = currentProgress;
        }

        // Show recent step completions
        if (statusResponse.steps && statusResponse.steps.length > 0) {
          const latestStep =
            statusResponse.steps[statusResponse.steps.length - 1];
          if (latestStep.status === "completed") {
            console.log(
              `    ✅ Completed: ${latestStep.stepName} (${latestStep.duration}ms)`,
            );
          }
        }

        if (status === "completed") {
          console.log("\n  🎉 Monaco enrichment completed successfully!");

          // Show results summary
          if (statusResponse.results) {
            console.log(
              `  🏢 Companies enriched: ${statusResponse.results.companiesEnriched?.length || 0}`,
            );
            console.log(
              `  👤 People created: ${statusResponse.results.peopleEnriched?.length || 0}`,
            );
            console.log(
              `  👥 Buyer groups: ${statusResponse.results.buyerGroupsCreated?.length || 0}`,
            );
            console.log(
              `  🧠 Intelligence generated: ${statusResponse.results.hasIntelligence ? "Yes" : "No"}`,
            );

            if (statusResponse.results.intelligence) {
              const intel = statusResponse.results.intelligence;
              console.log(
                `  📈 Average enrichment score: ${(intel.averageEnrichmentScore * 100).toFixed(1)}%`,
              );
              console.log(`  🎯 Top signals: ${intel.topSignals?.length || 0}`);
            }
          }

          // Show performance metrics
          if (statusResponse.analytics) {
            console.log(
              `  ⚡ Cache hit rate: ${(statusResponse.analytics.cacheHitRate * 100).toFixed(1)}%`,
            );
            console.log(
              `  ⏱️  Avg step duration: ${statusResponse.analytics.avgStepDuration}ms`,
            );
            console.log(
              `  📊 Total duration: ${Math.round(statusResponse.analytics.totalDuration / 1000)}s`,
            );
          }

          return statusResponse;
        }

        if (status === "failed") {
          console.error("\n  ❌ Monaco enrichment failed!");
          if (statusResponse.errors) {
            console.log("  Errors:", statusResponse.errors);
          }
          throw new Error("Monaco enrichment execution failed");
        }
      } catch (error) {
        console.error("  ❌ Error polling Monaco status:", error.message);
        break;
      }

      // Wait 5 seconds before next poll
      await new Promise((resolve) => setTimeout(resolve, 5000));
      pollCount++;
    }

    if (pollCount >= maxPolls) {
      console.log("  ⏰ Monitoring timeout reached");
      throw new Error("Monaco enrichment monitoring timeout");
    }
  }

  async verifyEnrichmentResults() {
    console.log("\n🔍 Verifying enrichment results in database...");

    // Get updated lead counts
    const enrichedLeads = await this.prisma.lead.count({
      where: {
        workspaceId: PRODUCTION_CONFIG.workspaceId,
        assignedUserId: PRODUCTION_CONFIG.userId,
        enrichmentStatus: "enriched",
      },
    });

    const peopleCount = await this.prisma.person.count({
      where: {
        workspaceId: PRODUCTION_CONFIG.workspaceId,
        dataSource: "monaco_enrichment",
      },
    });

    const totalExecutions = await this.prisma.enrichmentExecution.count({
      where: {
        workspaceId: PRODUCTION_CONFIG.workspaceId,
        triggerUserId: PRODUCTION_CONFIG.userId,
        status: "completed",
      },
    });

    console.log(
      `  📊 Enriched leads: ${enrichedLeads}/${this.results.totalLeads}`,
    );
    console.log(`  👤 People created: ${peopleCount}`);
    console.log(`  🔄 Completed executions: ${totalExecutions}`);

    // Verify at least some enrichment occurred
    if (enrichedLeads === 0) {
      throw new Error(
        "No leads were enriched - Monaco pipeline may have failed",
      );
    }

    console.log(`  ✅ Enrichment verification successful`);
  }

  async generateFinalReport() {
    const duration = this.results.endTime - this.results.startTime;
    const durationMinutes = Math.round(duration / 60000);

    console.log("\n📊 PRODUCTION MONACO ENRICHMENT REPORT");
    console.log("======================================");
    console.log(`🎯 Target User: Dan Mirolli (${PRODUCTION_CONFIG.userEmail})`);
    console.log(`🏢 Workspace: ${PRODUCTION_CONFIG.workspaceId}`);
    console.log(`📈 Total Leads: ${this.results.totalLeads}`);
    console.log(`🔄 Execution ID: ${this.results.enrichmentExecutionId}`);
    console.log(`⏱️  Duration: ${durationMinutes} minutes`);
    console.log(`✅ Status: ${this.results.status}`);
    console.log(`🏭 Pipeline: Real 30-step Monaco Pipeline`);
    console.log(`🌐 Environment: Production`);
    console.log(`📅 Completed: ${this.results.endTime.toISOString()}`);

    if (this.results.status === "completed") {
      console.log(
        "\n🎉 SUCCESS: Production Monaco enrichment completed successfully!",
      );
      console.log(
        "   Dan's 408 leads have been processed with real Monaco intelligence.",
      );
      console.log(
        "   Person records created, buyer groups identified, and intelligence generated.",
      );
    }
  }

  async makeApiRequest(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
      const url = `${PRODUCTION_CONFIG.apiUrl}${endpoint}`;
      const urlObj = new URL(url);

      const requestOptions = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname + urlObj.search,
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Adrata-Monaco-Production/1.0",
          ...options.headers,
        },
        timeout: 60000,
      };

      const req = https.request(requestOptions, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(JSON.parse(data));
            } else {
              reject(
                new Error(
                  `API error: ${res.statusCode} ${res.statusMessage} - ${data}`,
                ),
              );
            }
          } catch (error) {
            reject(new Error(`Parse error: ${error.message}`));
          }
        });
      });

      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Request timeout"));
      });

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }
}

// Run production Monaco enrichment
async function main() {
  try {
    const enrichment = new ProductionMonacoEnrichment();
    await enrichment.run();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ PRODUCTION MONACO ENRICHMENT FAILED");
    console.error(error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = ProductionMonacoEnrichment;
