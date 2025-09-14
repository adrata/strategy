#!/usr/bin/env node

/**
 * 🚀 RUN MONACO ENRICHMENT NOW
 *
 * Simplified script to run the real Monaco Pipeline on Dan's leads.
 * Uses the actual API endpoints we just created.
 */

const { PrismaClient } = require("@prisma/client");
const https = require("https");

// Production configuration
const CONFIG = {
  databaseUrl:
    "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require",
  apiUrl: "http://localhost:3000", // Use local dev server
  workspaceId: "adrata",
  userId: "dan",
};

class MonacoEnrichmentRunner {
  constructor() {
    this.prisma = new PrismaClient({
      datasources: { db: { url: CONFIG.databaseUrl } },
    });
  }

  async run() {
    console.log("🚀 RUNNING MONACO ENRICHMENT");
    console.log("============================");
    console.log(`🎯 User: ${CONFIG.userId}`);
    console.log(`🏢 Workspace: ${CONFIG.workspaceId}`);
    console.log(`🌐 API: ${CONFIG.apiUrl}`);
    console.log("");

    try {
      // Step 1: Load Dan's leads
      const leads = await this.loadLeads();

      // Step 2: Trigger Monaco enrichment via API
      const result = await this.triggerEnrichment(leads);

      // Step 3: Monitor progress
      await this.monitorProgress(result);

      console.log("\n🎉 Monaco enrichment completed successfully!");
    } catch (error) {
      console.error("❌ Monaco enrichment failed:", error.message);
      process.exit(1);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async loadLeads() {
    console.log("📊 Loading leads...");

    const leads = await this.prisma.lead.findMany({
      where: {
        workspaceId: CONFIG.workspaceId,
        assignedUserId: CONFIG.userId,
      },
      select: {
        id: true,
        fullName: true,
        company: true,
        customFields: true,
      },
    });

    console.log(`✅ Found ${leads.length} leads`);

    // Check current enrichment status
    const enriched = leads.filter(
      (lead) => lead.customFields?.monacoEnrichment,
    );

    console.log(`📈 Currently enriched: ${enriched.length}/${leads.length}`);

    if (leads.length === 0) {
      throw new Error("No leads found for Dan in adrata workspace");
    }

    return leads;
  }

  async triggerEnrichment(leads) {
    console.log("\n🚀 Triggering Monaco enrichment...");

    const requestBody = {
      type: "bulk_leads",
      leadIds: leads.map((lead) => lead.id),
      workspaceId: CONFIG.workspaceId,
      userId: CONFIG.userId,
      runFullPipeline: true,
      realTimeUpdates: true,
      maxCompanies: leads.length,
    };

    console.log(`📋 Enriching ${requestBody.leadIds.length} leads`);

    try {
      const response = await this.makeRequest("/api/enrichment", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      if (!response.success) {
        throw new Error(`API Error: ${response.error}`);
      }

      console.log("✅ Monaco enrichment started!");
      console.log(`📋 Execution ID: ${response.executionId}`);
      console.log(`⏱️  Estimated duration: ${response.estimatedDuration}`);

      return response;
    } catch (error) {
      console.error("❌ Failed to trigger enrichment:", error.message);
      throw error;
    }
  }

  async monitorProgress(result) {
    console.log("\n👀 Monitoring progress...");

    const maxPolls = 60; // 5 minutes max (5 second intervals)
    let pollCount = 0;

    while (pollCount < maxPolls) {
      try {
        const status = await this.makeRequest(
          `/api/enrichment/${result.executionId}?workspaceId=${CONFIG.workspaceId}`,
        );

        if (status.success) {
          const progress = status.progress || {};
          console.log(
            `📊 Progress: ${progress.percentage || 0}% | Step: ${progress.currentStep || 0}/${progress.totalSteps || 0} | Companies: ${progress.completedCompanies || 0}/${progress.totalCompanies || 0}`,
          );

          if (status.status === "completed") {
            console.log("✅ Enrichment completed!");
            if (status.results) {
              console.log(
                `🏢 Companies enriched: ${status.results.companiesEnriched?.length || 0}`,
              );
              console.log(
                `👤 People enriched: ${status.results.peopleEnriched?.length || 0}`,
              );
            }
            break;
          }

          if (status.status === "failed") {
            console.error("❌ Enrichment failed:", status.error);
            break;
          }
        }

        // Wait 5 seconds before next check
        await new Promise((resolve) => setTimeout(resolve, 5000));
        pollCount++;
      } catch (error) {
        console.warn(`⚠️  Status check failed: ${error.message}`);
        pollCount++;
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    if (pollCount >= maxPolls) {
      console.log("⏰ Monitoring timeout reached");
    }
  }

  async makeRequest(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
      const url = `${CONFIG.apiUrl}${endpoint}`;
      const urlObj = new URL(url);

      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Monaco-Enrichment-Runner/1.0",
          ...options.headers,
        },
      };

      const httpModule = urlObj.protocol === "https:" ? https : require("http");

      const req = httpModule.request(requestOptions, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (error) {
            reject(new Error(`Parse error: ${error.message}`));
          }
        });
      });

      req.on("error", reject);

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }
}

// Run the enrichment
async function main() {
  const runner = new MonacoEnrichmentRunner();
  await runner.run();
}

if (require.main === module) {
  main();
}
