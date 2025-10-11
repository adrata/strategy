/**
 * METRICS SERVICE
 * 
 * Track and report metrics for observability
 * Following 2025 best practices: histograms, counters, gauges
 */

export interface MetricTags {
  workspaceId?: string;
  pipelineName?: string;
  step?: string;
  enrichmentLevel?: string;
  status?: string;
  [key: string]: string | undefined;
}

export interface MetricValue {
  value: number;
  timestamp: number;
  tags: MetricTags;
}

class MetricsService {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  /**
   * Increment a counter
   */
  increment(name: string, value: number = 1, tags?: MetricTags): void {
    const key = this.getKey(name, tags);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);

    this.emit('counter', name, current + value, tags);
  }

  /**
   * Set a gauge value
   */
  gauge(name: string, value: number, tags?: MetricTags): void {
    const key = this.getKey(name, tags);
    this.gauges.set(key, value);

    this.emit('gauge', name, value, tags);
  }

  /**
   * Record histogram value (for percentiles)
   */
  histogram(name: string, value: number, tags?: MetricTags): void {
    const key = this.getKey(name, tags);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);

    this.emit('histogram', name, value, tags);
  }

  /**
   * Time an operation
   */
  async time<T>(name: string, fn: () => Promise<T>, tags?: MetricTags): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      this.histogram(name, duration, { ...tags, status: 'success' });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.histogram(name, duration, { ...tags, status: 'error' });
      
      throw error;
    }
  }

  /**
   * Get counter value
   */
  getCounter(name: string, tags?: MetricTags): number {
    const key = this.getKey(name, tags);
    return this.counters.get(key) || 0;
  }

  /**
   * Get gauge value
   */
  getGauge(name: string, tags?: MetricTags): number {
    const key = this.getKey(name, tags);
    return this.gauges.get(key) || 0;
  }

  /**
   * Get histogram statistics
   */
  getHistogramStats(name: string, tags?: MetricTags): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const key = this.getKey(name, tags);
    const values = this.histograms.get(key);

    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;

    return {
      count,
      min: sorted[0],
      max: sorted[count - 1],
      avg: sorted.reduce((a, b) => a + b, 0) / count,
      p50: sorted[Math.floor(count * 0.5)],
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)]
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  /**
   * Emit metric to external service (DataDog, CloudWatch, etc.)
   */
  private emit(type: string, name: string, value: number, tags?: MetricTags): void {
    // In production, send to metrics service
    // For now, just log in development
    if (process.env.NODE_ENV === 'development') {
      const tagsStr = tags ? ` ${JSON.stringify(tags)}` : '';
      console.log(`📊 [METRIC] ${type}.${name} = ${value}${tagsStr}`);
    }

    // TODO: Send to DataDog, CloudWatch, Prometheus, etc.
    // Example for DataDog:
    // dogstatsd.histogram(name, value, tags);
  }

  /**
   * Generate unique key for metric with tags
   */
  private getKey(name: string, tags?: MetricTags): string {
    if (!tags) return name;
    
    const sortedTags = Object.keys(tags)
      .sort()
      .map(key => `${key}:${tags[key]}`)
      .join(',');
    
    return `${name}{${sortedTags}}`;
  }
}

// Export singleton instance
export const metrics = new MetricsService();

// Common metric names
export const MetricNames = {
  // Pipeline metrics
  PIPELINE_STARTED: 'pipeline.started',
  PIPELINE_COMPLETED: 'pipeline.completed',
  PIPELINE_FAILED: 'pipeline.failed',
  PIPELINE_DURATION: 'pipeline.duration',
  
  // Step metrics
  STEP_STARTED: 'step.started',
  STEP_COMPLETED: 'step.completed',
  STEP_FAILED: 'step.failed',
  STEP_DURATION: 'step.duration',
  
  // Buyer group metrics
  BUYER_GROUP_MEMBERS_FOUND: 'buyer_group.members_found',
  BUYER_GROUP_CONFIDENCE: 'buyer_group.confidence',
  BUYER_GROUP_COHESION: 'buyer_group.cohesion',
  
  // API metrics
  API_CALL_COUNT: 'api.call_count',
  API_CALL_DURATION: 'api.call_duration',
  API_CALL_ERROR: 'api.call_error',
  
  // Cost metrics
  COST_ESTIMATE: 'cost.estimate',
  COST_ACTUAL: 'cost.actual',
  
  // Cache metrics
  CACHE_HIT: 'cache.hit',
  CACHE_MISS: 'cache.miss',
  CACHE_HIT_RATE: 'cache.hit_rate',
  
  // Database metrics
  DB_QUERY_DURATION: 'db.query_duration',
  DB_QUERY_ERROR: 'db.query_error',
  
  // Webhook metrics
  WEBHOOK_RECEIVED: 'webhook.received',
  WEBHOOK_PROCESSED: 'webhook.processed',
  WEBHOOK_FAILED: 'webhook.failed',
  WEBHOOK_SIGNATURE_INVALID: 'webhook.signature_invalid',
  
  // Job queue metrics
  JOB_ENQUEUED: 'job.enqueued',
  JOB_STARTED: 'job.started',
  JOB_COMPLETED: 'job.completed',
  JOB_FAILED: 'job.failed',
  JOB_DURATION: 'job.duration'
};

export default metrics;

