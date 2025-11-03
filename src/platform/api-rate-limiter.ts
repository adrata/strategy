/**
 * API Rate Limiter
 * Supports both in-memory (Vercel serverless) and Redis (if available)
 * Uses sliding window algorithm for accurate rate limiting
 */

import { ipMatches } from './utils/ip-matcher';

interface RateLimitConfig {
  perHour?: number;
  perDay?: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp
  retryAfter?: number; // Seconds until retry
}

// In-memory store for Vercel serverless functions
// Note: This resets on each function invocation, so we'll use a simple approach
// For production, Redis is recommended via @vercel/kv or Upstash
class InMemoryRateLimiter {
  private store: Map<string, { count: number; resetAt: number; window: 'hour' | 'day' }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.store.entries()) {
        if (value.resetAt < now) {
          this.store.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  async checkLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;
    const dayMs = 24 * 60 * 60 * 1000;

    // Check hourly limit
    const hourKey = `${key}:hour`;
    const hourLimit = config.perHour || 1000;
    const hourResetAt = now + hourMs;

    const hourEntry = this.store.get(hourKey);
    if (!hourEntry || hourEntry.resetAt < now) {
      this.store.set(hourKey, {
        count: 1,
        resetAt: hourResetAt,
        window: 'hour'
      });
      return {
        allowed: true,
        remaining: hourLimit - 1,
        resetAt: hourResetAt
      };
    }

    if (hourEntry.count >= hourLimit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: hourEntry.resetAt,
        retryAfter: Math.ceil((hourEntry.resetAt - now) / 1000)
      };
    }

    hourEntry.count++;
    this.store.set(hourKey, hourEntry);

    // Check daily limit
    const dayKey = `${key}:day`;
    const dayLimit = config.perDay || 10000;
    const dayResetAt = now + dayMs;

    const dayEntry = this.store.get(dayKey);
    if (!dayEntry || dayEntry.resetAt < now) {
      this.store.set(dayKey, {
        count: 1,
        resetAt: dayResetAt,
        window: 'day'
      });
    } else {
      if (dayEntry.count >= dayLimit) {
        // Reset hour entry but deny due to daily limit
        return {
          allowed: false,
          remaining: 0,
          resetAt: dayEntry.resetAt,
          retryAfter: Math.ceil((dayEntry.resetAt - now) / 1000)
        };
      }
      dayEntry.count++;
      this.store.set(dayKey, dayEntry);
    }

    return {
      allowed: true,
      remaining: Math.min(hourLimit - hourEntry.count, dayLimit - (dayEntry?.count || 1)),
      resetAt: Math.min(hourResetAt, dayResetAt)
    };
  }

  async reset(key: string): Promise<void> {
    this.store.delete(`${key}:hour`);
    this.store.delete(`${key}:day`);
  }

  cleanup(): void {
    clearInterval(this.cleanupInterval);
  }
}

// Redis-based rate limiter (if Redis is available)
class RedisRateLimiter {
  private kv: any;

  constructor() {
    try {
      // Try to use Vercel KV (Upstash Redis)
      this.kv = require('@vercel/kv').kv;
    } catch (e) {
      // Redis not available, fallback to in-memory
      this.kv = null;
    }
  }

  async checkLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    if (!this.kv) {
      throw new Error('Redis not available');
    }

    const now = Date.now();
    const hourMs = 60 * 60 * 1000;
    const hourLimit = config.perHour || 1000;
    const hourKey = `${key}:hour`;
    const hourResetAt = now + hourMs;

    // Get current count
    const hourCount = await this.kv.get(hourKey) || 0;
    if (hourCount >= hourLimit) {
      const ttl = await this.kv.ttl(hourKey);
      return {
        allowed: false,
        remaining: 0,
        resetAt: now + (ttl * 1000),
        retryAfter: ttl
      };
    }

    // Increment
    await this.kv.incr(hourKey);
    await this.kv.expire(hourKey, Math.ceil(hourMs / 1000));

    // Check daily limit
    const dayLimit = config.perDay || 10000;
    const dayKey = `${key}:day`;
    const dayResetAt = now + (24 * 60 * 60 * 1000);

    const dayCount = await this.kv.get(dayKey) || 0;
    if (dayCount >= dayLimit) {
      const ttl = await this.kv.ttl(dayKey);
      return {
        allowed: false,
        remaining: 0,
        resetAt: now + (ttl * 1000),
        retryAfter: ttl
      };
    }

    await this.kv.incr(dayKey);
    await this.kv.expire(dayKey, 86400); // 24 hours

    return {
      allowed: true,
      remaining: Math.min(hourLimit - hourCount - 1, dayLimit - dayCount - 1),
      resetAt: Math.min(hourResetAt, dayResetAt)
    };
  }

  async reset(key: string): Promise<void> {
    if (!this.kv) return;
    await this.kv.del(`${key}:hour`);
    await this.kv.del(`${key}:day`);
  }
}

// Singleton rate limiter instance
let rateLimiter: InMemoryRateLimiter | RedisRateLimiter;

function getRateLimiter(): InMemoryRateLimiter | RedisRateLimiter {
  if (!rateLimiter) {
    // Try Redis first, fallback to in-memory
    try {
      rateLimiter = new RedisRateLimiter();
      // Test if Redis works
      if ((rateLimiter as RedisRateLimiter).kv === null) {
        rateLimiter = new InMemoryRateLimiter();
      }
    } catch (e) {
      rateLimiter = new InMemoryRateLimiter();
    }
  }
  return rateLimiter;
}

/**
 * Check rate limit for an API key
 */
export async function checkRateLimit(
  apiKeyId: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const limiter = getRateLimiter();
  return await limiter.checkLimit(apiKeyId, config);
}

/**
 * Reset rate limit for an API key
 */
export async function resetRateLimit(apiKeyId: string): Promise<void> {
  const limiter = getRateLimiter();
  await limiter.reset(apiKeyId);
}

/**
 * Extract client IP from request
 */
export function getClientIp(request: Request): string {
  // Vercel provides IP in headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback
  return 'unknown';
}

/**
 * Check if IP matches allowed/denied lists
 */
export function checkIpAccess(
  ip: string,
  allowedIps: string[],
  deniedIps: string[]
): { allowed: boolean; reason?: string } {
  // Check deny list first
  for (const deniedIp of deniedIps) {
    if (ipMatches(ip, deniedIp)) {
      return { allowed: false, reason: 'IP address is blocked' };
    }
  }

  // If allow list exists and is not empty, check it
  if (allowedIps.length > 0) {
    const isAllowed = allowedIps.some(allowedIp => ipMatches(ip, allowedIp));
    if (!isAllowed) {
      return { allowed: false, reason: 'IP address not in allowed list' };
    }
  }

  return { allowed: true };
}

/**
 * Check if scope is allowed
 */
export function checkScope(
  requiredScope: string,
  allowedScopes: string[]
): boolean {
  if (allowedScopes.length === 0) {
    // No scopes means full access (legacy)
    return true;
  }

  // Exact match
  if (allowedScopes.includes(requiredScope)) {
    return true;
  }

  // Wildcard support (e.g., "buyer-groups:*" matches "buyer-groups:read")
  const scopeParts = requiredScope.split(':');
  if (scopeParts.length === 2) {
    const wildcardScope = `${scopeParts[0]}:*`;
    if (allowedScopes.includes(wildcardScope)) {
      return true;
    }
  }

  return false;
}

