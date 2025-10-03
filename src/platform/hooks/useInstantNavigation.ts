/**
 * 🚀 INSTANT NAVIGATION HOOK - 2025 OPTIMIZED
 * 
 * Implements 2025 best practices for instant navigation:
 * - React 19 concurrent features with optimistic updates
 * - Aggressive pre-caching with stale-while-revalidate
 * - Client-side data persistence
 * - Background refresh with intelligent invalidation
 * - Next.js 15 App Router optimizations
 */

import { useState, useEffect, useCallback, useTransition, useMemo, startTransition } from 'react';
import { useUnifiedAuth } from '@/platform/auth-unified';
import { unifiedCache } from '@/platform/services/unified-cache';

interface InstantNavigationOptions {
  preloadSections?: string[];
  backgroundRefresh?: boolean;
  optimisticUpdates?: boolean;
  staleWhileRevalidate?: boolean;
  cacheTTL?: number;
}

interface SectionData {
  data: any[];
  loading: boolean;
  error: string | null;
  lastUpdated: number;
  isStale: boolean;
}

interface InstantNavigationReturn {
  // Current section data
  currentData: any[];
  currentLoading: boolean;
  currentError: string | null;
  
  // Navigation methods
  navigateToSection: (section: string) => void;
  preloadSection: (section: string) => Promise<void>;
  
  // Cache management
  invalidateSection: (section: string) => Promise<void>;
  refreshSection: (section: string) => Promise<void>;
  
  // Performance metrics
  getPerformanceMetrics: () => {
    cacheHitRate: number;
    averageLoadTime: number;
    preloadedSections: string[];
  };
}

/**
 * 🚀 INSTANT NAVIGATION HOOK
 * Provides instant navigation with aggressive pre-caching and optimistic updates
 */
export function useInstantNavigation(
  initialSection: string = 'speedrun',
  options: InstantNavigationOptions = {}
): InstantNavigationReturn {
  const {
    preloadSections = ['leads', 'prospects', 'opportunities', 'people', 'companies'],
    backgroundRefresh = true,
    optimisticUpdates = true,
    staleWhileRevalidate = true,
    cacheTTL = 300000 // 5 minutes
  } = options;

  const { user: authUser } = useUnifiedAuth();
  const [isPending, startTransition] = useTransition();
  
  // Navigation state
  const [currentSection, setCurrentSection] = useState(initialSection);
  const [sectionCache, setSectionCache] = useState<Map<string, SectionData>>(new Map());
  const [preloadedSections, setPreloadedSections] = useState<Set<string>>(new Set());
  
  // Performance tracking
  const [performanceMetrics, setPerformanceMetrics] = useState({
    cacheHits: 0,
    cacheMisses: 0,
    loadTimes: [] as number[],
    preloadedSections: [] as string[]
  });

  const workspaceId = authUser?.activeWorkspaceId || authUser?.workspaces?.[0]?.id;
  const userId = authUser?.id;

  // 🚀 OPTIMISTIC NAVIGATION: Instant UI updates with React 19 concurrent features
  const navigateToSection = useCallback((section: string) => {
    console.log(`⚡ [INSTANT NAV] Navigating to ${section} with optimistic updates`);
    
    startTransition(() => {
      // Immediate UI update for instant feedback
      setCurrentSection(section);
      
      // Check if we have cached data for instant display
      const cachedData = sectionCache.get(section);
      if (cachedData && !cachedData.loading) {
        console.log(`⚡ [INSTANT NAV] Using cached data for ${section}`);
        performanceMetrics.cacheHits++;
      } else {
        console.log(`🔄 [INSTANT NAV] Loading fresh data for ${section}`);
        performanceMetrics.cacheMisses++;
        loadSectionData(section);
      }
    });
  }, [sectionCache, performanceMetrics]);

  // 🚀 AGGRESSIVE PRE-CACHING: Load all sections in background
  const preloadSection = useCallback(async (section: string) => {
    if (preloadedSections.has(section)) {
      console.log(`⚡ [PRELOAD] Section ${section} already preloaded`);
      return;
    }

    console.log(`🚀 [PRELOAD] Preloading section ${section}`);
    const startTime = Date.now();
    
    try {
      await loadSectionData(section, true); // Background load
      setPreloadedSections(prev => new Set(prev).add(section));
      
      const loadTime = Date.now() - startTime;
      setPerformanceMetrics(prev => ({
        ...prev,
        loadTimes: [...prev.loadTimes, loadTime],
        preloadedSections: [...prev.preloadedSections, section]
      }));
      
      console.log(`✅ [PRELOAD] Section ${section} preloaded in ${loadTime}ms`);
    } catch (error) {
      console.error(`❌ [PRELOAD] Failed to preload ${section}:`, error);
    }
  }, [preloadedSections]);

  // 🚀 INTELLIGENT DATA LOADING: Multi-layer caching with stale-while-revalidate
  const loadSectionData = useCallback(async (section: string, isBackground = false) => {
    if (!workspaceId || !userId) return;

    const cacheKey = `section-${section}-${workspaceId}-${userId}`;
    
    // Set loading state
    setSectionCache(prev => new Map(prev).set(section, {
      data: prev.get(section)?.data || [],
      loading: true,
      error: null,
      lastUpdated: prev.get(section)?.lastUpdated || 0,
      isStale: false
    }));

    try {
      // 🚀 UNIFIED CACHE: Use our enterprise-grade caching system
      const data = await unifiedCache.get(
        cacheKey,
        async () => {
          console.log(`🔄 [CACHE MISS] Loading ${section} data from API`);
          const response = await fetch(`/api/data/section?section=${section}&limit=1000`);
          const result = await response.json();
          return result.data?.data || [];
        },
        {
          ttl: cacheTTL,
          priority: section === 'speedrun' ? 'critical' : 'high',
          tags: [`section:${section}`, `workspace:${workspaceId}`],
          backgroundRefresh,
          staleWhileRevalidate
        }
      );

      // Update cache with fresh data
      setSectionCache(prev => new Map(prev).set(section, {
        data,
        loading: false,
        error: null,
        lastUpdated: Date.now(),
        isStale: false
      }));

      console.log(`✅ [INSTANT NAV] Loaded ${section} data: ${data.length} items`);
    } catch (error) {
      console.error(`❌ [INSTANT NAV] Failed to load ${section}:`, error);
      setSectionCache(prev => new Map(prev).set(section, {
        data: prev.get(section)?.data || [],
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastUpdated: prev.get(section)?.lastUpdated || 0,
        isStale: true
      }));
    }
  }, [workspaceId, userId, cacheTTL, backgroundRefresh, staleWhileRevalidate]);

  // 🚀 BACKGROUND PRELOADING: Preload all sections on mount
  useEffect(() => {
    if (workspaceId && userId) {
      console.log(`🚀 [INSTANT NAV] Starting background preloading for sections:`, preloadSections);
      
      // Preload all sections in parallel
      Promise.all(
        preloadSections.map(section => preloadSection(section))
      ).then(() => {
        console.log(`✅ [INSTANT NAV] Background preloading completed`);
      });
    }
  }, [workspaceId, userId, preloadSections, preloadSection]);

  // 🚀 CACHE INVALIDATION: Smart cache invalidation
  const invalidateSection = useCallback(async (section: string) => {
    console.log(`🧹 [CACHE] Invalidating section ${section}`);
    await unifiedCache.invalidate(`section-${section}-*`);
    setSectionCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(section);
      return newCache;
    });
  }, []);

  // 🚀 FORCE REFRESH: Refresh specific section
  const refreshSection = useCallback(async (section: string) => {
    console.log(`🔄 [REFRESH] Refreshing section ${section}`);
    await invalidateSection(section);
    await loadSectionData(section);
  }, [invalidateSection, loadSectionData]);

  // 🚀 PERFORMANCE METRICS: Get comprehensive performance data
  const getPerformanceMetrics = useCallback(() => {
    const totalRequests = performanceMetrics.cacheHits + performanceMetrics.cacheMisses;
    const cacheHitRate = totalRequests > 0 ? performanceMetrics.cacheHits / totalRequests : 0;
    const averageLoadTime = performanceMetrics.loadTimes.length > 0 
      ? performanceMetrics.loadTimes.reduce((a, b) => a + b, 0) / performanceMetrics.loadTimes.length 
      : 0;

    return {
      cacheHitRate,
      averageLoadTime,
      preloadedSections: Array.from(preloadedSections)
    };
  }, [performanceMetrics, preloadedSections]);

  // Get current section data
  const currentSectionData = sectionCache.get(currentSection);
  const currentData = currentSectionData?.data || [];
  const currentLoading = currentSectionData?.loading || false;
  const currentError = currentSectionData?.error || null;

  return {
    currentData,
    currentLoading,
    currentError,
    navigateToSection,
    preloadSection,
    invalidateSection,
    refreshSection,
    getPerformanceMetrics
  };
}

