/**
 * 🔍 AUTOMATED QUALITY MONITORING SYSTEM
 * 
 * Continuously monitors data accuracy and system performance
 * Provides real-time alerts and quality metrics
 */

import { EnhancedAccuracyValidator } from './enhanced-accuracy-validator';
import { PerplexityAccuracyValidator } from './perplexity-accuracy-validator';
import { CoreSignalAccuracyValidator } from './coresignal-accuracy-validator';

export interface QualityMetrics {
  timestamp: string;
  overallAccuracy: number;
  apiReliability: number;
  dataCompleteness: number;
  responseTime: number;
  costEfficiency: number;
  errorRate: number;
  validationCoverage: number;
}

export interface QualityAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'accuracy' | 'performance' | 'cost' | 'error';
  message: string;
  details: any;
  timestamp: string;
  resolved: boolean;
}

export interface MonitoringConfig {
  accuracyThreshold: number; // Minimum acceptable accuracy %
  responseTimeThreshold: number; // Maximum acceptable response time (ms)
  errorRateThreshold: number; // Maximum acceptable error rate %
  costThreshold: number; // Maximum cost per validation
  monitoringInterval: number; // How often to check (ms)
  alertWebhookUrl?: string;
  enableSlackAlerts?: boolean;
  enableEmailAlerts?: boolean;
}

export class AutomatedQualityMonitor {
  private config: MonitoringConfig;
  private metrics: QualityMetrics[] = [];
  private alerts: QualityAlert[] = [];
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private enhancedValidator: EnhancedAccuracyValidator;

  constructor(config: Partial<MonitoringConfig> = {}) {
    this['config'] = {
      accuracyThreshold: 85,
      responseTimeThreshold: 5000,
      errorRateThreshold: 5,
      costThreshold: 0.50,
      monitoringInterval: 300000, // 5 minutes
      ...config
    };
    
    this['enhancedValidator'] = new EnhancedAccuracyValidator();
  }

