/**
 * ROLE VARIATION CACHE SYSTEM
 * 
 * Caches AI-generated role variations for performance
 * 7-day TTL to balance freshness and performance
 */

import type { RoleVariations } from './generateRoleVariations';
import { normalizeRoleTitle } from './generateRoleVariations';

// ============================================================================
// TYPES
// ============================================================================

interface CacheEntry {
  role: string;
  variations: RoleVariations;
  generatedAt: Date;
  expiresAt: Date;
  hits: number;
}

// ============================================================================
// CACHE CLASS
// ============================================================================

export class RoleVariationCache {
  private cache: Map<string, CacheEntry>;
  private ttl: number;
  private maxSize: number;
  
  constructor(ttlDays: number = 7, maxSize: number = 1000) {
    this.cache = new Map();
    this.ttl = ttlDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds
    this.maxSize = maxSize;
  }
  
  /**
   * Store role variations in cache
   */
  set(role: string, variations: RoleVariations): void {
    const key = this.getCacheKey(role);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.ttl);
    
    // Enforce max size
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLeastRecentlyUsed();
    }
    
    this.cache.set(key, {
      role,
      variations,
      generatedAt: now,
      expiresAt,
      hits: 0
    });
    
    console.log(`   💾 Cached variations for "${role}" (expires: ${expiresAt.toISOString()})`);
  }
  
  /**
   * Retrieve role variations from cache
   */
  get(role: string): RoleVariations | null {
    const key = this.getCacheKey(role);
    const entry = this.cache.get(key);
    
    if (!entry) {
      console.log(`   ⚠️ Cache miss for "${role}"`);
      return null;
    }
    
    // Check if expired
    if (new Date() > entry.expiresAt) {
      console.log(`   ⏰ Cache expired for "${role}"`);
      this.cache.delete(key);
      return null;
    }
    
    // Update hit count
    entry.hits++;
    
    console.log(`   ✅ Cache hit for "${role}" (hits: ${entry.hits})`);
    return entry.variations;
  }
  
  /**
   * Check if role is in cache
   */
  has(role: string): boolean {
    const key = this.getCacheKey(role);
    const entry = this.cache.get(key);
    
    if (!entry) return false;
    if (new Date() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Clear entire cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`   🗑️ Cleared cache (${size} entries removed)`);
  }
  
  /**
   * Remove expired entries
   */
  prune(): void {
    const now = new Date();
    let removed = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    if (removed > 0) {
      console.log(`   🧹 Pruned ${removed} expired entries`);
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    ttlDays: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
    totalHits: number;
    mostPopular: string | null;
  } {
    let oldestEntry: Date | null = null;
    let newestEntry: Date | null = null;
    let totalHits = 0;
    let mostPopular: string | null = null;
    let maxHits = 0;
    
    for (const entry of this.cache.values()) {
      // Track oldest/newest
      if (!oldestEntry || entry.generatedAt < oldestEntry) {
        oldestEntry = entry.generatedAt;
      }
      if (!newestEntry || entry.generatedAt > newestEntry) {
        newestEntry = entry.generatedAt;
      }
      
      // Track hits
      totalHits += entry.hits;
      if (entry.hits > maxHits) {
        maxHits = entry.hits;
        mostPopular = entry.role;
      }
    }
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttlDays: this.ttl / (24 * 60 * 60 * 1000),
      oldestEntry,
      newestEntry,
      totalHits,
      mostPopular
    };
  }
  
  /**
   * Get cache key from role (normalized)
   */
  private getCacheKey(role: string): string {
    return normalizeRoleTitle(role);
  }
  
  /**
   * Evict least recently used entry
   */
  private evictLeastRecentlyUsed(): void {
    let lruKey: string | null = null;
    let minHits = Infinity;
    let oldestDate: Date | null = null;
    
    for (const [key, entry] of this.cache.entries()) {
      // Prefer entries with fewest hits
      // If tied, prefer oldest entries
      if (entry.hits < minHits || (entry.hits === minHits && (!oldestDate || entry.generatedAt < oldestDate))) {
        lruKey = key;
        minHits = entry.hits;
        oldestDate = entry.generatedAt;
      }
    }
    
    if (lruKey) {
      const evicted = this.cache.get(lruKey);
      this.cache.delete(lruKey);
      console.log(`   🗑️ Evicted LRU entry: "${evicted?.role}" (hits: ${evicted?.hits})`);
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Global cache instance
 * 7-day TTL, max 1000 entries
 */
export const roleVariationCache = new RoleVariationCache(7, 1000);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get role variations from cache or generate
 */
export async function getCachedOrGenerate(
  role: string,
  generateFn: () => Promise<RoleVariations>
): Promise<RoleVariations> {
  // Try cache first
  const cached = roleVariationCache.get(role);
  if (cached) {
    return cached;
  }
  
  // Generate new variations
  const variations = await generateFn();
  
  // Cache for future use
  roleVariationCache.set(role, variations);
  
  return variations;
}

/**
 * Warm up cache with common roles
 */
export async function warmupCache(
  commonRoles: string[],
  generateFn: (role: string) => Promise<RoleVariations>
): Promise<void> {
  console.log(`🔥 [CACHE WARMUP] Warming up cache with ${commonRoles.length} common roles...`);
  
  for (const role of commonRoles) {
    if (!roleVariationCache.has(role)) {
      try {
        const variations = await generateFn(role);
        roleVariationCache.set(role, variations);
        console.log(`   ✅ Warmed up: ${role}`);
      } catch (error) {
        console.error(`   ❌ Failed to warm up ${role}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }
  
  console.log(`   🎉 Cache warmup complete!`);
}

/**
 * Schedule automatic pruning
 */
export function scheduleAutoPrune(intervalHours: number = 24): NodeJS.Timeout {
  const intervalMs = intervalHours * 60 * 60 * 1000;
  
  return setInterval(() => {
    console.log(`🧹 [AUTO-PRUNE] Running scheduled cache pruning...`);
    roleVariationCache.prune();
  }, intervalMs);
}

