/**
 * UNIFIED INTELLIGENCE PIPELINE (Top-Level Orchestrator)
 * 
 * Single entry point for all intelligence operations
 * Delegates to specialized pipelines
 */

import { RoleDiscoveryPipeline, type RoleDiscoveryResult } from './RoleDiscoveryPipeline';
import { CompanyDiscoveryPipeline, type CompanyDiscoveryResult } from './CompanyDiscoveryPipeline';
import { PersonResearchPipeline, type PersonResearchResult } from './PersonResearchPipeline';
import { BuyerGroupDiscoveryPipeline, type BuyerGroupResult } from './BuyerGroupDiscoveryPipeline';
import type { RoleCriteria } from '../functions/validation/validateRoleCriteria';
import type { CompanyDiscoveryCriteria } from '../functions/validation/validateCompanyDiscoveryCriteria';
import type { PersonResearchRequest } from './PersonResearchPipeline';
import type { BuyerGroupInput } from './BuyerGroupDiscoveryPipeline';

import type { APIClients } from '../functions/types/api-clients';

/**
 * UNIFIED ORCHESTRATOR
 * Delegates to specialized pipelines
 */
export class UnifiedIntelligencePipeline {
  private roleDiscovery: RoleDiscoveryPipeline;
  private companyDiscovery: CompanyDiscoveryPipeline;
  private personResearch: PersonResearchPipeline;
  private buyerGroupDiscovery: BuyerGroupDiscoveryPipeline;

  constructor(apis: APIClients = {}) {
    this.roleDiscovery = new RoleDiscoveryPipeline(apis);
    this.companyDiscovery = new CompanyDiscoveryPipeline(apis);
    this.personResearch = new PersonResearchPipeline(apis);
    this.buyerGroupDiscovery = new BuyerGroupDiscoveryPipeline(apis);
  }

  /**
   * DISCOVER entities (roles, companies, buyer groups)
   */
  async discover(
    entityType: 'role' | 'company' | 'buyer_group',
    criteria: RoleCriteria | CompanyDiscoveryCriteria | BuyerGroupInput
  ): Promise<RoleDiscoveryResult | CompanyDiscoveryResult | BuyerGroupResult> {
    console.log(`\n🎯 [UNIFIED PIPELINE] DISCOVER ${entityType}`);

    try {
      switch (entityType) {
        case 'role':
          return await this.roleDiscovery.discover(criteria as RoleCriteria);

        case 'company':
          return await this.companyDiscovery.discover(criteria as CompanyDiscoveryCriteria);

        case 'buyer_group':
          return await this.buyerGroupDiscovery.discover(criteria as BuyerGroupInput);

        default:
          throw new Error(
            `Unknown entity type: ${entityType}. Use 'role', 'company', or 'buyer_group'`
          );
      }
    } catch (error) {
      console.error(`\n❌ [UNIFIED PIPELINE] Error:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * RESEARCH entities (deep intelligence)
   */
  async research(
    entityType: 'person' | 'company',
    criteria: PersonResearchRequest | CompanyDiscoveryCriteria
  ): Promise<PersonResearchResult | CompanyDiscoveryResult> {
    console.log(`\n🔬 [UNIFIED PIPELINE] RESEARCH ${entityType}`);

    try {
      switch (entityType) {
        case 'person':
          return await this.personResearch.research(criteria as PersonResearchRequest);

        case 'company':
          // Company research is just discovery with research level
          return await this.companyDiscovery.discover(criteria as CompanyDiscoveryCriteria);

        default:
          throw new Error(
            `Unknown entity type for research: ${entityType}. Use 'person' or 'company'`
          );
      }
    } catch (error) {
      console.error(`\n❌ [UNIFIED PIPELINE] Error:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * ENRICH entities (add contact information)
   */
  async enrich(
    entityType: 'person',
    entities: any[],
    enrichmentLevel: 'discover' | 'enrich' | 'research' = 'enrich'
  ): Promise<{ success: boolean; error?: string }> {
    console.log(`\n📧 [UNIFIED PIPELINE] ENRICH ${entityType}`);

    // TODO: Implement enrichment workflow
    return {
      success: false,
      error: 'Enrichment not yet implemented in unified pipeline'
    };
  }

  /**
   * Execute any pipeline action
   */
  async execute(request: {
    action: 'discover' | 'research' | 'enrich';
    entityType: string;
    criteria: any;
  }): Promise<any> {
    const { action, entityType, criteria } = request;

    switch (action) {
      case 'discover':
        return await this.discover(entityType as any, criteria);

      case 'research':
        return await this.research(entityType as any, criteria);

      case 'enrich':
        return await this.enrich(entityType as any, criteria.entities, criteria.enrichmentLevel);

      default:
        return {
          success: false,
          error: `Unknown action: ${action}. Use 'discover', 'research', or 'enrich'`
        };
    }
  }
}

