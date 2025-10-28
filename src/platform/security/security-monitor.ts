/**
 * 🛡️ SECURITY MONITOR
 * 
 * Comprehensive monitoring and logging system for AI security events
 * Tracks injection attempts, rate limiting, and security violations
 */

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: 'injection_attempt' | 'rate_limit_exceeded' | 'response_validation_failed' | 'authentication_failed' | 'context_isolation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  workspaceId?: string;
  endpoint: string;
  details: {
    attackType?: string;
    riskLevel?: string;
    confidence?: number;
    blockedPatterns?: string[];
    issues?: string[];
    recommendations?: string[];
    userAgent?: string;
    ipAddress?: string;
    requestId?: string;
  };
  metadata: {
    originalInput?: string;
    sanitizedInput?: string;
    response?: string;
    contextSize?: number;
    processingTime?: number;
  };
}

export interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  eventsByEndpoint: Record<string, number>;
  topAttackTypes: Array<{ type: string; count: number }>;
  topUsers: Array<{ userId: string; eventCount: number; severity: string }>;
  recentTrends: {
    last24Hours: number;
    last7Days: number;
    last30Days: number;
  };
  successRate: number;
  averageResponseTime: number;
}

export interface SecurityAlert {
  id: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'multiple_attacks' | 'suspicious_pattern' | 'rate_limit_abuse' | 'response_manipulation';
  title: string;
  description: string;
  userId?: string;
  workspaceId?: string;
  recommendations: string[];
  resolved: boolean;
  resolvedAt?: Date;
}

