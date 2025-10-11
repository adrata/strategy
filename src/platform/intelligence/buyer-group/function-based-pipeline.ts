/**
 * FUNCTION-BASED BUYER GROUP PIPELINE
 * 
 * Refactored buyer group pipeline using pure functions and orchestration
 * This demonstrates how to convert class-based pipelines to function-based
 */

import { 
  FunctionOrchestrator, 
  PipelineStep, 
  PipelineContext,
  PipelineResult 
} from '../shared/orchestration';
import type { EnrichmentLevel, BuyerGroup, EnrichmentRequest } from '../shared/types';

// ============================================================================
// BUYER GROUP PIPELINE STEPS (PURE FUNCTIONS)
// ============================================================================

/**
 * Step 1: Validate and normalize company input
 */
export const validateCompanyStep: PipelineStep<EnrichmentRequest, EnrichmentRequest> = {
  name: 'validateCompany',
  description: 'Validate and normalize company input',
  execute: async (request, context) => {
    console.log(`🔍 Validating company: ${request.companyName}`);
    
    // Validation logic
    if (!request.companyName || request.companyName.trim().length < 2) {
      throw new Error('Company name must be at least 2 characters');
    }

    // Normalize input
    return {
      ...request,
      companyName: request.companyName.trim(),
      website: request.website?.trim() || undefined
    };
  }
};

/**
 * Step 2: Check cache for existing buyer group
 */
export const checkCacheStep: PipelineStep<EnrichmentRequest, { request: EnrichmentRequest; cached?: BuyerGroup }> = {
  name: 'checkCache',
  description: 'Check cache for existing buyer group data',
  execute: async (request, context) => {
    console.log(`💾 Checking cache for: ${request.companyName}`);
    
    // Mock cache check - replace with actual cache implementation
    const cacheKey = `${request.companyName.toLowerCase()}:${request.enrichmentLevel}`;
    
    // In real implementation, check Redis/Memory cache
    const cached = null; // await cache.get(cacheKey);
    
    if (cached) {
      console.log(`✅ Cache hit for ${request.companyName}`);
      return { request, cached };
    }
    
    console.log(`❌ Cache miss for ${request.companyName}`);
    return { request };
  }
};

/**
 * Step 3: Resolve company information
 */
export const resolveCompanyStep: PipelineStep<{ request: EnrichmentRequest; cached?: BuyerGroup }, any> = {
  name: 'resolveCompany',
  description: 'Resolve company details from CoreSignal/PDL',
  execute: async (input, context) => {
    if (input.cached) {
      console.log(`⏭️ Using cached company data for: ${input.request.companyName}`);
      return { ...input, company: input.cached };
    }

    console.log(`🏢 Resolving company: ${input.request.companyName}`);
    
    // Mock implementation - replace with actual CoreSignal API call
    const company = {
      name: input.request.companyName,
      website: input.request.website || `https://${input.request.companyName.toLowerCase()}.com`,
      industry: 'Technology',
      size: '1000-5000',
      employees: 2500,
      revenue: '$100M-$500M'
    };

    return { ...input, company };
  }
};

/**
 * Step 4: Discover buyer group members
 */
