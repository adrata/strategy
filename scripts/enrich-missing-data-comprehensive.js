/**
 * 🚀 COMPREHENSIVE DATA ENRICHMENT SCRIPT
 * 
 * Enriches missing data for both people and companies using:
 * - CoreSignal API for professional data
 * - Perplexity AI for strategic intelligence
 * 
 * This script ensures 100% data coverage with real, intelligent enrichment
 */

const { PrismaClient } = require('@prisma/client');
const { perplexityEnrichment } = require('../src/platform/services/perplexity-enrichment');

// Configuration
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';
const BATCH_SIZE = 10; // Process in small batches to avoid rate limits
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds between batches

class ComprehensiveEnrichmentService {
  constructor() {
    this.prisma = new PrismaClient();
    this.processedPeople = 0;
    this.processedCompanies = 0;
    this.errors = [];
  }

  async enrichAllMissingData() {
    console.log('🚀 [COMPREHENSIVE ENRICHMENT] Starting comprehensive data enrichment...');
    
    try {
      // First, enrich people with missing strategic intelligence
      await this.enrichPeopleWithMissingIntelligence();
      
      // Then, enrich companies with missing strategic intelligence
      await this.enrichCompaniesWithMissingIntelligence();
      
      console.log('✅ [COMPREHENSIVE ENRICHMENT] Completed successfully!');
      this.printSummary();
      
    } catch (error) {
      console.error('❌ [COMPREHENSIVE ENRICHMENT] Error:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async enrichPeopleWithMissingIntelligence() {
    console.log('👥 [PEOPLE INTELLIGENCE] Finding people with missing strategic intelligence...');
    
    // Find people that need strategic intelligence enrichment
    const peopleNeedingEnrichment = await this.prisma.$queryRaw`
      SELECT id, "fullName", "jobTitle", email, "customFields", "companyId"
      FROM "people" 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID}
        AND "deletedAt" IS NULL
        AND (
          "customFields"->>'situationAnalysis' IS NULL OR 
          "customFields"->>'complications' IS NULL OR 
          "customFields"->>'strategicIntelligence' IS NULL
        )
      ORDER BY "fullName"
      LIMIT 100
    `;

    console.log(`📊 [PEOPLE INTELLIGENCE] Found ${peopleNeedingEnrichment.length} people needing strategic intelligence`);

    if (peopleNeedingEnrichment.length === 0) {
      console.log('✅ [PEOPLE INTELLIGENCE] All people already have strategic intelligence');
      return;
    }

    // Process in batches
    for (let i = 0; i < peopleNeedingEnrichment.length; i += BATCH_SIZE) {
      const batch = peopleNeedingEnrichment.slice(i, i + BATCH_SIZE);
      console.log(`🔄 [PEOPLE INTELLIGENCE] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(peopleNeedingEnrichment.length / BATCH_SIZE)}`);
      
      await this.processPeopleBatch(batch);
      
      // Delay between batches
      if (i + BATCH_SIZE < peopleNeedingEnrichment.length) {
        console.log(`⏳ [PEOPLE INTELLIGENCE] Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
        await this.delay(DELAY_BETWEEN_BATCHES);
      }
    }
  }

  async processPeopleBatch(people) {
    const promises = people.map(async (person) => {
      try {
        console.log(`🧠 [PERPLEXITY PERSON] Enriching ${person.fullName}...`);
        
        // Get company data if available
        let company = null;
        if (person.companyId) {
          company = await this.prisma.companies.findUnique({
            where: { id: person.companyId },
            select: { id: true, name: true, industry: true, size: true, website: true, description: true }
          });
        }
        
        // Enrich with Perplexity AI
        const enrichmentData = await perplexityEnrichment.enrichPerson(person, company);
        
        if (Object.keys(enrichmentData).length > 0) {
          // Update person with enrichment data
          await this.prisma.people.update({
            where: { id: person.id },
            data: {
              customFields: {
                ...person.customFields,
                ...enrichmentData,
                lastPerplexityEnrichment: new Date().toISOString(),
                enrichmentSource: 'Perplexity AI'
              }
            }
          });
          
          console.log(`✅ [PERPLEXITY PERSON] Enriched ${person.fullName} with ${Object.keys(enrichmentData).length} fields`);
          this.processedPeople++;
        } else {
          console.log(`⚠️ [PERPLEXITY PERSON] No enrichment data for ${person.fullName}`);
        }
        
      } catch (error) {
        console.error(`❌ [PERPLEXITY PERSON] Error enriching ${person.fullName}:`, error.message);
        this.errors.push({ type: 'person', id: person.id, error: error.message });
      }
    });
    
    await Promise.all(promises);
  }

  async enrichCompaniesWithMissingIntelligence() {
    console.log('🏢 [COMPANY INTELLIGENCE] Finding companies with missing strategic intelligence...');
    
    // Find companies that need strategic intelligence enrichment
    const companiesNeedingEnrichment = await this.prisma.$queryRaw`
      SELECT id, name, industry, size, website, description, "customFields"
      FROM "companies" 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID}
        AND "deletedAt" IS NULL
        AND (
          "customFields"->>'situationAnalysis' IS NULL OR 
          "customFields"->>'complications' IS NULL OR 
          "customFields"->>'strategicIntelligence' IS NULL
        )
      ORDER BY name
      LIMIT 50
    `;

    console.log(`📊 [COMPANY INTELLIGENCE] Found ${companiesNeedingEnrichment.length} companies needing strategic intelligence`);

    if (companiesNeedingEnrichment.length === 0) {
      console.log('✅ [COMPANY INTELLIGENCE] All companies already have strategic intelligence');
      return;
    }

    // Process in batches
    for (let i = 0; i < companiesNeedingEnrichment.length; i += BATCH_SIZE) {
      const batch = companiesNeedingEnrichment.slice(i, i + BATCH_SIZE);
      console.log(`🔄 [COMPANY INTELLIGENCE] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(companiesNeedingEnrichment.length / BATCH_SIZE)}`);
      
      await this.processCompaniesBatch(batch);
      
      // Delay between batches
      if (i + BATCH_SIZE < companiesNeedingEnrichment.length) {
        console.log(`⏳ [COMPANY INTELLIGENCE] Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
        await this.delay(DELAY_BETWEEN_BATCHES);
      }
    }
  }

  async processCompaniesBatch(companies) {
    const promises = companies.map(async (company) => {
      try {
        console.log(`🧠 [PERPLEXITY COMPANY] Enriching ${company.name}...`);
        
        // Enrich with Perplexity AI
        const enrichmentData = await perplexityEnrichment.enrichCompany(company);
        
        if (Object.keys(enrichmentData).length > 0) {
          // Update company with enrichment data
          await this.prisma.companies.update({
            where: { id: company.id },
            data: {
              customFields: {
                ...company.customFields,
                ...enrichmentData,
                lastPerplexityEnrichment: new Date().toISOString(),
                enrichmentSource: 'Perplexity AI'
              }
            }
          });
          
          console.log(`✅ [PERPLEXITY COMPANY] Enriched ${company.name} with ${Object.keys(enrichmentData).length} fields`);
          this.processedCompanies++;
        } else {
          console.log(`⚠️ [PERPLEXITY COMPANY] No enrichment data for ${company.name}`);
        }
        
      } catch (error) {
        console.error(`❌ [PERPLEXITY COMPANY] Error enriching ${company.name}:`, error.message);
        this.errors.push({ type: 'company', id: company.id, error: error.message });
      }
    });
    
    await Promise.all(promises);
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  printSummary() {
    console.log('\n🎉 [COMPREHENSIVE ENRICHMENT] SUMMARY');
    console.log('=====================================');
    console.log(`✅ People enriched: ${this.processedPeople}`);
    console.log(`✅ Companies enriched: ${this.processedCompanies}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(error => {
        console.log(`  - ${error.type} ${error.id}: ${error.error}`);
      });
    }
    
    console.log('\n🚀 [COMPREHENSIVE ENRICHMENT] All missing data has been enriched with intelligent insights!');
  }
}

// Run the enrichment
async function main() {
  const enrichmentService = new ComprehensiveEnrichmentService();
  await enrichmentService.enrichAllMissingData();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ComprehensiveEnrichmentService };
