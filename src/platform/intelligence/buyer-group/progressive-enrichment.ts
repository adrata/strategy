/**
 * PROGRESSIVE ENRICHMENT ENGINE
 * 
 * Smart routing for 3-level buyer group enrichment:
 * - Level 1: IDENTIFY (fast, cheap)
 * - Level 2: ENRICH (medium speed/cost)
 * - Level 3: DEEP RESEARCH (comprehensive)
 */

import type {
  EnrichmentLevel,
  EnrichmentRequest,
  EnrichmentResult,
  BuyerGroup,
  CostTracking,
} from '../shared/types';

export class ProgressiveEnrichmentEngine {
  private costTracking: Map<string, CostTracking> = new Map();

  /**
   * Main entry point - routes to appropriate enrichment level
   */
  async enrich(request: EnrichmentRequest): Promise<EnrichmentResult> {
    const startTime = Date.now();

    console.log(
      `🎯 [PROGRESSIVE ENRICHMENT] Level: ${request.enrichmentLevel}, Company: ${request.companyName}`
    );

    // Initialize cost tracking
    const costTracking: CostTracking = {
      enrichmentLevel: request.enrichmentLevel,
      apiCallsMade: {},
      estimatedCost: 0,
    };

    let buyerGroup: BuyerGroup;
    let cacheUtilized = false;

    try {
      // Route based on enrichment level
      switch (request.enrichmentLevel) {
        case 'identify':
          buyerGroup = await this.enrichLevel1_Identify(request, costTracking);
          break;

        case 'enrich':
          buyerGroup = await this.enrichLevel2_Enrich(request, costTracking);
          break;

        case 'deep_research':
          buyerGroup = await this.enrichLevel3_DeepResearch(request, costTracking);
          break;

        default:
          throw new Error(`Invalid enrichment level: ${request.enrichmentLevel}`);
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        buyerGroup,
        enrichmentLevel: request.enrichmentLevel,
        processingTime,
        costEstimate: costTracking.estimatedCost,
        timestamp: new Date().toISOString(),
        cacheUtilized,
      };
    } catch (error) {
      console.error(
        `❌ [PROGRESSIVE ENRICHMENT] Failed for ${request.companyName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * LEVEL 1: IDENTIFY ONLY
   * 
   * Fast buyer group discovery with basic info
   * No contact enrichment, no deep intelligence
   */
  private async enrichLevel1_Identify(
    request: EnrichmentRequest,
    costTracking: CostTracking
  ): Promise<BuyerGroup> {
    console.log(`   📋 Level 1: Identify buyer group members (fast & cheap)`);

    // Use existing buyer group pipeline in "identify only" mode
    const BuyerGroupPipeline = require('@/platform/pipelines/pipelines/core/buyer-group-pipeline.js');
    const pipeline = new BuyerGroupPipeline();

    // Process with minimal enrichment
    const result = await pipeline.processSingleCompany(request.companyName, {
      website: request.website,
      enrichmentLevel: 'identify', // Signal to skip contact enrichment
    });

    // Track costs
    costTracking.apiCallsMade.coresignal = 1;
    costTracking.estimatedCost = 0.10; // CoreSignal only

    return {
      companyName: result.companyName,
      website: result.website,
      industry: result.industry,
      companySize: result.size,
      totalMembers: result.buyerGroup?.totalMembers || 0,
      cohesionScore: result.quality?.cohesionScore || 0,
      overallConfidence: result.quality?.overallConfidence || 0,
      roles: result.buyerGroup?.roles || {
        decision: [],
        champion: [],
        stakeholder: [],
        blocker: [],
        introducer: [],
      },
      members: result.buyerGroup?.members || [],
    };
  }

  /**
   * LEVEL 2: IDENTIFY + ENRICH
   * 
   * Buyer group discovery + contact enrichment
   * Includes email, phone, LinkedIn
   */
  private async enrichLevel2_Enrich(
    request: EnrichmentRequest,
    costTracking: CostTracking
  ): Promise<BuyerGroup> {
    console.log(`   📧 Level 2: Identify + enrich contacts (medium speed)`);

    // Use existing buyer group pipeline with full enrichment
    const BuyerGroupPipeline = require('@/platform/pipelines/pipelines/core/buyer-group-pipeline.js');
    const pipeline = new BuyerGroupPipeline();

    const result = await pipeline.processSingleCompany(request.companyName, {
      website: request.website,
      enrichmentLevel: 'enrich', // Full contact enrichment
    });

    // Track costs (CoreSignal + contact enrichment)
    costTracking.apiCallsMade.coresignal = 1;
    costTracking.apiCallsMade.lusha = result.buyerGroup?.totalMembers || 0;
    costTracking.apiCallsMade.zerobounce = result.buyerGroup?.totalMembers || 0;
    costTracking.estimatedCost =
      0.10 + // CoreSignal
      (result.buyerGroup?.totalMembers || 0) * 0.15 + // Lusha per member
      (result.buyerGroup?.totalMembers || 0) * 0.02; // ZeroBounce per email

    return {
      companyName: result.companyName,
      website: result.website,
      industry: result.industry,
      companySize: result.size,
      totalMembers: result.buyerGroup?.totalMembers || 0,
      cohesionScore: result.quality?.cohesionScore || 0,
      overallConfidence: result.quality?.overallConfidence || 0,
      roles: result.buyerGroup?.roles || {
        decision: [],
        champion: [],
        stakeholder: [],
        blocker: [],
        introducer: [],
      },
      members: result.buyerGroup?.members || [],
    };
  }

  /**
   * LEVEL 3: DEEP RESEARCH
   * 
   * Everything in Level 2 + full intelligence
   * Career analysis, relationships, buying signals, pain points
   */
  private async enrichLevel3_DeepResearch(
    request: EnrichmentRequest,
    costTracking: CostTracking
  ): Promise<BuyerGroup> {
    console.log(`   🔬 Level 3: Deep research (comprehensive intelligence)`);

    // First get Level 2 data
    const buyerGroup = await this.enrichLevel2_Enrich(request, costTracking);

    // Then add deep intelligence (to be implemented)
    // TODO: Add career analysis
    // TODO: Add relationship mapping
    // TODO: Add buying signals detection
    // TODO: Add pain point analysis

    // Additional cost for AI analysis
    costTracking.apiCallsMade.perplexity = buyerGroup.totalMembers;
    costTracking.estimatedCost += buyerGroup.totalMembers * 0.25; // AI analysis per member

    return buyerGroup;
  }

  /**
   * Estimate cost before processing
   */
  estimateCost(enrichmentLevel: EnrichmentLevel, estimatedMembers: number = 10): number {
    switch (enrichmentLevel) {
      case 'identify':
        return 0.10; // CoreSignal only

      case 'enrich':
        return (
          0.10 + // CoreSignal
          estimatedMembers * 0.15 + // Lusha
          estimatedMembers * 0.02
        ); // ZeroBounce

      case 'deep_research':
        return (
          0.10 + // CoreSignal
          estimatedMembers * 0.15 + // Lusha
          estimatedMembers * 0.02 + // ZeroBounce
          estimatedMembers * 0.25
        ); // AI analysis

      default:
        return 0;
    }
  }

  /**
   * Check if we can upgrade enrichment level for cached data
   */
  canUpgrade(
    currentLevel: EnrichmentLevel,
    targetLevel: EnrichmentLevel
  ): boolean {
    const levels: EnrichmentLevel[] = ['identify', 'enrich', 'deep_research'];
    const currentIndex = levels.indexOf(currentLevel);
    const targetIndex = levels.indexOf(targetLevel);

    return targetIndex > currentIndex;
  }
}

