/**
 * 🛡️ RATE LIMITER
 * 
 * Implements rate limiting for AI chat endpoints to prevent abuse and DoS attacks
 * Supports different rate limiting strategies and user-based limits
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (userId: string, workspaceId?: string) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  totalHits: number;
  limit: number;
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
  lastRequest: number;
}

export class RateLimiter {
  private static instance: RateLimiter;
  private limits: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  // Default configurations for different endpoint types
  private readonly DEFAULT_CONFIGS = {
    ai_chat: {
      maxRequests: 100, // 100 requests per hour
      windowMs: 60 * 60 * 1000, // 1 hour
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    },
    ai_chat_stream: {
      maxRequests: 100, // 100 requests per hour (same as ai_chat)
      windowMs: 60 * 60 * 1000, // 1 hour
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    },
    ai_response: {
      maxRequests: 200, // 200 requests per hour
      windowMs: 60 * 60 * 1000, // 1 hour
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    },
    browser_action: {
      maxRequests: 50, // 50 requests per hour
      windowMs: 60 * 60 * 1000, // 1 hour
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    },
    general: {
      maxRequests: 1000, // 1000 requests per hour
      windowMs: 60 * 60 * 1000, // 1 hour
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    }
  };

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  constructor() {
    // Start cleanup interval to remove expired entries
    this.startCleanupInterval();
  }

  /**
   * Check if request is allowed based on rate limit
   */
  public checkRateLimit(
    userId: string,
    endpointType: keyof typeof RateLimiter.prototype.DEFAULT_CONFIGS = 'general',
    workspaceId?: string,
    customConfig?: Partial<RateLimitConfig>
  ): RateLimitResult {
    const config = { ...this.DEFAULT_CONFIGS[endpointType], ...customConfig };
    const key = this.generateKey(userId, workspaceId, endpointType);
    const now = Date.now();
    
    // Get or create rate limit entry
    let entry = this.limits.get(key);
    
    if (!entry) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
        firstRequest: now,
        lastRequest: now
      };
      this.limits.set(key, entry);
    }

    // Check if window has expired
    if (now >= entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + config.windowMs;
      entry.firstRequest = now;
    }

    // Update last request time
    entry.lastRequest = now;

    // Check if limit is exceeded
    const isAllowed = entry.count < config.maxRequests;
    
    if (isAllowed) {
      entry.count++;
    }

    const remaining = Math.max(0, config.maxRequests - entry.count);
    const retryAfter = isAllowed ? undefined : Math.ceil((entry.resetTime - now) / 1000);

    return {
      allowed: isAllowed,
      remaining,
      resetTime: entry.resetTime,
      retryAfter,
      totalHits: entry.count,
      limit: config.maxRequests
    };
  }

  /**
   * Record a request (for tracking purposes)
   */
  public recordRequest(
    userId: string,
    endpointType: keyof typeof RateLimiter.prototype.DEFAULT_CONFIGS = 'general',
    workspaceId?: string,
    success: boolean = true
  ): void {
    const config = this.DEFAULT_CONFIGS[endpointType];
    
    // Skip recording if configured to skip successful/failed requests
    if ((success && config.skipSuccessfulRequests) || 
        (!success && config.skipFailedRequests)) {
      return;
    }

    // This is already handled in checkRateLimit, but we can add additional tracking here
    const key = this.generateKey(userId, workspaceId, endpointType);
    const entry = this.limits.get(key);
    
    if (entry) {
      // Additional tracking could be added here (e.g., success/failure rates)
      entry.lastRequest = Date.now();
    }
  }

  /**
   * Get rate limit status for a user
   */
  public getRateLimitStatus(
    userId: string,
    endpointType: keyof typeof RateLimiter.prototype.DEFAULT_CONFIGS = 'general',
    workspaceId?: string
  ): RateLimitResult {
    const config = this.DEFAULT_CONFIGS[endpointType];
    const key = this.generateKey(userId, workspaceId, endpointType);
    const now = Date.now();
    
    const entry = this.limits.get(key);
    
    if (!entry) {
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: now + config.windowMs,
        totalHits: 0,
        limit: config.maxRequests
      };
    }

    // Check if window has expired
    if (now >= entry.resetTime) {
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: now + config.windowMs,
        totalHits: 0,
        limit: config.maxRequests
      };
    }

    const remaining = Math.max(0, config.maxRequests - entry.count);
    const isAllowed = entry.count < config.maxRequests;

    return {
      allowed: isAllowed,
      remaining,
      resetTime: entry.resetTime,
      retryAfter: isAllowed ? undefined : Math.ceil((entry.resetTime - now) / 1000),
      totalHits: entry.count,
      limit: config.maxRequests
    };
  }

  /**
   * Reset rate limit for a specific user
   */
  public resetRateLimit(
    userId: string,
    endpointType: keyof typeof RateLimiter.prototype.DEFAULT_CONFIGS = 'general',
    workspaceId?: string
  ): void {
    const key = this.generateKey(userId, workspaceId, endpointType);
    this.limits.delete(key);
  }

  /**
   * Get all rate limit entries (for monitoring)
   */
  public getAllRateLimits(): Array<{
    key: string;
    userId: string;
    workspaceId?: string;
    endpointType: string;
    entry: RateLimitEntry;
    config: RateLimitConfig;
  }> {
    const results: Array<{
      key: string;
      userId: string;
      workspaceId?: string;
      endpointType: string;
      entry: RateLimitEntry;
      config: RateLimitConfig;
    }> = [];

    for (const [key, entry] of this.limits.entries()) {
      const { userId, workspaceId, endpointType } = this.parseKey(key);
      const config = this.DEFAULT_CONFIGS[endpointType as keyof typeof RateLimiter.prototype.DEFAULT_CONFIGS];
      
      results.push({
        key,
        userId,
        workspaceId,
        endpointType,
        entry,
        config
      });
    }

    return results;
  }

  /**
   * Get rate limit statistics
   */
  public getStatistics(): {
    totalUsers: number;
    totalRequests: number;
    activeUsers: number;
    topUsers: Array<{ userId: string; requestCount: number }>;
    endpointStats: Record<string, { users: number; requests: number }>;
  } {
    const now = Date.now();
    const activeThreshold = 5 * 60 * 1000; // 5 minutes
    
    let totalUsers = 0;
    let totalRequests = 0;
    let activeUsers = 0;
    const userStats: Map<string, number> = new Map();
    const endpointStats: Record<string, { users: number; requests: number }> = {};

    for (const [key, entry] of this.limits.entries()) {
      const { userId, endpointType } = this.parseKey(key);
      
      totalUsers++;
      totalRequests += entry.count;
      
      if (now - entry.lastRequest < activeThreshold) {
        activeUsers++;
      }

      // Track per-user stats
      const currentUserCount = userStats.get(userId) || 0;
      userStats.set(userId, currentUserCount + entry.count);

      // Track per-endpoint stats
      if (!endpointStats[endpointType]) {
        endpointStats[endpointType] = { users: 0, requests: 0 };
      }
      endpointStats[endpointType].users++;
      endpointStats[endpointType].requests += entry.count;
    }

    // Get top users
    const topUsers = Array.from(userStats.entries())
      .map(([userId, requestCount]) => ({ userId, requestCount }))
      .sort((a, b) => b.requestCount - a.requestCount)
      .slice(0, 10);

    return {
      totalUsers,
      totalRequests,
      activeUsers,
      topUsers,
      endpointStats
    };
  }

  /**
   * Generate unique key for rate limiting
   */
  private generateKey(
    userId: string, 
    workspaceId: string | undefined, 
    endpointType: string
  ): string {
    const workspace = workspaceId ? `:${workspaceId}` : '';
    return `${endpointType}:${userId}${workspace}`;
  }

  /**
   * Parse key to extract components
   */
  private parseKey(key: string): {
    userId: string;
    workspaceId?: string;
    endpointType: string;
  } {
    const parts = key.split(':');
    const endpointType = parts[0];
    const userId = parts[1];
    const workspaceId = parts[2];

    return {
      endpointType,
      userId,
      workspaceId
    };
  }

  /**
   * Start cleanup interval to remove expired entries
   */
  private startCleanupInterval(): void {
    // Clean up every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000);
  }

  /**
   * Clean up expired rate limit entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.limits.entries()) {
      if (now >= entry.resetTime) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.limits.delete(key);
    }

    if (expiredKeys.length > 0) {
      console.log(`🧹 [RATE LIMITER] Cleaned up ${expiredKeys.length} expired entries`);
    }
  }

  /**
   * Stop cleanup interval (for testing)
   */
  public stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Clear all rate limits (for testing)
   */
  public clearAllRateLimits(): void {
    this.limits.clear();
  }
}

// Export singleton instance
export const rateLimiter = RateLimiter.getInstance();
