/**
 * 🚀 UNIFIED PLATFORM SERVICES - MAIN EXPORTS
 * 
 * This is the single source of truth for all platform services
 * Enterprise-grade caching and loading systems with comprehensive monitoring
 */

// ============================================================================
// MAIN CACHE SYSTEM
// ============================================================================

export { 
  UnifiedCache, 
  unifiedCache, 
  cache,
  type CacheEntry,
  type CacheOptions,
  type CacheStats,
  type CachePriority,
  type CacheLayer
} from './unified-cache';

// ============================================================================
// SERVER-SIDE CACHE UTILITIES
// ============================================================================

// Server-cache service removed - exports commented out
// export {
//   serverGet,
//   serverSet,
//   serverInvalidate,
//   serverWarm,
//   serverStats,
//   serverDetailedStats,
//   serverClear
// } from './server-cache';

// ============================================================================
// CLIENT-SIDE SERVICES
// ============================================================================
// Note: Client-side hooks are exported from './client' to prevent SSR issues

// ============================================================================
// CACHE ANALYTICS & MONITORING
// ============================================================================

// Analytics functionality is built into UnifiedCache
// Use cache.stats() and cache.detailedStats() for analytics

// ============================================================================
// LOADING SYSTEM - MIGRATED TO LoadingSystem
// ============================================================================

// Loading migration utilities removed - migration complete

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

// Default export for easy usage
export default {
  // Main cache system
  cache: require('./unified-cache').unifiedCache,
  
  // Analytics available via cache.stats() and cache.detailedStats()
  
  // Loading system - migrated to LoadingSystem
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * 🎯 UNIFIED CACHE USAGE EXAMPLES
 * 
 * Basic Usage:
 * ```typescript
 * import { cache } from '@/platform/services';
 * 
 * // Get data with caching
 * const data = await cache.get('user:123', async () => {
 *   return await fetchUserFromDatabase('123');
 * }, {
 *   ttl: 300000, // 5 minutes
 *   priority: 'high',
 *   tags: ['user', 'profile']
 * });
 * 
 * // Set data directly
 * await cache.set('user:123', userData, {
 *   ttl: 600000, // 10 minutes
 *   priority: 'critical',
 *   tags: ['user', 'profile']
 * });
 * 
 * // Invalidate cache
 * await cache.invalidate('user:*');
 * 
 * // Get analytics
 * const stats = cache.stats();
 * console.log(`Hit rate: ${stats.hitRate * 100}%`);
 * ```
 * 
 * Advanced Usage:
 * ```typescript
 * import { unifiedCache } from '@/platform/services';
 * 
 * // Multi-layer caching with background refresh
 * const data = await unifiedCache.get('expensive:query', fetchFn, {
 *   ttl: 600000,
 *   priority: 'high',
 *   layer: 'auto',
 *   backgroundRefresh: true,
 *   staleWhileRevalidate: true
 * });
 * 
 * // Cache warming
 * await unifiedCache.warmCache('workspace-123');
 * 
 * // Get comprehensive analytics
 * const detailedStats = cache.detailedStats();
 * console.log('Cache health:', detailedStats.performance.hitRate);
 * ```
 * 
 * 🎯 CLIENT-SIDE DATA HOOKS USAGE EXAMPLES
 * 
 * Basic Usage:
 * ```typescript
 * import { useUnifiedData, usePipelineData } from '@/platform/services';
 * 
 * function MyComponent() {
 *   const { data, loading, error } = useUnifiedData('workspace-123');
 *   const { pipelineData } = usePipelineData('workspace-123');
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   
 *   return <div>Render data</div>;
 * }
 * ```
 * 
 * Advanced Usage:
 * ```typescript
 * import { useLeadsData, useOpportunitiesData, invalidateCachePattern } from '@/platform/services';
 * 
 * function AdvancedComponent() {
 *   const { leads, loading: leadsLoading } = useLeadsData('workspace-123');
 *   const { opportunities, loading: oppsLoading } = useOpportunitiesData('workspace-123');
 *   
 *   const handleRefresh = async () => {
 *     // Invalidate and refresh specific cache patterns
 *     await invalidateCachePattern('leads:*');
 *     await invalidateCachePattern('opportunities:*');
 *   };
 *   
 *   return <div>Render combined data</div>;
 * }
 * ```
 */
