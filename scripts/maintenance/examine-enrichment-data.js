#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require",
    },
  },
});

async function examineData() {
  console.log("🔍 EXAMINING ENRICHMENT DATA STRUCTURE");
  console.log("====================================");

  try {
    const lead = await prisma.lead.findFirst({
      where: {
        workspaceId: "adrata",
        assignedUserId: "dan",
        fullName: "Christian Smith",
      },
      select: {
        fullName: true,
        jobTitle: true,
        company: true,
        customFields: true,
      },
    });

    if (lead) {
      console.log(`📊 Lead: ${lead.fullName}`);
      console.log(`💼 Job Title: ${lead.jobTitle}`);
      console.log(`🏢 Company: ${lead.company}`);

      const enrichment = lead.customFields?.monacoEnrichment;
      if (enrichment) {
        console.log("\n📋 Available Enrichment Fields:");
        Object.keys(enrichment).forEach((key) => {
          console.log(`   • ${key}`);
        });

        if (enrichment.buyerGroupAnalysis) {
          console.log("\n👥 Buyer Group Analysis:");
          console.log(`   • Role: ${enrichment.buyerGroupAnalysis.role}`);
          console.log(
            `   • Seniority: ${enrichment.buyerGroupAnalysis.seniority}`,
          );
          console.log(
            `   • Decision Influence: ${enrichment.buyerGroupAnalysis.decisionInfluence}`,
          );
          console.log(
            `   • Confidence: ${enrichment.buyerGroupAnalysis.confidence}`,
          );
        }

        console.log("\n📊 Data Completeness:");
        console.log(
          `   • Contact Info: ${!!enrichment.contactInformation ? "Yes" : "No"}`,
        );
        console.log(
          `   • Personality: ${!!enrichment.personalityProfile ? "Yes" : "No"}`,
        );
        console.log(
          `   • Professional History: ${!!enrichment.professionalHistory ? "Yes" : "No"}`,
        );
        console.log(
          `   • Strategic Insights: ${!!enrichment.strategicInsights ? "Yes" : "No"}`,
        );

        // Check for the logical inconsistency
        const role = enrichment.buyerGroupAnalysis?.role;
        const seniority = enrichment.buyerGroupAnalysis?.seniority;
        const jobTitle = lead.jobTitle?.toLowerCase() || "";

        console.log("\n🧠 Logical Analysis:");
        console.log(`   • Job Title: "${lead.jobTitle}"`);
        console.log(`   • Assigned Role: ${role}`);
        console.log(`   • Assigned Seniority: ${seniority}`);

        if (
          role === "Decision Maker" &&
          seniority === "Individual Contributor"
        ) {
          console.log(
            "   ❌ INCONSISTENCY: Individual Contributor as Decision Maker",
          );
        } else {
          console.log("   ✅ Role assignment appears logical");
        }

        // Check if CRO should be C-Level
        if (
          jobTitle.includes("chief revenue officer") ||
          jobTitle.includes("cro")
        ) {
          if (seniority !== "C-Level") {
            console.log("   ❌ INCONSISTENCY: CRO should be C-Level seniority");
          } else {
            console.log("   ✅ CRO correctly assigned as C-Level");
          }
        }
      } else {
        console.log("❌ No Monaco enrichment found");
      }
    } else {
      console.log("❌ Lead not found");
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

examineData();
