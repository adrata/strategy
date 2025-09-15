/**
 * 🔔 ZOHO NOTIFICATIONS HOOK
 * 
 * React hook for listening to Zoho update notifications
 * Similar to useSpeedrunSignals but for general Zoho updates
 */

import { useState, useEffect, useCallback } from 'react';
// import { zohoNotificationService, ZohoUpdateNotification } from '@/platform/services/zoho-notification-service';

// Temporary type definition to fix build
interface ZohoUpdateNotification {
  id: string;
  type: string;
  priority: string;
  module: string;
  operation: string;
  record: any;
  note: any;
  action: string;
  timestamp: string;
  workspaceId: string;
}

interface UseZohoNotificationsReturn {
  notifications: ZohoUpdateNotification[];
  activeNotification: ZohoUpdateNotification | null;
  dismissNotification: () => void;
  markAsRead: (notificationId: string) => void;
  refreshNotifications: () => Promise<void>;
}

export function useZohoNotifications(
  workspaceId: string,
  userId: string,
  onNotificationReceived?: (notification: ZohoUpdateNotification) => void
): UseZohoNotificationsReturn {
  console.log('🔔 [useZohoNotifications] Hook initialized with workspaceId:', workspaceId, 'userId:', userId);
  
  const [notifications, setNotifications] = useState<ZohoUpdateNotification[]>([]);
  const [activeNotification, setActiveNotification] = useState<ZohoUpdateNotification | null>(null);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  // Fetch recent notifications
  const refreshNotifications = useCallback(async () => {
    try {
      console.log('🔍 [Zoho Notifications] Fetching recent notifications...');
      // const recentNotifications = await zohoNotificationService.getRecentNotifications(workspaceId, 20);
      const recentNotifications = []; // Temporarily disabled to fix build
      setNotifications(recentNotifications);
      console.log(`📥 [Zoho Notifications] Loaded ${recentNotifications.length} notifications`);
    } catch (error) {
      console.error('❌ [Zoho Notifications] Error fetching notifications:', error);
    }
  }, [workspaceId]);

  // Check for new notifications
  const checkForNewNotifications = useCallback(async () => {
    try {
      console.log('🔍 [Zoho Notifications] Checking for new notifications...');
      
      // Call API to check for new notifications since lastCheck
      const response = await fetch(`/api/zoho/notifications?workspaceId=${workspaceId}&since=${lastCheck.toISOString()}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.notifications && data.notifications.length > 0) {
          console.log('🔔 [Zoho Notifications] New notifications received:', data.notifications.length);
          
          // Update notifications list
          setNotifications(prev => [...data.notifications, ...prev]);
          
          // Show the most recent notification
          const latestNotification = data.notifications[0];
          setActiveNotification(latestNotification);
          
          // Call callback if provided
          if (onNotificationReceived) {
            onNotificationReceived(latestNotification);
          }
          
          setLastCheck(new Date());
        }
      }
    } catch (error) {
      console.error('❌ [Zoho Notifications] Error checking for notifications:', error);
    }
  }, [workspaceId, lastCheck, onNotificationReceived]);

  // Dismiss active notification
  const dismissNotification = useCallback(() => {
    console.log('❌ [Zoho Notifications] Dismissing active notification');
    setActiveNotification(null);
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      console.log('✅ [Zoho Notifications] Marking notification as read:', notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.record.id === notificationId 
            ? { ...notification, action: 'READ' as any }
            : notification
        )
      );
      
      // Call API to mark as read
      await fetch(`/api/zoho/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workspaceId, userId })
      });
      
    } catch (error) {
      console.error('❌ [Zoho Notifications] Error marking notification as read:', error);
    }
  }, [workspaceId, userId]);

  // Initialize and set up polling
  useEffect(() => {
    if (!workspaceId || !userId) return;

    // Load initial notifications
    refreshNotifications();

    // Check for new notifications every 30 seconds
    const interval = setInterval(checkForNewNotifications, 30000);

    return () => clearInterval(interval);
  }, [workspaceId, userId, refreshNotifications, checkForNewNotifications]);

  // Auto-dismiss notification after 10 seconds
  useEffect(() => {
    if (activeNotification) {
      const timer = setTimeout(() => {
        console.log('⏰ [Zoho Notifications] Auto-dismissing notification after timeout');
        dismissNotification();
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [activeNotification, dismissNotification]);

  return {
    notifications,
    activeNotification,
    dismissNotification,
    markAsRead,
    refreshNotifications
  };
}

/**
 * Hook for listening to real-time Zoho notifications via Pusher
 */
export function useZohoRealtimeNotifications(
  workspaceId: string,
  onNotificationReceived?: (notification: ZohoUpdateNotification) => void
) {
  useEffect(() => {
    if (!workspaceId) return;

    // Import Pusher client service
    import('@/platform/services/pusher-real-time-service').then(({ PusherClientService }) => {
      const pusherService = PusherClientService.getInstance();
      
      // Subscribe to Zoho notifications
      pusherService.subscribeToChannel(
        `workspace-${workspaceId}`,
        'zoho_update',
        (data: any) => {
          console.log('🔔 [Zoho Realtime] Received notification:', data);
          
          if (data.payload && data.payload.type === 'ZOHO_UPDATE') {
            const notification: ZohoUpdateNotification = data.payload;
            
            if (onNotificationReceived) {
              onNotificationReceived(notification);
            }
          }
        }
      );

      console.log(`📡 [Zoho Realtime] Subscribed to notifications for workspace: ${workspaceId}`);
    });

  }, [workspaceId, onNotificationReceived]);
}
