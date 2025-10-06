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
import { authFetch } from '@/platform/auth-fetch';

interface FastCounts {
  leads: number;
  prospects: number;
  opportunities: number;
  companies: number;
  people: number;
  clients: number;
  partners: number;
  sellers: number; // 🆕 FIX: Add sellers count
  speedrun: number;
}

interface UseFastCountsReturn {
  counts: FastCounts;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  forceRefresh: () => Promise<void>;
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
    sellers: 0, // 🆕 FIX: Add sellers count
    speedrun: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const workspaceId = authUser?.activeWorkspaceId || authUser?.workspaces?.[0]?.id;
  const userId = authUser?.id;

  const fetchCounts = useCallback(async (forceRefresh = false) => {
    console.log('🔍 [FAST COUNTS] fetchCounts called with:', { workspaceId, userId, authLoading, forceRefresh });
    console.log('🔍 [FAST COUNTS] Auth user:', authUser?.id, 'Workspace:', authUser?.activeWorkspaceId);
    
    if (!workspaceId || !userId || authLoading) {
      console.log('🔍 [FAST COUNTS] Skipping fetch - missing requirements:', { workspaceId, userId, authLoading });
      setLoading(false);
      return;
    }

    // 🔐 AUTH: Check if user is authenticated
    if (!authUser) {
      console.log('🔐 [FAST COUNTS] No authenticated user - skipping fetch');
      setLoading(false);
      setError('Authentication required');
      return;
    }

    // 🚀 PERFORMANCE: Only fetch if we haven't loaded counts yet, unless force refresh
    if (hasLoaded && !forceRefresh) {
      console.log('⚡ [FAST COUNTS] Skipping fetch - already loaded');
      return;
    }

    // 🚀 PERFORMANCE: Prevent rapid successive calls, but allow force refresh
    if (loading && !forceRefresh) {
      console.log('⚡ [FAST COUNTS] Already loading - skipping duplicate call');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🚀 [FAST COUNTS] Loading counts for workspace:', workspaceId);
      
      // 🔐 SECURITY: Use authenticated fetch instead of passing credentials in URL
      // Add cache-busting parameter for force refresh
      const url = forceRefresh ? `/api/data/counts?t=${Date.now()}` : '/api/data/counts';
      const response = await authFetch(url);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required - please sign in');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🔍 [FAST COUNTS] API response:', data);
      
      if (data.success && data.data) {
        setCounts(data.data);
        setHasLoaded(true);
        console.log('⚡ [FAST COUNTS] Loaded counts:', data.data);
        console.log('🔍 [FAST COUNTS] Sellers count specifically:', data.data.sellers);
        console.log('🔍 [FAST COUNTS] All counts loaded successfully:', {
          leads: data.data.leads,
          companies: data.data.companies,
          people: data.data.people,
          sellers: data.data.sellers,
          speedrun: data.data.speedrun
        });
      } else {
        console.error('❌ [FAST COUNTS] API returned error:', data.error);
        console.error('❌ [FAST COUNTS] Full API response:', data);
        throw new Error(data.error || 'Failed to load counts');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ [FAST COUNTS] Error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, userId, authLoading, authUser]);

  // 🚀 PERFORMANCE: Only load counts once when workspace/user is available
  useEffect(() => {
    if (workspaceId && userId && !authLoading && !hasLoaded) {
      // Clear any existing cache on first load to ensure fresh data
      if (typeof window !== 'undefined') {
        // Clear localStorage cache
        const keys = Object.keys(localStorage);
        const cacheKeys = keys.filter(key => key.includes('counts') || key.includes('fastCounts'));
        cacheKeys.forEach(key => localStorage.removeItem(key));
      }
      console.log('🚀 [FAST COUNTS] Starting initial load for workspace:', workspaceId);
      fetchCounts();
    }
  }, [workspaceId, userId, authLoading]);

  // 🚀 PERFORMANCE: Add timeout to prevent stuck loading state
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.log('⏰ [FAST COUNTS] Loading timeout - resetting loading state');
        setLoading(false);
        setError('Request timeout');
        // Don't auto-retry to prevent infinite loops
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [loading]);

  // 🚀 PERFORMANCE: Track workspace changes to reset loaded state only when needed
  const [lastWorkspaceId, setLastWorkspaceId] = useState<string | null>(null);
  const [lastUserId, setLastUserId] = useState<string | null>(null);
  
  useEffect(() => {
    // Only reset if workspace or user actually changed
    if (workspaceId !== lastWorkspaceId || userId !== lastUserId) {
      console.log('🔄 [FAST COUNTS] Workspace/user changed, resetting loaded state');
      setHasLoaded(false);
      setCounts({
        leads: 0,
        prospects: 0,
        opportunities: 0,
        companies: 0,
        people: 0,
        clients: 0,
        partners: 0,
        sellers: 0, // 🆕 FIX: Add sellers count to reset
        speedrun: 0
      }); // Reset counts to prevent showing stale data
      setLastWorkspaceId(workspaceId);
      setLastUserId(userId);
    }
  }, [workspaceId, userId, lastWorkspaceId, lastUserId]);

  // 🧹 LISTEN FOR WORKSPACE SWITCH EVENTS: Clear cache when workspace switch event is fired
  useEffect(() => {
    const handleWorkspaceSwitch = (event: CustomEvent) => {
      const { workspaceId: newWorkspaceId } = event.detail;
      if (newWorkspaceId && newWorkspaceId !== workspaceId) {
        console.log(`🔄 [FAST COUNTS] Received workspace switch event for: ${newWorkspaceId}`);
        setHasLoaded(false);
        setCounts({
          leads: 0,
          prospects: 0,
          opportunities: 0,
          companies: 0,
          people: 0,
          clients: 0,
          partners: 0,
          sellers: 0, // 🆕 FIX: Add sellers count to reset
          speedrun: 0
        });
        // Force refresh for new workspace
        fetchCounts();
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
    refresh: fetchCounts,
    forceRefresh: () => fetchCounts(true)
  };
}
