#!/usr/bin/env node

/**
 * COMPANY DISCOVERY PIPELINE
 * 
 * Find companies using Target Company Intelligence (people-centric scoring)
 * 
 * Scoring formula:
 * Company Fit Score = 
 *   (Firmographics × 30%) +
 *   (Innovation Adoption × 25%) +
 *   (Pain Signals × 25%) +
 *   (Buyer Group Quality × 20%)
 * 
 * This replaces traditional "ICP matching" with a more sophisticated
 * people-based approach that considers innovation adoption, pain signals,
 * and buyer group composition.
 */

const { TargetCompanyIntelligence } = require('../../modules/core/TargetCompanyIntelligence');

class CompanyDiscoveryPipeline {
  constructor(config = {}) {
    this.config = config;
    this.targetIntelligence = new TargetCompanyIntelligence(config);
  }

  /**
   * Discover companies matching criteria
   */
  async discover(criteria) {
    console.log(`\n🏢 [COMPANY DISCOVERY] Starting discovery...`);

    const startTime = Date.now();

    try {
      // Step 1: Validate criteria
      this.validateCriteria(criteria);

      // Step 2: Find companies matching firmographics
      const companies = await this.findCompanies(criteria);

      console.log(`  Found ${companies.length} companies matching firmographics`);

      // Step 3: Score each company using Target Company Intelligence
      const scoredCompanies = await this.scoreCompanies(companies, criteria);

      // Step 4: Filter by minimum score (if specified)
      const minScore = criteria.minCompanyFitScore || 0;
      const qualifiedCompanies = scoredCompanies.filter(c => c.companyFitScore >= minScore);

      // Step 5: Sort by score (highest first)
      qualifiedCompanies.sort((a, b) => b.companyFitScore - a.companyFitScore);

      // Step 6: Apply limit
      const limit = criteria.limit || 100;
      const finalResults = qualifiedCompanies.slice(0, limit);

      const executionTime = Date.now() - startTime;

      console.log(`\n✅ [COMPANY DISCOVERY] Complete (${executionTime}ms)`);
      console.log(`   Total found: ${companies.length}`);
      console.log(`   Qualified (score >= ${minScore}): ${qualifiedCompanies.length}`);
      console.log(`   Returned: ${finalResults.length}`);

      return {
        success: true,
        companies: finalResults,
        metadata: {
          totalFound: companies.length,
          totalQualified: qualifiedCompanies.length,
          totalReturned: finalResults.length,
          executionTime,
          criteria,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;

      console.error(`\n❌ [COMPANY DISCOVERY] Error:`, error.message);

      return {
        success: false,
        error: error.message,
        executionTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate criteria
   */
  validateCriteria(criteria) {
    if (!criteria) {
      throw new Error('Discovery criteria are required');
    }

    // At least one search criterion must be provided
    if (!criteria.firmographics && !criteria.innovationProfile && !criteria.painSignals) {
      throw new Error('At least one search criterion must be provided (firmographics, innovationProfile, or painSignals)');
    }

    // Validate innovation profile segment if provided
    if (criteria.innovationProfile?.segment) {
      const validSegments = ['innovators', 'early_adopters', 'early_majority', 'late_majority', 'laggards'];
      if (!validSegments.includes(criteria.innovationProfile.segment)) {
        throw new Error(`Invalid innovation segment. Must be one of: ${validSegments.join(', ')}`);
      }
    }

    // Validate min score if provided
    if (criteria.minCompanyFitScore !== undefined) {
      if (typeof criteria.minCompanyFitScore !== 'number' || criteria.minCompanyFitScore < 0 || criteria.minCompanyFitScore > 100) {
        throw new Error('minCompanyFitScore must be a number between 0 and 100');
      }
    }
  }

  /**
   * Find companies matching firmographics
   * 
   * This would typically:
   * 1. Query company database (CoreSignal, ZoomInfo, etc.)
   * 2. Filter by industry, size, location, etc.
   * 3. Return list of matching companies
   * 
   * For now, returns mock data
   */
  async findCompanies(criteria) {
    console.log(`  🔍 Finding companies...`);

    // TODO: Implement actual company search
    // This would query CoreSignal, ZoomInfo, etc.

    // For now, return mock companies
    return [
      {
        name: 'Nike',
        industry: 'Retail',
        employeeCount: 75000,
        revenue: 46000000000,
        headquarters: 'Beaverton, Oregon, USA',
        technologies: ['React 18', 'Next.js', 'Kubernetes', 'AWS'],
        recentFunding: false,
        rapidGrowth: false,
        recentHires: 150,
        recentExecutiveHires: [{ title: 'CTO', tenure: 3 }],
        glassdoorRating: 3.8,
        glassdoorReviewCount: 5000
      },
      {
        name: 'Salesforce',
        industry: 'SaaS',
        employeeCount: 70000,
        revenue: 31000000000,
        headquarters: 'San Francisco, CA, USA',
        technologies: ['React', 'Node.js', 'Heroku', 'Tableau'],
        recentFunding: false,
        rapidGrowth: true,
        recentHires: 200,
        glassdoorRating: 4.1,
        glassdoorReviewCount: 12000
      }
    ];
  }

  /**
   * Score companies using Target Company Intelligence
   */
  async scoreCompanies(companies, criteria) {
    console.log(`  📊 Scoring ${companies.length} companies...`);

    const scoredCompanies = [];

    for (const company of companies) {
      try {
        // Get buyer group if requested
        let buyerGroup = null;
        if (criteria.enrichmentLevel === 'research' || criteria.buyerGroupQuality) {
          buyerGroup = await this.discoverBuyerGroup(company);
        }

        // Calculate Target Company Intelligence score
        const score = await this.targetIntelligence.calculateScore(
          company,
          buyerGroup,
          {
            firmographics: criteria.firmographics,
            buyerGroupQuality: criteria.buyerGroupQuality,
            additionalData: {} // Could include LinkedIn posts, etc.
          }
        );

        scoredCompanies.push(score);

      } catch (error) {
        console.error(`  ❌ Error scoring ${company.name}:`, error.message);
        
        // Add with minimal score
        scoredCompanies.push({
          companyName: company.name,
          companyFitScore: 0,
          error: error.message
        });
      }
    }

    return scoredCompanies;
  }

  /**
   * Discover buyer group for a company
   * 
   * This would call the buyer-group-discovery-pipeline
   */
  async discoverBuyerGroup(company) {
    console.log(`    👥 Discovering buyer group for ${company.name}...`);

    // TODO: Call buyer-group-discovery-pipeline
    // For now, return mock buyer group

    return {
      companyName: company.name,
      members: [
        {
          name: 'John Doe',
          title: 'CTO',
          buyerGroupRole: 'decision_maker',
          email: 'john.doe@company.com',
          linkedIn: 'linkedin.com/in/johndoe',
          linkedInActive: true,
          tenure: 24,
          influenceScore: 85,
          thoughtLeadership: true,
          conferenceSpeaker: true
        },
        {
          name: 'Jane Smith',
          title: 'VP Engineering',
          buyerGroupRole: 'champion',
          email: 'jane.smith@company.com',
          linkedIn: 'linkedin.com/in/janesmith',
          linkedInActive: true,
          tenure: 36,
          influenceScore: 75
        }
      ]
    };
  }
}

module.exports = { CompanyDiscoveryPipeline };

// CLI support
if (require.main === module) {
  const pipeline = new CompanyDiscoveryPipeline();

  // Example usage
  pipeline.discover({
    firmographics: {
      industry: ['SaaS', 'Technology'],
      employeeRange: { min: 100, max: 1000 },
      revenue: { min: 10000000 }
    },
    innovationProfile: {
      segment: 'innovators',
      signals: ['tech_stack_modern', 'thought_leadership']
    },
    painSignals: ['hiring_spike', 'executive_turnover'],
    buyerGroupQuality: {
      requiredRoles: ['decision_maker', 'champion'],
      minAccessibility: 0.7
    },
    minCompanyFitScore: 60,
    limit: 10,
    enrichmentLevel: 'research'
  }).then(result => {
    console.log('\n📊 RESULTS:');
    if (result.success) {
      result.companies.forEach((company, i) => {
        console.log(`\n${i + 1}. ${company.companyName} - Score: ${company.companyFitScore}`);
        console.log(`   Innovation: ${company.innovationProfile.segment}`);
        console.log(`   Pain Level: ${company.painAnalysis.painLevel}`);
      });
    }
  });
}

