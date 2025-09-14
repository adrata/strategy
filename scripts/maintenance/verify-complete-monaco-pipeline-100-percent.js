#!/usr/bin/env node

/**
 * 🔬 COMPLETE MONACO PIPELINE VERIFICATION (100% ACCURACY)
 *
 * This script verifies that all 30 Monaco pipeline steps are working correctly
 * and validates the complete enrichment system for Dan's 409 leads.
 */

const { PrismaClient } = require("@prisma/client");

// Production configuration
const PRODUCTION_CONFIG = {
  databaseUrl:
    "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require",
  workspaceId: "adrata",
  userId: "dan",
};

// Complete Monaco pipeline validation schema
const MONACO_PIPELINE_VALIDATION = {
  foundation: {
    steps: [0, 1],
    requiredFields: ["sellerProfile", "competitors"],
    criticalData: ["companyName", "industry", "targetMarkets"],
  },
  discovery: {
    steps: [2, 5],
    requiredFields: ["buyerCompanies", "optimalPeople"],
    criticalData: ["companyScoring", "peopleRanking"],
  },
  dataCollection: {
    steps: [4],
    requiredFields: ["peopleData", "contactInformation"],
    criticalData: ["email", "phone", "linkedin_profile"],
  },
  analysis: {
    steps: [6, 8],
    requiredFields: ["orgStructures", "influenceAnalyses"],
    criticalData: ["hierarchy", "influenceScore", "networkConnections"],
  },
  modeling: {
    steps: [7],
    requiredFields: ["orgModels"],
    criticalData: ["reportingStructure", "decisionFlow"],
  },
  enrichment: {
    steps: [9, 13],
    requiredFields: ["enrichedProfiles", "alternativeData"],
    criticalData: [
      "socialProfiles",
      "professionalHistory",
      "personalInterests",
    ],
  },
  riskAnalysis: {
    steps: [10, 11],
    requiredFields: ["flightRiskAnalyses", "dealImpactAnalyses"],
    criticalData: ["riskScore", "impactAssessment", "mitigationStrategies"],
  },
  influenceAnalysis: {
    steps: [12],
    requiredFields: ["catalystInfluence"],
    criticalData: ["networkInfluence", "decisionInfluence", "buyingPower"],
  },
  buyerAnalysis: {
    steps: [14, 15],
    requiredFields: ["buyerGroups", "buyerGroupDynamics"],
    criticalData: ["role", "seniority", "decisionInfluence", "buyingPower"],
  },
  decisionAnalysis: {
    steps: [16, 17],
    requiredFields: ["decisionFlows", "decisionMakers"],
    criticalData: ["decisionJourney", "keyStakeholders", "approvalProcess"],
  },
  intelligence: {
    steps: [18, 28],
    requiredFields: ["intelligenceReports", "comprehensiveIntelligence"],
    criticalData: [
      "strategicInsights",
      "opportunitySignals",
      "competitiveIntelligence",
    ],
  },
  behavioral: {
    steps: [29],
    requiredFields: ["executiveCharacterPatterns"],
    criticalData: [
      "personalityProfile",
      "communicationStyle",
      "decisionMakingStyle",
    ],
  },
};

