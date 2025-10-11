/**
 * CIRCUIT BREAKER PATTERN
 * 
 * Implements circuit breaker pattern for fault tolerance
 * Prevents cascading failures in distributed systems
 */

// ============================================================================
// TYPES
// ============================================================================

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  timeout: number;
  resetTimeout: number;
}

// ============================================================================
// CIRCUIT BREAKER CLASS
// ============================================================================

export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: CircuitState = 'closed';
  private nextAttempt = 0;

  constructor(
    private config: CircuitBreakerConfig = {
      failureThreshold: 5,
      timeout: 60000, // 1 minute
      resetTimeout: 30000 // 30 seconds
    }
  ) {}

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker is OPEN. Next attempt at ${new Date(this.nextAttempt).toISOString()}`);
      } else {
        this.state = 'half-open';
        console.log('🔄 Circuit breaker: Moving to HALF-OPEN state');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get failure count
   */
  getFailureCount(): number {
    return this.failureCount;
  }

  /**
   * Reset circuit breaker manually
   */
  reset(): void {
    this.failureCount = 0;
    this.state = 'closed';
    this.nextAttempt = 0;
    console.log('🔄 Circuit breaker: Manually reset to CLOSED state');
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
    this.nextAttempt = 0;
    
    if (this.state === 'half-open') {
      console.log('✅ Circuit breaker: Moving to CLOSED state (success)');
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'open';
      this.nextAttempt = Date.now() + this.config.resetTimeout;
      console.warn(`⚠️ Circuit breaker: Moving to OPEN state after ${this.failureCount} failures`);
      console.warn(`   Next attempt: ${new Date(this.nextAttempt).toISOString()}`);
    }
  }
}

// ============================================================================
// CIRCUIT BREAKER MANAGER
// ============================================================================

export class CircuitBreakerManager {
  private breakers = new Map<string, CircuitBreaker>();

  /**
   * Get or create circuit breaker for a service
   */
  getBreaker(serviceName: string, config?: CircuitBreakerConfig): CircuitBreaker {
    if (!this.breakers.has(serviceName)) {
      this.breakers.set(serviceName, new CircuitBreaker(config));
    }
    return this.breakers.get(serviceName)!;
  }

  /**
   * Execute function with service-specific circuit breaker
   */
  async executeWithBreaker<T>(
    serviceName: string, 
    fn: () => Promise<T>,
    config?: CircuitBreakerConfig
  ): Promise<T> {
    const breaker = this.getBreaker(serviceName, config);
    return breaker.execute(fn);
  }

  /**
   * Get status of all circuit breakers
   */
  getStatus(): Record<string, { state: CircuitState; failures: number }> {
    const status: Record<string, { state: CircuitState; failures: number }> = {};
    
    for (const [service, breaker] of this.breakers) {
      status[service] = {
        state: breaker.getState(),
        failures: breaker.getFailureCount()
      };
    }
    
    return status;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default CircuitBreaker;
