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
    leads: '—',
    prospects: '—',
    opportunities: '—',
    companies: '—',
    people: '—',
    clients: '—',
    sellers: '—',
    speedrun: '—'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = authUser?.activeWorkspaceId || authUser?.workspaces?.[0]?.id;
  const userId = authUser?.id;
  
  // 🎯 SPEEDRUN SETTING: Configurable top N ranked people (default 50)
  const SPEEDRUN_LIMIT = 50; // This could be made configurable via settings

  const fetchCounts = useCallback(async (forceRefresh = false) => {
    if (!workspaceId || !userId || authLoading || !authUser) {
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

      const countsData = await countsResponse.json();

      if (!countsData.success) {
        throw new Error('Failed to fetch counts from counts API');
      }

      // 🎯 MAP TO LEFT PANEL STRUCTURE using unified counts API
      const counts = countsData.data;

      const newCounts: FastCounts = {
        // Pipeline stages (using counts API data)
        leads: counts.leads || '—',
        prospects: counts.prospects || '—',
        opportunities: counts.opportunities || '—',
        clients: counts.clients || '—',
        
        // Core entities
        companies: counts.companies || '—',
        people: counts.people || '—',
        
        // Speedrun: Use the speedrun count directly from counts API
        speedrun: counts.speedrun || '—',
        
        // Sellers: Use the sellers count from counts API
        sellers: counts.sellers || '—',
        
        // New sections
        metrics: counts.metrics || '—',
        chronicle: counts.chronicle || '—'
      };

      setCounts(newCounts);
      // Persist to localStorage for instant hydration next load
      try {
        const storageKey = `adrata-fast-counts-${workspaceId}`;
        localStorage.setItem(storageKey, JSON.stringify({
          counts: newCounts,
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

    // Instant hydration from cache if present
    let hasCachedData = false;
    try {
      const storageKey = `adrata-fast-counts-${workspaceId}`;
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Check if cache is less than 5 minutes old
        const cacheAge = Date.now() - (parsed?.ts || 0);
        const maxCacheAge = 5 * 60 * 1000; // 5 minutes
        
        if (parsed?.counts && cacheAge < maxCacheAge) {
          setCounts(parsed.counts as FastCounts);
          setLoading(false);
          hasCachedData = true;
        } else {
          // Cache is too old, clear it
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

    // Always revalidate in background
    fetchCounts();
  }, [workspaceId, userId, authLoading, fetchCounts]);

  const forceRefresh = useCallback(async () => {
    // Clear localStorage cache before refreshing
    if (workspaceId) {
      const storageKey = `adrata-fast-counts-${workspaceId}`;
      localStorage.removeItem(storageKey);
    }
    await fetchCounts(true);
  }, [fetchCounts, workspaceId]);

  return {
    counts,
    loading,
    error,
    forceRefresh
  };
}
