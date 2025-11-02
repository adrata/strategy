/**
 * 🚀 INSTANT NAVIGATION PROVIDER - 2025 OPTIMIZED
 * 
 * Integrates all 2025 performance optimizations:
 * - React 19 concurrent features
 * - Aggressive pre-caching
 * - Optimistic UI updates
 * - Database query optimization
 * - Background refresh
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useInstantNavigation } from '@/platform/hooks/useInstantNavigation';
import { useOptimisticNavigation } from '@/platform/hooks/useOptimisticNavigation';
import { unifiedCache } from '@/platform/services/unified-cache';
import { databaseOptimizer } from '@/platform/services/database-optimizer';

interface InstantNavigationContextType {
  // Navigation state
  currentSection: string;
  isTransitioning: boolean;
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
    databaseMetrics: any;
  };
}

const InstantNavigationContext = createContext<InstantNavigationContextType | null>(null);

/**
 * 🚀 INSTANT NAVIGATION PROVIDER
 * Provides instant navigation with all 2025 optimizations
 */
export function InstantNavigationProvider({ 
  children, 
  initialSection = 'speedrun' 
}: { 
  children: React.ReactNode;
  initialSection?: string;
}) {
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 🚀 INSTANT NAVIGATION: Core navigation with pre-caching
  const instantNav = useInstantNavigation(initialSection, {
    preloadSections: ['leads', 'prospects', 'opportunities', 'people', 'companies', 'speedrun'],
    backgroundRefresh: true,
    optimisticUpdates: true,
    staleWhileRevalidate: true,
    cacheTTL: 300000 // 5 minutes
  });
  
  // 🚀 OPTIMISTIC NAVIGATION: React 19 concurrent features
  const optimisticNav = useOptimisticNavigation(initialSection, {
    enableOptimisticUpdates: true,
    enableBackgroundRefresh: true,
    enableErrorRecovery: true,
    transitionTimeout: 5000
  });
  
  // 🚀 INITIALIZATION: Initialize all systems
  useEffect(() => {
    const initializeSystems = async () => {
      try {
        console.log('🚀 [INSTANT NAV PROVIDER] Initializing instant navigation systems...');
        
        // Initialize unified cache
        await unifiedCache.initialize();
        
        // Initialize database optimizer
        await databaseOptimizer.initialize?.();
        
        // Preload all sections
        await Promise.all([
          instantNav.preloadSection('leads'),
          instantNav.preloadSection('prospects'),
          instantNav.preloadSection('opportunities'),
          instantNav.preloadSection('people'),
          instantNav.preloadSection('companies'),
          instantNav.preloadSection('speedrun')
        ]);
        
        setIsInitialized(true);
        console.log('✅ [INSTANT NAV PROVIDER] All systems initialized successfully');
      } catch (error) {
        console.error('❌ [INSTANT NAV PROVIDER] Initialization failed:', error);
        setIsInitialized(true); // Still allow the app to work
      }
    };
    
    initializeSystems();
  }, [instantNav]);
  
  // 🚀 COMBINED NAVIGATION: Merge instant and optimistic navigation
  const navigateToSection = (section: string) => {
    console.log(`⚡ [COMBINED NAV] Navigating to ${section}`);
    
    // Use optimistic navigation for instant UI updates
    optimisticNav.navigateToSection(section);
    
    // Use instant navigation for data loading
    instantNav.navigateToSection(section);
  };
  
  // 🚀 PERFORMANCE METRICS: Combined metrics from all systems
  const getPerformanceMetrics = () => {
    const instantMetrics = instantNav.getPerformanceMetrics();
    const optimisticMetrics = optimisticNav.getTransitionMetrics();
    const databaseMetrics = databaseOptimizer.getPerformanceMetrics();
    const cacheStats = unifiedCache.stats();
    
    return {
      cacheHitRate: instantMetrics.cacheHitRate,
      averageLoadTime: instantMetrics.averageLoadTime,
      preloadedSections: instantMetrics.preloadedSections,
      databaseMetrics: {
        ...databaseMetrics,
        cacheStats
      },
      optimisticMetrics: {
        averageTransitionTime: optimisticMetrics.averageTransitionTime,
        totalTransitions: optimisticMetrics.totalTransitions,
        errorRate: optimisticMetrics.errorRate
      }
    };
  };
  
  const contextValue: InstantNavigationContextType = {
    // Current state
    currentSection: optimisticNav.currentSection,
    isTransitioning: optimisticNav.isTransitioning,
    currentData: optimisticNav.optimisticData.length > 0 ? optimisticNav.optimisticData : instantNav.currentData,
    currentLoading: instantNav.currentLoading,
    currentError: optimisticNav.error || instantNav.currentError,
    
    // Navigation methods
    navigateToSection,
    preloadSection: instantNav.preloadSection,
    invalidateSection: instantNav.invalidateSection,
    refreshSection: instantNav.refreshSection,
    
    // Performance metrics
    getPerformanceMetrics
  };
  
  if (!isInitialized) {
    return (
      <div className="h-full flex items-center justify-center bg-panel-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-muted">Initializing instant navigation...</div>
        </div>
      </div>
    );
  }
  
  return (
    <InstantNavigationContext.Provider value={contextValue}>
      {children}
    </InstantNavigationContext.Provider>
  );
}

/**
 * 🚀 USE INSTANT NAVIGATION HOOK
 * Hook to access instant navigation context
 */
export function useInstantNavigationContext(): InstantNavigationContextType {
  const context = useContext(InstantNavigationContext);
  
  if (!context) {
    throw new Error('useInstantNavigationContext must be used within InstantNavigationProvider');
  }
  
  return context;
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
    console.log(`🚀 [PRELOAD WORKSPACE] Preloading all sections for workspace ${workspaceId}`);
    
    const sections = ['leads', 'prospects', 'opportunities', 'people', 'companies', 'speedrun'];
    
    await Promise.all(
      sections.map(async (section) => {
        const cacheKey = `section-${section}-${workspaceId}-${userId}`;
        return unifiedCache.get(cacheKey, async () => {
          const response = await fetch(`/api/data/section?section=${section}&limit=10000`);
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
   * Get comprehensive performance metrics
   */
  getPerformanceMetrics() {
    return {
      cache: unifiedCache.stats(),
      database: databaseOptimizer.getPerformanceMetrics(),
      timestamp: Date.now()
    };
  }
};
