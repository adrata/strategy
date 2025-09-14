/**
 * 🚀 SALES ACCELERATION SUITE
 * 
 * Master orchestrator that integrates all three AI services:
 * - Real-Time Intelligence Engine
 * - Autonomous Deal Acceleration Agent  
 * - Predictive Revenue Intelligence with Simulation Learning
 * 
 * This creates the ultimate Sales Acceleration environment for 2025
 */

import { RealTimeIntelligenceEngine, RealTimeIntelligenceConfig, RealTimeIntelligenceReport } from './RealTimeIntelligenceEngine';
import { AutonomousDealAgent, DealAccelerationConfig, DealAccelerationContext, DealAccelerationPlan } from './AutonomousDealAgent';
import { PredictiveRevenueIntelligence, SimulationConfig, PipelineSimulation } from './PredictiveRevenueIntelligence';

export interface SalesAccelerationConfig {
  // API Keys
  coreSignalApiKey: string;
  perplexityApiKey?: string;
  newsApiKey?: string;
  
  // Service configurations
  realTimeIntelligence: Partial<RealTimeIntelligenceConfig>;
  dealAcceleration: Partial<DealAccelerationConfig>;
  predictiveRevenue: {
    simulation?: Partial<SimulationConfig>;
  };
  
  // Global settings
  enableAutoExecution: boolean;
  maxDailyActions: number;
  confidenceThreshold: number;
}

export interface SalesAccelerationReport {
  // Company context
  companyName: string;
  workspaceId: string;
  userId: string;
  generatedAt: Date;
  
  // Intelligence reports
  realTimeIntelligence: RealTimeIntelligenceReport;
  dealAccelerationPlan?: DealAccelerationPlan;
  pipelineSimulation: PipelineSimulation;
  
  // Unified insights
  unifiedInsights: {
    topPriorities: Array<{
      priority: string;
      urgency: 'critical' | 'high' | 'medium' | 'low';
      source: 'real_time' | 'deal_acceleration' | 'predictive';
      action: string;
      expectedImpact: string;
    }>;
    
    riskFactors: Array<{
      risk: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      probability: number;
      mitigation: string;
      source: string;
    }>;
    
    opportunities: Array<{
      opportunity: string;
      potential: 'high' | 'medium' | 'low';
      timeframe: string;
      action: string;
      source: string;
    }>;
    
    quotaImpact: {
      currentProbability: number;
      projectedImprovement: number;
      keyDrivers: string[];
      timeline: string;
    };
  };
  
  // Executive summary
  executiveSummary: {
    overallHealthScore: number; // 0-100
    quotaAttainmentProbability: number; // 0-1
    topRecommendation: string;
    urgentActions: string[];
    keyMetrics: {
      pipelineValue: number;
      dealCount: number;
      averageDealSize: number;
      salesVelocity: number;
    };
  };
}

export class SalesAccelerationSuite {
  private realTimeIntelligence: RealTimeIntelligenceEngine;
  private dealAgent: AutonomousDealAgent;
  private predictiveRevenue: PredictiveRevenueIntelligence;
  private config: SalesAccelerationConfig;

  constructor(config: SalesAccelerationConfig) {
    this['config'] = config;
    
    // Initialize Real-Time Intelligence Engine
    this['realTimeIntelligence'] = new RealTimeIntelligenceEngine({
      coreSignalApiKey: config.coreSignalApiKey,
      perplexityApiKey: config.perplexityApiKey,
      newsApiKey: config.newsApiKey,
      refreshInterval: 60,
      maxNewsAge: 168,
      confidenceThreshold: config.confidenceThreshold,
      ...config.realTimeIntelligence
    });
    
    // Initialize Autonomous Deal Agent
    this['dealAgent'] = new AutonomousDealAgent({
      coreSignalApiKey: config.coreSignalApiKey,
      realTimeIntelligenceConfig: {
        perplexityApiKey: config.perplexityApiKey,
        newsApiKey: config.newsApiKey,
        refreshInterval: 60
      },
      aggressiveness: 'moderate',
      autoExecute: config.enableAutoExecution,
      maxDailyActions: config.maxDailyActions,
      confidenceThreshold: config.confidenceThreshold,
      ...config.dealAcceleration
    });
    
    // Initialize Predictive Revenue Intelligence
    this['predictiveRevenue'] = new PredictiveRevenueIntelligence({
      coreSignalApiKey: config.coreSignalApiKey,
      realTimeIntelligenceConfig: {
        perplexityApiKey: config.perplexityApiKey,
        newsApiKey: config.newsApiKey,
        refreshInterval: 60
      },
      dealAccelerationConfig: {
        coreSignalApiKey: config.coreSignalApiKey,
        realTimeIntelligenceConfig: {
          perplexityApiKey: config.perplexityApiKey,
          refreshInterval: 60
        },
        aggressiveness: 'moderate',
        autoExecute: false,
        maxDailyActions: config.maxDailyActions,
        confidenceThreshold: config.confidenceThreshold
      }
    });
  }

