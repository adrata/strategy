/**
 * 🚀 GRADUAL ROLLOUT SERVICE
 * 
 * Manages gradual rollout of OpenRouter integration with monitoring,
 * A/B testing, and automatic rollback capabilities.
 */

export interface RolloutConfig {
  // Rollout phases
  phases: {
    shadow: { percentage: number; duration: number }; // Shadow mode - log but don't use
    limited: { percentage: number; duration: number }; // Limited rollout
    full: { percentage: number; duration: number }; // Full rollout
  };
  
  // Rollout criteria
  criteria: {
    minSuccessRate: number; // Minimum success rate to continue
    maxErrorRate: number; // Maximum error rate before rollback
    maxResponseTime: number; // Maximum acceptable response time
    minCostSavings: number; // Minimum cost savings percentage
  };
  
  // Monitoring
  monitoring: {
    checkInterval: number; // How often to check metrics (minutes)
    alertThresholds: {
      errorRate: number;
      responseTime: number;
      costIncrease: number;
    };
  };
  
  // Rollback settings
  rollback: {
    autoRollback: boolean;
    rollbackTriggers: string[];
    rollbackDelay: number; // Minutes to wait before rollback
  };
}

export interface RolloutMetrics {
  timestamp: Date;
  phase: 'shadow' | 'limited' | 'full' | 'rollback';
  percentage: number;
  totalRequests: number;
  openRouterRequests: number;
  claudeRequests: number;
  successRate: number;
  errorRate: number;
  averageResponseTime: number;
  averageCost: number;
  costSavings: number;
  userSatisfaction: number;
  issues: string[];
}

export interface RolloutDecision {
  action: 'continue' | 'pause' | 'rollback' | 'advance';
  reason: string;
  metrics: RolloutMetrics;
  nextCheck: Date;
}

export class GradualRolloutService {
  private static instance: GradualRolloutService;
  private config: RolloutConfig;
  private currentPhase: 'shadow' | 'limited' | 'full' | 'rollback' = 'shadow';
  private currentPercentage: number = 0;
  private startTime: Date = new Date();
  private metrics: RolloutMetrics[] = [];
  private isActive: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;

  // Default configuration
  private defaultConfig: RolloutConfig = {
    phases: {
      shadow: { percentage: 0, duration: 24 * 60 }, // 24 hours in shadow mode
      limited: { percentage: 10, duration: 48 * 60 }, // 48 hours at 10%
      full: { percentage: 100, duration: 0 } // Full rollout
    },
    criteria: {
      minSuccessRate: 95, // 95% success rate required
      maxErrorRate: 5, // 5% max error rate
      maxResponseTime: 5000, // 5 seconds max response time
      minCostSavings: 20 // 20% minimum cost savings
    },
    monitoring: {
      checkInterval: 15, // Check every 15 minutes
      alertThresholds: {
        errorRate: 10,
        responseTime: 8000,
        costIncrease: 10
      }
    },
    rollback: {
      autoRollback: true,
      rollbackTriggers: ['high_error_rate', 'slow_response', 'cost_increase', 'user_complaints'],
      rollbackDelay: 5 // 5 minutes delay before rollback
    }
  };

  public static getInstance(): GradualRolloutService {
    if (!GradualRolloutService.instance) {
      GradualRolloutService.instance = new GradualRolloutService();
    }
    return GradualRolloutService.instance;
  }

  constructor() {
    this.config = this.defaultConfig;
  }

  /**
   * Start the gradual rollout process
   */
  public startRollout(config?: Partial<RolloutConfig>): void {
    if (this.isActive) {
      console.warn('⚠️ Rollout already active');
      return;
    }

    if (config) {
      this.config = { ...this.defaultConfig, ...config };
    }

    this.isActive = true;
    this.currentPhase = 'shadow';
    this.currentPercentage = this.config.phases.shadow.percentage;
    this.startTime = new Date();

    console.log('🚀 Starting OpenRouter gradual rollout');
    console.log(`Phase: ${this.currentPhase} (${this.currentPercentage}%)`);

    // Start monitoring
    this.startMonitoring();

    // Log initial metrics
    this.recordMetrics();
  }

