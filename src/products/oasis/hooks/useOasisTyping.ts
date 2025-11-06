/**
 * Oasis Typing Indicators Hook
 * 
 * Manages typing indicators with real-time updates
 */

import { useState, useEffect, useCallback } from 'react';
import { usePusherRealTime, pusherClientService } from '@/platform/services/pusher-real-time-service';

export interface TypingUser {
  userId: string;
  userName: string;
  channelId?: string;
  dmId?: string;
}

export function useOasisTyping(
  workspaceId: string,
  channelId?: string,
  dmId?: string
) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Get Pusher real-time updates from workspace channel
  const { lastUpdate } = usePusherRealTime(workspaceId, '');

  // Subscribe to workspace channel for 'oasis-event' events (fallback)
  useEffect(() => {
    if (!workspaceId) return;

    const workspaceChannelName = `workspace-${workspaceId}`;
    console.log(`📡 [OASIS TYPING] Subscribing to workspace channel for typing events: ${workspaceChannelName}`);

    pusherClientService.subscribeToChannel(
      workspaceChannelName,
      'oasis-event',
      (event: any) => {
        console.log(`⌨️ [OASIS TYPING] Received typing event on workspace channel:`, event);
        
        // Check if this event is relevant to current channel/DM
        const isRelevant = (channelId && event.channelId === channelId) || (dmId && event.dmId === dmId);
        if (!isRelevant) return;

        if (event.type === 'oasis_user_typing') {
          setTypingUsers(prev => {
            const existing = prev.find(u => u.userId === event.payload.userId);
            if (existing) return prev;
            
            return [...prev, {
              userId: event.payload.userId,
              userName: event.payload.userName,
              channelId: event.payload.channelId,
              dmId: event.payload.dmId
            }];
          });
        } else if (event.type === 'oasis_user_stopped_typing') {
          setTypingUsers(prev => 
            prev.filter(u => u.userId !== event.payload.userId)
          );
        }
      }
    );

    return () => {
      console.log(`📡 [OASIS TYPING] Unsubscribing from workspace channel: ${workspaceChannelName}`);
    };
  }, [workspaceId, channelId, dmId]);

  // Subscribe to DM-specific channel for typing events
  useEffect(() => {
    if (!dmId || !workspaceId) return;

    const dmChannelName = `oasis-dm-${dmId}`;
    console.log(`📡 [OASIS TYPING] Subscribing to DM channel for typing events: ${dmChannelName}`);

    pusherClientService.subscribeToChannel(
      dmChannelName,
      'oasis-event',
      (event: any) => {
        console.log(`⌨️ [OASIS TYPING] Received typing event on DM channel:`, event);
        
        if (event.dmId === dmId) {
          if (event.type === 'oasis_user_typing') {
            setTypingUsers(prev => {
              const existing = prev.find(u => u.userId === event.payload.userId);
              if (existing) return prev;
              
              return [...prev, {
                userId: event.payload.userId,
                userName: event.payload.userName,
                channelId: event.payload.channelId,
                dmId: event.payload.dmId
              }];
            });
          } else if (event.type === 'oasis_user_stopped_typing') {
            setTypingUsers(prev => 
              prev.filter(u => u.userId !== event.payload.userId)
            );
          }
        }
      }
    );

    return () => {
      console.log(`📡 [OASIS TYPING] Unsubscribing from DM channel: ${dmChannelName}`);
    };
  }, [dmId, workspaceId]);

  // Subscribe to channel-specific channel for typing events
  useEffect(() => {
    if (!channelId || !workspaceId) return;

    const channelChannelName = `oasis-channel-${channelId}`;
    console.log(`📡 [OASIS TYPING] Subscribing to channel for typing events: ${channelChannelName}`);

    pusherClientService.subscribeToChannel(
      channelChannelName,
      'oasis-event',
      (event: any) => {
        console.log(`⌨️ [OASIS TYPING] Received typing event on channel:`, event);
        
        if (event.channelId === channelId) {
          if (event.type === 'oasis_user_typing') {
            setTypingUsers(prev => {
              const existing = prev.find(u => u.userId === event.payload.userId);
              if (existing) return prev;
              
              return [...prev, {
                userId: event.payload.userId,
                userName: event.payload.userName,
                channelId: event.payload.channelId,
                dmId: event.payload.dmId
              }];
            });
          } else if (event.type === 'oasis_user_stopped_typing') {
            setTypingUsers(prev => 
              prev.filter(u => u.userId !== event.payload.userId)
            );
          }
        }
      }
    );

    return () => {
      console.log(`📡 [OASIS TYPING] Unsubscribing from channel: ${channelChannelName}`);
    };
  }, [channelId, workspaceId]);

  // Send typing indicator
  const startTyping = useCallback(async () => {
    if (isTyping) return;

    try {
      setIsTyping(true);
      
      const response = await fetch('/api/v1/oasis/oasis/typing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          channelId,
          dmId,
          isTyping: true
        }),
      });

      if (!response.ok) {
        console.error('Failed to send typing indicator');
      }
    } catch (err) {
      console.error('❌ [OASIS TYPING] Start typing error:', err);
    }
  }, [workspaceId, channelId, dmId, isTyping]);

  // Stop typing indicator
  const stopTyping = useCallback(async () => {
    if (!isTyping) return;

    try {
      setIsTyping(false);
      
      const response = await fetch('/api/v1/oasis/oasis/typing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          channelId,
          dmId,
          isTyping: false
        }),
      });

      if (!response.ok) {
        console.error('Failed to send stop typing indicator');
      }
    } catch (err) {
      console.error('❌ [OASIS TYPING] Stop typing error:', err);
    }
  }, [workspaceId, channelId, dmId, isTyping]);

  // Note: Typing updates are now handled via direct channel subscriptions above

  // Auto-stop typing after 3 seconds of inactivity
  useEffect(() => {
    if (isTyping) {
      const timer = setTimeout(() => {
        stopTyping();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isTyping, stopTyping]);

  // Clean up typing indicator on unmount
  useEffect(() => {
    return () => {
      if (isTyping) {
        stopTyping();
      }
    };
  }, [isTyping, stopTyping]);

  return {
    typingUsers,
    isTyping,
    startTyping,
    stopTyping
  };
}
