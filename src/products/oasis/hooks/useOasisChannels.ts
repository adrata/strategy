/**
 * Oasis Channels Hook
 * 
 * Fetches and manages channels with real-time updates
 */

import { useState, useEffect } from 'react';
import { usePusherRealTime } from '@/platform/services/pusher-real-time-service';

export interface OasisChannel {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  memberCount: number;
  recentMessageCount: number;
  isMember: boolean;
}

export function useOasisChannels(workspaceId: string) {
  const [channels, setChannels] = useState<OasisChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get Pusher real-time updates
  const { lastUpdate } = usePusherRealTime(workspaceId, ''); // User ID will be set by the hook

  // Fetch channels
  const fetchChannels = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 [OASIS CHANNELS] Fetching channels for workspace:', workspaceId);
      const response = await fetch(`/api/v1/oasis/oasis/channels?workspaceId=${workspaceId}`);
      
      console.log('📡 [OASIS CHANNELS] Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [OASIS CHANNELS] API error:', errorData);
        throw new Error(`Failed to fetch channels: ${response.status} ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 [OASIS CHANNELS] Received data:', data);
      
      if (data.channels) {
        setChannels(data.channels);
      } else {
        console.warn('⚠️ [OASIS CHANNELS] No channels in response:', data);
        setChannels([]);
      }
    } catch (err) {
      console.error('❌ [OASIS CHANNELS] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch channels');
      setChannels([]);
    } finally {
      setLoading(false);
    }
  };

  // Create new channel
  const createChannel = async (name: string, description?: string) => {
    try {
      const response = await fetch('/api/v1/oasis/oasis/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          name,
          description
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create channel');
      }

      const data = await response.json();
      
      // Add new channel to list
      setChannels(prev => [...prev, data.channel]);
      
      return data.channel;
    } catch (err) {
      console.error('❌ [OASIS CHANNELS] Create error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create channel');
      throw err;
    }
  };

  // Add member to channel
  const addMember = async (channelId: string, userId: string) => {
    try {
      const response = await fetch(`/api/v1/oasis/oasis/channels/${channelId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to add member');
      }

      // Refresh channels to get updated member count
      await fetchChannels();
    } catch (err) {
      console.error('❌ [OASIS CHANNELS] Add member error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add member');
      throw err;
    }
  };

  // Remove member from channel
  const removeMember = async (channelId: string, userId: string) => {
    try {
      const response = await fetch(`/api/v1/oasis/oasis/channels/${channelId}/members/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove member');
      }

      // Refresh channels to get updated member count
      await fetchChannels();
    } catch (err) {
      console.error('❌ [OASIS CHANNELS] Remove member error:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove member');
      throw err;
    }
  };

  // Initial fetch
  useEffect(() => {
    if (workspaceId) {
      fetchChannels();
    }
  }, [workspaceId]);

  // Listen for real-time updates
  useEffect(() => {
    if (lastUpdate?.type === 'oasis-message' || lastUpdate?.type === 'oasis-event') {
      // Refresh channels when there are message updates
      fetchChannels();
    }
  }, [lastUpdate]);

  return {
    channels,
    loading,
    error,
    createChannel,
    addMember,
    removeMember,
    refetch: fetchChannels
  };
}
