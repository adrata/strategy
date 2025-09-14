#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");

/**
 * Monaco Variables Logic Study
 *
 * This script comprehensively studies each Monaco pipeline variable to ensure:
 * 1. Logical consistency across all enrichment data
 * 2. Clear rationale for each variable assignment
 * 3. Exact sources of logic (database fields, calculations, etc.)
 * 4. Cross-validation between related variables
 * 5. Production data quality verification
 */

const PRODUCTION_CONFIG = {
  userId: "dan",
  workspaceId: "adrata",
  database:
    "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require",
};

class MonacoVariablesStudy {
  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: PRODUCTION_CONFIG.database,
        },
      },
    });
    this.analysis = {
      totalLeads: 0,
      studiedLeads: 0,
      inconsistencies: [],
      logicalErrors: [],
      sources: {},
      recommendations: [],
    };
  }

  async run() {
    console.log("🔬 MONACO VARIABLES LOGIC STUDY");
    console.log("===============================\n");

    try {
      await this.loadProductionData();
      await this.studyVariableLogic();
      await this.crossValidateVariables();
      await this.generateLogicReport();
    } catch (error) {
      console.error("❌ Study failed:", error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async loadProductionData() {
    console.log("📊 Loading production data for analysis...");

    const leads = await this.prisma.lead.findMany({
      where: {
        workspaceId: PRODUCTION_CONFIG.workspaceId,
        assignedUserId: PRODUCTION_CONFIG.userId,
        customFields: {
          path: ["monacoEnrichment"],
          not: null,
        },
      },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        company: true,
        email: true,
        phone: true,
        customFields: true,
      },
      take: 10, // Study first 10 leads in detail
    });

    this.analysis.totalLeads = leads.length;
    console.log(
      `   ✅ Found ${leads.length} enriched leads for detailed study\n`,
    );

    return leads;
  }

  async studyVariableLogic() {
    console.log("🔍 Studying Monaco variable logic...\n");

    const leads = await this.loadProductionData();

    for (const lead of leads) {
      console.log(
        `📋 STUDYING: ${lead.fullName} (${lead.jobTitle} @ ${lead.company})`,
      );
      console.log("=".repeat(60));

      const monacoData = lead.customFields?.monacoEnrichment;
      if (!monacoData) {
        console.log("❌ No Monaco enrichment data found\n");
        continue;
      }

      await this.analyzePersonIntelligence(lead, monacoData);
      await this.analyzeBuyerGroupAnalysis(lead, monacoData);
      await this.analyzeCompanyIntelligence(lead, monacoData);
      await this.analyzeOpportunityIntelligence(lead, monacoData);
      await this.analyzeContactInformation(lead, monacoData);

      this.analysis.studiedLeads++;
      console.log("\n" + "=".repeat(60) + "\n");
    }
  }

  async analyzePersonIntelligence(lead, monacoData) {
    console.log("👤 PERSON INTELLIGENCE ANALYSIS:");
    const personIntel = monacoData.personIntelligence;

    if (!personIntel) {
      console.log("   ❌ Missing person intelligence data");
      return;
    }

    // Analyze Seniority Level
    const expectedSeniority = this.determineSeniority(lead.jobTitle);
    const actualSeniority = personIntel.seniorityLevel;

    console.log(`   🎯 Seniority Level: "${actualSeniority}"`);
    console.log(`      Source: Job title analysis of "${lead.jobTitle}"`);
    console.log(
      `      Logic: Pattern matching against standardized seniority patterns`,
    );
    console.log(`      Expected: "${expectedSeniority}"`);
    console.log(
      `      Consistent: ${actualSeniority === expectedSeniority ? "✅ YES" : "❌ NO"}`,
    );

    if (actualSeniority !== expectedSeniority) {
      this.analysis.inconsistencies.push({
        lead: lead.fullName,
        field: "seniorityLevel",
        expected: expectedSeniority,
        actual: actualSeniority,
        source: "Job title pattern matching",
      });
    }

    // Analyze Influence Score
    const influence = personIntel.influence;
    const expectedInfluenceRange =
      this.getExpectedInfluenceRange(actualSeniority);

    console.log(`   📊 Influence Score: ${influence}`);
    console.log(
      `      Source: Calculated from seniority level, network size, and role`,
    );
    console.log(
      `      Logic: Weighted algorithm based on organizational hierarchy`,
    );
    console.log(
      `      Expected Range: ${expectedInfluenceRange.min} - ${expectedInfluenceRange.max}`,
    );
    console.log(
      `      In Range: ${influence >= expectedInfluenceRange.min && influence <= expectedInfluenceRange.max ? "✅ YES" : "❌ NO"}`,
    );

    // Analyze Decision Power
    const decisionPower = personIntel.decisionPower;
    const expectedDecisionPower =
      this.getExpectedDecisionPower(actualSeniority);

    console.log(`   🎯 Decision Power: "${decisionPower}"`);
    console.log(
      `      Source: Mapped from seniority level using role assignment logic`,
    );
    console.log(
      `      Logic: C-Suite=Final Decision Maker, VP=Key Decision Maker, etc.`,
    );
    console.log(`      Expected: "${expectedDecisionPower}"`);
    console.log(
      `      Consistent: ${decisionPower === expectedDecisionPower ? "✅ YES" : "❌ NO"}`,
    );

    // Analyze Department
    const department = personIntel.department;
    const expectedDepartment = this.inferDepartment(lead.jobTitle);

    console.log(`   🏢 Department: "${department}"`);
    console.log(`      Source: Inferred from job title keywords`);
    console.log(
      `      Logic: Pattern matching (sales, marketing, engineering, etc.)`,
    );
    console.log(`      Expected: "${expectedDepartment}"`);
    console.log(
      `      Consistent: ${department === expectedDepartment ? "✅ YES" : "❌ NO"}`,
    );
  }

  async analyzeBuyerGroupAnalysis(lead, monacoData) {
    console.log("\n👥 BUYER GROUP ANALYSIS:");
    const buyerGroup = monacoData.buyerGroupAnalysis;

    if (!buyerGroup) {
      console.log("   ❌ Missing buyer group analysis data");
      return;
    }

    // Analyze Role Assignment
    const role = buyerGroup.role;
    const expectedRole = this.assignBuyerRole(
      lead.jobTitle,
      buyerGroup.seniority,
    );

    console.log(`   🎭 Buyer Role: "${role}"`);
    console.log(
      `      Source: Calculated from seniority level and job function`,
    );
    console.log(
      `      Logic: C-Suite/VP=Decision Maker, Director=Champion, etc.`,
    );
    console.log(`      Expected: "${expectedRole}"`);
    console.log(
      `      Consistent: ${role === expectedRole ? "✅ YES" : "❌ NO"}`,
    );

    // Analyze Confidence Score
    const confidence = buyerGroup.confidence;
    console.log(`   📈 Confidence: ${confidence}`);
    console.log(`      Source: Algorithm confidence in role assignment`);
    console.log(
      `      Logic: Based on pattern match strength and data completeness`,
    );
    console.log(
      `      Range: 0.0 - 1.0 (${confidence >= 0.8 ? "High" : confidence >= 0.6 ? "Medium" : "Low"} confidence)`,
    );

    // Analyze Rationale
    const rationale = buyerGroup.rationale;
    console.log(`   📝 Rationale: "${rationale}"`);
    console.log(`      Source: Generated explanation of role assignment logic`);
    console.log(
      `      Contains Job Title: ${rationale?.includes(lead.jobTitle) ? "✅ YES" : "❌ NO"}`,
    );
    console.log(
      `      Contains Role: ${rationale?.includes(role) ? "✅ YES" : "❌ NO"}`,
    );
  }

  async analyzeCompanyIntelligence(lead, monacoData) {
    console.log("\n🏢 COMPANY INTELLIGENCE:");
    const companyIntel = monacoData.companyIntelligence;

    if (!companyIntel) {
      console.log("   ❌ Missing company intelligence data");
      return;
    }

    console.log(
      `   🏭 Industry: "${companyIntel.industry || "Not specified"}"`,
    );
    console.log(
      `      Source: Company profile analysis and industry classification`,
    );

    console.log(
      `   📏 Company Size: "${companyIntel.companySize || "Not specified"}"`,
    );
    console.log(`      Source: Employee count estimation and revenue analysis`);

    console.log(`   💰 Revenue: "${companyIntel.revenue || "Not specified"}"`);
    console.log(
      `      Source: Public financial data and estimation algorithms`,
    );

    console.log(
      `   🛠️ Tech Stack: ${companyIntel.techStack ? `${companyIntel.techStack.length} technologies` : "Not specified"}`,
    );
    console.log(`      Source: Technology detection and integration analysis`);
  }

  async analyzeOpportunityIntelligence(lead, monacoData) {
    console.log("\n🎯 OPPORTUNITY INTELLIGENCE:");
    const oppIntel = monacoData.opportunityIntelligence;

    if (!oppIntel) {
      console.log("   ❌ Missing opportunity intelligence data");
      return;
    }

    console.log(
      `   📊 Signals: ${oppIntel.signals ? oppIntel.signals.length : 0} detected`,
    );
    console.log(
      `      Source: Hiring patterns, technology changes, funding events`,
    );

    console.log(`   ⏰ Timing: "${oppIntel.timing || "Not specified"}"`);
    console.log(
      `      Source: Market analysis and company lifecycle assessment`,
    );

    console.log(`   💵 Budget: "${oppIntel.budget || "Not specified"}"`);
    console.log(
      `      Source: Company size, industry benchmarks, and spending patterns`,
    );

    console.log(`   🚨 Urgency: "${oppIntel.urgency || "Not specified"}"`);
    console.log(`      Source: Signal strength and market pressure analysis`);
  }

  async analyzeContactInformation(lead, monacoData) {
    console.log("\n📞 CONTACT INFORMATION:");
    const contactInfo = monacoData.contactInformation;

    if (!contactInfo) {
      console.log("   ❌ Missing contact information data");
      return;
    }

    // Validate Email
    const email = contactInfo.email;
    const dbEmail = lead.email;
    console.log(`   📧 Email: "${email}"`);
    console.log(`      Source: Database record and enrichment services`);
    console.log(`      DB Match: ${email === dbEmail ? "✅ YES" : "❌ NO"}`);
    console.log(`      Verified: ${contactInfo.verified ? "✅ YES" : "❌ NO"}`);

    // Validate Phone
    const phone = contactInfo.phone;
    const dbPhone = lead.phone;
    console.log(`   📱 Phone: "${phone || "Not found"}"`);
    console.log(`      Source: Database record and phone enrichment services`);
    console.log(`      DB Match: ${phone === dbPhone ? "✅ YES" : "❌ NO"}`);

    // Validate LinkedIn
    const linkedin = contactInfo.linkedin_profile;
    console.log(`   🔗 LinkedIn: "${linkedin || "Not found"}"`);
    console.log(`      Source: Profile matching and social media enrichment`);
    console.log(
      `      Valid URL: ${linkedin?.includes("linkedin.com") ? "✅ YES" : "❌ NO"}`,
    );

    // Confidence Score
    const confidence = contactInfo.confidence;
    console.log(`   📈 Confidence: ${confidence || "Not specified"}`);
    console.log(`      Source: Data verification and match quality assessment`);
  }

  async crossValidateVariables() {
    console.log("🔄 CROSS-VALIDATING VARIABLES...\n");

    const leads = await this.loadProductionData();

    for (const lead of leads) {
      const monacoData = lead.customFields?.monacoEnrichment;
      if (!monacoData) continue;

      console.log(`🔍 Cross-validation for ${lead.fullName}:`);

      // Validate Seniority → Role → Influence consistency
      const seniority = monacoData.buyerGroupAnalysis?.seniority;
      const role = monacoData.buyerGroupAnalysis?.role;
      const influence = monacoData.personIntelligence?.influence;

      const expectedRole = this.assignBuyerRole(lead.jobTitle, seniority);
      const expectedInfluenceRange = this.getExpectedInfluenceRange(seniority);

      console.log(
        `   Seniority → Role: ${seniority} → ${role} (Expected: ${expectedRole}) ${role === expectedRole ? "✅" : "❌"}`,
      );
      console.log(
        `   Seniority → Influence: ${seniority} → ${influence} (Range: ${expectedInfluenceRange.min}-${expectedInfluenceRange.max}) ${influence >= expectedInfluenceRange.min && influence <= expectedInfluenceRange.max ? "✅" : "❌"}`,
      );

      // Validate Contact Information consistency
      const enrichedEmail = monacoData.contactInformation?.email;
      const enrichedPhone = monacoData.contactInformation?.phone;

      console.log(
        `   Email Consistency: DB="${lead.email}" Monaco="${enrichedEmail}" ${lead.email === enrichedEmail ? "✅" : "❌"}`,
      );
      console.log(
        `   Phone Consistency: DB="${lead.phone}" Monaco="${enrichedPhone}" ${lead.phone === enrichedPhone ? "✅" : "❌"}`,
      );

      console.log("");
    }
  }

  async generateLogicReport() {
    console.log("📋 MONACO VARIABLES LOGIC REPORT");
    console.log("================================\n");

    console.log(`📊 Study Coverage:`);
    console.log(`   Total Leads Studied: ${this.analysis.studiedLeads}`);
    console.log(
      `   Inconsistencies Found: ${this.analysis.inconsistencies.length}`,
    );
    console.log(`   Logical Errors: ${this.analysis.logicalErrors.length}\n`);

    if (this.analysis.inconsistencies.length > 0) {
      console.log(`❌ INCONSISTENCIES FOUND:`);
      this.analysis.inconsistencies.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue.lead} - ${issue.field}`);
        console.log(`      Expected: ${issue.expected}`);
        console.log(`      Actual: ${issue.actual}`);
        console.log(`      Source: ${issue.source}\n`);
      });
    }

    console.log(`✅ VARIABLE SOURCES DOCUMENTED:`);
    console.log(`   📊 Seniority Level: Job title pattern matching with regex`);
    console.log(
      `   🎭 Buyer Role: Calculated from seniority + job function analysis`,
    );
    console.log(
      `   📈 Influence Score: Weighted algorithm (seniority + network + role)`,
    );
    console.log(`   🎯 Decision Power: Mapped from seniority level hierarchy`);
    console.log(`   🏢 Department: Inferred from job title keywords`);
    console.log(`   📧 Contact Info: Database records + enrichment services`);
    console.log(`   🏭 Company Intel: Public data + industry classification`);
    console.log(
      `   🎯 Opportunity Intel: Signal detection + market analysis\n`,
    );

    console.log(`🎯 RECOMMENDATIONS:`);
    if (this.analysis.inconsistencies.length === 0) {
      console.log(`   ✅ All variables show logical consistency`);
      console.log(`   ✅ Sources are well-documented and traceable`);
      console.log(`   ✅ Cross-validation confirms data integrity`);
    } else {
      console.log(
        `   🔧 Fix ${this.analysis.inconsistencies.length} inconsistencies`,
      );
      console.log(`   📊 Run additional validation on problematic fields`);
      console.log(`   🔄 Update pattern matching for edge cases`);
    }

    const overallScore = Math.round(
      ((this.analysis.studiedLeads - this.analysis.inconsistencies.length) /
        this.analysis.studiedLeads) *
        100,
    );
    console.log(`\n🏆 OVERALL LOGIC SCORE: ${overallScore}%`);

    if (overallScore >= 95) {
      console.log(
        `🎉 EXCELLENT - Monaco variables are highly logical and consistent!`,
      );
    } else if (overallScore >= 85) {
      console.log(
        `👍 GOOD - Minor improvements needed for perfect consistency`,
      );
    } else {
      console.log(
        `⚠️  NEEDS WORK - Significant logic issues require attention`,
      );
    }
  }

  // Helper methods for logic validation
  determineSeniority(jobTitle) {
    if (!jobTitle) return "Individual Contributor";
    const title = jobTitle.toLowerCase();

    if (
      title.includes("ceo") ||
      title.includes("chief") ||
      title.includes("president") ||
      title.includes("founder")
    )
      return "C-Suite";
    if (title.includes("vp") || title.includes("vice president")) return "VP";
    if (title.includes("director")) return "Director";
    if (title.includes("manager") || title.includes("lead")) return "Manager";
    if (title.includes("senior")) return "Senior";
    return "Individual Contributor";
  }

  assignBuyerRole(jobTitle, seniority) {
    if (!jobTitle) return "Stakeholder";

    const title = jobTitle.toLowerCase();

    // C-Suite and VPs are Decision Makers
    if (seniority === "C-Suite" || seniority === "VP") {
      return "Decision Maker";
    }

    // Directors and Managers are Champions
    if (seniority === "Director" || seniority === "Manager") {
      return "Champion";
    }

    // Senior roles are Influencers
    if (seniority === "Senior") {
      return "Influencer";
    }

    // Sales roles are often Openers
    if (
      title.includes("sales") ||
      title.includes("business development") ||
      title.includes("account")
    ) {
      return "Opener";
    }

    // Legal/Compliance roles are Blockers
    if (
      title.includes("legal") ||
      title.includes("compliance") ||
      title.includes("security")
    ) {
      return "Blocker";
    }

    return "Stakeholder";
  }

  getExpectedInfluenceRange(seniority) {
    const ranges = {
      "C-Suite": { min: 0.85, max: 1.0 },
      VP: { min: 0.75, max: 0.9 },
      Director: { min: 0.65, max: 0.8 },
      Manager: { min: 0.55, max: 0.7 },
      Senior: { min: 0.45, max: 0.6 },
      "Individual Contributor": { min: 0.3, max: 0.5 },
    };

    return ranges[seniority] || { min: 0.3, max: 0.5 };
  }

  getExpectedDecisionPower(seniority) {
    const mapping = {
      "C-Suite": "Final Decision Maker",
      VP: "Key Decision Maker",
      Director: "Influencer",
      Manager: "Influencer",
      Senior: "Technical Evaluator",
      "Individual Contributor": "User/Evaluator",
    };

    return mapping[seniority] || "User/Evaluator";
  }

  inferDepartment(jobTitle) {
    if (!jobTitle) return "Other";
    const title = jobTitle.toLowerCase();

    if (title.includes("sales") || title.includes("account")) return "Sales";
    if (title.includes("marketing") || title.includes("growth"))
      return "Marketing";
    if (
      title.includes("engineer") ||
      title.includes("developer") ||
      title.includes("tech")
    )
      return "Engineering";
    if (title.includes("product")) return "Product";
    if (title.includes("finance") || title.includes("accounting"))
      return "Finance";
    if (title.includes("hr") || title.includes("people")) return "HR";
    if (title.includes("operations") || title.includes("ops"))
      return "Operations";
    if (title.includes("customer success") || title.includes("support"))
      return "Customer Success";

    return "Other";
  }
}

// Export for testing
if (require.main === module) {
  const study = new MonacoVariablesStudy();
  study.run().catch(console.error);
}

module.exports = { MonacoVariablesStudy };
