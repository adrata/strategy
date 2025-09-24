/**
 * 📊 COMPREHENSIVE ENRICHMENT STATUS CHECK
 * 
 * Checks the current enrichment status for both people and companies
 * Shows CoreSignal coverage, Perplexity AI coverage, and missing data
 */

const { PrismaClient } = require('@prisma/client');

// Configuration
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

class EnrichmentStatusChecker {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async checkAllEnrichmentStatus() {
    console.log('📊 [ENRICHMENT STATUS] Checking comprehensive enrichment status...\n');
    
    try {
      // Check people enrichment status
      await this.checkPeopleEnrichmentStatus();
      
      console.log('\n' + '='.repeat(60) + '\n');
      
      // Check companies enrichment status
      await this.checkCompaniesEnrichmentStatus();
      
      console.log('\n🎯 [ENRICHMENT STATUS] Summary completed!');
      
    } catch (error) {
      console.error('❌ [ENRICHMENT STATUS] Error:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async checkPeopleEnrichmentStatus() {
    console.log('👥 [PEOPLE ENRICHMENT] Checking people enrichment status...');
    
    // Get total people count
    const totalPeople = await this.prisma.people.count({
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null }
    });
    
    // Check CoreSignal coverage
    const peopleWithCoreSignal = await this.prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        customFields: {
          path: ['coresignalId'],
          not: null
        }
      }
    });
    
    // Check Perplexity AI coverage
    const peopleWithPerplexity = await this.prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        customFields: {
          path: ['situationAnalysis'],
          not: null
        }
      }
    });
    
    // Check buyer group roles
    const peopleWithBuyerGroup = await this.prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        OR: [
          { customFields: { path: ['buyerGroupRole'], not: null } },
          { tags: { hasSome: ['Buyer Group Member', 'Decision Maker', 'Champion', 'Influencer', 'Stakeholder', 'Buyer Group'] } }
        ]
      }
    });
    
    // Check specific enrichment fields
    const peopleWithSituationAnalysis = await this.prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        customFields: { path: ['situationAnalysis'], not: null }
      }
    });
    
    const peopleWithComplications = await this.prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        customFields: { path: ['complications'], not: null }
      }
    });
    
    const peopleWithStrategicIntelligence = await this.prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        customFields: { path: ['strategicIntelligence'], not: null }
      }
    });
    
    // Calculate percentages
    const coreSignalPercentage = ((peopleWithCoreSignal / totalPeople) * 100).toFixed(1);
    const perplexityPercentage = ((peopleWithPerplexity / totalPeople) * 100).toFixed(1);
    const buyerGroupPercentage = ((peopleWithBuyerGroup / totalPeople) * 100).toFixed(1);
    
    console.log(`📊 Total People: ${totalPeople.toLocaleString()}`);
    console.log(`🔍 CoreSignal Coverage: ${peopleWithCoreSignal.toLocaleString()} (${coreSignalPercentage}%)`);
    console.log(`🧠 Perplexity AI Coverage: ${peopleWithPerplexity.toLocaleString()} (${perplexityPercentage}%)`);
    console.log(`👥 Buyer Group Roles: ${peopleWithBuyerGroup.toLocaleString()} (${buyerGroupPercentage}%)`);
    console.log(`📈 Strategic Intelligence Breakdown:`);
    console.log(`   - Situation Analysis: ${peopleWithSituationAnalysis.toLocaleString()}`);
    console.log(`   - Complications: ${peopleWithComplications.toLocaleString()}`);
    console.log(`   - Strategic Intelligence: ${peopleWithStrategicIntelligence.toLocaleString()}`);
    
    // Show sample enriched people
    const sampleEnrichedPeople = await this.prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        customFields: {
          path: ['situationAnalysis'],
          not: null
        }
      },
      select: {
        fullName: true,
        jobTitle: true,
        customFields: true
      },
      take: 5
    });
    
    if (sampleEnrichedPeople.length > 0) {
      console.log(`\n📋 Sample Enriched People:`);
      sampleEnrichedPeople.forEach((person, index) => {
        const customFields = person.customFields || {};
        console.log(`   ${index + 1}. ${person.fullName} (${person.jobTitle})`);
        console.log(`      - Situation Analysis: ${customFields.situationAnalysis ? '✅' : '❌'}`);
        console.log(`      - Complications: ${customFields.complications ? '✅' : '❌'}`);
        console.log(`      - Strategic Intelligence: ${customFields.strategicIntelligence ? '✅' : '❌'}`);
        console.log(`      - Buyer Group Role: ${customFields.buyerGroupRole || 'Not assigned'}`);
      });
    }
  }

  async checkCompaniesEnrichmentStatus() {
    console.log('🏢 [COMPANY ENRICHMENT] Checking company enrichment status...');
    
    // Get total companies count
    const totalCompanies = await this.prisma.companies.count({
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null }
    });
    
    // Check CoreSignal coverage
    const companiesWithCoreSignal = await this.prisma.companies.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        customFields: {
          path: ['coresignalId'],
          not: null
        }
      }
    });
    
    // Check Perplexity AI coverage
    const companiesWithPerplexity = await this.prisma.companies.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        customFields: {
          path: ['situationAnalysis'],
          not: null
        }
      }
    });
    
    // Check specific enrichment fields
    const companiesWithSituationAnalysis = await this.prisma.companies.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        customFields: { path: ['situationAnalysis'], not: null }
      }
    });
    
    const companiesWithComplications = await this.prisma.companies.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        customFields: { path: ['complications'], not: null }
      }
    });
    
    const companiesWithStrategicIntelligence = await this.prisma.companies.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        customFields: { path: ['strategicIntelligence'], not: null }
      }
    });
    
    // Calculate percentages
    const coreSignalPercentage = ((companiesWithCoreSignal / totalCompanies) * 100).toFixed(1);
    const perplexityPercentage = ((companiesWithPerplexity / totalCompanies) * 100).toFixed(1);
    
    console.log(`📊 Total Companies: ${totalCompanies.toLocaleString()}`);
    console.log(`🔍 CoreSignal Coverage: ${companiesWithCoreSignal.toLocaleString()} (${coreSignalPercentage}%)`);
    console.log(`🧠 Perplexity AI Coverage: ${companiesWithPerplexity.toLocaleString()} (${perplexityPercentage}%)`);
    console.log(`📈 Strategic Intelligence Breakdown:`);
    console.log(`   - Situation Analysis: ${companiesWithSituationAnalysis.toLocaleString()}`);
    console.log(`   - Complications: ${companiesWithComplications.toLocaleString()}`);
    console.log(`   - Strategic Intelligence: ${companiesWithStrategicIntelligence.toLocaleString()}`);
    
    // Show sample enriched companies
    const sampleEnrichedCompanies = await this.prisma.companies.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        customFields: {
          path: ['situationAnalysis'],
          not: null
        }
      },
      select: {
        name: true,
        industry: true,
        customFields: true
      },
      take: 5
    });
    
    if (sampleEnrichedCompanies.length > 0) {
      console.log(`\n📋 Sample Enriched Companies:`);
      sampleEnrichedCompanies.forEach((company, index) => {
        const customFields = company.customFields || {};
        console.log(`   ${index + 1}. ${company.name} (${company.industry})`);
        console.log(`      - Situation Analysis: ${customFields.situationAnalysis ? '✅' : '❌'}`);
        console.log(`      - Complications: ${customFields.complications ? '✅' : '❌'}`);
        console.log(`      - Strategic Intelligence: ${customFields.strategicIntelligence ? '✅' : '❌'}`);
        console.log(`      - Market Position: ${customFields.marketPosition ? '✅' : '❌'}`);
      });
    }
  }
}

// Run the status check
async function main() {
  const statusChecker = new EnrichmentStatusChecker();
  await statusChecker.checkAllEnrichmentStatus();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { EnrichmentStatusChecker };
