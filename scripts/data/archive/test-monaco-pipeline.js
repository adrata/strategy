#!/usr/bin/env node

/**
 * 🎯 MONACO PIPELINE TEST
 * Test the Monaco pipeline with our local leads data
 */

import { PrismaClient } from "@prisma/client";
import { Pipeline } from "../src/lib/monaco-pipeline/Pipeline.js";
import fs from "fs/promises";

const DATABASE_URL =
  "postgresql://rosssylvester:Themill08!@localhost:5432/adrata-local";

async function testMonacoPipeline() {
  console.log("🎯 Testing Monaco Pipeline with Local Leads...\n");

  try {
    // Connect to local database
    const prisma = new PrismaClient({
      datasources: { db: { url: DATABASE_URL } },
    });

    await prisma.$connect();
    console.log("✅ Connected to local database");

    // Get local leads data
    const leads = await prisma.lead.findMany({
      take: 10, // Test with first 10 leads
      include: {
        workspace: true,
        assignedUser: true,
      },
    });

    console.log(`📊 Found ${leads.length} leads for testing`);

    // Create Monaco pipeline configuration
    const pipelineConfig = {
      apiKeys: {
        brightdata:
          process.env.BRIGHTDATA_API_KEY ||
          "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e",
        anthropic: process.env.ANTHROPIC_API_KEY || "",
        openai: process.env.OPENAI_API_KEY || "",
      },
      datasetIds: {
        linkedinCompanies: "gd_ljkx5d16rgkn3eqe9t",
        linkedinPeople: "gd_lj7k8x2qx3c0v3y6kn",
        b2bEnrichment: "gd_l4z1a5b7x2e3k7n8m9",
      },
      pipeline: {
        maxCompanies: 5, // Limited for testing
        minSearchPool: 10,
        outputDir: "./monaco-output",
        logLevel: "info",
      },
      sellerProfile: {
        companyName: "Adrata",
        industry: "Business Intelligence",
        companySize: "Growth",
        product: "AI-Powered Sales Intelligence Platform",
        salesTeam: "Distributed",
        targetMarkets: ["Enterprise", "Mid-Market"],
        successCriteria: [
          "Pipeline Growth",
          "Win Rate Improvement",
          "Sales Efficiency",
        ],
      },
      buyerFilter: {
        industry: ["Technology", "Finance", "Healthcare"],
        companySize: ["51-200", "201-500", "501-1000", "1000+"],
        revenue: "$10M+",
        techStack: ["Salesforce", "HubSpot", "Microsoft"],
      },
    };

    console.log("🏭 Initializing Monaco Pipeline...");

    // Initialize pipeline
    const pipeline = new Pipeline(pipelineConfig);

    // Convert leads to buyer companies format
    const buyerCompanies = leads.map((lead) => ({
      id: `company_${lead.id}`,
      name: lead.company,
      website: `https://${lead.company.toLowerCase().replace(/\s+/g, "")}.com`,
      linkedinUrl: "",
      industry: "Technology",
      companySize: "201-500",
      revenue: "$10M+",
      techStack: ["Salesforce", "HubSpot"],
      matchScore: 85,
      competitors: [],
      location: {
        country: lead.country || "United States",
        city: lead.city || "Unknown",
      },
    }));

    console.log(
      `🎯 Testing with companies: ${buyerCompanies.map((c) => c.name).join(", ")}`,
    );

    // Inject our leads data into pipeline
    const pipelineData = pipeline.getData();
    pipelineData.buyerCompanies = buyerCompanies;

    // Create output directory
    await fs.mkdir("./monaco-output", { recursive: true });

    console.log("🚀 Running Monaco Pipeline...\n");

    // Run pipeline (just first few steps for testing)
    try {
      await pipeline.run();
      console.log("\n✅ Monaco Pipeline completed successfully!");

      // Get results
      const results = pipeline.getData();
      const state = pipeline.getState();

      console.log("\n📊 PIPELINE RESULTS:");
      console.log(`   Status: ${state.status}`);
      console.log(
        `   Steps completed: ${state.currentStep}/${state.totalSteps}`,
      );
      console.log(
        `   Buyer companies processed: ${results.buyerCompanies?.length || 0}`,
      );
      console.log(`   People data: ${results.peopleData?.length || 0}`);
      console.log(`   Buyer groups: ${results.buyerGroups?.length || 0}`);
      console.log(
        `   Intelligence reports: ${results.intelligenceReports?.length || 0}`,
      );

      // Save results
      await fs.writeFile(
        "./monaco-output/pipeline-results.json",
        JSON.stringify(results, null, 2),
      );
      await fs.writeFile(
        "./monaco-output/pipeline-state.json",
        JSON.stringify(state, null, 2),
      );

      console.log("\n💾 Results saved to ./monaco-output/");
    } catch (pipelineError) {
      console.log(
        `\n⚠️ Pipeline completed with issues: ${pipelineError.message}`,
      );
      console.log("📊 Partial results may be available in ./monaco-output/");
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Monaco pipeline test failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testMonacoPipeline();
}

export default testMonacoPipeline;
