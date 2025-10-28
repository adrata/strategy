/**
 * 🟢 WORKSPACE PRESENCE HOOK
 * Real-time user presence tracking using Pusher
 */

import { useState, useEffect, useCallback } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { pusherClientService } from '@/platform/services/pusher-real-time-service';

interface WorkspacePresence {
  onlineUsers: Set<string>;
  userCount: number;
  isConnected: boolean;
}

export function useWorkspacePresence(): WorkspacePresence {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useUnifiedAuth();
  const { activeWorkspace } = useRevenueOS();

  const workspaceId = activeWorkspace?.id || user?.activeWorkspaceId;
  const userId = user?.id;

  // Handle user presence updates
  const handleUserPresence = useCallback((update: any) => {
    console.log('👥 [useWorkspacePresence] User presence update:', update);
    
    if (update.type === 'user_joined') {
      setOnlineUsers(prev => new Set([...prev, update.userId]));
    } else if (update.type === 'user_left') {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(update.userId);
        return newSet;
      });
    }
  }, []);

  // Initialize Pusher connection and subscribe to presence events
  useEffect(() => {
    if (!workspaceId || !userId) {
      console.log('🔍 [useWorkspacePresence] Missing workspaceId or userId:', { workspaceId, userId });
      return;
    }

    console.log('🔗 [useWorkspacePresence] Initializing presence tracking:', { workspaceId, userId });

    // Initialize Pusher client
    pusherClientService.initialize(workspaceId, userId);

    // Subscribe to workspace updates with presence handler
    pusherClientService.subscribeToWorkspace(
      () => {}, // CRM updates - not needed for presence
      () => {}, // Data sync - not needed for presence
      handleUserPresence // User presence updates
    );

    // Set connected state
    setIsConnected(true);

    // Cleanup on unmount
    return () => {
      console.log('🧹 [useWorkspacePresence] Cleaning up presence tracking');
      setIsConnected(false);
    };
  }, [workspaceId, userId, handleUserPresence]);

  // Add current user to online users when connected
  useEffect(() => {
    if (isConnected && userId) {
      setOnlineUsers(prev => new Set([...prev, userId]));
    }
  }, [isConnected, userId]);

  return {
    onlineUsers,
    userCount: onlineUsers.size,
    isConnected
  };
}
