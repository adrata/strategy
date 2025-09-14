/**
 * 🚀 CLIENT-SIDE SERVICES - MAIN EXPORTS
 * 
 * Client-side only services and hooks
 * Separated from server-side services to prevent SSR issues
 */

// ============================================================================
// UNIFIED DATA FETCHING HOOKS (CLIENT-SIDE ONLY)
// ============================================================================

export {
  useUnifiedData,
  usePipelineData,
  useLeadsData,
  useOpportunitiesData,
  useAccountsData,
  useContactsData,
  invalidateCachePattern,
  warmCache,
  getCacheStats
} from '../hooks/useUnifiedData';

// ============================================================================
// CLIENT-SIDE CACHE OPERATIONS
// ============================================================================

export { 
  cache,
  type CacheEntry,
  type CacheOptions,
  type CacheStats,
  type CachePriority,
  type CacheLayer
} from './unified-cache';
