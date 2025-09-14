/**
 * 💰 COST OPTIMIZER
 * 
 * Intelligent cost management for API usage
 * Tracks spending, optimizes API selection, and enforces budgets
 */

import { APIConfig, CostBreakdown, ResearchRequest } from '../types/intelligence';

interface APIUsage {
  api: string;
  requests: number;
  cost: number;
  lastUsed: Date;
  successRate: number;
}

export class CostOptimizer {
  private config: APIConfig;
  private apiUsage: Map<string, APIUsage> = new Map();
  private dailyBudget: number = 100; // Default $100 daily budget
  private dailySpent: number = 0;
  private lastResetDate: Date = new Date();

  // API Cost Structure (per request)
  private apiCosts: Record<string, number> = {
    perplexity: 0.02,     // $0.02 per request
    openai: 0.03,         // $0.03 per request  
    coresignal: 0.10,     // $0.10 per request
    lusha: 0.15,          // $0.15 per successful contact
    prospeo: 0.08,        // $0.08 per email search
    zerobounce: 0.01,     // $0.01 per email validation
    myemailverifier: 0.005 // $0.005 per email validation
  };

  constructor(config: APIConfig, dailyBudget: number = 100) {
    this['config'] = config;
    this['dailyBudget'] = dailyBudget;
    this.resetDailyCountersIfNeeded();
  }

  /**
   * 💰 CHECK BUDGET BEFORE REQUEST
   */
  async checkBudget(api: string, estimatedCost: number): Promise<{
    allowed: boolean;
    reason?: string;
    alternativeApi?: string;
  }> {
    this.resetDailyCountersIfNeeded();

    // Check daily budget
    if (this.dailySpent + estimatedCost > this.dailyBudget) {
      console.log(`💰 [COST] Daily budget exceeded: $${this.dailySpent.toFixed(2)} + $${estimatedCost.toFixed(2)} > $${this.dailyBudget}`);
      
      // Suggest cheaper alternative
      const alternative = this.suggestCheaperAlternative(api);
      return {
        allowed: false,
        reason: 'Daily budget exceeded',
        alternativeApi: alternative
      };
    }

    // Check API-specific limits
    const usage = this.apiUsage.get(api);
    if (usage && usage.successRate < 0.5) {
      console.log(`💰 [COST] Low success rate for ${api}: ${(usage.successRate * 100).toFixed(1)}%`);
      
      const alternative = this.suggestCheaperAlternative(api);
      return {
        allowed: false,
        reason: 'Low success rate',
        alternativeApi: alternative
      };
    }

    return { allowed: true };
  }

  /**
   * 📊 RECORD API USAGE
   */
  recordUsage(api: string, cost: number, success: boolean): void {
    const existing = this.apiUsage.get(api) || {
      api,
      requests: 0,
      cost: 0,
      lastUsed: new Date(),
      successRate: 1.0
    };

    existing.requests++;
    existing.cost += cost;
    existing['lastUsed'] = new Date();
    
    // Update success rate (moving average)
    const alpha = 0.1; // Learning rate
    existing['successRate'] = alpha * (success ? 1 : 0) + (1 - alpha) * existing.successRate;

    this.apiUsage.set(api, existing);
    this.dailySpent += cost;

    console.log(`💰 [COST] ${api}: $${cost.toFixed(3)} (success: ${success}), daily total: $${this.dailySpent.toFixed(2)}`);
  }

  /**
   * 🎯 OPTIMIZE API SELECTION
   */
  optimizeApiSelection(purpose: string, availableApis: string[]): string {
    // Define API preferences by purpose
    const preferences: Record<string, string[]> = {
      'executive_research': ['perplexity', 'openai'],
      'contact_discovery': ['lusha', 'prospeo', 'coresignal'],
      'email_validation': ['myemailverifier', 'zerobounce'],
      'company_research': ['perplexity', 'coresignal']
    };

    const preferred = preferences[purpose] || availableApis;
    
    // Filter by available APIs and budget
    const viable = preferred.filter(api => {
      if (!availableApis.includes(api)) return false;
      
      const cost = this['apiCosts'][api] || 0.05;
      return this.dailySpent + cost <= this.dailyBudget;
    });

    if (viable['length'] === 0) {
      console.log(`💰 [COST] No viable APIs for ${purpose}, using cheapest available`);
      return this.getCheapestApi(availableApis);
    }

    // Select based on cost-effectiveness (success rate / cost)
    let bestApi = viable[0];
    let bestScore = 0;

    for (const api of viable) {
      const usage = this.apiUsage.get(api);
      const successRate = usage?.successRate || 0.8; // Default optimistic rate
      const cost = this['apiCosts'][api] || 0.05;
      const score = successRate / cost;

      if (score > bestScore) {
        bestScore = score;
        bestApi = api;
      }
    }

    console.log(`💰 [COST] Selected ${bestApi} for ${purpose} (score: ${bestScore.toFixed(2)})`);
    return bestApi;
  }

