/**
 * 🌊 DYNAMIC WATERFALL ENGINE
 * 
 * Intelligent waterfall system that dynamically finds the best available executive
 * when target role isn't available. Uses real-time AI to determine hierarchy.
 */

import { ExecutiveContact, APIConfig } from '../types/intelligence';

// Ensure fetch is available
if (typeof fetch === 'undefined') {
  global['fetch'] = require('node-fetch');
}

interface WaterfallCandidate {
  executive: ExecutiveContact;
  suitabilityScore: number;
  reasoning: string;
  tier: number;
}

export class DynamicWaterfallEngine {
  private config: APIConfig;

  constructor(config: APIConfig) {
    this['config'] = config;
  }

  /**
   * 🌊 DYNAMIC WATERFALL ROLE DISCOVERY
   */
  async findBestAlternative(
    targetRole: string,
    availableExecutives: ExecutiveContact[],
    companyName: string,
    dealContext?: { size: number; productCategory: string }
  ): Promise<WaterfallCandidate | null> {
    console.log(`\n🌊 [WATERFALL] Finding best alternative for ${targetRole} at ${companyName}`);
    
    if (availableExecutives['length'] === 0) {
      return null;
    }

    // Step 1: Score all available executives for target role suitability
    const candidates: WaterfallCandidate[] = [];
    
    for (const executive of availableExecutives) {
      const suitability = await this.scoreExecutiveSuitability(
        executive,
        targetRole,
        companyName,
        dealContext
      );
      
      if (suitability.score > 30) { // Minimum threshold
        candidates.push({
          executive,
          suitabilityScore: suitability.score,
          reasoning: suitability.reasoning,
          tier: suitability.tier
        });
      }
    }

    // Step 2: Sort by suitability score and return best candidate
    candidates.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
    
    if (candidates.length > 0) {
      const bestCandidate = candidates[0];
      console.log(`   ✅ Best alternative: ${bestCandidate.executive.name} (${bestCandidate.executive.role})`);
      console.log(`   📊 Suitability: ${bestCandidate.suitabilityScore}% - ${bestCandidate.reasoning}`);
      return bestCandidate;
    }

    return null;
  }

  /**
   * 📊 SCORE EXECUTIVE SUITABILITY FOR TARGET ROLE
   */
  private async scoreExecutiveSuitability(
    executive: ExecutiveContact,
    targetRole: string,
    companyName: string,
    dealContext?: { size: number; productCategory: string }
  ): Promise<{ score: number; reasoning: string; tier: number }> {
    let score = 0;
    let reasoning = '';
    let tier = 5; // Default lowest tier

    const executiveRole = executive.role;
    const executiveTitle = executive.title?.toLowerCase() || '';
    const dealSize = dealContext?.size || 100000;
    const productCategory = dealContext?.productCategory || 'software';

    // AI-powered suitability analysis for dynamic adaptation
    if (this.config.PERPLEXITY_API_KEY) {
      const aiSuitability = await this.aiSuitabilityAnalysis(
        executive,
        targetRole,
        companyName,
        dealContext
      );
      
      if (aiSuitability.score > 0) {
        return aiSuitability;
      }
    }

    // Fallback to rule-based scoring
    switch (targetRole) {
      case 'CFO':
        if (executiveRole === 'CEO') {
          score = dealSize < 500000 ? 80 : 60; // CEO can act as CFO for smaller deals
          reasoning = `CEO can handle budget decisions for ${dealSize < 500000 ? 'departmental' : 'enterprise'} deals`;
          tier = 2;
        } else if (executiveRole === 'COO') {
          score = 70;
          reasoning = 'COO often has operational budget authority';
          tier = 3;
        } else if (executiveTitle.includes('finance') || executiveTitle.includes('controller')) {
          score = 85;
          reasoning = 'Finance role can escalate to budget authority';
          tier = 2;
        }
        break;

      case 'CRO':
        if (executiveRole === 'CEO') {
          score = dealSize < 300000 ? 75 : 50; // CEO involvement for revenue decisions
          reasoning = `CEO drives revenue strategy for ${dealSize < 300000 ? 'departmental' : 'enterprise'} deals`;
          tier = 2;
        } else if (executiveRole === 'CMO') {
          score = 70;
          reasoning = 'CMO often involved in revenue-generating technology decisions';
          tier = 3;
        } else if (executiveTitle.includes('sales') || executiveTitle.includes('revenue')) {
          score = 85;
          reasoning = 'Sales/revenue role can represent revenue leadership';
          tier = 2;
        }
        break;

      case 'CTO':
        if (executiveRole === 'CEO') {
          score = 70;
          reasoning = 'CEO makes technology decisions in smaller companies';
          tier = 2;
        } else if (executiveRole === 'COO') {
          score = 65;
          reasoning = 'COO often oversees technology operations';
          tier = 3;
        } else if (executiveTitle.includes('technology') || executiveTitle.includes('engineering')) {
          score = 90;
          reasoning = 'Technology/engineering role represents technical leadership';
          tier = 1;
        }
        break;
    }

    return { score, reasoning, tier };
  }

