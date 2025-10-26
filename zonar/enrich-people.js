#!/usr/bin/env node

/**
 * Zonar People Enrichment Script
 * 
 * This script checks if people in the Notary Everyday workspace are enriched
 * with Coresignal data and attempts to enrich unenriched people.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class ZonarPeopleEnrichment {
  constructor() {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday workspace
    this.batchSize = 10;
    this.delayBetweenBatches = 2000; // 2 seconds
    
    this.results = {
      totalPeople: 0,
      alreadyEnriched: 0,
      successfullyEnriched: 0,
      failedEnrichment: 0,
      creditsUsed: {
        search: 0,
        collect: 0
      }
    };

    if (!this.apiKey) {
      console.error('❌ CORESIGNAL_API_KEY environment variable is required');
      process.exit(1);
    }
  }

  async run() {
    try {
      console.log('🚀 Starting Zonar People Enrichment for Notary Everyday workspace...\n');
      
      // Get all people in Notary Everyday workspace
      const people = await this.getPeople();
      this.results.totalPeople = people.length;
      
      console.log(`📊 Found ${people.length} people in Notary Everyday workspace`);
      
      if (people.length === 0) {
        console.log('❌ No people found to process');
        return;
      }

      // Process people in batches
      await this.processPeopleInBatches(people);
      
      // Print final results
      this.printResults();
      
    } catch (error) {
      console.error('❌ Error in people enrichment:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async getPeople() {
    return await this.prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            linkedinUrl: true,
            website: true,
            domain: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
  }

  async processPeopleInBatches(people) {
    const totalBatches = Math.ceil(people.length / this.batchSize);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * this.batchSize;
      const endIndex = Math.min(startIndex + this.batchSize, people.length);
      const batch = people.slice(startIndex, endIndex);
      
      console.log(`\n📦 Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} people)`);
      
      for (const person of batch) {
        try {
          await this.processPerson(person);
        } catch (error) {
          console.error(`   ❌ Error processing ${person.fullName}:`, error.message);
          this.results.failedEnrichment++;
        }
      }
      
      // Delay between batches to respect rate limits
      if (batchIndex < totalBatches - 1) {
        console.log(`   ⏳ Waiting ${this.delayBetweenBatches}ms before next batch...`);
        await this.delay(this.delayBetweenBatches);
      }
    }
  }

  async processPerson(person) {
    console.log(`   🔍 Processing: ${person.fullName} at ${person.company?.name || 'Unknown Company'}`);
    
    // Check if person is already enriched
    if (this.isPersonEnriched(person)) {
      console.log(`   ✅ Already enriched: ${person.fullName}`);
      this.results.alreadyEnriched++;
      return;
    }
    
    // Attempt to enrich person
    await this.enrichPerson(person);
  }

  isPersonEnriched(person) {
    // Check if person has Coresignal data in customFields
    if (person.customFields && typeof person.customFields === 'object') {
      const customFields = person.customFields;
      if (customFields.coresignalId || customFields.coresignalData || customFields.lastEnrichedAt) {
        return true;
      }
    }
    
    // Check if person has enriched data in specific fields
    if (person.bio && person.bio.length > 100) {
      return true; // Likely enriched if bio is substantial
    }
    
    return false;
  }

  async enrichPerson(person) {
    try {
      // Build search query for Coresignal
      const searchQuery = this.buildSearchQuery(person);
      
      // Search for person in Coresignal
      const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=5', {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      this.results.creditsUsed.search++;

      if (!searchResponse.ok) {
        throw new Error(`Coresignal search failed: ${searchResponse.status} ${searchResponse.statusText}`);
      }

      const searchData = await searchResponse.json();
      const employeeIds = Array.isArray(searchData) ? searchData : [];

      if (employeeIds.length === 0) {
        console.log(`   ⚠️ No Coresignal data found for ${person.fullName}`);
        this.results.failedEnrichment++;
        return;
      }

      // Get the first matching profile
      const employeeId = employeeIds[0];
      const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${employeeId}`, {
        headers: { 
          'apikey': this.apiKey,
          'Accept': 'application/json'
        }
      });

      this.results.creditsUsed.collect++;

      if (!collectResponse.ok) {
        throw new Error(`Coresignal collect failed: ${collectResponse.status} ${collectResponse.statusText}`);
      }

      const profileData = await collectResponse.json();

      // Update person with Coresignal data
      await this.updatePersonWithCoresignalData(person, employeeId, profileData);
      
      console.log(`   ✅ Enriched: ${person.fullName} (Coresignal ID: ${employeeId})`);
      this.results.successfullyEnriched++;

    } catch (error) {
      console.error(`   ❌ Failed to enrich ${person.fullName}:`, error.message);
      this.results.failedEnrichment++;
    }
  }

  buildSearchQuery(person) {
    const query = {
      query: {
        bool: {
          must: []
        }
      }
    };

    // Add company experience filter if company has LinkedIn URL
    if (person.company?.linkedinUrl) {
      query.query.bool.must.push({
        nested: {
          path: 'experience',
          query: {
            bool: {
              must: [
                {
                  match: {
                    'experience.company_linkedin_url': person.company.linkedinUrl
                  }
                },
                {
                  term: {
                    'experience.active_experience': 1
                  }
                }
              ]
            }
          }
        }
      });
    }

    // Add person name matching
    query.query.bool.must.push({
      bool: {
        should: [
          { match: { 'full_name': person.fullName } },
          { match_phrase: { 'full_name': person.fullName } },
          { match: { 'member_full_name': person.fullName } },
          { match_phrase: { 'member_full_name': person.fullName } }
        ]
      }
    });

    return query;
  }

  async updatePersonWithCoresignalData(person, coresignalId, profileData) {
    const enrichedData = {
      coresignalId: coresignalId,
      coresignalData: profileData,
      lastEnrichedAt: new Date().toISOString(),
      enrichmentSource: 'coresignal'
    };

    await this.prisma.people.update({
      where: { id: person.id },
      data: {
        customFields: {
          ...(person.customFields || {}),
          ...enrichedData
        },
        // Update bio if available in Coresignal data
        bio: profileData.summary || person.bio,
        // Update LinkedIn URL if more complete
        linkedinUrl: profileData.linkedin_url || person.linkedinUrl,
        updatedAt: new Date()
      }
    });
  }

  printResults() {
    console.log('\n📊 Zonar People Enrichment Results:');
    console.log('=====================================');
    console.log(`Total People: ${this.results.totalPeople}`);
    console.log(`Already Enriched: ${this.results.alreadyEnriched}`);
    console.log(`Successfully Enriched: ${this.results.successfullyEnriched}`);
    console.log(`Failed Enrichment: ${this.results.failedEnrichment}`);
    console.log(`Credits Used - Search: ${this.results.creditsUsed.search}`);
    console.log(`Credits Used - Collect: ${this.results.creditsUsed.collect}`);
    console.log(`Total Credits Used: ${this.results.creditsUsed.search + this.results.creditsUsed.collect}`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the script
const enrichment = new ZonarPeopleEnrichment();
enrichment.run().catch(console.error);
