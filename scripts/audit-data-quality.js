#!/usr/bin/env node

/**
 * Data Quality Audit Script
 * 
 * Audits data quality across workspaces and identifies enrichment opportunities
 * - Calculates data quality scores
 * - Identifies records with missing critical fields
 * - Generates comprehensive reports
 * - Exports to JSON and console
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Workspace configuration
const WORKSPACE_IDS = {
  'top-temp': '01K9QAP09FHT6EAP1B4G2KP3D2',
  'notary-everyday': '01K7DNYR5VZ7JY36KGKKN76XZ1',
  'adrata': '01K7464TNANHQXPCZT1FYX205V',
  'cloudcaddie': '01K7DSWP8ZBA75K5VSWVXPEMAH',
  'pinpoint': '01K90EQWJCCN2JDMRQF12F49GN',
  'ei-cooperative': '01K9WFW99WEGDQY2RARPCVC4JD'
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  workspace: null,
  exportJson: !args.includes('--no-export'),
  verbose: args.includes('--verbose')
};

// Parse workspace argument
const workspaceArg = args.find(arg => arg.startsWith('--workspace='));
if (workspaceArg) {
  options.workspace = workspaceArg.split('=')[1];
}

class DataQualityAudit {
  constructor(options) {
    this.options = options;
    this.report = {
      timestamp: new Date().toISOString(),
      workspace: options.workspace || 'ALL_PRODUCTION',
      companies: null,
      people: null,
      summary: null
    };
  }

  /**
   * Calculate company data quality
   */
  calculateCompanyQuality(company) {
    const criticalFields = [
      company.industry,
      company.employeeCount,
      company.description,
      company.revenue,
      company.foundedYear,
      company.city || company.hqCity,
      company.phone,
      company.email,
      company.linkedinUrl,
      company.website
    ];

    const filledCount = criticalFields.filter(Boolean).length;
    const score = (filledCount / 10) * 100;

    return {
      score,
      filledFields: filledCount,
      totalFields: 10,
      missingFields: []
        .concat(!company.industry ? ['industry'] : [])
        .concat(!company.employeeCount ? ['employeeCount'] : [])
        .concat(!company.description ? ['description'] : [])
        .concat(!company.revenue ? ['revenue'] : [])
        .concat(!company.foundedYear ? ['foundedYear'] : [])
        .concat(!company.city && !company.hqCity ? ['city'] : [])
        .concat(!company.phone ? ['phone'] : [])
        .concat(!company.email ? ['email'] : [])
        .concat(!company.linkedinUrl ? ['linkedinUrl'] : [])
        .concat(!company.website ? ['website'] : [])
    };
  }

  /**
   * Calculate person data quality
   */
  calculatePersonQuality(person) {
    const criticalFields = [
      person.fullName,
      person.jobTitle,
      person.email,
      person.phone,
      person.linkedinUrl,
      person.department,
      person.location || person.city,
      person.companyId
    ];

    const filledCount = criticalFields.filter(Boolean).length;
    const score = (filledCount / 8) * 100;

    // Check intelligence fields
    const customFields = person.customFields || {};
    const hasIntelligence = !!(
      person.buyerGroupRole &&
      customFields.influenceLevel &&
      customFields.decisionPower &&
      customFields.engagementLevel
    );

    return {
      score,
      filledFields: filledCount,
      totalFields: 8,
      hasIntelligence,
      missingFields: []
        .concat(!person.fullName ? ['fullName'] : [])
        .concat(!person.jobTitle ? ['jobTitle'] : [])
        .concat(!person.email ? ['email'] : [])
        .concat(!person.phone ? ['phone'] : [])
        .concat(!person.linkedinUrl ? ['linkedinUrl'] : [])
        .concat(!person.department ? ['department'] : [])
        .concat(!person.location && !person.city ? ['location'] : [])
        .concat(!person.companyId ? ['companyId'] : []),
      missingIntelligence: []
        .concat(!person.buyerGroupRole ? ['buyerGroupRole'] : [])
        .concat(!customFields.influenceLevel ? ['influenceLevel'] : [])
        .concat(!customFields.decisionPower ? ['decisionPower'] : [])
        .concat(!customFields.engagementLevel ? ['engagementLevel'] : [])
    };
  }

  /**
   * Audit companies
   */
  async auditCompanies(workspaceFilter) {
    console.log('\n📊 Auditing Companies...');

    const companies = await prisma.companies.findMany({
      where: {
        ...workspaceFilter,
        deletedAt: null
      },
        select: {
          id: true,
          name: true,
          industry: true,
          employeeCount: true,
          description: true,
          descriptionEnriched: true,
          revenue: true,
          foundedYear: true,
          city: true,
          hqCity: true,
          phone: true,
          email: true,
          linkedinUrl: true,
          website: true,
          lastVerified: true,
          dataQualityScore: true,
          customFields: true
        }
    });

    console.log(`   Found ${companies.length} companies`);

    // Calculate quality for each
    const qualities = companies.map(c => this.calculateCompanyQuality(c));
    
    // Aggregate stats
    const totalScore = qualities.reduce((sum, q) => sum + q.score, 0);
    const avgScore = companies.length > 0 ? totalScore / companies.length : 0;
    
    const needEnrichment = companies.filter((c, i) => 
      qualities[i].score < 80 && (c.website || c.linkedinUrl)
    );

    const hasSummary = companies.filter(c => c.descriptionEnriched).length;
    const recentlyEnriched = companies.filter(c => {
      if (!c.lastVerified) return false;
      const daysSince = (Date.now() - new Date(c.lastVerified).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    }).length;

    // Field-level analysis
    const fieldCoverage = {
      industry: companies.filter(c => c.industry).length,
      employeeCount: companies.filter(c => c.employeeCount).length,
      description: companies.filter(c => c.description).length,
      revenue: companies.filter(c => c.revenue).length,
      foundedYear: companies.filter(c => c.foundedYear).length,
      location: companies.filter(c => c.city || c.hqCity).length,
      phone: companies.filter(c => c.phone).length,
      email: companies.filter(c => c.email).length,
      linkedinUrl: companies.filter(c => c.linkedinUrl).length,
      website: companies.filter(c => c.website).length
    };

    this.report.companies = {
      total: companies.length,
      avgQualityScore: Math.round(avgScore * 10) / 10,
      needEnrichment: needEnrichment.length,
      hasSummary,
      recentlyEnriched,
      fieldCoverage,
      topGaps: Object.entries(fieldCoverage)
        .map(([field, count]) => ({ 
          field, 
          missing: companies.length - count,
          coverage: Math.round((count / companies.length) * 100)
        }))
        .sort((a, b) => b.missing - a.missing)
        .slice(0, 5)
    };

    return this.report.companies;
  }

  /**
   * Audit people
   */
  async auditPeople(workspaceFilter) {
    console.log('\n👥 Auditing People...');

    const people = await prisma.people.findMany({
      where: {
        ...workspaceFilter,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        email: true,
        phone: true,
        linkedinUrl: true,
        department: true,
        location: true,
        city: true,
        state: true,
        bio: true,
        companyId: true,
        buyerGroupRole: true,
        lastEnriched: true,
        dataQualityScore: true,
        enrichmentScore: true,
        customFields: true
      }
    });

    console.log(`   Found ${people.length} people`);

    // Calculate quality for each
    const qualities = people.map(p => this.calculatePersonQuality(p));
    
    // Aggregate stats
    const totalScore = qualities.reduce((sum, q) => sum + q.score, 0);
    const avgScore = people.length > 0 ? totalScore / people.length : 0;
    
    const needEnrichment = people.filter((p, i) => 
      qualities[i].score < 75 && (p.email || p.linkedinUrl)
    );

    const hasIntelligence = qualities.filter(q => q.hasIntelligence).length;
    const needIntelligence = qualities.filter(q => !q.hasIntelligence).length;

    const recentlyEnriched = people.filter(p => {
      if (!p.lastEnriched) return false;
      const daysSince = (Date.now() - new Date(p.lastEnriched).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    }).length;

    // Field-level analysis
    const fieldCoverage = {
      fullName: people.filter(p => p.fullName).length,
      jobTitle: people.filter(p => p.jobTitle).length,
      email: people.filter(p => p.email).length,
      phone: people.filter(p => p.phone).length,
      linkedinUrl: people.filter(p => p.linkedinUrl).length,
      department: people.filter(p => p.department).length,
      location: people.filter(p => p.location || p.city).length,
      state: people.filter(p => p.state).length,
      bio: people.filter(p => p.bio).length,
      companyId: people.filter(p => p.companyId).length
    };

    this.report.people = {
      total: people.length,
      avgQualityScore: Math.round(avgScore * 10) / 10,
      needEnrichment: needEnrichment.length,
      hasIntelligence,
      needIntelligence,
      recentlyEnriched,
      fieldCoverage,
      topGaps: Object.entries(fieldCoverage)
        .map(([field, count]) => ({ 
          field, 
          missing: people.length - count,
          coverage: Math.round((count / people.length) * 100)
        }))
        .sort((a, b) => b.missing - a.missing)
        .slice(0, 5)
    };

    return this.report.people;
  }

  /**
   * Run audit
   */
  async run() {
    try {
      console.log('\n🔍 DATA QUALITY AUDIT');
      console.log('='.repeat(60));
      console.log(`Workspace: ${this.options.workspace || 'ALL PRODUCTION'}`);
      console.log(`Timestamp: ${new Date().toLocaleString()}`);
      console.log('='.repeat(60));

      // Build workspace filter
      const workspaceFilter = this.options.workspace
        ? { workspaceId: WORKSPACE_IDS[this.options.workspace] }
        : { workspaceId: { in: Object.values(WORKSPACE_IDS) } };

      // Audit companies
      const companyReport = await this.auditCompanies(workspaceFilter);

      // Audit people
      const peopleReport = await this.auditPeople(workspaceFilter);

      // Generate summary
      this.report.summary = {
        overallQuality: Math.round((companyReport.avgQualityScore + peopleReport.avgQualityScore) / 2 * 10) / 10,
        totalRecords: companyReport.total + peopleReport.total,
        needEnrichment: companyReport.needEnrichment + peopleReport.needEnrichment,
        enrichmentOpportunity: Math.round(
          ((companyReport.needEnrichment + peopleReport.needEnrichment) / 
           (companyReport.total + peopleReport.total)) * 100
        )
      };

      // Print report
      this.printReport();

      // Export to JSON
      if (this.options.exportJson) {
        this.exportReport();
      }

    } catch (error) {
      console.error('\n❌ Fatal error:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Print report to console
   */
  printReport() {
    const c = this.report.companies;
    const p = this.report.people;
    const s = this.report.summary;

    console.log('\n' + '='.repeat(60));
    console.log('📊 DATA QUALITY REPORT');
    console.log('='.repeat(60));
    
    console.log('\n🎯 SUMMARY');
    console.log(`   Overall Quality Score: ${s.overallQuality}%`);
    console.log(`   Total Records: ${s.totalRecords.toLocaleString()}`);
    console.log(`   Need Enrichment: ${s.needEnrichment.toLocaleString()} (${s.enrichmentOpportunity}%)`);

    console.log('\n🏢 COMPANIES');
    console.log(`   Total: ${c.total.toLocaleString()}`);
    console.log(`   Avg Quality Score: ${c.avgQualityScore}%`);
    console.log(`   Need Enrichment: ${c.needEnrichment.toLocaleString()}`);
    console.log(`   Have AI Summary: ${c.hasSummary.toLocaleString()}`);
    console.log(`   Recently Enriched (<30 days): ${c.recentlyEnriched}`);
    
    console.log('\n   Field Coverage:');
    Object.entries(c.fieldCoverage).forEach(([field, count]) => {
      const pct = Math.round((count / c.total) * 100);
      const bar = '█'.repeat(Math.floor(pct / 5));
      console.log(`      ${field.padEnd(15)}: ${pct}% ${bar} (${count}/${c.total})`);
    });
    
    console.log('\n   Top Gaps:');
    c.topGaps.forEach(gap => {
      console.log(`      ${gap.field.padEnd(15)}: ${gap.missing.toLocaleString()} missing (${gap.coverage}% coverage)`);
    });

    console.log('\n👥 PEOPLE');
    console.log(`   Total: ${p.total.toLocaleString()}`);
    console.log(`   Avg Quality Score: ${p.avgQualityScore}%`);
    console.log(`   Need Enrichment: ${p.needEnrichment.toLocaleString()}`);
    console.log(`   Have Intelligence: ${p.hasIntelligence.toLocaleString()}`);
    console.log(`   Need Intelligence: ${p.needIntelligence.toLocaleString()}`);
    console.log(`   Recently Enriched (<30 days): ${p.recentlyEnriched}`);
    
    console.log('\n   Field Coverage:');
    Object.entries(p.fieldCoverage).forEach(([field, count]) => {
      const pct = Math.round((count / p.total) * 100);
      const bar = '█'.repeat(Math.floor(pct / 5));
      console.log(`      ${field.padEnd(15)}: ${pct}% ${bar} (${count}/${p.total})`);
    });
    
    console.log('\n   Top Gaps:');
    p.topGaps.forEach(gap => {
      console.log(`      ${gap.field.padEnd(15)}: ${gap.missing.toLocaleString()} missing (${gap.coverage}% coverage)`);
    });

    console.log('\n='.repeat(60));
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('='.repeat(60));
    
    if (c.needEnrichment > 0) {
      console.log(`\n📌 Company Enrichment:`);
      console.log(`   Run: node scripts/batch-enrich-companies.js --workspace=${this.options.workspace || 'top-temp'}`);
      console.log(`   Will enrich: ${c.needEnrichment} companies`);
    }
    
    if (p.needEnrichment > 0) {
      console.log(`\n📌 Person Enrichment:`);
      console.log(`   Run: node scripts/batch-enrich-people.js --workspace=${this.options.workspace || 'top-temp'}`);
      console.log(`   Will enrich: ${p.needEnrichment} people`);
    }
    
    if (p.needIntelligence > 0) {
      console.log(`\n📌 Intelligence Generation:`);
      console.log(`   Run: node scripts/batch-generate-intelligence.js --workspace=${this.options.workspace || 'top-temp'}`);
      console.log(`   Will generate: ${p.needIntelligence} intelligence profiles`);
    }
    
    console.log('\n='.repeat(60) + '\n');
  }

  /**
   * Export report to JSON
   */
  exportReport() {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `data-quality-audit-${this.options.workspace || 'all'}-${timestamp}.json`;
    const filepath = path.join(process.cwd(), 'scripts', 'reports', filename);

    // Ensure reports directory exists
    const reportsDir = path.join(process.cwd(), 'scripts', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(filepath, JSON.stringify(this.report, null, 2));
    
    console.log(`📄 Report exported to: ${filepath}\n`);
  }
}

// Main execution
async function main() {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Data Quality Audit Script

Usage:
  node scripts/audit-data-quality.js [options]

Options:
  --workspace=<name>    Target workspace (top-temp, notary-everyday, adrata, etc.)
  --no-export           Don't export JSON report
  --verbose             Show detailed output
  --help, -h            Show this help message

Examples:
  node scripts/audit-data-quality.js --workspace=top-temp
  node scripts/audit-data-quality.js --workspace=top-temp --verbose
  node scripts/audit-data-quality.js --workspace=notary-everyday

This script:
  - Calculates data quality scores for all records
  - Identifies records needing enrichment
  - Shows field coverage statistics
  - Provides actionable recommendations
  - Exports detailed report to JSON
`);
    process.exit(0);
  }

  const audit = new DataQualityAudit(options);
  await audit.run();
}

main()
  .then(() => {
    console.log('✅ Audit completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  });

