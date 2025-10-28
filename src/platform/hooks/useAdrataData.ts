"use client";

/**
 * 🚀 ADRATA UNIFIED DATA HOOK - 2025 WORLD-CLASS
 * 
 * Single source of truth for ALL data fetching across the platform
 * Replaces: useUnifiedData, useData, usePipelineData, useDataService, useSpeedrunData
 * 
 * Features:
 * - Unified caching with intelligent promotion
 * - Automatic request deduplication
 * - Background refresh with stale-while-revalidate
 * - TypeScript-first with full type safety
 * - Performance monitoring and optimization
 * - Error handling and retry logic
 */

import useSWR, { SWRConfiguration, mutate } from 'swr';
import { useCallback, useMemo, useState, useEffect } from 'react';
import { cache } from '@/platform/services/unified-cache';
// Removed authFetch import - using standard fetch

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AdrataDataOptions<T> extends SWRConfiguration<T> {
  // Cache options
  ttl?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  backgroundRefresh?: boolean;
  
  // SWR options
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  dedupingInterval?: number;
  errorRetryCount?: number;
  errorRetryInterval?: number;
  
  // Custom options
  enabled?: boolean;
  fallbackData?: T;
  
  // Adrata-specific options
  workspaceId?: string;
  userId?: string;
  section?: string;
}

export interface AdrataDataReturn<T> {
  data: T | undefined;
  isLoading: boolean;
  isValidating: boolean;
  error: Error | null;
  refresh: () => Promise<T | undefined>;
  clearCache: () => void;
  mutate: (data?: T | Promise<T>, shouldRevalidate?: boolean) => Promise<T | undefined>;
}

// ============================================================================
// UNIFIED FETCHER
// ============================================================================

