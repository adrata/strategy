import { useState } from 'react';
import { authFetch } from '@/platform/api-fetch';

interface UseInlineEditOptions {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export const useInlineEdit = (options: UseInlineEditOptions = {}) => {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  const showMessage = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSuccessMessage(message);
    setMessageType(type);
    setShowSuccessMessage(true);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  const handleEditSave = async (
    recordType: 'account' | 'contact' | 'opportunity' | 'lead' | 'prospect',
    recordId: string,
    field: string,
    value: string
  ) => {
    try {
      console.log(`🔧 [INLINE EDIT] Updating ${recordType} ${recordId} field ${field} to:`, value);
      
      // Use v1 APIs for updates
      const apiType = recordType === 'account' ? 'companies' : recordType === 'contact' ? 'people' : 'people';
      const result = await authFetch(
        `/api/v1/${apiType}/${recordId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ [field]: value }),
        },
        { success: false, error: 'Update failed' } // fallback
      );

      if (result?.success) {
        const message = `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`;
        showMessage(message, 'success');
        options.onSuccess?.(message);
        console.log(`✅ [INLINE EDIT] Successfully updated ${recordType} ${recordId}`);
        return true;
      } else {
        throw new Error(result?.error || 'Update failed');
      }
    } catch (error) {
      console.error('❌ [INLINE EDIT] Error updating record:', error);
      const errorMessage = `Error updating record: ${error instanceof Error ? error.message : 'Unknown error'}`;
      showMessage(errorMessage, 'error');
      options.onError?.(errorMessage);
      return false;
    }
  };

  const closeMessage = () => {
    setShowSuccessMessage(false);
  };

  return {
    showSuccessMessage,
    successMessage,
    messageType,
    showMessage,
    handleEditSave,
    closeMessage,
  };
};
