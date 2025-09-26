/**
 * 🚀 FAST COUNTS HOOK - LIGHTNING SPEED NAVIGATION COUNTS
 * 
 * Ultra-fast hook for left panel navigation counts only
 * Replaces heavy dashboard API calls for navigation purposes
 * 
 * Performance Target: <100ms response time
 */

import { useState, useEffect, useCallback } from 'react';
import { useUnifiedAuth } from '@/platform/auth-unified';

interface FastCounts {
  leads: number;
  prospects: number;
  opportunities: number;
  companies: number;
  people: number;
  clients: number;
  partners: number;
  speedrun: number;
}

interface UseFastCountsReturn {
  counts: FastCounts;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * 🚀 FAST COUNTS HOOK
 * Provides instant navigation counts for left panel with smart caching
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
    partners: 0,
    speedrun: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const workspaceId = authUser?.activeWorkspaceId || authUser?.workspaces?.[0]?.id;
  const userId = authUser?.id;

  const fetchCounts = useCallback(async () => {
    if (!workspaceId || !userId || authLoading) {
      setLoading(false);
      return;
    }

    // 🚀 PERFORMANCE: Only fetch if we haven't loaded counts yet
    if (hasLoaded) {
      console.log('⚡ [FAST COUNTS] Skipping fetch - already loaded');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🚀 [FAST COUNTS] Loading counts for workspace:', workspaceId);
      
      const response = await fetch(`/api/data/counts?workspaceId=${workspaceId}&userId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setCounts(data.data);
        setHasLoaded(true);
        console.log('⚡ [FAST COUNTS] Loaded counts:', data.data);
      } else {
        throw new Error(data.error || 'Failed to load counts');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ [FAST COUNTS] Error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, userId, authLoading, hasLoaded]);

  // 🚀 PERFORMANCE: Only load counts once when workspace/user is available
  useEffect(() => {
    if (workspaceId && userId && !authLoading && !hasLoaded) {
      fetchCounts();
    }
  }, [workspaceId, userId, authLoading, hasLoaded, fetchCounts]);

  // 🚀 PERFORMANCE: Reset loaded state when workspace changes
  useEffect(() => {
    setHasLoaded(false);
  }, [workspaceId, userId]);

  return {
    counts,
    loading,
    error,
    refresh: fetchCounts
  };
}
