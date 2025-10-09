/**
 * 🗑️ DELETION HOOK - React Hook for Deletion Management
 * 
 * Provides easy-to-use deletion functionality with:
 * - Soft delete with restore capability
 * - Hard delete for permanent removal
 * - Loading states and error handling
 * - Optimistic updates
 */

import { useState, useCallback } from 'react';
import { authFetch } from '@/platform/api-fetch';

export interface DeletionOptions {
  entityType: 'companies' | 'people' | 'actions';
  entityId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export interface DeletionStats {
  softDeleted: {
    companies: number;
    people: number;
    actions: number;
  };
  retentionCompliance: {
    companies: number;
    people: number;
    actions: number;
  };
}

export interface UseDeletionReturn {
  // Actions
  softDelete: (options: DeletionOptions) => Promise<boolean>;
  restore: (options: DeletionOptions) => Promise<boolean>;
  hardDelete: (options: DeletionOptions) => Promise<boolean>;
  
  // Statistics
  getStats: () => Promise<DeletionStats | null>;
  
  // State
  loading: boolean;
  error: string | null;
}

export function useDeletion(): UseDeletionReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performDeletion = useCallback(async (
    action: 'soft_delete' | 'restore' | 'hard_delete',
    options: DeletionOptions
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch('/api/v1/deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          entityType: options.entityType,
          entityId: options.entityId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action}`);
      }

      const result = await response.json();
      
      if (result.success) {
        options.onSuccess?.();
        return true;
      } else {
        throw new Error(result.error || `Failed to ${action}`);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const softDelete = useCallback(async (options: DeletionOptions): Promise<boolean> => {
    return performDeletion('soft_delete', options);
  }, [performDeletion]);

  const restore = useCallback(async (options: DeletionOptions): Promise<boolean> => {
    return performDeletion('restore', options);
  }, [performDeletion]);

  const hardDelete = useCallback(async (options: DeletionOptions): Promise<boolean> => {
    return performDeletion('hard_delete', options);
  }, [performDeletion]);

  const getStats = useCallback(async (): Promise<DeletionStats | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch('/api/v1/deletion?action=stats');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch deletion stats');
      }

      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch deletion stats');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    softDelete,
    restore,
    hardDelete,
    getStats,
    loading,
    error,
  };
}

// DeletionButton component moved to separate file for better organization
