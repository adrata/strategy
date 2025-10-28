/**
 * Auto-Create Ross DMs Hook
 * 
 * Automatically creates DMs with Ross for all users in a workspace
 */

import { useCallback } from 'react';

export function useAutoCreateRossDMs() {
  const autoCreateRossDMs = useCallback(async (workspaceId: string) => {
    try {
      console.log('🤖 [AUTO-CREATE ROSS DMS] Creating DMs with Ross for workspace:', workspaceId);
      
      const response = await fetch('/api/v1/oasis/auto-create-ross-dms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ workspaceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to auto-create Ross DMs');
      }

      const data = await response.json();
      console.log('✅ [AUTO-CREATE ROSS DMS] Success:', data);
      
      return data;
    } catch (error) {
      console.error('❌ [AUTO-CREATE ROSS DMS] Error:', error);
      throw error;
    }
  }, []);

  return { autoCreateRossDMs };
}
