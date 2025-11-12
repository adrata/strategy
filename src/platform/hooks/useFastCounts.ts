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
  partners: number | string;
  sellers: number | string;
  speedrun: number | string;
  speedrunReady: number | string;
  speedrunRemaining: number | string;
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
    partners: 0,
    sellers: 0,
    speedrun: 0,
    speedrunReady: 0,
    speedrunRemaining: 0,
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
    // Enhanced auth state checking - wait for auth to be fully loaded
    if (authLoading) {
      // Still loading auth, don't attempt fetch yet
      return;
    }
    
    if (!authUser) {
      // No authenticated user - clear counts and set error
      setCounts({
        leads: 0,
        prospects: 0,
        opportunities: 0,
        companies: 0,
        people: 0,
        clients: 0,
        partners: 0,
        sellers: 0,
        speedrun: 0,
        speedrunReady: 0,
        metrics: 0,
        chronicle: 0
      });
      setError('Authentication required - please sign in');
      setLoading(false);
      return;
    }
    
    if (!workspaceId || !userId) {
      console.log('🚀 [FAST COUNTS] Skipping fetch - missing workspace/user ID:', {
        workspaceId: !!workspaceId,
        userId: !!userId,
        authLoading,
        hasAuthUser: !!authUser
      });
      setLoading(false);
      return;
    }

    // Set loading to true only if we're forcing refresh or don't have cached data
    // Use functional update to access current counts state
    setLoading(prevLoading => {
      // Only set to true if we're forcing refresh or currently not loading
      if (forceRefresh || !prevLoading) {
        return true;
      }
      return prevLoading;
    });
    setError(null);

    // Add timeout to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      console.warn('⏰ [FAST COUNTS] Fetch timeout - setting loading to false');
      setLoading(false);
    }, 10000); // 10 second timeout

    // Create AbortController for timeout handling
    const abortController = new AbortController();
    const abortTimeoutId = setTimeout(() => {
      abortController.abort();
    }, 8000); // 8 second timeout for fetch

    try {
      // Debug authentication context in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [FAST COUNTS] Auth context:', {
          hasAuthUser: !!authUser,
          userId,
          workspaceId,
          hasCookies: typeof window !== 'undefined' && document.cookie.length > 0,
          cookieCount: typeof window !== 'undefined' ? document.cookie.split(';').length : 0,
          hasAuthToken: typeof window !== 'undefined' ? document.cookie.includes('auth-token') : false
        });
      }
      
      // Check if we're in PartnerOS mode - check both sessionStorage and URL
      const isPartnerOS = typeof window !== 'undefined' && (
        sessionStorage.getItem('activeSubApp') === 'partneros' ||
        window.location.pathname.includes('/partner-os/')
      );
      const partnerosParam = isPartnerOS ? '&partneros=true' : '';
      
      if (isPartnerOS) {
        console.log('🚀 [FAST COUNTS] PartnerOS mode detected - filtering counts by relationshipType PARTNER/FUTURE_PARTNER');
      }
      
      // 🚀 PERFORMANCE: Use the unified counts API for all counts including speedrun
      const countsResponse = await fetch(`/api/data/counts${forceRefresh ? `?t=${Date.now()}${partnerosParam}` : partnerosParam ? `?${partnerosParam.slice(1)}` : ''}`, {
        credentials: 'include',
        signal: abortController.signal
      });

      clearTimeout(timeoutId); // Clear timeout if request succeeds
      clearTimeout(abortTimeoutId); // Clear abort timeout

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
        partners: counts.partners ?? 0,
        
        // Core entities
        companies: counts.companies ?? 0,
        people: counts.people ?? 0,
        
        // Speedrun: Use the speedrun count directly from counts API
        speedrun: counts.speedrun ?? 0,
        speedrunReady: counts.speedrunReady ?? 0,
        speedrunRemaining: counts.speedrunRemaining ?? counts.speedrunReady ?? 0, // Use remaining count, fallback to ready
        
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
      console.log('✅ [FAST COUNTS] Loaded counts:', newCounts);

    } catch (err) {
      clearTimeout(timeoutId); // Clear timeout on error
      clearTimeout(abortTimeoutId); // Clear abort timeout on error
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch counts';
      
      // Check if this is an authentication error
      if (errorMessage.includes('401') || errorMessage.includes('Authentication') || errorMessage.includes('Unauthorized')) {
        // Authentication failure - clear counts and set user-friendly error
        setCounts({
          leads: 0,
          prospects: 0,
          opportunities: 0,
          companies: 0,
          people: 0,
          clients: 0,
          partners: 0,
          sellers: 0,
          speedrun: 0,
          speedrunReady: 0,
          metrics: 0,
          chronicle: 0
        });
        setError('Authentication required - please sign in');
        console.warn('🔐 [FAST COUNTS] Authentication required');
      } else if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
        // Network timeout - keep existing counts, log warning
        console.warn('⏰ [FAST COUNTS] Request timeout - keeping existing counts');
        setError('Request timeout - please try again');
      } else {
        // Other errors - log but don't clear data
        console.error('❌ [FAST COUNTS] Error:', errorMessage);
        setError(errorMessage);
      }
    } finally {
      clearTimeout(timeoutId); // Ensure timeout is cleared
      clearTimeout(abortTimeoutId); // Ensure abort timeout is cleared
      setLoading(false);
    }
  }, [workspaceId, userId, authLoading, authUser]);

  // 🚀 PERFORMANCE: Load counts when workspace/user is available
  useEffect(() => {
    // Wait for auth to fully load before attempting fetch
    if (authLoading) return;
    
    // If no auth user after loading completes, don't fetch
    if (!authUser || !workspaceId || !userId) {
      setLoading(false);
      return;
    }

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
        partners: 0,
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
          partners: 0,
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
