/**
 * 🤖 ADAPTIVE PROCESSOR
 * 
 * Intelligently determines research depth and strategy based on:
 * - Account importance and type
 * - Available data gaps
 * - Cost constraints
 * - User preferences
 */

import { 
  ResearchRequest, 
  ResearchPlan, 
  ResearchStage,
  AccountInput,
  ExecutiveRole,
  APIConfig
} from '../types/intelligence';

export class AdaptiveProcessor {
  private config: APIConfig;

  constructor(config: APIConfig) {
    this['config'] = config;
  }

  /**
   * 🎯 CREATE ADAPTIVE RESEARCH PLAN
   * 
   * Analyzes the request and creates an optimal research strategy
   */
  async createResearchPlan(request: ResearchRequest): Promise<ResearchPlan> {
    console.log(`🤖 [ADAPTIVE] Creating plan for ${request.accounts.length} accounts, depth: ${request.researchDepth}`);

    const plan: ResearchPlan = {
      stages: [],
      estimatedCost: 0,
      estimatedTimeMs: 0,
      confidence: 0,
      reasoning: ''
    };

    // Step 1: Analyze account context
    const accountAnalysis = await this.analyzeAccounts(request.accounts);
    
    // Step 2: Determine research depth strategy
    const depthStrategy = this.determineDepthStrategy(request, accountAnalysis);
    
    // Step 3: Build research stages based on strategy
    plan['stages'] = await this.buildResearchStages(request, depthStrategy);
    
    // Step 4: Calculate estimates
    plan['estimatedCost'] = this.calculateEstimatedCost(plan.stages, request.accounts.length);
    plan['estimatedTimeMs'] = this.calculateEstimatedTime(plan.stages, request.accounts.length);
    plan['confidence'] = this.estimateConfidence(plan.stages, depthStrategy);
    plan['reasoning'] = this.generateReasoningExplanation(depthStrategy, plan);

    console.log(`📋 [ADAPTIVE] Plan created: ${plan.stages.length} stages, $${plan.estimatedCost.toFixed(2)}, ${Math.round(plan.estimatedTimeMs/1000)}s`);
    
    return plan;
  }

  /**
   * 🔍 ANALYZE ACCOUNTS
   */
  private async analyzeAccounts(accounts: AccountInput[]): Promise<{
    strategicCount: number;
    highValueCount: number;
    standardCount: number;
    prospectCount: number;
    missingDataGaps: string[];
    industries: string[];
  }> {
    const analysis = {
      strategicCount: 0,
      highValueCount: 0,
      standardCount: 0,
      prospectCount: 0,
      missingDataGaps: [] as string[],
      industries: [] as string[]
    };

    for (const account of accounts) {
      // Count by importance
      switch (account.importance) {
        case 'strategic':
          analysis.strategicCount++;
          break;
        case 'high_value':
          analysis.highValueCount++;
          break;
        case 'prospect':
          analysis.prospectCount++;
          break;
        default:
          analysis.standardCount++;
      }

      // Identify data gaps
      if (!account['website'] && !account.domain) {
        analysis.missingDataGaps.push('domain');
      }
      if (!account.industry) {
        analysis.missingDataGaps.push('industry');
      }

      // Collect industries
      if (account['industry'] && !analysis.industries.includes(account.industry)) {
        analysis.industries.push(account.industry);
      }
    }

    return analysis;
  }

  /**
   * 🎯 DETERMINE DEPTH STRATEGY
   */
  private determineDepthStrategy(request: ResearchRequest, analysis: any): {
    actualDepth: string;
    reasoning: string[];
    priorityAccounts: string[];
    costBudget: number;
  } {
    const reasoning: string[] = [];
    let actualDepth = request.researchDepth;
    let costBudget = request.maxCostPerAccount || 2.0; // Default $2 per account

    // Auto depth determination
    if (request['researchDepth'] === 'auto') {
      if (analysis.strategicCount > 0) {
        actualDepth = 'comprehensive';
        reasoning.push(`${analysis.strategicCount} strategic accounts detected - using comprehensive research`);
      } else if (analysis.highValueCount > 0) {
        actualDepth = 'thorough';
        reasoning.push(`${analysis.highValueCount} high-value accounts detected - using thorough research`);
      } else if (analysis['prospectCount'] === request.accounts.length) {
        actualDepth = 'quick';
        reasoning.push('All accounts are prospects - using quick research for cost efficiency');
        costBudget = 0.5; // Lower budget for prospects
      } else {
        actualDepth = 'thorough';
        reasoning.push('Mixed account types - using thorough research as balanced approach');
      }
    }

    // Adjust based on urgency
    if (request['urgency'] === 'realtime' && actualDepth === 'comprehensive') {
      actualDepth = 'thorough';
      reasoning.push('Real-time urgency - reducing depth to thorough for speed');
    }

    // Identify priority accounts
    const priorityAccounts = request.accounts
      .filter(a => a['importance'] === 'strategic' || a['importance'] === 'high_value')
      .map(a => a.id || a.name);

    return {
      actualDepth,
      reasoning,
      priorityAccounts,
      costBudget
    };
  }

