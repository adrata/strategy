#!/usr/bin/env node

/**
 * Audit Top-Temp Data Transfer
 * 
 * Audits all data in top-temp workspace to ensure complete transfer:
 * - All company fields (including intelligence data)
 * - All people fields (including intelligence data)
 * - Intelligence data (companyIntelligence, aiIntelligence, etc.)
 * - Data quality scores
 * - All related data
 * 
 * Usage:
 *   node scripts/audit-top-temp-data-transfer.js [--compare]
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Workspace IDs
const TOP_TEMP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';
const TOP_ENGINEERING_PLUS_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

class TopTempDataAudit {
  constructor() {
    this.results = {
      companies: {
        total: 0,
        withIntelligence: 0,
        withAIIntelligence: 0,
        withDataQuality: 0,
        intelligenceFields: {},
        sampleRecords: []
      },
      people: {
        total: 0,
        withIntelligence: 0,
        withAIIntelligence: 0,
        withDataQuality: 0,
        intelligenceFields: {},
        sampleRecords: []
      },
      comparison: {
        companiesMatched: 0,
        companiesMissing: [],
        peopleMatched: 0,
        peopleMissing: [],
        intelligencePreserved: true,
        dataQualityPreserved: true
      }
    };
  }

  log(message, level = 'info') {
    const icon = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
    console.log(`${icon} ${message}`);
  }

  async execute() {
    try {
      this.log('TOP-TEMP DATA TRANSFER AUDIT', 'info');
      this.log('='.repeat(70), 'info');
      this.log('', 'info');

      // Step 1: Audit Companies in top-temp
      await this.auditCompanies();

      // Step 2: Audit People in top-temp
      await this.auditPeople();

      // Step 3: Compare with TOP Engineering Plus (if --compare flag)
      const args = process.argv.slice(2);
      if (args.includes('--compare')) {
        await this.compareWithTopEngineeringPlus();
      }

      // Step 4: Generate Report
      this.generateReport();

    } catch (error) {
      this.log(`Audit failed: ${error.message}`, 'error');
      console.error(error);
      throw error;
    } finally {
      try {
        await prisma.$disconnect();
      } catch (disconnectError) {
        // Ignore disconnect errors (known issue on Windows)
      }
    }
  }

  // Step 1: Audit Companies
  async auditCompanies() {
    this.log('Step 1: Auditing Companies in top-temp', 'info');
    this.log('-'.repeat(70), 'info');

    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: null
      }
    });

    this.results.companies.total = companies.length;
    this.log(`Found ${companies.length} companies`, 'info');

    // Check intelligence fields
    let withIntelligence = 0;
    let withAIIntelligence = 0;
    let withDataQuality = 0;
    const intelligenceFields = {
      companyIntelligence: 0,
      aiIntelligence: 0,
      dataQualityScore: 0,
      dataQualityBreakdown: 0,
      dataSources: 0,
      aiConfidence: 0,
      aiLastUpdated: 0,
      dataLastVerified: 0,
      descriptionEnriched: 0,
      customFields: 0
    };

    for (const company of companies) {
      // Check for intelligence data
      if (company.companyIntelligence) {
        withIntelligence++;
        intelligenceFields.companyIntelligence++;
      }
      if (company.aiIntelligence) {
        withAIIntelligence++;
        intelligenceFields.aiIntelligence++;
      }
      if (company.dataQualityScore !== null && company.dataQualityScore > 0) {
        withDataQuality++;
        intelligenceFields.dataQualityScore++;
      }
      if (company.dataQualityBreakdown) {
        intelligenceFields.dataQualityBreakdown++;
      }
      if (company.dataSources && company.dataSources.length > 0) {
        intelligenceFields.dataSources++;
      }
      if (company.aiConfidence !== null && company.aiConfidence > 0) {
        intelligenceFields.aiConfidence++;
      }
      if (company.aiLastUpdated) {
        intelligenceFields.aiLastUpdated++;
      }
      if (company.dataLastVerified) {
        intelligenceFields.dataLastVerified++;
      }
      if (company.descriptionEnriched) {
        intelligenceFields.descriptionEnriched++;
      }
      if (company.customFields) {
        intelligenceFields.customFields++;
      }
    }

    this.results.companies.withIntelligence = withIntelligence;
    this.results.companies.withAIIntelligence = withAIIntelligence;
    this.results.companies.withDataQuality = withDataQuality;
    this.results.companies.intelligenceFields = intelligenceFields;

    this.log(`Companies with companyIntelligence: ${withIntelligence} (${((withIntelligence / companies.length) * 100).toFixed(2)}%)`, 'info');
    this.log(`Companies with aiIntelligence: ${withAIIntelligence} (${((withAIIntelligence / companies.length) * 100).toFixed(2)}%)`, 'info');
    this.log(`Companies with dataQualityScore: ${withDataQuality} (${((withDataQuality / companies.length) * 100).toFixed(2)}%)`, 'info');

    // Sample records with intelligence
    const companiesWithIntelligence = companies.filter(c => 
      c.companyIntelligence || c.aiIntelligence || (c.dataQualityScore && c.dataQualityScore > 0)
    ).slice(0, 5);

    this.results.companies.sampleRecords = companiesWithIntelligence.map(c => ({
      id: c.id,
      name: c.name,
      hasCompanyIntelligence: !!c.companyIntelligence,
      hasAIIntelligence: !!c.aiIntelligence,
      dataQualityScore: c.dataQualityScore,
      aiConfidence: c.aiIntelligence ? (c.aiIntelligence.confidence || c.aiConfidence) : null,
      dataSources: c.dataSources || []
    }));

    this.log('', 'info');
  }

  // Step 2: Audit People
  async auditPeople() {
    this.log('Step 2: Auditing People in top-temp', 'info');
    this.log('-'.repeat(70), 'info');

    const people = await prisma.people.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: null
      }
    });

    this.results.people.total = people.length;
    this.log(`Found ${people.length} people`, 'info');

    // Check intelligence fields
    let withIntelligence = 0;
    let withAIIntelligence = 0;
    let withDataQuality = 0;
    const intelligenceFields = {
      aiIntelligence: 0,
      dataQualityScore: 0,
      dataQualityBreakdown: 0,
      dataSources: 0,
      enrichmentScore: 0,
      aiConfidence: 0,
      aiLastUpdated: 0,
      dataLastVerified: 0,
      coresignalData: 0,
      enrichedData: 0,
      customFields: 0,
      buyerGroupRole: 0,
      decisionPower: 0,
      influenceLevel: 0
    };

    for (const person of people) {
      // Check for intelligence data
      if (person.aiIntelligence) {
        withAIIntelligence++;
        intelligenceFields.aiIntelligence++;
      }
      if (person.dataQualityScore !== null && person.dataQualityScore > 0) {
        withDataQuality++;
        intelligenceFields.dataQualityScore++;
      }
      if (person.dataQualityBreakdown) {
        intelligenceFields.dataQualityBreakdown++;
      }
      if (person.dataSources && person.dataSources.length > 0) {
        intelligenceFields.dataSources++;
      }
      if (person.enrichmentScore !== null && person.enrichmentScore > 0) {
        intelligenceFields.enrichmentScore++;
      }
      if (person.aiConfidence !== null && person.aiConfidence > 0) {
        intelligenceFields.aiConfidence++;
      }
      if (person.aiLastUpdated) {
        intelligenceFields.aiLastUpdated++;
      }
      if (person.dataLastVerified) {
        intelligenceFields.dataLastVerified++;
      }
      if (person.coresignalData) {
        intelligenceFields.coresignalData++;
      }
      if (person.enrichedData) {
        intelligenceFields.enrichedData++;
      }
      if (person.customFields) {
        intelligenceFields.customFields++;
      }
      if (person.buyerGroupRole) {
        intelligenceFields.buyerGroupRole++;
      }
      if (person.decisionPower !== null && person.decisionPower > 0) {
        intelligenceFields.decisionPower++;
      }
      if (person.influenceLevel) {
        intelligenceFields.influenceLevel++;
      }

      // Count as having intelligence if any intelligence field is present
      if (person.aiIntelligence || person.coresignalData || person.enrichedData || 
          person.buyerGroupRole || person.decisionPower || person.influenceLevel) {
        withIntelligence++;
      }
    }

    this.results.people.withIntelligence = withIntelligence;
    this.results.people.withAIIntelligence = withAIIntelligence;
    this.results.people.withDataQuality = withDataQuality;
    this.results.people.intelligenceFields = intelligenceFields;

    this.log(`People with intelligence data: ${withIntelligence} (${((withIntelligence / people.length) * 100).toFixed(2)}%)`, 'info');
    this.log(`People with aiIntelligence: ${withAIIntelligence} (${((withAIIntelligence / people.length) * 100).toFixed(2)}%)`, 'info');
    this.log(`People with dataQualityScore: ${withDataQuality} (${((withDataQuality / people.length) * 100).toFixed(2)}%)`, 'info');
    this.log(`People with coresignalData: ${intelligenceFields.coresignalData} (${((intelligenceFields.coresignalData / people.length) * 100).toFixed(2)}%)`, 'info');
    this.log(`People with enrichedData: ${intelligenceFields.enrichedData} (${((intelligenceFields.enrichedData / people.length) * 100).toFixed(2)}%)`, 'info');

    // Sample records with intelligence
    const peopleWithIntelligence = people.filter(p => 
      p.aiIntelligence || p.coresignalData || p.enrichedData || 
      p.buyerGroupRole || p.decisionPower || p.influenceLevel
    ).slice(0, 5);

    this.results.people.sampleRecords = peopleWithIntelligence.map(p => ({
      id: p.id,
      fullName: p.fullName,
      hasAIIntelligence: !!p.aiIntelligence,
      dataQualityScore: p.dataQualityScore,
      enrichmentScore: p.enrichmentScore,
      aiConfidence: p.aiIntelligence ? (p.aiIntelligence.confidence || p.aiConfidence) : null,
      buyerGroupRole: p.buyerGroupRole,
      decisionPower: p.decisionPower,
      influenceLevel: p.influenceLevel,
      dataSources: p.dataSources || []
    }));

    this.log('', 'info');
  }

  // Step 3: Compare with TOP Engineering Plus
  async compareWithTopEngineeringPlus() {
    this.log('Step 3: Comparing with TOP Engineering Plus', 'info');
    this.log('-'.repeat(70), 'info');

    // Get all companies from top-temp
    const topTempCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        companyIntelligence: true,
        aiIntelligence: true,
        dataQualityScore: true,
        dataSources: true
      }
    });

    // Get all people from top-temp
    const topTempPeople = await prisma.people.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        aiIntelligence: true,
        dataQualityScore: true,
        coresignalData: true,
        enrichedData: true
      }
    });

    // Check if they exist in TOP Engineering Plus
    const topEngineeringPlusCompanyIds = topTempCompanies.map(c => c.id);
    const topEngineeringPlusPeopleIds = topTempPeople.map(p => p.id);

    const matchedCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        id: { in: topEngineeringPlusCompanyIds },
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        companyIntelligence: true,
        aiIntelligence: true,
        dataQualityScore: true,
        dataSources: true
      }
    });

    const matchedPeople = await prisma.people.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        id: { in: topEngineeringPlusPeopleIds },
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        aiIntelligence: true,
        dataQualityScore: true,
        coresignalData: true,
        enrichedData: true
      }
    });

    this.results.comparison.companiesMatched = matchedCompanies.length;
    this.results.comparison.peopleMatched = matchedPeople.length;

    // Check for missing records
    const matchedCompanyIds = new Set(matchedCompanies.map(c => c.id));
    const matchedPersonIds = new Set(matchedPeople.map(p => p.id));

    this.results.comparison.companiesMissing = topTempCompanies
      .filter(c => !matchedCompanyIds.has(c.id))
      .map(c => ({ id: c.id, name: c.name }));

    this.results.comparison.peopleMissing = topTempPeople
      .filter(p => !matchedPersonIds.has(p.id))
      .map(p => ({ id: p.id, fullName: p.fullName }));

    // Verify intelligence data is preserved
    let intelligencePreserved = true;
    let dataQualityPreserved = true;

    for (const topTempCompany of topTempCompanies) {
      const matched = matchedCompanies.find(c => c.id === topTempCompany.id);
      if (matched) {
        // Check if intelligence data is preserved
        if (topTempCompany.companyIntelligence && !matched.companyIntelligence) {
          intelligencePreserved = false;
          this.log(`Company ${topTempCompany.name}: companyIntelligence missing in TOP Engineering Plus`, 'warn');
        }
        if (topTempCompany.aiIntelligence && !matched.aiIntelligence) {
          intelligencePreserved = false;
          this.log(`Company ${topTempCompany.name}: aiIntelligence missing in TOP Engineering Plus`, 'warn');
        }
        if (topTempCompany.dataQualityScore !== matched.dataQualityScore) {
          dataQualityPreserved = false;
          this.log(`Company ${topTempCompany.name}: dataQualityScore mismatch (${topTempCompany.dataQualityScore} vs ${matched.dataQualityScore})`, 'warn');
        }
      }
    }

    for (const topTempPerson of topTempPeople) {
      const matched = matchedPeople.find(p => p.id === topTempPerson.id);
      if (matched) {
        // Check if intelligence data is preserved
        if (topTempPerson.aiIntelligence && !matched.aiIntelligence) {
          intelligencePreserved = false;
          this.log(`Person ${topTempPerson.fullName}: aiIntelligence missing in TOP Engineering Plus`, 'warn');
        }
        if (topTempPerson.coresignalData && !matched.coresignalData) {
          intelligencePreserved = false;
          this.log(`Person ${topTempPerson.fullName}: coresignalData missing in TOP Engineering Plus`, 'warn');
        }
        if (topTempPerson.enrichedData && !matched.enrichedData) {
          intelligencePreserved = false;
          this.log(`Person ${topTempPerson.fullName}: enrichedData missing in TOP Engineering Plus`, 'warn');
        }
        if (topTempPerson.dataQualityScore !== matched.dataQualityScore) {
          dataQualityPreserved = false;
          this.log(`Person ${topTempPerson.fullName}: dataQualityScore mismatch (${topTempPerson.dataQualityScore} vs ${matched.dataQualityScore})`, 'warn');
        }
      }
    }

    this.results.comparison.intelligencePreserved = intelligencePreserved;
    this.results.comparison.dataQualityPreserved = dataQualityPreserved;

    this.log(`Companies matched: ${matchedCompanies.length}/${topTempCompanies.length}`, 'info');
    this.log(`People matched: ${matchedPeople.length}/${topTempPeople.length}`, 'info');
    this.log(`Intelligence preserved: ${intelligencePreserved ? 'YES' : 'NO'}`, intelligencePreserved ? 'success' : 'error');
    this.log(`Data quality preserved: ${dataQualityPreserved ? 'YES' : 'NO'}`, dataQualityPreserved ? 'success' : 'error');

    if (this.results.comparison.companiesMissing.length > 0) {
      this.log(`Missing companies: ${this.results.comparison.companiesMissing.length}`, 'warn');
    }
    if (this.results.comparison.peopleMissing.length > 0) {
      this.log(`Missing people: ${this.results.comparison.peopleMissing.length}`, 'warn');
    }

    this.log('', 'info');
  }

  // Step 4: Generate Report
  generateReport() {
    this.log('='.repeat(70), 'info');
    this.log('AUDIT SUMMARY', 'info');
    this.log('='.repeat(70), 'info');

    // Companies Summary
    this.log('', 'info');
    this.log('COMPANIES:', 'info');
    this.log(`  Total: ${this.results.companies.total}`, 'info');
    this.log(`  With companyIntelligence: ${this.results.companies.withIntelligence} (${((this.results.companies.withIntelligence / this.results.companies.total) * 100).toFixed(2)}%)`, 'info');
    this.log(`  With aiIntelligence: ${this.results.companies.withAIIntelligence} (${((this.results.companies.withAIIntelligence / this.results.companies.total) * 100).toFixed(2)}%)`, 'info');
    this.log(`  With dataQualityScore: ${this.results.companies.withDataQuality} (${((this.results.companies.withDataQuality / this.results.companies.total) * 100).toFixed(2)}%)`, 'info');
    
    this.log('  Intelligence Fields:', 'info');
    for (const [field, count] of Object.entries(this.results.companies.intelligenceFields)) {
      const percentage = this.results.companies.total > 0 ? ((count / this.results.companies.total) * 100).toFixed(2) : 0;
      this.log(`    ${field}: ${count} (${percentage}%)`, 'info');
    }

    // People Summary
    this.log('', 'info');
    this.log('PEOPLE:', 'info');
    this.log(`  Total: ${this.results.people.total}`, 'info');
    this.log(`  With intelligence data: ${this.results.people.withIntelligence} (${((this.results.people.withIntelligence / this.results.people.total) * 100).toFixed(2)}%)`, 'info');
    this.log(`  With aiIntelligence: ${this.results.people.withAIIntelligence} (${((this.results.people.withAIIntelligence / this.results.people.total) * 100).toFixed(2)}%)`, 'info');
    this.log(`  With dataQualityScore: ${this.results.people.withDataQuality} (${((this.results.people.withDataQuality / this.results.people.total) * 100).toFixed(2)}%)`, 'info');
    
    this.log('  Intelligence Fields:', 'info');
    for (const [field, count] of Object.entries(this.results.people.intelligenceFields)) {
      const percentage = this.results.people.total > 0 ? ((count / this.results.people.total) * 100).toFixed(2) : 0;
      this.log(`    ${field}: ${count} (${percentage}%)`, 'info');
    }

    // Comparison Summary (if run)
    if (this.results.comparison.companiesMatched > 0 || this.results.comparison.peopleMatched > 0) {
      this.log('', 'info');
      this.log('COMPARISON WITH TOP ENGINEERING PLUS:', 'info');
      this.log(`  Companies matched: ${this.results.comparison.companiesMatched}`, 'info');
      this.log(`  People matched: ${this.results.comparison.peopleMatched}`, 'info');
      this.log(`  Intelligence preserved: ${this.results.comparison.intelligencePreserved ? 'YES' : 'NO'}`, this.results.comparison.intelligencePreserved ? 'success' : 'error');
      this.log(`  Data quality preserved: ${this.results.comparison.dataQualityPreserved ? 'YES' : 'NO'}`, this.results.comparison.dataQualityPreserved ? 'success' : 'error');
      
      if (this.results.comparison.companiesMissing.length > 0) {
        this.log(`  Missing companies: ${this.results.comparison.companiesMissing.length}`, 'warn');
      }
      if (this.results.comparison.peopleMissing.length > 0) {
        this.log(`  Missing people: ${this.results.comparison.peopleMissing.length}`, 'warn');
      }
    }

    // Sample Records
    if (this.results.companies.sampleRecords.length > 0) {
      this.log('', 'info');
      this.log('SAMPLE COMPANIES WITH INTELLIGENCE:', 'info');
      this.results.companies.sampleRecords.forEach((c, idx) => {
        this.log(`  ${idx + 1}. ${c.name}`, 'info');
        this.log(`     - companyIntelligence: ${c.hasCompanyIntelligence ? 'YES' : 'NO'}`, 'info');
        this.log(`     - aiIntelligence: ${c.hasAIIntelligence ? 'YES' : 'NO'}`, 'info');
        this.log(`     - dataQualityScore: ${c.dataQualityScore || 'N/A'}`, 'info');
        this.log(`     - dataSources: ${c.dataSources.join(', ') || 'N/A'}`, 'info');
      });
    }

    if (this.results.people.sampleRecords.length > 0) {
      this.log('', 'info');
      this.log('SAMPLE PEOPLE WITH INTELLIGENCE:', 'info');
      this.results.people.sampleRecords.forEach((p, idx) => {
        this.log(`  ${idx + 1}. ${p.fullName}`, 'info');
        this.log(`     - aiIntelligence: ${p.hasAIIntelligence ? 'YES' : 'NO'}`, 'info');
        this.log(`     - dataQualityScore: ${p.dataQualityScore || 'N/A'}`, 'info');
        this.log(`     - enrichmentScore: ${p.enrichmentScore || 'N/A'}`, 'info');
        this.log(`     - buyerGroupRole: ${p.buyerGroupRole || 'N/A'}`, 'info');
        this.log(`     - decisionPower: ${p.decisionPower || 'N/A'}`, 'info');
        this.log(`     - dataSources: ${p.dataSources.join(', ') || 'N/A'}`, 'info');
      });
    }

    this.log('', 'info');
    this.log('='.repeat(70), 'info');
    this.log('Audit complete', 'success');
  }
}

// Main execution
async function main() {
  const audit = new TopTempDataAudit();
  
  try {
    await audit.execute();
    process.exit(0);
  } catch (error) {
    console.error('Audit failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = TopTempDataAudit;