export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private events: SecurityEvent[] = [];
  private alerts: SecurityAlert[] = [];
  private readonly MAX_EVENTS = 10000; // Keep last 10k events
  private readonly MAX_ALERTS = 1000; // Keep last 1k alerts
  private alertThresholds = {
    multiple_attacks: 5, // Alert after 5 attacks in 1 hour
    suspicious_pattern: 3, // Alert after 3 similar patterns
    rate_limit_abuse: 10, // Alert after 10 rate limit hits
    response_manipulation: 2 // Alert after 2 response validation failures
  };

  public static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  /**
   * Log a security event
   */
  public logEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      ...event
    };

    this.events.push(securityEvent);
    
    // Keep only recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Check for alerts
    this.checkForAlerts(securityEvent);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      this.logToConsole(securityEvent);
    }

    // TODO: Send to external monitoring service (DataDog, New Relic, etc.)
  }

  /**
   * Log injection attempt
   */
  public logInjectionAttempt(
    userId: string | undefined,
    workspaceId: string | undefined,
    endpoint: string,
    attackType: string,
    riskLevel: string,
    confidence: number,
    blockedPatterns: string[],
    originalInput: string,
    sanitizedInput: string,
    userAgent?: string,
    ipAddress?: string,
    requestId?: string
  ): void {
    this.logEvent({
      type: 'injection_attempt',
      severity: this.mapRiskLevelToSeverity(riskLevel),
      userId,
      workspaceId,
      endpoint,
      details: {
        attackType,
        riskLevel,
        confidence,
        blockedPatterns,
        userAgent,
        ipAddress,
        requestId
      },
      metadata: {
        originalInput: originalInput.substring(0, 500),
        sanitizedInput: sanitizedInput.substring(0, 500)
      }
    });
  }

  /**
   * Log rate limit exceeded
   */
  public logRateLimitExceeded(
    userId: string,
    workspaceId: string | undefined,
    endpoint: string,
    limit: number,
    totalHits: number,
    retryAfter: number,
    userAgent?: string,
    ipAddress?: string
  ): void {
    this.logEvent({
      type: 'rate_limit_exceeded',
      severity: 'medium',
      userId,
      workspaceId,
      endpoint,
      details: {
        limit,
        totalHits,
        retryAfter,
        userAgent,
        ipAddress
      },
      metadata: {}
    });
  }

  /**
   * Log response validation failure
   */
  public logResponseValidationFailure(
    userId: string | undefined,
    workspaceId: string | undefined,
    endpoint: string,
    riskLevel: string,
    issues: string[],
    originalResponse: string,
    sanitizedResponse: string,
    processingTime: number
  ): void {
    this.logEvent({
      type: 'response_validation_failed',
      severity: this.mapRiskLevelToSeverity(riskLevel),
      userId,
      workspaceId,
      endpoint,
      details: {
        riskLevel,
        issues
      },
      metadata: {
        originalInput: originalResponse.substring(0, 500),
        sanitizedInput: sanitizedResponse.substring(0, 500),
        processingTime
      }
    });
  }

  /**
   * Log authentication failure
   */
  public logAuthenticationFailure(
    endpoint: string,
    userAgent?: string,
    ipAddress?: string,
    reason?: string
  ): void {
    this.logEvent({
      type: 'authentication_failed',
      severity: 'high',
      endpoint,
      details: {
        reason,
        userAgent,
        ipAddress
      },
      metadata: {}
    });
  }

  /**
   * Log context isolation event
   */
  public logContextIsolation(
    userId: string | undefined,
    workspaceId: string | undefined,
    endpoint: string,
    originalSize: number,
    isolatedSize: number,
    prunedItems: number,
    separationLevel: string
  ): void {
    this.logEvent({
      type: 'context_isolation',
      severity: 'low',
      userId,
      workspaceId,
      endpoint,
      details: {
        separationLevel
      },
      metadata: {
        contextSize: originalSize,
        processingTime: isolatedSize
      }
    });
  }

  /**
   * Get security metrics
   */
  public getMetrics(timeRange: '24h' | '7d' | '30d' = '24h'): SecurityMetrics {
    const now = new Date();
    const timeRangeMs = this.getTimeRangeMs(timeRange);
    const cutoffTime = new Date(now.getTime() - timeRangeMs);
    
    const recentEvents = this.events.filter(event => event.timestamp >= cutoffTime);
    
    // Calculate metrics
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const eventsByEndpoint: Record<string, number> = {};
    const attackTypeCounts: Record<string, number> = {};
    const userEventCounts: Record<string, { count: number; maxSeverity: string }> = {};
    
    let totalProcessingTime = 0;
    let successfulRequests = 0;
    
    recentEvents.forEach(event => {
      // Count by type
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      
      // Count by severity
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      
      // Count by endpoint
      eventsByEndpoint[event.endpoint] = (eventsByEndpoint[event.endpoint] || 0) + 1;
      
      // Count attack types
      if (event.details.attackType) {
        attackTypeCounts[event.details.attackType] = 
          (attackTypeCounts[event.details.attackType] || 0) + 1;
      }
      
      // Count user events
      if (event.userId) {
        if (!userEventCounts[event.userId]) {
          userEventCounts[event.userId] = { count: 0, maxSeverity: 'low' };
        }
        userEventCounts[event.userId].count++;
        if (this.getSeverityLevel(event.severity) > this.getSeverityLevel(userEventCounts[event.userId].maxSeverity)) {
          userEventCounts[event.userId].maxSeverity = event.severity;
        }
      }
      
      // Track processing time
      if (event.metadata.processingTime) {
        totalProcessingTime += event.metadata.processingTime;
      }
      
      // Count successful requests (non-security events)
      if (event.type === 'context_isolation') {
        successfulRequests++;
      }
    });
    
    // Calculate top attack types
    const topAttackTypes = Object.entries(attackTypeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Calculate top users
    const topUsers = Object.entries(userEventCounts)
      .map(([userId, data]) => ({ userId, eventCount: data.count, severity: data.maxSeverity }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);
    
    // Calculate recent trends
    const last24Hours = this.getEventCountInRange(24 * 60 * 60 * 1000);
    const last7Days = this.getEventCountInRange(7 * 24 * 60 * 60 * 1000);
    const last30Days = this.getEventCountInRange(30 * 24 * 60 * 60 * 1000);
    
    // Calculate success rate
    const totalRequests = recentEvents.length;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100;
    
    // Calculate average response time
    const averageResponseTime = totalProcessingTime > 0 ? totalProcessingTime / recentEvents.length : 0;
    
    return {
      totalEvents: recentEvents.length,
      eventsByType,
      eventsBySeverity,
      eventsByEndpoint,
      topAttackTypes,
      topUsers,
      recentTrends: {
        last24Hours,
        last7Days,
        last30Days
      },
      successRate,
      averageResponseTime
    };
  }

  /**
   * Get security alerts
   */
  public getAlerts(resolved: boolean | undefined = undefined): SecurityAlert[] {
    if (resolved === undefined) {
      return this.alerts.slice(-100); // Return last 100 alerts
    }
    
    return this.alerts
      .filter(alert => alert.resolved === resolved)
      .slice(-100);
  }

  /**
   * Resolve an alert
   */
  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Get events for a specific user
   */
  public getUserEvents(userId: string, limit: number = 50): SecurityEvent[] {
    return this.events
      .filter(event => event.userId === userId)
      .slice(-limit);
  }

  /**
   * Get events for a specific workspace
   */
  public getWorkspaceEvents(workspaceId: string, limit: number = 50): SecurityEvent[] {
    return this.events
      .filter(event => event.workspaceId === workspaceId)
      .slice(-limit);
  }

  /**
   * Clear old events and alerts
   */
  public cleanup(): void {
    const cutoffTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
    
    this.events = this.events.filter(event => event.timestamp >= cutoffTime);
    this.alerts = this.alerts.filter(alert => alert.timestamp >= cutoffTime);
    
    console.log(`🧹 [SECURITY MONITOR] Cleaned up old events and alerts`);
  }

  /**
   * Export security data for analysis
   */
  public exportData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      events: this.events,
      alerts: this.alerts,
      metrics: this.getMetrics('30d'),
      exportedAt: new Date().toISOString()
    };
    
    if (format === 'csv') {
      return this.convertToCSV(data);
    }
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * Check for alerts based on event patterns
   */
  private checkForAlerts(event: SecurityEvent): void {
    // Check for multiple attacks from same user
    if (event.type === 'injection_attempt' && event.userId) {
      const recentAttacks = this.events.filter(e => 
        e.type === 'injection_attempt' && 
        e.userId === event.userId &&
        e.timestamp >= new Date(Date.now() - 60 * 60 * 1000) // Last hour
      );
      
      if (recentAttacks.length >= this.alertThresholds.multiple_attacks) {
        this.createAlert({
          type: 'multiple_attacks',
          severity: 'high',
          title: 'Multiple injection attempts detected',
          description: `User ${event.userId} has made ${recentAttacks.length} injection attempts in the last hour`,
          userId: event.userId,
          workspaceId: event.workspaceId,
          recommendations: [
            'Review user activity for suspicious patterns',
            'Consider temporary user suspension',
            'Investigate potential account compromise'
          ]
        });
      }
    }
    
    // Check for rate limit abuse
    if (event.type === 'rate_limit_exceeded' && event.userId) {
      const recentRateLimits = this.events.filter(e => 
        e.type === 'rate_limit_exceeded' && 
        e.userId === event.userId &&
        e.timestamp >= new Date(Date.now() - 60 * 60 * 1000) // Last hour
      );
      
      if (recentRateLimits.length >= this.alertThresholds.rate_limit_abuse) {
        this.createAlert({
          type: 'rate_limit_abuse',
          severity: 'medium',
          title: 'Rate limit abuse detected',
          description: `User ${event.userId} has exceeded rate limits ${recentRateLimits.length} times in the last hour`,
          userId: event.userId,
          workspaceId: event.workspaceId,
          recommendations: [
            'Review rate limiting configuration',
            'Consider stricter limits for this user',
            'Investigate potential DoS attack'
          ]
        });
      }
    }
  }

  /**
   * Create a new alert
   */
  private createAlert(alertData: Omit<SecurityAlert, 'id' | 'timestamp' | 'resolved'>): void {
    const alert: SecurityAlert = {
      id: this.generateEventId(),
      timestamp: new Date(),
      resolved: false,
      ...alertData
    };
    
    this.alerts.push(alert);
    
    // Keep only recent alerts
    if (this.alerts.length > this.MAX_ALERTS) {
      this.alerts = this.alerts.slice(-this.MAX_ALERTS);
    }
    
    // Log critical alerts
    if (alert.severity === 'critical') {
      console.error(`🚨 [SECURITY ALERT] ${alert.title}: ${alert.description}`);
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Map risk level to severity
   */
  private mapRiskLevelToSeverity(riskLevel: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (riskLevel) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }

  /**
   * Get severity level as number
   */
  private getSeverityLevel(severity: string): number {
    switch (severity) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  /**
   * Get time range in milliseconds
   */
  private getTimeRangeMs(timeRange: string): number {
    switch (timeRange) {
      case '24h': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      case '30d': return 30 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Get event count in time range
   */
  private getEventCountInRange(timeRangeMs: number): number {
    const cutoffTime = new Date(Date.now() - timeRangeMs);
    return this.events.filter(event => event.timestamp >= cutoffTime).length;
  }

  /**
   * Log to console in development
   */
  private logToConsole(event: SecurityEvent): void {
    const severityEmoji = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      critical: '🔴'
    };
    
    console.log(`${severityEmoji[event.severity]} [SECURITY] ${event.type}:`, {
      userId: event.userId,
      workspaceId: event.workspaceId,
      endpoint: event.endpoint,
      severity: event.severity,
      details: event.details
    });
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any): string {
    // Simple CSV conversion - in production, use a proper CSV library
    const events = data.events;
    if (events.length === 0) return '';
    
    const headers = Object.keys(events[0]);
    const csvRows = [headers.join(',')];
    
    events.forEach(event => {
      const values = headers.map(header => {
        const value = event[header];
        if (typeof value === 'object') {
          return JSON.stringify(value).replace(/,/g, ';');
        }
        return String(value).replace(/,/g, ';');
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  }
}

// Export singleton instance
export const securityMonitor = SecurityMonitor.getInstance();
