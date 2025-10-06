"use client";

import { useEffect } from "react";
import { notificationService } from "@/platform/services/notification-service";
import { isDesktop } from "@/platform/platform-detection";

/**
 * NotificationInitializer - Ensures notification service is initialized
 * for dock badge functionality and push notifications
 */
export function NotificationInitializer() {
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        const success = await notificationService.initialize();

        if (success && isDesktop()) {
          // Clear any existing badge on startup
          await notificationService.clearDockBadge();
        }
      } catch (error) {
        // Silent error handling for production
      }
    };

    initializeNotifications();
  }, []);

  // This component doesn't render anything visible
  return null;
}
