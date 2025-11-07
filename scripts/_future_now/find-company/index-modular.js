#!/usr/bin/env node

/**
 * Find Company - Modular Company Enrichment Pipeline
 * 
 * Clean orchestrator that delegates to specialized modules
 * Each module handles a specific responsibility
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { MultiSourceVerifier } = require('../../../src/platform/pipelines/modules/core/MultiSourceVerifier');

// Import specialized modules
const { CoresignalSearcher } = require('./modules/CoresignalSearcher');
const { CompanyMatcher } = require('./modules/CompanyMatcher');
const { ContactDiscovery } = require('./modules/ContactDiscovery');
const { ContactVerifier } = require('./modules/ContactVerifier');
const { DataQualityScorer } = require('./modules/DataQualityScorer');
const { ProgressTracker } = require('./modules/ProgressTracker');

class CompanyEnrichment {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday workspace
    this.batchSize = 5;
    this.delayBetweenBatches = 3000;
    this.delayBetweenRequests = 1000;
    
    // Initialize modules
    this.searcher = new CoresignalSearcher(process.env.CORESIGNAL_API_KEY);
    this.matcher = new CompanyMatcher();
    this.contactDiscovery = new ContactDiscovery(process.env.CORESIGNAL_API_KEY);
    this.qualityScorer = new DataQualityScorer();
    this.progressTracker = new ProgressTracker('_future_now/enrichment-progress.json');
    
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
      console.log('🚀 Starting Modular Company Enrichment Pipeline...\n');
      console.log('ℹ️  Using multiple search approaches: website.exact → website → website.domain_only\n');
      
      // Load previous progress
      const processedCompanyIds = await this.progressTracker.loadProgress();
      console.log(`📋 Loaded progress: ${processedCompanyIds.length} companies previously processed\n`);
      
      // Get all companies
      const companies = await this.getCompanies();
      const results = this.progressTracker.getResults();
      results.totalCompanies = companies.length;
      
      console.log(`📊 Found ${companies.length} companies in workspace`);
      
      if (companies.length === 0) {
        console.log('❌ No companies found to process');
        return;
      }

      // Filter companies that need enrichment
      const needsEnrichment = this.filterCompaniesNeedingEnrichment(companies, processedCompanyIds);
      
      console.log(`🔄 Need enrichment: ${needsEnrichment.length}\n`);

      if (needsEnrichment.length === 0) {
        console.log('✅ All companies with websites are already enriched or processed!');
        return;
      }

      // Process companies in batches
      await this.processCompaniesInBatches(needsEnrichment);
      
      // Save final progress and print results
      await this.progressTracker.saveProgress();
      this.progressTracker.printResults();
      
    } catch (error) {
      console.error('❌ Error in company enrichment:', error);
      await this.progressTracker.saveProgress();
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async getCompanies() {
    return await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
  }

  filterCompaniesNeedingEnrichment(companies, processedCompanyIds) {
    const withWebsites = companies.filter(c => c.website && c.website.trim() !== '');
    const alreadyEnriched = companies.filter(c => this.isCompanyEnriched(c));
    const processedIds = new Set(processedCompanyIds.map(p => p.id));
    
    const results = this.progressTracker.getResults();
    results.withWebsites = withWebsites.length;
    results.withoutWebsites = companies.length - withWebsites.length;
    results.alreadyEnriched = alreadyEnriched.length;
    
    console.log(`🌐 Companies with websites: ${withWebsites.length}`);
    console.log(`❌ Companies without websites: ${results.withoutWebsites}`);
    console.log(`✅ Already enriched: ${alreadyEnriched.length}`);
    console.log(`🔄 Previously processed: ${processedCompanyIds.length}`);
    
    return withWebsites.filter(c => 
      !this.isCompanyEnriched(c) && !processedIds.has(c.id)
    );
  }

  isCompanyEnriched(company) {
    if (company.customFields && typeof company.customFields === 'object') {
      const customFields = company.customFields;
      if (customFields.coresignalId || customFields.coresignalData || customFields.lastEnrichedAt) {
        return true;
      }
    }
    
    if (company.descriptionEnriched && company.descriptionEnriched.length > 100) {
      return true;
    }
    
    return false;
  }

  async processCompaniesInBatches(companies) {
    const totalBatches = Math.ceil(companies.length / this.batchSize);
    let processedCount = 0;
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * this.batchSize;
      const endIndex = Math.min(startIndex + this.batchSize, companies.length);
      const batch = companies.slice(startIndex, endIndex);
      
      console.log(`\n📦 Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} companies)`);
      console.log(`📊 Overall Progress: ${processedCount}/${companies.length} companies processed`);
      
      for (const company of batch) {
        try {
          const result = await this.processCompany(company);
          processedCount++;
          
          this.progressTracker.trackProcessed(company.id, company.name, company.website, result);
          
          // Save progress every 5 companies
          if (processedCount % 5 === 0) {
            await this.progressTracker.saveProgress();
          }
          
          // Log progress every 10 companies
          if (processedCount % 10 === 0) {
            this.printProgressUpdate(processedCount, companies.length);
          }
          
          await this.delay(this.delayBetweenRequests);
        } catch (error) {
          console.error(`   ❌ Error processing ${company.name}:`, error.message);
          const results = this.progressTracker.getResults();
          results.failedEnrichment++;
          this.progressTracker.trackError(company.name, error.message);
          this.progressTracker.trackProcessed(company.id, company.name, company.website, { status: 'error', error: error.message });
          processedCount++;
        }
      }
      
      if (batchIndex < totalBatches - 1) {
        console.log(`   ⏳ Waiting ${this.delayBetweenBatches}ms before next batch...`);
        await this.delay(this.delayBetweenBatches);
      }
    }
  }

  async processCompany(company) {
    console.log(`   🔍 Processing: ${company.name}`);
    console.log(`   🌐 Website: ${company.website}`);
    
    const results = this.progressTracker.getResults();
    
    // Check if already enriched
    if (this.isCompanyEnriched(company)) {
      console.log(`   ✅ Already enriched: ${company.name}`);
      results.alreadyEnriched++;
      return { status: 'already_enriched', company: company.name };
    }
    
    // Search for company
    const domain = this.searcher.extractDomain(company.website);
    if (!domain) {
      console.log(`   ⚠️ Invalid website format: ${company.website}`);
      results.failedEnrichment++;
      return { status: 'invalid_domain' };
    }

    const searchResult = await this.searcher.searchCompany(domain);
    if (!searchResult) {
      console.log(`   ⚠️ No Coresignal data found for ${company.name}`);
      results.failedEnrichment++;
      return { status: 'not_found' };
    }

    results.creditsUsed.search += searchResult.creditsUsed;
    console.log(`   ✅ Found Coresignal ID: ${searchResult.companyId} (using ${searchResult.approach})`);

    // Collect full profile
    const profileData = await this.searcher.collectCompanyProfile(searchResult.companyId);
    results.creditsUsed.collect++;
    
    // Verify match
    const matchResult = this.matcher.calculateMatchConfidence(company, profileData);
    console.log(`   🔍 Match confidence: ${matchResult.confidence}%`);
    
    if (matchResult.confidence < 90) {
      console.log(`   ⚠️ Low confidence match (${matchResult.confidence}%): ${company.name}`);
      results.failedEnrichment++;
      return { status: 'low_confidence', confidence: matchResult.confidence };
    }

    // Discover key contacts
    const keyContacts = await this.contactDiscovery.discoverKeyContacts(profileData, company);
    results.creditsUsed.employeePreview++;
    
    // Verify contact information
    const verificationResult = await this.contactVerifier.verifyContacts(keyContacts, company);
    results.contactsDiscovered += verificationResult.contacts.length;
    results.emailsVerified += verificationResult.stats.emailsVerified;
    results.phonesVerified += verificationResult.stats.phonesVerified;
    results.creditsUsed.email += verificationResult.stats.emailCost;
    results.creditsUsed.phone += verificationResult.stats.phoneCost;
    
    // Update database
    await this.updateCompany(company, searchResult.companyId, profileData, matchResult, verificationResult.contacts);
    
    console.log(`   ✅ Successfully enriched: ${company.name} (${verificationResult.contacts.length} contacts)`);
    results.successfullyEnriched++;
    
    return { 
      status: 'success', 
      company: company.name,
      coresignalId: searchResult.companyId,
      confidence: matchResult.confidence,
      contactsFound: verificationResult.contacts.length
    };
  }

  async updateCompany(company, coresignalId, profileData, matchResult, verifiedContacts) {
    const enrichedData = {
      coresignalId: coresignalId,
      coresignalData: profileData,
      lastEnrichedAt: new Date().toISOString(),
      enrichmentSource: 'coresignal',
      matchConfidence: matchResult.confidence,
      matchFactors: matchResult.factors,
      matchReasoning: matchResult.reasoning,
      keyContacts: verifiedContacts.map(contact => ({
        name: contact.name,
        title: contact.title,
        department: contact.department,
        email: contact.email,
        emailVerified: contact.emailVerified || false,
        emailConfidence: contact.emailConfidence || 0,
        phone: contact.phone,
        phoneVerified: contact.phoneVerified || false,
        phoneConfidence: contact.phoneConfidence || 0,
        phoneType: contact.phoneType || 'unknown',
        linkedinUrl: contact.linkedinUrl
      }))
    };

    const qualityScore = this.qualityScorer.calculateScore(company, profileData);

    await this.prisma.companies.update({
      where: { id: company.id },
      data: {
        customFields: {
          ...(company.customFields || {}),
          ...enrichedData
        },
        descriptionEnriched: profileData.description || company.descriptionEnriched,
        linkedinUrl: profileData.linkedin_url || company.linkedinUrl,
        website: profileData.website || company.website,
        domain: profileData.domain || company.domain,
        industry: profileData.industry || company.industry,
        employeeCount: profileData.employee_count || company.employeeCount,
        foundedYear: profileData.founded_year ? parseInt(profileData.founded_year) : company.foundedYear,
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
    console.log(`   💳 Credits Used: ${results.creditsUsed.search + results.creditsUsed.collect}`);
    console.log(`   💾 Progress saved to ${this.progressTracker.progressFile}`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI execution
if (require.main === module) {
  const enrichment = new CompanyEnrichment();
  enrichment.run().catch(console.error);
}

module.exports = CompanyEnrichment;

