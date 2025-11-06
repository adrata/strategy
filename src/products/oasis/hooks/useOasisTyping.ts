/**
 * Oasis Typing Indicators Hook
 * 
 * Manages typing indicators with real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePusherRealTime, pusherClientService } from '@/platform/services/pusher-real-time-service';
import { useDebouncedTyping } from '@/products/oasis/utils/useDebouncedTyping';

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
  const typingApiCallRef = useRef<{ lastCall: number; pending: boolean }>({ lastCall: 0, pending: false });

  // Get Pusher real-time updates from workspace channel
  const { lastUpdate } = usePusherRealTime(workspaceId, '');

  // Subscribe to workspace channel for 'oasis-event' events (fallback)
  useEffect(() => {
    if (!workspaceId) return;

    const workspaceChannelName = `workspace-${workspaceId}`;
    console.log(`📡 [OASIS TYPING] Subscribing to workspace channel for typing events: ${workspaceChannelName}`);

    const unsubscribeWorkspace = pusherClientService.subscribeToChannel(
      workspaceChannelName,
      'oasis-event',
      (event: any) => {
        console.log(`⌨️ [OASIS TYPING] Received typing event on workspace channel:`, event);
        
        // Check if this event is relevant to current channel/DM
        // Event structure: { type, payload, dmId, channelId, ... }
        const eventChannelId = event.channelId || event.payload?.channelId;
        const eventDmId = event.dmId || event.payload?.dmId;
        const isRelevant = (channelId && eventChannelId === channelId) || (dmId && eventDmId === dmId);
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
      if (unsubscribeWorkspace) unsubscribeWorkspace();
    };
  }, [workspaceId, channelId, dmId]);

  // Subscribe to DM-specific channel for typing events
  useEffect(() => {
    if (!dmId || !workspaceId) return;

    const dmChannelName = `oasis-dm-${dmId}`;
    console.log(`📡 [OASIS TYPING] Subscribing to DM channel for typing events: ${dmChannelName}`);

    const unsubscribeDM = pusherClientService.subscribeToChannel(
      dmChannelName,
      'oasis-event',
      (event: any) => {
        console.log(`⌨️ [OASIS TYPING] Received typing event on DM channel:`, event);
        
        // Event structure: { type, payload, dmId, channelId, ... }
        const eventDmId = event.dmId || event.payload?.dmId;
        if (eventDmId === dmId) {
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
      if (unsubscribeDM) unsubscribeDM();
    };
  }, [dmId, workspaceId]);

  // Subscribe to channel-specific channel for typing events
  useEffect(() => {
    if (!channelId || !workspaceId) return;

    const channelChannelName = `oasis-channel-${channelId}`;
    console.log(`📡 [OASIS TYPING] Subscribing to channel for typing events: ${channelChannelName}`);

    const unsubscribeChannel = pusherClientService.subscribeToChannel(
      channelChannelName,
      'oasis-event',
      (event: any) => {
        console.log(`⌨️ [OASIS TYPING] Received typing event on channel:`, event);
        
        // Event structure: { type, payload, dmId, channelId, ... }
        const eventChannelId = event.channelId || event.payload?.channelId;
        if (eventChannelId === channelId) {
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
      if (unsubscribeChannel) unsubscribeChannel();
    };
  }, [channelId, workspaceId]);

  // Optimized typing API call with throttling
  const sendTypingEvent = useCallback(async (isTypingValue: boolean) => {
    const now = Date.now();
    const minTimeBetweenCalls = 2000; // 2 seconds minimum between API calls
    
    // Throttle: Don't send if called too recently
    if (typingApiCallRef.current.pending) {
      return;
    }
    
    const timeSinceLastCall = now - typingApiCallRef.current.lastCall;
    if (timeSinceLastCall < minTimeBetweenCalls && isTypingValue) {
      // Skip if within throttle window (only for start typing, always send stop)
      return;
    }

    typingApiCallRef.current.pending = true;
    typingApiCallRef.current.lastCall = now;

    try {
      const response = await fetch('/api/v1/oasis/oasis/typing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          channelId,
          dmId,
          isTyping: isTypingValue
        }),
      });

      if (!response.ok) {
        console.error('Failed to send typing indicator');
      } else {
        console.log(`✅ [OASIS TYPING] ${isTypingValue ? 'Started' : 'Stopped'} typing indicator`);
      }
    } catch (err) {
      console.error('❌ [OASIS TYPING] Typing API error:', err);
    } finally {
      typingApiCallRef.current.pending = false;
    }
  }, [workspaceId, channelId, dmId]);

  // Optimized start typing with debouncing
  const startTyping = useCallback(async () => {
    if (isTyping) return;
    setIsTyping(true);
    await sendTypingEvent(true);
  }, [isTyping, sendTypingEvent]);

  // Optimized stop typing (always send immediately)
  const stopTyping = useCallback(async () => {
    if (!isTyping) return;
    setIsTyping(false);
    await sendTypingEvent(false);
  }, [isTyping, sendTypingEvent]);

  // Debounced typing handler
  const { handleTyping, handleStopTyping, resetTyping } = useDebouncedTyping({
    onStartTyping: startTyping,
    onStopTyping: stopTyping,
    debounceMs: 300, // 300ms debounce before sending "typing"
    throttleMs: 2000, // Max 1 event per 2 seconds
    autoStopMs: 3000 // Auto-stop after 3 seconds
  });

  // Reset typing when conversation changes
  useEffect(() => {
    resetTyping();
  }, [channelId, dmId, resetTyping]);

  // Clean up typing indicator on unmount
  useEffect(() => {
    return () => {
      resetTyping();
    };
  }, [resetTyping]);

  return {
    typingUsers,
    isTyping,
    startTyping: handleTyping, // Use debounced handler
    stopTyping: handleStopTyping, // Use debounced handler
    resetTyping
  };
}
