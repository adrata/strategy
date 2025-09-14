/**
 * 🤖 BUYER GROUP ANALYSIS MODULE
 * 
 * AI-powered buyer group discovery that dynamically determines:
 * - Decision makers (budget authority)
 * - Champions (internal advocates) 
 * - Influencers (provide input and recommendations)
 * - Blockers (can delay decisions)
 * - Sales strategy and approach recommendations
 */

import { ExecutiveContact, APIConfig, BuyerGroupInsight } from '../types/intelligence';

// Ensure fetch is available
if (typeof fetch === 'undefined') {
  global['fetch'] = require('node-fetch');
}

interface CompanyContext {
  companyName: string;
  industry?: string;
  size?: string;
  website?: string;
  revenue?: string;
  dealSize?: number;
  dealType?: string;
}

interface UserContext {
  userId: string;
  workspaceId: string;
  userCompany?: {
    name: string;
    industry: string;
    products: string[];
    targetMarket: string;
  };
  sellingContext?: {
    productCategory: string;
    averageDealSize: number;
    salesCycle: string;
    targetRoles: string[];
  };
}

interface BuyerGroupRole {
  role: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  influence: string;
  concerns: string[];
  decisionCriteria: string[];
}

interface RoleHierarchyMap {
  sales: string[];
  technology: string[];
  finance: string[];
  operations: string[];
  executive: string[];
}

interface EnhancedContextAnalysis {
  industry: string;
  businessModel: string;
  decisionMakingStyle: string;
  buyingProcess: string;
  keyStakeholders: string[];
  budgetAuthority: string;
  decisionFactors: string[];
  roleHierarchy: RoleHierarchyMap;
  confidence: number;
  rolePrecisionScore: number;
}

export class BuyerGroupAnalysis {
  private config: APIConfig;
  private stats = {
    companiesAnalyzed: 0,
    buyerGroupsGenerated: 0,
    rolesIdentified: 0,
    aiCallsMade: 0,
    errors: 0
  };

  constructor(config: APIConfig) {
    this['config'] = config;
    
    console.log('🤖 [BUYER GROUP ANALYSIS] Module initialized');
    console.log(`   Perplexity AI: ${this.config.PERPLEXITY_API_KEY ? 'Available' : 'Missing'}`);
    console.log(`   OpenAI: ${this.config.OPENAI_API_KEY ? 'Available' : 'Missing'}`);
  }

  /**
   * 🎯 ANALYZE BUYER GROUP FOR COMPANY (CONTEXT-AWARE)
   */
  async analyzeBuyerGroup(
    executives: ExecutiveContact[],
    companyContext: CompanyContext,
    userContext?: UserContext
  ): Promise<BuyerGroupInsight> {
    console.log(`\n🤖 [BUYER GROUP] Analyzing buyer group for: ${companyContext.companyName}`);
    
    try {
      // Step 1: Get user selling context (what they're selling)
      const sellingContext = userContext ? await this.getUserSellingContext(userContext) : null;
      
      // Step 2: Analyze company context with AI (enhanced with selling context)
      const contextAnalysis = await this.analyzeCompanyContext(companyContext, sellingContext);
      
      // Step 3: Determine buyer group roles (context-aware)
      const buyerGroupRoles = await this.determineBuyerGroupRoles(contextAnalysis, sellingContext);
      
      // Step 4: Map executives to buyer group roles
      let mappedBuyerGroup = this.mapExecutivesToBuyerGroup(executives, buyerGroupRoles);
      
      // Step 4.5: Dynamic Waterfall for missing critical roles
      if (!mappedBuyerGroup['decisionMaker'] && executives.length > 0) {
        console.log('🌊 [WATERFALL] No decision maker found, using dynamic waterfall...');
        const { DynamicWaterfallEngine } = await import('./DynamicWaterfallEngine');
        const waterfall = new DynamicWaterfallEngine(this.config);
        
        const alternative = await waterfall.findBestAlternative(
          'CFO',
          executives,
          companyContext.companyName,
          { size: companyContext.dealSize || 100000, productCategory: sellingContext?.productCategory || 'software' }
        );
        
        if (alternative) {
          mappedBuyerGroup['decisionMaker'] = alternative.executive;
          console.log(`   ✅ Waterfall decision maker: ${alternative.executive.name} (${alternative.reasoning})`);
        }
      }
      
      // Step 5: Generate context-aware sales strategy with seller optimization
      const salesStrategy = await this.generateSalesStrategy(mappedBuyerGroup, companyContext, sellingContext);
      
      // Step 6: Optimize for seller skill level (Dano is expert level)
      if (userContext?.sellingContext?.sellerSkill) {
        const { DynamicWaterfallEngine } = await import('./DynamicWaterfallEngine');
        const waterfall = new DynamicWaterfallEngine(this.config);
        
        const optimizedApproach = waterfall.optimizeForSellerSkill(
          mappedBuyerGroup,
          userContext.sellingContext.sellerSkill
        );
        
        salesStrategy['sellerOptimizedApproach'] = optimizedApproach;
        console.log(`   🎯 Seller optimization: ${optimizedApproach.reasoning}`);
      }
      
      this.stats.companiesAnalyzed++;
      this.stats.buyerGroupsGenerated++;
      
      console.log(`✅ [BUYER GROUP] Analysis complete for ${companyContext.companyName}`);
      
      return {
        // Core MEDDIC roles
        decisionMaker: mappedBuyerGroup.decisionMaker,
        champion: mappedBuyerGroup.champion,
        influencers: mappedBuyerGroup.influencers,
        stakeholders: mappedBuyerGroup.stakeholders,
        introducers: mappedBuyerGroup.introducers,
        blockers: mappedBuyerGroup.blockers,
        
        // Business intelligence
        budgetAuthority: salesStrategy.budgetAuthority,
        decisionStyle: salesStrategy.decisionStyle,
        salesCycleEstimate: salesStrategy.salesCycle,
        routingStrategy: salesStrategy.routingStrategy,
        
        // Methodology elements
        painPoints: salesStrategy.painPoints,
        economicImpact: salesStrategy.economicImpact,
        competitiveContext: salesStrategy.competitiveContext,
        implementationFactors: salesStrategy.implementationFactors,
        closeDate: salesStrategy.closeDate,
        probability: salesStrategy.probability,
        nextActions: salesStrategy.nextActions,
        
        confidence: mappedBuyerGroup.confidence
      };
      
    } catch (error) {
      console.error(`❌ [BUYER GROUP] Analysis failed for ${companyContext.companyName}:`, error);
      this.stats.errors++;
      
      // Return fallback buyer group
      return this.generateFallbackBuyerGroup(executives, companyContext);
    }
  }