export const discoverMembersStep: PipelineStep<any, any> = {
  name: 'discoverMembers',
  description: 'Discover buyer group members using CoreSignal',
  execute: async (input, context) => {
    if (input.cached) {
      console.log(`⏭️ Using cached buyer group for: ${input.request.companyName}`);
      return { ...input, buyerGroup: input.cached };
    }

    console.log(`👥 Discovering buyer group for: ${input.company.name}`);
    
    // Mock implementation - replace with actual buyer group discovery
    const members = [
      { 
        name: 'Amy Weaver', 
        title: 'CFO', 
        role: 'decision' as const, 
        confidence: 95,
        influenceScore: 90
      },
      { 
        name: 'Marc Benioff', 
        title: 'CEO', 
        role: 'decision' as const, 
        confidence: 98,
        influenceScore: 95
      },
      { 
        name: 'Sarah Franklin', 
        title: 'CMO', 
        role: 'champion' as const, 
        confidence: 88,
        influenceScore: 85
      },
      { 
        name: 'Parker Harris', 
        title: 'CTO', 
        role: 'stakeholder' as const, 
        confidence: 82,
        influenceScore: 80
      }
    ];

    const buyerGroup: BuyerGroup = {
      companyName: input.company.name,
      website: input.company.website,
      industry: input.company.industry,
      companySize: input.company.size,
      totalMembers: members.length,
      cohesionScore: 8.5,
      overallConfidence: 90,
      roles: {
        decision: members.filter(m => m.role === 'decision'),
        champion: members.filter(m => m.role === 'champion'),
        stakeholder: members.filter(m => m.role === 'stakeholder'),
        blocker: [],
        introducer: []
      },
      members
    };

    return { ...input, buyerGroup };
  }
};

/**
 * Step 5: Enrich contacts (conditional)
 */
export const enrichContactsStep: PipelineStep<any, any> = {
  name: 'enrichContacts',
  description: 'Enrich member contacts with email, phone, LinkedIn',
  execute: async (input, context) => {
    if (context.enrichmentLevel === 'identify') {
      console.log(`⏭️ Skipping contact enrichment (identify level)`);
      return input;
    }

    if (input.cached && input.cached.members[0]?.email) {
      console.log(`⏭️ Using cached contact data for: ${input.request.companyName}`);
      return input;
    }

    console.log(`📧 Enriching contacts for ${input.buyerGroup.totalMembers} members`);
    
    // Mock implementation - replace with actual Lusha/PDL API calls
    const enrichedMembers = input.buyerGroup.members.map(member => ({
      ...member,
      email: `${member.name.toLowerCase().replace(' ', '.')}@${input.company.name.toLowerCase()}.com`,
      phone: '+1-555-0123',
      linkedin: `https://linkedin.com/in/${member.name.toLowerCase().replace(' ', '')}`
    }));

    const enrichedBuyerGroup: BuyerGroup = {
      ...input.buyerGroup,
      members: enrichedMembers,
      roles: {
        decision: enrichedMembers.filter(m => m.role === 'decision'),
        champion: enrichedMembers.filter(m => m.role === 'champion'),
        stakeholder: enrichedMembers.filter(m => m.role === 'stakeholder'),
        blocker: [],
        introducer: []
      }
    };

    return { ...input, buyerGroup: enrichedBuyerGroup };
  }
};

/**
 * Step 6: Deep research (conditional)
 */
export const deepResearchStep: PipelineStep<any, any> = {
  name: 'deepResearch',
  description: 'Perform deep research on buyer group members',
  execute: async (input, context) => {
    if (context.enrichmentLevel !== 'deep_research') {
      console.log(`⏭️ Skipping deep research (${context.enrichmentLevel} level)`);
      return input;
    }

    console.log(`🔬 Performing deep research on ${input.buyerGroup.totalMembers} members`);
    
    // Mock implementation - replace with actual Perplexity/AI research
    const researchedMembers = input.buyerGroup.members.map(member => ({
      ...member,
      careerAnalysis: {
        trajectory: 'rising_star' as const,
        averageTenure: 24,
        previousCompanies: ['Previous Corp', 'Another Inc'],
        expertise: ['Finance', 'Strategy'],
        thoughtLeadership: true
      },
      relationships: {
        internalConnections: 5,
        externalConnections: 12,
        mutualConnections: 3
      },
      buyingSignals: [
        { 
          type: 'hiring' as const, 
          description: 'Recently hired 3 new team members', 
          strength: 75,
          date: new Date().toISOString(),
          source: 'LinkedIn'
        }
      ]
    }));

    return { ...input, buyerGroup: { ...input.buyerGroup, members: researchedMembers } };
  }
};

