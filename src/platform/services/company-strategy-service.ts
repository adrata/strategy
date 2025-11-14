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
  
  // Company Classification (for verification)
  growthStage?: 'startup' | 'growth' | 'mature' | 'declining';
  marketPosition?: 'leader' | 'challenger' | 'follower' | 'niche';
  
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
  companyAge: number | null;
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
  // Enriched data for comprehensive intelligence
  opportunities?: Array<{
    id: string;
    name: string;
    stage: string;
    amount: number;
    probability: number;
    closeDate: string | null;
    lastAction: string | null;
    nextAction: string | null;
  }>;
  people?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    title: string;
    email: string | null;
    phone: string | null;
    linkedinUrl: string | null;
    lastAction: string | null;
    nextAction: string | null;
  }>;
  buyerGroups?: Array<{
    id: string;
    name: string;
    totalMembers: number;
    overallConfidence: number;
    cohesionScore: number;
  }>;
  // CoreSignal enrichment data for rich intelligence
  coresignalData?: {
    employeesCount?: number;
    employeesCountChange?: {
      current: number;
      changeMonthly: number;
      changeMonthlyPercentage: number;
      changeQuarterly: number;
      changeQuarterlyPercentage: number;
      changeYearly: number;
      changeYearlyPercentage: number;
    };
    activeJobPostingsCount?: number;
    activeJobPostingsCountChange?: {
      current: number;
      changeMonthly: number;
      changeMonthlyPercentage: number;
    };
    keyExecutiveArrivals?: Array<{
      memberFullName: string;
      memberPositionTitle: string;
      arrivalDate: string;
    }>;
    keyExecutiveDepartures?: Array<{
      memberFullName: string;
      memberPositionTitle: string;
      departureDate: string;
    }>;
    fundingRounds?: Array<{
      name: string;
      announcedDate: string;
      amountRaised: number;
      amountRaisedCurrency: string;
    }>;
    acquisitions?: Array<{
      acquireeName: string;
      announcedDate: string;
      price: string;
      currency: string;
    }>;
    employeeReviewsScore?: number;
    productReviewsScore?: number;
    naicsCodes?: string[];
    sicCodes?: string[];
    technologiesUsed?: string[];
    techStack?: string[];
  };
  // Additional enrichment fields
  naicsCodes?: string[];
  sicCodes?: string[];
  technologiesUsed?: string[];
  techStack?: string[];
  activeJobPostings?: number;
  employeeCountChange?: {
    monthly?: number;
    quarterly?: number;
    yearly?: number;
  };
  fundingRounds?: Array<{
    name: string;
    date: string;
    amount: number;
    currency: string;
  }>;
  executiveChanges?: {
    arrivals?: Array<{ name: string; title: string; date: string }>;
    departures?: Array<{ name: string; title: string; date: string }>;
  };
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
      console.log(`📊 [COMPANY STRATEGY] Request details:`, {
        companyId: request.companyId,
        companyName: request.companyName,
        companyIndustry: request.companyIndustry,
        targetIndustry: request.targetIndustry,
        companySize: request.companySize,
        companyRevenue: request.companyRevenue,
        companyAge: request.companyAge,
        growthStage: request.growthStage,
        marketPosition: request.marketPosition,
        forceRegenerate: request.forceRegenerate,
        opportunitiesCount: request.opportunities?.length || 0,
        peopleCount: request.people?.length || 0,
        buyerGroupsCount: request.buyerGroups?.length || 0
      });

      // Determine company archetype
      let profile: CompanyProfile;
      let archetype;
      let personalizedContent;
      
      try {
        profile = {
          name: request.companyName,
          industry: request.companyIndustry,
          targetIndustry: request.targetIndustry,
          size: request.companySize,
          revenue: request.companyRevenue,
          age: request.companyAge,
          growthStage: request.growthStage,
          marketPosition: request.marketPosition
        };
        console.log(`📋 [COMPANY STRATEGY] Company profile created:`, profile);

        archetype = determineCompanyArchetype(profile);
        console.log(`📊 [COMPANY STRATEGY] Determined archetype: ${archetype.name} (${archetype.id})`);

        personalizedContent = getIndustryPersonalizedContent(archetype, request.targetIndustry);
        console.log(`🎯 [COMPANY STRATEGY] Personalized for target industry: ${request.targetIndustry}`);
      } catch (archetypeError) {
        console.error(`❌ [COMPANY STRATEGY] Error determining archetype:`, {
          error: archetypeError,
          profile: profile,
          companyName: request.companyName
        });
        throw new Error(`Failed to determine company archetype: ${archetypeError instanceof Error ? archetypeError.message : 'Unknown error'}`);
      }

      // Prepare Claude AI request with comprehensive company data
      let claudeRequest: ClaudeStrategyRequest;
      try {
        claudeRequest = {
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
          opportunityAmount: request.opportunityAmount,
          // Include enriched data for comprehensive intelligence
          opportunities: request.opportunities,
          people: request.people,
          buyerGroups: request.buyerGroups
        };
        console.log(`📋 [COMPANY STRATEGY] Claude request prepared:`, {
          companyName: claudeRequest.companyName,
          archetypeName: claudeRequest.archetypeName,
          targetIndustry: claudeRequest.targetIndustry,
          opportunitiesCount: claudeRequest.opportunities?.length || 0,
          peopleCount: claudeRequest.people?.length || 0,
          buyerGroupsCount: claudeRequest.buyerGroups?.length || 0
        });
      } catch (requestError) {
        console.error(`❌ [COMPANY STRATEGY] Error preparing Claude request:`, {
          error: requestError,
          companyName: request.companyName,
          archetype: archetype?.name
        });
        throw new Error(`Failed to prepare Claude request: ${requestError instanceof Error ? requestError.message : 'Unknown error'}`);
      }

      // Generate AI-powered strategy content
      console.log('🤖 [COMPANY STRATEGY] Attempting to generate AI-powered intelligence with Claude...');
      let claudeResponse;
      try {
        claudeResponse = await this.claudeService.generateCompanyStrategy(claudeRequest);
        console.log(`📤 [COMPANY STRATEGY] Claude response received:`, {
          success: claudeResponse.success,
          hasData: !!claudeResponse.data,
          error: claudeResponse.error,
          usage: claudeResponse.usage
        });
      } catch (claudeError) {
        console.error(`❌ [COMPANY STRATEGY] Claude service error:`, {
          error: claudeError,
          message: claudeError instanceof Error ? claudeError.message : 'Unknown Claude error',
          companyName: request.companyName
        });
        throw new Error(`Claude service failed: ${claudeError instanceof Error ? claudeError.message : 'Unknown error'}`);
      }
      
      if (!claudeResponse.success || !claudeResponse.data) {
        console.error('❌ [COMPANY STRATEGY] Claude AI failed - no fallback will be used');
        console.error('❌ [COMPANY STRATEGY] Error:', claudeResponse.error);
        throw new Error(`Claude AI strategy generation failed: ${claudeResponse.error || 'Unknown error'}`);
      }

      console.log('✅ [COMPANY STRATEGY] Successfully generated AI-powered intelligence with Claude');

      // Build comprehensive strategy data
      let strategyData: CompanyStrategyData;
      try {
        strategyData = {
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
          
          // Company Classification (for verification)
          growthStage: request.growthStage,
          marketPosition: request.marketPosition,
          
          // Metadata
          strategyGeneratedAt: new Date().toISOString(),
          strategyGeneratedBy: 'claude-3-sonnet',
          strategyVersion: '1.0'
        };
        console.log(`📋 [COMPANY STRATEGY] Strategy data built successfully:`, {
          hasSummary: !!strategyData.strategySummary,
          hasSituation: !!strategyData.situation,
          hasComplication: !!strategyData.complication,
          hasFutureState: !!strategyData.futureState,
          recommendationsCount: strategyData.strategicRecommendations?.length || 0,
          metricsCount: strategyData.successMetrics?.length || 0,
          archetypeName: strategyData.archetypeName,
          targetIndustry: strategyData.targetIndustry
        });
      } catch (dataError) {
        console.error(`❌ [COMPANY STRATEGY] Error building strategy data:`, {
          error: dataError,
          claudeData: claudeResponse.data,
          archetype: archetype?.name,
          companyName: request.companyName
        });
        throw new Error(`Failed to build strategy data: ${dataError instanceof Error ? dataError.message : 'Unknown error'}`);
      }

      console.log(`✅ [COMPANY STRATEGY] Successfully generated strategy for ${request.companyName}`);
      
      return {
        success: true,
        data: strategyData,
        cached: false
      };

    } catch (error) {
      console.error('❌ [COMPANY STRATEGY] Error generating strategy:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        companyName: request.companyName,
        companyId: request.companyId,
        timestamp: new Date().toISOString()
      });
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
    // Use real company data to create more personalized fallback
    const companySize = profile.size > 0 ? `${profile.size} employees` : 'unknown size';
    const companyRevenue = profile.revenue > 0 ? `$${profile.revenue.toLocaleString()}` : 'unknown revenue';
    const companyAge = profile.age > 0 ? `${profile.age} years` : 'unknown age';
    
    const strategyData: CompanyStrategyData = {
      // Enhanced Fallback Content using real company data
      strategySummary: `${profile.name} is a ${companySize} company with ${companyRevenue} in revenue, operating as a ${archetype.name} in the ${profile.targetIndustry} market. As a ${archetype.role}, they have significant opportunities to expand their market presence and leverage their ${profile.growthStage} stage growth potential.`,
      situation: personalizedContent.situation,
      complication: personalizedContent.complication,
      futureState: personalizedContent.futureState,
      strategicRecommendations: [
        `Focus on ${profile.targetIndustry} market penetration leveraging their ${companySize} team`,
        `Leverage ${archetype.name} competitive advantages in the ${profile.targetIndustry} sector`,
        `Develop industry-specific solutions for ${profile.targetIndustry} based on their ${profile.marketPosition} market position`,
        `Optimize their ${profile.growthStage} stage growth strategy for ${profile.targetIndustry} market expansion`
      ],
      competitivePositioning: `Position as a ${archetype.role} in the ${profile.targetIndustry} market with specialized expertise, leveraging their ${companySize} team and ${profile.marketPosition} market position to deliver proven results.`,
      successMetrics: [
        `Market share growth in ${profile.targetIndustry} (target: 15-25% increase)`,
        'Customer acquisition rate (target: 20-30% growth)',
        `Revenue growth from ${profile.targetIndustry} sector (target: 30-50% increase)`,
        `Team expansion aligned with ${profile.targetIndustry} market demands`
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

    console.log('📋 [COMPANY STRATEGY] Generated fallback strategy using real company data');
    return {
      success: true,
      data: strategyData,
      cached: false
    };
  }

  private getIndustryCategory(targetIndustry: string): string {
    if (!targetIndustry || targetIndustry === 'Unknown') {
      return 'Unknown';
    }

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
      'Non-Profit': 'Non-Profit',
      'Utilities/Energy': 'Utilities/Energy',
      'Healthcare': 'Healthcare',
      'Financial Services': 'Financial Services',
      'Technology/SaaS': 'Technology/SaaS',
      'Manufacturing': 'Manufacturing',
      'Retail/E-commerce': 'Retail/E-commerce',
      'Real Estate': 'Real Estate',
      'Education': 'Education',
      'Government/Public Sector': 'Government/Public Sector',
      'Professional Services': 'Professional Services',
      'Non-Profit': 'Non-Profit'
    };

    // Try exact match first
    if (industryMappings[targetIndustry]) {
      return industryMappings[targetIndustry];
    }

    const targetLower = targetIndustry.toLowerCase();

    // Check for utility/energy keywords FIRST before other partial matches
    // This prevents false matches like "Power Technology" being classified as Technology/SaaS
    if (targetLower.includes('utility') || 
        targetLower.includes('energy') || 
        targetLower.includes('power') || 
        targetLower.includes('electric') ||
        targetLower.includes('utilities') ||
        targetLower.includes('electrical')) {
      return 'Utilities/Energy';
    }

    // Try partial match for other industries (utilities already handled above)
    for (const [industry, category] of Object.entries(industryMappings)) {
      const industryLower = industry.toLowerCase();
      // Skip utilities/energy and technology/saas in partial matching to avoid false positives
      if (category === 'Utilities/Energy' || category === 'Technology/SaaS') {
        continue;
      }
      if (targetLower.includes(industryLower) || industryLower.includes(targetLower)) {
        return category;
      }
    }

    // Only match Technology/SaaS if explicitly technology-related (not just "tech" in name)
    if (targetLower.includes('software') || 
        targetLower.includes('saas') ||
        targetLower.includes('it services') ||
        targetLower.includes('information technology')) {
      return 'Technology/SaaS';
    }

    // If no match found, return the original industry instead of defaulting to Technology/SaaS
    // This preserves the actual industry information rather than misclassifying
    return targetIndustry;
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
          title: 'Pain', 
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
