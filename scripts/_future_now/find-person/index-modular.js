#!/usr/bin/env node

/**
 * Find Person - Modular Person Enrichment Pipeline
 * 
 * Clean orchestrator that delegates to specialized modules
 * Follows find-buyer-group architecture pattern
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { MultiSourceVerifier } = require('../../../src/platform/pipelines/modules/core/MultiSourceVerifier');

// Import specialized modules
const { PersonSearcher } = require('./modules/PersonSearcher');
const { PersonMatcher } = require('./modules/PersonMatcher');
const { ContactVerifier } = require('./modules/ContactVerifier');
const { DataQualityScorer } = require('./modules/DataQualityScorer');
const { ProgressTracker } = require('./modules/ProgressTracker');

class PersonEnrichment {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday workspace
    this.batchSize = 5;
    this.delayBetweenBatches = 3000;
    this.delayBetweenRequests = 1000;
    
    // Initialize modules
    this.searcher = new PersonSearcher(process.env.CORESIGNAL_API_KEY);
    this.matcher = new PersonMatcher();
    this.qualityScorer = new DataQualityScorer();
    this.progressTracker = new ProgressTracker('_future_now/person-enrichment-progress.json');
    
    // Initialize email/phone verifier
    const emailVerifier = new MultiSourceVerifier({
      ZEROBOUNCE_API_KEY: process.env.ZEROBOUNCE_API_KEY,
      MYEMAILVERIFIER_API_KEY: process.env.MYEMAILVERIFIER_API_KEY,
      PROSPEO_API_KEY: process.env.PROSPEO_API_KEY,
      LUSHA_API_KEY: process.env.LUSHA_API_KEY,
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
      PEOPLE_DATA_LABS_API_KEY: process.env.PEOPLE_DATA_LABS_API_KEY,
      PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
      TIMEOUT: 30000
    });
    
    this.contactVerifier = new ContactVerifier(emailVerifier);

    if (!process.env.CORESIGNAL_API_KEY) {
      console.error('❌ CORESIGNAL_API_KEY environment variable is required');
      process.exit(1);
    }
  }

  async run() {
    try {
      console.log('🚀 Starting Modular Person Enrichment Pipeline...\n');
      console.log('ℹ️  Using direct email and LinkedIn matching strategies\n');
      
      // Load progress
      const processedPersonIds = await this.progressTracker.loadProgress();
      console.log(`📋 Loaded progress: ${processedPersonIds.length} people previously processed\n`);
      
      // Get all people
      const people = await this.getPeople();
      const results = this.progressTracker.getResults();
      results.totalPeople = people.length;
      
      console.log(`📊 Found ${people.length} people in workspace`);
      
      if (people.length === 0) {
        console.log('❌ No people found to process');
        return;
      }

      // Filter people that need enrichment
      const needsEnrichment = this.filterPeopleNeedingEnrichment(people, processedPersonIds);
      console.log(`🔄 Need enrichment: ${needsEnrichment.length}\n`);

      if (needsEnrichment.length === 0) {
        console.log('✅ All people with contact info are already enriched!');
        return;
      }

      // Process people in batches
      await this.processPeopleInBatches(needsEnrichment);
      
      // Save final progress and print results
      await this.progressTracker.saveProgress();
      this.progressTracker.printResults();
      
    } catch (error) {
      console.error('❌ Error in person enrichment:', error);
      await this.progressTracker.saveProgress();
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

  filterPeopleNeedingEnrichment(people, processedPersonIds) {
    const withEmail = people.filter(p => p.email && p.email.trim() !== '');
    const withLinkedIn = people.filter(p => p.linkedinUrl && p.linkedinUrl.trim() !== '');
    const alreadyEnriched = people.filter(p => this.isPersonEnriched(p));
    const processedIds = new Set(processedPersonIds.map(p => p.id));
    
    const results = this.progressTracker.getResults();
    results.withEmail = withEmail.length;
    results.withLinkedIn = withLinkedIn.length;
    results.alreadyEnriched = alreadyEnriched.length;
    
    console.log(`📧 People with email: ${withEmail.length}`);
    console.log(`🔗 People with LinkedIn: ${withLinkedIn.length}`);
    console.log(`✅ Already enriched: ${alreadyEnriched.length}`);
    console.log(`🔄 Previously processed: ${processedPersonIds.length}`);
    
    return people.filter(p => 
      !this.isPersonEnriched(p) && !processedIds.has(p.id) && (p.email || p.linkedinUrl)
    );
  }

  isPersonEnriched(person) {
    if (person.customFields && typeof person.customFields === 'object') {
      const customFields = person.customFields;
      if (customFields.coresignalId || customFields.coresignalData || customFields.lastEnrichedAt) {
        return true;
      }
    }
    
    if (person.titleEnriched && person.titleEnriched.length > 10) {
      return true;
    }
    
    return false;
  }

  async processPeopleInBatches(people) {
    const totalBatches = Math.ceil(people.length / this.batchSize);
    let processedCount = 0;
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batch = people.slice(batchIndex * this.batchSize, Math.min((batchIndex + 1) * this.batchSize, people.length));
      
      console.log(`\n📦 Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} people)`);
      
      for (const person of batch) {
        try {
          const result = await this.processPerson(person);
          processedCount++;
          
          this.progressTracker.trackProcessed(person.id, person.name, person.email, person.linkedinUrl, result);
          
          if (processedCount % 5 === 0) {
            await this.progressTracker.saveProgress();
          }
          
          if (processedCount % 10 === 0) {
            this.printProgressUpdate(processedCount, people.length);
          }
          
          await this.delay(this.delayBetweenRequests);
        } catch (error) {
          console.error(`   ❌ Error processing ${person.name}:`, error.message);
          const results = this.progressTracker.getResults();
          results.failedEnrichment++;
          this.progressTracker.trackError(person.name, error.message);
          processedCount++;
        }
      }
      
      if (batchIndex < totalBatches - 1) {
        await this.delay(this.delayBetweenBatches);
      }
    }
  }

  async processPerson(person) {
    console.log(`   🔍 Processing: ${person.name}`);
    
    const results = this.progressTracker.getResults();
    
    if (this.isPersonEnriched(person)) {
      console.log(`   ✅ Already enriched`);
      results.alreadyEnriched++;
      return { status: 'already_enriched' };
    }
    
    // Search for person
    const searchResult = await this.searcher.searchPerson(person);
    if (!searchResult) {
      console.log(`   ⚠️ No Coresignal data found`);
      results.failedEnrichment++;
      return { status: 'not_found' };
    }

    results.creditsUsed.search += searchResult.creditsUsed;
    console.log(`   ✅ Found Coresignal ID: ${searchResult.personId}`);

    // Collect profile
    const profileData = await this.searcher.collectPersonProfile(searchResult.personId);
    results.creditsUsed.collect++;
    
    // Verify match
    const matchResult = this.matcher.calculateMatchConfidence(person, profileData);
    console.log(`   🔍 Match confidence: ${matchResult.confidence}%`);
    
    if (matchResult.confidence < 90) {
      console.log(`   ⚠️ Low confidence match`);
      results.failedEnrichment++;
      return { status: 'low_confidence' };
    }

    // Get company for domain
    const company = person.companyId ? await this.prisma.companies.findUnique({
      where: { id: person.companyId }
    }) : null;

    // Verify contact information
    const verificationResult = await this.contactVerifier.verifyContact(person, profileData, company);
    results.emailsVerified += verificationResult.stats.emailsVerified;
    results.phonesVerified += verificationResult.stats.phonesVerified;
    results.creditsUsed.email += verificationResult.stats.emailCost;
    results.creditsUsed.phone += verificationResult.stats.phoneCost;
    
    // Update database
    await this.updatePerson(person, searchResult.personId, profileData, matchResult, verificationResult.contact);
    
    console.log(`   ✅ Successfully enriched`);
    results.successfullyEnriched++;
    
    return { 
      status: 'success',
      emailVerified: verificationResult.contact.emailVerified,
      phoneVerified: verificationResult.contact.phoneVerified
    };
  }

  async updatePerson(person, coresignalId, profileData, matchResult, verifiedContact) {
    const enrichedData = {
      coresignalId,
      coresignalData: profileData,
      lastEnrichedAt: new Date().toISOString(),
      enrichmentSource: 'coresignal',
      matchConfidence: matchResult.confidence,
      matchFactors: matchResult.factors,
      matchReasoning: matchResult.reasoning
    };

    const qualityScore = this.qualityScorer.calculateScore(person, profileData);

    await this.prisma.people.update({
      where: { id: person.id },
      data: {
        customFields: {
          ...(person.customFields || {}),
          ...enrichedData
        },
        titleEnriched: profileData.title || person.titleEnriched,
        linkedinUrl: profileData.linkedin_url || person.linkedinUrl,
        email: verifiedContact.email || profileData.email || person.email,
        emailVerified: verifiedContact.emailVerified || false,
        emailConfidence: verifiedContact.emailConfidence || 0,
        phone: verifiedContact.phone || person.phone,
        phoneVerified: verifiedContact.phoneVerified || false,
        phoneConfidence: verifiedContact.phoneConfidence || 0,
        phoneType: verifiedContact.phoneType || 'unknown',
        location: profileData.location || person.location,
        dataQualityScore: qualityScore,
        enrichmentSources: ['coresignal'],
        enrichmentVersion: '2.0',
        lastEnriched: new Date(),
        updatedAt: new Date()
      }
    });
  }

  printProgressUpdate(processed, total) {
    const results = this.progressTracker.getResults();
    console.log(`\n📈 Progress Update:`);
    console.log(`   ✅ Successfully Enriched: ${results.successfullyEnriched}`);
    console.log(`   ❌ Failed: ${results.failedEnrichment}`);
    console.log(`   🔄 Processed: ${processed}/${total}`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI execution
if (require.main === module) {
  const enrichment = new PersonEnrichment();
  enrichment.run().catch(console.error);
}

module.exports = PersonEnrichment;

