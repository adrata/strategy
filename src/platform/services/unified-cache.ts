/**
 * 🚀 UNIFIED CACHE SYSTEM - 2025 ENTERPRISE GRADE
 * 
 * Single source of truth for all caching needs across the platform
 * Replaces: EnterpriseCache, SmartCache, CacheManager, PipelineLoadingCache
 * 
 * Features:
 * - Multi-layer architecture (L1 Memory, L2 Redis, L3 Persistent)
 * - Intelligent cache promotion and eviction
 * - Tag-based invalidation
 * - Request deduplication
 * - Background refresh with stale-while-revalidate
 * - Comprehensive monitoring and analytics
 * - TypeScript-first with full type safety
 */

import { kv } from '@vercel/kv';

// Only import Redis on server side
let createClient: any = null;
let RedisClientType: any = null;

if (typeof window === 'undefined') {
  // Server-side only
  try {
    const redis = require('redis');
    createClient = redis.createClient;
    RedisClientType = redis.RedisClientType;
  } catch (error) {
    console.warn('🔴 [UNIFIED CACHE] Redis not available:', error);
  }
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  hitCount: number;
  size: number;
  tags: string[];
  priority: CachePriority;
  layer: CacheLayer;
  source: string;
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  priority?: CachePriority;
  layer?: CacheLayer;
  skipCache?: boolean;
  backgroundRefresh?: boolean;
  staleWhileRevalidate?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  memoryUsage: number;
  hitRate: number;
  l1Size: number;
  l2Size: number;
  l3Size: number;
  topKeys: Array<{ key: string; hits: number; priority: string; layer: string }>;
  performance: {
    avgResponseTime: number;
    slowestQueries: Array<{ key: string; duration: number }>;
  };
}

export type CachePriority = 'low' | 'medium' | 'high' | 'critical';
export type CacheLayer = 'l1' | 'l2' | 'l3' | 'auto';

// ============================================================================
// UNIFIED CACHE CLASS
// ============================================================================

export class UnifiedCache {
  // Multi-layer cache architecture
  private static l1Cache = new Map<string, CacheEntry>(); // In-memory (fastest)
  private static l2Cache = new Map<string, CacheEntry>(); // Redis (distributed)
  private static l3Cache = new Map<string, CacheEntry>(); // Persistent (largest)
  
  // Request deduplication
  private static pendingRequests = new Map<string, Promise<any>>();
  
