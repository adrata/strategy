/**
 * 💰 MODEL COST TRACKER
 * 
 * Comprehensive cost tracking and analytics for AI model usage.
 * Monitors spending, calculates savings, and provides insights
 * for cost optimization.
 */

export interface CostRecord {
  id: string;
  timestamp: Date;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  category: 'simple' | 'standard' | 'complex' | 'research';
  complexity: number;
  processingTime: number;
  userId?: string;
  workspaceId?: string;
  appType?: string;
  success: boolean;
  fallbackUsed: boolean;
}

export interface CostAnalytics {
  totalCost: number;
  totalTokens: number;
  totalRequests: number;
  averageCostPerRequest: number;
  averageTokensPerRequest: number;
  costByModel: Record<string, number>;
  costByCategory: Record<string, number>;
  costByProvider: Record<string, number>;
  costByApp: Record<string, number>;
  costByUser: Record<string, number>;
  costByWorkspace: Record<string, number>;
  dailyCosts: Record<string, number>;
  hourlyCosts: Record<string, number>;
  savings: {
    estimatedWithoutOptimization: number;
    actualSavings: number;
    savingsPercentage: number;
  };
  trends: {
    costTrend: 'increasing' | 'decreasing' | 'stable';
    usageTrend: 'increasing' | 'decreasing' | 'stable';
    efficiencyTrend: 'improving' | 'declining' | 'stable';
  };
}

export interface CostAlert {
  id: string;
  type: 'budget_exceeded' | 'unusual_spike' | 'inefficient_usage' | 'high_cost_model';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  data: any;
  resolved: boolean;
}

export class ModelCostTracker {
  private static instance: ModelCostTracker;
  private records: CostRecord[] = [];
  private alerts: CostAlert[] = [];
  private budgets: Map<string, number> = new Map(); // workspaceId -> budget
  private thresholds: Map<string, number> = new Map(); // alert type -> threshold

  // Model pricing for comparison (without OpenRouter 5% fee)
  private directModelPricing: Record<string, { input: number; output: number }> = {
    'anthropic/claude-haiku-4.0': { input: 0.25, output: 1.25 },
    'anthropic/claude-sonnet-4.5': { input: 3.0, output: 15.0 },
    'anthropic/claude-opus-4.0': { input: 15.0, output: 75.0 },
    'openai/gpt-4o-mini': { input: 0.15, output: 0.60 },
    'openai/gpt-4o': { input: 2.50, output: 10.0 },
    'openai/gpt-4.5-preview': { input: 75.0, output: 150.0 },
    'perplexity/llama-3.1-sonar-large-128k-online': { input: 5.0, output: 5.0 },
    'google/gemini-2.0-flash-exp': { input: 0.75, output: 3.0 }
  };

  public static getInstance(): ModelCostTracker {
    if (!ModelCostTracker.instance) {
      ModelCostTracker.instance = new ModelCostTracker();
    }
    return ModelCostTracker.instance;
  }

  /**
   * Record a cost entry
   */
  public recordCost(data: {
    model: string;
    provider: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    category: 'simple' | 'standard' | 'complex' | 'research';
    complexity: number;
    processingTime: number;
    userId?: string;
    workspaceId?: string;
    appType?: string;
    success: boolean;
    fallbackUsed: boolean;
  }): string {
    const record: CostRecord = {
      id: this.generateId(),
      timestamp: new Date(),
      ...data,
      totalTokens: data.inputTokens + data.outputTokens
    };

    this.records.push(record);

    // Check for alerts
    this.checkAlerts(record);

    // Clean up old records (keep last 30 days)
    this.cleanupOldRecords();

    return record.id;
  }

  /**
   * Get comprehensive cost analytics
   */
  public getAnalytics(
    startDate?: Date,
    endDate?: Date,
    workspaceId?: string,
    userId?: string
  ): CostAnalytics {
    const filteredRecords = this.filterRecords(startDate, endDate, workspaceId, userId);
    
    if (filteredRecords.length === 0) {
      return this.getEmptyAnalytics();
    }

    const totalCost = filteredRecords.reduce((sum, r) => sum + r.cost, 0);
    const totalTokens = filteredRecords.reduce((sum, r) => sum + r.totalTokens, 0);
    const totalRequests = filteredRecords.length;

    return {
      totalCost,
      totalTokens,
      totalRequests,
      averageCostPerRequest: totalCost / totalRequests,
      averageTokensPerRequest: totalTokens / totalRequests,
      costByModel: this.aggregateByField(filteredRecords, 'model', 'cost'),
      costByCategory: this.aggregateByField(filteredRecords, 'category', 'cost'),
      costByProvider: this.aggregateByField(filteredRecords, 'provider', 'cost'),
      costByApp: this.aggregateByField(filteredRecords, 'appType', 'cost'),
      costByUser: this.aggregateByField(filteredRecords, 'userId', 'cost'),
      costByWorkspace: this.aggregateByField(filteredRecords, 'workspaceId', 'cost'),
      dailyCosts: this.aggregateByDate(filteredRecords, 'day'),
      hourlyCosts: this.aggregateByDate(filteredRecords, 'hour'),
      savings: this.calculateSavings(filteredRecords),
      trends: this.calculateTrends(filteredRecords)
    };
  }

