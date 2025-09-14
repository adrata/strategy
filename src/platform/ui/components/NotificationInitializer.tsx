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
        console.log("🔔 [APP_STARTUP] Initializing notification service...");
        const success = await notificationService.initialize();

        if (success && isDesktop()) {
          console.log(
            "✅ [APP_STARTUP] Notifications initialized successfully - Dock badges enabled",
          );
          // Clear any existing badge on startup
          await notificationService.clearDockBadge();
          console.log(
            "🍎 [DOCK_BADGE] Cleared startup badge - ready for new messages",
          );
        } else if (success) {
          console.log("✅ [APP_STARTUP] Notifications initialized for web");
        } else {
          console.warn(
            "⚠️ [APP_STARTUP] Notification initialization failed (non-critical)",
          );
        }
      } catch (error) {
        console.warn(
          "⚠️ [APP_STARTUP] Notification initialization error (non-critical):",
          error,
        );
      }
    };

    initializeNotifications();
  }, []);

  // This component doesn't render anything visible
  return null;
}
