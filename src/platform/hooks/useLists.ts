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
      const response = await authFetch(url);
      
      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = 'Failed to fetch lists';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error('API error response:', errorData);
        } catch {
          // If response isn't JSON, use status text
          errorMessage = response.statusText || `HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setLists(result.data);
        // Cache the result
        try {
          const storageKey = `adrata-lists-${section}-${finalWorkspaceId}`;
          localStorage.setItem(storageKey, JSON.stringify({ lists: result.data, ts: Date.now() }));
        } catch {}
      } else {
        // If result doesn't have success/data, still set empty array (no lists found is valid)
        setLists([]);
      }
    } catch (err) {
      console.error('Error fetching lists:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch lists');
      // Don't clear lists on error - keep cached data if available
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
      const response = await authFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create list');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        await fetchLists(); // Refresh lists
        return result.data;
      }
      
      return null;
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
      const response = await authFetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update list');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        await fetchLists(); // Refresh lists
        return result.data;
      }
      
      return null;
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
      const response = await authFetch(url, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete list');
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