  /**
   * Get cost breakdown by time period
   */
  public getCostBreakdown(
    period: 'hour' | 'day' | 'week' | 'month',
    startDate?: Date,
    endDate?: Date
  ): Record<string, number> {
    const filteredRecords = this.filterRecords(startDate, endDate);
    return this.aggregateByDate(filteredRecords, period);
  }

  /**
   * Get model efficiency metrics
   */
  public getModelEfficiency(): Record<string, {
    totalCost: number;
    totalRequests: number;
    averageCostPerRequest: number;
    averageTokensPerRequest: number;
    successRate: number;
    averageProcessingTime: number;
    costPerThousandTokens: number;
  }> {
    const modelStats: Record<string, any> = {};

    this.records.forEach(record => {
      if (!modelStats[record.model]) {
        modelStats[record.model] = {
          totalCost: 0,
          totalRequests: 0,
          totalTokens: 0,
          successfulRequests: 0,
          totalProcessingTime: 0
        };
      }

      const stats = modelStats[record.model];
      stats.totalCost += record.cost;
      stats.totalRequests += 1;
      stats.totalTokens += record.totalTokens;
      stats.totalProcessingTime += record.processingTime;
      
      if (record.success) {
        stats.successfulRequests += 1;
      }
    });

    // Calculate derived metrics
    Object.keys(modelStats).forEach(model => {
      const stats = modelStats[model];
      stats.averageCostPerRequest = stats.totalCost / stats.totalRequests;
      stats.averageTokensPerRequest = stats.totalTokens / stats.totalRequests;
      stats.successRate = stats.successfulRequests / stats.totalRequests;
      stats.averageProcessingTime = stats.totalProcessingTime / stats.totalRequests;
      stats.costPerThousandTokens = (stats.totalCost / stats.totalTokens) * 1000;
    });

    return modelStats;
  }

  /**
   * Set budget for workspace
   */
  public setBudget(workspaceId: string, budget: number): void {
    this.budgets.set(workspaceId, budget);
  }

  /**
   * Get budget status
   */
  public getBudgetStatus(workspaceId: string): {
    budget: number;
    spent: number;
    remaining: number;
    percentage: number;
    status: 'under' | 'warning' | 'exceeded';
  } {
    const budget = this.budgets.get(workspaceId) || 0;
    const spent = this.getAnalytics(undefined, undefined, workspaceId).totalCost;
    const remaining = budget - spent;
    const percentage = budget > 0 ? (spent / budget) * 100 : 0;

    let status: 'under' | 'warning' | 'exceeded' = 'under';
    if (percentage >= 100) status = 'exceeded';
    else if (percentage >= 80) status = 'warning';

    return { budget, spent, remaining, percentage, status };
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): CostAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Resolve alert
   */
  public resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  /**
   * Export cost data
   */
  public exportData(
    format: 'json' | 'csv',
    startDate?: Date,
    endDate?: Date
  ): string {
    const filteredRecords = this.filterRecords(startDate, endDate);
    
    if (format === 'json') {
      return JSON.stringify(filteredRecords, null, 2);
    } else {
      return this.convertToCSV(filteredRecords);
    }
  }

