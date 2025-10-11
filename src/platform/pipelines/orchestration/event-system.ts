/**
 * EVENT SYSTEM
 * 
 * Event-driven architecture for pipeline orchestration
 * Provides real-time progress tracking and monitoring
 */

// ============================================================================
// TYPES
// ============================================================================

export type OrchestratorEvent = 
  | { type: 'stepStart'; step: string; timestamp: number; input?: any }
  | { type: 'stepComplete'; step: string; duration: number; result: any; timestamp: number }
  | { type: 'stepFailed'; step: string; error: Error; timestamp: number }
  | { type: 'progress'; completed: number; total: number; eta: number; timestamp: number }
  | { type: 'costUpdate'; api: string; cost: number; timestamp: number }
  | { type: 'pipelineStart'; companies: string[]; timestamp: number }
  | { type: 'pipelineComplete'; results: any; executionTime: number; timestamp: number }
  | { type: 'pipelineFailed'; error: Error; timestamp: number };

export type EventHandler<T = any> = (event: T) => void | Promise<void>;

// ============================================================================
// EVENT EMITTER
// ============================================================================

export class EventEmitter {
  private handlers = new Map<string, EventHandler[]>();

  /**
   * Subscribe to an event type
   */
  on<T extends OrchestratorEvent>(eventType: T['type'], handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  /**
   * Unsubscribe from an event type
   */
  off<T extends OrchestratorEvent>(eventType: T['type'], handler: EventHandler<T>): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event
   */
  async emit<T extends OrchestratorEvent>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    
    // Execute all handlers in parallel
    await Promise.all(
      handlers.map(async (handler) => {
        try {
          await handler(event);
        } catch (error) {
          console.error(`Event handler error for ${event.type}:`, error);
        }
      })
    );
  }

  /**
   * Remove all handlers
   */
  removeAllListeners(eventType?: string): void {
    if (eventType) {
      this.handlers.delete(eventType);
    } else {
      this.handlers.clear();
    }
  }

  /**
   * Get handler count for an event type
   */
  listenerCount(eventType: string): number {
    return this.handlers.get(eventType)?.length || 0;
  }
}

// ============================================================================
// PROGRESS TRACKER
// ============================================================================

export class ProgressTracker {
  private completed = 0;
  private total = 0;
  private startTime = 0;
  private stepTimes: number[] = [];

  constructor(private eventEmitter: EventEmitter) {}

  /**
   * Initialize progress tracking
   */
  initialize(total: number): void {
    this.total = total;
    this.completed = 0;
    this.startTime = Date.now();
    this.stepTimes = [];
  }

  /**
   * Mark a step as completed
   */
  completeStep(stepName: string, duration: number): void {
    this.completed++;
    this.stepTimes.push(duration);
    
    const eta = this.calculateETA();
    
    this.eventEmitter.emit({
      type: 'progress',
      completed: this.completed,
      total: this.total,
      eta,
      timestamp: Date.now()
    });
  }

  /**
   * Get current progress percentage
   */
  getProgress(): number {
    return this.total > 0 ? (this.completed / this.total) * 100 : 0;
  }

  /**
   * Get estimated time remaining
   */
  getETA(): number {
    return this.calculateETA();
  }

  private calculateETA(): number {
    if (this.completed === 0 || this.stepTimes.length === 0) {
      return 0;
    }

    const avgStepTime = this.stepTimes.reduce((sum, time) => sum + time, 0) / this.stepTimes.length;
    const remainingSteps = this.total - this.completed;
    
    return remainingSteps * avgStepTime;
  }
}

// ============================================================================
// COST TRACKER
// ============================================================================

export class CostTracker {
  private costs = new Map<string, number>();
  private eventEmitter: EventEmitter;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  /**
   * Track cost for an API service
   */
  trackCost(api: string, cost: number): void {
    const currentCost = this.costs.get(api) || 0;
    const newCost = currentCost + cost;
    
    this.costs.set(api, newCost);
    
    this.eventEmitter.emit({
      type: 'costUpdate',
      api,
      cost: newCost,
      timestamp: Date.now()
    });
  }

  /**
   * Get total cost for an API service
   */
  getCost(api: string): number {
    return this.costs.get(api) || 0;
  }

  /**
   * Get all costs
   */
  getAllCosts(): Record<string, number> {
    return Object.fromEntries(this.costs);
  }

  /**
   * Get total cost across all APIs
   */
  getTotalCost(): number {
    return Array.from(this.costs.values()).reduce((sum, cost) => sum + cost, 0);
  }

  /**
   * Reset all costs
   */
  reset(): void {
    this.costs.clear();
  }
}

// ============================================================================
// EVENT LOGGER
// ============================================================================

export class EventLogger {
  private events: OrchestratorEvent[] = [];
  private maxEvents = 1000;

  constructor(private eventEmitter: EventEmitter) {
    this.setupLogging();
  }

  private setupLogging(): void {
    // Log all events
    this.eventEmitter.on('stepStart', (event) => {
      this.logEvent(event);
      console.log(`⏳ [${event.step}] Starting...`);
    });

    this.eventEmitter.on('stepComplete', (event) => {
      this.logEvent(event);
      console.log(`✅ [${event.step}] Complete (${event.duration}ms)`);
    });

    this.eventEmitter.on('stepFailed', (event) => {
      this.logEvent(event);
      console.log(`❌ [${event.step}] Failed: ${event.error.message}`);
    });

    this.eventEmitter.on('progress', (event) => {
      this.logEvent(event);
      const progress = ((event.completed / event.total) * 100).toFixed(1);
      const eta = event.eta > 0 ? ` (ETA: ${Math.round(event.eta / 1000)}s)` : '';
      console.log(`📊 Progress: ${progress}% (${event.completed}/${event.total})${eta}`);
    });

    this.eventEmitter.on('costUpdate', (event) => {
      this.logEvent(event);
      console.log(`💰 [${event.api}] Cost: $${event.cost.toFixed(2)}`);
    });
  }

  private logEvent(event: OrchestratorEvent): void {
    this.events.push(event);
    
    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  /**
   * Get all logged events
   */
  getEvents(): OrchestratorEvent[] {
    return [...this.events];
  }

  /**
   * Get events by type
   */
  getEventsByType<T extends OrchestratorEvent>(type: T['type']): T[] {
    return this.events.filter(event => event.type === type) as T[];
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  EventEmitter,
  ProgressTracker,
  CostTracker,
  EventLogger
};
