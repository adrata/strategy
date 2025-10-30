/**
 * CompanyIntelligenceService
 * 
 * Comprehensive company intelligence service that combines:
 * - CoreSignal data from database
 * - Real-time news from Perplexity AI
 * - Deep insights from Claude AI
 * 
 * Provides actionable intelligence for sales teams
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CompanyIntelligenceResult {
  // Market Intelligence
  marketPosition: {
    competitivePosition: string;
    growthTrajectory: string;
    marketThreats: string[];
    opportunities: string[];
  };
  
  // Buying Signals
  buyingSignals: {
    hiring: {
      activePostings: number;
      keyRoles: string[];
      growthIndicators: string[];
    };
    fundingEvents: {
      recentFunding: any[];
      fundingStage: string;
      financialHealth: string;
    };
    technologyChanges: {
      newTechnologies: string[];
      techStackEvolution: string;
      digitalTransformation: string;
    };
    leadershipChanges: {
      recentChanges: string[];
      executiveStability: string;
      strategicDirection: string;
    };
    painIndicators: {
      identifiedPains: string[];
      urgencyLevel: 'High' | 'Medium' | 'Low';
      painSources: string[];
    };
  };
  
  // Account Strategy
  accountStrategy: {
    entryPoint: string;
    buyerGroup: {
      identifiedMembers: any[];
      decisionProcess: string;
      influenceMap: any[];
    };
    champions: {
      potentialChampions: any[];
      championStrategy: string;
    };
    engagementPlan: {
      approach: string;
      timeline: string;
      keyMessages: string[];
    };
  };
  
  // Timing & Priority
  timing: {
    urgency: number; // 1-10
    bestEngagementTime: string;
    budgetCycle: string;
    decisionTimeline: string;
  };
  
  // Metadata
  dataSource: 'database' | 'perplexity' | 'claude' | 'combined';
  lastUpdated: Date;
  confidence: number;
}

export interface CompanyContext {
  company: any;
  people: any[];
  recentActions: any[];
  recentNews: any[];
  hiringTrends: any[];
  buyerGroup: any[];
}

export class CompanyIntelligenceService {
  private claudeApiKey: string;
  private perplexityApiKey: string;

  constructor() {
    this.claudeApiKey = process.env.ANTHROPIC_API_KEY || '';
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY || '';
  }

  /**
   * Generate comprehensive company intelligence
   */
  async generateComprehensiveInsights(companyId: string): Promise<CompanyIntelligenceResult> {
    try {
      console.log(`🏢 [COMPANY_INTELLIGENCE] Generating insights for company: ${companyId}`);

      // 1. Get CoreSignal company data
      const company = await this.getCompanyWithCoreSignalData(companyId);
      if (!company) {
        throw new Error(`Company not found: ${companyId}`);
      }

      // 2. Get real-time news from Perplexity
      const recentNews = await this.getPerplexityCompanyNews(company.name);

      // 3. Get hiring trends from Perplexity
      const hiringTrends = await this.getPerplexityHiringData(company.name);

      // 4. Get recent actions and people
      const [recentActions, people] = await Promise.all([
        this.getRecentActions(companyId),
        this.getCompanyPeople(companyId)
      ]);

      // 5. Get buyer group
      const buyerGroup = people.filter(p => p.buyerGroupRole);

      // 6. Generate deep insights with Claude
      const insights = await this.getClaudeInsights({
        company,
        people,
        recentActions,
        recentNews,
        hiringTrends,
        buyerGroup
      });

      // 7. Combine and structure the results
      const result: CompanyIntelligenceResult = {
        marketPosition: {
          competitivePosition: insights.marketStanding || 'Unknown',
          growthTrajectory: insights.growthAnalysis || 'Stable',
          marketThreats: insights.threats || [],
          opportunities: insights.opportunities || []
        },
        
        buyingSignals: {
          hiring: {
            activePostings: company.activeJobPostings || 0,
            keyRoles: insights.hiringSignals?.keyRoles || [],
            growthIndicators: insights.hiringSignals?.growthIndicators || []
          },
          fundingEvents: {
            recentFunding: insights.fundingAnalysis?.recentFunding || [],
            fundingStage: insights.fundingAnalysis?.stage || 'Unknown',
            financialHealth: insights.fundingAnalysis?.health || 'Unknown'
          },
          technologyChanges: {
            newTechnologies: insights.techStackChanges?.newTechnologies || [],
            techStackEvolution: insights.techStackChanges?.evolution || 'Unknown',
            digitalTransformation: insights.techStackChanges?.transformation || 'Unknown'
          },
          leadershipChanges: {
            recentChanges: insights.executiveChanges?.recentChanges || [],
            executiveStability: insights.executiveChanges?.stability || 'Unknown',
            strategicDirection: insights.executiveChanges?.direction || 'Unknown'
          },
          painIndicators: {
            identifiedPains: insights.painSignals?.pains || [],
            urgencyLevel: insights.painSignals?.urgency || 'Medium',
            painSources: insights.painSignals?.sources || []
          }
        },
        
        accountStrategy: {
          entryPoint: insights.bestEntryPoint || 'Direct outreach',
          buyerGroup: {
            identifiedMembers: buyerGroup,
            decisionProcess: insights.buyerGroupAnalysis?.process || 'Unknown',
            influenceMap: insights.buyerGroupAnalysis?.influenceMap || []
          },
          champions: {
            potentialChampions: insights.potentialChampions || [],
            championStrategy: insights.championStrategy || 'Identify and nurture champions'
          },
          engagementPlan: {
            approach: insights.accountPlan?.approach || 'Consultative',
            timeline: insights.accountPlan?.timeline || '3-6 months',
            keyMessages: insights.accountPlan?.keyMessages || []
          }
        },
        
        timing: {
          urgency: insights.urgencyScore || 5,
          bestEngagementTime: insights.optimalTiming || 'Business hours',
          budgetCycle: insights.budgetCycleAnalysis || 'Annual',
          decisionTimeline: insights.decisionTimeline || '3-6 months'
        },
        
        dataSource: 'combined',
        lastUpdated: new Date(),
        confidence: insights.confidence || 0.7
      };

      console.log(`✅ [COMPANY_INTELLIGENCE] Generated insights for ${company.name}`);
      return result;

    } catch (error) {
      console.error(`❌ [COMPANY_INTELLIGENCE] Error generating insights:`, error);
      throw error;
    }
  }

  /**
   * Get company with CoreSignal data from database
   */
  private async getCompanyWithCoreSignalData(companyId: string): Promise<any> {
    const company = await prisma.companies.findUnique({
      where: { id: companyId }
    });

    if (!company) return null;

    // Extract CoreSignal data from customFields
    const customFields = company.customFields || {};
    const companyUpdates = company.companyUpdates || [];
    const companyIntelligence = company.companyIntelligence || {};

    return {
      ...company,
      customFields,
      companyUpdates,
      companyIntelligence
    };
  }

  /**
   * Get real-time news from Perplexity AI
   */
  private async getPerplexityCompanyNews(companyName: string): Promise<any[]> {
    if (!this.perplexityApiKey) {
      console.log('⚠️ [COMPANY_INTELLIGENCE] Perplexity API key not found');
      return [];
    }

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [{
            role: 'user',
            content: `Analyze ${companyName} for B2B sales intelligence:
            1. Recent news (last 30 days)
            2. Funding or acquisition news
            3. Leadership changes
            4. Strategic initiatives
            5. Pain points or challenges mentioned
            6. Technology announcements
            
            Return structured JSON with sources.`
          }],
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (content) {
        try {
          const parsedNews = JSON.parse(content);
          return Array.isArray(parsedNews) ? parsedNews : [];
        } catch (parseError) {
          console.warn('⚠️ [COMPANY_INTELLIGENCE] Failed to parse Perplexity response');
          return [];
        }
      }

      return [];
    } catch (error) {
      console.error('❌ [COMPANY_INTELLIGENCE] Perplexity API error:', error);
      return [];
    }
  }

  /**
   * Get hiring trends from Perplexity AI
   */
  private async getPerplexityHiringData(companyName: string): Promise<any[]> {
    if (!this.perplexityApiKey) {
      return [];
    }

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [{
            role: 'user',
            content: `Find recent hiring trends and job postings for ${companyName}:
            1. Active job postings and key roles
            2. Hiring growth indicators
            3. Department expansion
            4. Skills and technologies they're hiring for
            5. Leadership hires
            
            Return structured JSON with job data.`
          }],
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (content) {
        try {
          const parsedHiring = JSON.parse(content);
          return Array.isArray(parsedHiring) ? parsedHiring : [];
        } catch (parseError) {
          console.warn('⚠️ [COMPANY_INTELLIGENCE] Failed to parse hiring data');
          return [];
        }
      }

      return [];
    } catch (error) {
      console.error('❌ [COMPANY_INTELLIGENCE] Hiring data API error:', error);
      return [];
    }
  }

  /**
   * Get recent actions for the company
   */
  private async getRecentActions(companyId: string): Promise<any[]> {
    return await prisma.actions.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
  }

  /**
   * Get company people
   */
  private async getCompanyPeople(companyId: string): Promise<any[]> {
    return await prisma.people.findMany({
      where: { companyId },
      take: 20,
      orderBy: { updatedAt: 'desc' }
    });
  }

  /**
   * Generate deep insights with Claude AI
   */
  private async getClaudeInsights(context: CompanyContext): Promise<any> {
    if (!this.claudeApiKey) {
      console.log('⚠️ [COMPANY_INTELLIGENCE] Claude API key not found, using fallback analysis');
      return this.getFallbackInsights(context);
    }

    try {
      const prompt = this.buildClaudePrompt(context);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 4000,
          temperature: 0.3,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.content[0].text;
      
      return this.parseClaudeResponse(content, context);
      
    } catch (error) {
      console.error('❌ [COMPANY_INTELLIGENCE] Claude API call failed:', error);
      return this.getFallbackInsights(context);
    }
  }

  /**
   * Build comprehensive prompt for Claude
   */
  private buildClaudePrompt(context: CompanyContext): string {
    const { company, people, recentActions, recentNews, hiringTrends, buyerGroup } = context;
    
    // Validate company data to ensure we have enough information
    const companyName = company.name || 'Unknown Company';
    const industry = company.industry || 'Unknown Industry';
    const employeeCount = company.employeeCount || 'Unknown';
    const website = company.website || 'Unknown';
    const linkedinUrl = company.linkedinUrl || 'Unknown';
    const foundedYear = company.foundedYear || 'Unknown';
    const revenue = company.revenue || 'Unknown';
    
    const companyUpdates = company.companyUpdates || [];
    const customFields = company.customFields || {};
    
    const recentActionsText = recentActions
      .map(action => `${action.type}: ${action.description} (${action.createdAt})`)
      .join('\n');

    const recentNewsText = recentNews
      .map(news => `${news.title}: ${news.description} (${news.date})`)
      .join('\n');

    const hiringTrendsText = hiringTrends
      .map(hiring => `${hiring.role}: ${hiring.description} (${hiring.date})`)
      .join('\n');

    const buyerGroupText = buyerGroup
      .map(member => `${member.fullName} - ${member.jobTitle} (${member.buyerGroupRole})`)
      .join('\n');

    return `You are an expert B2B sales intelligence analyst. Analyze the following company data to provide actionable insights for a seller.

## COMPANY PROFILE

### Basic Information
- Name: ${companyName}
- Industry: ${industry}
- Size: ${employeeCount} employees
- Website: ${website}
- LinkedIn: ${linkedinUrl}
- Founded: ${foundedYear}
- Revenue: ${revenue}

### Company Updates (CoreSignal Data)
${JSON.stringify(companyUpdates, null, 2)}

### Custom Fields (Additional Intelligence)
${JSON.stringify(customFields, null, 2)}

### Recent Actions
${recentActionsText || 'No recent actions'}

### Recent News & Market Intelligence
${recentNewsText || 'No recent news'}

### Hiring Trends
${hiringTrendsText || 'No hiring data'}

### Buyer Group Members
${buyerGroupText || 'No buyer group identified'}

## ANALYSIS REQUIRED

Provide a comprehensive analysis in JSON format with the following structure:

{
  "marketStanding": "string",
  "growthAnalysis": "string",
  "threats": ["threat1", "threat2"],
  "opportunities": ["opportunity1", "opportunity2"],
  "hiringSignals": {
    "keyRoles": ["role1", "role2"],
    "growthIndicators": ["indicator1", "indicator2"]
  },
  "fundingAnalysis": {
    "recentFunding": [],
    "stage": "string",
    "health": "string"
  },
  "techStackChanges": {
    "newTechnologies": ["tech1", "tech2"],
    "evolution": "string",
    "transformation": "string"
  },
  "executiveChanges": {
    "recentChanges": ["change1", "change2"],
    "stability": "string",
    "direction": "string"
  },
  "painSignals": {
    "pains": ["pain1", "pain2"],
    "urgency": "High|Medium|Low",
    "sources": ["source1", "source2"]
  },
  "bestEntryPoint": "string",
  "buyerGroupAnalysis": {
    "process": "string",
    "influenceMap": []
  },
  "potentialChampions": [],
  "championStrategy": "string",
  "accountPlan": {
    "approach": "string",
    "timeline": "string",
    "keyMessages": ["message1", "message2"]
  },
  "urgencyScore": 1-10,
  "optimalTiming": "string",
  "budgetCycleAnalysis": "string",
  "decisionTimeline": "string",
  "confidence": 0.0-1.0
}

Focus on:
1. Market position and competitive standing
2. Growth indicators and expansion signals
3. Technology adoption and digital transformation
4. Leadership stability and strategic direction
5. Pain points and business challenges
6. Buying signals and decision timeline
7. Optimal engagement strategy and entry points
8. Buyer group dynamics and influence mapping

Return only valid JSON.`;
  }

  /**
   * Parse Claude response
   */
  private parseClaudeResponse(content: string, context: CompanyContext): any {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      const requiredFields = ['marketStanding', 'growthAnalysis', 'urgencyScore'];
      for (const field of requiredFields) {
        if (!(field in parsed)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      return parsed;
    } catch (error) {
      console.error('❌ [COMPANY_INTELLIGENCE] Failed to parse Claude response:', error);
      return this.getFallbackInsights(context);
    }
  }

  /**
   * Fallback insights when AI is unavailable
   */
  private getFallbackInsights(context: CompanyContext): any {
    const { company, buyerGroup } = context;
    
    return {
      marketStanding: 'Established',
      growthAnalysis: 'Stable growth',
      threats: ['Competition', 'Market changes'],
      opportunities: ['Digital transformation', 'Market expansion'],
      hiringSignals: {
        keyRoles: [],
        growthIndicators: []
      },
      fundingAnalysis: {
        recentFunding: [],
        stage: 'Unknown',
        health: 'Unknown'
      },
      techStackChanges: {
        newTechnologies: [],
        evolution: 'Unknown',
        transformation: 'Unknown'
      },
      executiveChanges: {
        recentChanges: [],
        stability: 'Unknown',
        direction: 'Unknown'
      },
      painSignals: {
        pains: ['Industry challenges'],
        urgency: 'Medium',
        sources: ['Market conditions']
      },
      bestEntryPoint: 'Direct outreach',
      buyerGroupAnalysis: {
        process: 'Unknown',
        influenceMap: []
      },
      potentialChampions: [],
      championStrategy: 'Identify and nurture champions',
      accountPlan: {
        approach: 'Consultative',
        timeline: '3-6 months',
        keyMessages: ['Value proposition']
      },
      urgencyScore: 5,
      optimalTiming: 'Business hours',
      budgetCycleAnalysis: 'Annual',
      decisionTimeline: '3-6 months',
      confidence: 0.5
    };
  }

  /**
   * Cache insights for performance
   */
  async cacheInsights(companyId: string, insights: CompanyIntelligenceResult): Promise<void> {
    try {
      // Generate company summary for descriptionEnriched field
      const companySummary = this.generateCompanySummaryFromInsights(insights);
      
      await prisma.companies.update({
        where: { id: companyId },
        data: {
          companyIntelligence: {
            ...insights,
            lastIntelligenceUpdate: new Date().toISOString()
          },
          descriptionEnriched: companySummary,
          updatedAt: new Date()
        }
      });
      console.log(`✅ [COMPANY_INTELLIGENCE] Cached insights and company summary for company: ${companyId}`);
    } catch (error) {
      console.error('❌ [COMPANY_INTELLIGENCE] Failed to cache insights:', error);
    }
  }

  /**
   * Get cached insights if available and fresh
   */
  async getCachedInsights(companyId: string, maxAgeHours: number = 24): Promise<CompanyIntelligenceResult | null> {
    try {
      const company = await prisma.companies.findUnique({
        where: { id: companyId },
        select: { companyIntelligence: true }
      });

      if (!company?.companyIntelligence) return null;

      const lastUpdate = company.companyIntelligence.lastIntelligenceUpdate;
      if (!lastUpdate) return null;

      const lastUpdateDate = new Date(lastUpdate);
      const maxAge = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

      if (lastUpdateDate < maxAge) return null;

      // Return cached insights
      return company.companyIntelligence as CompanyIntelligenceResult;
    } catch (error) {
      console.error('❌ [COMPANY_INTELLIGENCE] Failed to get cached insights:', error);
      return null;
    }
  }

  /**
   * Generate company summary from intelligence insights
   */
  private generateCompanySummaryFromInsights(insights: CompanyIntelligenceResult): string {
    const companyName = insights.companyName || 'Company';
    const industry = insights.industry || 'Technology';
    
    let summary = `${companyName} is a ${industry.toLowerCase()} company`;
    
    // Add market position context
    if (insights.marketPosition) {
      summary += ` with a ${insights.marketPosition.competitivePosition || 'strong'} market position`;
      
      if (insights.marketPosition.growthTrajectory) {
        summary += ` and ${insights.marketPosition.growthTrajectory.toLowerCase()} growth trajectory`;
      }
    }
    
    summary += '.';
    
    // Add buying signals context
    if (insights.buyingSignals) {
      if (insights.buyingSignals.hiring?.activePostings > 0) {
        summary += `\n\nThe company is actively hiring with ${insights.buyingSignals.hiring.activePostings} job postings`;
        
        if (insights.buyingSignals.hiring.keyRoles?.length > 0) {
          summary += `, including key roles in ${insights.buyingSignals.hiring.keyRoles.slice(0, 2).join(' and ')}`;
        }
        summary += '.';
      }
      
      if (insights.buyingSignals.fundingEvents?.recentFunding?.length > 0) {
        summary += `\n\nRecent funding activity indicates ${insights.buyingSignals.fundingEvents.fundingStage || 'growth'} stage`;
        if (insights.buyingSignals.fundingEvents.financialHealth) {
          summary += ` with ${insights.buyingSignals.fundingEvents.financialHealth.toLowerCase()} financial health`;
        }
        summary += '.';
      }
    }
    
    // Add engagement context
    if (insights.engagementStrategy) {
      summary += `\n\nEngagement strategy: ${insights.engagementStrategy.bestEntryPoint || 'Direct outreach'}`;
      
      if (insights.engagementStrategy.optimalTiming) {
        summary += ` (optimal timing: ${insights.engagementStrategy.optimalTiming})`;
      }
      
      if (insights.engagementStrategy.decisionTimeline) {
        summary += ` (decision timeline: ${insights.engagementStrategy.decisionTimeline})`;
      }
      summary += '.';
    }
    
    // Add market opportunities
    if (insights.marketPosition?.opportunities?.length > 0) {
      summary += `\n\nMarket opportunities include ${insights.marketPosition.opportunities.slice(0, 2).join(' and ')}.`;
    }
    
    // Add pain signals
    if (insights.painSignals?.pains?.length > 0) {
      summary += `\n\nKey challenges: ${insights.painSignals.pains.slice(0, 2).join(' and ')}`;
      if (insights.painSignals.urgency) {
        summary += ` (urgency level: ${insights.painSignals.urgency})`;
      }
      summary += '.';
    }
    
    return summary;
  }
}
