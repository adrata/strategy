/**
 * Company Strategy Service
 * Handles company-specific strategy generation with industry personalization
 */

import { 
  CompanyArchetype, 
  CompanyProfile, 
  determineCompanyArchetype, 
  getIndustryPersonalizedContent,
  getArchetypeById 
} from './company-archetypes';
import { 
  ClaudeStrategyService, 
  ClaudeStrategyRequest, 
  ClaudeStrategyResponse 
} from './claude-strategy-service';

export interface CompanyStrategyData {
  // Strategy Content
  strategySummary: string;
  situation: string;
  complication: string;
  futureState: string;
  strategicRecommendations: string[];
  competitivePositioning: string;
  successMetrics: string[];
  
  // Company Archetype
  companyArchetype: string;
  archetypeName: string;
  archetypeRole: string;
  
  // Target Industry
  targetIndustry: string;
  targetIndustryCategory: string;
  
  // Metadata
  strategyGeneratedAt: string;
  strategyGeneratedBy: string;
  strategyVersion: string;
}

export interface CompanyStrategyRequest {
  companyId: string;
  companyName: string;
  companyIndustry: string;
  targetIndustry: string;
  companySize: number;
  companyRevenue: number;
  companyAge: number;
  growthStage: 'startup' | 'growth' | 'mature' | 'declining';
  marketPosition: 'leader' | 'challenger' | 'follower' | 'niche';
  forceRegenerate?: boolean;
  // Additional real company data for better intelligence
  website?: string;
  headquarters?: string;
  foundedYear?: number;
  isPublic?: boolean;
  sector?: string;
  description?: string;
  linkedinFollowers?: number;
  globalRank?: number;
  competitors?: string[];
  lastAction?: string;
  nextAction?: string;
  opportunityStage?: string;
  opportunityAmount?: number;
}

export interface CompanyStrategyResponse {
  success: boolean;
  data?: CompanyStrategyData;
  error?: string;
  cached?: boolean;
}

export class CompanyStrategyService {
  private claudeService: ClaudeStrategyService;

  constructor() {
    this.claudeService = new ClaudeStrategyService();
  }

  async generateCompanyStrategy(request: CompanyStrategyRequest): Promise<CompanyStrategyResponse> {
    try {
      console.log(`🔄 [COMPANY STRATEGY] Generating strategy for ${request.companyName}`);

      // Determine company archetype
      const profile: CompanyProfile = {
        name: request.companyName,
        industry: request.companyIndustry,
        targetIndustry: request.targetIndustry,
        size: request.companySize,
        revenue: request.companyRevenue,
        age: request.companyAge,
        growthStage: request.growthStage,
        marketPosition: request.marketPosition
      };

      const archetype = determineCompanyArchetype(profile);
      console.log(`📊 [COMPANY STRATEGY] Determined archetype: ${archetype.name}`);

      // Get industry-personalized content
      const personalizedContent = getIndustryPersonalizedContent(archetype, request.targetIndustry);
      console.log(`🎯 [COMPANY STRATEGY] Personalized for target industry: ${request.targetIndustry}`);

      // Prepare Claude AI request with comprehensive company data
      const claudeRequest: ClaudeStrategyRequest = {
        companyName: request.companyName,
        companyIndustry: request.companyIndustry,
        targetIndustry: request.targetIndustry,
        companySize: request.companySize,
        companyRevenue: request.companyRevenue,
        companyAge: request.companyAge,
        growthStage: request.growthStage,
        marketPosition: request.marketPosition,
        archetypeName: archetype.name,
        archetypeDescription: archetype.description,
        // Pass through all additional real company data
        website: request.website,
        headquarters: request.headquarters,
        foundedYear: request.foundedYear,
        isPublic: request.isPublic,
        sector: request.sector,
        description: request.description,
        linkedinFollowers: request.linkedinFollowers,
        globalRank: request.globalRank,
        competitors: request.competitors,
        lastAction: request.lastAction,
        nextAction: request.nextAction,
        opportunityStage: request.opportunityStage,
        opportunityAmount: request.opportunityAmount
      };

      // Generate AI-powered strategy content
      const claudeResponse = await this.claudeService.generateCompanyStrategy(claudeRequest);
      
      if (!claudeResponse.success || !claudeResponse.data) {
        console.warn('⚠️ [COMPANY STRATEGY] Claude AI failed, using fallback content');
        return this.generateFallbackStrategy(profile, archetype, personalizedContent);
      }

      // Build comprehensive strategy data
      const strategyData: CompanyStrategyData = {
        // AI-Generated Content
        strategySummary: claudeResponse.data.strategySummary,
        situation: claudeResponse.data.situation,
        complication: claudeResponse.data.complication,
        futureState: claudeResponse.data.futureState,
        strategicRecommendations: claudeResponse.data.strategicRecommendations,
        competitivePositioning: claudeResponse.data.competitivePositioning,
        successMetrics: claudeResponse.data.successMetrics,
        
        // Company Archetype
        companyArchetype: archetype.id,
        archetypeName: archetype.name,
        archetypeRole: archetype.role,
        
        // Target Industry
        targetIndustry: request.targetIndustry,
        targetIndustryCategory: this.getIndustryCategory(request.targetIndustry),
        
        // Metadata
        strategyGeneratedAt: new Date().toISOString(),
        strategyGeneratedBy: 'claude-3-sonnet',
        strategyVersion: '1.0'
      };

      console.log(`✅ [COMPANY STRATEGY] Successfully generated strategy for ${request.companyName}`);
      
      return {
        success: true,
        data: strategyData,
        cached: false
      };

    } catch (error) {
      console.error('❌ [COMPANY STRATEGY] Error generating strategy:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate company strategy'
      };
    }
  }

