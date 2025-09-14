#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require",
    },
  },
});

async function verifyDatabase() {
  console.log("🔍 COMPREHENSIVE DATABASE VERIFICATION");
  console.log("======================================");

  try {
    // Count total leads
    const totalLeads = await prisma.lead.count({
      where: {
        workspaceId: "adrata",
        assignedUserId: "dan",
      },
    });

    // Count enriched leads (have monacoEnrichment data)
    const enrichedLeads = await prisma.lead.findMany({
      where: {
        workspaceId: "adrata",
        assignedUserId: "dan",
      },
      select: {
        id: true,
        fullName: true,
        company: true,
        jobTitle: true,
        customFields: true,
        lastEnriched: true,
        updatedAt: true,
      },
    });

    // Count leads with complete Monaco data
    let completeEnrichments = 0;
    let partialEnrichments = 0;
    let noEnrichments = 0;

    const sampleComplete = [];

    enrichedLeads.forEach((lead) => {
      const enrichment = lead.customFields?.monacoEnrichment;

      if (!enrichment) {
        noEnrichments++;
        return;
      }

      // Check for key Monaco fields
      const hasRole = !!enrichment.buyerGroupAnalysis?.role;
      const hasFitScore = !!enrichment.opportunityIntelligence?.fitScore;
      const hasMotivations =
        !!enrichment.executiveCharacterPatterns?.motivations;
      const hasOverallScore =
        !!enrichment.comprehensiveIntelligence?.overallScore;
      const hasCompetitive = !!enrichment.competitiveIntelligence;

      if (
        hasRole &&
        hasFitScore &&
        hasMotivations &&
        hasOverallScore &&
        hasCompetitive
      ) {
        completeEnrichments++;
        if (sampleComplete.length < 5) {
          sampleComplete.push({
            name: lead.fullName,
            company: lead.company,
            title: lead.jobTitle,
            role: enrichment.buyerGroupAnalysis.role,
            fitScore: enrichment.opportunityIntelligence.fitScore,
            motivations: enrichment.executiveCharacterPatterns.motivations,
            overallScore: enrichment.comprehensiveIntelligence.overallScore,
            updatedAt: lead.updatedAt,
          });
        }
      } else {
        partialEnrichments++;
      }
    });

    // Results
    console.log("📊 DATABASE STATUS:");
    console.log("==================");
    console.log(`✅ Total leads: ${totalLeads}`);
    console.log(
      `🧠 Complete enrichments: ${completeEnrichments} (${Math.round((completeEnrichments / totalLeads) * 100)}%)`,
    );
    console.log(
      `⚠️  Partial enrichments: ${partialEnrichments} (${Math.round((partialEnrichments / totalLeads) * 100)}%)`,
    );
    console.log(
      `❌ No enrichments: ${noEnrichments} (${Math.round((noEnrichments / totalLeads) * 100)}%)`,
    );

    // Sample data
    console.log("\n🎯 SAMPLE COMPLETE ENRICHMENTS:");
    console.log("===============================");
    sampleComplete.forEach((lead, i) => {
      console.log(`${i + 1}. ${lead.name} - ${lead.company}`);
      console.log(`   Title: ${lead.title}`);
      console.log(`   🎯 Buyer Role: ${lead.role}`);
      console.log(`   📊 Fit Score: ${lead.fitScore}`);
      console.log(
        `   💡 Motivations: ${Array.isArray(lead.motivations) ? lead.motivations.join(", ") : lead.motivations}`,
      );
      console.log(`   ⭐ Overall Score: ${Math.round(lead.overallScore)}/100`);
      console.log(
        `   🕐 Updated: ${lead.updatedAt.toISOString().split("T")[0]}`,
      );
      console.log("");
    });

    // Latest execution check
    const latestExecution = await prisma.enrichmentExecution.findFirst({
      where: { workspaceId: "adrata" },
      orderBy: { startTime: "desc" },
      select: {
        executionId: true,
        status: true,
        completedCompanies: true,
        totalCompanies: true,
        startTime: true,
        endTime: true,
        totalDuration: true,
      },
    });

    if (latestExecution) {
      console.log("🔄 LATEST EXECUTION:");
      console.log("===================");
      console.log(`📋 ID: ${latestExecution.executionId}`);
      console.log(`✅ Status: ${latestExecution.status}`);
      console.log(
        `📊 Progress: ${latestExecution.completedCompanies}/${latestExecution.totalCompanies}`,
      );
      console.log(
        `⏱️  Duration: ${Math.round(latestExecution.totalDuration / 1000)}s`,
      );
      console.log(
        `🕐 Completed: ${latestExecution.endTime?.toISOString().split("T")[0]}`,
      );
    }

    // Final verdict
    console.log("\n🎯 VERIFICATION RESULT:");
    console.log("======================");

    if (completeEnrichments === totalLeads) {
      console.log("🎉 DATABASE IS COMPLETELY UPDATED!");
      console.log("✅ All 409 leads have comprehensive Monaco enrichment");
      console.log("✅ All sophisticated intelligence fields populated");
      console.log("✅ Ready for world-class sales intelligence!");
    } else if (completeEnrichments > totalLeads * 0.9) {
      console.log("🟡 DATABASE IS MOSTLY UPDATED");
      console.log(`✅ ${completeEnrichments} leads fully enriched`);
      console.log(
        `⚠️  ${partialEnrichments + noEnrichments} leads need attention`,
      );
    } else {
      console.log("🔴 DATABASE NEEDS MORE ENRICHMENT");
      console.log(`❌ Only ${completeEnrichments} leads fully enriched`);
      console.log("🔄 Consider running enrichment again");
    }
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();