  /**
   * 🤖 AI SUITABILITY ANALYSIS
   */
  private async aiSuitabilityAnalysis(
    executive: ExecutiveContact,
    targetRole: string,
    companyName: string,
    dealContext?: { size: number; productCategory: string }
  ): Promise<{ score: number; reasoning: string; tier: number }> {
    if (!this.config.PERPLEXITY_API_KEY) {
      return { score: 0, reasoning: '', tier: 5 };
    }

    const prompt = `Analyze if ${executive.name} (${executive.title}) at ${companyName} could serve as an effective ${targetRole} contact for a ${dealContext?.productCategory || 'software'} sale.

Consider:
1. Does their role give them authority for ${targetRole} decisions?
2. Would they be involved in ${dealContext?.productCategory || 'software'} purchasing?
3. Do they have budget authority for $${dealContext?.size?.toLocaleString() || '100,000'} deals?
4. What's their suitability score (0-100)?

Respond with just: SCORE: [0-100] | REASONING: [brief explanation]`;

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
          max_tokens: 150,
          temperature: 0.1
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        // Parse AI response
        const scoreMatch = content.match(/SCORE:\s*(\d+)/i);
        const reasoningMatch = content.match(/REASONING:\s*(.+)/i);

        const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
        const reasoning = reasoningMatch?.[1]?.trim() || 'AI analysis completed';
        const tier = score > 80 ? 1 : score > 60 ? 2 : score > 40 ? 3 : 4;

        return { score, reasoning, tier };
      }
    } catch (error) {
      console.log(`   ⚠️ AI suitability analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { score: 0, reasoning: '', tier: 5 };
  }

  /**
   * 🎯 SELLER SKILL-BASED OPTIMIZATION
   */
  optimizeForSellerSkill(
    buyerGroup: any,
    sellerSkillLevel: 'junior' | 'mid' | 'senior' | 'expert'
  ): {
    recommendedContact: ExecutiveContact;
    approach: string;
    reasoning: string;
  } {
    let recommendedContact = buyerGroup.decisionMaker;
    let approach = 'Direct approach';
    let reasoning = '';

    switch (sellerSkillLevel) {
      case 'expert':
        // Expert sellers can go high (C-level direct)
        recommendedContact = buyerGroup.decisionMaker || buyerGroup.champion;
        approach = 'C-level direct approach';
        reasoning = 'Expert seller can handle C-level conversations and complex deals';
        break;

      case 'senior':
        // Senior sellers can use introducers to go higher
        if (buyerGroup.introducers.length > 0) {
          recommendedContact = buyerGroup['introducers'][0];
          approach = 'Introducer-facilitated approach';
          reasoning = 'Senior seller uses introducer to access decision makers';
        } else {
          recommendedContact = buyerGroup.champion || buyerGroup.decisionMaker;
          approach = 'Champion-first approach';
          reasoning = 'Senior seller builds champion relationship first';
        }
        break;

      case 'mid':
        // Mid-level sellers start with influencers/stakeholders
        recommendedContact = buyerGroup['influencers'][0] || buyerGroup['stakeholders'][0] || buyerGroup.champion;
        approach = 'Influencer-led approach';
        reasoning = 'Mid-level seller builds consensus through influencers';
        break;

      case 'junior':
        // Junior sellers start lowest and work up
        recommendedContact = buyerGroup['stakeholders'][0] || buyerGroup['influencers'][0] || buyerGroup.champion;
        approach = 'Stakeholder-first approach';
        reasoning = 'Junior seller starts with stakeholders and builds relationships upward';
        break;
    }

    return {
      recommendedContact: recommendedContact || buyerGroup.decisionMaker,
      approach,
      reasoning
    };
  }
}
