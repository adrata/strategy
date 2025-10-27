/**
 * Table Editing Hook
 * Handles inline editing operations for table cells
 */

import { useCallback } from 'react';
import { authFetch } from '@/platform/api-fetch';

interface UseTableEditOptions {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function useTableEdit(options: UseTableEditOptions = {}) {
  const { onSuccess, onError } = options;

  const updateRecord = useCallback(async (
    recordType: string,
    recordId: string,
    field: string,
    value: string
  ): Promise<boolean> => {
    try {
      console.log(`🔧 [TABLE EDIT] Updating ${recordType} ${recordId} field ${field} to:`, value);
      
      // Determine API endpoint based on record type
      let apiEndpoint: string;
      if (recordType === 'people' || recordType === 'sellers') {
        apiEndpoint = `/api/v1/people/${recordId}`;
      } else if (recordType === 'companies') {
        apiEndpoint = `/api/v1/companies/${recordId}`;
      } else {
        // For leads, prospects, opportunities, etc.
        apiEndpoint = `/api/data/unified?type=${encodeURIComponent(recordType)}&id=${encodeURIComponent(recordId)}`;
      }

      const result = await authFetch(
        apiEndpoint,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ [field]: value }),
        },
        { success: false, error: 'Update failed' }
      );

      if (result?.success) {
        const message = `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`;
        onSuccess?.(message);
        console.log(`✅ [TABLE EDIT] Successfully updated ${recordType} ${recordId}`);
        return true;
      } else {
        throw new Error(result?.error || 'Update failed');
      }
    } catch (error) {
      console.error('❌ [TABLE EDIT] Error updating record:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onError?.(`Failed to update ${field}: ${errorMessage}`);
      return false;
    }
  }, [onSuccess, onError]);

  const deleteRecord = useCallback(async (
    recordType: string,
    recordId: string
  ): Promise<boolean> => {
    try {
      console.log(`🗑️ [TABLE EDIT] Deleting ${recordType} ${recordId}`);
      
      // Use unified API for deletion
      const result = await authFetch(
        `/api/data/unified?type=${encodeURIComponent(recordType)}&id=${encodeURIComponent(recordId)}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        { success: false, error: 'Delete failed' }
      );

      if (result?.success) {
        const message = `${recordType.slice(0, -1)} deleted successfully!`;
        onSuccess?.(message);
        console.log(`✅ [TABLE EDIT] Successfully deleted ${recordType} ${recordId}`);
        return true;
      } else {
        throw new Error(result?.error || 'Delete failed');
      }
    } catch (error) {
      console.error('❌ [TABLE EDIT] Error deleting record:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onError?.(`Failed to delete ${recordType}: ${errorMessage}`);
      return false;
    }
  }, [onSuccess, onError]);

  return {
    updateRecord,
    deleteRecord,
  };
}
