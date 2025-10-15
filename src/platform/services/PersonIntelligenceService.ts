/**
 * PersonIntelligenceService
 * 
 * Comprehensive person intelligence service that combines:
 * - CoreSignal data from database
 * - Real-time news from Perplexity AI
 * - Deep insights from Claude AI
 * 
 * Provides actionable intelligence for sales teams
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PersonIntelligenceResult {
  // Buyer Intelligence
  buyerProfile: {
    decisionPower: number;
    influenceLevel: 'High' | 'Medium' | 'Low';
    buyerGroupRole: string | null;
    riskAssessment: {
      jobChangeRisk: 'High' | 'Medium' | 'Low';
      buyingCycleStage: 'Awareness' | 'Consideration' | 'Decision' | 'Unknown';
      competitionRisk: 'High' | 'Medium' | 'Low';
    };
  };
  
  // Engagement Strategy
  engagementStrategy: {
    bestChannels: string[];
    messagingAngle: string;
    timingRecommendation: string;
    relationshipApproach: string;
  };
  
  // Next Actions
  nextActions: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  
  // Pain & Value
  painPoints: string[];
  valueProposition: string;
  
  // Insights
  careerTrajectory: string;
  recentChanges: string[];
  competitiveIntel: string[];
  
  // Metadata
  dataSource: 'database' | 'perplexity' | 'claude' | 'combined';
  lastUpdated: Date;
  confidence: number;
}

export interface PersonContext {
  person: any;
  company: any;
  recentActions: any[];
  recentNews: any[];
  buyerGroupContext: any;
}

export class PersonIntelligenceService {
  private claudeApiKey: string;
  private perplexityApiKey: string;

  constructor() {
    this.claudeApiKey = process.env.ANTHROPIC_API_KEY || '';
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY || '';
  }

  /**
   * Generate comprehensive person intelligence
   */
  async generateComprehensiveInsights(personId: string): Promise<PersonIntelligenceResult> {
    try {
      console.log(`🧠 [PERSON_INTELLIGENCE] Generating insights for person: ${personId}`);

      // 1. Get CoreSignal base data from database
      const person = await this.getPersonWithCoreSignalData(personId);
      if (!person) {
        throw new Error(`Person not found: ${personId}`);
      }

      // 2. Get real-time news from Perplexity
      const recentNews = await this.getPerplexityPersonNews(person.fullName, person.company?.name);

      // 3. Get recent actions
      const recentActions = await this.getRecentActions(personId);

      // 4. Get buyer group context
      const buyerGroupContext = await this.getBuyerGroupContext(personId);

      // 5. Generate deep insights with Claude
      const insights = await this.getClaudeInsights({
        person,
        company: person.company,
        recentActions,
        recentNews,
        buyerGroupContext
      });

      // 6. Combine and structure the results
      const result: PersonIntelligenceResult = {
        buyerProfile: {
          decisionPower: insights.decisionPower || 5,
          influenceLevel: insights.influenceLevel || 'Medium',
          buyerGroupRole: person.buyerGroupRole || insights.buyerGroupRole,
          riskAssessment: {
            jobChangeRisk: insights.jobChangeRisk || 'Medium',
            buyingCycleStage: insights.buyingCycleStage || 'Unknown',
            competitionRisk: insights.competitionRisk || 'Medium'
          }
        },
        
        engagementStrategy: {
          bestChannels: insights.recommendedChannels || ['Email', 'LinkedIn'],
          messagingAngle: insights.personalizedMessaging || 'Professional approach',
          timingRecommendation: insights.optimalTiming || 'Business hours',
          relationshipApproach: insights.relationshipStrategy || 'Direct and consultative'
        },
        
        nextActions: {
          immediate: insights.immediateActions || ['Research recent company news'],
          shortTerm: insights.shortTermActions || ['Schedule initial meeting'],
          longTerm: insights.longTermActions || ['Build relationship and trust']
        },
        
        painPoints: insights.identifiedPains || [],
        valueProposition: insights.personalizedValue || 'Standard value proposition',
        
        careerTrajectory: insights.careerPath || 'Career progression analysis',
        recentChanges: insights.significantChanges || [],
        competitiveIntel: insights.competitorInsights || [],
        
        dataSource: 'combined',
        lastUpdated: new Date(),
        confidence: insights.confidence || 0.7
      };

      console.log(`✅ [PERSON_INTELLIGENCE] Generated insights for ${person.fullName}`);
      return result;

    } catch (error) {
      console.error(`❌ [PERSON_INTELLIGENCE] Error generating insights:`, error);
      throw error;
    }
  }

  /**
   * Get person with CoreSignal data from database
   */
  private async getPersonWithCoreSignalData(personId: string): Promise<any> {
    const person = await prisma.people.findUnique({
      where: { id: personId },
      include: { 
        company: true,
        actions: { 
          take: 10, 
          orderBy: { createdAt: 'desc' } 
        }
      }
    });

    if (!person) return null;

    // Extract CoreSignal data from customFields
    const coresignalData = person.customFields?.coresignal || person.customFields?.coresignalData;
    const enrichedData = person.customFields?.enrichedData;

    return {
      ...person,
      coresignalData,
      enrichedData
    };
  }

  /**
   * Get real-time news from Perplexity AI
   */
  private async getPerplexityPersonNews(personName: string, companyName?: string): Promise<any[]> {
    if (!this.perplexityApiKey) {
      console.log('⚠️ [PERSON_INTELLIGENCE] Perplexity API key not found');
      return [];
    }

    try {
      const query = companyName 
        ? `Recent news about ${personName} at ${companyName}`
        : `Recent news about ${personName}`;

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
            content: `${query}. Return recent news, job changes, awards, or mentions in JSON format with title, description, source, date, and url fields.`
          }],
          max_tokens: 1000
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
          console.warn('⚠️ [PERSON_INTELLIGENCE] Failed to parse Perplexity response');
          return [];
        }
      }

      return [];
    } catch (error) {
      console.error('❌ [PERSON_INTELLIGENCE] Perplexity API error:', error);
      return [];
    }
  }

  /**
   * Get recent actions for the person
   */
  private async getRecentActions(personId: string): Promise<any[]> {
    return await prisma.actions.findMany({
      where: { personId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
  }

  /**
   * Get buyer group context
   */
  private async getBuyerGroupContext(personId: string): Promise<any> {
    // Get buyer group information if available
    const person = await prisma.people.findUnique({
      where: { id: personId },
      select: {
        buyerGroupRole: true,
        companyId: true,
        customFields: true
      }
    });

    if (!person?.companyId) return null;

    // Get other buyer group members
    const buyerGroupMembers = await prisma.people.findMany({
      where: {
        companyId: person.companyId,
        buyerGroupRole: { not: null }
      },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        buyerGroupRole: true
      }
    });

    return {
      personRole: person.buyerGroupRole,
      buyerGroupMembers,
      totalMembers: buyerGroupMembers.length
    };
  }

  /**
   * Generate deep insights with Claude AI
   */
  private async getClaudeInsights(context: PersonContext): Promise<any> {
    if (!this.claudeApiKey) {
      console.log('⚠️ [PERSON_INTELLIGENCE] Claude API key not found, using fallback analysis');
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
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 3000,
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
      console.error('❌ [PERSON_INTELLIGENCE] Claude API call failed:', error);
      return this.getFallbackInsights(context);
    }
  }

  /**
   * Build comprehensive prompt for Claude
   */
  private buildClaudePrompt(context: PersonContext): string {
    const { person, company, recentActions, recentNews, buyerGroupContext } = context;
    
    const coresignalData = person.coresignalData || {};
    const enrichedData = person.enrichedData || {};
    
    const recentActionsText = recentActions
      .map(action => `${action.type}: ${action.description} (${action.createdAt})`)
      .join('\n');

    const recentNewsText = recentNews
      .map(news => `${news.title}: ${news.description} (${news.date})`)
      .join('\n');

    const buyerGroupText = buyerGroupContext 
      ? `Buyer Group Role: ${buyerGroupContext.personRole}\nMembers: ${buyerGroupContext.buyerGroupMembers?.map(m => `${m.fullName} - ${m.buyerGroupRole}`).join(', ')}`
      : 'No buyer group information';

    return `You are an expert B2B sales intelligence analyst. Analyze the following data to provide actionable insights for a seller.

## PERSON PROFILE

### Basic Information
- Name: ${person.fullName}
- Title: ${person.jobTitle || 'Unknown'}
- Company: ${company?.name || 'Unknown'}
- Industry: ${company?.industry || 'Unknown'}
- Email: ${person.email || 'Unknown'}
- LinkedIn: ${person.linkedinUrl || 'Unknown'}

### CoreSignal Data (Verified Professional Intelligence)
${JSON.stringify(coresignalData, null, 2)}

### Enriched Data
${JSON.stringify(enrichedData, null, 2)}

### Recent Actions
${recentActionsText || 'No recent actions'}

### Recent News & Market Intelligence
${recentNewsText || 'No recent news'}

### Buyer Group Context
${buyerGroupText}

## ANALYSIS REQUIRED

Provide a comprehensive analysis in JSON format with the following structure:

{
  "decisionPower": 1-10,
  "influenceLevel": "High|Medium|Low",
  "buyerGroupRole": "string",
  "jobChangeRisk": "High|Medium|Low",
  "buyingCycleStage": "Awareness|Consideration|Decision|Unknown",
  "competitionRisk": "High|Medium|Low",
  "recommendedChannels": ["Email", "LinkedIn", "Phone"],
  "personalizedMessaging": "string",
  "optimalTiming": "string",
  "relationshipStrategy": "string",
  "immediateActions": ["action1", "action2"],
  "shortTermActions": ["action1", "action2"],
  "longTermActions": ["action1", "action2"],
  "identifiedPains": ["pain1", "pain2"],
  "personalizedValue": "string",
  "careerPath": "string",
  "significantChanges": ["change1", "change2"],
  "competitorInsights": ["insight1", "insight2"],
  "confidence": 0.0-1.0
}

Focus on:
1. Decision power based on role, seniority, and experience
2. Pain points based on role, industry, and recent news
3. Optimal engagement strategy and timing
4. Personalized messaging angles
5. Risk assessment for job changes and competition
6. Actionable next steps with specific recommendations

Return only valid JSON.`;
  }

  /**
   * Parse Claude response
   */
  private parseClaudeResponse(content: string, context: PersonContext): any {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      const requiredFields = ['decisionPower', 'influenceLevel', 'recommendedChannels'];
      for (const field of requiredFields) {
        if (!(field in parsed)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      return parsed;
    } catch (error) {
      console.error('❌ [PERSON_INTELLIGENCE] Failed to parse Claude response:', error);
      return this.getFallbackInsights(context);
    }
  }

  /**
   * Fallback insights when AI is unavailable
   */
  private getFallbackInsights(context: PersonContext): any {
    const { person, company } = context;
    
    return {
      decisionPower: 5,
      influenceLevel: 'Medium',
      buyerGroupRole: person.buyerGroupRole || 'Unknown',
      jobChangeRisk: 'Medium',
      buyingCycleStage: 'Unknown',
      competitionRisk: 'Medium',
      recommendedChannels: ['Email', 'LinkedIn'],
      personalizedMessaging: 'Professional approach based on role and industry',
      optimalTiming: 'Business hours',
      relationshipStrategy: 'Direct and consultative',
      immediateActions: ['Research company and role', 'Prepare personalized outreach'],
      shortTermActions: ['Schedule initial meeting', 'Share relevant content'],
      longTermActions: ['Build relationship and trust', 'Identify decision makers'],
      identifiedPains: ['Industry-specific challenges'],
      personalizedValue: 'Standard value proposition',
      careerPath: 'Career progression analysis',
      significantChanges: [],
      competitorInsights: [],
      confidence: 0.5
    };
  }

  /**
   * Cache insights for performance
   */
  async cacheInsights(personId: string, insights: PersonIntelligenceResult): Promise<void> {
    try {
      await prisma.people.update({
        where: { id: personId },
        data: {
          customFields: {
            ...insights,
            lastIntelligenceUpdate: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      console.error('❌ [PERSON_INTELLIGENCE] Failed to cache insights:', error);
    }
  }

  /**
   * Get cached insights if available and fresh
   */
  async getCachedInsights(personId: string, maxAgeHours: number = 24): Promise<PersonIntelligenceResult | null> {
    try {
      const person = await prisma.people.findUnique({
        where: { id: personId },
        select: { customFields: true }
      });

      if (!person?.customFields) return null;

      const lastUpdate = person.customFields.lastIntelligenceUpdate;
      if (!lastUpdate) return null;

      const lastUpdateDate = new Date(lastUpdate);
      const maxAge = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

      if (lastUpdateDate < maxAge) return null;

      // Return cached insights
      return person.customFields as PersonIntelligenceResult;
    } catch (error) {
      console.error('❌ [PERSON_INTELLIGENCE] Failed to get cached insights:', error);
      return null;
    }
  }
}
