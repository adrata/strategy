/**
 * 🎯 QUOTA INTELLIGENCE SERVICE
 * 
 * Comprehensive "Hit Your Number" system for sales professionals
 * Tracks quota attainment, pipeline coverage, and provides intelligent recommendations
 * Based on industry best practices: 3x pipeline coverage, quarterly/yearly goals
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface QuotaGoal {
  id: string;
  userId: string;
  workspaceId: string;
  period: 'quarterly' | 'yearly' | 'monthly';
  startDate: Date;
  endDate: Date;
  revenueGoal: number;
  pipelineCoverageTarget: number; // Typically 3x revenue goal
  currentRevenue: number;
  currentPipeline: number;
  attainmentPercentage: number;
  pipelineCoverageRatio: number;
  daysRemaining: number;
  onTrack: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface QuotaRecommendation {
  type: 'pipeline_generation' | 'deal_acceleration' | 'conversion_optimization' | 'activity_increase';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  actionItems: string[];
  metrics: {
    currentValue: number;
    targetValue: number;
    gap: number;
    timeframe: string;
  };
}

export interface PipelineHealth {
  totalValue: number;
  weightedValue: number; // Adjusted by stage probability
  stageDistribution: Record<string, number>;
  averageDealSize: number;
  averageSalesCycle: number;
  conversionRates: Record<string, number>;
  velocity: number; // Deals per week
  healthScore: number; // 0-100
  riskFactors: string[];
  opportunities: string[];
}

export interface QuotaIntelligence {
  goal: QuotaGoal;
  pipelineHealth: PipelineHealth;
  recommendations: QuotaRecommendation[];
  alerts: QuotaAlert[];
  forecast: QuotaForecast;
  benchmarks: QuotaBenchmarks;
}

export interface QuotaAlert {
  id: string;
  type: 'quota_risk' | 'pipeline_gap' | 'velocity_decline' | 'conversion_drop' | 'time_pressure';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  recommendation: string;
  dueDate?: Date;
  metrics?: Record<string, number>;
}

export interface QuotaForecast {
  projectedRevenue: number;
  projectedAttainment: number;
  confidence: number;
  scenarioAnalysis: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
  keyAssumptions: string[];
  riskFactors: string[];
}

export interface QuotaBenchmarks {
  industryAverages: {
    quotaAttainment: number;
    pipelineCoverage: number;
    conversionRate: number;
    salesCycle: number;
  };
  personalBest: {
    bestQuarter: number;
    bestMonth: number;
    bestDealSize: number;
    bestConversionRate: number;
  };
  teamAverages: {
    quotaAttainment: number;
    pipelineCoverage: number;
    averageDealSize: number;
  };
}

export class QuotaIntelligenceService {

  /**
   * Get comprehensive quota intelligence for a user
   */
  static async getQuotaIntelligence(
    userId: string, 
    workspaceId: string, 
    period: 'quarterly' | 'yearly' | 'monthly' = 'quarterly'
  ): Promise<QuotaIntelligence> {
    try {
      // Get or create quota goal
      const goal = await this.getOrCreateQuotaGoal(userId, workspaceId, period);
      
      // Analyze pipeline health
      const pipelineHealth = await this.analyzePipelineHealth(userId, workspaceId);
      
      // Generate recommendations
      const recommendations = await this.generateQuotaRecommendations(goal, pipelineHealth);
      
      // Generate alerts
      const alerts = await this.generateQuotaAlerts(goal, pipelineHealth);
      
      // Create forecast
      const forecast = await this.generateQuotaForecast(goal, pipelineHealth);
      
      // Get benchmarks
      const benchmarks = await this.getQuotaBenchmarks(userId, workspaceId);
      
      return {
        goal,
        pipelineHealth,
        recommendations,
        alerts,
        forecast,
        benchmarks
      };
      
    } catch (error) {
      console.error('Error getting quota intelligence:', error);
      throw error;
    }
  }

  /**
   * Update quota goal and recalculate metrics
   */
  static async updateQuotaGoal(
    userId: string,
    workspaceId: string,
    updates: Partial<QuotaGoal>
  ): Promise<QuotaGoal> {
    try {
      // Update goal in database (simplified - would use actual DB)
      const updatedGoal = await this.calculateQuotaMetrics(userId, workspaceId, updates);
      
      return updatedGoal;
    } catch (error) {
      console.error('Error updating quota goal:', error);
      throw error;
    }
  }

  /**
   * Get or create quota goal for the specified period
   */
  private static async getOrCreateQuotaGoal(
    userId: string, 
    workspaceId: string, 
    period: 'quarterly' | 'yearly' | 'monthly'
  ): Promise<QuotaGoal> {
    try {
      // Calculate period dates
      const now = new Date();
      const { startDate, endDate } = this.calculatePeriodDates(period, now);
      
      // Try to find existing goal
      // In a real implementation, this would query the database
      // For now, we'll create a default goal and calculate current metrics
      
      const defaultRevenueGoal = this.getDefaultRevenueGoal(period);
      const pipelineCoverageTarget = defaultRevenueGoal * 3; // 3x coverage rule
      
      // Calculate current metrics
      const currentMetrics = await this.calculateCurrentMetrics(userId, workspaceId, startDate, endDate);
      
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const attainmentPercentage = (currentMetrics.revenue / defaultRevenueGoal) * 100;
      const pipelineCoverageRatio = currentMetrics.pipeline / defaultRevenueGoal;
      
      // Determine if on track
      const periodProgress = (now.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime());
      const expectedAttainment = periodProgress * 100;
      const onTrack = attainmentPercentage >= (expectedAttainment * 0.8); // 80% of expected
      
      // Calculate risk level
      const riskLevel = this.calculateRiskLevel(attainmentPercentage, pipelineCoverageRatio, daysRemaining, periodProgress);
      
      return {
        id: `quota-${userId}-${period}`,
        userId,
        workspaceId,
        period,
        startDate,
        endDate,
        revenueGoal: defaultRevenueGoal,
        pipelineCoverageTarget,
        currentRevenue: currentMetrics.revenue,
        currentPipeline: currentMetrics.pipeline,
        attainmentPercentage,
        pipelineCoverageRatio,
        daysRemaining,
        onTrack,
        riskLevel
      };
      
    } catch (error) {
      console.error('Error getting/creating quota goal:', error);
      throw error;
    }
  }

  /**
   * Analyze pipeline health and metrics
   */
  private static async analyzePipelineHealth(userId: string, workspaceId: string): Promise<PipelineHealth> {
    try {
      // Get opportunities data
      const opportunities = await prisma.opportunities.findMany({
        where: { workspaceId , deletedAt: null},
        include: { lead: true }
      });
      
      // Calculate pipeline metrics
      const totalValue = opportunities.reduce((sum, opp) => sum + ((opp as any).value || 0), 0);
      
      // Stage probabilities (industry standard)
      const stageProbabilities: Record<string, number> = {
        'prospecting': 0.1,
        'qualification': 0.2,
        'needs-analysis': 0.3,
        'proposal': 0.5,
        'negotiation': 0.7,
        'closed-won': 1.0,
        'closed-lost': 0.0
      };
      
      const weightedValue = opportunities.reduce((sum, opp) => {
        const probability = stageProbabilities[opp.stage || 'prospecting'] || 0.1;
        return sum + (((opp as any).value || 0) * probability);
      }, 0);
      
      // Stage distribution
      const stageDistribution: Record<string, number> = {};
      opportunities.forEach(opp => {
        const stage = opp.stage || 'prospecting';
        stageDistribution[stage] = (stageDistribution[stage] || 0) + ((opp as any).value || 0);
      });
      
      // Calculate other metrics
      const averageDealSize = opportunities.length > 0 ? totalValue / opportunities.length : 0;
      const averageSalesCycle = 45; // Default - would calculate from historical data
      
      // Conversion rates (simplified)
      const conversionRates = {
        'prospecting_to_qualification': 0.3,
        'qualification_to_proposal': 0.5,
        'proposal_to_closed': 0.4,
        'overall': 0.06
      };
      
      const velocity = opportunities.length / 4; // Deals per week (simplified)
      
      // Health score calculation
      const healthScore = this.calculatePipelineHealthScore({
        totalValue,
        weightedValue,
        averageDealSize,
        velocity,
        stageDistribution
      });
      
      // Risk factors and opportunities
      const riskFactors = this.identifyPipelineRiskFactors(opportunities, stageDistribution);
      const pipelineOpportunities = this.identifyPipelineOpportunities(opportunities, stageDistribution);
      
      return {
        totalValue,
        weightedValue,
        stageDistribution,
        averageDealSize,
        averageSalesCycle,
        conversionRates,
        velocity,
        healthScore,
        riskFactors,
        opportunities: pipelineOpportunities
      };
      
    } catch (error) {
      console.error('Error analyzing pipeline health:', error);
      throw error;
    }
  }

  /**
   * Generate intelligent quota recommendations
   */
  private static async generateQuotaRecommendations(
    goal: QuotaGoal, 
    pipelineHealth: PipelineHealth
  ): Promise<QuotaRecommendation[]> {
    const recommendations: QuotaRecommendation[] = [];
    
    // Pipeline coverage gap
    if (goal.pipelineCoverageRatio < 2.5) {
      const pipelineGap = goal.pipelineCoverageTarget - goal.currentPipeline;
      recommendations.push({
        type: 'pipeline_generation',
        priority: goal.pipelineCoverageRatio < 2.0 ? 'critical' : 'high',
        title: 'Increase Pipeline Coverage',
        description: `Your pipeline coverage is ${goal.pipelineCoverageRatio.toFixed(1)}x. Industry best practice is 3x.`,
        impact: `Need $${pipelineGap.toLocaleString()} more pipeline to reach 3x coverage`,
        actionItems: [
          'Increase prospecting activity by 40%',
          'Focus on larger deal sizes',
          'Accelerate qualification process',
          'Expand into new market segments'
        ],
        metrics: {
          currentValue: goal.currentPipeline,
          targetValue: goal.pipelineCoverageTarget,
          gap: pipelineGap,
          timeframe: `${goal.daysRemaining} days remaining`
        }
      });
    }
    
    // Quota attainment risk
    if (goal.attainmentPercentage < 80 && goal.daysRemaining < 60) {
      const revenueGap = goal.revenueGoal - goal.currentRevenue;
      recommendations.push({
        type: 'deal_acceleration',
        priority: 'critical',
        title: 'Accelerate Deal Closure',
        description: `At ${goal.attainmentPercentage.toFixed(1)}% attainment with ${goal.daysRemaining} days left`,
        impact: `Need $${revenueGap.toLocaleString()} more revenue to hit quota`,
        actionItems: [
          'Focus on deals in negotiation stage',
          'Offer limited-time incentives',
          'Escalate to senior stakeholders',
          'Consider smaller initial deals with expansion potential'
        ],
        metrics: {
          currentValue: goal.currentRevenue,
          targetValue: goal.revenueGoal,
          gap: revenueGap,
          timeframe: `${goal.daysRemaining} days remaining`
        }
      });
    }
    
    // Low pipeline velocity
    if (pipelineHealth.velocity < 2) {
      recommendations.push({
        type: 'activity_increase',
        priority: 'high',
        title: 'Increase Sales Activity',
        description: `Pipeline velocity is ${pipelineHealth.velocity.toFixed(1)} deals/week. Target: 3+ deals/week`,
        impact: 'Increase deal flow to maintain healthy pipeline',
        actionItems: [
          'Increase daily prospecting calls by 50%',
          'Improve lead qualification process',
          'Leverage referral programs',
          'Optimize outreach messaging'
        ],
        metrics: {
          currentValue: pipelineHealth.velocity,
          targetValue: 3,
          gap: 3 - pipelineHealth.velocity,
          timeframe: 'Immediate action required'
        }
      });
    }
    
    // Poor stage distribution
    const prospectingPercentage = (pipelineHealth['stageDistribution']['prospecting'] || 0) / pipelineHealth.totalValue;
    if (prospectingPercentage > 0.6) {
      recommendations.push({
        type: 'conversion_optimization',
        priority: 'medium',
        title: 'Improve Lead Qualification',
        description: `${(prospectingPercentage * 100).toFixed(1)}% of pipeline is in prospecting stage`,
        impact: 'Move more deals through qualification to increase win probability',
        actionItems: [
          'Implement BANT qualification framework',
          'Schedule more discovery calls',
          'Create compelling value propositions',
          'Develop better qualifying questions'
        ],
        metrics: {
          currentValue: prospectingPercentage * 100,
          targetValue: 40,
          gap: (prospectingPercentage * 100) - 40,
          timeframe: 'Next 2 weeks'
        }
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Generate quota alerts
   */
  private static async generateQuotaAlerts(
    goal: QuotaGoal, 
    pipelineHealth: PipelineHealth
  ): Promise<QuotaAlert[]> {
    const alerts: QuotaAlert[] = [];
    
    // Critical quota risk
    if (goal['riskLevel'] === 'critical') {
      alerts.push({
        id: `quota-risk-${goal.id}`,
        type: 'quota_risk',
        severity: 'critical',
        title: 'Quota Attainment at Risk',
        message: `Only ${goal.attainmentPercentage.toFixed(1)}% of quota achieved with ${goal.daysRemaining} days remaining`,
        recommendation: 'Focus on closing deals in negotiation stage immediately',
        metrics: {
          attainment: goal.attainmentPercentage,
          daysRemaining: goal.daysRemaining,
          gap: goal.revenueGoal - goal.currentRevenue
        }
      });
    }
    
    // Pipeline coverage gap
    if (goal.pipelineCoverageRatio < 2.0) {
      alerts.push({
        id: `pipeline-gap-${goal.id}`,
        type: 'pipeline_gap',
        severity: 'high',
        title: 'Insufficient Pipeline Coverage',
        message: `Pipeline coverage is ${goal.pipelineCoverageRatio.toFixed(1)}x, well below the 3x target`,
        recommendation: 'Increase prospecting activity and focus on larger deals',
        metrics: {
          coverage: goal.pipelineCoverageRatio,
          target: 3.0,
          gap: goal.pipelineCoverageTarget - goal.currentPipeline
        }
      });
    }
    
    // Velocity decline
    if (pipelineHealth.velocity < 1.5) {
      alerts.push({
        id: `velocity-decline-${goal.id}`,
        type: 'velocity_decline',
        severity: 'medium',
        title: 'Low Pipeline Velocity',
        message: `Only ${pipelineHealth.velocity.toFixed(1)} deals/week. Target: 3+ deals/week`,
        recommendation: 'Increase daily prospecting and improve qualification process'
      });
    }
    
    // Time pressure
    if (goal.daysRemaining < 30 && goal.attainmentPercentage < 90) {
      alerts.push({
        id: `time-pressure-${goal.id}`,
        type: 'time_pressure',
        severity: 'high',
        title: 'End of Period Approaching',
        message: `Only ${goal.daysRemaining} days left to close $${(goal.revenueGoal - goal.currentRevenue).toLocaleString()} gap`,
        recommendation: 'Focus exclusively on deals with highest close probability',
        dueDate: goal.endDate
      });
    }
    
    return alerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Generate quota forecast
   */
  private static async generateQuotaForecast(
    goal: QuotaGoal, 
    pipelineHealth: PipelineHealth
  ): Promise<QuotaForecast> {
    // Calculate realistic projection based on current trajectory
    const periodProgress = (new Date().getTime() - goal.startDate.getTime()) / 
                          (goal.endDate.getTime() - goal.startDate.getTime());
    
    const currentRunRate = goal.currentRevenue / periodProgress;
    const pipelineContribution = pipelineHealth.weightedValue * 0.7; // 70% of weighted pipeline
    
    const projectedRevenue = Math.min(
      currentRunRate + pipelineContribution,
      goal.currentRevenue + pipelineHealth.weightedValue
    );
    
    const projectedAttainment = (projectedRevenue / goal.revenueGoal) * 100;
    
    // Confidence based on pipeline health and historical performance
    const confidence = Math.min(90, 
      (pipelineHealth.healthScore * 0.4) + 
      (Math.min(100, goal.pipelineCoverageRatio * 30) * 0.3) +
      (Math.min(100, pipelineHealth.velocity * 20) * 0.3)
    );
    
    // Scenario analysis
    const scenarioAnalysis = {
      optimistic: projectedRevenue * 1.2,
      realistic: projectedRevenue,
      pessimistic: projectedRevenue * 0.8
    };
    
    const keyAssumptions = [
      `${((pipelineHealth.conversionRates?.overall || 0.06) * 100).toFixed(1)}% overall conversion rate`,
      `${pipelineHealth.averageSalesCycle} day average sales cycle`,
      `$${pipelineHealth.averageDealSize.toLocaleString()} average deal size`,
      `${pipelineHealth.velocity.toFixed(1)} deals per week velocity`
    ];
    
    const riskFactors = [
      'Economic uncertainty may impact deal sizes',
      'Competitive pressure in key accounts',
      'Seasonal buying patterns',
      'Budget approval delays'
    ];
    
    return {
      projectedRevenue,
      projectedAttainment,
      confidence,
      scenarioAnalysis,
      keyAssumptions,
      riskFactors
    };
  }

  /**
   * Get quota benchmarks
   */
  private static async getQuotaBenchmarks(userId: string, workspaceId: string): Promise<QuotaBenchmarks> {
    // Industry averages (based on research)
    const industryAverages = {
      quotaAttainment: 87, // 87% average quota attainment
      pipelineCoverage: 3.2, // 3.2x pipeline coverage
      conversionRate: 6.8, // 6.8% overall conversion rate
      salesCycle: 84 // 84 days average sales cycle
    };
    
    // Personal best (would be calculated from historical data)
    const personalBest = {
      bestQuarter: 125, // 125% quota attainment
      bestMonth: 180, // 180% monthly quota
      bestDealSize: 150000, // $150K largest deal
      bestConversionRate: 12.5 // 12.5% best conversion rate
    };
    
    // Team averages (would be calculated from team data)
    const teamAverages = {
      quotaAttainment: 92, // 92% team average
      pipelineCoverage: 2.8, // 2.8x team average
      averageDealSize: 45000 // $45K team average deal size
    };
    
    return {
      industryAverages,
      personalBest,
      teamAverages
    };
  }

  // Helper methods

  private static calculatePeriodDates(period: 'quarterly' | 'yearly' | 'monthly', now: Date) {
    const year = now.getFullYear();
    const month = now.getMonth();
    
    switch (period) {
      case 'quarterly':
        const quarter = Math.floor(month / 3);
        return {
          startDate: new Date(year, quarter * 3, 1),
          endDate: new Date(year, (quarter + 1) * 3, 0)
        };
      case 'yearly':
        return {
          startDate: new Date(year, 0, 1),
          endDate: new Date(year, 11, 31)
        };
      case 'monthly':
        return {
          startDate: new Date(year, month, 1),
          endDate: new Date(year, month + 1, 0)
        };
    }
  }

  private static getDefaultRevenueGoal(period: 'quarterly' | 'yearly' | 'monthly'): number {
    // Default goals based on typical SaaS sales quotas
    switch (period) {
      case 'quarterly': return 500000; // $500K quarterly
      case 'yearly': return 2000000; // $2M yearly
      case 'monthly': return 166667; // ~$167K monthly
    }
  }

  private static async calculateCurrentMetrics(
    userId: string, 
    workspaceId: string, 
    startDate: Date, 
    endDate: Date
  ) {
    try {
      // Get closed-won opportunities in period
      const closedDeals = await prisma.opportunities.findMany({
        where: { workspaceId,
          stage: 'closed-won',
          updatedAt: {
            gte: startDate,
            lte: endDate
          , deletedAt: null }
        }
      });
      
      const revenue = closedDeals.reduce((sum, deal) => sum + ((deal as any).value || 0), 0);
      
      // Get all active opportunities
      const activeOpportunities = await prisma.opportunities.findMany({
        where: { 
          workspaceId,
          stage: { notIn: ['closed-won', 'closed-lost'] },
          deletedAt: null 
        }
      });
      
      const pipeline = activeOpportunities.reduce((sum, opp) => sum + ((opp as any).value || 0), 0);
      
      return { revenue, pipeline };
    } catch (error) {
      console.error('Error calculating current metrics:', error);
      return { revenue: 0, pipeline: 0 };
    }
  }

  private static calculateRiskLevel(
    attainmentPercentage: number, 
    pipelineCoverageRatio: number, 
    daysRemaining: number, 
    periodProgress: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const expectedAttainment = periodProgress * 100;
    const attainmentGap = expectedAttainment - attainmentPercentage;
    
    if (attainmentGap > 30 || pipelineCoverageRatio < 1.5 || (daysRemaining < 30 && attainmentPercentage < 70)) {
      return 'critical';
    } else if (attainmentGap > 15 || pipelineCoverageRatio < 2.0 || (daysRemaining < 60 && attainmentPercentage < 80)) {
      return 'high';
    } else if (attainmentGap > 5 || pipelineCoverageRatio < 2.5) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private static calculatePipelineHealthScore(metrics: {
    totalValue: number;
    weightedValue: number;
    averageDealSize: number;
    velocity: number;
    stageDistribution: Record<string, number>;
  }): number {
    let score = 50; // Base score
    
    // Pipeline value score
    if (metrics.totalValue > 1000000) score += 20;
    else if (metrics.totalValue > 500000) score += 10;
    
    // Weighted value ratio
    const weightedRatio = metrics.weightedValue / metrics.totalValue;
    if (weightedRatio > 0.4) score += 15;
    else if (weightedRatio > 0.3) score += 10;
    else if (weightedRatio > 0.2) score += 5;
    
    // Deal size
    if (metrics.averageDealSize > 75000) score += 10;
    else if (metrics.averageDealSize > 50000) score += 5;
    
    // Velocity
    if (metrics.velocity > 3) score += 15;
    else if (metrics.velocity > 2) score += 10;
    else if (metrics.velocity > 1) score += 5;
    
    return Math.min(100, Math.max(0, score));
  }

  private static identifyPipelineRiskFactors(opportunities: any[], stageDistribution: Record<string, number>): string[] {
    const risks = [];
    
    const totalValue = Object.values(stageDistribution).reduce((sum, value) => sum + value, 0);
    const prospectingPercentage = (stageDistribution['prospecting'] || 0) / totalValue;
    
    if (prospectingPercentage > 0.6) {
      risks.push('Too many deals stuck in prospecting stage');
    }
    
    if (opportunities.length < 10) {
      risks.push('Low number of active opportunities');
    }
    
    const avgDealAge = 45; // Would calculate from actual data
    if (avgDealAge > 90) {
      risks.push('Deals taking too long to progress');
    }
    
    return risks;
  }

  private static identifyPipelineOpportunities(opportunities: any[], stageDistribution: Record<string, number>): string[] {
    const opps = [];
    
    const negotiationValue = stageDistribution['negotiation'] || 0;
    if (negotiationValue > 100000) {
      opps.push(`$${negotiationValue.toLocaleString()} in negotiation stage - focus on closing`);
    }
    
    const proposalValue = stageDistribution['proposal'] || 0;
    if (proposalValue > 200000) {
      opps.push(`$${proposalValue.toLocaleString()} in proposal stage - accelerate decision process`);
    }
    
    return opps;
  }

  private static async calculateQuotaMetrics(
    userId: string,
    workspaceId: string,
    updates: Partial<QuotaGoal>
  ): Promise<QuotaGoal> {
    // This would update the database and recalculate all metrics
    // For now, return a mock updated goal
    return {
      id: `quota-${userId}-quarterly`,
      userId,
      workspaceId,
      period: 'quarterly',
      startDate: new Date(),
      endDate: new Date(),
      revenueGoal: 500000,
      pipelineCoverageTarget: 1500000,
      currentRevenue: 125000,
      currentPipeline: 800000,
      attainmentPercentage: 25,
      pipelineCoverageRatio: 1.6,
      daysRemaining: 60,
      onTrack: false,
      riskLevel: 'high',
      ...updates
    };
  }
}