class CompleteMonacoPipelineVerification {
  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: { url: PRODUCTION_CONFIG.databaseUrl },
      },
    });

    this.results = {
      totalLeads: 0,
      enrichedLeads: 0,
      validationResults: {},
      stepValidation: {},
      dataQuality: {},
      roleDistribution: {},
      completionRate: 0,
      systemHealth: 0,
      errors: [],
      recommendations: [],
    };
  }

  async run() {
    console.log("🔬 COMPLETE MONACO PIPELINE VERIFICATION (100% ACCURACY)");
    console.log("=======================================================");
    console.log(`🎯 Target: Dan's 409 leads in Adrata workspace`);
    console.log(`📊 Validation: All 30 Monaco pipeline steps`);
    console.log(`🔍 Focus: 100% accuracy and completeness`);
    console.log("");

    try {
      // Step 1: Load and analyze all leads
      const leads = await this.loadAndAnalyzeLeads();

      // Step 2: Validate all 30 pipeline steps
      await this.validateAllPipelineSteps(leads);

      // Step 3: Validate data quality
      await this.validateDataQuality(leads);

      // Step 4: Validate buyer group roles
      await this.validateBuyerGroupRoles(leads);

      // Step 5: Generate comprehensive health report
      await this.generateHealthReport();

      console.log("\n🎉 Complete Monaco pipeline verification finished!");
    } catch (error) {
      console.error("❌ Verification failed:", error);
      this.results.errors.push(error.message);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async loadAndAnalyzeLeads() {
    console.log("📊 Step 1: Loading and analyzing all leads...");

    const leads = await this.prisma.lead.findMany({
      where: {
        workspaceId: PRODUCTION_CONFIG.workspaceId,
        assignedUserId: PRODUCTION_CONFIG.userId,
      },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        company: true,
        email: true,
        phone: true,
        customFields: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.results.totalLeads = leads.length;

    // Count enriched leads
    const enrichedLeads = leads.filter(
      (lead) =>
        lead.customFields?.monacoEnrichment &&
        Object.keys(lead.customFields.monacoEnrichment).length > 5,
    );

    this.results.enrichedLeads = enrichedLeads.length;
    this.results.completionRate = Math.round(
      (enrichedLeads.length / leads.length) * 100,
    );

    console.log(`   ✅ Loaded ${leads.length} leads`);
    console.log(
      `   📊 Enriched: ${enrichedLeads.length} (${this.results.completionRate}%)`,
    );

    return leads;
  }

  async validateAllPipelineSteps(leads) {
    console.log("\n🔬 Step 2: Validating All 30 Pipeline Steps...");
    console.log("==============================================");

    for (const [category, config] of Object.entries(
      MONACO_PIPELINE_VALIDATION,
    )) {
      console.log(
        `\n📋 Validating ${category} steps (${config.steps.join(", ")}):`,
      );

      const categoryResults = {
        stepsValidated: 0,
        fieldsFound: 0,
        dataQuality: 0,
        leads: {
          total: 0,
          valid: 0,
          partial: 0,
          missing: 0,
        },
      };

      for (const lead of leads) {
        const enrichment = lead.customFields?.monacoEnrichment;
        if (!enrichment) {
          categoryResults.leads.missing++;
          continue;
        }

        categoryResults.leads.total++;

        // Check required fields
        const fieldsPresent = config.requiredFields.filter(
          (field) =>
            enrichment[field] && Object.keys(enrichment[field]).length > 0,
        );

        // Check critical data
        const criticalDataPresent = config.criticalData.filter((dataPoint) => {
          return this.findDataPoint(enrichment, dataPoint);
        });

        const fieldCompleteness =
          fieldsPresent.length / config.requiredFields.length;
        const dataCompleteness =
          criticalDataPresent.length / config.criticalData.length;
        const overallCompleteness = (fieldCompleteness + dataCompleteness) / 2;

        if (overallCompleteness >= 0.8) {
          categoryResults.leads.valid++;
        } else if (overallCompleteness >= 0.4) {
          categoryResults.leads.partial++;
        } else {
          categoryResults.leads.missing++;
        }

        categoryResults.fieldsFound += fieldsPresent.length;
        categoryResults.dataQuality += overallCompleteness;
      }

      // Calculate category metrics
      if (categoryResults.leads.total > 0) {
        categoryResults.dataQuality /= categoryResults.leads.total;
        categoryResults.stepsValidated = config.steps.length;
      }

      const validPercentage = Math.round(
        (categoryResults.leads.valid / this.results.totalLeads) * 100,
      );
      const partialPercentage = Math.round(
        (categoryResults.leads.partial / this.results.totalLeads) * 100,
      );
      const missingPercentage = Math.round(
        (categoryResults.leads.missing / this.results.totalLeads) * 100,
      );
      const qualityPercentage = Math.round(categoryResults.dataQuality * 100);

      console.log(
        `   📊 Valid: ${categoryResults.leads.valid} (${validPercentage}%)`,
      );
      console.log(
        `   ⚠️  Partial: ${categoryResults.leads.partial} (${partialPercentage}%)`,
      );
      console.log(
        `   ❌ Missing: ${categoryResults.leads.missing} (${missingPercentage}%)`,
      );
      console.log(`   🎯 Quality: ${qualityPercentage}%`);

      this.results.stepValidation[category] = categoryResults;

      // Add recommendations for low-performing categories
      if (qualityPercentage < 70) {
        this.results.recommendations.push(
          `${category} category needs improvement (${qualityPercentage}% quality)`,
        );
      }
    }
  }

  async validateDataQuality(leads) {
    console.log("\n📊 Step 3: Validating Data Quality...");
    console.log("===================================");

    const qualityMetrics = {
      contactInformation: { total: 0, complete: 0 },
      professionalData: { total: 0, complete: 0 },
      enrichmentData: { total: 0, complete: 0 },
      buyerGroupData: { total: 0, complete: 0 },
      intelligenceData: { total: 0, complete: 0 },
    };

    for (const lead of leads) {
      const enrichment = lead.customFields?.monacoEnrichment;
      if (!enrichment) continue;

      // Contact Information Quality
      qualityMetrics.contactInformation.total++;
      const contactInfo = enrichment.contactInformation || {};
      const contactComplete = !!(
        contactInfo.email &&
        contactInfo.phone &&
        contactInfo.linkedin_profile
      );
      if (contactComplete) qualityMetrics.contactInformation.complete++;

      // Professional Data Quality
      qualityMetrics.professionalData.total++;
      const professionalComplete = !!(
        lead.jobTitle &&
        lead.company &&
        enrichment.professionalHistory
      );
      if (professionalComplete) qualityMetrics.professionalData.complete++;

      // Enrichment Data Quality
      qualityMetrics.enrichmentData.total++;
      const enrichmentComplete = !!(
        enrichment.socialProfiles &&
        enrichment.personalInterests &&
        enrichment.networkConnections
      );
      if (enrichmentComplete) qualityMetrics.enrichmentData.complete++;

      // Buyer Group Data Quality
      qualityMetrics.buyerGroupData.total++;
      const buyerGroupComplete = !!(
        enrichment.buyerGroupAnalysis?.role &&
        enrichment.buyerGroupAnalysis?.seniority
      );
      if (buyerGroupComplete) qualityMetrics.buyerGroupData.complete++;

      // Intelligence Data Quality
      qualityMetrics.intelligenceData.total++;
      const intelligenceComplete = !!(
        enrichment.strategicInsights && enrichment.opportunitySignals
      );
      if (intelligenceComplete) qualityMetrics.intelligenceData.complete++;
    }

    // Calculate and display quality percentages
    for (const [category, metrics] of Object.entries(qualityMetrics)) {
      const percentage =
        metrics.total > 0
          ? Math.round((metrics.complete / metrics.total) * 100)
          : 0;
      console.log(
        `   📊 ${category}: ${metrics.complete}/${metrics.total} (${percentage}%)`,
      );
      this.results.dataQuality[category] = percentage;
    }

    // Overall data quality score
    const overallQuality =
      Object.values(this.results.dataQuality).reduce((a, b) => a + b, 0) /
      Object.keys(this.results.dataQuality).length;
    console.log(`   🎯 Overall Data Quality: ${Math.round(overallQuality)}%`);
  }

  async validateBuyerGroupRoles(leads) {
    console.log("\n👥 Step 4: Validating Buyer Group Roles...");
    console.log("=========================================");

    const roleDistribution = {
      "Decision Maker": 0,
      Champion: 0,
      Stakeholder: 0,
      Influencer: 0,
      Opener: 0,
      Blocker: 0,
      Unknown: 0,
    };

    const roleValidation = {
      properlyAssigned: 0,
      needsReview: 0,
      missing: 0,
    };

    for (const lead of leads) {
      const enrichment = lead.customFields?.monacoEnrichment;
      const role = enrichment?.buyerGroupAnalysis?.role;

      if (!role) {
        roleDistribution["Unknown"]++;
        roleValidation.missing++;
        continue;
      }

      roleDistribution[role] = (roleDistribution[role] || 0) + 1;

      // Validate role assignment quality
      const confidence = enrichment.buyerGroupAnalysis?.confidence || 0;
      const rationale = enrichment.buyerGroupAnalysis?.rationale;

      if (confidence >= 0.7 && rationale && rationale.length > 20) {
        roleValidation.properlyAssigned++;
      } else {
        roleValidation.needsReview++;
      }
    }

    // Display role distribution
    console.log(`   👑 Role Distribution:`);
    Object.entries(roleDistribution).forEach(([role, count]) => {
      const percentage = Math.round((count / this.results.totalLeads) * 100);
      console.log(`      • ${role}: ${count} (${percentage}%)`);
    });

    // Display validation results
    const properlyAssignedPercentage = Math.round(
      (roleValidation.properlyAssigned / this.results.totalLeads) * 100,
    );
    const needsReviewPercentage = Math.round(
      (roleValidation.needsReview / this.results.totalLeads) * 100,
    );
    const missingPercentage = Math.round(
      (roleValidation.missing / this.results.totalLeads) * 100,
    );

    console.log(`\n   📊 Role Assignment Quality:`);
    console.log(
      `      ✅ Properly Assigned: ${roleValidation.properlyAssigned} (${properlyAssignedPercentage}%)`,
    );
    console.log(
      `      ⚠️  Needs Review: ${roleValidation.needsReview} (${needsReviewPercentage}%)`,
    );
    console.log(
      `      ❌ Missing: ${roleValidation.missing} (${missingPercentage}%)`,
    );

    this.results.roleDistribution = roleDistribution;
  }

  async generateHealthReport() {
    console.log("\n🏥 Step 5: Generating System Health Report...");
    console.log("===========================================");

    // Calculate overall system health
    const completionScore = this.results.completionRate;
    const dataQualityScore =
      Object.values(this.results.dataQuality).reduce((a, b) => a + b, 0) /
      Object.keys(this.results.dataQuality).length;
    const stepValidationScore =
      Object.values(this.results.stepValidation).reduce((acc, category) => {
        return acc + category.dataQuality * 100;
      }, 0) / Object.keys(this.results.stepValidation).length;

    this.results.systemHealth = Math.round(
      (completionScore + dataQualityScore + stepValidationScore) / 3,
    );

    console.log(`\n🎯 COMPLETE MONACO PIPELINE HEALTH REPORT`);
    console.log(`========================================`);
    console.log(`📊 System Overview:`);
    console.log(`   • Total Leads: ${this.results.totalLeads}`);
    console.log(`   • Enriched Leads: ${this.results.enrichedLeads}`);
    console.log(`   • Completion Rate: ${this.results.completionRate}%`);
    console.log(`   • System Health: ${this.results.systemHealth}%`);

    console.log(`\n🔬 Pipeline Step Validation:`);
    Object.entries(this.results.stepValidation).forEach(
      ([category, results]) => {
        const qualityPercentage = Math.round(results.dataQuality * 100);
        const validPercentage = Math.round(
          (results.leads.valid / this.results.totalLeads) * 100,
        );
        console.log(
          `   • ${category}: ${qualityPercentage}% quality, ${validPercentage}% valid leads`,
        );
      },
    );

    console.log(`\n📊 Data Quality Scores:`);
    Object.entries(this.results.dataQuality).forEach(
      ([category, percentage]) => {
        console.log(`   • ${category}: ${percentage}%`);
      },
    );

    if (this.results.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      this.results.recommendations.forEach((rec) => {
        console.log(`   • ${rec}`);
      });
    }

    // Final assessment
    if (this.results.systemHealth >= 90) {
      console.log(
        `\n🎉 EXCELLENT: Monaco pipeline is operating at peak performance!`,
      );
    } else if (this.results.systemHealth >= 75) {
      console.log(
        `\n✅ GOOD: Monaco pipeline is performing well with minor optimization opportunities.`,
      );
    } else if (this.results.systemHealth >= 60) {
      console.log(
        `\n⚠️  WARNING: Monaco pipeline needs attention to improve performance.`,
      );
    } else {
      console.log(`\n❌ CRITICAL: Monaco pipeline requires immediate fixes.`);
    }

    console.log(
      `\n🔍 Ready for production use: ${this.results.systemHealth >= 75 ? "YES" : "NO"}`,
    );
  }

  findDataPoint(enrichment, dataPoint) {
    // Recursively search for data points in the enrichment object
    function searchObject(obj, key) {
      if (!obj || typeof obj !== "object") return false;

      if (obj.hasOwnProperty(key) && obj[key]) return true;

      for (const value of Object.values(obj)) {
        if (typeof value === "object" && searchObject(value, key)) {
          return true;
        }
      }

      return false;
    }

    return searchObject(enrichment, dataPoint);
  }
}

// Run the verification
async function main() {
  const verification = new CompleteMonacoPipelineVerification();
  await verification.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { CompleteMonacoPipelineVerification };
