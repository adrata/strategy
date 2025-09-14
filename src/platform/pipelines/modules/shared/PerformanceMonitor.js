/**
 * 📊 PERFORMANCE MONITORING DASHBOARD
 * 
 * Real-time pipeline performance tracking and optimization insights
 */

class PerformanceMonitor {
  constructor() {
    this.sessions = new Map();
    this.globalStats = {
      totalRuns: 0,
      totalCompanies: 0,
      totalCost: 0,
      totalTime: 0,
      cacheHitRate: 0,
      errorRate: 0
    };
  }

  /**
   * Start monitoring a pipeline session
   */
  startSession(sessionId, pipeline, companies) {
    const session = {
      id: sessionId,
      pipeline,
      companies: Array.isArray(companies) ? companies : [companies],
      startTime: Date.now(),
      modules: new Map(),
      totalCost: 0,
      errors: [],
      status: 'running'
    };

    this.sessions.set(sessionId, session);
    console.log(`📊 Monitoring started: ${pipeline} pipeline (${session.companies.length} companies)`);
    return session;
  }

  /**
   * Track module performance
   */
  trackModule(sessionId, moduleName, stats) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.modules.set(moduleName, {
      ...stats,
      timestamp: Date.now()
    });

    // Update session totals
    session.totalCost += stats.cost || 0;
    if (stats.errors > 0) {
      session.errors.push({
        module: moduleName,
        count: stats.errors,
        timestamp: Date.now()
      });
    }
  }

  /**
   * End monitoring session
   */
  endSession(sessionId, result = {}) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;
    session.status = result.success ? 'completed' : 'failed';
    session.result = result;

    // Update global statistics
    this.updateGlobalStats(session);

    console.log(`📊 Session completed: ${session.id} (${session.duration}ms)`);
    return session;
  }

  /**
   * Update global performance statistics
   */
  updateGlobalStats(session) {
    this.globalStats.totalRuns++;
    this.globalStats.totalCompanies += session.companies.length;
    this.globalStats.totalCost += session.totalCost;
    this.globalStats.totalTime += session.duration;

    // Calculate cache hit rate
    let totalCacheHits = 0;
    let totalCacheAttempts = 0;
    
    session.modules.forEach(moduleStats => {
      totalCacheHits += moduleStats.cacheHits || 0;
      totalCacheAttempts += (moduleStats.cacheHits || 0) + (moduleStats.cacheMisses || 0);
    });

    if (totalCacheAttempts > 0) {
      this.globalStats.cacheHitRate = (totalCacheHits / totalCacheAttempts * 100);
    }

    // Calculate error rate
    const totalErrors = session.errors.reduce((sum, error) => sum + error.count, 0);
    const totalModuleRuns = session.modules.size * session.companies.length;
    this.globalStats.errorRate = totalModuleRuns > 0 ? (totalErrors / totalModuleRuns * 100) : 0;
  }

  /**
   * Generate performance dashboard
   */
  generateDashboard() {
    const activeSessions = Array.from(this.sessions.values()).filter(s => s.status === 'running');
    const completedSessions = Array.from(this.sessions.values()).filter(s => s.status === 'completed');
    
    const dashboard = {
      timestamp: new Date().toISOString(),
      overview: {
        activeSessions: activeSessions.length,
        completedSessions: completedSessions.length,
        ...this.globalStats
      },
      performance: this.getPerformanceInsights(),
      costOptimization: this.getCostOptimization(),
      recommendations: this.getRecommendations()
    };

    return dashboard;
  }

  /**
   * Get performance insights
   */
  getPerformanceInsights() {
    const sessions = Array.from(this.sessions.values()).filter(s => s.status === 'completed');
    
    if (sessions.length === 0) {
      return { message: 'No completed sessions to analyze' };
    }

    const pipelineStats = {};
    
    sessions.forEach(session => {
      if (!pipelineStats[session.pipeline]) {
        pipelineStats[session.pipeline] = {
          runs: 0,
          totalTime: 0,
          totalCost: 0,
          totalCompanies: 0,
          errors: 0
        };
      }
      
      const stats = pipelineStats[session.pipeline];
      stats.runs++;
      stats.totalTime += session.duration;
      stats.totalCost += session.totalCost;
      stats.totalCompanies += session.companies.length;
      stats.errors += session.errors.length;
    });

    // Calculate averages
    Object.keys(pipelineStats).forEach(pipeline => {
      const stats = pipelineStats[pipeline];
      stats.avgTimePerCompany = stats.totalCompanies > 0 ? stats.totalTime / stats.totalCompanies : 0;
      stats.avgCostPerCompany = stats.totalCompanies > 0 ? stats.totalCost / stats.totalCompanies : 0;
      stats.errorRate = stats.totalCompanies > 0 ? (stats.errors / stats.totalCompanies * 100) : 0;
    });

    return pipelineStats;
  }

  /**
   * Get cost optimization insights
   */
  getCostOptimization() {
    const totalPotentialCalls = this.globalStats.totalRuns * 50; // Estimated API calls without caching
    const actualCalls = this.globalStats.totalRuns * (100 - this.globalStats.cacheHitRate) / 100 * 50;
    const savedCalls = totalPotentialCalls - actualCalls;
    const costSavings = savedCalls * 0.01; // Estimated $0.01 per API call

    return {
      cacheHitRate: `${this.globalStats.cacheHitRate.toFixed(1)}%`,
      apiCallsSaved: Math.round(savedCalls),
      costSavings: `$${costSavings.toFixed(2)}`,
      efficiency: savedCalls > 0 ? `${(savedCalls / totalPotentialCalls * 100).toFixed(1)}% more efficient` : 'No savings yet'
    };
  }

  /**
   * Get optimization recommendations
   */
  getRecommendations() {
    const recommendations = [];

    // Cache efficiency recommendations
    if (this.globalStats.cacheHitRate < 70) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Caching',
        issue: `Cache hit rate is ${this.globalStats.cacheHitRate.toFixed(1)}% (target: >70%)`,
        solution: 'Increase cache TTL or improve cache key strategies',
        impact: 'Up to 82% cost reduction'
      });
    }

    // Error rate recommendations
    if (this.globalStats.errorRate > 5) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Reliability',
        issue: `Error rate is ${this.globalStats.errorRate.toFixed(1)}% (target: <5%)`,
        solution: 'Implement better error handling and retry logic',
        impact: 'Improved data quality and reliability'
      });
    }

    // Performance recommendations
    const avgTimePerCompany = this.globalStats.totalCompanies > 0 
      ? this.globalStats.totalTime / this.globalStats.totalCompanies 
      : 0;
    
    if (avgTimePerCompany > 10000) { // >10 seconds per company
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Performance',
        issue: `Average processing time is ${(avgTimePerCompany/1000).toFixed(1)}s per company`,
        solution: 'Optimize slow modules or implement parallel processing',
        impact: 'Faster pipeline execution'
      });
    }

    return recommendations;
  }

  /**
   * Get session details
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  /**
   * Clear old sessions (keep last 100)
   */
  cleanup() {
    const sessions = Array.from(this.sessions.entries())
      .sort(([,a], [,b]) => (b.endTime || b.startTime) - (a.endTime || a.startTime));
    
    if (sessions.length > 100) {
      const toDelete = sessions.slice(100);
      toDelete.forEach(([sessionId]) => {
        this.sessions.delete(sessionId);
      });
      console.log(`🧹 Cleaned up ${toDelete.length} old sessions`);
    }
  }

  /**
   * Export performance data
   */
  exportData() {
    return {
      globalStats: this.globalStats,
      sessions: Array.from(this.sessions.values()),
      dashboard: this.generateDashboard()
    };
  }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

module.exports = { PerformanceMonitor, performanceMonitor };
