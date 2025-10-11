/**
 * RATE LIMITING UTILITY
 * 
 * Provides rate limiting functionality for API endpoints
 */

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Timestamp when the window resets
  retryAfter?: number; // Seconds to wait before retrying
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  private getKey(identifier: string): string {
    return identifier;
  }

  private cleanup(identifier: string): void {
    const key = this.getKey(identifier);
    const requests = this.requests.get(key) || [];
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Remove requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length === 0) {
      this.requests.delete(key);
    } else {
      this.requests.set(key, validRequests);
    }
  }

  check(identifier: string): RateLimitInfo {
    const key = this.getKey(identifier);
    this.cleanup(identifier);
    
    const requests = this.requests.get(key) || [];
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    const remaining = Math.max(0, this.config.maxRequests - validRequests.length);
    const reset = now + this.config.windowMs;
    
    return {
      limit: this.config.maxRequests,
      remaining,
      reset,
      retryAfter: remaining === 0 ? Math.ceil(this.config.windowMs / 1000) : undefined
    };
  }

  consume(identifier: string): RateLimitInfo {
    const key = this.getKey(identifier);
    const now = Date.now();
    
    const requests = this.requests.get(key) || [];
    requests.push(now);
    this.requests.set(key, requests);
    
    return this.check(identifier);
  }

  isAllowed(identifier: string): boolean {
    const info = this.check(identifier);
    return info.remaining > 0;
  }

  reset(identifier: string): void {
    const key = this.getKey(identifier);
    this.requests.delete(key);
  }

  // Clean up old entries periodically
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
}

// Pre-configured rate limiters
export const createRateLimiter = (config: RateLimitConfig): RateLimiter => {
  return new RateLimiter(config);
};

// Common rate limiting configurations
export const RATE_LIMIT_CONFIGS = {
  // Strict rate limiting for sensitive endpoints
  STRICT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests, please try again later'
  },
  
  // Standard rate limiting for most endpoints
  STANDARD: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    message: 'Rate limit exceeded, please try again later'
  },
  
  // Lenient rate limiting for public endpoints
  LENIENT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5000,
    message: 'Rate limit exceeded, please try again later'
  },
  
  // API-specific rate limiting
  API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    message: 'API rate limit exceeded, please try again later'
  }
} as const;

// Global rate limiter instance
export const globalRateLimiter = createRateLimiter(RATE_LIMIT_CONFIGS.STANDARD);

// Rate limiting middleware for Next.js API routes
export function withRateLimit(
  rateLimiter: RateLimiter,
  getIdentifier: (request: Request) => string = (req) => {
    // Default: use IP address or user ID
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown';
    return ip;
  }
) {
  return function rateLimitMiddleware(handler: Function) {
    return async function rateLimitedHandler(request: Request, ...args: any[]) {
      const identifier = getIdentifier(request);
      const rateLimitInfo = rateLimiter.consume(identifier);
      
      if (!rateLimitInfo.remaining) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: rateLimiter['config'].message || 'Rate limit exceeded',
              retryAfter: rateLimitInfo.retryAfter
            }
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
              'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
              'X-RateLimit-Reset': rateLimitInfo.reset.toString(),
              'Retry-After': rateLimitInfo.retryAfter?.toString() || '0'
            }
          }
        );
      }
      
      // Add rate limit headers to response
      const response = await handler(request, ...args);
      
      if (response instanceof Response) {
        response.headers.set('X-RateLimit-Limit', rateLimitInfo.limit.toString());
        response.headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString());
        response.headers.set('X-RateLimit-Reset', rateLimitInfo.reset.toString());
      }
      
      return response;
    };
  };
}
