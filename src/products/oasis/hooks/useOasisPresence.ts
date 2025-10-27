/**
 * Oasis Presence Hook
 * 
 * Manages online status and user presence
 */

import { useState, useEffect } from 'react';
import { usePusherRealTime } from '@/platform/services/pusher-real-time-service';

export interface OnlineUser {
  userId: string;
  userName: string;
  lastSeen: string;
}

export function useOasisPresence(workspaceId: string) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Get Pusher real-time updates
  const { lastUpdate } = usePusherRealTime(workspaceId, '');

  // Listen for presence updates
  useEffect(() => {
    if (lastUpdate?.type === 'user-presence') {
      const event = lastUpdate.payload;
      
      if (event.type === 'user_joined') {
        // Add user to online list
        setOnlineUsers(prev => {
          const existing = prev.find(u => u.userId === event.userId);
          if (existing) return prev;
          
          return [...prev, {
            userId: event.userId,
            userName: event.userName || 'Unknown User',
            lastSeen: new Date().toISOString()
          }];
        });
      } else if (event.type === 'user_left') {
        // Remove user from online list
        setOnlineUsers(prev => 
          prev.filter(u => u.userId !== event.userId)
        );
      }
    }
  }, [lastUpdate]);

  // Update user count
  useEffect(() => {
    setUserCount(onlineUsers.length);
  }, [onlineUsers]);

  // Simulate connection status (in real implementation, this would come from Pusher)
  useEffect(() => {
    setIsConnected(true);
  }, []);

  return {
    onlineUsers,
    userCount,
    isConnected
  };
}
