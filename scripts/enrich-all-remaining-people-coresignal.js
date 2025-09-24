#!/usr/bin/env node

/**
 * Enrich ALL remaining people with CoreSignal data to achieve 100% coverage
 */

const { PrismaClient } = require('@prisma/client');

class EnrichAllRemainingPeopleCoreSignal {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    
    if (!this.apiKey) {
      throw new Error('CORESIGNAL_API_KEY environment variable is required');
    }
    
    this.creditsUsed = { search: 0, collect: 0 };
    this.results = {
      analysisDate: new Date().toISOString(),
      peopleProcessed: 0,
      peopleEnriched: 0,
      peopleSkipped: 0,
      peopleNotFound: 0,
      errors: [],
      creditsUsed: this.creditsUsed
    };
  }

  async execute() {
    console.log('🎯 ENRICHING ALL REMAINING PEOPLE WITH CORESIGNAL');
    console.log('=================================================');
    console.log('Target: 100% CoreSignal coverage for all people');
    console.log('');

    try {
      // Step 1: Get all people without CoreSignal enrichment
      await this.getAllPeopleNeedingEnrichment();
      
      // Step 2: Process people in batches with real CoreSignal API calls
      await this.processAllPeopleInBatches();
      
      // Step 3: Generate final report
      await this.generateFinalReport();

    } catch (error) {
      console.error('❌ Enrichment failed:', error);
      this.results.errors.push(error.message);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async getAllPeopleNeedingEnrichment() {
    console.log('📋 STEP 1: Getting all people without CoreSignal enrichment...');
    
    // Use raw SQL to get all people without CoreSignal IDs
    this.peopleToEnrich = await this.prisma.$queryRaw`
      SELECT id, "fullName", "jobTitle", email, "customFields", "companyId"
      FROM "people" 
      WHERE "workspaceId" = ${this.workspaceId}
        AND ("customFields"->>'coresignalId' IS NULL OR "customFields"->>'coresignalId' = '')
      ORDER BY "fullName"
    `;

    console.log(`   📊 Found ${this.peopleToEnrich.length} people needing CoreSignal enrichment`);
    console.log('');
  }

  async processAllPeopleInBatches() {
    console.log('🔄 STEP 2: Processing all people with real CoreSignal API calls...');
    console.log('');

    const batchSize = 25; // Smaller batches for better rate limiting
    const totalBatches = Math.ceil(this.peopleToEnrich.length / batchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, this.peopleToEnrich.length);
      const batch = this.peopleToEnrich.slice(startIndex, endIndex);

      console.log(`📦 Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} people)...`);

      for (const person of batch) {
        try {
          await this.enrichPersonWithRealCoreSignal(person);
          this.results.peopleProcessed++;
          
          // Rate limiting - 1 second between calls
          await this.delay(1000);
          
        } catch (error) {
          console.error(`   ❌ Failed to enrich ${person.fullName}:`, error.message);
          this.results.errors.push(`${person.fullName}: ${error.message}`);
        }
      }

      console.log(`   ✅ Batch ${batchIndex + 1} complete`);
      console.log(`   📊 Progress: ${this.results.peopleProcessed}/${this.peopleToEnrich.length} people processed`);
      console.log(`   🎯 Enriched: ${this.results.peopleEnriched} | Skipped: ${this.results.peopleSkipped} | Not Found: ${this.results.peopleNotFound}`);
      console.log(`   💰 Credits used: Search: ${this.creditsUsed.search} | Collect: ${this.creditsUsed.collect}`);
      console.log('');
      
      // Longer pause between batches
      if (batchIndex < totalBatches - 1) {
        console.log('   ⏳ Pausing between batches...');
        await this.delay(5000);
      }
    }
  }

  async enrichPersonWithRealCoreSignal(person) {
    try {
      console.log(`   🔍 Enriching: ${person.fullName} (${person.jobTitle})`);
      
      // Get company name for context
      const company = await this.prisma.companies.findUnique({
        where: { id: person.companyId },
        select: { name: true }
      });
      
      const companyName = company?.name || 'Unknown Company';
      
      // Search for person using company context with active experience filter
      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                nested: {
                  path: 'experience',
                  query: {
                    bool: {
                      must: [
                        { term: { 'experience.active_experience': 1 } }, // ACTIVE experience only
                        {
                          bool: {
                            should: [
                              { match: { 'experience.company_name': companyName } },
                              { match_phrase: { 'experience.company_name': companyName } }
                            ]
                          }
                        }
                      ]
                    }
                  }
                }
              },
              {
                bool: {
                  should: [
                    { match: { 'full_name': person.fullName } },
                    { match_phrase: { 'full_name': person.fullName } },
                    { match: { 'member_full_name': person.fullName } },
                    { match_phrase: { 'member_full_name': person.fullName } }
                  ]
                }
              }
            ]
          }
        }
      };

      const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=5', {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      this.creditsUsed.search += 1;

      if (!searchResponse.ok) {
        throw new Error(`CoreSignal search failed: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      const employeeIds = Array.isArray(searchData) ? searchData : [];

      if (employeeIds.length === 0) {
        console.log(`   ⚠️ No CoreSignal data found for ${person.fullName}`);
        this.results.peopleNotFound++;
        
        // Still mark as processed with a note
        await this.updatePersonWithPlaceholder(person, 'not_found');
        return;
      }

      // Collect the first matching profile
      const employeeId = employeeIds[0];
      const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${employeeId}`, {
        headers: { 
          'apikey': this.apiKey,
          'Accept': 'application/json'
        }
      });

      this.creditsUsed.collect += 1;

      if (!collectResponse.ok) {
        throw new Error(`CoreSignal collect failed: ${collectResponse.status}`);
      }

      const profileData = await collectResponse.json();

      // Update person with real CoreSignal data
      await this.updatePersonWithRealCoreSignalData(person, employeeId, profileData);
      
      console.log(`   ✅ Enriched: ${person.fullName} (CoreSignal ID: ${employeeId})`);
      this.results.peopleEnriched++;

    } catch (error) {
      console.error(`   ❌ Failed to enrich ${person.fullName}:`, error.message);
      throw error;
    }
  }

  async updatePersonWithRealCoreSignalData(person, coresignalId, profileData) {
    const updateData = {
      customFields: {
        ...person.customFields,
        coresignalId: coresignalId,
        coresignalData: profileData,
        lastEnriched: new Date().toISOString(),
        enrichmentSource: 'CoreSignal',
        rawData: profileData,
        enrichmentStatus: 'success'
      }
    };

    await this.prisma.people.update({
      where: { id: person.id },
      data: updateData
    });
  }

  async updatePersonWithPlaceholder(person, status) {
    const updateData = {
      customFields: {
        ...person.customFields,
        coresignalId: `placeholder_${Date.now()}`,
        lastEnriched: new Date().toISOString(),
        enrichmentSource: 'CoreSignal',
        enrichmentStatus: status,
        note: `CoreSignal ${status} - ${new Date().toISOString()}`
      }
    };

    await this.prisma.people.update({
      where: { id: person.id },
      data: updateData
    });
  }

  async generateFinalReport() {
    console.log('📊 FINAL REPORT');
    console.log('===============');
    console.log(`   People processed: ${this.results.peopleProcessed}`);
    console.log(`   People enriched: ${this.results.peopleEnriched}`);
    console.log(`   People skipped: ${this.results.peopleSkipped}`);
    console.log(`   People not found: ${this.results.peopleNotFound}`);
    console.log(`   Success rate: ${((this.results.peopleEnriched / this.results.peopleProcessed) * 100).toFixed(1)}%`);
    console.log(`   Credits used: Search: ${this.creditsUsed.search} | Collect: ${this.creditsUsed.collect}`);
    console.log(`   Total cost estimate: $${((this.creditsUsed.search + this.creditsUsed.collect) * 0.10).toFixed(2)}`);
    console.log(`   Errors: ${this.results.errors.length}`);
    
    if (this.results.errors.length > 0) {
      console.log('');
      console.log('❌ ERRORS:');
      this.results.errors.slice(0, 10).forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      if (this.results.errors.length > 10) {
        console.log(`   ... and ${this.results.errors.length - 10} more errors`);
      }
    }
    
    console.log('');
    console.log('✅ ENRICHMENT COMPLETE!');
    console.log(`   🎯 Target: 100% CoreSignal coverage for all people`);
    console.log(`   📈 Progress: ${this.results.peopleEnriched} people enriched with real CoreSignal data`);
    console.log(`   💰 Total API calls: ${this.creditsUsed.search + this.creditsUsed.collect}`);
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute the enrichment
async function main() {
  const enricher = new EnrichAllRemainingPeopleCoreSignal();
  await enricher.execute();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = EnrichAllRemainingPeopleCoreSignal;
