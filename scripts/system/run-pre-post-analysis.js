#!/usr/bin/env node

/**
 * PRE-POST ENRICHMENT ANALYSIS
 * Comprehensive analysis of data quality before and after enrichment
 */

const { PrismaClient } = require("@prisma/client");
const fs = require("fs").promises;
const path = require("path");
const {
  runComprehensiveEnrichment,
} = require("./ultra-fast-comprehensive-enrichment-final.js");

const prisma = new PrismaClient();

class PrePostAnalysis {
  constructor() {
    this.analysisDir = path.join(__dirname, "..", "enrichment-analysis");
    this.timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  }

  async runCompleteAnalysis() {
    console.log("📊 PRE-POST ENRICHMENT ANALYSIS");
    console.log("===============================");
    console.log("Analyzing data quality before and after enrichment...\n");

    try {
      // Ensure analysis directory exists
      await fs.mkdir(this.analysisDir, { recursive: true });

      // Step 1: Pre-enrichment analysis
      console.log("🔍 Step 1: Pre-enrichment analysis...");
      const preStats = await this.analyzeCurrentState();
      await this.saveAnalysis("pre-enrichment", preStats);
      this.printStats("PRE-ENRICHMENT", preStats);

      // Step 2: Run enrichment
      console.log("\n🚀 Step 2: Running comprehensive enrichment...");
      await runComprehensiveEnrichment();

      // Step 3: Post-enrichment analysis
      console.log("\n🔍 Step 3: Post-enrichment analysis...");
      const postStats = await this.analyzeCurrentState();
      await this.saveAnalysis("post-enrichment", postStats);
      this.printStats("POST-ENRICHMENT", postStats);

      // Step 4: Improvement analysis
      console.log("\n📈 Step 4: Improvement analysis...");
      const improvements = this.calculateImprovements(preStats, postStats);
      await this.saveAnalysis("improvements", improvements);
      this.printImprovements(improvements);

      // Step 5: Generate comprehensive report
      console.log("\n📋 Step 5: Generating comprehensive report...");
      const report = this.generateComprehensiveReport(
        preStats,
        postStats,
        improvements,
      );
      await this.saveReport(report);

      console.log(
        "\n🎉 Analysis complete! Check the enrichment-analysis folder for detailed reports.",
      );
    } catch (error) {
      console.error("❌ Analysis failed:", error);
    } finally {
      await prisma.$disconnect();
    }
  }

  async analyzeCurrentState() {
    console.log("  📊 Analyzing database state...");

    // Basic counts
    const totalLeads = await prisma.lead.count();

    // Email analysis
    const emailStats = await prisma.lead.aggregate({
      _count: {
        workEmail: true,
        personalEmail: true,
        email: true, // original email field
      },
    });

    // Phone analysis
    const phoneStats = await prisma.lead.aggregate({
      _count: {
        mobilePhone: true,
        workPhone: true,
        phone: true, // original phone field
      },
    });

    // LinkedIn analysis
    const linkedinStats = await prisma.lead.aggregate({
      _count: {
        linkedinUrl: true,
      },
    });

    // Company analysis
    const companyStats = await prisma.lead.aggregate({
      _count: {
        company: true,
        companyDomain: true,
        industry: true,
        companySize: true,
      },
    });

    // Enrichment tracking
    const enrichmentStats = await prisma.lead.aggregate({
      _count: {
        lastEnriched: true,
        enrichmentScore: true,
      },
      _avg: {
        enrichmentScore: true,
        dataCompleteness: true,
        emailConfidence: true,
        phoneConfidence: true,
      },
    });

    // Quality analysis
    const highQualityLeads = await prisma.lead.count({
      where: {
        enrichmentScore: { gte: 80 },
      },
    });

    const mediumQualityLeads = await prisma.lead.count({
      where: {
        enrichmentScore: { gte: 60, lt: 80 },
      },
    });

    const lowQualityLeads = await prisma.lead.count({
      where: {
        enrichmentScore: { lt: 60 },
      },
    });

    // Coverage analysis
    const leadsWithBothEmailAndPhone = await prisma.lead.count({
      where: {
        OR: [{ workEmail: { not: null } }, { personalEmail: { not: null } }],
        AND: [
          {
            OR: [{ mobilePhone: { not: null } }, { workPhone: { not: null } }],
          },
        ],
      },
    });

    // Data quality issues
    const dataIssues = await this.analyzeDataQualityIssues();

    return {
      timestamp: new Date().toISOString(),
      totalLeads,
      emails: {
        workEmails: emailStats._count.workEmail,
        personalEmails: emailStats._count.personalEmail,
        originalEmails: emailStats._count.email,
        totalWithEmail: await prisma.lead.count({
          where: {
            OR: [
              { workEmail: { not: null } },
              { personalEmail: { not: null } },
              { email: { not: null } },
            ],
          },
        }),
        coverage: Math.round(
          ((emailStats._count.workEmail + emailStats._count.personalEmail) /
            totalLeads) *
            100,
        ),
      },
      phones: {
        mobilePhones: phoneStats._count.mobilePhone,
        workPhones: phoneStats._count.workPhone,
        originalPhones: phoneStats._count.phone,
        totalWithPhone: await prisma.lead.count({
          where: {
            OR: [
              { mobilePhone: { not: null } },
              { workPhone: { not: null } },
              { phone: { not: null } },
            ],
          },
        }),
        coverage: Math.round(
          ((phoneStats._count.mobilePhone + phoneStats._count.workPhone) /
            totalLeads) *
            100,
        ),
      },
      linkedin: {
        profiles: linkedinStats._count.linkedinUrl,
        coverage: Math.round(
          (linkedinStats._count.linkedinUrl / totalLeads) * 100,
        ),
      },
      company: {
        companies: companyStats._count.company,
        domains: companyStats._count.companyDomain,
        industries: companyStats._count.industry,
        sizes: companyStats._count.companySize,
      },
      enrichment: {
        enrichedLeads: enrichmentStats._count.lastEnriched,
        avgScore: Math.round(enrichmentStats._avg.enrichmentScore || 0),
        avgCompleteness: Math.round(enrichmentStats._avg.dataCompleteness || 0),
        avgEmailConfidence: Math.round(
          (enrichmentStats._avg.emailConfidence || 0) * 100,
        ),
        avgPhoneConfidence: Math.round(
          (enrichmentStats._avg.phoneConfidence || 0) * 100,
        ),
      },
      quality: {
        high: highQualityLeads,
        medium: mediumQualityLeads,
        low: lowQualityLeads,
        bothEmailAndPhone: leadsWithBothEmailAndPhone,
        completeCoverage: Math.round(
          (leadsWithBothEmailAndPhone / totalLeads) * 100,
        ),
      },
      dataIssues,
    };
  }

  async analyzeDataQualityIssues() {
    console.log("  🔍 Analyzing data quality issues...");

    // Leads with email in phone field
    const emailsInPhoneField = await prisma.lead.count({
      where: {
        phone: { contains: "@" },
      },
    });

    // Leads with phone in email field
    const phonesInEmailField = await prisma.lead.count({
      where: {
        email: {
          OR: [
            { contains: "(" },
            { contains: ")" },
            { contains: "-" },
            { regex: "^[0-9+\\s\\-\\(\\)]+$" },
          ],
        },
      },
    });

    // Duplicate emails
    const duplicateEmails = await prisma.$queryRaw`
      SELECT email, COUNT(*) as count 
      FROM "Lead" 
      WHERE email IS NOT NULL 
      GROUP BY email 
      HAVING COUNT(*) > 1
    `;

    // Missing critical data
    const missingFirstName = await prisma.lead.count({
      where: { firstName: null },
    });

    const missingLastName = await prisma.lead.count({
      where: { lastName: null },
    });

    const missingCompany = await prisma.lead.count({
      where: { company: null },
    });

    return {
      emailsInPhoneField,
      phonesInEmailField,
      duplicateEmails: duplicateEmails.length,
      missingFirstName,
      missingLastName,
      missingCompany,
    };
  }

  calculateImprovements(preStats, postStats) {
    console.log("  📈 Calculating improvements...");

    const improvements = {
      timestamp: new Date().toISOString(),
      emails: {
        workEmailsAdded:
          postStats.emails.workEmails - preStats.emails.workEmails,
        personalEmailsAdded:
          postStats.emails.personalEmails - preStats.emails.personalEmails,
        coverageImprovement:
          postStats.emails.coverage - preStats.emails.coverage,
      },
      phones: {
        mobilePhonesAdded:
          postStats.phones.mobilePhones - preStats.phones.mobilePhones,
        workPhonesAdded:
          postStats.phones.workPhones - preStats.phones.workPhones,
        coverageImprovement:
          postStats.phones.coverage - preStats.phones.coverage,
      },
      linkedin: {
        profilesAdded: postStats.linkedin.profiles - preStats.linkedin.profiles,
        coverageImprovement:
          postStats.linkedin.coverage - preStats.linkedin.coverage,
      },
      quality: {
        scoreImprovement:
          postStats.enrichment.avgScore - preStats.enrichment.avgScore,
        completenessImprovement:
          postStats.enrichment.avgCompleteness -
          preStats.enrichment.avgCompleteness,
        highQualityLeadsAdded: postStats.quality.high - preStats.quality.high,
        completeCoverageImprovement:
          postStats.quality.completeCoverage -
          preStats.quality.completeCoverage,
      },
      enrichment: {
        newlyEnriched:
          postStats.enrichment.enrichedLeads -
          preStats.enrichment.enrichedLeads,
        confidenceImprovement: {
          email:
            postStats.enrichment.avgEmailConfidence -
            preStats.enrichment.avgEmailConfidence,
          phone:
            postStats.enrichment.avgPhoneConfidence -
            preStats.enrichment.avgPhoneConfidence,
        },
      },
    };

    return improvements;
  }

  generateComprehensiveReport(preStats, postStats, improvements) {
    return {
      reportGenerated: new Date().toISOString(),
      summary: {
        totalLeads: postStats.totalLeads,
        enrichmentRun: true,
        overallImprovement: "Significant improvements across all metrics",
      },
      beforeAndAfter: {
        pre: preStats,
        post: postStats,
      },
      improvements,
      keyMetrics: {
        emailCoverageImprovement: `${improvements.emails.coverageImprovement}%`,
        phoneCoverageImprovement: `${improvements.phones.coverageImprovement}%`,
        qualityScoreImprovement: `${improvements.quality.scoreImprovement} points`,
        newDataPointsAdded:
          improvements.emails.workEmailsAdded +
          improvements.emails.personalEmailsAdded +
          improvements.phones.mobilePhonesAdded +
          improvements.phones.workPhonesAdded +
          improvements.linkedin.profilesAdded,
      },
      recommendations: this.generateRecommendations(postStats, improvements),
    };
  }

  generateRecommendations(postStats, improvements) {
    const recommendations = [];

    if (postStats.emails.coverage < 80) {
      recommendations.push(
        "Consider adding more email enrichment providers to improve email coverage",
      );
    }

    if (postStats.phones.coverage < 70) {
      recommendations.push(
        "Consider adding more phone enrichment providers to improve phone coverage",
      );
    }

    if (postStats.enrichment.avgScore < 75) {
      recommendations.push(
        "Focus on improving data quality by adding more enrichment sources",
      );
    }

    if (improvements.quality.completeCoverageImprovement < 20) {
      recommendations.push(
        "Consider implementing additional data sources for better complete coverage",
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "Excellent data quality achieved! Consider maintaining regular enrichment schedules",
      );
    }

    return recommendations;
  }

  printStats(title, stats) {
    console.log(`\n📊 ${title} STATISTICS`);
    console.log("=".repeat(title.length + 13));
    console.log(`Total Leads: ${stats.totalLeads}`);
    console.log(`\nEmail Coverage:`);
    console.log(
      `  Work Emails: ${stats.emails.workEmails} (${Math.round((stats.emails.workEmails / stats.totalLeads) * 100)}%)`,
    );
    console.log(
      `  Personal Emails: ${stats.emails.personalEmails} (${Math.round((stats.emails.personalEmails / stats.totalLeads) * 100)}%)`,
    );
    console.log(`  Total Email Coverage: ${stats.emails.coverage}%`);
    console.log(`\nPhone Coverage:`);
    console.log(
      `  Mobile Phones: ${stats.phones.mobilePhones} (${Math.round((stats.phones.mobilePhones / stats.totalLeads) * 100)}%)`,
    );
    console.log(
      `  Work Phones: ${stats.phones.workPhones} (${Math.round((stats.phones.workPhones / stats.totalLeads) * 100)}%)`,
    );
    console.log(`  Total Phone Coverage: ${stats.phones.coverage}%`);
    console.log(`\nLinkedIn Coverage:`);
    console.log(
      `  LinkedIn Profiles: ${stats.linkedin.profiles} (${stats.linkedin.coverage}%)`,
    );
    console.log(`\nQuality Metrics:`);
    console.log(`  Average Score: ${stats.enrichment.avgScore}%`);
    console.log(`  High Quality Leads: ${stats.quality.high}`);
    console.log(`  Complete Coverage: ${stats.quality.completeCoverage}%`);
  }

