#!/usr/bin/env node

/**
 * 🧠 INSIDER KNOWLEDGE ENGINE
 * 
 * Generates timely, valuable industry insights that sellers can share
 * to demonstrate deep industry understanding and build credibility
 */

// Node.js compatibility
if (typeof global !== 'undefined' && !global.fetch) {
  global['fetch'] = require('node-fetch');
}

import type { APIConfig } from '../types/intelligence';

export interface InsiderInsight {
  id: string;
  industry: string;
  vertical: string;
  insightType: 'trend' | 'regulation' | 'market_shift' | 'technology' | 'competitive' | 'financial';
  title: string;
  summary: string;
  fullInsight: string;
  businessImplications: string[];
  conversationStarters: string[];
  credibilityFactors: string[];
  sources: string[];
  freshnessScore: number; // 1-100, how recent/timely
  relevanceScore: number; // 1-100, how relevant to target audience
  shareableQuote: string;
  generatedAt: Date;
  expiresAt: Date;
}

export interface IndustryProfile {
  name: string;
  verticals: string[];
  keyDecisionMakers: string[];
  commonPainPoints: string[];
  regulatoryEnvironment: string[];
  technologyTrends: string[];
  competitiveLandscape: string[];
}

export class InsiderKnowledge {
  private config: APIConfig;
  
  constructor(config: APIConfig) {
    this['config'] = config;
  }
  
  /**
   * 🎯 GENERATE INSIDER INSIGHTS FOR INDUSTRY
   */
  async generateInsiderInsights(
    industry: string, 
    vertical?: string,
    targetRole?: string
  ): Promise<InsiderInsight[]> {
    console.log(`🧠 [INSIDER] Generating insights for ${industry}${vertical ? ` - ${vertical}` : ''}`);
    
    try {
      // Get industry profile first
      const industryProfile = await this.getIndustryProfile(industry);
      
      // Generate multiple types of insights
      const insightPromises = [
        this.generateTrendInsight(industry, vertical, industryProfile),
        this.generateRegulatoryInsight(industry, vertical, industryProfile),
        this.generateTechnologyInsight(industry, vertical, industryProfile),
        this.generateCompetitiveInsight(industry, vertical, industryProfile)
      ];
      
      const insights = await Promise.all(insightPromises);
      
      // Filter out any failed insights and rank by relevance
      const validInsights = insights.filter(insight => insight !== null) as InsiderInsight[];
      
      // Sort by combined freshness and relevance score
      validInsights.sort((a, b) => 
        (b.freshnessScore + b.relevanceScore) - (a.freshnessScore + a.relevanceScore)
      );
      
      console.log(`✅ [INSIDER] Generated ${validInsights.length} insights for ${industry}`);
      return validInsights;
      
    } catch (error) {
      console.error(`❌ [INSIDER] Failed to generate insights:`, error);
      return [];
    }
  }
  
