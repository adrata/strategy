/**
 * ⚡ OPTIMIZED EXECUTION ENGINE
 * 
 * High-performance execution engine with:
 * 1. Intelligent parallel processing
 * 2. Circuit breaker pattern for API failures
 * 3. Adaptive batch sizing based on performance
 * 4. Real-time performance monitoring
 */

import { ExecutiveContact, APIConfig, ResearchRequest } from '../types/intelligence';

interface ExecutionMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  currentThroughput: number;
  optimalBatchSize: number;
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
}

export class OptimizedExecutionEngine {
  private config: APIConfig;
  private metrics: ExecutionMetrics;
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private performanceHistory: number[] = [];

  constructor(config: APIConfig) {
    this['config'] = config;
    this['metrics'] = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      currentThroughput: 0,
      optimalBatchSize: config.MAX_PARALLEL_COMPANIES || 10
    };
  }

  /**
   * ⚡ OPTIMIZED PARALLEL EXECUTION
   */
  async executeInParallel<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options: {
      maxConcurrency?: number;
      batchSize?: number;
      retryAttempts?: number;
      timeoutMs?: number;
    } = {}
  ): Promise<R[]> {
    const {
      maxConcurrency = this.getOptimalConcurrency(),
      batchSize = this.getOptimalBatchSize(),
      retryAttempts = 2,
      timeoutMs = 30000
    } = options;

    console.log(`⚡ [EXECUTION] Processing ${items.length} items with ${maxConcurrency} max concurrency`);

    const results: R[] = [];
    const batches = this.chunkArray(items, batchSize);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`📦 [BATCH ${batchIndex + 1}/${batches.length}] Processing ${batch.length} items...`);

      const batchStartTime = Date.now();

      // Process batch with controlled concurrency
      const batchPromises = batch.map(async (item, itemIndex) => {
        return this.executeWithCircuitBreaker(
          `batch_${batchIndex}_item_${itemIndex}`,
          () => this.executeWithTimeout(processor(item), timeoutMs),
          retryAttempts
        );
      });

      // Wait for batch completion
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Collect successful results
      batchResults.forEach((result, index) => {
        if (result['status'] === 'fulfilled') {
          results.push(result.value);
          this.recordSuccess(Date.now() - batchStartTime);
        } else {
          console.error(`❌ [BATCH] Item ${index} failed:`, result.reason);
          this.recordFailure();
        }
      });

      const batchDuration = Date.now() - batchStartTime;
      console.log(`✅ [BATCH ${batchIndex + 1}] Completed in ${batchDuration}ms: ${results.length}/${items.length} total success`);

      // Adaptive delay between batches based on performance
      if (batchIndex < batches.length - 1) {
        const delay = this.calculateOptimalDelay(batchDuration);
        if (delay > 0) {
          console.log(`⏳ [EXECUTION] Adaptive delay: ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.log(`🏁 [EXECUTION] Parallel execution complete: ${results.length}/${items.length} successful`);
    return results;
  }

  /**
   * 🔄 CIRCUIT BREAKER PATTERN
   */
  private async executeWithCircuitBreaker<T>(
    operationId: string,
    operation: () => Promise<T>,
    retryAttempts: number
  ): Promise<T> {
    const circuitBreaker = this.getCircuitBreaker(operationId);

    // Check circuit breaker state
    if (circuitBreaker['state'] === 'open') {
      const timeSinceLastFailure = Date.now() - circuitBreaker.lastFailureTime;
      if (timeSinceLastFailure < 60000) { // 1 minute cooldown
        throw new Error(`Circuit breaker open for ${operationId}`);
      } else {
        circuitBreaker['state'] = 'half-open';
      }
    }

    // Execute with retries
    for (let attempt = 1; attempt <= retryAttempts + 1; attempt++) {
      try {
        const result = await operation();
        
        // Reset circuit breaker on success
        if (circuitBreaker['state'] === 'half-open') {
          circuitBreaker['state'] = 'closed';
          circuitBreaker['failures'] = 0;
        }
        
        return result;
        
      } catch (error) {
        console.log(`⚠️ [CIRCUIT BREAKER] Attempt ${attempt} failed for ${operationId}:`, error instanceof Error ? error.message : error);
        
        if (attempt <= retryAttempts) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`🔄 [RETRY] Waiting ${delay}ms before retry ${attempt + 1}...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // Open circuit breaker after max retries
          circuitBreaker.failures++;
          circuitBreaker['lastFailureTime'] = Date.now();
          
          if (circuitBreaker.failures >= 3) {
            circuitBreaker['state'] = 'open';
            console.log(`🚨 [CIRCUIT BREAKER] Opened for ${operationId} after ${circuitBreaker.failures} failures`);
          }
          
          throw error;
        }
      }
    }

    throw new Error(`Max retries exceeded for ${operationId}`);
  }

  /**
   * ⏰ EXECUTE WITH TIMEOUT
   */
  private async executeWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Operation timeout (${timeoutMs}ms)`)), timeoutMs)
      )
    ]);
  }

  /**
   * 📊 PERFORMANCE TRACKING
   */
  private recordSuccess(duration: number): void {
    this.metrics.totalRequests++;
    this.metrics.successfulRequests++;
    
    // Update average response time
    this['metrics']['avgResponseTime'] = (
      (this.metrics.avgResponseTime * (this.metrics.totalRequests - 1)) + duration
    ) / this.metrics.totalRequests;
    
    // Track performance history for optimization
    this.performanceHistory.push(duration);
    if (this.performanceHistory.length > 100) {
      this.performanceHistory.shift(); // Keep last 100 measurements
    }
    
    // Adjust optimal batch size based on performance
    this.adjustOptimalBatchSize();
  }

  private recordFailure(): void {
    this.metrics.totalRequests++;
    this.metrics.failedRequests++;
  }

  /**
   * 🎯 ADAPTIVE OPTIMIZATION
   */
  private adjustOptimalBatchSize(): void {
    if (this.performanceHistory.length < 10) return;
    
    const recentAvg = this.performanceHistory.slice(-10).reduce((a, b) => a + b) / 10;
    
    // If performance is good, increase batch size
    if (recentAvg < 3000 && this.metrics.optimalBatchSize < 20) {
      this.metrics.optimalBatchSize++;
      console.log(`📈 [OPTIMIZATION] Increased batch size to ${this.metrics.optimalBatchSize}`);
    }
    
    // If performance is poor, decrease batch size
    if (recentAvg > 8000 && this.metrics.optimalBatchSize > 3) {
      this.metrics.optimalBatchSize--;
      console.log(`📉 [OPTIMIZATION] Decreased batch size to ${this.metrics.optimalBatchSize}`);
    }
  }

  private getOptimalConcurrency(): number {
    const baseConc = this.config.MAX_PARALLEL_COMPANIES || 10;
    const successRate = this.metrics.totalRequests > 0 ? 
      (this.metrics.successfulRequests / this.metrics.totalRequests) : 1;
    
    // Reduce concurrency if success rate is low
    if (successRate < 0.8) {
      return Math.max(Math.floor(baseConc * 0.5), 3);
    }
    
    return baseConc;
  }

  private getOptimalBatchSize(): number {
    return this.metrics.optimalBatchSize;
  }

  private calculateOptimalDelay(batchDuration: number): number {
    // No delay if batch was fast
    if (batchDuration < 2000) return 0;
    
    // Longer delay for slower batches to prevent rate limiting
    if (batchDuration > 10000) return 5000;
    
    // Proportional delay
    return Math.floor(batchDuration * 0.1);
  }

  /**
   * 🔧 UTILITY METHODS
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private getCircuitBreaker(operationId: string): CircuitBreakerState {
    if (!this.circuitBreakers.has(operationId)) {
      this.circuitBreakers.set(operationId, {
        failures: 0,
        lastFailureTime: 0,
        state: 'closed'
      });
    }
    return this.circuitBreakers.get(operationId)!;
  }

  /**
   * 📊 GET PERFORMANCE METRICS
   */
  getMetrics(): ExecutionMetrics & {
    circuitBreakerStatus: { operationId: string; state: string; failures: number }[];
    recommendations: string[];
  } {
    const circuitBreakerStatus = Array.from(this.circuitBreakers.entries()).map(
      ([operationId, breaker]) => ({
        operationId,
        state: breaker.state,
        failures: breaker.failures
      })
    );

    const recommendations: string[] = [];
    
    if (this.metrics.avgResponseTime > 5000) {
      recommendations.push('Consider reducing batch size or increasing timeout');
    }
    
    if ((this.metrics.failedRequests / this.metrics.totalRequests) > 0.1) {
      recommendations.push('High failure rate detected - review API reliability');
    }

    return {
      ...this.metrics,
      circuitBreakerStatus,
      recommendations
    };
  }
}