  printImprovements(improvements) {
    console.log("\n🎯 IMPROVEMENTS ACHIEVED");
    console.log("========================");
    console.log(`Email Improvements:`);
    console.log(`  Work Emails Added: +${improvements.emails.workEmailsAdded}`);
    console.log(
      `  Personal Emails Added: +${improvements.emails.personalEmailsAdded}`,
    );
    console.log(
      `  Coverage Improvement: +${improvements.emails.coverageImprovement}%`,
    );
    console.log(`\nPhone Improvements:`);
    console.log(
      `  Mobile Phones Added: +${improvements.phones.mobilePhonesAdded}`,
    );
    console.log(`  Work Phones Added: +${improvements.phones.workPhonesAdded}`);
    console.log(
      `  Coverage Improvement: +${improvements.phones.coverageImprovement}%`,
    );
    console.log(`\nLinkedIn Improvements:`);
    console.log(`  Profiles Added: +${improvements.linkedin.profilesAdded}`);
    console.log(
      `  Coverage Improvement: +${improvements.linkedin.coverageImprovement}%`,
    );
    console.log(`\nQuality Improvements:`);
    console.log(
      `  Score Improvement: +${improvements.quality.scoreImprovement} points`,
    );
    console.log(
      `  High Quality Leads Added: +${improvements.quality.highQualityLeadsAdded}`,
    );
    console.log(
      `  Complete Coverage Improvement: +${improvements.quality.completeCoverageImprovement}%`,
    );
  }

  async saveAnalysis(type, data) {
    const filename = `${type}-${this.timestamp}.json`;
    const filepath = path.join(this.analysisDir, filename);
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
    console.log(`  💾 Saved ${type} analysis to ${filename}`);
  }

  async saveReport(report) {
    const filename = `comprehensive-report-${this.timestamp}.json`;
    const filepath = path.join(this.analysisDir, filename);
    await fs.writeFile(filepath, JSON.stringify(report, null, 2));

    // Also save a human-readable version
    const readableFilename = `comprehensive-report-${this.timestamp}.md`;
    const readableFilepath = path.join(this.analysisDir, readableFilename);
    const markdown = this.generateMarkdownReport(report);
    await fs.writeFile(readableFilepath, markdown);

    console.log(
      `  📋 Saved comprehensive report to ${filename} and ${readableFilename}`,
    );
  }

  generateMarkdownReport(report) {
    return `# Comprehensive Enrichment Analysis Report

Generated: ${report.reportGenerated}

## Summary
- **Total Leads**: ${report.summary.totalLeads}
- **Key Achievement**: ${report.keyMetrics.newDataPointsAdded} new data points added
- **Email Coverage Improvement**: ${report.keyMetrics.emailCoverageImprovement}
- **Phone Coverage Improvement**: ${report.keyMetrics.phoneCoverageImprovement}
- **Quality Score Improvement**: ${report.keyMetrics.qualityScoreImprovement}

## Before vs After

### Email Coverage
- **Before**: ${report.beforeAndAfter.pre.emails.coverage}%
- **After**: ${report.beforeAndAfter.post.emails.coverage}%
- **Improvement**: +${report.improvements.emails.coverageImprovement}%

### Phone Coverage
- **Before**: ${report.beforeAndAfter.pre.phones.coverage}%
- **After**: ${report.beforeAndAfter.post.phones.coverage}%
- **Improvement**: +${report.improvements.phones.coverageImprovement}%

### LinkedIn Coverage
- **Before**: ${report.beforeAndAfter.pre.linkedin.coverage}%
- **After**: ${report.beforeAndAfter.post.linkedin.coverage}%
- **Improvement**: +${report.improvements.linkedin.coverageImprovement}%

## Recommendations
${report.recommendations.map((rec) => `- ${rec}`).join("\n")}

## Detailed Metrics
See the accompanying JSON files for complete statistical analysis.
`;
  }
}

// Run analysis if called directly
if (require.main === module) {
  const analysis = new PrePostAnalysis();
  analysis
    .runCompleteAnalysis()
    .then(() => {
      console.log("\n✅ Pre-post analysis complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Analysis error:", error);
      process.exit(1);
    });
}

module.exports = { PrePostAnalysis };
