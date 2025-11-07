#!/usr/bin/env node

/**
 * Find Role - Modular Role Finding Pipeline
 * 
 * Clean orchestrator that delegates to specialized modules
 * Follows find-buyer-group architecture pattern
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { MultiSourceVerifier } = require('../../../src/platform/pipelines/modules/core/MultiSourceVerifier');

// Import specialized modules
const { RoleVariationGenerator } = require('./modules/RoleVariationGenerator');
const { RoleSearcher } = require('./modules/RoleSearcher');
const { RoleMatchScorer } = require('./modules/RoleMatchScorer');
const { ContactVerifier } = require('./modules/ContactVerifier');
const { ProgressTracker } = require('./modules/ProgressTracker');

class RoleEnrichment {
  constructor(options = {}) {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1';
    
    // Configuration
    this.targetRole = options.targetRole;
    this.companyId = options.companyId;
    this.companyLinkedInUrl = options.companyLinkedInUrl;
    this.maxResults = options.maxResults || 1;
    this.useAI = options.useAI ?? true;
    
    // Initialize modules
    this.variationGenerator = new RoleVariationGenerator(process.env.ANTHROPIC_API_KEY, this.useAI);
    this.roleSearcher = new RoleSearcher(process.env.CORESIGNAL_API_KEY);
    this.matchScorer = new RoleMatchScorer();
    this.progressTracker = new ProgressTracker('_future_now/role-enrichment-progress.json');
    
    // Initialize contact verifier
    const emailVerifier = new MultiSourceVerifier({
      ZEROBOUNCE_API_KEY: process.env.ZEROBOUNCE_API_KEY,
      MYEMAILVERIFIER_API_KEY: process.env.MYEMAILVERIFIER_API_KEY,
      PROSPEO_API_KEY: process.env.PROSPEO_API_KEY,
      LUSHA_API_KEY: process.env.LUSHA_API_KEY,
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
      TIMEOUT: 30000
    });
    
    this.contactVerifier = new ContactVerifier(emailVerifier);

    if (!process.env.CORESIGNAL_API_KEY) {
      console.error('❌ CORESIGNAL_API_KEY required');
      process.exit(1);
    }

    if (!this.targetRole) {
      console.error('❌ targetRole is required');
      process.exit(1);
    }
  }

  async run() {
    try {
      console.log(`🎯 Starting Modular Role Search for: ${this.targetRole}`);
      console.log(`📊 Max results: ${this.maxResults}`);
      console.log(`🤖 AI enabled: ${this.useAI}`);
      
      await this.progressTracker.loadProgress();
      
      // Find company
      const company = await this.findCompany();
      if (!company) {
        throw new Error('Company not found or not specified');
      }
      
      console.log(`🏢 Found company: ${company.name}`);
      
      // Generate role variations
      const roleVariations = await this.variationGenerator.generateVariations(this.targetRole, {
        companyName: company.name,
        industry: company.industry || 'Technology',
        website: company.website
      });
      
      const results = this.progressTracker.getResults();
      if (this.useAI && this.variationGenerator.claudeApiKey) {
        results.aiGeneratedVariations++;
      } else {
        results.fallbackVariations++;
      }
      
      console.log(`🔍 Generated ${roleVariations.primary.length + roleVariations.secondary.length + roleVariations.tertiary.length} role variations`);
      
      // Search for matches
      const companyLinkedInUrl = company.customFields?.linkedinUrl || company.linkedinUrl || company.website;
      const matches = await this.roleSearcher.searchRoleMatches(companyLinkedInUrl, roleVariations, this.maxResults);
      
      // Process matches
      await this.processMatches(matches, company);
      
      await this.progressTracker.saveProgress();
      this.progressTracker.printResults();
      
      console.log(`✅ Role search completed`);
      
    } catch (error) {
      console.error('❌ Role search failed:', error.message);
      await this.progressTracker.saveProgress();
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async findCompany() {
    if (this.companyLinkedInUrl) {
      return await this.prisma.companies.findFirst({
        where: {
          workspaceId: this.workspaceId,
          deletedAt: null,
          customFields: {
            path: ['linkedinUrl'],
            equals: this.companyLinkedInUrl
          }
        }
      });
    }
    
    if (this.companyId) {
      return await this.prisma.companies.findFirst({
        where: {
          id: this.companyId,
          workspaceId: this.workspaceId,
          deletedAt: null
        }
      });
    }
    
    return await this.prisma.companies.findFirst({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      }
    });
  }

  async processMatches(matches, company) {
    console.log(`📊 Processing ${matches.length} role matches...`);
    
    const results = this.progressTracker.getResults();
    const companyDomain = this.contactVerifier.extractDomain(company.website);
    
    for (const matchInfo of matches) {
      try {
        // Collect full profile
        const profileData = await this.roleSearcher.collectPersonProfile(matchInfo.id);
        results.creditsUsed.collect++;
        
        // Calculate match confidence
        const confidence = this.matchScorer.calculateConfidence(profileData, matchInfo.matchedRole, matchInfo.matchLevel);
        
        // Verify contact information
        const verificationResult = await this.contactVerifier.verifyMatchContact(profileData, companyDomain);
        
        results.emailsVerified += verificationResult.stats.emailsVerified;
        results.phonesVerified += verificationResult.stats.phonesVerified;
        results.creditsUsed.email += verificationResult.stats.emailCost;
        results.creditsUsed.phone += verificationResult.stats.phoneCost;
        
        const processedMatch = {
          personId: matchInfo.id,
          name: profileData.full_name,
          title: profileData.active_experience_title || profileData.experience?.[0]?.position_title || 'Unknown',
          company: company.name,
          matchedRole: matchInfo.matchedRole,
          matchLevel: matchInfo.matchLevel,
          confidence: confidence.confidence,
          linkedinUrl: profileData.linkedin_url,
          ...verificationResult.contact,
          processedAt: new Date().toISOString()
        };
        
        this.progressTracker.trackMatch(processedMatch);
        results.successfulMatches++;
        
        console.log(`✅ Found ${profileData.full_name} - ${matchInfo.matchedRole} (${confidence.confidence}% confidence)`);
        console.log(`   📧 Email: ${processedMatch.email || 'N/A'} ${processedMatch.emailVerified ? '✅' : ''}`);
        console.log(`   📞 Phone: ${processedMatch.phone || 'N/A'} ${processedMatch.phoneVerified ? '✅' : ''}`);
        
        await this.delay(500);
        
      } catch (error) {
        console.error(`❌ Failed to process match:`, error.message);
        results.failedMatches++;
        this.progressTracker.trackError(matchInfo.matchedRole, matchInfo.matchLevel, error.message);
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node index-modular.js <targetRole> [companyId] [maxResults]');
    console.log('Example: node index-modular.js "CFO" "company_123" 3');
    process.exit(1);
  }
  
  const options = {
    targetRole: args[0],
    companyId: args[1] || null,
    maxResults: parseInt(args[2]) || 1,
    useAI: true
  };
  
  const roleEnrichment = new RoleEnrichment(options);
  roleEnrichment.run().catch(console.error);
}

module.exports = RoleEnrichment;