  /**
   * Get cost optimization recommendations
   */
  public getOptimizationRecommendations(): {
    highCostModels: string[];
    inefficientUsage: string[];
    potentialSavings: number;
    recommendations: string[];
  } {
    const analytics = this.getAnalytics();
    const modelEfficiency = this.getModelEfficiency();
    
    const highCostModels: string[] = [];
    const inefficientUsage: string[] = [];
    let potentialSavings = 0;
    const recommendations: string[] = [];

    // Find high-cost models
    Object.entries(modelEfficiency).forEach(([model, stats]) => {
      if (stats.costPerThousandTokens > 10) { // More than $10 per 1K tokens
        highCostModels.push(model);
        potentialSavings += stats.totalCost * 0.3; // Assume 30% savings
      }
    });

    // Find inefficient usage patterns
    if (analytics.costByCategory.complex > analytics.costByCategory.simple * 2) {
      inefficientUsage.push('Too many complex queries for simple tasks');
      recommendations.push('Consider routing more queries to simpler models');
    }

    if (analytics.averageCostPerRequest > 0.05) { // More than 5 cents per request
      inefficientUsage.push('High average cost per request');
      recommendations.push('Review query complexity and model selection');
    }

    // Add specific recommendations
    if (highCostModels.length > 0) {
      recommendations.push(`Consider using cheaper alternatives for: ${highCostModels.join(', ')}`);
    }

    if (analytics.savings.savingsPercentage < 20) {
      recommendations.push('Optimize model routing to achieve better cost savings');
    }

    return {
      highCostModels,
      inefficientUsage,
      potentialSavings,
      recommendations
    };
  }

  // Private helper methods

  private filterRecords(
    startDate?: Date,
    endDate?: Date,
    workspaceId?: string,
    userId?: string
  ): CostRecord[] {
    return this.records.filter(record => {
      if (startDate && record.timestamp < startDate) return false;
      if (endDate && record.timestamp > endDate) return false;
      if (workspaceId && record.workspaceId !== workspaceId) return false;
      if (userId && record.userId !== userId) return false;
      return true;
    });
  }

  private aggregateByField(records: CostRecord[], field: keyof CostRecord, valueField: 'cost' | 'totalTokens'): Record<string, number> {
    const result: Record<string, number> = {};
    
    records.forEach(record => {
      const key = String(record[field] || 'unknown');
      result[key] = (result[key] || 0) + record[valueField];
    });
    
    return result;
  }

  private aggregateByDate(records: CostRecord[], period: 'hour' | 'day' | 'week' | 'month'): Record<string, number> {
    const result: Record<string, number> = {};
    
    records.forEach(record => {
      const date = new Date(record.timestamp);
      let key: string;
      
      switch (period) {
        case 'hour':
          key = date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
          break;
        case 'day':
          key = date.toISOString().slice(0, 10); // YYYY-MM-DD
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().slice(0, 10);
          break;
        case 'month':
          key = date.toISOString().slice(0, 7); // YYYY-MM
          break;
        default:
          key = date.toISOString().slice(0, 10);
      }
      
      result[key] = (result[key] || 0) + record.cost;
    });
    
    return result;
  }

  private calculateSavings(records: CostRecord[]): {
    estimatedWithoutOptimization: number;
    actualSavings: number;
    savingsPercentage: number;
  } {
    let estimatedWithoutOptimization = 0;
    let actualCost = 0;

    records.forEach(record => {
      actualCost += record.cost;
      
      // Calculate what it would have cost with direct API (no optimization)
      const directPricing = this.directModelPricing[record.model];
      if (directPricing) {
        const directCost = (record.inputTokens / 1000000) * directPricing.input +
                          (record.outputTokens / 1000000) * directPricing.output;
        estimatedWithoutOptimization += directCost;
      } else {
        estimatedWithoutOptimization += record.cost; // Fallback
      }
    });

    const actualSavings = estimatedWithoutOptimization - actualCost;
    const savingsPercentage = estimatedWithoutOptimization > 0 ? 
      (actualSavings / estimatedWithoutOptimization) * 100 : 0;

    return {
      estimatedWithoutOptimization,
      actualSavings,
      savingsPercentage
    };
  }