  private generateFallbackStrategy(
    profile: CompanyProfile, 
    archetype: CompanyArchetype, 
    personalizedContent: { situation: string; complication: string; futureState: string }
  ): CompanyStrategyResponse {
    const strategyData: CompanyStrategyData = {
      // Fallback Content
      strategySummary: `Strategic analysis for ${profile.name}, a ${archetype.name} serving ${profile.targetIndustry}. This company demonstrates the characteristics of a ${archetype.role} with significant opportunities in their target market.`,
      situation: personalizedContent.situation,
      complication: personalizedContent.complication,
      futureState: personalizedContent.futureState,
      strategicRecommendations: [
        `Focus on ${profile.targetIndustry} market penetration`,
        `Leverage ${archetype.name} competitive advantages`,
        `Develop industry-specific solutions for ${profile.targetIndustry}`
      ],
      competitivePositioning: `Position as a ${archetype.role} in the ${profile.targetIndustry} market with specialized expertise and proven results.`,
      successMetrics: [
        'Market share growth in target industry',
        'Customer acquisition rate',
        'Revenue growth from target industry'
      ],
      
      // Company Archetype
      companyArchetype: archetype.id,
      archetypeName: archetype.name,
      archetypeRole: archetype.role,
      
      // Target Industry
      targetIndustry: profile.targetIndustry,
      targetIndustryCategory: this.getIndustryCategory(profile.targetIndustry),
      
      // Metadata
      strategyGeneratedAt: new Date().toISOString(),
      strategyGeneratedBy: 'fallback-system',
      strategyVersion: '1.0'
    };

    return {
      success: true,
      data: strategyData,
      cached: false
    };
  }

  private getIndustryCategory(targetIndustry: string): string {
    const industryMappings: Record<string, string> = {
      'Title Companies': 'Real Estate',
      'Healthcare Providers': 'Healthcare',
      'Hospitals': 'Healthcare',
      'Banks': 'Financial Services',
      'Insurance': 'Financial Services',
      'Software': 'Technology/SaaS',
      'Manufacturing': 'Manufacturing',
      'Retail': 'Retail/E-commerce',
      'Consulting': 'Professional Services',
      'Education': 'Education',
      'Government': 'Government/Public Sector',
      'Non-Profit': 'Non-Profit'
    };

    // Try exact match first
    if (industryMappings[targetIndustry]) {
      return industryMappings[targetIndustry];
    }

    // Try partial match
    for (const [industry, category] of Object.entries(industryMappings)) {
      if (targetIndustry.toLowerCase().includes(industry.toLowerCase()) ||
          industry.toLowerCase().includes(targetIndustry.toLowerCase())) {
        return category;
      }
    }

    // Default fallback
    return 'Technology/SaaS';
  }

  async getCompanyArchetype(profile: CompanyProfile): Promise<CompanyArchetype> {
    return determineCompanyArchetype(profile);
  }

  async getArchetypeById(id: string): Promise<CompanyArchetype | undefined> {
    return getArchetypeById(id);
  }

  async validateStrategyData(data: CompanyStrategyData): Promise<boolean> {
    const requiredFields = [
      'strategySummary',
      'situation', 
      'complication',
      'futureState',
      'companyArchetype',
      'archetypeName',
      'targetIndustry'
    ];

    return requiredFields.every(field => 
      data[field as keyof CompanyStrategyData] && 
      String(data[field as keyof CompanyStrategyData]).trim().length > 0
    );
  }

  async formatStrategyForDisplay(data: CompanyStrategyData): Promise<{
    summary: string;
    archetype: { name: string; role: string; badge: string };
    sections: {
      situation: { title: string; content: string; color: string };
      complication: { title: string; content: string; color: string };
      futureState: { title: string; content: string; color: string };
    };
    recommendations: string[];
    positioning: string;
    metrics: string[];
  }> {
    return {
      summary: data.strategySummary,
      archetype: {
        name: data.archetypeName,
        role: data.archetypeRole,
        badge: this.getArchetypeBadge(data.companyArchetype)
      },
      sections: {
        situation: {
          title: 'Situation',
          content: data.situation,
          color: 'green'
        },
        complication: {
          title: 'Complication', 
          content: data.complication,
          color: 'orange'
        },
        futureState: {
          title: 'Future State',
          content: data.futureState,
          color: 'blue'
        }
      },
      recommendations: data.strategicRecommendations,
      positioning: data.competitivePositioning,
      metrics: data.successMetrics
    };
  }

  private getArchetypeBadge(archetypeId: string): string {
    const badgeMap: Record<string, string> = {
      'market-leader': '🏆 Market Leader',
      'fast-growing-disruptor': '🚀 Fast-Growing Disruptor', 
      'enterprise-incumbent': '🏢 Enterprise Incumbent',
      'niche-specialist': '🎯 Niche Specialist',
      'regional-player': '🌍 Regional Player'
    };
    
    return badgeMap[archetypeId] || '📊 Strategic Company';
  }
}

export const companyStrategyService = new CompanyStrategyService();
