#!/usr/bin/env node

/**
 * Find Person - Coresignal Person Enrichment Script
 * 
 * This script enriches people in the Notary Everyday workspace
 * using the Coresignal API with email and LinkedIn direct matching.
 * 
 * Features:
 * - Direct email matching
 * - LinkedIn URL matching
 * - Company-based person search
 * - Progress saving and resumability
 * - Confidence-based matching
 * - Real-time progress tracking
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class PersonEnrichment {
  constructor() {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday workspace
    this.batchSize = 5; // Smaller batches for better reliability
    this.delayBetweenBatches = 3000; // 3 seconds delay
    this.delayBetweenRequests = 1000; // 1 second between individual requests
    this.progressFile = '_future_now/person-enrichment-progress.json';
    
    this.results = {
      totalPeople: 0,
      withEmail: 0,
      withLinkedIn: 0,
      alreadyEnriched: 0,
      successfullyEnriched: 0,
      failedEnrichment: 0,
      creditsUsed: {
        search: 0,
        collect: 0
      },
      errors: [],
      processedPeople: [],
      startTime: new Date().toISOString()
    };

    if (!this.apiKey) {
      console.error('❌ CORESIGNAL_API_KEY environment variable is required');
      process.exit(1);
    }
  }

  async run() {
    try {
      console.log('🚀 Starting Person Enrichment for Notary Everyday...\n');
      console.log('ℹ️  Using direct email and LinkedIn matching strategies\n');
      
      // Load previous progress
      const processedPersonIds = await this.loadProgress();
      console.log(`📋 Loaded progress: ${processedPersonIds.length} people previously processed\n`);
      
      // Get all people in Notary Everyday workspace
      const people = await this.getPeople();
      this.results.totalPeople = people.length;
      
      console.log(`📊 Found ${people.length} people in Notary Everyday workspace`);
      
      if (people.length === 0) {
        console.log('❌ No people found to process');
        return;
      }

      // Categorize people
      const withEmail = people.filter(p => p.email && p.email.trim() !== '');
      const withLinkedIn = people.filter(p => p.linkedinUrl && p.linkedinUrl.trim() !== '');
      const alreadyEnriched = people.filter(p => this.isPersonEnriched(p));
      
      // Filter out already processed people
      const processedIds = new Set(processedPersonIds.map(p => p.id));
      const needsEnrichment = people.filter(p => 
        !this.isPersonEnriched(p) && !processedIds.has(p.id) && 
        (p.email || p.linkedinUrl)
      );

      this.results.withEmail = withEmail.length;
      this.results.withLinkedIn = withLinkedIn.length;
      this.results.alreadyEnriched = alreadyEnriched.length;

      console.log(`📧 People with email: ${withEmail.length}`);
      console.log(`🔗 People with LinkedIn: ${withLinkedIn.length}`);
      console.log(`✅ Already enriched: ${alreadyEnriched.length}`);
      console.log(`🔄 Previously processed: ${processedPersonIds.length}`);
      console.log(`🔄 Need enrichment: ${needsEnrichment.length}\n`);

      if (needsEnrichment.length === 0) {
        console.log('✅ All people with contact info are already enriched or processed!');
        return;
      }

      // Process people in batches
      await this.processPeopleInBatches(needsEnrichment);
      
      // Save final progress
      await this.saveProgress();
      
      // Print final results
      this.printResults();
      
    } catch (error) {
      console.error('❌ Error in person enrichment:', error);
      // Save progress even on error
      await this.saveProgress();
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
      orderBy: {
        createdAt: 'asc'
      }
    });
  }

  async processPeopleInBatches(people) {
    const totalBatches = Math.ceil(people.length / this.batchSize);
    let processedCount = 0;
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * this.batchSize;
      const endIndex = Math.min(startIndex + this.batchSize, people.length);
      const batch = people.slice(startIndex, endIndex);
      
      console.log(`\n📦 Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} people)`);
      console.log(`📊 Overall Progress: ${processedCount}/${people.length} people processed`);
      
      for (const person of batch) {
        try {
          const result = await this.processPerson(person);
          processedCount++;
          
          // Track processed person
          this.results.processedPeople.push({
            id: person.id,
            name: person.name,
            email: person.email,
            linkedinUrl: person.linkedinUrl,
            result: result,
            processedAt: new Date().toISOString()
          });
          
          // Save progress every 5 people
          if (processedCount % 5 === 0) {
            await this.saveProgress();
          }
          
          // Log progress every 10 people
          if (processedCount % 10 === 0) {
            console.log(`\n📈 Progress Update:`);
            console.log(`   ✅ Successfully Enriched: ${this.results.successfullyEnriched}`);
            console.log(`   ❌ Failed: ${this.results.failedEnrichment}`);
            console.log(`   🔄 Processed: ${processedCount}/${people.length}`);
            console.log(`   💳 Credits Used: ${this.results.creditsUsed.search + this.results.creditsUsed.collect}`);
            console.log(`   💾 Progress saved to ${this.progressFile}`);
          }
          
          // Delay between individual requests
          if (batchIndex < totalBatches - 1 || person !== batch[batch.length - 1]) {
            await this.delay(this.delayBetweenRequests);
          }
        } catch (error) {
          console.error(`   ❌ Error processing ${person.name}:`, error.message);
          this.results.failedEnrichment++;
          this.results.errors.push({
            person: person.name,
            error: error.message
          });
          processedCount++;
          
          // Track failed person
          this.results.processedPeople.push({
            id: person.id,
            name: person.name,
            email: person.email,
            linkedinUrl: person.linkedinUrl,
            result: { status: 'error', error: error.message },
            processedAt: new Date().toISOString()
          });
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
    console.log(`   🔍 Processing: ${person.name}`);
    console.log(`   📧 Email: ${person.email || 'N/A'}`);
    console.log(`   🔗 LinkedIn: ${person.linkedinUrl || 'N/A'}`);
    
    // Check if person is already enriched
    if (this.isPersonEnriched(person)) {
      console.log(`   ✅ Already enriched: ${person.name}`);
      this.results.alreadyEnriched++;
      return { status: 'already_enriched', person: person.name };
    }
    
    // Attempt to enrich person
    const result = await this.enrichPerson(person);
    return result;
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
    if (person.titleEnriched && person.titleEnriched.length > 10) {
      return true; // Likely enriched if title is substantial
    }
    
    return false;
  }

  async enrichPerson(person) {
    try {
      // Try multiple search approaches in order of preference
      const searchApproaches = [
        {
          name: 'email_direct',
          query: this.buildEmailQuery(person.email),
          condition: person.email
        },
        {
          name: 'linkedin_direct',
          query: this.buildLinkedInQuery(person.linkedinUrl),
          condition: person.linkedinUrl
        },
        {
          name: 'company_experience',
          query: this.buildCompanyExperienceQuery(person),
          condition: person.companyId
        }
      ];

      let searchData = null;
      let usedApproach = null;

      // Try each approach until we find results
      for (const approach of searchApproaches) {
        if (!approach.condition) {
          console.log(`   ⚠️ Skipping ${approach.name} - no required data`);
          continue;
        }

        console.log(`   🔍 Trying ${approach.name}...`);
        
        const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/person_multi_source/search/es_dsl?items_per_page=1', {
          method: 'POST',
          headers: {
            'apikey': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(approach.query)
        });

        this.results.creditsUsed.search++;

        if (!searchResponse.ok) {
          console.log(`   ⚠️ ${approach.name} search failed: ${searchResponse.status} ${searchResponse.statusText}`);
          continue;
        }

        const data = await searchResponse.json();
        
        if (Array.isArray(data) && data.length > 0) {
          searchData = data;
          usedApproach = approach.name;
          console.log(`   ✅ Found ${data.length} results using ${approach.name}`);
          break;
        } else {
          console.log(`   ⚠️ No results with ${approach.name}`);
        }
      }

      if (!searchData || searchData.length === 0) {
        console.log(`   ⚠️ No Coresignal data found for ${person.name} with any search approach`);
        this.results.failedEnrichment++;
        return { status: 'not_found', person: person.name };
      }

      const coresignalPersonId = searchData[0];
      console.log(`   ✅ Found Coresignal ID: ${coresignalPersonId} (using ${usedApproach})`);

      // Collect full profile
      const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/person_multi_source/collect/${coresignalPersonId}`, {
        method: 'GET',
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
      
      // Verify this is the right person
      const matchResult = this.calculatePersonMatchConfidence(person, profileData);
      
      console.log(`   🔍 Match confidence: ${matchResult.confidence}%`);
      
      if (matchResult.confidence >= 90) {
        await this.updatePersonWithCoresignalData(person, coresignalPersonId, profileData, matchResult);
        console.log(`   ✅ Successfully enriched: ${person.name}`);
        this.results.successfullyEnriched++;
        return { status: 'success', person: person.name, coresignalId: coresignalPersonId, confidence: matchResult.confidence };
      } else {
        console.log(`   ⚠️ Low confidence match (${matchResult.confidence}%): ${person.name}`);
        this.results.failedEnrichment++;
        return { status: 'low_confidence', person: person.name, confidence: matchResult.confidence };
      }

    } catch (error) {
      console.log(`   ❌ Failed to enrich ${person.name}: ${error.message}`);
      this.results.failedEnrichment++;
      this.results.errors.push({
        person: person.name,
        error: error.message
      });
      return { status: 'error', person: person.name, error: error.message };
    }
  }

  buildEmailQuery(email) {
    return {
      "query": {
        "term": {
          "email": email.toLowerCase().trim()
        }
      }
    };
  }

  buildLinkedInQuery(linkedinUrl) {
    return {
      "query": {
        "term": {
          "linkedin_url": linkedinUrl.trim()
        }
      }
    };
  }

  buildCompanyExperienceQuery(person) {
    // This would need the company's LinkedIn URL from the database
    // For now, return a basic query structure
    return {
      "query": {
        "bool": {
          "must": [
            {
              "nested": {
                "path": "experience",
                "query": {
                  "bool": {
                    "must": [
                      {
                        "term": {
                          "experience.active_experience": 1
                        }
                      }
                    ]
                  }
                }
              }
            }
          ]
        }
      }
    };
  }

  async updatePersonWithCoresignalData(person, coresignalId, profileData, matchResult) {
    const enrichedData = {
      coresignalId: coresignalId,
      coresignalData: profileData,
      lastEnrichedAt: new Date().toISOString(),
      enrichmentSource: 'coresignal',
      matchConfidence: matchResult.confidence,
      matchFactors: matchResult.factors,
      matchReasoning: matchResult.reasoning
    };

    // Calculate data quality score
    const qualityScore = this.calculateDataQualityScore(person, profileData);

    await this.prisma.people.update({
      where: { id: person.id },
      data: {
        customFields: {
          ...(person.customFields || {}),
          ...enrichedData
        },
        // Update enriched title if available
        titleEnriched: profileData.title || person.titleEnriched,
        // Update LinkedIn URL if more complete
        linkedinUrl: profileData.linkedin_url || person.linkedinUrl,
        // Update email if more complete
        email: profileData.email || person.email,
        // Update location if available
        location: profileData.location || person.location,
        // Update quality metrics
        dataQualityScore: qualityScore,
        enrichmentSources: ['coresignal'],
        enrichmentVersion: '2.0',
        lastEnriched: new Date(),
        updatedAt: new Date()
      }
    });
  }

  calculateDataQualityScore(person, profileData) {
    let score = 0;
    let maxScore = 0;

    // Core fields (40 points)
    maxScore += 40;
    if (person.name) score += 10;
    if (person.email || profileData.email) score += 10;
    if (person.linkedinUrl || profileData.linkedin_url) score += 10;
    if (person.title || profileData.title) score += 10;

    // Coresignal data (40 points)
    maxScore += 40;
    if (profileData.title) score += 10;
    if (profileData.location) score += 10;
    if (profileData.experience && profileData.experience.length > 0) score += 10;
    if (profileData.education && profileData.education.length > 0) score += 10;

    // Professional data (20 points)
    maxScore += 20;
    if (profileData.skills && profileData.skills.length > 0) score += 10;
    if (profileData.summary) score += 10;

    return Math.round((score / maxScore) * 100);
  }

  calculatePersonMatchConfidence(person, coresignalProfile) {
    let score = 0;
    let factors = [];
    
    // Email match (50 points)
    if (person.email && coresignalProfile.email) {
      const emailMatch = person.email.toLowerCase().trim() === coresignalProfile.email.toLowerCase().trim();
      score += emailMatch ? 50 : 0;
      factors.push({ factor: 'email', score: emailMatch ? 50 : 0, weight: 0.5 });
    }
    
    // LinkedIn URL match (50 points)
    if (person.linkedinUrl && coresignalProfile.linkedin_url) {
      const linkedinMatch = this.normalizeLinkedInUrl(person.linkedinUrl) === 
                            this.normalizeLinkedInUrl(coresignalProfile.linkedin_url);
      score += linkedinMatch ? 50 : 0;
      factors.push({ factor: 'linkedin', score: linkedinMatch ? 50 : 0, weight: 0.5 });
    }
    
    // Name similarity bonus (up to 20 points)
    if (person.name && coresignalProfile.full_name) {
      const nameSimilarity = this.calculateNameSimilarity(person.name, coresignalProfile.full_name);
      score += nameSimilarity * 20;
      factors.push({ factor: 'name', score: nameSimilarity * 100, weight: 0.2 });
    }
    
    return { 
      confidence: Math.min(100, score), 
      factors, 
      reasoning: `Email: ${person.email === coresignalProfile.email ? 'Match' : 'No match'}, LinkedIn: ${person.linkedinUrl === coresignalProfile.linkedin_url ? 'Match' : 'No match'}` 
    };
  }

  calculateNameSimilarity(name1, name2) {
    if (!name1 || !name2) return 0;
    
    const normalize = (name) => name.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    
    if (n1 === n2) return 1;
    
    // Simple similarity check
    const words1 = n1.split(/\s+/);
    const words2 = n2.split(/\s+/);
    
    let matches = 0;
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 === word2 && word1.length > 2) {
          matches++;
          break;
        }
      }
    }
    
    return matches / Math.max(words1.length, words2.length);
  }

  normalizeLinkedInUrl(url) {
    if (!url) return '';
    
    // Remove protocol and www
    let normalized = url.replace(/^https?:\/\/(www\.)?/, '');
    
    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '');
    
    // Convert to lowercase
    normalized = normalized.toLowerCase();
    
    return normalized;
  }

  printResults() {
    console.log('\n📊 Person Enrichment Results:');
    console.log('='.repeat(60));
    console.log(`Total People: ${this.results.totalPeople}`);
    console.log(`People with Email: ${this.results.withEmail}`);
    console.log(`People with LinkedIn: ${this.results.withLinkedIn}`);
    console.log(`Already Enriched: ${this.results.alreadyEnriched}`);
    console.log(`Successfully Enriched: ${this.results.successfullyEnriched}`);
    console.log(`Failed Enrichment: ${this.results.failedEnrichment}`);
    console.log(`Credits Used - Search: ${this.results.creditsUsed.search}`);
    console.log(`Credits Used - Collect: ${this.results.creditsUsed.collect}`);
    console.log(`Total Credits Used: ${this.results.creditsUsed.search + this.results.creditsUsed.collect}`);
    
    if (this.results.errors.length > 0) {
      console.log(`\n❌ Errors (${this.results.errors.length}):`);
      this.results.errors.slice(0, 10).forEach(error => {
        console.log(`   - ${error.person}: ${error.error}`);
      });
      if (this.results.errors.length > 10) {
        console.log(`   ... and ${this.results.errors.length - 10} more errors`);
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async saveProgress() {
    try {
      const fs = require('fs');
      const progressData = {
        ...this.results,
        lastSaved: new Date().toISOString()
      };
      await fs.promises.writeFile(this.progressFile, JSON.stringify(progressData, null, 2));
    } catch (error) {
      console.error('❌ Error saving progress:', error);
    }
  }

  async loadProgress() {
    try {
      const fs = require('fs');
      const data = await fs.promises.readFile(this.progressFile, 'utf8');
      const progressData = JSON.parse(data);
      this.results = { ...this.results, ...progressData };
      return progressData.processedPeople || [];
    } catch (error) {
      console.log('ℹ️  No previous progress found, starting fresh');
      return [];
    }
  }
}

// Run the enrichment
const enrichment = new PersonEnrichment();
enrichment.run().catch(console.error);
