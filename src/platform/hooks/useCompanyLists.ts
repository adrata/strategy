import { useState, useEffect, useCallback } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { authFetch } from '@/platform/api-fetch';

export interface CompanyList {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  filters: any | null;
  sortField: string | null;
  sortDirection: string | null;
  searchQuery: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface UseCompanyListsReturn {
  lists: CompanyList[];
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
    isDefault?: boolean;
  }) => Promise<CompanyList | null>;
  updateList: (id: string, data: {
    name?: string;
    description?: string;
    filters?: any;
    sortField?: string;
    sortDirection?: string;
    searchQuery?: string;
    isDefault?: boolean;
  }) => Promise<CompanyList | null>;
  deleteList: (id: string) => Promise<boolean>;
}

export function useCompanyLists(workspaceId?: string): UseCompanyListsReturn {
  const { user } = useUnifiedAuth();
  const finalWorkspaceId = workspaceId || user?.activeWorkspaceId || user?.workspaces?.[0]?.id;
  
  const [lists, setLists] = useState<CompanyList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLists = useCallback(async () => {
    if (!finalWorkspaceId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const url = `/api/v1/company-lists?workspaceId=${finalWorkspaceId}`;
      const response = await authFetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch company lists');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setLists(result.data);
      } else {
        setLists([]);
      }
    } catch (err) {
      console.error('Error fetching company lists:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch lists');
      setLists([]);
    } finally {
      setLoading(false);
    }
  }, [finalWorkspaceId]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const createList = useCallback(async (data: {
    name: string;
    description?: string;
    filters?: any;
    sortField?: string;
    sortDirection?: string;
    searchQuery?: string;
    isDefault?: boolean;
  }): Promise<CompanyList | null> => {
    if (!finalWorkspaceId) {
      return null;
    }

    try {
      const url = `/api/v1/company-lists?workspaceId=${finalWorkspaceId}`;
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
      console.error('Error creating company list:', err);
      throw err;
    }
  }, [finalWorkspaceId, fetchLists]);

  const updateList = useCallback(async (id: string, data: {
    name?: string;
    description?: string;
    filters?: any;
    sortField?: string;
    sortDirection?: string;
    searchQuery?: string;
    isDefault?: boolean;
  }): Promise<CompanyList | null> => {
    if (!finalWorkspaceId) {
      return null;
    }

    try {
      const url = `/api/v1/company-lists/${id}?workspaceId=${finalWorkspaceId}`;
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
      console.error('Error updating company list:', err);
      throw err;
    }
  }, [finalWorkspaceId, fetchLists]);

  const deleteList = useCallback(async (id: string): Promise<boolean> => {
    if (!finalWorkspaceId) {
      return false;
    }

    try {
      const url = `/api/v1/company-lists/${id}?workspaceId=${finalWorkspaceId}`;
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
      console.error('Error deleting company list:', err);
      throw err;
    }
  }, [finalWorkspaceId, fetchLists]);

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

