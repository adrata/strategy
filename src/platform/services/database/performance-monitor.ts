/**
 * Database Performance Monitoring Service
 * Tracks query performance and provides optimization insights
 */

export interface QueryMetrics {
  queryType: string;
  tableName: string;
  executionTime: number;
  recordCount: number;
  workspaceId: string;
  userId: string;
  timestamp: Date;
  queryHash: string;
  isSlow: boolean;
  optimizationSuggestions: string[];
}

export interface PerformanceThresholds {
  fast: number;      // < 100ms
  acceptable: number; // < 500ms
  slow: number;      // < 2000ms
  critical: number;   // > 2000ms
}

export const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  fast: 100,
  acceptable: 500,
  slow: 2000,
  critical: 2000
};

export class DatabasePerformanceMonitor {
  private static instance: DatabasePerformanceMonitor;
  private queryMetrics: QueryMetrics[] = [];
  private slowQueries: QueryMetrics[] = [];
  
  private constructor() {}
  
  static getInstance(): DatabasePerformanceMonitor {
    if (!DatabasePerformanceMonitor.instance) {
      DatabasePerformanceMonitor.instance = new DatabasePerformanceMonitor();
    }
    return DatabasePerformanceMonitor.instance;
  }
  
  /**
   * Track a database query execution
   */
  trackQuery(
    queryType: string,
    tableName: string,
    executionTime: number,
    recordCount: number,
    workspaceId: string,
    userId: string,
    queryHash?: string
  ): QueryMetrics {
    const metrics: QueryMetrics = {
      queryType,
      tableName,
      executionTime,
      recordCount,
      workspaceId,
      userId,
      timestamp: new Date(),
      queryHash: queryHash || this.generateQueryHash(queryType, tableName),
      isSlow: executionTime > PERFORMANCE_THRESHOLDS.acceptable,
      optimizationSuggestions: this.generateOptimizationSuggestions(
        queryType,
        tableName,
        executionTime,
        recordCount
      )
    };
    
    this.queryMetrics.push(metrics);
    
    // Track slow queries separately
    if (metrics.isSlow) {
      this.slowQueries.push(metrics);
      this.logSlowQuery(metrics);
    }
    
    // Log performance warnings
    this.logPerformanceWarning(metrics);
    
    return metrics;
  }
  
  /**
   * Get performance statistics
   */
  getPerformanceStats(timeWindow?: number): {
    totalQueries: number;
    slowQueries: number;
    averageExecutionTime: number;
    slowestQueries: QueryMetrics[];
    optimizationSuggestions: string[];
  } {
    const cutoffTime = timeWindow 
      ? new Date(Date.now() - timeWindow)
      : new Date(0);
    
    const recentMetrics = this.queryMetrics.filter(
      m => m.timestamp >= cutoffTime
    );
    
    const slowQueries = recentMetrics.filter(m => m.isSlow);
    const averageExecutionTime = recentMetrics.reduce(
      (sum, m) => sum + m.executionTime, 0
    ) / recentMetrics.length || 0;
    
    const slowestQueries = recentMetrics
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10);
    
    const allSuggestions = recentMetrics
      .flatMap(m => m.optimizationSuggestions)
      .filter((suggestion, index, array) => array.indexOf(suggestion) === index);
    
    return {
      totalQueries: recentMetrics.length,
      slowQueries: slowQueries.length,
      averageExecutionTime,
      slowestQueries,
      optimizationSuggestions: allSuggestions
    };
  }
  
  /**
   * Get slow queries for analysis
   */
  getSlowQueries(limit: number = 50): QueryMetrics[] {
    return this.slowQueries
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, limit);
  }
  
  /**
   * Clear old metrics to prevent memory leaks
   */
  clearOldMetrics(maxAge: number = 24 * 60 * 60 * 1000): void { // 24 hours
    const cutoffTime = new Date(Date.now() - maxAge);
    this.queryMetrics = this.queryMetrics.filter(m => m.timestamp >= cutoffTime);
    this.slowQueries = this.slowQueries.filter(m => m.timestamp >= cutoffTime);
  }
  
  private generateQueryHash(queryType: string, tableName: string): string {
    return `${queryType}-${tableName}-${Date.now()}`;
  }
  
  private generateOptimizationSuggestions(
    queryType: string,
    tableName: string,
    executionTime: number,
    recordCount: number
  ): string[] {
    const suggestions: string[] = [];
    
    // Slow query suggestions
    if (executionTime > PERFORMANCE_THRESHOLDS.slow) {
      suggestions.push('Query is very slow - consider adding indexes');
      suggestions.push('Review query complexity and reduce data selection');
    }
    
    // Large result set suggestions
    if (recordCount > 1000) {
      suggestions.push('Large result set - implement pagination');
      suggestions.push('Consider filtering data at database level');
    }
    
    // Table-specific suggestions
    if (tableName === 'companies' || tableName === 'people') {
      if (executionTime > PERFORMANCE_THRESHOLDS.acceptable) {
        suggestions.push(`Add indexes on ${tableName}.workspaceId and ${tableName}.assignedUserId`);
        suggestions.push(`Consider reducing column selection for ${tableName} queries`);
      }
    }
    
    // Query type specific suggestions
    if (queryType === 'findMany' && executionTime > PERFORMANCE_THRESHOLDS.acceptable) {
      suggestions.push('Use select to limit columns returned');
      suggestions.push('Add proper ORDER BY indexes');
    }
    
    return suggestions;
  }
  
  private logSlowQuery(metrics: QueryMetrics): void {
    console.warn(`🐌 [SLOW QUERY] ${metrics.queryType} on ${metrics.tableName}:`, {
      executionTime: `${metrics.executionTime}ms`,
      recordCount: metrics.recordCount,
      workspaceId: metrics.workspaceId,
      suggestions: metrics.optimizationSuggestions
    });
  }
  
  private logPerformanceWarning(metrics: QueryMetrics): void {
    if (metrics.executionTime > PERFORMANCE_THRESHOLDS.critical) {
      console.error(`🚨 [CRITICAL QUERY] ${metrics.queryType} on ${metrics.tableName}: ${metrics.executionTime}ms`);
    } else if (metrics.executionTime > PERFORMANCE_THRESHOLDS.slow) {
      console.warn(`⚠️ [SLOW QUERY] ${metrics.queryType} on ${metrics.tableName}: ${metrics.executionTime}ms`);
    }
  }
}

/**
 * Performance monitoring decorator for database queries
 */
export function monitorQuery(
  queryType: string,
  tableName: string,
  workspaceId: string,
  userId: string
) {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const startTime = Date.now();
      const result = await method.apply(this, args);
      const executionTime = Date.now() - startTime;
      
      const monitor = DatabasePerformanceMonitor.getInstance();
      monitor.trackQuery(
        queryType,
        tableName,
        executionTime,
        Array.isArray(result) ? result.length : 1,
        workspaceId,
        userId
      );
      
      return result;
    };
  };
}

/**
 * Simple performance tracking function
 */
export function trackQueryPerformance<T>(
  queryType: string,
  tableName: string,
  workspaceId: string,
  userId: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  return queryFn().then(result => {
    const executionTime = Date.now() - startTime;
    const recordCount = Array.isArray(result) ? result.length : 1;
    
    const monitor = DatabasePerformanceMonitor.getInstance();
    monitor.trackQuery(
      queryType,
      tableName,
      executionTime,
      recordCount,
      workspaceId,
      userId
    );
    
    return result;
  });
}
