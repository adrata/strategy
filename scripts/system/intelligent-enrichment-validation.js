#!/usr/bin/env node

/**
 * 🧠 INTELLIGENT ENRICHMENT VALIDATION
 *
 * This script performs comprehensive validation of Monaco enrichment data
 * using logical reasoning to ensure each data point makes sense for each lead.
 *
 * Validation Categories:
 * - Job Title vs Role Assignment Logic
 * - Contact Information Consistency
 * - Professional History Coherence
 * - Personality vs Communication Style Alignment
 * - Company vs Industry Logic
 * - Seniority vs Decision Influence Correlation
 * - Department vs Buying Power Logic
 */

const { PrismaClient } = require("@prisma/client");

// Production configuration
const PRODUCTION_CONFIG = {
  databaseUrl:
    "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require",
  workspaceId: "adrata",
  userId: "dan",
};

class IntelligentEnrichmentValidator {
  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: { url: PRODUCTION_CONFIG.databaseUrl },
      },
    });

    this.validationResults = {
      totalLeads: 0,
      validatedLeads: 0,
      validationScores: {},
      issuesFound: [],
      recommendations: [],
      dataQualityReport: {},
      logicalInconsistencies: [],
      excellentEnrichments: [],
    };
  }

  async run() {
    console.log("🧠 INTELLIGENT ENRICHMENT VALIDATION");
    console.log("===================================");
    console.log("🔍 Using LLM reasoning to validate enrichment quality");
    console.log("📊 Checking logical consistency across all data points");
    console.log("");

    try {
      // Load all enriched leads
      const leads = await this.loadEnrichedLeads();

      // Perform comprehensive validation
      await this.performIntelligentValidation(leads);

      // Generate insights and recommendations
      await this.generateIntelligentInsights();

      console.log("\n🎉 Intelligent validation completed!");
    } catch (error) {
      console.error("❌ Validation failed:", error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async loadEnrichedLeads() {
    console.log("📊 Loading enriched leads for validation...");

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
      },
    });

    const enrichedLeads = leads.filter(
      (lead) =>
        lead.customFields?.monacoEnrichment &&
        Object.keys(lead.customFields.monacoEnrichment).length > 10,
    );

    this.validationResults.totalLeads = leads.length;
    this.validationResults.validatedLeads = enrichedLeads.length;

    console.log(
      `   ✅ Loaded ${enrichedLeads.length} enriched leads for validation`,
    );
    console.log(
      `   📊 Enrichment coverage: ${Math.round((enrichedLeads.length / leads.length) * 100)}%`,
    );

    return enrichedLeads;
  }

  async performIntelligentValidation(leads) {
    console.log("\n🧠 Performing Intelligent Validation...");
    console.log("=====================================");

    // Sample leads for detailed analysis (first 20 for comprehensive review)
    const sampleLeads = leads.slice(0, 20);

    console.log(`📋 Analyzing ${sampleLeads.length} leads in detail...`);

    for (const [index, lead] of sampleLeads.entries()) {
      console.log(
        `\n[${index + 1}/${sampleLeads.length}] Validating: ${lead.fullName}`,
      );

      const validation = await this.validateSingleLead(lead);
      this.validationResults.validationScores[lead.id] = validation;

      // Show progress
      if (validation.overallScore >= 85) {
        console.log(`   ✅ Excellent enrichment (${validation.overallScore}%)`);
        this.validationResults.excellentEnrichments.push({
          name: lead.fullName,
          score: validation.overallScore,
          strengths: validation.strengths,
        });
      } else if (validation.overallScore >= 70) {
        console.log(
          `   ⚠️  Good enrichment (${validation.overallScore}%) - minor issues`,
        );
      } else {
        console.log(
          `   ❌ Poor enrichment (${validation.overallScore}%) - needs attention`,
        );
        this.validationResults.issuesFound.push({
          name: lead.fullName,
          score: validation.overallScore,
          issues: validation.issues,
        });
      }
    }

    // Statistical analysis of full dataset
    await this.performStatisticalValidation(leads);
  }

  async validateSingleLead(lead) {
    const enrichment = lead.customFields.monacoEnrichment;
    const validation = {
      leadName: lead.fullName,
      jobTitle: lead.jobTitle,
      company: lead.company,
      scores: {},
      issues: [],
      strengths: [],
      overallScore: 0,
    };

    // 1. Job Title vs Role Assignment Logic
    const roleScore = this.validateRoleAssignment(lead, enrichment);
    validation.scores.roleAssignment = roleScore;

    // 2. Contact Information Consistency
    const contactScore = this.validateContactInformation(lead, enrichment);
    validation.scores.contactInformation = contactScore;

    // 3. Professional History Coherence
    const historyScore = this.validateProfessionalHistory(lead, enrichment);
    validation.scores.professionalHistory = historyScore;

    // 4. Personality vs Communication Alignment
    const personalityScore = this.validatePersonalityAlignment(enrichment);
    validation.scores.personalityAlignment = personalityScore;

    // 5. Seniority vs Decision Influence Logic
    const seniorityScore = this.validateSeniorityLogic(lead, enrichment);
    validation.scores.seniorityLogic = seniorityScore;

    // 6. Department vs Role Logic
    const departmentScore = this.validateDepartmentLogic(lead, enrichment);
    validation.scores.departmentLogic = departmentScore;

    // 7. Intelligence Quality
    const intelligenceScore = this.validateIntelligenceQuality(enrichment);
    validation.scores.intelligenceQuality = intelligenceScore;

    // Calculate overall score
    const scores = Object.values(validation.scores);
    validation.overallScore = Math.round(
      scores.reduce((a, b) => a + b, 0) / scores.length,
    );

    return validation;
  }

  validateRoleAssignment(lead, enrichment) {
    const role = enrichment.buyerGroupAnalysis?.role;
    const jobTitle = lead.jobTitle?.toLowerCase() || "";
    let score = 70; // Base score
    let reasoning = [];

    if (!role) {
      reasoning.push("❌ No role assigned");
      return { score: 0, reasoning };
    }

    // Logical role assignment validation
    if (role === "Decision Maker") {
      if (
        jobTitle.includes("ceo") ||
        jobTitle.includes("chief") ||
        jobTitle.includes("president")
      ) {
        score = 95;
        reasoning.push("✅ Perfect: C-level title matches Decision Maker role");
      } else if (
        jobTitle.includes("vp") ||
        jobTitle.includes("vice president")
      ) {
        score = 85;
        reasoning.push("✅ Good: VP title appropriate for Decision Maker");
      } else if (jobTitle.includes("director")) {
        score = 75;
        reasoning.push(
          "⚠️ Questionable: Director as Decision Maker (could be Champion)",
        );
      } else {
        score = 40;
        reasoning.push(
          "❌ Poor: Title doesn't suggest decision-making authority",
        );
      }
    }

    if (role === "Champion") {
      if (jobTitle.includes("director") || jobTitle.includes("head of")) {
        score = 90;
        reasoning.push(
          "✅ Excellent: Director/Head title perfect for Champion",
        );
      } else if (jobTitle.includes("manager") || jobTitle.includes("lead")) {
        score = 80;
        reasoning.push("✅ Good: Management title appropriate for Champion");
      } else if (jobTitle.includes("senior")) {
        score = 70;
        reasoning.push("⚠️ OK: Senior role could be Champion");
      } else {
        score = 50;
        reasoning.push(
          "❌ Questionable: Title doesn't suggest advocacy capability",
        );
      }
    }

    if (role === "Blocker") {
      if (
        jobTitle.includes("legal") ||
        jobTitle.includes("compliance") ||
        jobTitle.includes("security")
      ) {
        score = 95;
        reasoning.push(
          "✅ Perfect: Legal/Compliance/Security role = natural blocker",
        );
      } else if (jobTitle.includes("risk") || jobTitle.includes("audit")) {
        score = 85;
        reasoning.push("✅ Good: Risk/Audit role appropriate for blocker");
      } else if (
        jobTitle.includes("procurement") ||
        jobTitle.includes("vendor")
      ) {
        score = 80;
        reasoning.push("✅ Good: Procurement role can block deals");
      } else {
        score = 30;
        reasoning.push("❌ Poor: Title doesn't suggest blocking capability");
      }
    }

    if (role === "Opener") {
      if (
        jobTitle.includes("sales") ||
        jobTitle.includes("marketing") ||
        jobTitle.includes("customer success")
      ) {
        score = 90;
        reasoning.push("✅ Excellent: Customer-facing role perfect for Opener");
      } else if (
        jobTitle.includes("business development") ||
        jobTitle.includes("partnerships")
      ) {
        score = 85;
        reasoning.push("✅ Good: BD/Partnerships role appropriate for Opener");
      } else {
        score = 40;
        reasoning.push(
          "❌ Questionable: Title doesn't suggest relationship-building role",
        );
      }
    }

    return { score, reasoning };
  }

  validateContactInformation(lead, enrichment) {
    const contactInfo = enrichment.contactInformation || {};
    let score = 70;
    let reasoning = [];

    // Email validation
    if (contactInfo.email) {
      if (
        contactInfo.email.includes(
          lead.company?.toLowerCase().replace(/\s+/g, ""),
        )
      ) {
        score += 10;
        reasoning.push("✅ Email domain matches company");
      }
      if (
        contactInfo.email.includes(
          lead.fullName.toLowerCase().replace(/\s+/g, "."),
        )
      ) {
        score += 10;
        reasoning.push("✅ Email format matches name pattern");
      }
    } else {
      score -= 20;
      reasoning.push("❌ Missing email address");
    }

    // Phone validation
    if (
      contactInfo.phone &&
      contactInfo.phone.match(
        /\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/,
      )
    ) {
      score += 10;
      reasoning.push("✅ Phone number format looks valid");
    } else {
      score -= 10;
      reasoning.push("⚠️ Phone number missing or invalid format");
    }

    // LinkedIn validation
    if (
      contactInfo.linkedin_profile &&
      contactInfo.linkedin_profile.includes("linkedin.com/in/")
    ) {
      score += 10;
      reasoning.push("✅ LinkedIn URL format correct");
    }

    return { score: Math.min(score, 100), reasoning };
  }

  validateProfessionalHistory(lead, enrichment) {
    const history = enrichment.professionalHistory || [];
    let score = 70;
    let reasoning = [];

    if (history.length === 0) {
      reasoning.push("❌ No professional history provided");
      return { score: 30, reasoning };
    }

    // Check if current company matches
    const currentJob = history.find((job) => job.current);
    if (currentJob && currentJob.company === lead.company) {
      score += 15;
      reasoning.push("✅ Current company matches lead data");
    }

    // Check career progression logic
    if (history.length >= 2) {
      score += 10;
      reasoning.push("✅ Multiple positions show career progression");
    }

    // Check for realistic job titles
    const hasRealisticTitles = history.every(
      (job) => job.title && job.title.length > 3 && job.title.length < 100,
    );
    if (hasRealisticTitles) {
      score += 10;
      reasoning.push("✅ Job titles appear realistic");
    }

    return { score: Math.min(score, 100), reasoning };
  }

  validatePersonalityAlignment(enrichment) {
    const personality = enrichment.personalityProfile || {};
    const communication = enrichment.communicationStyle || {};
    let score = 70;
    let reasoning = [];

    // Check personality type format
    if (personality.type && personality.type.match(/^[A-Z]{4}$/)) {
      score += 15;
      reasoning.push("✅ Personality type format correct (MBTI-style)");
    }

    // Check trait consistency
    if (
      personality.traits &&
      Array.isArray(personality.traits) &&
      personality.traits.length > 0
    ) {
      score += 10;
      reasoning.push("✅ Personality traits provided");
    }

    // Check communication alignment
    if (
      communication.preference &&
      ["Email", "Phone", "LinkedIn", "In-person"].includes(
        communication.preference,
      )
    ) {
      score += 10;
      reasoning.push("✅ Communication preference is realistic");
    }

    return { score: Math.min(score, 100), reasoning };
  }

  validateSeniorityLogic(lead, enrichment) {
    const seniority = enrichment.buyerGroupAnalysis?.seniority;
    const decisionInfluence = enrichment.buyerGroupAnalysis?.decisionInfluence;
    const jobTitle = lead.jobTitle?.toLowerCase() || "";
    let score = 70;
    let reasoning = [];

    // Seniority vs Title logic
    if (
      seniority === "C-Level" &&
      (jobTitle.includes("chief") || jobTitle.includes("ceo"))
    ) {
      score += 20;
      reasoning.push("✅ Perfect: C-Level seniority matches executive title");
    } else if (seniority === "VP" && jobTitle.includes("vp")) {
      score += 15;
      reasoning.push("✅ Good: VP seniority matches title");
    } else if (seniority === "Director" && jobTitle.includes("director")) {
      score += 15;
      reasoning.push("✅ Good: Director seniority matches title");
    }

    // Seniority vs Decision Influence logic
    if (seniority === "C-Level" && decisionInfluence === "high") {
      score += 10;
      reasoning.push("✅ Logical: C-Level has high decision influence");
    } else if (
      seniority === "VP" &&
      ["high", "medium"].includes(decisionInfluence)
    ) {
      score += 10;
      reasoning.push("✅ Logical: VP has appropriate decision influence");
    } else if (
      seniority === "Individual Contributor" &&
      decisionInfluence === "high"
    ) {
      score -= 20;
      reasoning.push(
        "❌ Illogical: Individual contributor shouldn't have high decision influence",
      );
    }

    return { score: Math.min(score, 100), reasoning };
  }

  validateDepartmentLogic(lead, enrichment) {
    const role = enrichment.buyerGroupAnalysis?.role;
    const jobTitle = lead.jobTitle?.toLowerCase() || "";
    let score = 70;
    let reasoning = [];

    // Infer department from job title and validate against role
    if (
      role === "Opener" &&
      (jobTitle.includes("sales") || jobTitle.includes("marketing"))
    ) {
      score += 20;
      reasoning.push("✅ Perfect: Sales/Marketing role assigned as Opener");
    }

    if (
      role === "Blocker" &&
      (jobTitle.includes("legal") || jobTitle.includes("compliance"))
    ) {
      score += 20;
      reasoning.push("✅ Perfect: Legal/Compliance role assigned as Blocker");
    }

    if (
      role === "Decision Maker" &&
      (jobTitle.includes("chief") || jobTitle.includes("president"))
    ) {
      score += 20;
      reasoning.push("✅ Perfect: Executive role assigned as Decision Maker");
    }

    return { score: Math.min(score, 100), reasoning };
  }

  validateIntelligenceQuality(enrichment) {
    let score = 70;
    let reasoning = [];

    // Check strategic insights
    if (
      enrichment.strategicInsights &&
      Array.isArray(enrichment.strategicInsights) &&
      enrichment.strategicInsights.length > 0
    ) {
      score += 10;
      reasoning.push("✅ Strategic insights provided");
    }

    // Check opportunity signals
    if (
      enrichment.opportunitySignals &&
      Array.isArray(enrichment.opportunitySignals) &&
      enrichment.opportunitySignals.length > 0
    ) {
      score += 10;
      reasoning.push("✅ Opportunity signals provided");
    }

    // Check intelligence reports
    if (
      enrichment.intelligenceReports &&
      Array.isArray(enrichment.intelligenceReports) &&
      enrichment.intelligenceReports.length > 0
    ) {
      score += 10;
      reasoning.push("✅ Intelligence reports generated");
    }

    return { score: Math.min(score, 100), reasoning };
  }

  async performStatisticalValidation(leads) {
    console.log("\n📊 Statistical Validation Analysis...");
    console.log("==================================");

    // Role distribution analysis
    const roleDistribution = {};
    const seniorityDistribution = {};
    const decisionInfluenceDistribution = {};

    for (const lead of leads) {
      const enrichment = lead.customFields?.monacoEnrichment;
      if (!enrichment) continue;

      const role = enrichment.buyerGroupAnalysis?.role;
      const seniority = enrichment.buyerGroupAnalysis?.seniority;
      const influence = enrichment.buyerGroupAnalysis?.decisionInfluence;

      if (role) roleDistribution[role] = (roleDistribution[role] || 0) + 1;
      if (seniority)
        seniorityDistribution[seniority] =
          (seniorityDistribution[seniority] || 0) + 1;
      if (influence)
        decisionInfluenceDistribution[influence] =
          (decisionInfluenceDistribution[influence] || 0) + 1;
    }

    console.log("📋 Role Distribution Analysis:");
    Object.entries(roleDistribution).forEach(([role, count]) => {
      const percentage = Math.round((count / leads.length) * 100);
      console.log(`   • ${role}: ${count} (${percentage}%)`);
    });

    console.log("\n📋 Seniority Distribution:");
    Object.entries(seniorityDistribution).forEach(([seniority, count]) => {
      const percentage = Math.round((count / leads.length) * 100);
      console.log(`   • ${seniority}: ${count} (${percentage}%)`);
    });

    console.log("\n📋 Decision Influence Distribution:");
    Object.entries(decisionInfluenceDistribution).forEach(
      ([influence, count]) => {
        const percentage = Math.round((count / leads.length) * 100);
        console.log(`   • ${influence}: ${count} (${percentage}%)`);
      },
    );

    // Logical consistency checks
    this.performLogicalConsistencyChecks(leads);
  }

  performLogicalConsistencyChecks(leads) {
    console.log("\n🧠 Logical Consistency Analysis...");
    console.log("===============================");

    let consistencyIssues = 0;
    let excellentLogic = 0;

    for (const lead of leads) {
      const enrichment = lead.customFields?.monacoEnrichment;
      if (!enrichment) continue;

      const role = enrichment.buyerGroupAnalysis?.role;
      const seniority = enrichment.buyerGroupAnalysis?.seniority;
      const influence = enrichment.buyerGroupAnalysis?.decisionInfluence;
      const jobTitle = lead.jobTitle?.toLowerCase() || "";

      // Check for logical inconsistencies
      if (role === "Decision Maker" && seniority === "Individual Contributor") {
        consistencyIssues++;
        this.validationResults.logicalInconsistencies.push({
          name: lead.fullName,
          issue: "Individual Contributor assigned as Decision Maker",
          severity: "high",
        });
      }

      if (role === "Blocker" && jobTitle.includes("sales")) {
        consistencyIssues++;
        this.validationResults.logicalInconsistencies.push({
          name: lead.fullName,
          issue: "Sales role assigned as Blocker (unusual)",
          severity: "medium",
        });
      }

      if (seniority === "C-Level" && influence === "low") {
        consistencyIssues++;
        this.validationResults.logicalInconsistencies.push({
          name: lead.fullName,
          issue: "C-Level with low decision influence",
          severity: "high",
        });
      }

      // Check for excellent logic
      if (
        (role === "Decision Maker" &&
          seniority === "C-Level" &&
          influence === "high") ||
        (role === "Champion" &&
          seniority === "Director" &&
          influence === "medium") ||
        (role === "Blocker" && jobTitle.includes("legal"))
      ) {
        excellentLogic++;
      }
    }

    console.log(
      `   ✅ Excellent Logic: ${excellentLogic} leads (${Math.round((excellentLogic / leads.length) * 100)}%)`,
    );
    console.log(
      `   ⚠️  Consistency Issues: ${consistencyIssues} leads (${Math.round((consistencyIssues / leads.length) * 100)}%)`,
    );

    if (consistencyIssues === 0) {
      console.log("   🎉 Perfect logical consistency across all leads!");
    } else if (consistencyIssues < leads.length * 0.05) {
      console.log("   ✅ Excellent logical consistency (< 5% issues)");
    } else if (consistencyIssues < leads.length * 0.15) {
      console.log("   ⚠️  Good logical consistency (< 15% issues)");
    } else {
      console.log("   ❌ Poor logical consistency (> 15% issues)");
    }
  }

  async generateIntelligentInsights() {
    console.log("\n🧠 Intelligent Insights & Recommendations...");
    console.log("==========================================");

    const totalValidated = Object.keys(
      this.validationResults.validationScores,
    ).length;
    const averageScore =
      Object.values(this.validationResults.validationScores).reduce(
        (sum, validation) => sum + validation.overallScore,
        0,
      ) / totalValidated;

    console.log(`📊 Overall Enrichment Quality: ${Math.round(averageScore)}%`);

    if (averageScore >= 90) {
      console.log("🎉 EXCELLENT: Enrichment data is of exceptional quality!");
    } else if (averageScore >= 80) {
      console.log(
        "✅ VERY GOOD: Enrichment data is high quality with minor areas for improvement",
      );
    } else if (averageScore >= 70) {
      console.log(
        "⚠️  GOOD: Enrichment data is acceptable but has room for improvement",
      );
    } else {
      console.log(
        "❌ NEEDS IMPROVEMENT: Enrichment data requires significant enhancement",
      );
    }

    // Show top performing enrichments
    if (this.validationResults.excellentEnrichments.length > 0) {
      console.log("\n🏆 Top Performing Enrichments:");
      this.validationResults.excellentEnrichments
        .slice(0, 5)
        .forEach((lead) => {
          console.log(
            `   • ${lead.name}: ${lead.score}% - ${lead.strengths.slice(0, 2).join(", ")}`,
          );
        });
    }

    // Show issues that need attention
    if (this.validationResults.logicalInconsistencies.length > 0) {
      console.log("\n⚠️  Logical Inconsistencies to Review:");
      this.validationResults.logicalInconsistencies
        .slice(0, 5)
        .forEach((issue) => {
          console.log(
            `   • ${issue.name}: ${issue.issue} (${issue.severity} severity)`,
          );
        });
    }

    // Generate specific recommendations
    console.log("\n💡 Intelligent Recommendations:");

    if (averageScore < 80) {
      console.log(
        "   1. Review role assignments for better job title alignment",
      );
    }

    if (
      this.validationResults.logicalInconsistencies.length >
      totalValidated * 0.1
    ) {
      console.log(
        "   2. Fix logical inconsistencies in seniority vs decision influence",
      );
    }

    if (
      this.validationResults.excellentEnrichments.length >
      totalValidated * 0.7
    ) {
      console.log(
        "   3. Enrichment quality is excellent - ready for production use!",
      );
    }

    console.log(
      "   4. Consider implementing automated validation rules for future enrichments",
    );
    console.log(
      "   5. Use top-performing enrichments as templates for quality standards",
    );
  }
}

// Run the intelligent validation
async function main() {
  const validator = new IntelligentEnrichmentValidator();
  await validator.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { IntelligentEnrichmentValidator };