async function adrataFetcher<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: AdrataDataOptions<T> = {}
): Promise<T> {
  const { ttl = 300000, priority = 'medium', tags = [], backgroundRefresh = true } = options;
  
  return cache.get(key, fetchFn, {
    ttl,
    priority,
    tags,
    backgroundRefresh
  });
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * 🚀 ADRATA UNIFIED DATA HOOK: Single hook for all data fetching needs
 */
export function useAdrataData<T>(
  key: string | null,
  fetchFn: (() => Promise<T>) | null,
  options: AdrataDataOptions<T> = {}
): AdrataDataReturn<T> {
  const {
    // Cache options
    ttl = 300000,
    priority = 'medium',
    tags = [],
    backgroundRefresh = true,
    
    // SWR options
    revalidateOnFocus = false,
    revalidateOnReconnect = false, // 🚀 CACHE OPTIMIZATION: Disable revalidation on reconnect to prevent unnecessary reloads
    dedupingInterval = 60000, // 🚀 CACHE OPTIMIZATION: 60 seconds deduplication for better performance
    errorRetryCount = 1, // Reduced from 3 to prevent excessive retries
    errorRetryInterval = 2000, // Reduced from 5000ms to 2000ms
    
    // Custom options
    enabled = true,
    fallbackData,
    
    // Adrata-specific options
    workspaceId,
    userId,
    section,
    
    // Pass through other SWR options
    ...swrOptions
  } = options;

  // Create enhanced cache key with context
  const enhancedKey = useMemo(() => {
    if (!key) return null;
    
    const contextParts = [];
    if (workspaceId) contextParts.push(`ws:${workspaceId}`);
    if (userId) contextParts.push(`user:${userId}`);
    if (section) contextParts.push(`section:${section}`);
    
    return contextParts.length > 0 ? `${key}:${contextParts.join(':')}` : key;
  }, [key, workspaceId, userId, section]);

  // Create fetcher function
  const fetcher = useCallback(
    (cacheKey: string) => {
      if (!fetchFn) {
        throw new Error('Fetch function is required');
      }
      return adrataFetcher(cacheKey, fetchFn, {
        ttl,
        priority,
        tags,
        backgroundRefresh
      });
    },
    [fetchFn, ttl, priority, tags, backgroundRefresh]
  );

  // SWR configuration
  const swrConfig: SWRConfiguration<T> = useMemo(() => ({
    revalidateOnFocus,
    revalidateOnReconnect,
    dedupingInterval,
    errorRetryCount,
    errorRetryInterval,
    fallbackData,
    ...swrOptions
  }), [
    revalidateOnFocus,
    revalidateOnReconnect,
    dedupingInterval,
    errorRetryCount,
    errorRetryInterval,
    fallbackData,
    swrOptions
  ]);

  // Use SWR
  const { data, error, isLoading, isValidating, mutate: swrMutate } = useSWR(
    enabled && enhancedKey && fetchFn ? enhancedKey : null,
    fetcher,
    swrConfig
  );

  // Enhanced mutate function
  const enhancedMutate = useCallback(
    async (data?: T | Promise<T>, shouldRevalidate: boolean = true) => {
      if (!enhancedKey) return undefined;
      
      // Update cache
      if (data) {
        await cache.set(enhancedKey, data, { ttl, priority, tags });
      }
      
      // Update SWR
      return swrMutate(data, shouldRevalidate);
    },
    [enhancedKey, ttl, priority, tags, swrMutate]
  );

  // Refresh function
  const refresh = useCallback(async () => {
    if (!enhancedKey) return undefined;
    
    // Clear cache and revalidate
    await cache.invalidate(enhancedKey);
    return swrMutate();
  }, [enhancedKey, swrMutate]);

  // Clear cache function
  const clearCache = useCallback(() => {
    if (!enhancedKey) return;
    
    cache.delete(enhancedKey);
    swrMutate(undefined, false);
  }, [enhancedKey, swrMutate]);

  // 🆕 WORKSPACE CHANGE DETECTION: Force refresh when workspace changes
  const [lastWorkspaceId, setLastWorkspaceId] = useState<string | null>(null);
  const [isWorkspaceSwitching, setIsWorkspaceSwitching] = useState(false);
  
  useEffect(() => {
    if (workspaceId && workspaceId !== lastWorkspaceId && lastWorkspaceId !== null) {
      console.log(`🔄 [WORKSPACE SWITCH] useAdrataData detected workspace change from ${lastWorkspaceId} to ${workspaceId}`);
      
      // 🆕 CRITICAL: Set switching flag to prevent premature data fetching
      setIsWorkspaceSwitching(true);
      
      // Clear cache and force refresh
      clearCache();
      swrMutate();
      
      // 🆕 CRITICAL: Wait a moment before allowing data fetching to ensure cache is cleared
      setTimeout(() => {
        setIsWorkspaceSwitching(false);
        setLastWorkspaceId(workspaceId);
        console.log(`✅ [WORKSPACE SWITCH] useAdrataData workspace switch completed for: ${workspaceId}`);
      }, 150); // Small delay to ensure cache clearing is complete
      
    } else if (workspaceId && lastWorkspaceId === null) {
      // Initial load - just set the workspace ID
      setLastWorkspaceId(workspaceId);
    }
  }, [workspaceId, lastWorkspaceId, clearCache, swrMutate]);

  return {
    data,
    isLoading,
    isValidating,
    error,
    refresh,
    clearCache,
    mutate: enhancedMutate
  };
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * 🎯 PIPELINE DATA HOOK: Specialized for pipeline data
 */
export function usePipelineData(
  section: string,
  workspaceId?: string,
  userId?: string,
  options: Omit<AdrataDataOptions<any>, 'workspaceId' | 'userId' | 'section'> = {}
) {
  const fetchFn = useCallback(async () => {
    if (!workspaceId || !userId) {
      throw new Error('Workspace ID and User ID are required');
    }

    console.log(`🔍 [usePipelineData] Fetching ${section} data for workspace: ${workspaceId}, user: ${userId}`);
    
    // 🚀 NEW: Use v1 APIs for better performance and consistency
    let response;
    if (section === 'companies') {
      response = await fetch('/api/v1/companies', { credentials: 'include' });
    } else if (section === 'people') {
      response = await fetch('/api/v1/people', { credentials: 'include' });
    } else if (section === 'actions') {
      response = await fetch('/api/v1/actions', { credentials: 'include' });
    } else if (section === 'leads') {
      response = await fetch('/api/v1/people?status=LEAD', { credentials: 'include' });
    } else if (section === 'prospects') {
      response = await fetch('/api/v1/people?status=PROSPECT', { credentials: 'include' });
    } else if (section === 'opportunities') {
      response = await fetch('/api/v1/companies?status=OPPORTUNITY', { credentials: 'include' });
    } else if (section === 'speedrun') {
      response = await fetch('/api/v1/people?limit=50&sortBy=rank&sortOrder=asc', { credentials: 'include' });
    } else {
      console.warn(`⚠️ [usePipelineData] No v1 API available for section: ${section}`);
      throw new Error(`No v1 API available for section: ${section}`);
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${section} data`);
    }
    
    const result = await response.json();
    
    // 🔍 DEBUG: Log the API response structure
    console.log(`🔍 [usePipelineData] API response for ${section}:`, {
      success: result.success,
      dataKeys: result.data ? Object.keys(result.data) : [],
      sectionData: result.data?.slice(0, 2) || [],
      fullResponse: result
    });
    
    // v1 API returns data directly in result.data as an array
    return result.success ? result.data || [] : [];
  }, [section, workspaceId, userId]);

  const cacheKey = `pipeline:${section}`;

  return useAdrataData(cacheKey, fetchFn, {
    ...options,
    workspaceId,
    userId,
    section,
    priority: 'high',
    tags: ['pipeline', section, workspaceId || '', userId || '']
  });
}

/**
 * 🎯 ACQUISITION OS DATA HOOK: Specialized for acquisition data
 */
export function useAcquisitionData(
  workspaceId?: string,
  userId?: string,
  options: Omit<AdrataDataOptions<any>, 'workspaceId' | 'userId'> = {}
) {
  const fetchFn = useCallback(async () => {
    if (!workspaceId || !userId) {
      throw new Error('Workspace ID and User ID are required');
    }

    // 🚀 NEW: Use v1 APIs for better performance and consistency
    const [leadsResponse, prospectsResponse, opportunitiesResponse, companiesResponse, peopleResponse] = await Promise.all([
      fetch('/api/v1/people?status=LEAD', { credentials: 'include' }),
      fetch('/api/v1/people?status=PROSPECT', { credentials: 'include' }),
      fetch('/api/v1/companies?status=OPPORTUNITY', { credentials: 'include' }), // Use companies table with OPPORTUNITY status
      fetch('/api/v1/companies', { credentials: 'include' }),
      fetch('/api/v1/people', { credentials: 'include' })
    ]);

    const [leadsData, prospectsData, opportunitiesData, companiesData, peopleData] = await Promise.all([
      leadsResponse.json(),
      prospectsResponse.json(),
      opportunitiesResponse.json(),
      companiesResponse.json(),
      peopleResponse.json()
    ]);

    return {
      leads: leadsData.success ? leadsData.data : [],
      prospects: prospectsData.success ? prospectsData.data : [],
      opportunities: opportunitiesData.success ? opportunitiesData.data : [],
      accounts: companiesData.success ? companiesData.data : [],
      contacts: peopleData.success ? peopleData.data : [],
      partnerships: [], // Not implemented in v1 yet
      clients: companiesData.success ? companiesData.data.filter((c: any) => c.status === 'CLIENT') : [],
      buyerGroups: [],
      catalyst: [],
      calendar: [],
      champions: [],
      decisionMakers: [],
      speedrunItems: [],
    };
  }, [workspaceId, userId]);

  const cacheKey = 'revenue-os';

  return useAdrataData(cacheKey, fetchFn, {
    ...options,
    workspaceId,
    userId,
    priority: 'high',
    tags: ['revenue-os', workspaceId || '', userId || '']
  });
}

/**
 * 🎯 SPEEDRUN DATA HOOK: Specialized for speedrun data
 */
export function useSpeedrunData(
  workspaceId?: string,
  userId?: string,
  options: Omit<AdrataDataOptions<any>, 'workspaceId' | 'userId'> = {}
) {
  const fetchFn = useCallback(async () => {
    if (!workspaceId || !userId) {
      throw new Error('Workspace ID and User ID are required');
    }

    // 🚀 NEW: Use v1 APIs for speedrun data with ranking (top 50 people)
    const response = await fetch('/api/v1/people?limit=50&sortBy=rank&sortOrder=asc', { credentials: 'include' });
    
    if (!response.ok) {
      throw new Error('Failed to fetch speedrun data');
    }

    const result = await response.json();
    return result.success ? result.data : [];
  }, [workspaceId, userId]);

  const cacheKey = 'speedrun';

  return useAdrataData(cacheKey, fetchFn, {
    ...options,
    workspaceId,
    userId,
    priority: 'high',
    tags: ['speedrun', workspaceId || '', userId || '']
  });
}

/**
 * 🎯 COUNTS DATA HOOK: Specialized for pipeline counts
 */
export function usePipelineCounts(
  workspaceId?: string,
  userId?: string,
  options: Omit<AdrataDataOptions<any>, 'workspaceId' | 'userId'> = {}
) {
  const fetchFn = useCallback(async () => {
    if (!workspaceId || !userId) {
      throw new Error('Workspace ID and User ID are required');
    }

    // 🚀 NEW: Use v1 APIs for pipeline counts
    const [leadsResponse, prospectsResponse, opportunitiesResponse, companiesResponse, peopleResponse] = await Promise.all([
      fetch('/api/v1/people?counts=true&status=LEAD', { credentials: 'include' }),
      fetch('/api/v1/people?counts=true&status=PROSPECT', { credentials: 'include' }),
      fetch('/api/v1/companies?counts=true&status=OPPORTUNITY', { credentials: 'include' }),
      fetch('/api/v1/companies?counts=true', { credentials: 'include' }),
      fetch('/api/v1/people?counts=true', { credentials: 'include' })
    ]);

    const [leadsData, prospectsData, opportunitiesData, companiesData, peopleData] = await Promise.all([
      leadsResponse.json(),
      prospectsResponse.json(),
      opportunitiesResponse.json(),
      companiesResponse.json(),
      peopleResponse.json()
    ]);

    return {
      leads: leadsData.success ? (leadsData.data.LEAD || 0) : 0,
      prospects: prospectsData.success ? (prospectsData.data.PROSPECT || 0) : 0,
      opportunities: opportunitiesData.success ? (opportunitiesData.data.OPPORTUNITY || 0) : 0,
      accounts: companiesData.success ? (companiesData.data.total || 0) : 0,
      contacts: peopleData.success ? (peopleData.data.total || 0) : 0,
      clients: companiesData.success ? (companiesData.data.CLIENT || 0) : 0
    };
  }, [workspaceId, userId]);

  const cacheKey = 'pipeline-counts';

  return useAdrataData(cacheKey, fetchFn, {
    ...options,
    workspaceId,
    userId,
    priority: 'high',
    ttl: 60000, // 1 minute for counts
    tags: ['pipeline-counts', workspaceId || '', userId || '']
  });
}