  /**
   * Generate comprehensive Sales Acceleration report
   */
  async generateSalesAccelerationReport(
    companyName: string,
    userId: string,
    workspaceId: string,
    options: {
      includeDealAcceleration?: boolean;
      dealContext?: DealAccelerationContext;
      simulationConfig?: Partial<SimulationConfig>;
    } = {}
  ): Promise<SalesAccelerationReport> {
    console.log(`🚀 Generating comprehensive Sales Acceleration report for ${companyName}`);

    try {
      // Step 1: Generate real-time intelligence (foundation for everything)
      const realTimeIntelligence = await this.realTimeIntelligence.generateRealTimeIntelligence(
        companyName,
        workspaceId,
        {
          includeBuyerGroupEnhancement: true,
          includeCompetitiveAnalysis: true,
          maxNewsAge: 168
        }
      );

      // Step 2: Generate pipeline simulation (always needed for quota insights)
      const pipelineSimulation = await this.predictiveRevenue.generatePipelineSimulation(
        userId,
        workspaceId,
        options.simulationConfig
      );

      // Step 3: Generate deal acceleration plan (if deal context provided)
      let dealAccelerationPlan: DealAccelerationPlan | undefined;
      if (options['includeDealAcceleration'] && options.dealContext) {
        dealAccelerationPlan = await this.dealAgent.generateDealAccelerationPlan(options.dealContext);
      }

      // Step 4: Synthesize unified insights
      const unifiedInsights = this.synthesizeUnifiedInsights(
        realTimeIntelligence,
        pipelineSimulation,
        dealAccelerationPlan
      );

      // Step 5: Generate executive summary
      const executiveSummary = this.generateExecutiveSummary(
        realTimeIntelligence,
        pipelineSimulation,
        dealAccelerationPlan,
        unifiedInsights
      );

      const report: SalesAccelerationReport = {
        companyName,
        workspaceId,
        userId,
        generatedAt: new Date(),
        realTimeIntelligence,
        dealAccelerationPlan,
        pipelineSimulation,
        unifiedInsights,
        executiveSummary
      };

      console.log(`✅ Generated comprehensive Sales Acceleration report with ${unifiedInsights.topPriorities.length} priorities`);
      return report;

    } catch (error) {
      console.error('Sales Acceleration report generation error:', error);
      throw new Error(`Failed to generate Sales Acceleration report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get quick health check for a company/deal
   */
  async getQuickHealthCheck(
    companyName: string,
    userId: string,
    workspaceId: string
  ): Promise<{
    healthScore: number;
    quotaProbability: number;
    topRisk: string;
    topOpportunity: string;
    urgentAction: string;
  }> {
    try {
      // Get cached real-time intelligence if available
      let realTimeIntelligence = this.realTimeIntelligence.getCachedReport(companyName);
      if (!realTimeIntelligence) {
        realTimeIntelligence = await this.realTimeIntelligence.generateRealTimeIntelligence(
          companyName,
          workspaceId,
          { maxNewsAge: 24 } // Quick check - last 24 hours only
        );
      }

      // Get pipeline simulation
      const pipelineSimulation = await this.predictiveRevenue.generatePipelineSimulation(
        userId,
        workspaceId,
        {
          simulationHorizon: 30, // Quick 30-day simulation
          simulationRuns: 100,   // Fewer runs for speed
          confidenceLevel: 0.8
        }
      );

      // Calculate quick metrics
      const healthScore = this.calculateQuickHealthScore(realTimeIntelligence, pipelineSimulation);
      const quotaProbability = pipelineSimulation.quotaAttainmentProbability;
      
      const topRisk = pipelineSimulation.riskFactors.length > 0 
        ? pipelineSimulation['riskFactors'][0].description
        : 'No significant risks identified';
        
      const topOpportunity = realTimeIntelligence.buyingSignals.length > 0
        ? realTimeIntelligence['buyingSignals'][0].signal
        : 'Monitor for new opportunities';
        
      const urgentAction = realTimeIntelligence.recommendations.length > 0
        ? realTimeIntelligence['recommendations'][0].action
        : 'Continue current activities';

      return {
        healthScore,
        quotaProbability,
        topRisk,
        topOpportunity,
        urgentAction
      };

    } catch (error) {
      console.error('Quick health check error:', error);
      return {
        healthScore: 50,
        quotaProbability: 0.5,
        topRisk: 'Unable to assess risks',
        topOpportunity: 'Unable to identify opportunities',
        urgentAction: 'Review system configuration'
      };
    }
  }

  /**
   * Synthesize insights from all three services
   */
  private synthesizeUnifiedInsights(
    realTimeIntelligence: RealTimeIntelligenceReport,
    pipelineSimulation: PipelineSimulation,
    dealAccelerationPlan?: DealAccelerationPlan
  ): SalesAccelerationReport['unifiedInsights'] {
    const topPriorities: SalesAccelerationReport['unifiedInsights']['topPriorities'] = [];
    const riskFactors: SalesAccelerationReport['unifiedInsights']['riskFactors'] = [];
    const opportunities: SalesAccelerationReport['unifiedInsights']['opportunities'] = [];

    // Synthesize priorities from real-time intelligence
    realTimeIntelligence.recommendations.forEach(rec => {
      topPriorities.push({
        priority: rec.action,
        urgency: rec.priority,
        source: 'real_time',
        action: rec.action,
        expectedImpact: rec.estimatedImpact
      });
    });

    // Synthesize priorities from deal acceleration
    if (dealAccelerationPlan) {
      dealAccelerationPlan.immediateActions.forEach(action => {
        topPriorities.push({
          priority: action.title,
          urgency: action.priority,
          source: 'deal_acceleration',
          action: action.description,
          expectedImpact: `${Math.round(action.estimatedImpact * 100)}% impact confidence`
        });
      });
    }

    // Synthesize priorities from predictive intelligence
    pipelineSimulation.optimizationStrategies.forEach(strategy => {
      topPriorities.push({
        priority: strategy.title,
        urgency: strategy.priority,
        source: 'predictive',
        action: strategy.description,
        expectedImpact: `$${strategy.expectedImpact.revenueIncrease.toLocaleString()} revenue increase`
      });
    });

    // Synthesize risk factors
    pipelineSimulation.riskFactors.forEach(risk => {
      riskFactors.push({
        risk: risk.description,
        severity: risk.severity,
        probability: risk.probability,
        mitigation: risk['mitigationStrategies'][0]?.strategy || 'Monitor closely',
        source: 'predictive_intelligence'
      });
    });

    // Synthesize opportunities
    realTimeIntelligence.buyingSignals.forEach(signal => {
      if (signal.actionable) {
        opportunities.push({
          opportunity: signal.signal,
          potential: signal.strength > 0.8 ? 'high' : signal.strength > 0.6 ? 'medium' : 'low',
          timeframe: 'immediate',
          action: 'Engage stakeholders around this signal',
          source: 'real_time_intelligence'
        });
      }
    });

    // Calculate quota impact
    const currentProbability = pipelineSimulation.quotaAttainmentProbability;
    const projectedImprovement = Math.min(0.3, topPriorities.length * 0.05); // Max 30% improvement
    const keyDrivers = topPriorities.slice(0, 3).map(p => p.priority);

    // Sort priorities by urgency
    topPriorities.sort((a, b) => {
      const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    });

    return {
      topPriorities: topPriorities.slice(0, 10), // Top 10 priorities
      riskFactors: riskFactors.slice(0, 5),      // Top 5 risks
      opportunities: opportunities.slice(0, 5),   // Top 5 opportunities
      quotaImpact: {
        currentProbability,
        projectedImprovement,
        keyDrivers,
        timeline: '30-60 days'
      }
    };
  }

  /**
   * Generate executive summary
   */
  private generateExecutiveSummary(
    realTimeIntelligence: RealTimeIntelligenceReport,
    pipelineSimulation: PipelineSimulation,
    dealAccelerationPlan: DealAccelerationPlan | undefined,
    unifiedInsights: SalesAccelerationReport['unifiedInsights']
  ): SalesAccelerationReport['executiveSummary'] {
    // Calculate overall health score (weighted average)
    const realTimeScore = realTimeIntelligence.buyingSignals.length * 10; // Max 100 if 10+ signals
    const pipelineScore = (pipelineSimulation.quotaAttainmentProbability * 100);
    const dealScore = dealAccelerationPlan?.currentHealthScore.overall || 75;
    
    const overallHealthScore = Math.round(
      (realTimeScore * 0.3 + pipelineScore * 0.4 + dealScore * 0.3)
    );

    // Get top recommendation
    const topRecommendation = unifiedInsights.topPriorities.length > 0
      ? unifiedInsights['topPriorities'][0].action
      : 'Continue monitoring pipeline and market conditions';

    // Get urgent actions
    const urgentActions = unifiedInsights.topPriorities
      .filter(p => p['urgency'] === 'critical' || p['urgency'] === 'high')
      .slice(0, 3)
      .map(p => p.action);

    // Calculate key metrics
    const keyMetrics = {
      pipelineValue: pipelineSimulation.currentPipeline.totalValue,
      dealCount: pipelineSimulation.currentPipeline.dealCount,
      averageDealSize: pipelineSimulation.currentPipeline.dealCount > 0 
        ? pipelineSimulation.currentPipeline.totalValue / pipelineSimulation.currentPipeline.dealCount
        : 0,
      salesVelocity: pipelineSimulation.currentPipeline.velocity.dealsPerWeek
    };

    return {
      overallHealthScore: Math.min(100, Math.max(0, overallHealthScore)),
      quotaAttainmentProbability: pipelineSimulation.quotaAttainmentProbability,
      topRecommendation,
      urgentActions,
      keyMetrics
    };
  }

  /**
   * Calculate quick health score
   */
  private calculateQuickHealthScore(
    realTimeIntelligence: RealTimeIntelligenceReport,
    pipelineSimulation: PipelineSimulation
  ): number {
    let score = 50; // Base score

    // Positive signals
    score += realTimeIntelligence.buyingSignals.length * 5; // +5 per buying signal
    score += realTimeIntelligence.newsSignals.filter(n => n['sentiment'] === 'positive').length * 3;
    score += (pipelineSimulation.quotaAttainmentProbability * 30); // Up to +30 for quota probability

    // Negative signals
    score -= pipelineSimulation.riskFactors.filter(r => r['severity'] === 'critical').length * 10;
    score -= pipelineSimulation.riskFactors.filter(r => r['severity'] === 'high').length * 5;
    score -= realTimeIntelligence.competitiveIntelligence.filter(c => c['threatLevel'] === 'high').length * 5;

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.realTimeIntelligence.clearCache();
  }

  /**
   * Get service health status
   */
  getServiceHealth(): {
    realTimeIntelligence: 'healthy' | 'degraded' | 'offline';
    dealAcceleration: 'healthy' | 'degraded' | 'offline';
    predictiveRevenue: 'healthy' | 'degraded' | 'offline';
    overall: 'healthy' | 'degraded' | 'offline';
  } {
    // This would implement actual health checks
    return {
      realTimeIntelligence: 'healthy',
      dealAcceleration: 'healthy',
      predictiveRevenue: 'healthy',
      overall: 'healthy'
    };
  }
}
