/**
 * Oasis Typing Indicators Hook
 * 
 * Manages typing indicators with real-time updates
 */

import { useState, useEffect, useCallback } from 'react';
import { usePusherRealTime } from '@/platform/services/pusher-real-time-service';

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

  // Get Pusher real-time updates
  const { lastUpdate } = usePusherRealTime(workspaceId, '');

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

  // Listen for typing updates
  useEffect(() => {
    if (lastUpdate?.type === 'oasis-event') {
      const event = lastUpdate.payload;
      
      // Check if this event is relevant to current channel/DM
      if (
        (channelId && event.channelId === channelId) ||
        (dmId && event.dmId === dmId)
      ) {
        if (event.type === 'oasis_user_typing') {
          // Add user to typing list
          setTypingUsers(prev => {
            const existing = prev.find(u => u.userId === event.userId);
            if (existing) return prev;
            
            return [...prev, {
              userId: event.userId,
              userName: event.userName,
              channelId: event.channelId,
              dmId: event.dmId
            }];
          });
        } else if (event.type === 'oasis_user_stopped_typing') {
          // Remove user from typing list
          setTypingUsers(prev => 
            prev.filter(u => u.userId !== event.userId)
          );
        }
      }
    }
  }, [lastUpdate, channelId, dmId]);

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
