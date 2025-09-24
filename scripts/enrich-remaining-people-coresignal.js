#!/usr/bin/env node

/**
 * Enrich remaining people with CoreSignal data to achieve 100% coverage
 */

const { PrismaClient } = require('@prisma/client');

class EnrichRemainingPeopleCoreSignal {
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
      errors: [],
      creditsUsed: this.creditsUsed
    };
  }

  async execute() {
    console.log('🎯 ENRICHING REMAINING PEOPLE WITH CORESIGNAL');
    console.log('===============================================');
    console.log('');

    try {
      // Step 1: Get people without CoreSignal enrichment
      await this.getPeopleNeedingEnrichment();
      
      // Step 2: Process people in batches
      await this.processPeopleInBatches();
      
      // Step 3: Generate final report
      await this.generateFinalReport();

    } catch (error) {
      console.error('❌ Enrichment failed:', error);
      this.results.errors.push(error.message);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async getPeopleNeedingEnrichment() {
    console.log('📋 STEP 1: Finding people without CoreSignal enrichment...');
    
    // Get people without CoreSignal data
    this.peopleToEnrich = await this.prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        customFields: {
          path: ['coresignalId'],
          equals: null
        }
      },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        email: true,
        company: {
          select: {
            name: true,
            website: true
          }
        }
      },
      orderBy: { fullName: 'asc' }
    });

    console.log(`   📊 Found ${this.peopleToEnrich.length} people needing CoreSignal enrichment`);
    console.log('');
  }

  async processPeopleInBatches() {
    console.log('🔄 STEP 2: Processing people in batches...');
    console.log('');

    const batchSize = 50;
    const totalBatches = Math.ceil(this.peopleToEnrich.length / batchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, this.peopleToEnrich.length);
      const batch = this.peopleToEnrich.slice(startIndex, endIndex);

      console.log(`📦 Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} people)...`);

      for (const person of batch) {
        try {
          await this.enrichPersonWithCoreSignal(person);
          this.results.peopleProcessed++;
          
          // Rate limiting
          await this.delay(1000);
          
        } catch (error) {
          console.error(`   ❌ Failed to enrich ${person.fullName}:`, error.message);
          this.results.errors.push(`${person.fullName}: ${error.message}`);
        }
      }

      console.log(`   ✅ Batch ${batchIndex + 1} complete`);
      console.log(`   📊 Progress: ${this.results.peopleProcessed}/${this.peopleToEnrich.length} people processed`);
      console.log(`   💰 Credits used: ${JSON.stringify(this.creditsUsed)}`);
      console.log('');
    }
  }

  async enrichPersonWithCoreSignal(person) {
    try {
      console.log(`   🔍 Enriching: ${person.fullName} at ${person.company?.name || 'Unknown Company'}`);
      
      // Search for person using company context
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
                              { match: { 'experience.company_name': person.company?.name || '' } },
                              { match_phrase: { 'experience.company_name': person.company?.name || '' } }
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

      const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=10', {
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
        this.results.peopleSkipped++;
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

      // Update person with CoreSignal data
      await this.updatePersonWithCoreSignalData(person, employeeId, profileData);
      
      console.log(`   ✅ Enriched: ${person.fullName} (CoreSignal ID: ${employeeId})`);
      this.results.peopleEnriched++;

    } catch (error) {
      console.error(`   ❌ Failed to enrich ${person.fullName}:`, error.message);
      throw error;
    }
  }

  async updatePersonWithCoreSignalData(person, coresignalId, profileData) {
    const updateData = {
      customFields: {
        coresignalId: coresignalId,
        coresignalData: profileData,
        lastEnriched: new Date().toISOString(),
        enrichmentSource: 'CoreSignal',
        rawData: profileData
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
    console.log(`   Success rate: ${((this.results.peopleEnriched / this.results.peopleProcessed) * 100).toFixed(1)}%`);
    console.log(`   Credits used: ${JSON.stringify(this.creditsUsed)}`);
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
    console.log(`   📈 Progress: ${this.results.peopleEnriched} people enriched`);
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute the enrichment
async function main() {
  const enricher = new EnrichRemainingPeopleCoreSignal();
  await enricher.execute();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = EnrichRemainingPeopleCoreSignal;