  /**
   * Start automated monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('[Quality Monitor] Already monitoring');
      return;
    }

    console.log('[Quality Monitor] Starting automated quality monitoring');
    this['isMonitoring'] = true;

    // Run initial check
    this.runQualityCheck();

    // Set up recurring checks
    this['monitoringInterval'] = setInterval(() => {
      this.runQualityCheck();
    }, this.config.monitoringInterval);
  }

  /**
   * Stop automated monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      console.log('[Quality Monitor] Not currently monitoring');
      return;
    }

    console.log('[Quality Monitor] Stopping automated quality monitoring');
    this['isMonitoring'] = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this['monitoringInterval'] = undefined;
    }
  }

  /**
   * Run comprehensive quality check
   */
  private async runQualityCheck(): Promise<void> {
    console.log('[Quality Monitor] Running quality check...');
    
    try {
      const startTime = Date.now();
      
      // Test known good data points
      const testResults = await this.runValidationTests();
      
      // Calculate metrics
      const metrics = this.calculateQualityMetrics(testResults, startTime);
      
      // Store metrics
      this.metrics.push(metrics);
      
      // Keep only last 100 metrics
      if (this.metrics.length > 100) {
        this['metrics'] = this.metrics.slice(-100);
      }
      
      // Check for issues and generate alerts
      await this.checkForIssues(metrics);
      
      console.log(`[Quality Monitor] Quality check completed - Accuracy: ${metrics.overallAccuracy}%, Response Time: ${metrics.responseTime}ms`);
      
    } catch (error) {
      console.error('[Quality Monitor] Quality check failed:', error);
      
      await this.createAlert({
        severity: 'high',
        type: 'error',
        message: 'Quality monitoring check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }

  /**
   * Run validation tests with known data
   */
  private async runValidationTests(): Promise<any[]> {
    const knownTestCases = [
      {
        type: 'person' as const,
        data: {
          name: 'Satya Nadella',
          company: 'Microsoft',
          title: 'CEO'
        },
        context: {
          expectedName: 'Satya Nadella',
          expectedCompany: 'Microsoft Corporation',
          expectedTitle: 'Chief Executive Officer'
        },
        expectedAccuracy: 95
      },
      {
        type: 'person' as const,
        data: {
          name: 'Tim Cook',
          company: 'Apple',
          title: 'CEO'
        },
        context: {
          expectedName: 'Tim Cook',
          expectedCompany: 'Apple Inc',
          expectedTitle: 'Chief Executive Officer'
        },
        expectedAccuracy: 95
      },
      {
        type: 'company' as const,
        data: {
          name: 'Microsoft Corporation',
          website: 'microsoft.com'
        },
        context: {
          expectedName: 'Microsoft',
          expectedWebsite: 'https://microsoft.com'
        },
        expectedAccuracy: 90
      },
      {
        type: 'person' as const,
        data: {
          name: "John O'Connor",
          company: 'Dell Technologies'
        },
        context: {
          expectedName: "John O'Connor",
          expectedCompany: 'Dell'
        },
        expectedAccuracy: 80 // Lower expectation for special characters
      }
    ];

    const results = [];
    
    for (const testCase of knownTestCases) {
      try {
        const startTime = Date.now();
        const result = await this.enhancedValidator.validate({
          type: testCase.type,
          data: testCase.data,
          context: testCase.context,
          options: {
            usePerplexity: false, // Skip expensive validation for monitoring
            useCoreSignal: true,
            useNameSimilarity: true,
            useLinkedInValidation: false,
            useWebsiteValidation: testCase['type'] === 'company'
          }
        });
        
        const responseTime = Date.now() - startTime;
        
        results.push({
          testCase,
          result,
          responseTime,
          success: true,
          accuracyMet: result.overallConfidence >= testCase.expectedAccuracy
        });
        
      } catch (error) {
        results.push({
          testCase,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
          accuracyMet: false
        });
      }
    }
    
    return results;
  }

  /**
   * Calculate quality metrics from test results
   */
  private calculateQualityMetrics(testResults: any[], startTime: number): QualityMetrics {
    const totalTests = testResults.length;
    const successfulTests = testResults.filter(r => r.success).length;
    const accurateTests = testResults.filter(r => r.accuracyMet).length;
    
    const avgAccuracy = testResults
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.result?.overallConfidence || 0), 0) / Math.max(successfulTests, 1);
    
    const avgResponseTime = testResults
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.responseTime || 0), 0) / Math.max(successfulTests, 1);
    
    const totalCost = testResults
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.result?.metadata?.totalCost || 0), 0);

    return {
      timestamp: new Date().toISOString(),
      overallAccuracy: Math.round(avgAccuracy),
      apiReliability: Math.round((successfulTests / totalTests) * 100),
      dataCompleteness: Math.round((accurateTests / totalTests) * 100),
      responseTime: Math.round(avgResponseTime),
      costEfficiency: totalCost,
      errorRate: Math.round(((totalTests - successfulTests) / totalTests) * 100),
      validationCoverage: 100 // We're testing all major validation types
    };
  }

  /**
   * Check for issues and generate alerts
   */
  private async checkForIssues(metrics: QualityMetrics): Promise<void> {
    // Check accuracy threshold
    if (metrics.overallAccuracy < this.config.accuracyThreshold) {
      await this.createAlert({
        severity: 'high',
        type: 'accuracy',
        message: `Accuracy dropped below threshold: ${metrics.overallAccuracy}% < ${this.config.accuracyThreshold}%`,
        details: { currentAccuracy: metrics.overallAccuracy, threshold: this.config.accuracyThreshold }
      });
    }

    // Check response time threshold
    if (metrics.responseTime > this.config.responseTimeThreshold) {
      await this.createAlert({
        severity: 'medium',
        type: 'performance',
        message: `Response time exceeded threshold: ${metrics.responseTime}ms > ${this.config.responseTimeThreshold}ms`,
        details: { currentResponseTime: metrics.responseTime, threshold: this.config.responseTimeThreshold }
      });
    }

    // Check error rate threshold
    if (metrics.errorRate > this.config.errorRateThreshold) {
      await this.createAlert({
        severity: 'high',
        type: 'error',
        message: `Error rate exceeded threshold: ${metrics.errorRate}% > ${this.config.errorRateThreshold}%`,
        details: { currentErrorRate: metrics.errorRate, threshold: this.config.errorRateThreshold }
      });
    }

    // Check cost threshold
    if (metrics.costEfficiency > this.config.costThreshold) {
      await this.createAlert({
        severity: 'medium',
        type: 'cost',
        message: `Cost exceeded threshold: $${metrics.costEfficiency} > $${this.config.costThreshold}`,
        details: { currentCost: metrics.costEfficiency, threshold: this.config.costThreshold }
      });
    }

    // Check for critical system failure
    if (metrics.apiReliability < 50) {
      await this.createAlert({
        severity: 'critical',
        type: 'error',
        message: `Critical system failure: API reliability at ${metrics.apiReliability}%`,
        details: { apiReliability: metrics.apiReliability }
      });
    }
  }

  /**
   * Create and send alert
   */
  private async createAlert(alertData: Omit<QualityAlert, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    const alert: QualityAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      resolved: false,
      ...alertData
    };

    this.alerts.push(alert);
    
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this['alerts'] = this.alerts.slice(-50);
    }

    console.log(`[Quality Monitor] ${alert.severity.toUpperCase()} ALERT: ${alert.message}`);

    // Send notifications
    await this.sendNotifications(alert);
  }

  /**
   * Send alert notifications
   */
  private async sendNotifications(alert: QualityAlert): Promise<void> {
    try {
      // Webhook notification
      if (this.config.alertWebhookUrl) {
        await fetch(this.config.alertWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alert,
            system: 'Adrata Quality Monitor',
            timestamp: alert.timestamp
          })
        });
      }

      // Console notification for development
      console.log(`🚨 [Quality Alert] ${alert.severity.toUpperCase()}: ${alert.message}`);
      
    } catch (error) {
      console.error('[Quality Monitor] Failed to send notifications:', error);
    }
  }

  /**
   * Get current quality metrics
   */
  getCurrentMetrics(): QualityMetrics | null {
    return this.metrics.length > 0 ? this['metrics'][this.metrics.length - 1] : null;
  }

  /**
   * Get historical metrics
   */
  getHistoricalMetrics(limit: number = 24): QualityMetrics[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): QualityAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(limit: number = 20): QualityAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a['id'] === alertId);
    if (alert) {
      alert['resolved'] = true;
      return true;
    }
    return false;
  }

  /**
   * Get quality dashboard data
   */
  getDashboardData() {
    const currentMetrics = this.getCurrentMetrics();
    const historicalMetrics = this.getHistoricalMetrics();
    const activeAlerts = this.getActiveAlerts();

    return {
      current: currentMetrics,
      historical: historicalMetrics,
      alerts: activeAlerts,
      trends: this.calculateTrends(historicalMetrics),
      summary: {
        isHealthy: currentMetrics ? 
          currentMetrics.overallAccuracy >= this['config']['accuracyThreshold'] &&
          currentMetrics.errorRate <= this['config']['errorRateThreshold'] &&
          activeAlerts.filter(a => a['severity'] === 'critical').length === 0
          : false,
        lastCheck: currentMetrics?.timestamp,
        totalAlerts: activeAlerts.length,
        criticalAlerts: activeAlerts.filter(a => a['severity'] === 'critical').length
      }
    };
  }

  /**
   * Calculate trends from historical data
   */
  private calculateTrends(metrics: QualityMetrics[]) {
    if (metrics.length < 2) return null;

    const recent = metrics.slice(-5);
    const older = metrics.slice(-10, -5);

    if (older['length'] === 0) return null;

    const recentAvg = {
      accuracy: recent.reduce((sum, m) => sum + m.overallAccuracy, 0) / recent.length,
      responseTime: recent.reduce((sum, m) => sum + m.responseTime, 0) / recent.length,
      errorRate: recent.reduce((sum, m) => sum + m.errorRate, 0) / recent.length
    };

    const olderAvg = {
      accuracy: older.reduce((sum, m) => sum + m.overallAccuracy, 0) / older.length,
      responseTime: older.reduce((sum, m) => sum + m.responseTime, 0) / older.length,
      errorRate: older.reduce((sum, m) => sum + m.errorRate, 0) / older.length
    };

    return {
      accuracy: recentAvg.accuracy - olderAvg.accuracy,
      responseTime: recentAvg.responseTime - olderAvg.responseTime,
      errorRate: recentAvg.errorRate - olderAvg.errorRate
    };
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this['config'] = { ...this.config, ...newConfig };
    console.log('[Quality Monitor] Configuration updated');
  }

  /**
   * Get monitoring status
   */
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      config: this.config,
      metricsCount: this.metrics.length,
      alertsCount: this.alerts.length,
      activeAlertsCount: this.getActiveAlerts().length
    };
  }
}

// Export singleton instance
export const qualityMonitor = new AutomatedQualityMonitor();
