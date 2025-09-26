/**
 * 🚀 SERVER-SIDE PAGINATION HOOK
 * 
 * Implements proper server-side pagination where clicking page numbers
 * fetches new data from the server instead of client-side slicing
 */

import { useState, useEffect, useCallback } from 'react';
import { useUnifiedAuth } from '@/platform/auth-unified';

interface UseServerSidePaginationProps {
  section: string;
  pageSize?: number;
  workspaceId?: string;
  userId?: string;
}

interface UseServerSidePaginationReturn {
  data: any[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  setCurrentPage: (page: number) => void;
  refresh: () => Promise<void>;
}

export function useServerSidePagination({
  section,
  pageSize = 100,
  workspaceId,
  userId
}: UseServerSidePaginationProps): UseServerSidePaginationReturn {
  const { user: authUser } = useUnifiedAuth();
  
  // Use provided workspace/user or fallback to auth user
  const finalWorkspaceId = workspaceId || authUser?.activeWorkspaceId;
  const finalUserId = userId || authUser?.id;
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const fetchData = useCallback(async (page: number) => {
    if (!finalWorkspaceId || !finalUserId) {
      console.log('⏳ [SERVER PAGINATION] Skipping fetch - missing workspace/user');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🚀 [SERVER PAGINATION] Fetching page ${page} for ${section}:`, {
        workspaceId: finalWorkspaceId,
        userId: finalUserId,
        pageSize,
        section
      });

      // Calculate offset for database query
      const offset = (page - 1) * pageSize;
      
      const url = new URL('/api/data/unified', window.location.origin);
      url.searchParams.set('type', section);
      url.searchParams.set('action', 'get');
      url.searchParams.set('workspaceId', finalWorkspaceId);
      url.searchParams.set('userId', finalUserId);
      url.searchParams.set('pagination', JSON.stringify({
        limit: pageSize,
        offset: offset
      }));
      // Add cache busting for fresh data
      url.searchParams.set('timestamp', Date.now().toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        const sectionData = result.data[section] || [];
        const totalCount = result.data.totalCount || result.data.count || 0;
        
        setData(sectionData);
        setTotalItems(totalCount);
        setTotalPages(Math.ceil(totalCount / pageSize));
        
        console.log(`✅ [SERVER PAGINATION] Loaded page ${page} for ${section}:`, {
          itemsLoaded: sectionData.length,
          totalItems: totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
          currentPage: page,
          pageSize
        });
      } else {
        throw new Error(result.error || 'Failed to load data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`❌ [SERVER PAGINATION] Error loading ${section} page ${page}:`, errorMessage);
      setError(errorMessage);
      setData([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [section, pageSize, finalWorkspaceId, finalUserId]);

  // Fetch data when page changes
  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, fetchData]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  // Refresh function
  const refresh = useCallback(async () => {
    await fetchData(currentPage);
  }, [fetchData, currentPage]);

  return {
    data,
    loading,
    error,
    currentPage,
    totalPages,
    totalItems,
    setCurrentPage: handlePageChange,
    refresh
  };
}