/**
 * 🚀 INSTANT NAVIGATION PROVIDER
 * Provides instant navigation context to the entire app
 */
export function InstantNavigationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUnifiedAuth();
  
  // Initialize cache on mount
  useEffect(() => {
    if (user?.activeWorkspaceId) {
      unifiedCache.initialize();
    }
  }, [user?.activeWorkspaceId]);

  return <>{children}</>;
}

/**
 * 🚀 INSTANT NAVIGATION UTILITIES
 * Helper functions for instant navigation
 */
export const instantNavigationUtils = {
  /**
   * Preload all sections for a workspace
   */
  async preloadWorkspace(workspaceId: string, userId: string) {
    const sections = ['leads', 'prospects', 'opportunities', 'people', 'companies', 'speedrun'];
    
    console.log(`🚀 [PRELOAD WORKSPACE] Preloading all sections for workspace ${workspaceId}`);
    
    await Promise.all(
      sections.map(async (section) => {
        const cacheKey = `section-${section}-${workspaceId}-${userId}`;
        return unifiedCache.get(cacheKey, async () => {
          const response = await fetch(`/api/data/section?section=${section}&limit=1000`);
          const result = await response.json();
          return result.data?.data || [];
        }, {
          ttl: 300000,
          priority: 'high',
          backgroundRefresh: true
        });
      })
    );
    
    console.log(`✅ [PRELOAD WORKSPACE] All sections preloaded for workspace ${workspaceId}`);
  },

  /**
   * Clear all caches for a workspace
   */
  async clearWorkspaceCache(workspaceId: string) {
    console.log(`🧹 [CLEAR CACHE] Clearing all caches for workspace ${workspaceId}`);
    await unifiedCache.invalidate(`*${workspaceId}*`);
  },

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return unifiedCache.stats();
  }
};
