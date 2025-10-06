"use client";

/**
 * 🚀 ADRATA UNIFIED DATA HOOK - 2025 WORLD-CLASS
 * 
 * Single source of truth for ALL data fetching across the platform
 * Replaces: useUnifiedData, useAcquisitionOSData, usePipelineData, useDataService, useSpeedrunData
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
import { authFetch } from '@/platform/auth-fetch';

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
    
    // 🔐 SECURITY: Use authenticated fetch instead of passing credentials in URL
    const response = await authFetch(
      `/api/data/unified?type=${section}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${section} data`);
    }
    
    const result = await response.json();
    
    // 🔍 DEBUG: Log the API response structure
    console.log(`🔍 [usePipelineData] API response for ${section}:`, {
      success: result.success,
      dataKeys: result.data ? Object.keys(result.data) : [],
      sectionData: result.data?.[section]?.slice(0, 2) || [],
      fullResponse: result
    });
    
    // The API returns data directly in result.data, not nested under section
    return result.data || [];
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

    // 🔐 SECURITY: Use authenticated fetch instead of passing credentials in URL
    const response = await authFetch('/api/data/unified', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    return result.data || {
      leads: [],
      prospects: [],
      opportunities: [],
      accounts: [],
      contacts: [],
      partnerships: [],
      clients: [],
      buyerGroups: [],
      catalyst: [],
      calendar: [],
      champions: [],
      decisionMakers: [],
      speedrunItems: [],
    };
  }, [workspaceId, userId]);

  const cacheKey = 'acquisition-os';

  return useAdrataData(cacheKey, fetchFn, {
    ...options,
    workspaceId,
    userId,
    priority: 'high',
    tags: ['acquisition-os', workspaceId || '', userId || '']
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

    // 🔐 SECURITY: Use authenticated fetch instead of passing credentials in URL
    const response = await authFetch(`/api/data/unified?type=speedrun&action=get`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch speedrun data');
    }
    
    const result = await response.json();
    return result.data || [];
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

    // 🔐 SECURITY: Use authenticated fetch instead of passing credentials in URL
    const response = await authFetch(`/api/data/unified?dashboardOnly=true`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch pipeline counts');
    }
    
    const result = await response.json();
    return result.data || {
      leads: 0,
      prospects: 0,
      opportunities: 0,
      accounts: 0,
      contacts: 0,
      clients: 0
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
