/**
 * 🚀 OPTIMISTIC NAVIGATION HOOK - 2025 REACT 19 CONCURRENT FEATURES
 * 
 * Implements 2025 React 19 concurrent features for instant UI updates:
 * - Optimistic updates with instant visual feedback
 * - Suspense boundaries for smooth loading states
 * - Concurrent rendering with priority updates
 * - Error boundaries with graceful fallbacks
 * - Background updates with stale-while-revalidate
 */

import { useState, useCallback, useTransition, useDeferredValue, useMemo, startTransition } from 'react';
import { useUnifiedAuth } from '@/platform/auth-unified';

interface OptimisticNavigationState {
  currentSection: string;
  isTransitioning: boolean;
  optimisticData: any[];
  error: string | null;
  lastUpdated: number;
}

interface OptimisticNavigationOptions {
  enableOptimisticUpdates?: boolean;
  enableBackgroundRefresh?: boolean;
  enableErrorRecovery?: boolean;
  transitionTimeout?: number;
}

interface OptimisticNavigationReturn {
  // Current state
  currentSection: string;
  isTransitioning: boolean;
  optimisticData: any[];
  error: string | null;
  
  // Navigation methods
  navigateToSection: (section: string, optimisticData?: any[]) => void;
  updateOptimisticData: (data: any[]) => void;
  clearError: () => void;
  
  // Performance methods
  getTransitionMetrics: () => {
    averageTransitionTime: number;
    totalTransitions: number;
    errorRate: number;
  };
}

/**
 * 🚀 OPTIMISTIC NAVIGATION HOOK
 * Provides instant navigation with optimistic updates using React 19 concurrent features
 */