/**
 * Step 7: Save to database
 */
export const saveToDatabaseStep: PipelineStep<any, any> = {
  name: 'saveToDatabase',
  description: 'Save buyer group to database',
  execute: async (input, context) => {
    console.log(`💾 Saving buyer group to database`);
    
    // Mock implementation - replace with actual Prisma database save
    const databaseId = `bg_${Date.now()}`;
    
    // In real implementation:
    // await prisma.people.updateMany({ ... })
    
    return { 
      ...input, 
      databaseId,
      savedAt: new Date().toISOString()
    };
  }
};

/**
 * Step 8: Update cache
 */
export const updateCacheStep: PipelineStep<any, any> = {
  name: 'updateCache',
  description: 'Update cache with new buyer group data',
  execute: async (input, context) => {
    console.log(`💾 Updating cache for: ${input.request.companyName}`);
    
    // Mock implementation - replace with actual cache update
    const cacheKey = `${input.request.companyName.toLowerCase()}:${input.request.enrichmentLevel}`;
    
    // In real implementation:
    // await cache.set(cacheKey, input.buyerGroup, { ttl: 3600 });
    
    return input;
  }
};

// ============================================================================
// FUNCTION-BASED BUYER GROUP ENGINE
// ============================================================================

export class FunctionBasedBuyerGroupEngine {
  private orchestrator: FunctionOrchestrator;

  constructor(context: PipelineContext) {
    this.orchestrator = new FunctionOrchestrator(context);
    this.registerSteps();
  }

  private registerSteps(): void {
    this.orchestrator
      .registerStep(validateCompanyStep)
      .registerStep(checkCacheStep)
      .registerStep(resolveCompanyStep)
      .registerStep(discoverMembersStep)
      .registerStep(enrichContactsStep)
      .registerStep(deepResearchStep)
      .registerStep(saveToDatabaseStep)
      .registerStep(updateCacheStep);
  }