  /**
   * 👤 GET USER SELLING CONTEXT FROM WORKSPACE PROFILE
   */
  private async getUserSellingContext(userContext: UserContext): Promise<{
    productCategory: string;
    targetMarket: string;
    averageDealSize: number;
    salesCycle: string;
    keyValueProps: string[];
    primaryTargetRoles: string[];
    championRoles: string[];
    blockerRoles: string[];
    sellerSkillLevel: string;
  }> {
    console.log(`   👤 Getting selling context for user: ${userContext.userId}`);
    
    try {
      // Get real workspace profile
      const { WorkspaceProfileService } = await import('../services/WorkspaceProfileService');
      const profileService = new WorkspaceProfileService();
      
      const profile = await profileService.getWorkspaceProfile(
        userContext.workspaceId, 
        userContext.userId
      );
      
      console.log(`   ✅ Workspace profile: ${profile.productName} (${profile.productCategory})`);
      console.log(`   🎯 Target roles: ${profile.primaryTargetRoles.join(', ')}`);
      console.log(`   💰 Average deal: $${profile.averageDealSize.toLocaleString()}`);
      
      return {
        productCategory: profile.productCategory,
        targetMarket: profile.targetCompanySizes.join(', '),
        averageDealSize: profile.averageDealSize,
        salesCycle: `${Math.round(profile.salesCycleLength / 30)} months`,
        keyValueProps: profile.keyValueProps,
        primaryTargetRoles: profile.primaryTargetRoles,
        championRoles: profile.championRoles,
        blockerRoles: profile.blockerRoles,
        sellerSkillLevel: profile.sellerSkillLevel
      };
      
    } catch (error) {
      console.error(`   ❌ Failed to get workspace profile:`, error);
      
      // Fallback to intelligent defaults
      return {
        productCategory: 'Business Software',
        targetMarket: 'Enterprise',
        averageDealSize: 250000,
        salesCycle: '6 months',
        keyValueProps: ['Cost savings', 'Efficiency', 'Competitive advantage'],
        primaryTargetRoles: ['CFO', 'CTO'],
        championRoles: ['VP_Operations'],
        blockerRoles: ['CISO'],
        sellerSkillLevel: 'senior'
      };
    }
  }

