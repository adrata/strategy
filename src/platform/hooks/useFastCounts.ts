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
      
      // 🚀 PERFORMANCE: Fetch all counts in parallel using v1 API
      const [companiesResponse, peopleResponse, actionsResponse, usersResponse] = await Promise.all([
        fetch(`/api/v1/companies?counts=true${forceRefresh ? `&t=${Date.now()}` : ''}`, {
          credentials: 'include'
        }),
        fetch(`/api/v1/people?counts=true${forceRefresh ? `&t=${Date.now()}` : ''}`, {
          credentials: 'include'
        }),
        fetch(`/api/v1/actions?counts=true${forceRefresh ? `&t=${Date.now()}` : ''}`, {
          credentials: 'include'
        }),
        // Get users for sellers count
        fetch(`/api/v1/users?counts=true${forceRefresh ? `&t=${Date.now()}` : ''}`, {
          credentials: 'include'
        }).catch(() => ({ json: () => Promise.resolve({ success: true, data: {} }) }))
      ]);

      const [companiesData, peopleData, actionsData, usersData] = await Promise.all([
        companiesResponse.json(),
        peopleResponse.json(),
        actionsResponse.json(),
        usersResponse.json()
      ]);

      if (!companiesData.success || !peopleData.success || !actionsData.success) {
        throw new Error('Failed to fetch counts from v1 API');
      }

      // 🎯 MAP TO LEFT PANEL STRUCTURE
      const companyCounts = companiesData.data;
      const peopleCounts = peopleData.data;
      const actionCounts = actionsData.data;
      const usersCounts = usersData.success ? usersData.data : {};

      const newCounts: FastCounts = {
        // Pipeline stages (corrected mappings)
        leads: peopleCounts.LEAD || '—',                    // People with LEAD status
        prospects: peopleCounts.PROSPECT || '—',            // People with PROSPECT status
        opportunities: companyCounts.OPPORTUNITY || '—',    // Companies with OPPORTUNITY status
        clients: companyCounts.CLIENT || '—',               // Companies with CLIENT status
        
        // Core entities
        companies: Object.values(companyCounts).reduce((sum: number, count: any) => sum + (count || 0), 0) || '—',
        people: Object.values(peopleCounts).reduce((sum: number, count: any) => sum + (count || 0), 0) || '—',
        
        // Speedrun: Top N ranked people (configurable limit)
        speedrun: Math.min(peopleCounts.ACTIVE || 0, SPEEDRUN_LIMIT) || '—',
        
        // Sellers: Users with SELLER role
        sellers: usersCounts.SELLER || '—'
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
        if (parsed?.counts) {
          setCounts(parsed.counts as FastCounts);
          setLoading(false);
          hasCachedData = true;
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

  return {
    counts,
    loading,
    error,
    forceRefresh: () => fetchCounts(true)
  };
}