  /**
   * Stop the rollout process
   */
  public stopRollout(): void {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;
    this.currentPhase = 'rollback';
    this.currentPercentage = 0;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    console.log('🛑 Rollout stopped - reverting to Claude');
  }

  /**
   * Check if request should use OpenRouter
   */
  public shouldUseOpenRouter(userId?: string, workspaceId?: string): boolean {
    if (!this.isActive || this.currentPhase === 'rollback') {
      return false;
    }

    if (this.currentPhase === 'shadow') {
      // In shadow mode, always return false but log the decision
      this.logShadowRequest(userId, workspaceId);
      return false;
    }

    // Use percentage-based routing
    const hash = this.hashUserId(userId || 'anonymous');
    return hash < this.currentPercentage;
  }

  /**
   * Record request metrics
   */
  public recordRequest(data: {
    userId?: string;
    workspaceId?: string;
    usedOpenRouter: boolean;
    success: boolean;
    responseTime: number;
    cost: number;
    error?: string;
  }): void {
    // This would typically store in a database
    // For now, we'll just log it
    console.log('📊 Request recorded:', {
      phase: this.currentPhase,
      percentage: this.currentPercentage,
      ...data
    });
  }

  /**
   * Get current rollout status
   */
  public getStatus(): {
    isActive: boolean;
    phase: string;
    percentage: number;
    startTime: Date;
    duration: number;
    metrics: RolloutMetrics[];
  } {
    return {
      isActive: this.isActive,
      phase: this.currentPhase,
      percentage: this.currentPercentage,
      startTime: this.startTime,
      duration: Date.now() - this.startTime.getTime(),
      metrics: [...this.metrics]
    };
  }

  /**
   * Force advance to next phase
   */
  public advancePhase(): void {
    if (!this.isActive) {
      console.warn('⚠️ Rollout not active');
      return;
    }

    switch (this.currentPhase) {
      case 'shadow':
        this.currentPhase = 'limited';
        this.currentPercentage = this.config.phases.limited.percentage;
        console.log('📈 Advanced to limited rollout phase');
        break;
      case 'limited':
        this.currentPhase = 'full';
        this.currentPercentage = this.config.phases.full.percentage;
        console.log('🎯 Advanced to full rollout phase');
        break;
      default:
        console.warn('⚠️ Cannot advance from current phase:', this.currentPhase);
    }

    this.recordMetrics();
  }

  /**
   * Force rollback
   */
  public forceRollback(reason: string): void {
    console.log(`🔄 Forcing rollback: ${reason}`);
    this.currentPhase = 'rollback';
    this.currentPercentage = 0;
    this.recordMetrics();
  }

  // Private methods

  private startMonitoring(): void {
    this.checkInterval = setInterval(() => {
      this.checkMetrics();
    }, this.config.monitoring.checkInterval * 60 * 1000);
  }

  private async checkMetrics(): Promise<void> {
    try {
      const metrics = await this.collectMetrics();
      const decision = this.evaluateMetrics(metrics);
      
      this.metrics.push(metrics);
      
      console.log(`📊 Rollout check: ${decision.action} - ${decision.reason}`);
      
      // Execute decision
      switch (decision.action) {
        case 'continue':
          // Continue current phase
          break;
        case 'advance':
          this.advancePhase();
          break;
        case 'pause':
          this.pauseRollout(decision.reason);
          break;
        case 'rollback':
          this.rollback(decision.reason);
          break;
      }
      
    } catch (error) {
      console.error('❌ Error checking rollout metrics:', error);
    }
  }

  private async collectMetrics(): Promise<RolloutMetrics> {
    // In a real implementation, this would collect from your monitoring system
    // For now, we'll simulate metrics
    
    const now = new Date();
    const totalRequests = Math.floor(Math.random() * 100) + 50;
    const openRouterRequests = Math.floor(totalRequests * this.currentPercentage / 100);
    const claudeRequests = totalRequests - openRouterRequests;
    
    return {
      timestamp: now,
      phase: this.currentPhase,
      percentage: this.currentPercentage,
      totalRequests,
      openRouterRequests,
      claudeRequests,
      successRate: 95 + Math.random() * 5, // 95-100%
      errorRate: Math.random() * 3, // 0-3%
      averageResponseTime: 1000 + Math.random() * 2000, // 1-3 seconds
      averageCost: 0.01 + Math.random() * 0.05, // $0.01-0.06
      costSavings: 20 + Math.random() * 30, // 20-50%
      userSatisfaction: 4.0 + Math.random() * 1.0, // 4.0-5.0
      issues: []
    };
  }

  private evaluateMetrics(metrics: RolloutMetrics): RolloutDecision {
    const issues: string[] = [];
    
    // Check success rate
    if (metrics.successRate < this.config.criteria.minSuccessRate) {
      issues.push('low_success_rate');
    }
    
    // Check error rate
    if (metrics.errorRate > this.config.criteria.maxErrorRate) {
      issues.push('high_error_rate');
    }
    
    // Check response time
    if (metrics.averageResponseTime > this.config.criteria.maxResponseTime) {
      issues.push('slow_response');
    }
    
    // Check cost savings
    if (metrics.costSavings < this.config.criteria.minCostSavings) {
      issues.push('low_cost_savings');
    }
    
    // Determine action
    if (issues.length > 0) {
      if (this.config.rollback.autoRollback && 
          issues.some(issue => this.config.rollback.rollbackTriggers.includes(issue))) {
        return {
          action: 'rollback',
          reason: `Issues detected: ${issues.join(', ')}`,
          metrics,
          nextCheck: new Date(Date.now() + this.config.monitoring.checkInterval * 60 * 1000)
        };
      } else {
        return {
          action: 'pause',
          reason: `Issues detected: ${issues.join(', ')}`,
          metrics,
          nextCheck: new Date(Date.now() + this.config.monitoring.checkInterval * 60 * 1000)
        };
      }
    }
    
    // Check if ready to advance
    if (this.shouldAdvancePhase()) {
      return {
        action: 'advance',
        reason: 'Metrics look good, ready to advance',
        metrics,
        nextCheck: new Date(Date.now() + this.config.monitoring.checkInterval * 60 * 1000)
      };
    }
    
    // Continue current phase
    return {
      action: 'continue',
      reason: 'Metrics acceptable, continuing current phase',
      metrics,
      nextCheck: new Date(Date.now() + this.config.monitoring.checkInterval * 60 * 1000)
    };
  }

  private shouldAdvancePhase(): boolean {
    const currentPhaseConfig = this.config.phases[this.currentPhase];
    const phaseDuration = Date.now() - this.startTime.getTime();
    const requiredDuration = currentPhaseConfig.duration * 60 * 1000; // Convert to milliseconds
    
    return phaseDuration >= requiredDuration;
  }

  private pauseRollout(reason: string): void {
    console.log(`⏸️ Pausing rollout: ${reason}`);
    // In a real implementation, you might want to pause without fully rolling back
  }

  private rollback(reason: string): void {
    console.log(`🔄 Rolling back: ${reason}`);
    this.currentPhase = 'rollback';
    this.currentPercentage = 0;
    this.recordMetrics();
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100;
  }

  private logShadowRequest(userId?: string, workspaceId?: string): void {
    console.log('👻 Shadow request logged:', { userId, workspaceId, timestamp: new Date() });
  }

  private recordMetrics(): void {
    console.log(`📊 Rollout metrics: Phase=${this.currentPhase}, Percentage=${this.currentPercentage}%`);
  }
}

// Export singleton instance
export const gradualRolloutService = GradualRolloutService.getInstance();
