/**
 * Oasis Direct Messages Hook
 * 
 * Fetches and manages DMs with real-time updates
 */

import { useState, useEffect } from 'react';
import { usePusherRealTime } from '@/platform/services/pusher-real-time-service';

export interface OasisDM {
  id: string;
  participants: OasisDMParticipant[];
  lastMessage: OasisDMLastMessage | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OasisDMParticipant {
  id: string;
  name: string;
  username: string | null;
  workspaceName?: string;
}

export interface OasisDMLastMessage {
  id: string;
  content: string;
  senderName: string;
  createdAt: string;
}

export function useOasisDMs(workspaceId: string) {
  const [dms, setDms] = useState<OasisDM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get Pusher real-time updates
  const { lastUpdate } = usePusherRealTime(workspaceId, '');

  // Fetch DMs
  const fetchDMs = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 [OASIS DMS] Fetching DMs for workspace:', workspaceId);
      const response = await fetch(`/api/v1/oasis/oasis/dms?workspaceId=${workspaceId}`, {
        credentials: 'include'
      });
      
      console.log('📡 [OASIS DMS] Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [OASIS DMS] API error:', errorData);
        throw new Error(`Failed to fetch DMs: ${response.status} ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 [OASIS DMS] Received data:', data);
      
      if (data.dms) {
        setDms(data.dms);
      } else {
        console.warn('⚠️ [OASIS DMS] No DMs in response:', data);
        setDms([]);
      }
    } catch (err) {
      console.error('❌ [OASIS DMS] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch DMs');
      setDms([]);
    } finally {
      setLoading(false);
    }
  };

  // Create new DM
  const createDM = async (participantIds: string[]) => {
    try {
      const response = await fetch('/api/v1/oasis/oasis/dms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          workspaceId,
          participantIds
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create DM');
      }

      const data = await response.json();
      
      // Add new DM to list
      setDms(prev => [data.dm, ...prev]);
      
      return data.dm;
    } catch (err) {
      console.error('❌ [OASIS DMS] Create error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create DM');
      throw err;
    }
  };

  // Add participant to DM
  const addParticipant = async (dmId: string, userId: string) => {
    try {
      const response = await fetch(`/api/v1/oasis/oasis/dms/${dmId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to add participant');
      }

      // Refresh DMs to get updated participant list
      await fetchDMs();
    } catch (err) {
      console.error('❌ [OASIS DMS] Add participant error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add participant');
      throw err;
    }
  };

  // Initial fetch
  useEffect(() => {
    if (workspaceId) {
      fetchDMs();
    }
  }, [workspaceId]);

  // Listen for real-time updates
  useEffect(() => {
    if (lastUpdate?.type === 'oasis-message' || lastUpdate?.type === 'oasis-event') {
      // Refresh DMs when there are message updates
      fetchDMs();
    }
  }, [lastUpdate]);

  return {
    dms,
    loading,
    error,
    createDM,
    addParticipant,
    refetch: fetchDMs
  };
}