  /**
   * 🧠 ANALYZE COMPANY CONTEXT WITH AI (ENHANCED)
   */
  private async analyzeCompanyContext(context: CompanyContext, sellingContext?: any): Promise<{
    industry: string;
    businessModel: string;
    decisionMakingStyle: string;
    buyingProcess: string;
    keyStakeholders: string[];
    confidence: number;
  }> {
    if (!this.config.PERPLEXITY_API_KEY) {
      return this.generateFallbackContext(context);
    }

    const prompt = `Analyze the buyer group and decision-making structure for ${context.companyName}.

Company Details:
- Industry: ${context.industry || 'Unknown'}
- Size: ${context.size || 'Unknown'}
- Website: ${context.website || 'Unknown'}
- Deal Size: ${context.dealSize ? '$' + context.dealSize.toLocaleString() : 'Unknown'}

${sellingContext ? `
Selling Context:
- Product Category: ${sellingContext.productCategory}
- Target Market: ${sellingContext.targetMarket}
- Average Deal Size: $${sellingContext.averageDealSize.toLocaleString()}
- Sales Cycle: ${sellingContext.salesCycle}
- Key Value Props: ${sellingContext.keyValueProps.join(', ')}

Please tailor the buyer group analysis for selling ${sellingContext.productCategory} solutions.` : ''}

Please provide a JSON response with this structure:
{
  "industry": "specific industry classification",
  "businessModel": "B2B/B2C/Enterprise/SMB",
  "decisionMakingStyle": "centralized/distributed/committee-based",
  "buyingProcess": "formal/informal/procurement-driven",
  "keyStakeholders": ["CFO", "CTO", "CPO", "etc"],
  "budgetAuthority": "who typically has budget authority",
  "decisionFactors": ["cost", "ROI", "technical fit", "etc"],
  "confidence": 0.85
}`;

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 800,
          temperature: 0.2
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        // Parse AI response
        const analysis = this.parseContextAnalysis(content, context);
        console.log(`   🧠 AI context analysis complete: ${analysis.industry} (${analysis.confidence}% confidence)`);
        
        return analysis;
      } else {
        console.log(`   ⚠️ Perplexity API error: ${response.status}`);
        return this.generateFallbackContext(context);
      }
    } catch (error) {
      console.log(`   ⚠️ AI context analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return this.generateFallbackContext(context);
    }
  }

  /**
   * 🎯 DETERMINE BUYER GROUP ROLES
   */
  private async determineBuyerGroupRoles(contextAnalysis: any): Promise<BuyerGroupRole[]> {
    const roles: BuyerGroupRole[] = [];

    // Industry-specific buyer group logic
    switch (contextAnalysis.industry?.toLowerCase()) {
      case 'technology':
      case 'software':
        roles.push(
          {
            role: 'CTO',
            importance: 'critical',
            influence: 'Technical decision making and implementation',
            concerns: ['Integration complexity', 'Security', 'Scalability'],
            decisionCriteria: ['Technical fit', 'API quality', 'Documentation']
          },
          {
            role: 'CFO',
            importance: 'critical',
            influence: 'Budget approval and ROI validation',
            concerns: ['Cost', 'ROI', 'Contract terms'],
            decisionCriteria: ['Total cost of ownership', 'ROI timeline', 'Budget impact']
          },
          {
            role: 'CEO',
            importance: 'high',
            influence: 'Strategic alignment and final approval',
            concerns: ['Strategic fit', 'Competitive advantage'],
            decisionCriteria: ['Business impact', 'Strategic value', 'Risk assessment']
          }
        );
        break;

      case 'manufacturing':
      case 'industrial':
        roles.push(
          {
            role: 'COO',
            importance: 'critical',
            influence: 'Operations and process optimization',
            concerns: ['Operational efficiency', 'Implementation disruption'],
            decisionCriteria: ['Process improvement', 'Efficiency gains', 'Implementation timeline']
          },
          {
            role: 'CFO',
            importance: 'critical',
            influence: 'Budget approval and cost analysis',
            concerns: ['Capital expenditure', 'ROI', 'Operational costs'],
            decisionCriteria: ['Cost savings', 'Payback period', 'Financial impact']
          }
        );
        break;

      default:
        // Generic buyer group for unknown industries
        roles.push(
          {
            role: 'CFO',
            importance: 'critical',
            influence: 'Budget authority and financial approval',
            concerns: ['Cost', 'ROI', 'Budget allocation'],
            decisionCriteria: ['Financial impact', 'ROI timeline', 'Cost effectiveness']
          },
          {
            role: 'CEO',
            importance: 'high',
            influence: 'Strategic decision making',
            concerns: ['Strategic alignment', 'Business impact'],
            decisionCriteria: ['Strategic value', 'Competitive advantage', 'Long-term benefits']
          }
        );
    }

    return roles;
  }

  /**
   * 🎯 MAP EXECUTIVES TO BUYER GROUP ROLES (COMPLETE MEDDIC)
   */
  private mapExecutivesToBuyerGroup(
    executives: ExecutiveContact[],
    buyerGroupRoles: BuyerGroupRole[]
  ): {
    decisionMaker?: ExecutiveContact;
    champion?: ExecutiveContact;
    influencers: ExecutiveContact[];
    stakeholders: ExecutiveContact[];
    introducers: ExecutiveContact[];
    blockers: ExecutiveContact[];
    confidence: number;
  } {
    const mapping = {
      decisionMaker: undefined as ExecutiveContact | undefined,
      champion: undefined as ExecutiveContact | undefined,
      influencers: [] as ExecutiveContact[],
      stakeholders: [] as ExecutiveContact[],
      introducers: [] as ExecutiveContact[],
      blockers: [] as ExecutiveContact[],
      confidence: 0
    };

    // DECISION MAKER: Budget authority based on selling context
    const targetRoles = sellingContext?.primaryTargetRoles || ['CFO', 'CEO'];
    mapping['decisionMaker'] = executives.find(exec => 
      targetRoles.includes(exec.role) || 
      (exec['role'] === 'CEO' && executives.length < 3)
    );
    
    if (mapping.decisionMaker) {
      // Add detailed reasoning for decision maker selection
      const dmReasoning = this.generateDecisionMakerReasoning(mapping.decisionMaker, executives, companyContext);
      mapping['decisionMaker']['buyerGroupReasoning'] = dmReasoning;
      console.log(`   💰 Decision Maker: ${mapping.decisionMaker.name} (${mapping.decisionMaker.role})`);
      console.log(`      Reasoning: ${dmReasoning}`);
    }

    // CHAMPION: Internal advocate based on selling context
    const championRoles = sellingContext?.championRoles || ['CTO', 'COO'];
    mapping['champion'] = executives.find(exec => 
      championRoles.includes(exec.role) || 
      (exec['role'] === 'CEO' && mapping.decisionMaker?.role !== 'CEO')
    );
    
    if (mapping.champion) {
      const championReasoning = this.generateChampionReasoning(mapping.champion, companyContext, sellingContext);
      mapping['champion']['buyerGroupReasoning'] = championReasoning;
      console.log(`   🚀 Champion: ${mapping.champion.name} (${mapping.champion.role})`);
      console.log(`      Reasoning: ${championReasoning}`);
    }

    // INFLUENCERS: Provide input and recommendations (Technical Buyers)
    mapping['influencers'] = executives.filter(exec => 
      exec.role.startsWith('VP_') || 
      ['CMO', 'CPO', 'Head_of_Sales'].includes(exec.role) ||
      exec.title?.toLowerCase().includes('director')
    );
    
    // Add reasoning to each influencer
    mapping.influencers.forEach(influencer => {
      influencer['buyerGroupReasoning'] = this.generateInfluencerReasoning(influencer, companyContext, sellingContext);
    });

    // STAKEHOLDERS: Will be affected by the decision (End Users)
    mapping['stakeholders'] = executives.filter(exec =>
      exec.role.startsWith('Director_') ||
      exec.title?.toLowerCase().includes('manager') ||
      exec.title?.toLowerCase().includes('head of')
    );

    // INTRODUCERS: Can provide access and warm introductions
    mapping['introducers'] = executives.filter(exec =>
      exec['role'] === 'CRO' || exec['role'] === 'VP_Sales' ||
      exec.title?.toLowerCase().includes('business development') ||
      exec.title?.toLowerCase().includes('partnerships')
    );
    
    // Add reasoning to each introducer
    mapping.introducers.forEach(introducer => {
      introducer['buyerGroupReasoning'] = this.generateIntroducerReasoning(introducer, companyContext, sellingContext);
    });

    // BLOCKERS: Can delay or prevent decisions (Risk/Compliance)
    mapping['blockers'] = executives.filter(exec =>
      exec.title?.toLowerCase().includes('security') ||
      exec.title?.toLowerCase().includes('compliance') ||
      exec.title?.toLowerCase().includes('risk') ||
      exec.title?.toLowerCase().includes('legal') ||
      exec.title?.toLowerCase().includes('procurement')
    );
    
    // Add reasoning to each blocker
    mapping.blockers.forEach(blocker => {
      blocker['buyerGroupReasoning'] = this.generateBlockerReasoning(blocker, companyContext, sellingContext);
    });

    // Calculate mapping confidence based on complete buyer group
    let confidence = 40; // Base confidence
    if (mapping.decisionMaker) confidence += 20;        // Critical
    if (mapping.champion) confidence += 15;             // High value
    if (mapping.influencers.length > 0) confidence += 10;
    if (mapping.stakeholders.length > 0) confidence += 5;
    if (mapping.introducers.length > 0) confidence += 5;
    if (mapping.blockers.length > 0) confidence += 5;   // Good to identify early
    
    mapping['confidence'] = Math.min(confidence, 95);

    console.log(`   🎯 Buyer Group Mapped:`);
    console.log(`      Decision Maker: ${mapping.decisionMaker?.name || 'Not identified'} (${mapping.decisionMaker?.role || 'N/A'})`);
    console.log(`      Champion: ${mapping.champion?.name || 'Not identified'} (${mapping.champion?.role || 'N/A'})`);
    console.log(`      Influencers: ${mapping.influencers.length} identified`);
    console.log(`      Stakeholders: ${mapping.stakeholders.length} identified`);
    console.log(`      Introducers: ${mapping.introducers.length} identified`);
    console.log(`      Blockers: ${mapping.blockers.length} identified`);

    return mapping;
  }

  /**
   * 📈 GENERATE COMPREHENSIVE SALES STRATEGY
   */
  private async generateSalesStrategy(
    buyerGroup: any,
    context: CompanyContext,
    sellingContext?: any
  ): Promise<{
    budgetAuthority: string;
    decisionStyle: string;
    salesCycle: string;
    routingStrategy: string[];
    painPoints: string[];
    economicImpact: string;
    competitiveContext: string;
    implementationFactors: string[];
    closeDate?: string;
    probability: number;
    nextActions: string[];
  }> {
    const dealSize = context.dealSize || 100000;
    const productCategory = sellingContext?.productCategory || 'Business Software';
    
    // Generate comprehensive strategy based on methodology
    return {
      // Budget & Authority
      budgetAuthority: dealSize > 1000000 ? 
        'CFO approval required for enterprise deals' :
        'Departmental budget authority likely sufficient',
      
      // Decision Process
      decisionStyle: buyerGroup.influencers.length > 2 ? 
        'Committee-based decision making with multiple stakeholders' :
        'Executive-led decision making with technical validation',
      
      // Timeline
      salesCycle: dealSize > 1000000 ? 
        '6-12 months (enterprise sales cycle)' :
        '3-6 months (departmental sales cycle)',
      
      // Approach Strategy
      routingStrategy: this.generateRoutingStrategy(buyerGroup, dealSize),
      
      // Pain & Priority
      painPoints: this.identifyPainPoints(context, sellingContext),
      
      // Economic Impact
      economicImpact: this.calculateEconomicImpact(dealSize, productCategory),
      
      // Competitive Context
      competitiveContext: `${context.industry || 'Technology'} company likely evaluating multiple ${productCategory} solutions`,
      
      // Implementation Factors
      implementationFactors: this.getImplementationFactors(productCategory, buyerGroup),
      
      // Outcome Prediction
      closeDate: this.predictCloseDate(dealSize),
      probability: this.calculateProbability(buyerGroup, dealSize),
      
      // Next Actions
      nextActions: this.generateNextActions(buyerGroup, dealSize)
    };
  }

  /**
   * 🎯 GENERATE ROUTING STRATEGY
   */
  private generateRoutingStrategy(buyerGroup: any, dealSize: number): string[] {
    const strategy = [];
    
    if (buyerGroup.decisionMaker) {
      strategy.push(`Start with ${buyerGroup.decisionMaker.role} (${buyerGroup.decisionMaker.name}) for budget authority`);
    }
    
    if (buyerGroup.introducers.length > 0) {
      strategy.push(`Get warm introduction through ${buyerGroup['introducers'][0].role} (${buyerGroup['introducers'][0].name})`);
    }
    
    if (buyerGroup.champion) {
      strategy.push(`Engage ${buyerGroup.champion.role} (${buyerGroup.champion.name}) as internal champion`);
    }
    
    if (buyerGroup.blockers.length > 0) {
      strategy.push(`Address concerns early with ${buyerGroup.blockers.map(b => b.role).join(', ')}`);
    }
    
    strategy.push('Build consensus with stakeholders before final proposal');
    
    return strategy;
  }

  /**
   * 😣 IDENTIFY PAIN POINTS
   */
  private identifyPainPoints(context: CompanyContext, sellingContext?: any): string[] {
    const painPoints = [];
    
    // Generic business pains
    painPoints.push('Manual processes reducing efficiency');
    painPoints.push('Lack of real-time visibility into operations');
    
    // Industry-specific pains
    if (context.industry?.toLowerCase().includes('technology')) {
      painPoints.push('Scaling technical operations');
      painPoints.push('Developer productivity challenges');
    }
    
    // Product-specific pains
    if (sellingContext?.productCategory?.toLowerCase().includes('sales')) {
      painPoints.push('Inefficient lead qualification processes');
      painPoints.push('Limited buyer group intelligence');
    }
    
    return painPoints;
  }

  /**
   * 💰 CALCULATE ECONOMIC IMPACT
   */
  private calculateEconomicImpact(dealSize: number, productCategory: string): string {
    const roi = dealSize < 100000 ? '200-300%' : dealSize < 500000 ? '150-250%' : '100-200%';
    const payback = dealSize < 100000 ? '6-12 months' : dealSize < 500000 ? '12-18 months' : '18-24 months';
    
    return `Expected ROI: ${roi} with ${payback} payback period for ${productCategory} implementation`;
  }

  /**
   * 🛠️ GET IMPLEMENTATION FACTORS
   */
  private getImplementationFactors(productCategory: string, buyerGroup: any): string[] {
    const factors = [
      'Budget approval and procurement process',
      'Technical integration requirements',
      'Security and compliance validation'
    ];
    
    if (productCategory.toLowerCase().includes('sales')) {
      factors.push('Sales team training and adoption');
      factors.push('CRM integration requirements');
      factors.push('Data migration and setup');
    }
    
    if (buyerGroup.blockers.length > 0) {
      factors.push('Risk and compliance review process');
    }
    
    return factors;
  }

  /**
   * 📅 PREDICT CLOSE DATE
   */
  private predictCloseDate(dealSize: number): string {
    const now = new Date();
    const months = dealSize > 1000000 ? 9 : dealSize > 500000 ? 6 : 4;
    const closeDate = new Date(now.getTime() + (months * 30 * 24 * 60 * 60 * 1000));
    
    return closeDate.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  /**
   * 📊 CALCULATE PROBABILITY
   */
  private calculateProbability(buyerGroup: any, dealSize: number): number {
    let probability = 50; // Base probability
    
    if (buyerGroup.decisionMaker) probability += 20;
    if (buyerGroup.champion) probability += 15;
    if (buyerGroup.introducers.length > 0) probability += 10;
    if (buyerGroup['blockers']['length'] === 0) probability += 5;
    
    // Adjust for deal size (larger deals have lower probability)
    if (dealSize > 1000000) probability -= 10;
    if (dealSize < 100000) probability += 5;
    
    return Math.min(probability, 85); // Cap at 85%
  }

  /**
   * ✅ GENERATE NEXT ACTIONS
   */
  private generateNextActions(buyerGroup: any, dealSize: number): string[] {
    const actions = [];
    
    if (buyerGroup.introducers.length > 0) {
      actions.push(`Get warm introduction through ${buyerGroup['introducers'][0].name} (${buyerGroup['introducers'][0].role})`);
    } else if (buyerGroup.decisionMaker) {
      actions.push(`Research ${buyerGroup.decisionMaker.name}'s background and recent initiatives`);
    }
    
    if (buyerGroup.champion) {
      actions.push(`Schedule discovery call with ${buyerGroup.champion.name} to understand technical requirements`);
    }
    
    actions.push('Prepare customized ROI analysis based on company size and industry');
    
    if (buyerGroup.blockers.length > 0) {
      actions.push(`Proactively address ${buyerGroup['blockers'][0].role} concerns about security/compliance`);
    }
    
    actions.push('Build multi-threaded relationships across the buyer group');
    
    return actions;
  }

  /**
   * 🔧 UTILITY METHODS
   */
  private parseContextAnalysis(content: string, context: CompanyContext): any {
    try {
      // Try to extract JSON from AI response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          industry: parsed.industry || context.industry || 'Technology',
          businessModel: parsed.businessModel || 'B2B',
          decisionMakingStyle: parsed.decisionMakingStyle || 'centralized',
          buyingProcess: parsed.buyingProcess || 'formal',
          keyStakeholders: parsed.keyStakeholders || ['CFO', 'CTO', 'CEO'],
          confidence: Math.round((parsed.confidence || 0.8) * 100)
        };
      }
    } catch (error) {
      console.log(`   ⚠️ JSON parsing failed, using fallback context`);
    }
    
    return this.generateFallbackContext(context);
  }

  private generateFallbackContext(context: CompanyContext): any {
    return {
      industry: context.industry || 'Technology',
      businessModel: 'B2B',
      decisionMakingStyle: 'centralized',
      buyingProcess: 'formal',
      keyStakeholders: ['CFO', 'CTO', 'CEO'],
      confidence: 70
    };
  }

  private generateFallbackBuyerGroup(
    executives: ExecutiveContact[],
    context: CompanyContext
  ): BuyerGroupInsight {
    const decisionMaker = executives.find(exec => exec['role'] === 'CFO') || 
                         executives.find(exec => exec['role'] === 'CEO');
    const champion = executives.find(exec => exec['role'] === 'CTO') || 
                    executives.find(exec => exec['role'] === 'COO');
    
    return {
      // Core MEDDIC roles
      decisionMaker,
      champion,
      influencers: executives.filter(exec => exec.role.startsWith('VP_')),
      stakeholders: executives.filter(exec => exec.role.startsWith('Director_')),
      introducers: executives.filter(exec => exec['role'] === 'CRO'),
      blockers: [],
      
      // Business intelligence
      budgetAuthority: 'CFO approval likely required',
      decisionStyle: 'Executive-led decision making',
      salesCycleEstimate: '3-6 months',
      routingStrategy: [
        'Start with CFO for budget discussions',
        'Engage technical stakeholders early',
        'Prepare comprehensive ROI analysis'
      ],
      
      // Methodology elements
      painPoints: ['Manual processes', 'Efficiency challenges', 'Growth scaling needs'],
      economicImpact: 'Expected ROI: 150-250% with 12-18 month payback period',
      competitiveContext: 'Technology company likely evaluating multiple solutions',
      implementationFactors: ['Budget approval', 'Technical integration', 'Security validation'],
      closeDate: new Date(Date.now() + (4 * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      probability: 65,
      nextActions: [
        decisionMaker ? `Research ${decisionMaker.name}'s recent initiatives` : 'Identify budget holder',
        champion ? `Schedule discovery with ${champion.name}` : 'Find technical champion',
        'Prepare customized ROI analysis'
      ],
      
      confidence: 75
    };
  }

  /**
   * 💰 GENERATE DECISION MAKER REASONING
   */
  private generateDecisionMakerReasoning(
    decisionMaker: ExecutiveContact,
    allExecutives: ExecutiveContact[],
    context: CompanyContext
  ): string {
    const role = decisionMaker.role;
    const title = decisionMaker.title;
    const dealSize = context.dealSize || 100000;
    
    let reasoning = `Selected as Decision Maker because: `;
    
    // Role-based reasoning
    if (role === 'CFO') {
      reasoning += `CFO typically has budget authority for software purchases `;
      if (dealSize > 500000) {
        reasoning += `especially for enterprise deals >$500K. `;
      }
      reasoning += `Title "${title}" confirms financial leadership role. `;
    } else if (role === 'CEO') {
      reasoning += `CEO selected as decision maker `;
      if (allExecutives.length < 3) {
        reasoning += `because small executive team suggests CEO involvement in major decisions. `;
      } else {
        reasoning += `because deal size ($${dealSize.toLocaleString()}) likely requires CEO approval. `;
      }
    }
    
    // Deal size context
    if (dealSize > 1000000) {
      reasoning += `Deal size >$1M typically requires C-level approval. `;
    } else if (dealSize < 100000) {
      reasoning += `Deal size <$100K may allow departmental approval, but ${role} still likely involved. `;
    }
    
    // Industry context
    if (context.industry?.toLowerCase().includes('financial')) {
      reasoning += `Financial services companies typically have formal approval processes requiring ${role} sign-off. `;
    } else if (context.industry?.toLowerCase().includes('technology')) {
      reasoning += `Technology companies often have ${role} involved in vendor selection for strategic tools. `;
    }
    
    // Alternative analysis
    const alternativeCFO = allExecutives.find(e => e['role'] === 'CFO' && e.id !== decisionMaker.id);
    const alternativeCEO = allExecutives.find(e => e['role'] === 'CEO' && e.id !== decisionMaker.id);
    
    if (alternativeCFO && role !== 'CFO') {
      reasoning += `Note: ${alternativeCFO.name} (CFO) also has budget authority but ${role} selected due to deal context. `;
    }
    if (alternativeCEO && role !== 'CEO') {
      reasoning += `Note: ${alternativeCEO.name} (CEO) has final authority but ${role} likely handles day-to-day vendor decisions. `;
    }
    
    return reasoning.trim();
  }

  /**
   * 🚀 GENERATE CHAMPION REASONING
   */
  private generateChampionReasoning(
    champion: ExecutiveContact,
    context: CompanyContext,
    sellingContext?: any
  ): string {
    const role = champion.role;
    const title = champion.title;
    const productCategory = sellingContext?.productCategory || 'business software';
    
    let reasoning = `Selected as Champion because: `;
    
    // Role-based reasoning
    if (role === 'CTO') {
      reasoning += `CTO typically champions technology solutions and drives technical requirements. `;
      if (productCategory.toLowerCase().includes('software')) {
        reasoning += `For ${productCategory}, CTO evaluates technical fit and integration complexity. `;
      }
      reasoning += `Title "${title}" confirms technology leadership role. `;
    } else if (role === 'COO') {
      reasoning += `COO typically champions operational improvements and process optimization. `;
      if (productCategory.toLowerCase().includes('operations') || productCategory.toLowerCase().includes('process')) {
        reasoning += `For ${productCategory}, COO evaluates operational impact and efficiency gains. `;
      }
    } else if (role === 'CEO') {
      reasoning += `CEO selected as champion when they drive strategic initiatives personally. `;
    }
    
    // Product-specific reasoning
    if (productCategory.toLowerCase().includes('sales')) {
      reasoning += `For sales software, technical leaders often champion solutions that improve sales efficiency. `;
    } else if (productCategory.toLowerCase().includes('security')) {
      reasoning += `For security software, technical leaders champion solutions that improve security posture. `;
    } else if (productCategory.toLowerCase().includes('hr')) {
      reasoning += `For HR software, operational leaders often champion people process improvements. `;
    }
    
    // Company context
    if (context.industry?.toLowerCase().includes('technology')) {
      reasoning += `Technology companies typically have strong technical leadership driving vendor selection. `;
    }
    
    reasoning += `Champion role is critical for internal advocacy and implementation success.`;
    
    return reasoning.trim();
  }

  /**
   * 👥 GENERATE INFLUENCER REASONING
   */
  private generateInfluencerReasoning(
    influencer: ExecutiveContact,
    context: CompanyContext,
    sellingContext?: any
  ): string {
    const role = influencer.role;
    const productCategory = sellingContext?.productCategory || 'business software';
    
    let reasoning = `Influencer because: `;
    
    if (role.startsWith('VP_')) {
      reasoning += `VP-level executives provide input on departmental impact and requirements. `;
      
      if (role === 'VP_Sales' && productCategory.toLowerCase().includes('sales')) {
        reasoning += `VP Sales directly impacted by sales software and will influence adoption. `;
      } else if (role === 'VP_Marketing' && productCategory.toLowerCase().includes('marketing')) {
        reasoning += `VP Marketing directly uses marketing tools and influences selection criteria. `;
      } else if (role === 'VP_Engineering' && productCategory.toLowerCase().includes('development')) {
        reasoning += `VP Engineering evaluates developer tools and technical solutions. `;
      }
    }
    
    if (role === 'CMO') {
      reasoning += `CMO influences customer-facing technology decisions and brand considerations. `;
    }
    
    if (influencer.title?.toLowerCase().includes('director')) {
      reasoning += `Director-level roles provide operational input and user perspective. `;
    }
    
    reasoning += `Input valuable for requirements gathering and stakeholder buy-in.`;
    
    return reasoning.trim();
  }

  /**
   * 🚫 GENERATE BLOCKER REASONING
   */
  private generateBlockerReasoning(
    blocker: ExecutiveContact,
    context: CompanyContext,
    sellingContext?: any
  ): string {
    const title = blocker.title?.toLowerCase() || '';
    const productCategory = sellingContext?.productCategory || 'software';
    
    let reasoning = `Potential Blocker because: `;
    
    if (title.includes('security') || title.includes('ciso')) {
      reasoning += `Security officers can block software purchases due to security/compliance concerns. `;
      if (productCategory.toLowerCase().includes('cloud') || productCategory.toLowerCase().includes('saas')) {
        reasoning += `Especially critical for cloud/SaaS solutions requiring data security validation. `;
      }
    }
    
    if (title.includes('compliance')) {
      reasoning += `Compliance officers can delay purchases requiring regulatory approval. `;
      if (context.industry?.toLowerCase().includes('financial') || context.industry?.toLowerCase().includes('healthcare')) {
        reasoning += `Particularly important in regulated industries like ${context.industry}. `;
      }
    }
    
    if (title.includes('legal')) {
      reasoning += `Legal team can block deals due to contract terms, liability, or regulatory concerns. `;
    }
    
    if (title.includes('procurement')) {
      reasoning += `Procurement team controls vendor selection process and can enforce preferred vendor policies. `;
    }
    
    if (title.includes('risk')) {
      reasoning += `Risk management can block purchases that increase operational or security risk. `;
    }
    
    reasoning += `Early engagement recommended to address concerns proactively.`;
    
    return reasoning.trim();
  }

  /**
   * 🔄 GENERATE INTRODUCER REASONING
   */
  private generateIntroducerReasoning(
    introducer: ExecutiveContact,
    context: CompanyContext,
    sellingContext?: any
  ): string {
    const role = introducer.role;
    const productCategory = sellingContext?.productCategory || 'software';
    
    let reasoning = `Introducer because: `;
    
    if (role === 'CRO' || role === 'VP_Sales') {
      reasoning += `Sales leaders understand vendor relationships and can provide warm introductions to decision makers. `;
      if (productCategory.toLowerCase().includes('sales')) {
        reasoning += `Especially valuable for sales software as they understand the problem firsthand. `;
      } else {
        reasoning += `Sales-to-sales connection often most effective for initial outreach. `;
      }
    }
    
    if (introducer.title?.toLowerCase().includes('business development')) {
      reasoning += `Business development roles specialize in partner and vendor relationships. `;
    }
    
    if (introducer.title?.toLowerCase().includes('partnerships')) {
      reasoning += `Partnership roles have established vendor relationship processes. `;
    }
    
    reasoning += `Can facilitate introductions and provide internal context for approach strategy.`;
    
    return reasoning.trim();
  }

  /**
   * 🎯 ENHANCED ROLE HIERARCHY MAPPING
   * Based on research: EVP > CRO > VP > Director hierarchy varies by company size
   */
  private getRoleHierarchy(companySize: string, industry: string): RoleHierarchyMap {
    const hierarchies: { [key: string]: RoleHierarchyMap } = {
      'enterprise': {
        'sales': ['EVP Sales', 'CRO', 'VP Sales', 'Sales Director', 'Sales Manager'],
        'technology': ['CTO', 'VP Engineering', 'VP IT', 'IT Director', 'IT Manager'],
        'finance': ['CFO', 'VP Finance', 'Controller', 'Treasurer', 'Finance Manager'],
        'operations': ['COO', 'VP Operations', 'Operations Director', 'Operations Manager'],
        'executive': ['CEO', 'President', 'Managing Director', 'General Manager']
      },
      'mid-market': {
        'sales': ['CRO', 'VP Sales', 'Sales Director', 'Sales Manager'],
        'technology': ['CTO', 'VP Engineering', 'IT Director', 'IT Manager'],
        'finance': ['CFO', 'VP Finance', 'Controller', 'Finance Manager'],
        'operations': ['COO', 'VP Operations', 'Operations Director', 'Operations Manager'],
        'executive': ['CEO', 'President', 'General Manager']
      },
      'small': {
        'sales': ['VP Sales', 'Sales Director', 'Sales Manager'],
        'technology': ['CTO', 'IT Director', 'IT Manager'],
        'finance': ['CFO', 'Controller', 'Finance Manager'],
        'operations': ['COO', 'Operations Director', 'Operations Manager'],
        'executive': ['CEO', 'President', 'General Manager']
      }
    };

    // Default to mid-market if size not specified
    const size = companySize?.toLowerCase() || 'mid-market';
    const industryKey = this.mapIndustryToHierarchyKey(industry);
    
    return hierarchies[size]?.[industryKey] || hierarchies['mid-market'][industryKey] || hierarchies['mid-market']['sales'];
  }

  /**
   * 🎯 MAP INDUSTRY TO HIERARCHY KEY
   */
  private mapIndustryToHierarchyKey(industry: string): string {
    const industryMap: { [key: string]: string } = {
      'technology': 'technology',
      'software': 'technology',
      'manufacturing': 'operations',
      'industrial': 'operations',
      'retail': 'sales',
      'finance': 'finance',
      'healthcare': 'operations',
      'consulting': 'sales'
    };

    return industryMap[industry?.toLowerCase()] || 'sales';
  }

  /**
   * 🎯 ENHANCED ROLE HIERARCHY MAPPING
   * Based on research: EVP > CRO > VP > Director hierarchy varies by company size
   */
  private getRoleHierarchy(companySize: string, industry: string): string[] {
    const hierarchies: { [key: string]: { [key: string]: string[] } } = {
      'enterprise': {
        'sales': ['EVP Sales', 'CRO', 'VP Sales', 'Sales Director', 'Sales Manager'],
        'technology': ['CTO', 'VP Engineering', 'VP IT', 'IT Director', 'IT Manager'],
        'finance': ['CFO', 'VP Finance', 'Controller', 'Treasurer', 'Finance Manager'],
        'operations': ['COO', 'VP Operations', 'Operations Director', 'Operations Manager'],
        'executive': ['CEO', 'President', 'Managing Director', 'General Manager']
      },
      'mid-market': {
        'sales': ['CRO', 'VP Sales', 'Sales Director', 'Sales Manager'],
        'technology': ['CTO', 'VP Engineering', 'IT Director', 'IT Manager'],
        'finance': ['CFO', 'VP Finance', 'Controller', 'Finance Manager'],
        'operations': ['COO', 'VP Operations', 'Operations Director', 'Operations Manager'],
        'executive': ['CEO', 'President', 'General Manager']
      },
      'small': {
        'sales': ['VP Sales', 'Sales Director', 'Sales Manager'],
        'technology': ['CTO', 'IT Director', 'IT Manager'],
        'finance': ['CFO', 'Controller', 'Finance Manager'],
        'operations': ['COO', 'Operations Director', 'Operations Manager'],
        'executive': ['CEO', 'President', 'General Manager']
      }
    };

    // Default to mid-market if size not specified
    const size = companySize?.toLowerCase() || 'mid-market';
    const industryKey = this.mapIndustryToHierarchyKey(industry);
    
    return hierarchies[size]?.[industryKey] || hierarchies['mid-market']['sales'];
  }

  /**
   * 🎯 MAP INDUSTRY TO HIERARCHY KEY
   */
  private mapIndustryToHierarchyKey(industry: string): string {
    const industryMap: { [key: string]: string } = {
      'technology': 'technology',
      'software': 'technology',
      'manufacturing': 'operations',
      'industrial': 'operations',
      'retail': 'sales',
      'finance': 'finance',
      'healthcare': 'operations',
      'consulting': 'sales'
    };

    return industryMap[industry?.toLowerCase()] || 'sales';
  }

  /**
   * 🎯 DETERMINE COMPANY SIZE FOR ROLE HIERARCHY
   */
  private determineCompanySize(context: CompanyContext): string {
    // Use deal size as proxy for company size
    if (context.dealSize) {
      if (context.dealSize >= 1000000) return 'enterprise';
      if (context.dealSize >= 100000) return 'mid-market';
      return 'small';
    }
    
    // Fallback based on industry
    if (context.industry?.toLowerCase().includes('enterprise')) return 'enterprise';
    if (context.industry?.toLowerCase().includes('sme') || context.industry?.toLowerCase().includes('small')) return 'small';
    
    return 'mid-market';
  }

  /**
   * 🎯 ENHANCED AI PROMPT WITH ROLE HIERARCHY REQUIREMENTS
   */
  private async analyzeCompanyContextWithPrecision(context: CompanyContext, sellingContext?: any): Promise<any> {
    console.log(`   🧠 Enhanced AI context analysis for ${context.companyName}...`);

    // Determine company size for role hierarchy
    const companySize = this.determineCompanySize(context);
    const roleHierarchy = this.getRoleHierarchy(companySize, context.industry);

    const prompt = `Analyze the buyer group and decision-making structure for ${context.companyName} with PRECISE role hierarchy determination.

Company Details:
- Name: ${context.companyName}
- Industry: ${context.industry || 'Unknown'}
- Size: ${companySize}
- Website: ${context.website || 'Unknown'}
- Deal Size: ${context.dealSize ? '$' + context.dealSize.toLocaleString() : 'Unknown'}

${sellingContext ? `
Selling Context:
- Product Category: ${sellingContext.productCategory}
- Target Market: ${sellingContext.targetMarket}
- Average Deal Size: $${sellingContext.averageDealSize.toLocaleString()}
- Sales Cycle: ${sellingContext.salesCycle}
- Key Value Props: ${sellingContext.keyValueProps.join(', ')}

Please tailor the buyer group analysis for selling ${sellingContext.productCategory} solutions.` : ''}

CRITICAL REQUIREMENTS FOR ROLE PRECISION:
1. Determine the EXACT seniority level for each role (EVP > CRO > VP > Director > Manager)
2. Consider company size: ${companySize} companies typically have ${roleHierarchy.join(' > ')} hierarchy
3. Distinguish between similar roles (EVP Sales vs CRO vs VP Sales)
4. Identify the MOST SENIOR person who would make the final decision
5. Validate that returned roles match the company's expected hierarchy

Please provide a JSON response with this structure:
{
  "industry": "specific industry classification",
  "businessModel": "B2B/B2C/Enterprise/SMB",
  "decisionMakingStyle": "centralized/distributed/committee-based",
  "buyingProcess": "formal/informal/procurement-driven",
  "keyStakeholders": ["EXACT role titles with seniority level"],
  "budgetAuthority": "specific role with title",
  "decisionFactors": ["cost", "ROI", "technical fit", "etc"],
  "roleHierarchy": {
    "sales": ["${roleHierarchy.join('", "')}"],
    "technology": ["CTO", "VP Engineering", "IT Director"],
    "finance": ["CFO", "VP Finance", "Controller"],
    "operations": ["COO", "VP Operations", "Operations Director"]
  },
  "confidence": 0.85,
  "rolePrecisionScore": 0.90
}`;

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 800,
          temperature: 0.1
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        // Parse AI response with enhanced precision
        const analysis = this.parseEnhancedContextAnalysis(content, context);
        console.log(`   🧠 Enhanced AI context analysis complete: ${analysis.industry} (${analysis.confidence}% confidence, ${analysis.rolePrecisionScore}% precision)`);
        
        return analysis;
      } else {
        console.log(`   ⚠️ Perplexity API error: ${response.status}`);
        return this.generateEnhancedFallbackContext(context, companySize, roleHierarchy);
      }
    } catch (error) {
      console.log(`   ⚠️ Enhanced AI context analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return this.generateEnhancedFallbackContext(context, companySize, roleHierarchy);
    }
  }

  /**
   * 🎯 PARSE ENHANCED AI RESPONSE WITH ROLE PRECISION
   */
  private parseEnhancedContextAnalysis(content: string, context: CompanyContext): any {
    try {
      // Try to extract JSON from AI response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          ...parsed,
          companyName: context.companyName,
          website: context.website,
          dealSize: context.dealSize
        };
      }
    } catch (error) {
      console.log('   ⚠️ Failed to parse enhanced AI response, using fallback');
    }
    
    return this.generateEnhancedFallbackContext(context, 'mid-market', this.getRoleHierarchy('mid-market', context.industry));
  }

  /**
   * 🎯 GENERATE ENHANCED FALLBACK CONTEXT WITH ROLE HIERARCHY
   */
  private generateEnhancedFallbackContext(context: CompanyContext, companySize: string, roleHierarchy: string[]): any {
    return {
      industry: context.industry || 'Unknown',
      businessModel: 'B2B',
      decisionMakingStyle: 'centralized',
      buyingProcess: 'formal',
      keyStakeholders: roleHierarchy.slice(0, 3), // Top 3 roles
      budgetAuthority: roleHierarchy[0] || 'VP Sales',
      decisionFactors: ['cost', 'ROI', 'technical fit'],
      roleHierarchy: {
        sales: roleHierarchy,
        technology: ['CTO', 'VP Engineering', 'IT Director'],
        finance: ['CFO', 'VP Finance', 'Controller'],
        operations: ['COO', 'VP Operations', 'Operations Director']
      },
      confidence: 0.7,
      rolePrecisionScore: 0.8,
      companyName: context.companyName,
      website: context.website,
      dealSize: context.dealSize
    };
  }
}
