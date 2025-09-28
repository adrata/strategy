/**
 * 🚀 FAST SECTION DATA HOOK - LIGHTNING SPEED SECTION LOADING
 * 
 * Ultra-fast hook for loading specific section data only
 * Replaces heavy acquisition data for middle panel sections
 * 
 * Performance Target: <500ms response time per section
 */

import { useState, useEffect, useCallback } from 'react';
import { useUnifiedAuth } from '@/platform/auth-unified';

interface UseFastSectionDataReturn {
  data: any[];
  loading: boolean;
  error: string | null;
  count: number;
  refresh: () => Promise<void>;
}

/**
 * 🚀 FAST SECTION DATA HOOK
 * Provides instant section data for middle panel with smart caching
 */
export function useFastSectionData(section: string, limit: number = 30): UseFastSectionDataReturn {
  console.log(`🚀 [FAST SECTION DATA] Hook initialized for section: ${section}, limit: ${limit}`);
  
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [loadedSections, setLoadedSections] = useState<Set<string>>(new Set());

  const workspaceId = authUser?.activeWorkspaceId || authUser?.workspaces?.[0]?.id;
  const userId = authUser?.id;

  const fetchSectionData = useCallback(async () => {
    console.log(`🔍 [FAST SECTION DATA] Hook called for ${section}:`, {
      workspaceId: !!workspaceId,
      userId: !!userId,
      authLoading,
      hasWorkspaceId: !!workspaceId,
      hasUserId: !!userId,
      alreadyLoaded: loadedSections.has(section),
      loadedSections: Array.from(loadedSections),
      actualWorkspaceId: workspaceId,
      actualUserId: userId
    });
    
    if (!workspaceId || !userId || authLoading) {
      console.log(`⏳ [FAST SECTION DATA] Skipping fetch - missing requirements:`, {
        workspaceId: !!workspaceId,
        userId: !!userId,
        authLoading,
        actualWorkspaceId: workspaceId,
        actualUserId: userId
      });
      setLoading(false);
      return;
    }

    // 🚀 PERFORMANCE: Skip if we already loaded this section
    if (loadedSections.has(section)) {
      console.log(`⚡ [FAST SECTION DATA] Skipping fetch - section ${section} already loaded`);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🚀 [FAST SECTION DATA] Loading ${section} data for workspace:`, workspaceId);
      
      const url = `/api/data/section?section=${section}&limit=${limit}&workspaceId=${workspaceId}&userId=${userId}`;
      console.log(`🔗 [FAST SECTION DATA] Making request to:`, url);
      
      const response = await fetch(url);
      
      console.log(`📡 [FAST SECTION DATA] Response status:`, response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [FAST SECTION DATA] API Error:`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setData(result.data.data || []);
        setCount(result.data.totalCount || result.data.count || 0); // Use totalCount for pagination
        setLoadedSections(prev => new Set(prev).add(section));
        console.log(`⚡ [FAST SECTION DATA] Loaded ${section} data:`, {
          count: result.data.count,
          totalCount: result.data.totalCount,
          items: result.data.data?.length,
          responseTime: result.meta?.responseTime,
          firstItem: result.data.data?.[0] ? {
            rank: result.data.data[0].rank,
            name: result.data.data[0].name,
            company: result.data.data[0].company?.name || result.data.data[0].company
          } : null
        });
      } else {
        throw new Error(result.error || 'Failed to load section data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`❌ [FAST SECTION DATA] Error loading ${section}:`, errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [section, limit, workspaceId, userId, authLoading, loadedSections]);

  // 🚀 PERFORMANCE: Only load section data when section changes and not already loaded
  useEffect(() => {
    if (workspaceId && userId && !authLoading && !loadedSections.has(section)) {
      fetchSectionData();
    }
  }, [section, workspaceId, userId, authLoading, loadedSections, fetchSectionData]);

  // 🚀 PERFORMANCE: Reset loaded sections when workspace changes
  useEffect(() => {
    console.log(`🔄 [FAST SECTION DATA] Resetting loaded sections for ${section} due to workspace/user change`);
    setLoadedSections(new Set());
  }, [workspaceId, userId]);

  // 🔧 DEBUG: Force refresh for people section to fix caching issue
  useEffect(() => {
    if (section === 'people') {
      console.log(`🔧 [FAST SECTION DATA] Force clearing cache for people section`);
      setLoadedSections(prev => {
        const newSet = new Set(prev);
        newSet.delete('people');
        return newSet;
      });
    }
  }, [section]);

  return {
    data,
    loading,
    error,
    count,
    refresh: fetchSectionData
  };
}
