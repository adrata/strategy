#!/usr/bin/env node

/**
 * Find Optimal Buyer Group - Modular Pipeline
 * 
 * Clean orchestrator that delegates to specialized modules
 * Follows find-buyer-group architecture pattern
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { MultiSourceVerifier } = require('../../../src/platform/pipelines/modules/core/MultiSourceVerifier');

// Import specialized modules
const { QueryBuilder } = require('./modules/QueryBuilder');
const { CoresignalAPI } = require('./modules/CoresignalAPI');
const { CompanyScorer } = require('./modules/CompanyScorer');
const { ScoringFallback } = require('./modules/ScoringFallback');
const { BuyerGroupSampler } = require('./modules/BuyerGroupSampler');
const { BuyerGroupAnalyzer } = require('./modules/BuyerGroupAnalyzer');
const { AnalyzerFallback } = require('./modules/AnalyzerFallback');
const { DepartmentAnalyzer } = require('./modules/DepartmentAnalyzer');
const { ContactVerifier } = require('./modules/ContactVerifier');
const { ProgressTracker } = require('./modules/ProgressTracker');

class OptimalBuyerGroupFinder {
  constructor(options = {}) {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1';
    
    // Configuration
    this.searchMode = options.searchMode || 'criteria';
    this.qualificationCriteria = {
      industries: options.industries || [],
      sizeRange: options.sizeRange || '50-200 employees',
      locations: options.locations || [],
      keywords: options.keywords || [],
      minGrowthRate: options.minGrowthRate || 10,
      companyType: options.companyType || 'Privately Held',
      b2bOnly: options.b2bOnly ?? true
    };
    
    this.scoringWeights = {
      firmographicFit: options.weightFirmographic || 0.15,
      growthSignals: options.weightGrowth || 0.15,
      technologyAdoption: options.weightTechnology || 0.10,
      adoptionMaturity: options.weightAdoption || 0.10,
      buyerGroupQuality: options.weightBuyerGroup || 0.60
    };
    
    this.enableBuyerGroupSampling = options.enableBuyerGroupSampling ?? true;
    this.employeeSampleSize = options.employeeSampleSize || 25;
    this.sampleDepartments = options.sampleDepartments || [
      'Sales and Business Development',
      'Operations',
      'Product Management',
      'Marketing'
    ];
    
    this.maxResults = options.maxResults || 50;
    this.minReadinessScore = options.minReadinessScore || 70;
    this.useAI = options.useAI ?? true;
    
    // Initialize modules
    this.queryBuilder = new QueryBuilder(this.qualificationCriteria, this.searchMode);
    this.coresignalAPI = new CoresignalAPI(process.env.CORESIGNAL_API_KEY);
    
    // AI scoring modules
    const hasAI = this.useAI && process.env.ANTHROPIC_API_KEY;
    if (hasAI) {
      this.companyScorer = new CompanyScorer(process.env.ANTHROPIC_API_KEY, this.qualificationCriteria, this.scoringWeights);
      this.buyerGroupAnalyzer = new BuyerGroupAnalyzer(process.env.ANTHROPIC_API_KEY);
    } else {
      this.scoringFallback = new ScoringFallback(this.qualificationCriteria, this.scoringWeights);
      this.analyzerFallback = new AnalyzerFallback();
    }
    
    // Other modules
    this.buyerGroupSampler = new BuyerGroupSampler(
      process.env.CORESIGNAL_API_KEY,
      this.sampleDepartments,
      this.employeeSampleSize
    );
    this.deptAnalyzer = new DepartmentAnalyzer();
    
    // Contact verification
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
    
    this.progressTracker = new ProgressTracker('_future_now/optimal-buyer-group-progress.json');
    this.progressTracker.results.searchCriteria = this.qualificationCriteria;

    if (!process.env.CORESIGNAL_API_KEY) {
      console.error('❌ CORESIGNAL_API_KEY required');
      process.exit(1);
    }

    if (this.searchMode === 'criteria' && this.qualificationCriteria.industries.length === 0) {
      console.error('❌ At least one industry required for criteria search');
      process.exit(1);
    }
  }

  async run() {
    try {
      console.log(`🎯 Starting Modular Optimal Buyer Group Search`);
      console.log(`📊 Search Mode: ${this.searchMode}`);
      console.log(`🤖 AI Scoring: ${this.useAI ? 'Enabled' : 'Disabled'}`);
      
      await this.progressTracker.loadProgress();
      
      // Build query
      const searchQuery = this.queryBuilder.build();
      console.log(`🔍 Built search query`);
      
      // Search companies
      const candidateIds = await this.coresignalAPI.searchCompanies(searchQuery);
      console.log(`📊 Found ${candidateIds.length} candidate companies`);
      this.progressTracker.updateStats({ creditsUsed: { search: 1 } });
      
      if (candidateIds.length === 0) {
        console.log('❌ No candidates found');
        return;
      }
      
      // Collect profiles
      const companies = await this.coresignalAPI.collectCompanyProfiles(candidateIds.slice(0, 100));
      console.log(`📋 Collected ${companies.length} company profiles`);
      this.progressTracker.updateStats({ creditsUsed: { collect: companies.length } });
      
      // Phase 1: Score companies
      const scoredCompanies = await this.scoreCompanies(companies);
      console.log(`🎯 Scored ${scoredCompanies.length} companies (Phase 1)`);
      
      // Phase 2: Sample buyer groups
      let finalCompanies = scoredCompanies;
      if (this.enableBuyerGroupSampling) {
        finalCompanies = await this.sampleBuyerGroups(scoredCompanies);
        console.log(`📊 Phase 2 completed`);
      }
      
      // Verify contacts
      console.log(`📧📞 Verifying contact information...`);
      finalCompanies = await this.verifyContacts(finalCompanies);
      
      // Filter and rank
      const qualifiedBuyers = finalCompanies
        .filter(company => company.buyerReadinessScore >= this.minReadinessScore)
        .sort((a, b) => b.buyerReadinessScore - a.buyerReadinessScore)
        .slice(0, this.maxResults);
      
      console.log(`✅ Found ${qualifiedBuyers.length} qualified buyers`);
      
      this.progressTracker.results.totalCandidates = candidateIds.length;
      this.progressTracker.setOptimalBuyerGroups(qualifiedBuyers);
      
      await this.progressTracker.saveProgress();
      this.printResults();
      
    } catch (error) {
      console.error('❌ Search failed:', error.message);
      this.progressTracker.trackError(new Date().toISOString(), error.message);
      await this.progressTracker.saveProgress();
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async scoreCompanies(companies) {
    const scored = [];
    
    for (const company of companies) {
      try {
        console.log(`🎯 Scoring: ${company.company_name}`);
        
        let scores;
        if (this.companyScorer) {
          scores = await this.companyScorer.score(company);
        } else {
          scores = this.scoringFallback.score(company);
        }
        
        scored.push({
          ...company,
          ...scores,
          processedAt: new Date().toISOString()
        });
        
        await this.delay(1000);
      } catch (error) {
        console.error(`❌ Failed to score ${company.company_name}:`, error.message);
      }
    }
    
    return scored;
  }

  async sampleBuyerGroups(companies) {
    const companiesWithQuality = [];
    
    for (const company of companies) {
      try {
        console.log(`🔍 Sampling buyer group for ${company.company_name}...`);
        
        const previewEmployees = await this.buyerGroupSampler.sampleEmployees(company);
        this.progressTracker.updateStats({ creditsUsed: { preview_search: this.sampleDepartments.length } });
        
        if (previewEmployees.length === 0) {
          companiesWithQuality.push(company);
          continue;
        }
        
        const departmentCounts = this.deptAnalyzer.calculateDepartmentCounts(previewEmployees);
        const managementCounts = this.deptAnalyzer.calculateManagementLevelCounts(previewEmployees);
        
        let buyerGroupQuality;
        if (this.buyerGroupAnalyzer) {
          buyerGroupQuality = await this.buyerGroupAnalyzer.analyze(company, previewEmployees, departmentCounts, managementCounts);
        } else {
          buyerGroupQuality = this.analyzerFallback.analyze(company, previewEmployees, departmentCounts, managementCounts);
        }
        
        buyerGroupQuality.sample_employees = previewEmployees;
        buyerGroupQuality.employeesAnalyzed = previewEmployees.length;
        
        const updatedCompany = {
          ...company,
          buyerGroupQuality,
          buyerReadinessScore: this.deptAnalyzer.calculateFinalScore(company, buyerGroupQuality, this.scoringWeights)
        };
        
        companiesWithQuality.push(updatedCompany);
        await this.delay(1000);
        
      } catch (error) {
        console.error(`❌ Failed to sample ${company.company_name}:`, error.message);
        companiesWithQuality.push(company);
      }
    }
    
    return companiesWithQuality;
  }

  async verifyContacts(companies) {
    const verified = await this.contactVerifier.verifyTopCandidates(companies, 20);
    
    // Aggregate stats
    const totalEmailsVerified = verified.reduce((sum, c) => sum + (c.verificationStats?.emailsVerified || 0), 0);
    const totalPhonesVerified = verified.reduce((sum, c) => sum + (c.verificationStats?.phonesVerified || 0), 0);
    const totalEmailCost = verified.reduce((sum, c) => sum + (c.verificationStats?.emailCost || 0), 0);
    const totalPhoneCost = verified.reduce((sum, c) => sum + (c.verificationStats?.phoneCost || 0), 0);
    
    this.progressTracker.updateStats({
      emailsVerified: totalEmailsVerified,
      phonesVerified: totalPhonesVerified,
      creditsUsed: {
        email: totalEmailCost,
        phone: totalPhoneCost
      }
    });
    
    return verified;
  }

  printResults() {
    const results = this.progressTracker.getResults();
    console.log('\n📊 Final Results:');
    console.log(`✅ Optimal Buyer Groups: ${results.optimalBuyerGroups.length}`);
    console.log(`📈 Total Candidates: ${results.totalCandidates}`);
    console.log(`🎯 Qualified Buyers: ${results.qualifiedBuyers}`);
    console.log(`\n📧📞 Contact Verification:`);
    console.log(`Emails Verified: ${results.emailsVerified}`);
    console.log(`Phones Verified: ${results.phonesVerified}`);
    console.log(`\n💳 Credits Used:`);
    console.log(`Search: ${results.creditsUsed.search}`);
    console.log(`Collect: ${results.creditsUsed.collect}`);
    console.log(`Preview: ${results.creditsUsed.preview_search || 0}`);
    console.log(`Email: $${results.creditsUsed.email.toFixed(4)}`);
    console.log(`Phone: $${results.creditsUsed.phone.toFixed(4)}`);
    
    if (results.optimalBuyerGroups.length > 0) {
      console.log('\n🏆 Top 5 Optimal Buyer Groups:');
      results.optimalBuyerGroups.slice(0, 5).forEach((company, index) => {
        console.log(`${index + 1}. ${company.company_name} (${company.buyerReadinessScore}% readiness)`);
        console.log(`   ${company.adoptionMaturityProfile} | ${company.company_industry} | ${company.company_employees_count} employees`);
      });
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
    console.log('Usage: node index-modular.js [options]');
    console.log('Example: node index-modular.js --industries "Software,SaaS" --size "50-200 employees"');
    process.exit(1);
  }
  
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    
    if (key && value) {
      switch (key) {
        case 'industries':
          options.industries = value.split(',');
          break;
        case 'size':
          options.sizeRange = value;
          break;
        case 'minGrowth':
          options.minGrowthRate = parseInt(value);
          break;
        case 'maxResults':
          options.maxResults = parseInt(value);
          break;
        case 'minScore':
          options.minReadinessScore = parseInt(value);
          break;
      }
    }
  }
  
  const finder = new OptimalBuyerGroupFinder(options);
  finder.run().catch(console.error);
}

module.exports = OptimalBuyerGroupFinder;

