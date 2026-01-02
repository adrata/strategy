/**
 * Rate Limiting Middleware
 * 
 * Implements IP-based rate limiting to prevent abuse and enumeration attacks.
 * Uses in-memory storage with automatic cleanup of expired entries.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

// In-memory rate limit store
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter: number;
}

/**
 * Get client IP address from request headers
 */
function getClientIp(request: Request): string {
  // Check various headers that proxies/load balancers use
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP if there are multiple
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback for development
  return 'unknown';
}

/**
 * Check rate limit for a request
 */
export function checkRateLimit(
  request: Request,
  config: RateLimitConfig
): RateLimitResult {
  const clientIp = getClientIp(request);
  const key = `rate-limit:${clientIp}`;
  const now = Date.now();
  
  let entry = rateLimitStore.get(key);
  
  // Create new entry or reset if window expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
      firstRequest: now
    };
    rateLimitStore.set(key, entry);
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime,
      retryAfter: 0
    };
  }
  
  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter
    };
  }
  
  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
    retryAfter: 0
  };
}

/**
 * Default rate limit config for username validation
 * 10 requests per minute per IP
 */
export const USERNAME_VALIDATION_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60 * 1000 // 1 minute
};

<<<<<<< Updated upstream
=======
/**
 * Rate limit config for sign-in attempts
 * 5 attempts per 15 minutes per IP (industry standard for brute force prevention)
 * In development, use a higher limit to prevent frustration
 */
export const SIGN_IN_RATE_LIMIT: RateLimitConfig = {
  maxRequests: process.env.NODE_ENV === 'development' ? 20 : 5,
  windowMs: process.env.NODE_ENV === 'development' ? 5 * 60 * 1000 : 15 * 60 * 1000 // 5 min in dev, 15 min in prod
};

/**
 * Rate limit config for password reset requests
 * 3 requests per hour per IP
 */
export const PASSWORD_RESET_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 3,
  windowMs: 60 * 60 * 1000 // 1 hour
};

/**
 * Clear rate limit for a specific IP address
 * Useful for development or when legitimate users are rate-limited
 */
export function clearRateLimitForIp(ip: string): void {
  const key = `rate-limit:${ip}`;
  rateLimitStore.delete(key);
}

/**
 * Clear all rate limits (use with caution - mainly for development)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Get rate limit status for an IP (for debugging)
 */
export function getRateLimitStatus(ip: string): RateLimitEntry | null {
  const key = `rate-limit:${ip}`;
  return rateLimitStore.get(key) || null;
}

>>>>>>> Stashed changes
