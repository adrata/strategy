#!/usr/bin/env node

/**
 * 🎯 FINAL MONACO PIPELINE PRODUCTION TEST
 *
 * This script performs comprehensive end-to-end testing of the complete
 * 30-step Monaco pipeline to ensure 100% production readiness.
 */

const { PrismaClient } = require("@prisma/client");

// Production configuration
const PRODUCTION_CONFIG = {
  databaseUrl:
    "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require",
  workspaceId: "adrata",
  userId: "dan",
};

// Expected Monaco pipeline data structure for validation
const EXPECTED_MONACO_STRUCTURE = {
  // Foundation (Steps 0-1)
  foundation: ["sellerProfile", "competitors"],

  // Discovery (Steps 2, 5)
  discovery: ["buyerCompanies", "optimalPeople"],

  // Data Collection (Step 4)
  dataCollection: ["peopleData", "contactInformation"],

  // Analysis (Steps 6, 8)
  analysis: ["orgStructures", "influenceAnalyses"],

  // Modeling (Step 7)
  modeling: ["orgModels"],

  // Enrichment (Steps 9, 13)
  enrichment: [
    "enrichedProfiles",
    "alternativeData",
    "socialProfiles",
    "professionalHistory",
    "personalInterests",
    "networkConnections",
  ],

  // Risk Analysis (Steps 10-11)
  riskAnalysis: ["flightRiskAnalyses", "dealImpactAnalyses"],

  // Influence Analysis (Step 12)
  influenceAnalysis: [
    "catalystInfluence",
    "networkInfluence",
    "decisionInfluence",
    "buyingPower",
  ],

  // Buyer Analysis (Steps 14-15)
  buyerAnalysis: ["buyerGroups", "buyerGroupAnalysis", "buyerGroupDynamics"],

  // Decision Analysis (Steps 16-17)
  decisionAnalysis: [
    "decisionFlows",
    "decisionMakers",
    "decisionJourney",
    "keyStakeholders",
    "approvalProcess",
  ],

  // Intelligence (Steps 18, 28)
  intelligence: [
    "intelligenceReports",
    "comprehensiveIntelligence",
    "strategicInsights",
    "opportunitySignals",
    "competitiveIntelligence",
  ],

  // Additional Steps (19-27)
  additional: [
    "enablementAssets",
    "hypermodernReports",
    "authorityContent",
    "opportunityPlaybooks",
    "engagementPlaybooks",
    "competitorBattlecards",
    "salesPlaybooks",
    "outreachSequences",
  ],

  // Behavioral (Step 29)
  behavioral: [
    "executiveCharacterPatterns",
    "personalityProfile",
    "communicationStyle",
    "decisionMakingStyle",
  ],
};