  private calculateTrends(records: CostRecord[]): {
    costTrend: 'increasing' | 'decreasing' | 'stable';
    usageTrend: 'increasing' | 'decreasing' | 'stable';
    efficiencyTrend: 'improving' | 'declining' | 'stable';
  } {
    if (records.length < 2) {
      return {
        costTrend: 'stable',
        usageTrend: 'stable',
        efficiencyTrend: 'stable'
      };
    }

    // Sort by date
    const sortedRecords = [...records].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Split into two halves
    const midPoint = Math.floor(sortedRecords.length / 2);
    const firstHalf = sortedRecords.slice(0, midPoint);
    const secondHalf = sortedRecords.slice(midPoint);

    // Calculate averages
    const firstHalfCost = firstHalf.reduce((sum, r) => sum + r.cost, 0) / firstHalf.length;
    const secondHalfCost = secondHalf.reduce((sum, r) => sum + r.cost, 0) / secondHalf.length;
    
    const firstHalfTokens = firstHalf.reduce((sum, r) => sum + r.totalTokens, 0) / firstHalf.length;
    const secondHalfTokens = secondHalf.reduce((sum, r) => sum + r.totalTokens, 0) / secondHalf.length;
    
    const firstHalfEfficiency = firstHalfCost / firstHalfTokens;
    const secondHalfEfficiency = secondHalfCost / secondHalfTokens;

    // Determine trends
    const costTrend = this.getTrend(firstHalfCost, secondHalfCost);
    const usageTrend = this.getTrend(firstHalfTokens, secondHalfTokens);
    const efficiencyTrend = this.getTrend(firstHalfEfficiency, secondHalfEfficiency, true);

    return { costTrend, usageTrend, efficiencyTrend };
  }

  private getTrend(first: number, second: number, reverse = false): 'increasing' | 'decreasing' | 'stable' {
    const change = (second - first) / first;
    const threshold = 0.1; // 10% change threshold
    
    if (Math.abs(change) < threshold) return 'stable';
    
    const isIncreasing = change > 0;
    if (reverse) {
      return isIncreasing ? 'declining' : 'improving';
    } else {
      return isIncreasing ? 'increasing' : 'decreasing';
    }
  }

  private checkAlerts(record: CostRecord): void {
    // Budget exceeded alert
    if (record.workspaceId) {
      const budgetStatus = this.getBudgetStatus(record.workspaceId);
      if (budgetStatus.status === 'exceeded') {
        this.createAlert({
          type: 'budget_exceeded',
          severity: 'high',
          message: `Budget exceeded for workspace ${record.workspaceId}`,
          data: budgetStatus
        });
      }
    }

    // Unusual spike alert
    const recentCosts = this.getCostBreakdown('hour', 
      new Date(Date.now() - 24 * 60 * 60 * 1000), 
      new Date()
    );
    const currentHour = new Date().toISOString().slice(0, 13);
    const currentHourCost = recentCosts[currentHour] || 0;
    const avgHourlyCost = Object.values(recentCosts).reduce((sum, cost) => sum + cost, 0) / Object.keys(recentCosts).length;
    
    if (currentHourCost > avgHourlyCost * 3) {
      this.createAlert({
        type: 'unusual_spike',
        severity: 'medium',
        message: `Unusual cost spike detected: $${currentHourCost.toFixed(4)} in current hour`,
        data: { currentHourCost, avgHourlyCost }
      });
    }

    // High cost model alert
    if (record.cost > 0.10) { // More than 10 cents
      this.createAlert({
        type: 'high_cost_model',
        severity: 'low',
        message: `High cost request: $${record.cost.toFixed(4)} using ${record.model}`,
        data: { model: record.model, cost: record.cost }
      });
    }
  }

  private createAlert(alertData: Omit<CostAlert, 'id' | 'timestamp' | 'resolved'>): void {
    const alert: CostAlert = {
      id: this.generateId(),
      timestamp: new Date(),
      resolved: false,
      ...alertData
    };
    
    this.alerts.push(alert);
  }

  private cleanupOldRecords(): void {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.records = this.records.filter(record => record.timestamp > thirtyDaysAgo);
  }

  private generateId(): string {
    return `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getEmptyAnalytics(): CostAnalytics {
    return {
      totalCost: 0,
      totalTokens: 0,
      totalRequests: 0,
      averageCostPerRequest: 0,
      averageTokensPerRequest: 0,
      costByModel: {},
      costByCategory: {},
      costByProvider: {},
      costByApp: {},
      costByUser: {},
      costByWorkspace: {},
      dailyCosts: {},
      hourlyCosts: {},
      savings: {
        estimatedWithoutOptimization: 0,
        actualSavings: 0,
        savingsPercentage: 0
      },
      trends: {
        costTrend: 'stable',
        usageTrend: 'stable',
        efficiencyTrend: 'stable'
      }
    };
  }

  private convertToCSV(records: CostRecord[]): string {
    if (records.length === 0) return '';
    
    const headers = Object.keys(records[0]).join(',');
    const rows = records.map(record => 
      Object.values(record).map(value => 
        typeof value === 'string' ? `"${value}"` : value
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  }
}

// Export singleton instance
export const modelCostTracker = ModelCostTracker.getInstance();
