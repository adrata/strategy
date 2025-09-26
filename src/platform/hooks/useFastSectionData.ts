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
 * Provides instant section data for middle panel
 */
export function useFastSectionData(section: string, limit: number = 30): UseFastSectionDataReturn {
  console.log(`🚀 [FAST SECTION DATA] Hook initialized for section: ${section}, limit: ${limit}`);
  
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const workspaceId = authUser?.activeWorkspaceId || authUser?.workspaces?.[0]?.id;
  const userId = authUser?.id;

  const fetchSectionData = useCallback(async () => {
    console.log(`🔍 [FAST SECTION DATA] Hook called for ${section}:`, {
      workspaceId: !!workspaceId,
      userId: !!userId,
      authLoading,
      hasWorkspaceId: !!workspaceId,
      hasUserId: !!userId
    });
    
    if (!workspaceId || !userId || authLoading) {
      console.log(`⏳ [FAST SECTION DATA] Skipping fetch - missing requirements:`, {
        workspaceId: !!workspaceId,
        userId: !!userId,
        authLoading
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🚀 [FAST SECTION DATA] Loading ${section} data for workspace:`, workspaceId);
      
      const response = await fetch(`/api/data/section?section=${section}&limit=${limit}&workspaceId=${workspaceId}&userId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setData(result.data.data || []);
        setCount(result.data.count || 0);
        console.log(`⚡ [FAST SECTION DATA] Loaded ${section} data:`, {
          count: result.data.count,
          items: result.data.data?.length,
          responseTime: result.meta?.responseTime
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
  }, [section, limit, workspaceId, userId, authLoading]);

  // Load section data when section/workspace/user changes
  useEffect(() => {
    fetchSectionData();
  }, [fetchSectionData]);

  return {
    data,
    loading,
    error,
    count,
    refresh: fetchSectionData
  };
}
