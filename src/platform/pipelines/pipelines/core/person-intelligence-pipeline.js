#!/usr/bin/env node

/**
 * PERSON INTELLIGENCE PIPELINE
 * 
 * Deep intelligence on a SPECIFIC person (not search)
 * 
 * Use cases:
 * - "Tell me about John Smith at Nike"
 * - "Research Sarah Johnson at Salesforce"
 * - "What's the background on this VP of Engineering?"
 * 
 * Provides:
 * - Innovation profile (innovator → laggard)
 * - Pain awareness
 * - Buying authority
 * - Influence network
 * - Career trajectory
 * - Risk profile
 */

const { PersonIntelligenceEngine } = require('../../modules/core/PersonIntelligenceEngine');

class PersonIntelligencePipeline {
  constructor(config = {}) {
    this.config = config;
    this.intelligenceEngine = new PersonIntelligenceEngine(config);
  }

  /**
   * Research a specific person
   */
  async research(request) {
    console.log(`\n🔍 [PERSON INTEL PIPELINE] Starting research...`);
    console.log(`   Person: ${request.name}`);
    console.log(`   Company: ${request.company || 'Not specified'}`);

    const startTime = Date.now();

    try {
      // Step 1: Validate input
      this.validateRequest(request);

      // Step 2: Resolve person (find full profile)
      const personData = await this.resolvePerson(request);

      // Step 3: Run intelligence analysis
      const intelligence = await this.intelligenceEngine.analyzePerson(personData, {
        includeInnovationProfile: request.analysisDepth?.innovationProfile !== false,
        includePainAwareness: request.analysisDepth?.painAwareness !== false,
        includeBuyingAuthority: request.analysisDepth?.buyingAuthority !== false,
        includeInfluenceNetwork: request.analysisDepth?.influenceNetwork !== false,
        includeCareerTrajectory: request.analysisDepth?.careerTrajectory !== false,
        includeRiskProfile: request.analysisDepth?.riskProfile !== false,
        companyData: request.companyData,
        buyerGroup: request.buyerGroup
      });

      const executionTime = Date.now() - startTime;

      console.log(`\n✅ [PERSON INTEL PIPELINE] Research complete (${executionTime}ms)`);

      return {
        success: true,
        data: intelligence,
        executionTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      console.error(`\n❌ [PERSON INTEL PIPELINE] Error:`, error.message);

      return {
        success: false,
        error: error.message,
        executionTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate request
   */
  validateRequest(request) {
    if (!request.name || typeof request.name !== 'string' || request.name.trim().length < 2) {
      throw new Error('name is required and must be a string with at least 2 characters');
    }

    // Company helps with disambiguation but is optional
    if (request.company && (typeof request.company !== 'string' || request.company.trim().length < 2)) {
      throw new Error('company, if provided, must be a string with at least 2 characters');
    }

    // Validate analysisDepth if provided
    if (request.analysisDepth) {
      const validAnalyses = [
        'innovationProfile',
        'painAwareness',
        'buyingAuthority',
        'influenceNetwork',
        'careerTrajectory',
        'riskProfile'
      ];
      
      const invalidKeys = Object.keys(request.analysisDepth).filter(key => !validAnalyses.includes(key));
      if (invalidKeys.length > 0) {
        throw new Error(`Invalid analysis types: ${invalidKeys.join(', ')}. Valid types: ${validAnalyses.join(', ')}`);
      }
    }
  }

  /**
   * Resolve person (find full profile)
   * 
   * This would typically:
   * 1. Search CoreSignal for the person
   * 2. Enrich with contact data (Lusha, etc.)
   * 3. Pull LinkedIn data
   * 4. Aggregate blog posts, conference talks, etc.
   * 
   * For now, returns a structured placeholder
   */
  async resolvePerson(request) {
    console.log(`  🔍 Resolving person profile...`);

    // TODO: Implement actual person resolution
    // This would call CoreSignal, LinkedIn, etc. to build complete profile
    
    // For now, return mock data structure that matches what PersonIntelligenceEngine expects
    return {
      name: request.name,
      title: request.title || 'VP of Engineering', // From request or discovery
      company: request.company,
      email: request.email,
      phone: request.phone,
      linkedIn: request.linkedIn,

      // Data that would come from enrichment
      conferenceSpeaker: false,
      speakingEngagements: 0,
      blogPosts: 0,
      publishedArticles: 0,
      githubActivity: 'unknown',
      openSourceContributions: false,
      skills: [],
      linkedInPosts: [],
      industryAdvisor: false,
      boardMember: false,
      linkedInActivityLevel: 'moderate',
      patents: 0,
      researchPapers: 0,
      hasStartupExperience: false,
      experience: [],
      previousCompanies: [],
      isFounder: false,
      reportsTo: 'CTO',
      directReports: 0,
      worksWith: [],
      linkedInFollowers: 0,
      tenure: 24, // months
      avgTenure: 36,
      industryExperience: 120, // months
      teamHiring: [],
      conferenceTalks: [],
      articles: []
    };
  }

  /**
   * Batch research multiple people
   */
  async batchResearch(people) {
    console.log(`\n🔍 [PERSON INTEL PIPELINE] Batch research: ${people.length} people`);

    const results = await Promise.all(
      people.map(person => this.research(person))
    );

    return {
      success: true,
      results,
      total: people.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };
  }
}

module.exports = { PersonIntelligencePipeline };

// CLI support
if (require.main === module) {
  const pipeline = new PersonIntelligencePipeline();
  
  // Example usage
  pipeline.research({
    name: 'John Smith',
    company: 'Nike',
    analysisDepth: {
      innovationProfile: true,
      painAwareness: true,
      buyingAuthority: true,
      influenceNetwork: true,
      careerTrajectory: true,
      riskProfile: true
    }
  }).then(result => {
    console.log('\n📊 RESULT:');
    console.log(JSON.stringify(result, null, 2));
  });
}

