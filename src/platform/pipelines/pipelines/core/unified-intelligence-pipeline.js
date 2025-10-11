#!/usr/bin/env node

/**
 * UNIFIED INTELLIGENCE PIPELINE
 * 
 * Single entry point for all intelligence operations:
 * - discover('role', ...) - Find people by role
 * - discover('company', ...) - Find companies by Target Company Intelligence
 * - discover('buyer_group', ...) - Find buyer groups
 * - research('person', ...) - Deep research on specific person
 * 
 * Provides standardized API across all intelligence types
 */

const { RoleDiscoveryPipeline } = require('./role-discovery-pipeline');
const { CompanyDiscoveryPipeline } = require('./company-discovery-pipeline');
const { PersonIntelligencePipeline } = require('./person-intelligence-pipeline');
const { BuyerGroupPipeline } = require('./buyer-group-pipeline');

class UnifiedIntelligencePipeline {
  constructor(config = {}) {
    this.config = config;
    
    // Initialize all pipelines
    this.roleDiscovery = new RoleDiscoveryPipeline(config);
    this.companyDiscovery = new CompanyDiscoveryPipeline(config);
    this.personIntelligence = new PersonIntelligencePipeline(config);
    this.buyerGroupDiscovery = new BuyerGroupPipeline(config);
  }

  /**
   * DISCOVER entities (roles, companies, buyer groups)
   */
  async discover(entityType, criteria) {
    console.log(`\n🎯 [UNIFIED PIPELINE] DISCOVER ${entityType}`);

    try {
      switch (entityType) {
        case 'role':
          return await this.roleDiscovery.discover(criteria);

        case 'company':
          return await this.companyDiscovery.discover(criteria);

      case 'buyer_group':
        return await this.buyerGroupDiscovery.processSingleCompany(criteria);

        default:
          throw new Error(`Unknown entity type: ${entityType}. Use 'role', 'company', or 'buyer_group'`);
      }
    } catch (error) {
      console.error(`\n❌ [UNIFIED PIPELINE] Error:`, error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * RESEARCH entities (deep intelligence)
   */
  async research(entityType, criteria) {
    console.log(`\n🔬 [UNIFIED PIPELINE] RESEARCH ${entityType}`);

    try {
      switch (entityType) {
        case 'person':
          return await this.personIntelligence.research(criteria);

        case 'company':
          // Company research would be deeper analysis of single company
          // For now, use discovery
          return await this.companyDiscovery.discover({
            ...criteria,
            enrichmentLevel: 'research'
          });

        default:
          throw new Error(`Unknown entity type for research: ${entityType}. Use 'person' or 'company'`);
      }
    } catch (error) {
      console.error(`\n❌ [UNIFIED PIPELINE] Error:`, error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * ENRICH entities (add contact information)
   */
  async enrich(entityType, entities, enrichmentLevel = 'enrich') {
    console.log(`\n📧 [UNIFIED PIPELINE] ENRICH ${entityType}`);

    // This would call appropriate enrichment services
    // For now, placeholder

    return {
      success: false,
      error: 'Enrichment not yet implemented in unified pipeline'
    };
  }

  /**
   * Execute any pipeline action
   */
  async execute(request) {
    const { action, entityType, criteria } = request;

    switch (action) {
      case 'discover':
        return await this.discover(entityType, criteria);

      case 'research':
        return await this.research(entityType, criteria);

      case 'enrich':
        return await this.enrich(entityType, criteria.entities, criteria.enrichmentLevel);

      default:
        return {
          success: false,
          error: `Unknown action: ${action}. Use 'discover', 'research', or 'enrich'`
        };
    }
  }
}

module.exports = { UnifiedIntelligencePipeline };

// CLI support
if (require.main === module) {
  const pipeline = new UnifiedIntelligencePipeline();

  // Example: Discover companies
  console.log('='.repeat(80));
  console.log('EXAMPLE 1: Discover companies');
  console.log('='.repeat(80));

  pipeline.discover('company', {
    firmographics: {
      industry: ['SaaS'],
      employeeRange: { min: 100, max: 1000 }
    },
    innovationProfile: {
      segment: 'innovators'
    },
    minCompanyFitScore: 60,
    limit: 5,
    enrichmentLevel: 'research'
  }).then(result => {
    console.log('\n✅ Company Discovery Result:');
    if (result.success) {
      console.log(`   Found ${result.companies.length} companies`);
    }
  });

  // Example: Research person
  setTimeout(() => {
    console.log('\n' + '='.repeat(80));
    console.log('EXAMPLE 2: Research person');
    console.log('='.repeat(80));

    pipeline.research('person', {
      name: 'John Smith',
      company: 'Nike',
      analysisDepth: {
        innovationProfile: true,
        painAwareness: true,
        buyingAuthority: true
      }
    }).then(result => {
      console.log('\n✅ Person Research Result:');
      if (result.success) {
        console.log(`   Person: ${result.data.person.name}`);
        console.log(`   Innovation: ${result.data.innovationProfile?.segment || 'N/A'}`);
        console.log(`   Buying Role: ${result.data.buyingAuthority?.role || 'N/A'}`);
      }
    });
  }, 2000);

  // Example: Discover roles
  setTimeout(() => {
    console.log('\n' + '='.repeat(80));
    console.log('EXAMPLE 3: Discover roles');
    console.log('='.repeat(80));

    pipeline.discover('role', {
      roles: ['VP Marketing', 'CMO'],
      companies: ['Salesforce', 'HubSpot'],
      enrichmentLevel: 'enrich'
    }).then(result => {
      console.log('\n✅ Role Discovery Result:');
      if (result.success) {
        console.log(`   Found ${result.people.length} people`);
      }
    });
  }, 4000);
}