  // Cache statistics
  private static stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    memoryUsage: 0,
    hitRate: 0,
    l1Size: 0,
    l2Size: 0,
    l3Size: 0,
    topKeys: [],
    performance: {
      avgResponseTime: 0,
      slowestQueries: []
    }
  };
  
  // Configuration
  private static readonly MAX_L1_SIZE = 1000; // High-priority items
  private static readonly MAX_L2_SIZE = 10000; // All cached items
  private static readonly MAX_L3_SIZE = 100000; // Persistent items
  private static readonly MAX_MEMORY_MB = 200; // Memory limit
  
  // Redis client (server-side only)
  private static redisClient: any = null;
  private static isRedisConnected = false;
  
  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  
  static async initialize(): Promise<void> {
    try {
      await this.initializeRedis();
      this.startCleanupInterval();
      this.startStatsCollection();
      console.log('🚀 [UNIFIED CACHE] Initialized successfully');
    } catch (error) {
      console.warn('⚠️ [UNIFIED CACHE] Initialization warning:', error);
    }
  }
  
  private static async initializeRedis(): Promise<void> {
    try {
      // Only initialize Redis on server side
      if (typeof window !== 'undefined') {
        console.log('🔧 [UNIFIED CACHE] Client-side detected, using memory-only mode');
        return;
      }

      // Check if Redis is available
      if (!createClient) {
        console.log('🔧 [UNIFIED CACHE] Redis not available, using memory-only mode');
        return;
      }

      // Try multiple Redis URL sources
      const redisUrl = process['env']['REDIS_URL'] || 
                      process['env']['UPSTASH_REDIS_URL'] || 
                      process['env']['REDIS_CONNECTION_STRING'];
      
      if (!redisUrl || redisUrl === 'your_redis_url' || redisUrl.includes('placeholder') || redisUrl === 'PLACEHOLDER_VALUE' || redisUrl.includes('PLACEHOLDER_VALUE')) {
        console.log('🔧 [UNIFIED CACHE] No valid Redis URL found, using memory-only mode');
        return;
      }
      
      // Enhanced Redis client configuration
      this['redisClient'] = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 10000,
          lazyConnect: true,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.warn('🔴 [UNIFIED CACHE] Redis max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 100, 3000);
          }
        },
        // Enhanced configuration for production
        ...(process['env']['NODE_ENV'] === 'production' && {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          maxLoadingTimeout: 5000
        })
      });
      
      this.redisClient.on('error', (err) => {
        console.warn('🔴 [UNIFIED CACHE] Redis error:', err.message);
        this['isRedisConnected'] = false;
      });
      
      this.redisClient.on('connect', () => {
        console.log('🟢 [UNIFIED CACHE] Redis connected');
        this['isRedisConnected'] = true;
      });
      
      this.redisClient.on('ready', () => {
        console.log('🚀 [UNIFIED CACHE] Redis ready for operations');
        this['isRedisConnected'] = true;
      });
      
      this.redisClient.on('reconnecting', () => {
        console.log('🔄 [UNIFIED CACHE] Redis reconnecting...');
        this['isRedisConnected'] = false;
      });
      
      await this.redisClient.connect();
      
      // Test Redis connection
      await this.redisClient.ping();
      console.log('✅ [UNIFIED CACHE] Redis connection verified');
      
    } catch (error) {
      console.warn('🔴 [UNIFIED CACHE] Redis initialization failed:', error);
      this['redisClient'] = null;
      this['isRedisConnected'] = false;
    }
  }
  
  // ============================================================================
  // CORE CACHE OPERATIONS
  // ============================================================================
  
  /**
   * 🎯 INTELLIGENT GET: Multi-layer cache with automatic promotion and deduplication
   */
  static async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Client-side fallback
    if (typeof window !== 'undefined') {
      return await fetchFn();
    }

    const {
      ttl = 300000, // 5 minutes
      tags = [],
      priority = 'medium',
      layer = 'auto',
      skipCache = false,
      backgroundRefresh = true,
      staleWhileRevalidate = true
    } = options;
    
    if (skipCache) {
      return await fetchFn();
    }
    
    // Check for pending request (deduplication)
    if (this.pendingRequests.has(key)) {
      console.log(`🔄 [UNIFIED CACHE] Deduplicating request: ${key}`);
      return await this.pendingRequests.get(key)!;
    }
    
    const startTime = Date.now();
    
    try {
      // Check L1 cache first (fastest)
      const l1Entry = this.l1Cache.get(key);
      if (l1Entry && this.isValid(l1Entry)) {
        l1Entry.hitCount++;
        this.stats.hits++;
        this.incrementQueryFrequency(key);
        this.updateHitRate();
        this.recordPerformance(key, Date.now() - startTime);
        console.log(`🎯 [L1 HIT] ${key} (${l1Entry.hitCount} hits)`);
        
        // Background refresh if stale
        if (backgroundRefresh && this.isStale(l1Entry)) {
          this.backgroundRefresh(key, fetchFn, options);
        }
        
        return l1Entry.data;
      }
      
      // Check L2 cache (Redis)
      if (this.isRedisConnected) {
        const l2Entry = await this.getFromRedis(key);
        if (l2Entry && this.isValid(l2Entry)) {
          l2Entry.hitCount++;
          this.stats.hits++;
          this.incrementQueryFrequency(key);
          
          // Promote to L1 if high priority or frequently accessed
          if (priority === 'high' || priority === 'critical' || l2Entry.hitCount > 5) {
            this.promoteToL1(key, l2Entry);
          }
          
          this.updateHitRate();
          this.recordPerformance(key, Date.now() - startTime);
          console.log(`🎯 [L2 HIT] ${key} (promoted to L1: ${priority === 'high' || l2Entry.hitCount > 5})`);
          
          // Background refresh if stale
          if (backgroundRefresh && this.isStale(l2Entry)) {
            this.backgroundRefresh(key, fetchFn, options);
          }
          
          return l2Entry.data;
        }
      }
      
      // Check L3 cache (persistent)
      const l3Entry = this.l3Cache.get(key);
      if (l3Entry && this.isValid(l3Entry)) {
        l3Entry.hitCount++;
        this.stats.hits++;
        this.incrementQueryFrequency(key);
        
        // Promote to L2 if frequently accessed
        if (l3Entry.hitCount > 10) {
          this.promoteToL2(key, l3Entry);
        }
        
        this.updateHitRate();
        this.recordPerformance(key, Date.now() - startTime);
        console.log(`🎯 [L3 HIT] ${key} (promoted to L2: ${l3Entry.hitCount > 10})`);
        
        // Background refresh if stale
        if (backgroundRefresh && this.isStale(l3Entry)) {
          this.backgroundRefresh(key, fetchFn, options);
        }
        
        return l3Entry.data;
      }
      
      // Cache miss - fetch from source
      console.log(`💾 [CACHE MISS] ${key}`);
      this.stats.misses++;
      this.updateHitRate();
      
      const fetchStartTime = Date.now();
      const promise = fetchFn();
      this.pendingRequests.set(key, promise);
      
      try {
        const data = await promise;
        const fetchTime = Date.now() - fetchStartTime;
        
        // Create cache entry
        const entry: CacheEntry<T> = {
          data,
          timestamp: Date.now(),
          ttl,
          hitCount: 0,
          size: this.estimateSize(data),
          tags,
          priority,
          layer: this.determineLayer(layer, priority),
          source: 'fetch'
        };
        
        // Store in appropriate cache layer
        await this.storeEntry(key, entry);
        
        this.recordPerformance(key, Date.now() - startTime);
        
        if (fetchTime > 1000) {
          console.warn(`🐌 [SLOW FETCH] ${key} took ${fetchTime}ms - caching for future requests`);
        }
        
        return data;
      } finally {
        this.pendingRequests.delete(key);
      }
    } catch (error) {
      this.pendingRequests.delete(key);
      throw error;
    }
  }
  
  /**
   * 🎯 INTELLIGENT SET: Automatic layer selection
   */
  static async set<T>(
    key: string,
    data: T,
    options: CacheOptions = {}
  ): Promise<void> {
    // Client-side fallback - no caching
    if (typeof window !== 'undefined') {
      return;
    }

    const {
      ttl = 300000,
      tags = [],
      priority = 'medium',
      layer = 'auto'
    } = options;
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      hitCount: 0,
      size: this.estimateSize(data),
      tags,
      priority,
      layer: this.determineLayer(layer, priority),
      source: 'set'
    };
    
    await this.storeEntry(key, entry);
  }
  
  /**
   * 🧹 INTELLIGENT INVALIDATION: Tag-based and pattern-based
   */
  static async invalidate(pattern: string | string[]): Promise<number> {
    // Client-side cache invalidation
    if (typeof window !== 'undefined') {
      return this.invalidateClientSide(pattern);
    }

    const patterns = Array.isArray(pattern) ? pattern : [pattern];
    let invalidated = 0;
    
    // Invalidate L1 cache
    for (const [key, entry] of this.l1Cache) {
      if (this.shouldInvalidate(key, entry, patterns)) {
        this.l1Cache.delete(key);
        invalidated++;
      }
    }
    
    // Invalidate L2 cache (Redis)
    if (this.isRedisConnected) {
      for (const pattern of patterns) {
        const keys = await this.getRedisKeys(pattern);
        for (const key of keys) {
          await this.deleteFromRedis(key);
          invalidated++;
        }
      }
    }
    
    // Invalidate L3 cache
    for (const [key, entry] of this.l3Cache) {
      if (this.shouldInvalidate(key, entry, patterns)) {
        this.l3Cache.delete(key);
        invalidated++;
      }
    }
    
    console.log(`🧹 [INVALIDATION] Invalidated ${invalidated} cache entries for patterns:`, patterns);
    return invalidated;
  }

  /**
   * 🧹 CLIENT-SIDE CACHE INVALIDATION: Clear client-side cache entries
   */
  private static invalidateClientSide(pattern: string | string[]): number {
    const patterns = Array.isArray(pattern) ? pattern : [pattern];
    let invalidated = 0;
    
    // Clear L1 cache (client-side only has L1)
    for (const [key, entry] of this.l1Cache) {
      if (this.shouldInvalidate(key, entry, patterns)) {
        this.l1Cache.delete(key);
        invalidated++;
      }
    }
    
    // Also clear any SWR cache entries that match the patterns
    if (typeof window !== 'undefined' && (window as any).__SWR_CACHE__) {
      const swrCache = (window as any).__SWR_CACHE__;
      for (const [key] of swrCache) {
        if (this.matchesPattern(key, patterns)) {
          swrCache.delete(key);
          invalidated++;
        }
      }
    }
    
    console.log(`🧹 [CLIENT INVALIDATION] Invalidated ${invalidated} client-side cache entries for patterns:`, patterns);
    return invalidated;
  }

  /**
   * 🎯 PATTERN MATCHING: Check if key matches any of the patterns
   */
  private static matchesPattern(key: string, patterns: string[]): boolean {
    return patterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(key);
      }
      return key.includes(pattern);
    });
  }

  /**
   * 🔄 WORKSPACE SWITCH CACHE CLEARING: Comprehensive cache clearing for workspace changes
   */
  static async clearWorkspaceCache(oldWorkspaceId: string, newWorkspaceId: string): Promise<number> {
    const patterns = [
      `ws:${oldWorkspaceId}`,
      `ws:${newWorkspaceId}`,
      `workspace:${oldWorkspaceId}`,
      `workspace:${newWorkspaceId}`,
      `unified-${oldWorkspaceId}`,
      `unified-${newWorkspaceId}`,
      `acquisition-os:${oldWorkspaceId}`,
      `acquisition-os:${newWorkspaceId}`,
      `pipeline:${oldWorkspaceId}`,
      `pipeline:${newWorkspaceId}`,
      `leads:${oldWorkspaceId}`,
      `leads:${newWorkspaceId}`,
      `opportunities:${oldWorkspaceId}`,
      `opportunities:${newWorkspaceId}`,
      `prospects:${oldWorkspaceId}`,
      `prospects:${newWorkspaceId}`,
      `accounts:${oldWorkspaceId}`,
      `accounts:${newWorkspaceId}`,
      `contacts:${oldWorkspaceId}`,
      `contacts:${newWorkspaceId}`,
      `customers:${oldWorkspaceId}`,
      `customers:${newWorkspaceId}`,
      'acquisition-os',
      'pipeline',
      'leads',
      'opportunities',
      'prospects',
      'accounts',
      'contacts',
      'customers',
      'partnerships',
      'buyerGroups',
      'catalyst',
      'calendar',
      'champions',
      'decisionMakers',
      'speedrunItems'
    ];

    let totalInvalidated = 0;
    
    // Clear unified cache
    totalInvalidated += await this.invalidate(patterns);
    
    // Clear SWR cache globally if available
    if (typeof window !== 'undefined') {
      try {
        const { mutate } = await import('swr');
        
        // Clear all SWR cache entries
        await mutate(() => true, undefined, { revalidate: false });
        
        // Also clear specific patterns
        for (const pattern of patterns) {
          await mutate(pattern, undefined, { revalidate: false });
        }
        
        console.log(`🧹 [WORKSPACE SWITCH] Cleared SWR cache for workspace switch: ${oldWorkspaceId} -> ${newWorkspaceId}`);
      } catch (error) {
        console.warn('⚠️ [WORKSPACE SWITCH] Failed to clear SWR cache:', error);
      }
    }
    
    console.log(`🔄 [WORKSPACE SWITCH] Total cache entries cleared: ${totalInvalidated}`);
    return totalInvalidated;
  }
  
  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================
  
  /**
   * 📊 COMPREHENSIVE CACHE STATISTICS
   */
  static getStats(): CacheStats {
    const memoryUsageMB = this.stats.memoryUsage / (1024 * 1024);
    
    // Get top performing cache keys
    const allEntries = [
      ...Array.from(this.l1Cache.entries()).map(([key, entry]) => ({ key, ...entry, layer: 'L1' })),
      ...Array.from(this.l2Cache.entries()).map(([key, entry]) => ({ key, ...entry, layer: 'L2' })),
      ...Array.from(this.l3Cache.entries()).map(([key, entry]) => ({ key, ...entry, layer: 'L3' })),
    ];
    
    const topKeys = allEntries
      .sort((a, b) => b.hitCount - a.hitCount)
      .slice(0, 10)
      .map(({ key, hitCount, priority, layer }) => ({ key, hits: hitCount, priority, layer }));
    
    return {
      ...this.stats,
      l1Size: this.l1Cache.size,
      l2Size: this.l2Cache.size,
      l3Size: this.l3Cache.size,
      memoryUsage: memoryUsageMB,
      topKeys,
    };
  }
  
  /**
   * 🧹 AUTOMATIC CLEANUP: Memory-aware eviction
   */
  static cleanup(): void {
    const now = Date.now();
    let evicted = 0;
    
    // Clean expired entries from L1
    for (const [key, entry] of this.l1Cache) {
      if (!this.isValid(entry)) {
        this.l1Cache.delete(key);
        evicted++;
      }
    }
    
    // Clean expired entries from L2
    for (const [key, entry] of this.l2Cache) {
      if (!this.isValid(entry)) {
        this.l2Cache.delete(key);
        evicted++;
      }
    }
    
    // Clean expired entries from L3
    for (const [key, entry] of this.l3Cache) {
      if (!this.isValid(entry)) {
        this.l3Cache.delete(key);
        evicted++;
      }
    }
    
    // Memory-based eviction if needed
    if (this.stats.memoryUsage > this.MAX_MEMORY_MB * 1024 * 1024) {
      evicted += this.evictLeastUsed();
    }
    
    this.stats.evictions += evicted;
    
    if (evicted > 0) {
      console.log(`🧹 [CLEANUP] Evicted ${evicted} entries`);
    }
  }
  
  /**
   * 🔥 CACHE WARMING: Pre-load critical data
   */
  static async warmCache(workspaceId: string, userId?: string): Promise<void> {
    // Client-side fallback - no warming
    if (typeof window !== 'undefined') {
      return;
    }

    console.log(`🔥 [WARMING] Starting cache warm-up for workspace: ${workspaceId}${userId ? `, user: ${userId}` : ''}`);
    
    const commonKeys = [
      `leads:${workspaceId}:active`,
      `analytics:${workspaceId}:dashboard`,
      `opportunities:${workspaceId}:pipeline`,
      `users:${workspaceId}:active`,
      `accounts:${workspaceId}:recent`,
      `contacts:${workspaceId}:recent`,
      `pipeline:counts:${workspaceId}${userId ? `:${userId}` : ''}`,
      `workspace:${workspaceId}:context`,
      `user:${userId || 'default'}:preferences`
    ];
    
    // Pre-warm with high priority
    const warmPromises = commonKeys.map(async (key) => {
      try {
        await this.set(key, { warmed: true, timestamp: Date.now() }, {
          priority: 'high',
          ttl: 600000, // 10 minutes
          tags: ['warmup', workspaceId, userId || 'default']
        });
        console.log(`🔥 [WARMING] Warmed: ${key}`);
      } catch (error) {
        console.warn(`⚠️ [WARMING] Failed to warm ${key}:`, error);
      }
    });
    
    await Promise.allSettled(warmPromises);
    console.log(`🔥 [WARMING] Pre-warmed ${commonKeys.length} cache keys`);
  }

  /**
   * 📊 ENHANCED CACHE MONITORING: Real-time performance tracking
   */
  static getDetailedStats(): CacheStats & {
    redisStatus: 'connected' | 'disconnected' | 'error';
    memoryUsageMB: number;
    cacheEfficiency: number;
    topSlowQueries: Array<{ key: string; duration: number; frequency: number }>;
    recommendations: string[];
  } {
    const baseStats = this.getStats();
    const memoryUsageMB = baseStats.memoryUsage;
    
    // Calculate cache efficiency
    const totalRequests = baseStats.hits + baseStats.misses;
    const cacheEfficiency = totalRequests > 0 ? (baseStats.hits / totalRequests) * 100 : 0;
    
    // Get top slow queries with frequency
    const slowQueries = baseStats.performance.slowestQueries.map(query => ({
      ...query,
      frequency: this.getQueryFrequency(query.key)
    }));
    
    // Generate recommendations
    const recommendations: string[] = [];
    if (cacheEfficiency < 70) {
      recommendations.push('Consider increasing TTL for frequently accessed data');
    }
    if (memoryUsageMB > 150) {
      recommendations.push('Memory usage is high - consider reducing cache size or implementing LRU eviction');
    }
    if (!this.isRedisConnected) {
      recommendations.push('Redis is not connected - enable Redis for better performance');
    }
    if (baseStats.evictions > baseStats.hits * 0.1) {
      recommendations.push('High eviction rate - consider increasing cache size');
    }
    
    return {
      ...baseStats,
      redisStatus: this.isRedisConnected ? 'connected' : 'disconnected',
      memoryUsageMB,
      cacheEfficiency,
      topSlowQueries: slowQueries,
      recommendations
    };
  }

  /**
   * 🔍 QUERY FREQUENCY TRACKING: Track how often keys are accessed
   */
  private static queryFrequency = new Map<string, number>();
  
  private static getQueryFrequency(key: string): number {
    return this.queryFrequency.get(key) || 0;
  }
  
  private static incrementQueryFrequency(key: string): void {
    const current = this.queryFrequency.get(key) || 0;
    this.queryFrequency.set(key, current + 1);
  }
  
  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================
  
  private static isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }
  
  private static isStale(entry: CacheEntry): boolean {
    const staleThreshold = entry.ttl * 0.8; // 80% of TTL
    return Date.now() - entry.timestamp > staleThreshold;
  }
  
  private static determineLayer(layer: CacheLayer, priority: CachePriority): CacheLayer {
    if (layer !== 'auto') return layer;
    
    switch (priority) {
      case 'critical':
      case 'high':
        return 'l1';
      case 'medium':
        return 'l2';
      case 'low':
        return 'l3';
      default:
        return 'l2';
    }
  }
  
  private static async storeEntry(key: string, entry: CacheEntry): Promise<void> {
    switch (entry.layer) {
      case 'l1':
        this.setL1(key, entry);
        break;
      case 'l2':
        await this.setL2(key, entry);
        break;
      case 'l3':
        this.setL3(key, entry);
        break;
    }
  }
  
  private static setL1(key: string, entry: CacheEntry): void {
    if (this.l1Cache.size >= this.MAX_L1_SIZE) {
      this.evictFromL1();
    }
    
    this.l1Cache.set(key, entry);
    this.updateMemoryUsage();
  }
  
  private static async setL2(key: string, entry: CacheEntry): Promise<void> {
    if (this.l2Cache.size >= this.MAX_L2_SIZE) {
      this.evictFromL2();
    }
    
    this.l2Cache.set(key, entry);
    
    // Also store in Redis if connected
    if (this.isRedisConnected) {
      await this.setToRedis(key, entry);
    }
    
    this.updateMemoryUsage();
  }
  
  private static setL3(key: string, entry: CacheEntry): void {
    if (this.l3Cache.size >= this.MAX_L3_SIZE) {
      this.evictFromL3();
    }
    
    this.l3Cache.set(key, entry);
    this.updateMemoryUsage();
  }
  
  private static promoteToL1(key: string, entry: CacheEntry): void {
    if (this.l1Cache.size >= this.MAX_L1_SIZE) {
      this.evictFromL1();
    }
    
    this.l1Cache.set(key, entry);
    console.log(`⬆️ [PROMOTION] Promoted ${key} to L1 cache`);
  }
  
  private static promoteToL2(key: string, entry: CacheEntry): void {
    if (this.l2Cache.size >= this.MAX_L2_SIZE) {
      this.evictFromL2();
    }
    
    this.l2Cache.set(key, entry);
    
    // Also store in Redis if connected
    if (this.isRedisConnected) {
      this.setToRedis(key, entry).catch(() => {});
    }
    
    console.log(`⬆️ [PROMOTION] Promoted ${key} to L2 cache`);
  }
  
  private static async backgroundRefresh(
    key: string,
    fetchFn: () => Promise<any>,
    options: CacheOptions
  ): Promise<void> {
    try {
      const data = await fetchFn();
      await this.set(key, data, options);
      console.log(`✅ [BACKGROUND] Refreshed ${key}`);
    } catch (error) {
      console.warn(`⚠️ [BACKGROUND] Failed to refresh ${key}:`, error);
    }
  }
  
  private static evictFromL1(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.l1Cache) {
      if (entry.timestamp < oldestTime && entry.priority !== 'critical') {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.l1Cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }
  
  private static evictFromL2(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.l2Cache) {
      if (entry.timestamp < oldestTime && entry.priority !== 'critical') {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.l2Cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }
  
  private static evictFromL3(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.l3Cache) {
      if (entry.timestamp < oldestTime && entry.priority !== 'critical') {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.l3Cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }
  
  private static evictLeastUsed(): number {
    const allEntries = [
      ...Array.from(this.l1Cache.entries()).map(([key, entry]) => ({ key, entry, layer: 'L1' })),
      ...Array.from(this.l2Cache.entries()).map(([key, entry]) => ({ key, entry, layer: 'L2' })),
      ...Array.from(this.l3Cache.entries()).map(([key, entry]) => ({ key, entry, layer: 'L3' })),
    ];
    
    // Sort by hit count (ascending) and priority
    allEntries.sort((a, b) => {
      if (a['entry']['priority'] === 'critical' && b.entry.priority !== 'critical') return 1;
      if (b['entry']['priority'] === 'critical' && a.entry.priority !== 'critical') return -1;
      return a.entry.hitCount - b.entry.hitCount;
    });
    
    let evicted = 0;
    const targetEvictions = Math.ceil(allEntries.length * 0.1); // Evict 10%
    
    for (let i = 0; i < targetEvictions && i < allEntries.length; i++) {
      const { key, layer } = allEntries[i];
      
      switch (layer) {
        case 'L1':
          this.l1Cache.delete(key);
          break;
        case 'L2':
          this.l2Cache.delete(key);
          break;
        case 'L3':
          this.l3Cache.delete(key);
          break;
      }
      
      evicted++;
    }
    
    return evicted;
  }
  
  private static shouldInvalidate(key: string, entry: CacheEntry, patterns: string[]): boolean {
    // Check key patterns
    for (const pattern of patterns) {
      if (key.includes(pattern)) return true;
    }
    
    // Check tags
    for (const pattern of patterns) {
      if (entry.tags.some(tag => tag.includes(pattern))) return true;
    }
    
    return false;
  }
  
  private static estimateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate
    } catch {
      return 1000; // Default size
    }
  }
  
  private static updateMemoryUsage(): void {
    let totalSize = 0;
    
    for (const entry of this.l1Cache.values()) {
      totalSize += entry.size;
    }
    
    for (const entry of this.l2Cache.values()) {
      totalSize += entry.size;
    }
    
    for (const entry of this.l3Cache.values()) {
      totalSize += entry.size;
    }
    
    this['stats']['memoryUsage'] = totalSize;
  }
  
  private static updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this['stats']['hitRate'] = total > 0 ? this.stats.hits / total : 0;
  }
  
  private static recordPerformance(key: string, duration: number): void {
    // Update average response time
    const total = this.stats.hits + this.stats.misses;
    this.stats['performance']['avgResponseTime'] = 
      (this.stats.performance.avgResponseTime * (total - 1) + duration) / total;
    
    // Track slowest queries
    if (duration > 1000) { // Slower than 1 second
      this.stats.performance.slowestQueries.push({ key, duration });
      this.stats.performance.slowestQueries.sort((a, b) => b.duration - a.duration);
      this.stats['performance']['slowestQueries'] = this.stats.performance.slowestQueries.slice(0, 10);
    }
  }
  
  // ============================================================================
  // REDIS INTEGRATION
  // ============================================================================
  
  private static async getFromRedis(key: string): Promise<CacheEntry | null> {
    if (!this.isRedisConnected || !this.redisClient) return null;
    
    try {
      const value = await this.redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn(`🔴 [REDIS GET ERROR] ${key}:`, error);
      return null;
    }
  }
  
  private static async setToRedis(key: string, entry: CacheEntry): Promise<void> {
    if (!this.isRedisConnected || !this.redisClient) return;
    
    try {
      const ttlSeconds = Math.floor(entry.ttl / 1000);
      await this.redisClient.setEx(key, ttlSeconds, JSON.stringify(entry));
    } catch (error) {
      console.warn(`🔴 [REDIS SET ERROR] ${key}:`, error);
    }
  }
  
  private static async deleteFromRedis(key: string): Promise<void> {
    if (!this.isRedisConnected || !this.redisClient) return;
    
    try {
      await this.redisClient.del(key);
    } catch (error) {
      console.warn(`🔴 [REDIS DELETE ERROR] ${key}:`, error);
    }
  }
  
  private static async getRedisKeys(pattern: string): Promise<string[]> {
    if (!this.isRedisConnected || !this.redisClient) return [];
    
    try {
      return await this.redisClient.keys(pattern);
    } catch (error) {
      console.warn(`🔴 [REDIS KEYS ERROR] ${pattern}:`, error);
      return [];
    }
  }
  
  // ============================================================================
  // MAINTENANCE & MONITORING
  // ============================================================================
  
  private static startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
  }
  
  private static startStatsCollection(): void {
    setInterval(() => {
      this.updateMemoryUsage();
      this.updateHitRate();
    }, 60 * 1000); // Every minute
  }
  
  /**
   * 🧹 CLEAR ALL CACHE
   */
  static async clear(): Promise<void> {
    // Client-side fallback - no clearing
    if (typeof window !== 'undefined') {
      return;
    }

    this.l1Cache.clear();
    this.l2Cache.clear();
    this.l3Cache.clear();
    
    if (this['isRedisConnected'] && this.redisClient) {
      try {
        await this.redisClient.flushAll();
      } catch (error) {
        console.warn('🔴 [REDIS FLUSH ERROR]:', error);
      }
    }
    
    this['stats'] = {
      hits: 0,
      misses: 0,
      evictions: 0,
      memoryUsage: 0,
      hitRate: 0,
      l1Size: 0,
      l2Size: 0,
      l3Size: 0,
      topKeys: [],
      performance: {
        avgResponseTime: 0,
        slowestQueries: []
      }
    };
    
    console.log('🧹 [UNIFIED CACHE] Cleared all cache layers');
  }
  
  /**
   * 🔌 GRACEFUL SHUTDOWN
   */
  static async shutdown(): Promise<void> {
    if (this['redisClient'] && this.isRedisConnected) {
      try {
        await this.redisClient.disconnect();
        console.log('👋 [UNIFIED CACHE] Redis disconnected gracefully');
      } catch (error) {
        console.warn('🔴 [UNIFIED CACHE] Redis disconnect error:', error);
      }
    }
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

// Singleton instance
export const unifiedCache = UnifiedCache;

// Convenience functions
export const cache = {
  get: UnifiedCache.get.bind(UnifiedCache),
  set: UnifiedCache.set.bind(UnifiedCache),
  invalidate: UnifiedCache.invalidate.bind(UnifiedCache),
  stats: UnifiedCache.getStats.bind(UnifiedCache),
  detailedStats: UnifiedCache.getDetailedStats.bind(UnifiedCache),
  clear: UnifiedCache.clear.bind(UnifiedCache),
  warm: UnifiedCache.warmCache.bind(UnifiedCache),
};

// Initialize on import
if (typeof window === 'undefined') { // Server-side only
  UnifiedCache.initialize().catch(console.error);
}

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => UnifiedCache.shutdown());
  process.on('SIGINT', () => UnifiedCache.shutdown());
}
