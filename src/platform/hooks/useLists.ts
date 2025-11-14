import { useState, useEffect, useCallback } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { authFetch } from '@/platform/api-fetch';

export interface List {
  id: string;
  workspaceId: string;
  userId: string;
  section: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  filters: any | null;
  sortField: string | null;
  sortDirection: string | null;
  searchQuery: string | null;
  visibleFields: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface UseListsReturn {
  lists: List[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createList: (data: {
    name: string;
    description?: string;
    filters?: any;
    sortField?: string;
    sortDirection?: string;
    searchQuery?: string;
    visibleFields?: string[];
    isDefault?: boolean;
  }) => Promise<List | null>;
  updateList: (id: string, data: {
    name?: string;
    description?: string;
    filters?: any;
    sortField?: string;
    sortDirection?: string;
    searchQuery?: string;
    visibleFields?: string[];
    isDefault?: boolean;
  }) => Promise<List | null>;
  deleteList: (id: string) => Promise<boolean>;
}

export function useLists(section: string, workspaceId?: string): UseListsReturn {
  const { user } = useUnifiedAuth();
  const finalWorkspaceId = workspaceId || user?.activeWorkspaceId || user?.workspaces?.[0]?.id;
  
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(false); // Start with false since default lists are always available
  const [error, setError] = useState<string | null>(null);

  const fetchLists = useCallback(async () => {
    if (!finalWorkspaceId || !section) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Try to load from cache first for instant display
      try {
        const storageKey = `adrata-lists-${section}-${finalWorkspaceId}`;
        const cached = localStorage.getItem(storageKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed?.lists) && parsed?.ts && Date.now() - parsed.ts < 5 * 60 * 1000) {
            // Use cached data if less than 5 minutes old
            setLists(parsed.lists);
            setLoading(false);
          }
        }
      } catch {}
      
      const url = `/api/v1/lists?workspaceId=${finalWorkspaceId}&section=${encodeURIComponent(section)}`;
      // apiFetch returns parsed data directly, not a Response object
      // Provide fallback with correct structure matching API response
      const result = await authFetch(url, {}, { success: true, data: [] });
      
      if (result && result.success && Array.isArray(result.data)) {
        setLists(result.data);
        // Cache the result
        try {
          const storageKey = `adrata-lists-${section}-${finalWorkspaceId}`;
          localStorage.setItem(storageKey, JSON.stringify({ lists: result.data, ts: Date.now() }));
        } catch {}
      } else {
        // No lists found is valid - set empty array
        setLists([]);
      }
    } catch (err) {
      console.error('Error fetching lists:', err);
      // Don't set error state - empty lists is acceptable
      // Don't clear lists on error - keep cached data if available
      setLists([]);
    } finally {
      setLoading(false);
    }
  }, [finalWorkspaceId, section]);

  useEffect(() => {
    // Load from cache immediately for instant display
    if (finalWorkspaceId && section) {
      try {
        const storageKey = `adrata-lists-${section}-${finalWorkspaceId}`;
        const cached = localStorage.getItem(storageKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed?.lists)) {
            setLists(parsed.lists);
          }
        }
      } catch {}
    }
    // Then fetch fresh data in background
    fetchLists();
  }, [fetchLists, finalWorkspaceId, section]);

  const createList = useCallback(async (data: {
    name: string;
    description?: string;
    filters?: any;
    sortField?: string;
    sortDirection?: string;
    searchQuery?: string;
    visibleFields?: string[];
    isDefault?: boolean;
  }): Promise<List | null> => {
    if (!finalWorkspaceId || !section) {
      return null;
    }

    try {
      const url = `/api/v1/lists?workspaceId=${finalWorkspaceId}&section=${encodeURIComponent(section)}`;
      // apiFetch returns parsed data directly, not a Response object
      const result = await authFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (result && result.success && result.data) {
        await fetchLists(); // Refresh lists
        return result.data;
      }
      
      // If result doesn't have success/data, extract error message
      const errorMessage = result?.error || result?.message || 'Failed to create list';
      throw new Error(errorMessage);
    } catch (err) {
      console.error('Error creating list:', err);
      throw err;
    }
  }, [finalWorkspaceId, section, fetchLists]);

  const updateList = useCallback(async (id: string, data: {
    name?: string;
    description?: string;
    filters?: any;
    sortField?: string;
    sortDirection?: string;
    searchQuery?: string;
    visibleFields?: string[];
    isDefault?: boolean;
  }): Promise<List | null> => {
    if (!finalWorkspaceId || !section) {
      return null;
    }

    try {
      const url = `/api/v1/lists/${id}?workspaceId=${finalWorkspaceId}&section=${encodeURIComponent(section)}`;
      // apiFetch returns parsed data directly, not a Response object
      const result = await authFetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (result && result.success && result.data) {
        await fetchLists(); // Refresh lists
        return result.data;
      }
      
      // If result doesn't have success/data, extract error message
      const errorMessage = result?.error || result?.message || 'Failed to update list';
      throw new Error(errorMessage);
    } catch (err) {
      console.error('Error updating list:', err);
      throw err;
    }
  }, [finalWorkspaceId, section, fetchLists]);

  const deleteList = useCallback(async (id: string): Promise<boolean> => {
    if (!finalWorkspaceId || !section) {
      return false;
    }

    try {
      const url = `/api/v1/lists/${id}?workspaceId=${finalWorkspaceId}&section=${encodeURIComponent(section)}`;
      // apiFetch returns parsed data directly, not a Response object
      const result = await authFetch(url, {
        method: 'DELETE'
      });

      // If result indicates an error, throw it
      if (result && (result.error || (result.success === false))) {
        const errorMessage = result.error || result.message || 'Failed to delete list';
        throw new Error(errorMessage);
      }

      await fetchLists(); // Refresh lists
      return true;
    } catch (err) {
      console.error('Error deleting list:', err);
      throw err;
    }
  }, [finalWorkspaceId, section, fetchLists]);

  return {
    lists,
    loading,
    error,
    refresh: fetchLists,
    createList,
    updateList,
    deleteList
  };
}

