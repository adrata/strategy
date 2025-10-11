/**
 * DISTRIBUTED TRACING SERVICE
 * 
 * Simple distributed tracing for observability
 * In production, replace with OpenTelemetry
 */

import crypto from 'crypto';

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'success' | 'error';
  attributes: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
  };
}

class TracingService {
  private spans: Map<string, Span> = new Map();
  private currentSpan?: Span;

  /**
   * Start a new trace
   */
  startTrace(name: string, attributes?: Record<string, any>): Span {
    const traceId = this.generateId();
    const spanId = this.generateId();

    const span: Span = {
      traceId,
      spanId,
      name,
      startTime: Date.now(),
      status: 'pending',
      attributes: attributes || {}
    };

    this.spans.set(spanId, span);
    this.currentSpan = span;

    console.log(`🔍 [TRACE] Started trace: ${name} (${traceId})`);

    return span;
  }

  /**
   * Start a child span
   */
  startSpan(name: string, attributes?: Record<string, any>): Span {
    const parentSpan = this.currentSpan;
    
    if (!parentSpan) {
      return this.startTrace(name, attributes);
    }

    const spanId = this.generateId();

    const span: Span = {
      traceId: parentSpan.traceId,
      spanId,
      parentSpanId: parentSpan.spanId,
      name,
      startTime: Date.now(),
      status: 'pending',
      attributes: attributes || {}
    };

    this.spans.set(spanId, span);
    this.currentSpan = span;

    console.log(`🔍 [TRACE] Started span: ${name} (parent: ${parentSpan.name})`);

    return span;
  }

  /**
   * End current span
   */
  endSpan(status: 'success' | 'error' = 'success', error?: Error): void {
    if (!this.currentSpan) {
      console.warn('⚠️ [TRACE] No active span to end');
      return;
    }

    const span = this.currentSpan;
    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;

    if (error) {
      span.error = {
        message: error.message,
        stack: error.stack
      };
    }

    console.log(`🔍 [TRACE] Ended span: ${span.name} (${span.duration}ms, ${status})`);

    // Move back to parent span
    if (span.parentSpanId) {
      this.currentSpan = this.spans.get(span.parentSpanId);
    } else {
      this.currentSpan = undefined;
    }
  }

  /**
   * Add attributes to current span
   */
  addAttribute(key: string, value: any): void {
    if (this.currentSpan) {
      this.currentSpan.attributes[key] = value;
    }
  }

  /**
   * Add event to current span
   */
  addEvent(name: string, attributes?: Record<string, any>): void {
    if (this.currentSpan) {
      const events = this.currentSpan.attributes.events || [];
      events.push({
        name,
        timestamp: Date.now(),
        attributes
      });
      this.currentSpan.attributes.events = events;
    }
  }

  /**
   * Trace a function execution
   */
  async trace<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    attributes?: Record<string, any>
  ): Promise<T> {
    const span = this.startSpan(name, attributes);

    try {
      const result = await fn(span);
      this.endSpan('success');
      return result;
    } catch (error) {
      this.endSpan('error', error as Error);
      throw error;
    }
  }

  /**
   * Get trace by ID
   */
  getTrace(traceId: string): Span[] {
    return Array.from(this.spans.values()).filter(span => span.traceId === traceId);
  }

  /**
   * Get current span
   */
  getCurrentSpan(): Span | undefined {
    return this.currentSpan;
  }

  /**
   * Get trace ID from current span
   */
  getTraceId(): string | undefined {
    return this.currentSpan?.traceId;
  }

  /**
   * Clear all spans
   */
  clear(): void {
    this.spans.clear();
    this.currentSpan = undefined;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return crypto.randomBytes(16).toString('hex');
  }
}

// Export singleton instance
export const tracing = new TracingService();

// Helper function to wrap async function with tracing
export function traced<T extends (...args: any[]) => Promise<any>>(
  name: string,
  fn: T
): T {
  return (async (...args: any[]) => {
    return await tracing.trace(name, async () => {
      return await fn(...args);
    });
  }) as T;
}

export default tracing;