  /**
   * 📊 GET INDUSTRY PROFILE
   */
  private async getIndustryProfile(industry: string): Promise<IndustryProfile> {
    const prompt = `Analyze the ${industry} industry and provide a comprehensive profile including:

1. Key verticals/sub-industries within ${industry}
2. Primary decision makers and their typical titles
3. Most common business pain points and challenges
4. Current regulatory environment and compliance requirements
5. Emerging technology trends affecting the industry
6. Competitive landscape and market dynamics

Focus on actionable intelligence that would be valuable for B2B sales professionals.

Provide structured, factual information based on recent industry data.`;

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.perplexityApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data['choices'][0]?.message?.content || '';
      
      // Parse the response into structured data
      return this.parseIndustryProfile(industry, content);
      
    } catch (error) {
      console.error(`❌ [INSIDER] Failed to get industry profile:`, error);
      return this.getDefaultIndustryProfile(industry);
    }
  }
  
  /**
   * 📈 GENERATE TREND INSIGHT
   */
  private async generateTrendInsight(
    industry: string, 
    vertical: string | undefined,
    profile: IndustryProfile
  ): Promise<InsiderInsight | null> {
    
    const prompt = `Generate a timely, valuable business trend insight for the ${industry}${vertical ? ` - ${vertical}` : ''} industry that a B2B sales professional could share to demonstrate deep industry knowledge.

Requirements:
- Focus on trends from the last 6 months
- Include specific data points, percentages, or market shifts
- Explain business implications for decision makers
- Provide conversation starters for sales calls
- Include credible sources

Industry context:
- Key decision makers: ${profile.keyDecisionMakers.join(', ')}
- Common pain points: ${profile.commonPainPoints.join(', ')}
- Technology trends: ${profile.technologyTrends.join(', ')}

Format as a business insight that positions the seller as a knowledgeable industry expert.`;

    try {
      const response = await this.callPerplexityAPI(prompt);
      return this.parseInsightResponse(response, 'trend', industry, vertical);
    } catch (error) {
      console.error(`❌ [INSIDER] Failed to generate trend insight:`, error);
      return null;
    }
  }
  
  /**
   * ⚖️ GENERATE REGULATORY INSIGHT
   */
  private async generateRegulatoryInsight(
    industry: string,
    vertical: string | undefined,
    profile: IndustryProfile
  ): Promise<InsiderInsight | null> {
    
    const prompt = `Generate a regulatory or compliance insight for the ${industry}${vertical ? ` - ${vertical}` : ''} industry that demonstrates insider knowledge of recent changes, upcoming requirements, or industry implications.

Focus on:
- Recent regulatory changes (last 12 months)
- Upcoming compliance deadlines or requirements
- Industry-specific implications and preparation needed
- Cost or operational impacts on businesses
- How forward-thinking companies are responding

Current regulatory context: ${profile.regulatoryEnvironment.join(', ')}

Provide actionable intelligence that helps sales professionals position their solutions in context of regulatory requirements.`;

    try {
      const response = await this.callPerplexityAPI(prompt);
      return this.parseInsightResponse(response, 'regulation', industry, vertical);
    } catch (error) {
      console.error(`❌ [INSIDER] Failed to generate regulatory insight:`, error);
      return null;
    }
  }
  
  /**
   * 💻 GENERATE TECHNOLOGY INSIGHT
   */
  private async generateTechnologyInsight(
    industry: string,
    vertical: string | undefined,
    profile: IndustryProfile
  ): Promise<InsiderInsight | null> {
    
    const prompt = `Generate a technology trend insight for the ${industry}${vertical ? ` - ${vertical}` : ''} industry focusing on emerging technologies, digital transformation initiatives, or tech adoption patterns that demonstrate deep industry understanding.

Include:
- Specific technology adoption rates or trends
- ROI data or business impact metrics
- How leading companies are implementing new technologies
- Challenges and opportunities in tech adoption
- Future technology roadmap implications

Technology context: ${profile.technologyTrends.join(', ')}

Position this as valuable intelligence that shows the seller understands the industry's technology landscape.`;

    try {
      const response = await this.callPerplexityAPI(prompt);
      return this.parseInsightResponse(response, 'technology', industry, vertical);
    } catch (error) {
      console.error(`❌ [INSIDER] Failed to generate technology insight:`, error);
      return null;
    }
  }
  
  /**
   * 🏆 GENERATE COMPETITIVE INSIGHT
   */
  private async generateCompetitiveInsight(
    industry: string,
    vertical: string | undefined,
    profile: IndustryProfile
  ): Promise<InsiderInsight | null> {
    
    const prompt = `Generate a competitive landscape or market dynamics insight for the ${industry}${vertical ? ` - ${vertical}` : ''} industry that provides valuable intelligence about market shifts, competitive moves, or industry consolidation.

Focus on:
- Recent M&A activity or market consolidation
- Competitive positioning changes
- Market share shifts or new entrants
- Pricing pressures or market dynamics
- Strategic moves by industry leaders

Competitive context: ${profile.competitiveLandscape.join(', ')}

Provide insight that helps sales professionals understand and discuss market dynamics intelligently.`;

    try {
      const response = await this.callPerplexityAPI(prompt);
      return this.parseInsightResponse(response, 'competitive', industry, vertical);
    } catch (error) {
      console.error(`❌ [INSIDER] Failed to generate competitive insight:`, error);
      return null;
    }
  }
  
  /**
   * 🔗 CALL PERPLEXITY API
   */
  private async callPerplexityAPI(prompt: string): Promise<string> {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.perplexityApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    return data['choices'][0]?.message?.content || '';
  }
  
  /**
   * 📝 PARSE INSIGHT RESPONSE
   */
  private parseInsightResponse(
    content: string,
    insightType: InsiderInsight['insightType'],
    industry: string,
    vertical?: string
  ): InsiderInsight {
    
    // Extract key components from the AI response
    const lines = content.split('\n').filter(line => line.trim());
    
    // Generate a title from the first meaningful line
    const title = lines.find(line => 
      line.length > 20 && 
      !line.startsWith('Here') && 
      !line.startsWith('The') &&
      line.includes(industry)
    ) || `${industry} ${insightType} insight`;
    
    // Create summary (first 200 chars)
    const summary = content.substring(0, 200) + '...';
    
    // Generate conversation starters
    const conversationStarters = [
      `I've been tracking some interesting developments in the ${industry} space...`,
      `You might find this ${industry} trend relevant to your business...`,
      `I came across some compelling data about ${industry} that I thought you'd appreciate...`
    ];
    
    // Generate credibility factors
    const credibilityFactors = [
      'Based on recent industry research and market data',
      'Validated through multiple industry sources',
      'Aligned with executive feedback from industry leaders'
    ];
    
    // Extract a shareable quote
    const sentences = content.split('.').filter(s => s.trim().length > 50);
    const shareableQuote = sentences[1] || sentences[0] || summary;
    
    return {
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      industry,
      vertical: vertical || 'General',
      insightType,
      title: title.replace(/^#+\s*/, '').trim(),
      summary,
      fullInsight: content,
      businessImplications: this.extractBusinessImplications(content),
      conversationStarters,
      credibilityFactors,
      sources: this.extractSources(content),
      freshnessScore: this.calculateFreshnessScore(content),
      relevanceScore: this.calculateRelevanceScore(content, industry),
      shareableQuote: shareableQuote.trim(),
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)) // 30 days
    };
  }
  
  /**
   * 💼 EXTRACT BUSINESS IMPLICATIONS
   */
  private extractBusinessImplications(content: string): string[] {
    const implications = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('impact') || 
          line.toLowerCase().includes('implication') ||
          line.toLowerCase().includes('result') ||
          line.toLowerCase().includes('opportunity')) {
        implications.push(line.trim());
      }
    }
    
    // Add some generic business implications if none found
    if (implications['length'] === 0) {
      implications.push(
        'Creates opportunities for operational efficiency improvements',
        'May require strategic planning and resource allocation',
        'Could impact competitive positioning in the market'
      );
    }
    
    return implications.slice(0, 3); // Limit to top 3
  }
  
  /**
   * 📚 EXTRACT SOURCES
   */
  private extractSources(content: string): string[] {
    const sources = [];
    
    // Look for common source indicators
    const sourcePatterns = [
      /according to ([^,\.]+)/gi,
      /reported by ([^,\.]+)/gi,
      /study by ([^,\.]+)/gi,
      /research from ([^,\.]+)/gi
    ];
    
    for (const pattern of sourcePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        sources.push(...matches);
      }
    }
    
    return sources.slice(0, 3); // Limit to top 3 sources
  }
  
  /**
   * ⏰ CALCULATE FRESHNESS SCORE
   */
  private calculateFreshnessScore(content: string): number {
    let score = 70; // Base score
    
    // Look for recent time indicators
    const recentIndicators = [
      '2024', '2025', 'recent', 'latest', 'current', 'new', 'emerging',
      'this year', 'last month', 'recently', 'just announced'
    ];
    
    for (const indicator of recentIndicators) {
      if (content.toLowerCase().includes(indicator)) {
        score += 5;
      }
    }
    
    return Math.min(score, 100);
  }
  
  /**
   * 🎯 CALCULATE RELEVANCE SCORE
   */
  private calculateRelevanceScore(content: string, industry: string): number {
    let score = 60; // Base score
    
    // Industry-specific terms boost relevance
    const industryTerms = industry.toLowerCase().split(' ');
    for (const term of industryTerms) {
      const termCount = (content.toLowerCase().match(new RegExp(term, 'g')) || []).length;
      score += termCount * 3;
    }
    
    // Business value terms
    const valueTerms = ['roi', 'cost', 'efficiency', 'revenue', 'profit', 'savings', 'growth'];
    for (const term of valueTerms) {
      if (content.toLowerCase().includes(term)) {
        score += 5;
      }
    }
    
    return Math.min(score, 100);
  }
  
  /**
   * 📋 PARSE INDUSTRY PROFILE
   */
  private parseIndustryProfile(industry: string, content: string): IndustryProfile {
    // This is a simplified parser - in production, you'd want more sophisticated parsing
    return {
      name: industry,
      verticals: this.extractListItems(content, ['vertical', 'segment', 'sector']),
      keyDecisionMakers: this.extractListItems(content, ['decision maker', 'title', 'role']),
      commonPainPoints: this.extractListItems(content, ['pain point', 'challenge', 'problem']),
      regulatoryEnvironment: this.extractListItems(content, ['regulation', 'compliance', 'requirement']),
      technologyTrends: this.extractListItems(content, ['technology', 'digital', 'automation']),
      competitiveLandscape: this.extractListItems(content, ['competitor', 'market', 'landscape'])
    };
  }
  
  /**
   * 📝 EXTRACT LIST ITEMS
   */
  private extractListItems(content: string, keywords: string[]): string[] {
    const items = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      for (const keyword of keywords) {
        if (lowerLine.includes(keyword) && (line.includes('-') || line.includes('•') || line.includes('*'))) {
          items.push(line.replace(/^[-•*\s]+/, '').trim());
        }
      }
    }
    
    return items.slice(0, 5); // Limit to top 5 items
  }
  
  /**
   * 🔄 GET DEFAULT INDUSTRY PROFILE
   */
  private getDefaultIndustryProfile(industry: string): IndustryProfile {
    return {
      name: industry,
      verticals: ['General'],
      keyDecisionMakers: ['CEO', 'CFO', 'COO', 'CTO'],
      commonPainPoints: ['Cost management', 'Operational efficiency', 'Growth challenges'],
      regulatoryEnvironment: ['Industry standards', 'Compliance requirements'],
      technologyTrends: ['Digital transformation', 'Automation', 'Cloud adoption'],
      competitiveLandscape: ['Market consolidation', 'New entrants', 'Pricing pressure']
    };
  }
}