  /**
   * 🏗️ BUILD RESEARCH STAGES
   */
  private async buildResearchStages(
    request: ResearchRequest, 
    strategy: any
  ): Promise<ResearchStage[]> {
    const stages: ResearchStage[] = [];

    // Stage 1: Always start with cache lookup
    stages.push({
      name: 'cache_lookup',
      modules: ['UnifiedCache'],
      apis: [],
      estimatedCost: 0,
      estimatedTimeMs: 100,
      priority: 1
    });

    // Stage 2: Basic company resolution
    stages.push({
      name: 'company_resolution',
      modules: ['CompanyResolver'],
      apis: ['perplexity'],
      estimatedCost: 0.02,
      estimatedTimeMs: 2000,
      priority: 2
    });

    // Stage 3: Executive discovery based on depth
    if (strategy['actualDepth'] === 'quick') {
      stages.push({
        name: 'quick_executive_research',
        modules: ['ExecutiveResearch'],
        apis: ['perplexity'],
        estimatedCost: 0.05,
        estimatedTimeMs: 3000,
        priority: 3
      });
    } else if (strategy['actualDepth'] === 'thorough') {
      stages.push({
        name: 'thorough_executive_research',
        modules: ['ExecutiveResearch', 'ContactIntelligence', 'ValidationEngine'],
        apis: ['perplexity', 'lusha', 'zerobounce'],
        estimatedCost: 0.25,
        estimatedTimeMs: 6000,
        priority: 3
      });
    } else if (strategy['actualDepth'] === 'comprehensive') {
      stages.push({
        name: 'comprehensive_executive_research',
        modules: ['ExecutiveResearch', 'ContactIntelligence', 'ValidationEngine', 'BuyerGroupAnalysis'],
        apis: ['perplexity', 'lusha', 'coresignal', 'zerobounce', 'prospeo'],
        estimatedCost: 0.50,
        estimatedTimeMs: 10000,
        priority: 3
      });
    }

    // Stage 4: Contact validation (for thorough+ research)
    if (strategy.actualDepth !== 'quick') {
      stages.push({
        name: 'contact_validation',
        modules: ['ValidationEngine'],
        apis: ['zerobounce', 'prospeo'],
        estimatedCost: 0.08,
        estimatedTimeMs: 2000,
        priority: 4
      });
    }

    // Stage 5: Buyer group analysis (comprehensive only)
    if (strategy['actualDepth'] === 'comprehensive') {
      stages.push({
        name: 'buyer_group_analysis',
        modules: ['BuyerGroupAnalysis'],
        apis: ['openai'],
        estimatedCost: 0.25,
        estimatedTimeMs: 4000,
        priority: 5
      });
    }

    return stages;
  }

  /**
   * 💰 CALCULATE ESTIMATED COST
   */
  private calculateEstimatedCost(stages: ResearchStage[], accountCount: number): number {
    const baseCost = stages.reduce((sum, stage) => sum + stage.estimatedCost, 0);
    return baseCost * accountCount;
  }

  /**
   * ⏱️ CALCULATE ESTIMATED TIME
   */
  private calculateEstimatedTime(stages: ResearchStage[], accountCount: number): number {
    // Account for parallel processing
    const parallelFactor = Math.min(accountCount, this.config.MAX_PARALLEL_COMPANIES);
    const baseTime = stages.reduce((sum, stage) => sum + stage.estimatedTimeMs, 0);
    
    // Time = (total work / parallel factor) + overhead
    return Math.round((baseTime * accountCount) / parallelFactor) + 1000; // 1s overhead
  }

  /**
   * 📊 ESTIMATE CONFIDENCE
   */
  private estimateConfidence(stages: ResearchStage[], strategy: any): number {
    let confidence = 70; // Base confidence

    // Adjust based on research depth
    switch (strategy.actualDepth) {
      case 'quick':
        confidence = 75;
        break;
      case 'thorough':
        confidence = 90;
        break;
      case 'comprehensive':
        confidence = 95;
        break;
    }

    // Adjust based on stages
    if (stages.some(s => s['name'] === 'contact_validation')) {
      confidence += 5;
    }
    if (stages.some(s => s['name'] === 'buyer_group_analysis')) {
      confidence += 3;
    }

    return Math.min(confidence, 98); // Cap at 98%
  }

  /**
   * 📝 GENERATE REASONING EXPLANATION
   */
  private generateReasoningExplanation(strategy: any, plan: ResearchPlan): string {
    const parts: string[] = [];
    
    parts.push(`Research depth: ${strategy.actualDepth}`);
    parts.push(`${plan.stages.length} stage research plan`);
    parts.push(`Estimated cost: $${plan.estimatedCost.toFixed(2)}`);
    parts.push(`Expected confidence: ${plan.confidence}%`);
    
    if (strategy.reasoning.length > 0) {
      parts.push('Strategy reasoning: ' + strategy.reasoning.join('; '));
    }

    return parts.join(' | ');
  }

  /**
   * 🎯 GET ROLE-SPECIFIC RESEARCH PRIORITY
   */
  getRolePriority(role: ExecutiveRole): number {
    const priorities: Record<string, number> = {
      'CFO': 10,
      'CRO': 10,
      'CEO': 9,
      'CTO': 8,
      'COO': 8,
      'CMO': 7,
      'VP_Finance': 6,
      'VP_Sales': 6,
      'VP_Engineering': 5,
      'VP_Marketing': 5,
      'Director_Finance': 4,
      'Director_Sales': 4,
      'Head_of_Sales': 4,
      'Controller': 3,
      'Treasurer': 3,
      'Decision_Maker': 10,
      'Buyer': 8,
      'Influencer': 6
    };

    return priorities[role] || 5;
  }

  /**
   * 🔍 SHOULD SKIP STAGE
   */
  shouldSkipStage(stage: ResearchStage, context: any): boolean {
    // Skip expensive stages for low-priority accounts
    if (stage.estimatedCost > 0.2 && context['accountImportance'] === 'prospect') {
      return true;
    }

    // Skip buyer group analysis for quick research
    if (stage['name'] === 'buyer_group_analysis' && context['researchDepth'] === 'quick') {
      return true;
    }

    return false;
  }
}