  /**
   * Discover buyer group using function-based orchestration
   */
  async discover(request: EnrichmentRequest): Promise<PipelineResult<BuyerGroup>> {
    const startTime = Date.now();
    
    try {
      console.log(`\n🎯 [FUNCTION PIPELINE] Starting discovery for: ${request.companyName}`);
      console.log(`   Enrichment Level: ${request.enrichmentLevel}`);
      
      // Execute the complete workflow
      const result = await this.orchestrator.executeSequence([
        'validateCompany',
        'checkCache',
        'resolveCompany', 
        'discoverMembers',
        'enrichContacts',
        'deepResearch',
        'saveToDatabase',
        'updateCache'
      ], request);

      const executionTime = Date.now() - startTime;
      
      console.log(`✅ [FUNCTION PIPELINE] Discovery complete in ${executionTime}ms`);
      
      return {
        success: true,
        data: result.buyerGroup,
        metadata: {
          executionTime,
          stepsExecuted: [
            'validateCompany',
            'checkCache', 
            'resolveCompany',
            'discoverMembers',
            'enrichContacts',
            'deepResearch',
            'saveToDatabase',
            'updateCache'
          ],
          cacheHits: result.cached ? 1 : 0,
          apiCalls: {
            coresignal: 1,
            lusha: request.enrichmentLevel !== 'identify' ? result.buyerGroup.totalMembers : 0,
            zerobounce: request.enrichmentLevel !== 'identify' ? result.buyerGroup.totalMembers : 0,
            perplexity: request.enrichmentLevel === 'deep_research' ? result.buyerGroup.totalMembers : 0
          },
          costEstimate: this.calculateCost(request.enrichmentLevel, result.buyerGroup.totalMembers)
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      console.error(`❌ [FUNCTION PIPELINE] Discovery failed after ${executionTime}ms:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          executionTime,
          stepsExecuted: [],
          cacheHits: 0,
          apiCalls: {},
          costEstimate: 0
        }
      };
    }
  }

  /**
   * Batch process multiple companies
   */
  async discoverBatch(requests: EnrichmentRequest[]): Promise<PipelineResult<BuyerGroup[]>> {
    const startTime = Date.now();
    const results: BuyerGroup[] = [];
    
    try {
      console.log(`\n🚀 [FUNCTION PIPELINE] Batch processing ${requests.length} companies`);
      
      // Process in parallel with concurrency control
      const BATCH_SIZE = 3;
      for (let i = 0; i < requests.length; i += BATCH_SIZE) {
        const batch = requests.slice(i, i + BATCH_SIZE);
        
        const batchPromises = batch.map(async (request) => {
          const result = await this.discover(request);
          return result.success ? result.data : null;
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults.filter((r): r is BuyerGroup => r !== null));
        
        // Rate limiting between batches
        if (i + BATCH_SIZE < requests.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        data: results,
        metadata: {
          executionTime,
          stepsExecuted: ['batchProcessing'],
          cacheHits: 0,
          apiCalls: {
            coresignal: requests.length,
            lusha: results.reduce((sum, bg) => sum + bg.totalMembers, 0),
            zerobounce: results.reduce((sum, bg) => sum + bg.totalMembers, 0)
          },
          costEstimate: results.reduce((sum, bg) => sum + this.calculateCost('enrich', bg.totalMembers), 0)
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          executionTime,
          stepsExecuted: [],
          cacheHits: 0,
          apiCalls: {},
          costEstimate: 0
        }
      };
    }
  }

  /**
   * Calculate cost based on enrichment level and member count
   */
  private calculateCost(enrichmentLevel: EnrichmentLevel, memberCount: number): number {
    switch (enrichmentLevel) {
      case 'identify':
        return 0.10; // CoreSignal only
      case 'enrich':
        return 0.10 + (memberCount * 0.15) + (memberCount * 0.02); // CoreSignal + Lusha + ZeroBounce
      case 'deep_research':
        return 0.10 + (memberCount * 0.15) + (memberCount * 0.02) + (memberCount * 0.25); // + AI research
      default:
        return 0;
    }
  }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example: Single company discovery
 */
export async function exampleSingleCompany() {
  const context: PipelineContext = {
    workspaceId: 'workspace-123',
    userId: 'user-456',
    enrichmentLevel: 'enrich',
    config: { maxParallel: 3 },
    metadata: {
      startTime: Date.now(),
      stepCount: 0,
      currentStep: ''
    }
  };

  const engine = new FunctionBasedBuyerGroupEngine(context);
  
  const result = await engine.discover({
    companyName: 'Salesforce',
    website: 'https://salesforce.com',
    enrichmentLevel: 'enrich',
    workspaceId: 'workspace-123'
  });

  console.log('Single Company Result:', result);
}

/**
 * Example: Batch processing
 */
export async function exampleBatchProcessing() {
  const context: PipelineContext = {
    workspaceId: 'workspace-123',
    userId: 'user-456',
    enrichmentLevel: 'identify',
    config: { maxParallel: 3 },
    metadata: {
      startTime: Date.now(),
      stepCount: 0,
      currentStep: ''
    }
  };

  const engine = new FunctionBasedBuyerGroupEngine(context);
  
  const result = await engine.discoverBatch([
    { companyName: 'Salesforce', enrichmentLevel: 'identify', workspaceId: 'workspace-123' },
    { companyName: 'HubSpot', enrichmentLevel: 'identify', workspaceId: 'workspace-123' },
    { companyName: 'Dell', enrichmentLevel: 'identify', workspaceId: 'workspace-123' }
  ]);

  console.log('Batch Processing Result:', result);
}

// Export for use in other modules
export {
  FunctionBasedBuyerGroupEngine,
  validateCompanyStep,
  checkCacheStep,
  resolveCompanyStep,
  discoverMembersStep,
  enrichContactsStep,
  deepResearchStep,
  saveToDatabaseStep,
  updateCacheStep
};