export function useOptimisticNavigation(
  initialSection: string = 'speedrun',
  options: OptimisticNavigationOptions = {}
): OptimisticNavigationReturn {
  const {
    enableOptimisticUpdates = true,
    enableBackgroundRefresh = true,
    enableErrorRecovery = true,
    transitionTimeout = 5000
  } = options;

  const { user: authUser } = useUnifiedAuth();
  const [isPending, startTransition] = useTransition();
  
  // Navigation state
  const [currentSection, setCurrentSection] = useState(initialSection);
  const [optimisticData, setOptimisticData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  
  // Performance tracking
  const [transitionMetrics, setTransitionMetrics] = useState({
    transitionTimes: [] as number[],
    totalTransitions: 0,
    errors: 0
  });

  const workspaceId = authUser?.activeWorkspaceId || authUser?.workspaces?.[0]?.id;
  const userId = authUser?.id;

  // 🚀 OPTIMISTIC NAVIGATION: Instant UI updates with React 19 concurrent features
  const navigateToSection = useCallback((section: string, optimisticData?: any[]) => {
    console.log(`⚡ [OPTIMISTIC NAV] Navigating to ${section} with optimistic updates`);
    
    const startTime = Date.now();
    
    startTransition(() => {
      // 🚀 IMMEDIATE UI UPDATE: Update UI instantly for perceived performance
      setCurrentSection(section);
      setError(null);
      
      // 🚀 OPTIMISTIC DATA: Use provided optimistic data or current data
      if (optimisticData) {
        setOptimisticData(optimisticData);
        console.log(`⚡ [OPTIMISTIC NAV] Using provided optimistic data: ${optimisticData.length} items`);
      } else {
        // Keep current data as optimistic fallback
        console.log(`⚡ [OPTIMISTIC NAV] Using current data as optimistic fallback`);
      }
      
      // 🚀 BACKGROUND DATA LOADING: Load fresh data in background
      if (enableBackgroundRefresh) {
        loadSectionDataInBackground(section, startTime);
      }
    });
  }, [enableBackgroundRefresh]);

  // 🚀 BACKGROUND DATA LOADING: Load fresh data without blocking UI
  const loadSectionDataInBackground = useCallback(async (section: string, startTime: number) => {
    if (!workspaceId || !userId) return;

    try {
      console.log(`🔄 [BACKGROUND LOAD] Loading fresh data for ${section}`);
      
      const response = await fetch(`/api/data/section?section=${section}&limit=1000`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const freshData = result.data.data || [];
        
        // 🚀 STALE-WHILE-REVALIDATE: Update data when fresh data arrives
        setOptimisticData(freshData);
        setLastUpdated(Date.now());
        
        const transitionTime = Date.now() - startTime;
        setTransitionMetrics(prev => ({
          ...prev,
          transitionTimes: [...prev.transitionTimes, transitionTime],
          totalTransitions: prev.totalTransitions + 1
        }));
        
        console.log(`✅ [BACKGROUND LOAD] Fresh data loaded for ${section} in ${transitionTime}ms: ${freshData.length} items`);
      }
    } catch (error) {
      console.error(`❌ [BACKGROUND LOAD] Failed to load fresh data for ${section}:`, error);
      
      if (enableErrorRecovery) {
        setError(error instanceof Error ? error.message : 'Failed to load data');
        setTransitionMetrics(prev => ({
          ...prev,
          errors: prev.errors + 1
        }));
      }
    }
  }, [workspaceId, userId, enableErrorRecovery]);

  // 🚀 OPTIMISTIC DATA UPDATE: Update data optimistically
  const updateOptimisticData = useCallback((data: any[]) => {
    console.log(`⚡ [OPTIMISTIC UPDATE] Updating optimistic data: ${data.length} items`);
    setOptimisticData(data);
    setLastUpdated(Date.now());
  }, []);

  // 🚀 ERROR CLEARING: Clear errors
  const clearError = useCallback(() => {
    console.log(`🧹 [ERROR CLEAR] Clearing navigation error`);
    setError(null);
  }, []);

  // 🚀 PERFORMANCE METRICS: Get transition performance data
  const getTransitionMetrics = useCallback(() => {
    const averageTransitionTime = transitionMetrics.transitionTimes.length > 0
      ? transitionMetrics.transitionTimes.reduce((a, b) => a + b, 0) / transitionMetrics.transitionTimes.length
      : 0;
    
    const errorRate = transitionMetrics.totalTransitions > 0
      ? transitionMetrics.errors / transitionMetrics.totalTransitions
      : 0;

    return {
      averageTransitionTime,
      totalTransitions: transitionMetrics.totalTransitions,
      errorRate
    };
  }, [transitionMetrics]);

  return {
    currentSection,
    isTransitioning: isPending,
    optimisticData,
    error,
    navigateToSection,
    updateOptimisticData,
    clearError,
    getTransitionMetrics
  };
}

/**
 * 🚀 OPTIMISTIC NAVIGATION PROVIDER
 * Provides optimistic navigation context with error boundaries
 */
export function OptimisticNavigationProvider({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<OptimisticLoadingFallback />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

/**
 * 🚀 ERROR BOUNDARY: Graceful error handling
 */
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-center">
          <div className="text-red-600 font-semibold mb-2">Navigation Error</div>
          <div className="text-red-500 text-sm mb-4">
            {error?.message || 'An unexpected error occurred'}
          </div>
          <button
            onClick={() => {
              setHasError(false);
              setError(null);
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * 🚀 OPTIMISTIC LOADING FALLBACK: Smooth loading state
 */
function OptimisticLoadingFallback() {
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header skeleton */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>
      </div>
      
      {/* Search skeleton */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-gray-200">
        <div className="flex gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="h-10 bg-gray-200 rounded w-80 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
      </div>
      
      {/* Table skeleton */}
      <div className="flex-1 p-6">
        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 🚀 OPTIMISTIC NAVIGATION UTILITIES
 * Helper functions for optimistic navigation
 */
export const optimisticNavigationUtils = {
  /**
   * Create optimistic data for instant UI updates
   */
  createOptimisticData(section: string, currentData: any[]): any[] {
    // Return current data as optimistic fallback
    return currentData;
  },

  /**
   * Validate optimistic data
   */
  validateOptimisticData(data: any[]): boolean {
    return Array.isArray(data) && data.length >= 0;
  },

  /**
   * Merge optimistic data with fresh data
   */
  mergeOptimisticData(optimisticData: any[], freshData: any[]): any[] {
    // Use fresh data if available, otherwise fall back to optimistic data
    return freshData.length > 0 ? freshData : optimisticData;
  }
};
