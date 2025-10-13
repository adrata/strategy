/**
 * 🚀 FAST COUNTS HOOK - LIGHTNING SPEED NAVIGATION COUNTS
 * 
 * Ultra-fast hook for left panel navigation counts only
 * Uses new v1 API with streamlined schema
 * 
 * Performance Target: <50ms response time
 */

import { useState, useEffect, useCallback } from 'react';
import { useUnifiedAuth } from '@/platform/auth';

interface FastCounts {
  leads: number | string;
  prospects: number | string;
  opportunities: number | string;
  companies: number | string;
  people: number | string;
  clients: number | string;
  sellers: number | string;
  speedrun: number | string;
  metrics: number | string;
  chronicle: number | string;
}

interface UseFastCountsReturn {
  counts: FastCounts;
  loading: boolean;
  error: string | null;
  forceRefresh: () => Promise<void>;
}

/**
 * 🚀 FAST COUNTS HOOK
 * Provides instant navigation counts for left panel using v1 API
 */
export function useFastCounts(): UseFastCountsReturn {
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const [counts, setCounts] = useState<FastCounts>({
    leads: 0,
    prospects: 0,
    opportunities: 0,
    companies: 0,
    people: 0,
    clients: 0,
    sellers: 0,
    speedrun: 0,
    metrics: 0,
    chronicle: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = authUser?.activeWorkspaceId || authUser?.workspaces?.[0]?.id;
  const userId = authUser?.id;
  
  // Track last workspace ID to detect workspace changes
  const [lastWorkspaceId, setLastWorkspaceId] = useState<string | null>(null);
  
  // 🎯 SPEEDRUN SETTING: Configurable top N ranked people (default 50)
  const SPEEDRUN_LIMIT = 50; // This could be made configurable via settings

  const fetchCounts = useCallback(async (forceRefresh = false) => {
    if (!workspaceId || !userId || authLoading || !authUser) {
      console.log('🚀 [FAST COUNTS] Skipping fetch - missing auth data:', {
        workspaceId: !!workspaceId,
        userId: !!userId,
        authLoading,
        hasAuthUser: !!authUser
      });
      setLoading(false);
      return;
    }

    // Only set loading to true if we don't have data yet or forcing refresh
    if (Object.keys(counts).length === 0 || forceRefresh) {
      setLoading(true);
    }
    setError(null);

    try {
      // console.log('🚀 [FAST COUNTS] Loading counts for workspace:', workspaceId);
      
      // 🚀 PERFORMANCE: Use the unified counts API for all counts including speedrun
      const countsResponse = await fetch(`/api/data/counts${forceRefresh ? `?t=${Date.now()}` : ''}`, {
        credentials: 'include'
      });

      if (!countsResponse.ok) {
        throw new Error(`Counts API returned ${countsResponse.status}: ${countsResponse.statusText}`);
      }

      const countsData = await countsResponse.json();

      if (!countsData.success) {
        throw new Error('Failed to fetch counts from counts API');
      }

      // 🎯 MAP TO LEFT PANEL STRUCTURE using unified counts API
      const counts = countsData.data;

      const newCounts: FastCounts = {
        // Pipeline stages (using counts API data)
        leads: counts.leads ?? 0,
        prospects: counts.prospects ?? 0,
        opportunities: counts.opportunities ?? 0,
        clients: counts.clients ?? 0,
        
        // Core entities
        companies: counts.companies ?? 0,
        people: counts.people ?? 0,
        
        // Speedrun: Use the speedrun count directly from counts API
        speedrun: counts.speedrun ?? 0,
        
        // Sellers: Use the sellers count from counts API
        sellers: counts.sellers ?? 0,
        
        // New sections
        metrics: counts.metrics ?? 0,
        chronicle: counts.chronicle ?? 0
      };

      setCounts(newCounts);
      // Persist to localStorage for instant hydration next load
      try {
        const storageKey = `adrata-fast-counts-${workspaceId}`;
        localStorage.setItem(storageKey, JSON.stringify({
          counts: newCounts,
          workspaceId: workspaceId, // Store workspaceId for validation
          ts: Date.now()
        }));
      } catch (e) {
        // ignore storage failures
      }
      // console.log('✅ [FAST COUNTS] Loaded counts:', newCounts);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch counts';
      console.error('❌ [FAST COUNTS] Error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, userId, authLoading, authUser]);

  // 🚀 PERFORMANCE: Load counts when workspace/user is available
  useEffect(() => {
    if (!workspaceId || !userId || authLoading) return;

    // 🔄 WORKSPACE CHANGE DETECTION: Clear counts if workspace changed
    if (lastWorkspaceId && lastWorkspaceId !== workspaceId) {
      console.log(`🔄 [FAST COUNTS] Workspace changed from ${lastWorkspaceId} to ${workspaceId}, clearing counts`);
      setCounts({
        leads: 0,
        prospects: 0,
        opportunities: 0,
        companies: 0,
        people: 0,
        clients: 0,
        sellers: 0,
        speedrun: 0,
        metrics: 0,
        chronicle: 0
      });
      setLoading(true);
      setError(null);
    }

    // Instant hydration from cache if present
    let hasCachedData = false;
    try {
      const storageKey = `adrata-fast-counts-${workspaceId}`;
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Check if cache is less than 5 minutes old AND belongs to current workspace
        const cacheAge = Date.now() - (parsed?.ts || 0);
        const maxCacheAge = 5 * 60 * 1000; // 5 minutes
        const workspaceMatches = parsed?.workspaceId === workspaceId;
        
        if (parsed?.counts && cacheAge < maxCacheAge && workspaceMatches) {
          setCounts(parsed.counts as FastCounts);
          setLoading(false);
          hasCachedData = true;
        } else {
          // Cache is too old or workspace mismatch, clear it
          localStorage.removeItem(storageKey);
        }
      }
    } catch (e) {
      // ignore storage failures
    }

    // Only set loading to true if we don't have cached data
    if (!hasCachedData) {
      setLoading(true);
    }

    // Update last workspace ID
    setLastWorkspaceId(workspaceId);

    // Always revalidate in background
    fetchCounts();
  }, [workspaceId, userId, authLoading, fetchCounts, lastWorkspaceId]);

  const forceRefresh = useCallback(async () => {
    // Clear localStorage cache before refreshing
    if (workspaceId) {
      const storageKey = `adrata-fast-counts-${workspaceId}`;
      localStorage.removeItem(storageKey);
    }
    await fetchCounts(true);
  }, [fetchCounts, workspaceId]);

  // 🚀 CACHE INVALIDATION: Listen for refresh events from advance operations
  useEffect(() => {
    const handleRefreshCounts = (event: CustomEvent) => {
      console.log('🔄 [FAST COUNTS] Received refresh event:', event.detail);
      forceRefresh();
    };

    window.addEventListener('refresh-counts', handleRefreshCounts as EventListener);
    
    return () => {
      window.removeEventListener('refresh-counts', handleRefreshCounts as EventListener);
    };
  }, [forceRefresh]);

  // 🔄 WORKSPACE SWITCH EVENTS: Listen for workspace switch events to clear cache
  useEffect(() => {
    const handleWorkspaceSwitch = (event: CustomEvent) => {
      const { workspaceId: newWorkspaceId } = event.detail;
      if (newWorkspaceId && newWorkspaceId !== workspaceId) {
        console.log(`🔄 [FAST COUNTS] Received workspace switch event for: ${newWorkspaceId}, clearing counts`);
        setCounts({
          leads: 0,
          prospects: 0,
          opportunities: 0,
          companies: 0,
          people: 0,
          clients: 0,
          sellers: 0,
          speedrun: 0,
          metrics: 0,
          chronicle: 0
        });
        setLoading(true);
        setError(null);
        // Clear cache for old workspace
        if (workspaceId) {
          const storageKey = `adrata-fast-counts-${workspaceId}`;
          localStorage.removeItem(storageKey);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('adrata-workspace-switched', handleWorkspaceSwitch as EventListener);
      return () => {
        window.removeEventListener('adrata-workspace-switched', handleWorkspaceSwitch as EventListener);
      };
    }
  }, [workspaceId]);

  return {
    counts,
    loading,
    error,
    forceRefresh
  };
}