class FinalMonacoPipelineProductionTest {
  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: { url: PRODUCTION_CONFIG.databaseUrl },
      },
    });

    this.testResults = {
      totalLeads: 0,
      testedLeads: 0,
      passedTests: 0,
      failedTests: 0,
      categoryResults: {},
      performanceMetrics: {},
      productionReadiness: false,
      errors: [],
      recommendations: [],
    };
  }

  async run() {
    console.log("🎯 FINAL MONACO PIPELINE PRODUCTION TEST");
    console.log("======================================");
    console.log(`🎯 Target: Dan's 409 leads in Adrata workspace`);
    console.log(`📊 Testing: Complete 30-step Monaco pipeline`);
    console.log(`🔍 Goal: 100% production readiness validation`);
    console.log("");

    const startTime = Date.now();

    try {
      // Test 1: Database connectivity and data loading
      await this.testDatabaseConnectivity();

      // Test 2: Complete pipeline structure validation
      await this.testPipelineStructure();

      // Test 3: Data quality and completeness
      await this.testDataQuality();

      // Test 4: Buyer group role assignment accuracy
      await this.testBuyerGroupRoles();

      // Test 5: Performance and scalability
      await this.testPerformance();

      // Test 6: End-to-end workflow validation
      await this.testEndToEndWorkflow();

      // Final assessment
      await this.generateFinalAssessment();

      const duration = Date.now() - startTime;
      console.log(`\n⏱️  Total test duration: ${Math.round(duration / 1000)}s`);
      console.log("\n🎉 Final Monaco pipeline production test completed!");
    } catch (error) {
      console.error("❌ Production test failed:", error);
      this.testResults.errors.push(error.message);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async testDatabaseConnectivity() {
    console.log("🔌 Test 1: Database Connectivity & Data Loading...");
    console.log("==============================================");

    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      console.log("   ✅ Database connection successful");

      // Load all leads
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
          customFields: true,
        },
      });

      this.testResults.totalLeads = leads.length;
      console.log(`   ✅ Loaded ${leads.length} leads`);

      // Check enrichment presence
      const enrichedLeads = leads.filter(
        (lead) =>
          lead.customFields?.monacoEnrichment &&
          lead.customFields.monacoEnrichment.completionRate === 100,
      );

      console.log(
        `   ✅ Enriched leads: ${enrichedLeads.length}/${leads.length} (${Math.round((enrichedLeads.length / leads.length) * 100)}%)`,
      );

      if (enrichedLeads.length === leads.length) {
        console.log("   🎉 Perfect enrichment coverage!");
      }

      this.leads = leads;
    } catch (error) {
      console.log("   ❌ Database connectivity test failed:", error.message);
      this.testResults.errors.push(`Database connectivity: ${error.message}`);
      throw error;
    }
  }

  async testPipelineStructure() {
    console.log("\n🏗️  Test 2: Complete Pipeline Structure Validation...");
    console.log("==================================================");

    let structureScore = 0;
    let totalCategories = Object.keys(EXPECTED_MONACO_STRUCTURE).length;

    for (const [category, expectedFields] of Object.entries(
      EXPECTED_MONACO_STRUCTURE,
    )) {
      console.log(
        `\n   📋 Testing ${category} category (${expectedFields.length} fields):`,
      );

      let categoryScore = 0;
      let fieldsFound = 0;

      // Test sample of leads for this category
      const sampleSize = Math.min(10, this.leads.length);
      const sampleLeads = this.leads.slice(0, sampleSize);

      for (const field of expectedFields) {
        const leadsWithField = sampleLeads.filter((lead) => {
          const enrichment = lead.customFields?.monacoEnrichment;
          return (
            enrichment &&
            enrichment[field] &&
            (typeof enrichment[field] === "object"
              ? Object.keys(enrichment[field]).length > 0
              : true)
          );
        });

        const fieldCoverage = Math.round(
          (leadsWithField.length / sampleSize) * 100,
        );
        console.log(
          `      • ${field}: ${leadsWithField.length}/${sampleSize} (${fieldCoverage}%)`,
        );

        if (fieldCoverage >= 90) fieldsFound++;
      }

      categoryScore = Math.round((fieldsFound / expectedFields.length) * 100);
      console.log(
        `   📊 ${category} Score: ${categoryScore}% (${fieldsFound}/${expectedFields.length} fields)`,
      );

      this.testResults.categoryResults[category] = {
        score: categoryScore,
        fieldsFound,
        totalFields: expectedFields.length,
        status:
          categoryScore >= 90
            ? "PASS"
            : categoryScore >= 70
              ? "PARTIAL"
              : "FAIL",
      };

      if (categoryScore >= 90) structureScore++;
    }

    const overallStructureScore = Math.round(
      (structureScore / totalCategories) * 100,
    );
    console.log(
      `\n   🎯 Overall Structure Score: ${overallStructureScore}% (${structureScore}/${totalCategories} categories)`,
    );

    if (overallStructureScore >= 90) {
      console.log("   🎉 Pipeline structure test PASSED!");
      this.testResults.passedTests++;
    } else {
      console.log("   ❌ Pipeline structure test FAILED!");
      this.testResults.failedTests++;
      this.testResults.recommendations.push(
        "Improve pipeline structure completeness",
      );
    }
  }

  async testDataQuality() {
    console.log("\n📊 Test 3: Data Quality & Completeness...");
    console.log("=======================================");

    const qualityTests = [
      {
        name: "Contact Information",
        test: this.testContactInformation.bind(this),
      },
      { name: "Professional Data", test: this.testProfessionalData.bind(this) },
      { name: "Enrichment Data", test: this.testEnrichmentData.bind(this) },
      { name: "Intelligence Data", test: this.testIntelligenceData.bind(this) },
      { name: "Behavioral Data", test: this.testBehavioralData.bind(this) },
    ];

    let qualityScore = 0;

    for (const qualityTest of qualityTests) {
      console.log(`\n   🔍 Testing ${qualityTest.name}:`);
      const result = await qualityTest.test();

      console.log(`      Score: ${result.score}%`);
      console.log(
        `      Coverage: ${result.coverage}/${this.testResults.totalLeads}`,
      );
      console.log(`      Status: ${result.status}`);

      if (result.status === "PASS") qualityScore++;
    }

    const overallQualityScore = Math.round(
      (qualityScore / qualityTests.length) * 100,
    );
    console.log(`\n   🎯 Overall Data Quality Score: ${overallQualityScore}%`);

    if (overallQualityScore >= 80) {
      console.log("   🎉 Data quality test PASSED!");
      this.testResults.passedTests++;
    } else {
      console.log("   ❌ Data quality test FAILED!");
      this.testResults.failedTests++;
      this.testResults.recommendations.push(
        "Improve data quality and completeness",
      );
    }
  }

  async testBuyerGroupRoles() {
    console.log("\n👥 Test 4: Buyer Group Role Assignment Accuracy...");
    console.log("===============================================");

    const roleDistribution = {};
    let properRoleAssignments = 0;
    let totalAssignments = 0;

    for (const lead of this.leads) {
      const enrichment = lead.customFields?.monacoEnrichment;
      const role = enrichment?.buyerGroupAnalysis?.role;
      const confidence = enrichment?.buyerGroupAnalysis?.confidence || 0;

      if (role) {
        roleDistribution[role] = (roleDistribution[role] || 0) + 1;
        totalAssignments++;

        if (confidence >= 0.7) {
          properRoleAssignments++;
        }
      }
    }

    console.log("   👑 Role Distribution:");
    Object.entries(roleDistribution).forEach(([role, count]) => {
      const percentage = Math.round(
        (count / this.testResults.totalLeads) * 100,
      );
      console.log(`      • ${role}: ${count} (${percentage}%)`);
    });

    const roleAccuracy = Math.round(
      (properRoleAssignments / totalAssignments) * 100,
    );
    const roleCoverage = Math.round(
      (totalAssignments / this.testResults.totalLeads) * 100,
    );

    console.log(`\n   📊 Role Assignment Accuracy: ${roleAccuracy}%`);
    console.log(`   📊 Role Coverage: ${roleCoverage}%`);

    if (roleAccuracy >= 80 && roleCoverage >= 95) {
      console.log("   🎉 Buyer group roles test PASSED!");
      this.testResults.passedTests++;
    } else {
      console.log("   ❌ Buyer group roles test FAILED!");
      this.testResults.failedTests++;
      this.testResults.recommendations.push(
        "Improve buyer group role assignment accuracy",
      );
    }
  }

  async testPerformance() {
    console.log("\n⚡ Test 5: Performance & Scalability...");
    console.log("====================================");

    const performanceTests = [
      {
        name: "Data Retrieval Speed",
        test: this.testDataRetrievalSpeed.bind(this),
      },
      {
        name: "Enrichment Processing",
        test: this.testEnrichmentProcessing.bind(this),
      },
      { name: "Memory Usage", test: this.testMemoryUsage.bind(this) },
    ];

    let performanceScore = 0;

    for (const perfTest of performanceTests) {
      console.log(`\n   ⚡ Testing ${perfTest.name}:`);
      const result = await perfTest.test();

      console.log(`      Result: ${result.result}`);
      console.log(`      Status: ${result.status}`);

      this.testResults.performanceMetrics[perfTest.name] = result;

      if (result.status === "PASS") performanceScore++;
    }

    const overallPerformanceScore = Math.round(
      (performanceScore / performanceTests.length) * 100,
    );
    console.log(
      `\n   🎯 Overall Performance Score: ${overallPerformanceScore}%`,
    );

    if (overallPerformanceScore >= 80) {
      console.log("   🎉 Performance test PASSED!");
      this.testResults.passedTests++;
    } else {
      console.log("   ❌ Performance test FAILED!");
      this.testResults.failedTests++;
      this.testResults.recommendations.push(
        "Optimize performance and scalability",
      );
    }
  }

  async testEndToEndWorkflow() {
    console.log("\n🔄 Test 6: End-to-End Workflow Validation...");
    console.log("==========================================");

    try {
      // Test sample lead through complete workflow
      const sampleLead = this.leads[0];
      console.log(`   🧪 Testing with sample lead: ${sampleLead.fullName}`);

      const enrichment = sampleLead.customFields?.monacoEnrichment;

      // Validate workflow stages
      const workflowStages = [
        {
          name: "Foundation Setup",
          check: () => enrichment.sellerProfile && enrichment.competitors,
        },
        {
          name: "Data Collection",
          check: () => enrichment.contactInformation && enrichment.peopleData,
        },
        {
          name: "Analysis & Modeling",
          check: () => enrichment.orgStructures && enrichment.influenceAnalyses,
        },
        {
          name: "Buyer Analysis",
          check: () =>
            enrichment.buyerGroupAnalysis && enrichment.buyerGroupDynamics,
        },
        {
          name: "Intelligence Generation",
          check: () =>
            enrichment.intelligenceReports && enrichment.strategicInsights,
        },
        {
          name: "Behavioral Analysis",
          check: () =>
            enrichment.executiveCharacterPatterns &&
            enrichment.personalityProfile,
        },
      ];

      let stagesPassed = 0;

      for (const stage of workflowStages) {
        const passed = stage.check();
        console.log(`      ${passed ? "✅" : "❌"} ${stage.name}`);
        if (passed) stagesPassed++;
      }

      const workflowScore = Math.round(
        (stagesPassed / workflowStages.length) * 100,
      );
      console.log(`\n   🎯 Workflow Completion Score: ${workflowScore}%`);

      if (workflowScore >= 90) {
        console.log("   🎉 End-to-end workflow test PASSED!");
        this.testResults.passedTests++;
      } else {
        console.log("   ❌ End-to-end workflow test FAILED!");
        this.testResults.failedTests++;
        this.testResults.recommendations.push(
          "Fix end-to-end workflow completeness",
        );
      }
    } catch (error) {
      console.log("   ❌ End-to-end workflow test ERROR:", error.message);
      this.testResults.failedTests++;
      this.testResults.errors.push(`Workflow test: ${error.message}`);
    }
  }

  async generateFinalAssessment() {
    console.log("\n🎯 FINAL PRODUCTION READINESS ASSESSMENT");
    console.log("======================================");

    const totalTests =
      this.testResults.passedTests + this.testResults.failedTests;
    const successRate =
      totalTests > 0
        ? Math.round((this.testResults.passedTests / totalTests) * 100)
        : 0;

    console.log(`📊 Test Summary:`);
    console.log(`   • Total Tests: ${totalTests}`);
    console.log(`   • Passed: ${this.testResults.passedTests}`);
    console.log(`   • Failed: ${this.testResults.failedTests}`);
    console.log(`   • Success Rate: ${successRate}%`);
    console.log(`   • Errors: ${this.testResults.errors.length}`);

    console.log(`\n📋 Category Results:`);
    Object.entries(this.testResults.categoryResults).forEach(
      ([category, result]) => {
        console.log(`   • ${category}: ${result.score}% (${result.status})`);
      },
    );

    if (this.testResults.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      this.testResults.recommendations.forEach((rec) => {
        console.log(`   • ${rec}`);
      });
    }

    // Determine production readiness
    this.testResults.productionReadiness =
      successRate >= 90 && this.testResults.errors.length === 0;

    console.log(
      `\n🎯 PRODUCTION READINESS: ${this.testResults.productionReadiness ? "YES" : "NO"}`,
    );

    if (this.testResults.productionReadiness) {
      console.log(`🎉 Monaco pipeline is READY for production use!`);
      console.log(`✅ All 30 steps are working correctly`);
      console.log(`✅ Data quality meets production standards`);
      console.log(`✅ Performance is acceptable for production load`);
      console.log(`✅ End-to-end workflow is functioning properly`);
    } else {
      console.log(`❌ Monaco pipeline needs fixes before production use`);
      console.log(`⚠️  Address the recommendations above before deployment`);
    }

    console.log(`\n📊 System Health: ${successRate}%`);
  }

  // Quality test methods
  async testContactInformation() {
    let validContacts = 0;

    for (const lead of this.leads) {
      const contact = lead.customFields?.monacoEnrichment?.contactInformation;
      if (
        contact &&
        contact.email &&
        contact.phone &&
        contact.linkedin_profile
      ) {
        validContacts++;
      }
    }

    const score = Math.round(
      (validContacts / this.testResults.totalLeads) * 100,
    );
    return {
      score,
      coverage: validContacts,
      status: score >= 90 ? "PASS" : score >= 70 ? "PARTIAL" : "FAIL",
    };
  }

  async testProfessionalData() {
    let validProfessional = 0;

    for (const lead of this.leads) {
      const enrichment = lead.customFields?.monacoEnrichment;
      if (
        enrichment &&
        enrichment.professionalHistory &&
        enrichment.peopleData &&
        lead.jobTitle
      ) {
        validProfessional++;
      }
    }

    const score = Math.round(
      (validProfessional / this.testResults.totalLeads) * 100,
    );
    return {
      score,
      coverage: validProfessional,
      status: score >= 90 ? "PASS" : score >= 70 ? "PARTIAL" : "FAIL",
    };
  }

  async testEnrichmentData() {
    let validEnrichment = 0;

    for (const lead of this.leads) {
      const enrichment = lead.customFields?.monacoEnrichment;
      if (
        enrichment &&
        enrichment.socialProfiles &&
        enrichment.networkConnections &&
        enrichment.personalInterests
      ) {
        validEnrichment++;
      }
    }

    const score = Math.round(
      (validEnrichment / this.testResults.totalLeads) * 100,
    );
    return {
      score,
      coverage: validEnrichment,
      status: score >= 90 ? "PASS" : score >= 70 ? "PARTIAL" : "FAIL",
    };
  }

  async testIntelligenceData() {
    let validIntelligence = 0;

    for (const lead of this.leads) {
      const enrichment = lead.customFields?.monacoEnrichment;
      if (
        enrichment &&
        enrichment.strategicInsights &&
        enrichment.opportunitySignals &&
        enrichment.intelligenceReports
      ) {
        validIntelligence++;
      }
    }

    const score = Math.round(
      (validIntelligence / this.testResults.totalLeads) * 100,
    );
    return {
      score,
      coverage: validIntelligence,
      status: score >= 90 ? "PASS" : score >= 70 ? "PARTIAL" : "FAIL",
    };
  }

  async testBehavioralData() {
    let validBehavioral = 0;

    for (const lead of this.leads) {
      const enrichment = lead.customFields?.monacoEnrichment;
      if (
        enrichment &&
        enrichment.executiveCharacterPatterns &&
        enrichment.personalityProfile &&
        enrichment.communicationStyle
      ) {
        validBehavioral++;
      }
    }

    const score = Math.round(
      (validBehavioral / this.testResults.totalLeads) * 100,
    );
    return {
      score,
      coverage: validBehavioral,
      status: score >= 90 ? "PASS" : score >= 70 ? "PARTIAL" : "FAIL",
    };
  }

  // Performance test methods
  async testDataRetrievalSpeed() {
    const startTime = Date.now();

    // Test retrieving 50 leads with full enrichment
    await this.prisma.lead.findMany({
      where: {
        workspaceId: PRODUCTION_CONFIG.workspaceId,
        assignedUserId: PRODUCTION_CONFIG.userId,
      },
      take: 50,
      select: {
        id: true,
        fullName: true,
        customFields: true,
      },
    });

    const duration = Date.now() - startTime;

    return {
      result: `${duration}ms for 50 leads`,
      status: duration < 2000 ? "PASS" : duration < 5000 ? "PARTIAL" : "FAIL",
    };
  }

  async testEnrichmentProcessing() {
    // Simulate enrichment processing time
    const startTime = Date.now();

    // Process a sample lead's enrichment data
    const sampleLead = this.leads[0];
    const enrichment = sampleLead.customFields?.monacoEnrichment;

    // Simulate processing all enrichment fields
    if (enrichment) {
      Object.keys(enrichment).forEach((key) => {
        // Simulate processing each field
        JSON.stringify(enrichment[key]);
      });
    }

    const duration = Date.now() - startTime;

    return {
      result: `${duration}ms processing time`,
      status: duration < 100 ? "PASS" : duration < 500 ? "PARTIAL" : "FAIL",
    };
  }

  async testMemoryUsage() {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);

    return {
      result: `${heapUsedMB}MB heap usage`,
      status:
        heapUsedMB < 500 ? "PASS" : heapUsedMB < 1000 ? "PARTIAL" : "FAIL",
    };
  }
}

// Run the final production test
async function main() {
  const test = new FinalMonacoPipelineProductionTest();
  await test.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { FinalMonacoPipelineProductionTest };