  /**
   * 💸 ESTIMATE REQUEST COST
   */
  estimateRequestCost(request: ResearchRequest): CostBreakdown {
    const breakdown: CostBreakdown = {
      perplexity: 0,
      coresignal: 0,
      lusha: 0,
      prospeo: 0,
      zerobounce: 0,
      total: 0,
      currency: 'USD'
    };

    const accountCount = request.accounts.length;
    const roleCount = request.targetRoles.length;

    // Base research cost (Perplexity for executive research)
    breakdown['perplexity'] = accountCount * roleCount * this.apiCosts.perplexity;

    // Contact discovery cost (varies by research depth)
    switch (request.researchDepth) {
      case 'quick':
        // Just basic research, no contact APIs
        break;
      case 'thorough':
        breakdown['lusha'] = accountCount * roleCount * 0.5 * this.apiCosts.lusha; // 50% success rate
        breakdown['zerobounce'] = accountCount * roleCount * 0.3 * this.apiCosts.zerobounce; // 30% need validation
        break;
      case 'comprehensive':
        breakdown['coresignal'] = accountCount * this.apiCosts.coresignal;
        breakdown['lusha'] = accountCount * roleCount * 0.7 * this.apiCosts.lusha; // 70% success rate
        breakdown['prospeo'] = accountCount * roleCount * 0.3 * this.apiCosts.prospeo; // 30% need email search
        breakdown['zerobounce'] = accountCount * roleCount * 0.5 * this.apiCosts.zerobounce; // 50% need validation
        break;
    }

    breakdown['total'] = Object.values(breakdown).reduce((sum, cost) => 
      typeof cost === 'number' ? sum + cost : sum, 0
    );

    return breakdown;
  }

  /**
   * 🔄 SUGGEST CHEAPER ALTERNATIVE
   */
  private suggestCheaperAlternative(api: string): string | undefined {
    const alternatives: Record<string, string[]> = {
      'lusha': ['prospeo', 'coresignal'],
      'prospeo': ['myemailverifier'],
      'zerobounce': ['myemailverifier'],
      'coresignal': ['perplexity'],
      'openai': ['perplexity']
    };

    const options = alternatives[api];
    if (!options) return undefined;

    // Return cheapest alternative
    return options.reduce((cheapest, current) => {
      const cheapestCost = this['apiCosts'][cheapest] || 1.0;
      const currentCost = this['apiCosts'][current] || 1.0;
      return currentCost < cheapestCost ? current : cheapest;
    });
  }

  /**
   * 💲 GET CHEAPEST API
   */
  private getCheapestApi(apis: string[]): string {
    return apis.reduce((cheapest, current) => {
      const cheapestCost = this['apiCosts'][cheapest] || 1.0;
      const currentCost = this['apiCosts'][current] || 1.0;
      return currentCost < cheapestCost ? current : cheapest;
    });
  }

  /**
   * 🔄 RESET DAILY COUNTERS
   */
  private resetDailyCountersIfNeeded(): void {
    const today = new Date();
    const lastReset = this.lastResetDate;

    if (today.toDateString() !== lastReset.toDateString()) {
      console.log(`💰 [COST] Resetting daily counters - spent yesterday: $${this.dailySpent.toFixed(2)}`);
      this['dailySpent'] = 0;
      this['lastResetDate'] = today;
    }
  }

  /**
   * 📊 GET COST SUMMARY
   */
  getCostSummary(): {
    dailySpent: number;
    dailyBudget: number;
    remainingBudget: number;
    apiUsage: APIUsage[];
    topSpenders: { api: string; cost: number }[];
  } {
    this.resetDailyCountersIfNeeded();

    const apiUsageArray = Array.from(this.apiUsage.values());
    const topSpenders = apiUsageArray
      .map(usage => ({ api: usage.api, cost: usage.cost }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);

    return {
      dailySpent: this.dailySpent,
      dailyBudget: this.dailyBudget,
      remainingBudget: this.dailyBudget - this.dailySpent,
      apiUsage: apiUsageArray,
      topSpenders
    };
  }

  /**
   * ⚙️ UPDATE BUDGET
   */
  updateDailyBudget(newBudget: number): void {
    console.log(`💰 [COST] Budget updated: $${this.dailyBudget} → $${newBudget}`);
    this['dailyBudget'] = newBudget;
  }

  /**
   * 🚨 CHECK BUDGET ALERT
   */
  checkBudgetAlert(): {
    level: 'none' | 'warning' | 'critical';
    message: string;
    percentage: number;
  } {
    this.resetDailyCountersIfNeeded();
    
    const percentage = (this.dailySpent / this.dailyBudget) * 100;
    
    if (percentage >= 90) {
      return {
        level: 'critical',
        message: `Critical: ${percentage.toFixed(1)}% of daily budget used ($${this.dailySpent.toFixed(2)}/$${this.dailyBudget})`,
        percentage
      };
    } else if (percentage >= 70) {
      return {
        level: 'warning', 
        message: `Warning: ${percentage.toFixed(1)}% of daily budget used ($${this.dailySpent.toFixed(2)}/$${this.dailyBudget})`,
        percentage
      };
    }

    return {
      level: 'none',
      message: `Budget healthy: ${percentage.toFixed(1)}% used ($${this.dailySpent.toFixed(2)}/$${this.dailyBudget})`,
      percentage
    };
  }
}
