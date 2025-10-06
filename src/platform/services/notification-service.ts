import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
  registerActionTypes,
  onAction,
} from "@tauri-apps/plugin-notification";
import { invoke } from "@tauri-apps/api/core";
import { isDesktop } from "@/platform/platform-detection";

/**
 * Modern Notification Service using Official Tauri Plugin (2024)
 *
 * This service provides:
 * - Cross-platform notifications (Web + Desktop)
 * - Proper permission handling
 * - Mac dock badge integration
 * - Action support for enhanced notifications
 * - Comprehensive error handling and logging
 */
export class NotificationService {
  private static instance: NotificationService;
  private hasPermission = false;
  private permissionRequested = false;
  private isInitialized = false;

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService['instance'] = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize notifications and request permission if needed
   * Uses official Tauri plugin for desktop, browser API for web
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return this.hasPermission;
    }

    try {
      if (isDesktop()) {
        this['hasPermission'] = await this.initializeTauriNotifications();
      } else {
        this['hasPermission'] = await this.initializeBrowserNotifications();
      }

      this['isInitialized'] = true;

      return this.hasPermission;
    } catch (error) {
      // Initialization failed - silent error handling
      this['isInitialized'] = true; // Don't retry constantly
      return false;
    }
  }

  /**
   * Initialize Tauri notifications using official plugin
   */
  private async initializeTauriNotifications(): Promise<boolean> {
    try {
      // Step 1: Check if permission is already granted
      const permissionGranted = await isPermissionGranted();
      console.log(
        `🔔 [NOTIFICATIONS] Current permission status: ${permissionGranted}`,
      );

      if (permissionGranted) {
        await this.setupTauriNotificationActions();
        return true;
      }

      // Step 2: Request permission if not granted
      if (!this.permissionRequested) {
        this['permissionRequested'] = true;
        console.log("🔔 [NOTIFICATIONS] Requesting notification permission...");

        const permission = await requestPermission();
        const isGranted = permission === "granted";

        console.log(`🔔 [NOTIFICATIONS] Permission result: ${permission}`);

        if (isGranted) {
          await this.setupTauriNotificationActions();
        }

        return isGranted;
      }

      return false;
    } catch (error) {
      console.error("❌ [NOTIFICATIONS] Tauri initialization failed:", error);
      return false;
    }
  }

  /**
   * Setup notification action types for enhanced notifications
   */
  private async setupTauriNotificationActions(): Promise<void> {
    try {
      await registerActionTypes([
        {
          id: "chat-messages",
          actions: [
            {
              id: "reply",
              title: "Reply",
              input: true,
              inputButtonTitle: "Send",
              inputPlaceholder: "Type your reply...",
            },
            {
              id: "mark-read",
              title: "Mark as Read",
              foreground: false,
            },
          ],
        },
      ]);

      // Listen for action events
      await onAction((notification) => {
        console.log("🔔 [NOTIFICATIONS] Action performed:", notification);
        // Handle notification actions here if needed
      });

      console.log("✅ [NOTIFICATIONS] Action types registered successfully");
    } catch (error) {
      console.warn(
        "⚠️ [NOTIFICATIONS] Failed to setup actions (may not be supported):",
        error,
      );
      // Actions are optional, don't fail initialization
    }
  }

  /**
   * Initialize browser notifications for web mode
   */
  private async initializeBrowserNotifications(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.warn("🔔 [NOTIFICATIONS] Browser does not support notifications");
      return false;
    }

    if (Notification['permission'] === "granted") {
      console.log(
        "✅ [NOTIFICATIONS] Browser notification permission already granted",
      );
      return true;
    }

    if (Notification.permission !== "denied" && !this.permissionRequested) {
      this['permissionRequested'] = true;
      const permission = await Notification.requestPermission();
      const isGranted = permission === "granted";
      console.log(
        `🔔 [NOTIFICATIONS] Browser permission requested: ${permission}`,
      );
      return isGranted;
    }

    console.log(
      "🔔 [NOTIFICATIONS] Browser notifications denied or already requested",
    );
    return false;
  }

  /**
   * Show a notification using the appropriate method
   */
  async showNotification(
    title: string,
    body: string,
    options?: {
      icon?: string;
      channelId?: string;
      actionTypeId?: string;
    },
  ): Promise<void> {
    if (!this.hasPermission) {
      console.log("🔔 [NOTIFICATIONS] No permission to show notifications");
      return;
    }

    try {
      if (isDesktop()) {
        await this.showTauriNotification(title, body, options);
      } else {
        await this.showBrowserNotification(title, body, options?.icon);
      }

      console.log(`✅ [NOTIFICATIONS] Notification shown: ${title}`);
    } catch (error) {
      console.error("❌ [NOTIFICATIONS] Failed to show notification:", error);
    }
  }

  /**
   * Show Tauri notification using official plugin
   */
  private async showTauriNotification(
    title: string,
    body: string,
    options?: {
      icon?: string;
      channelId?: string;
      actionTypeId?: string;
    },
  ): Promise<void> {
    const notification: any = {
      title,
      body,
    };

    // Add optional properties if provided
    if (options?.icon) {
      notification['icon'] = options.icon;
    }
    if (options?.channelId) {
      notification['channelId'] = options.channelId;
    }
    if (options?.actionTypeId) {
      notification['actionTypeId'] = options.actionTypeId;
    }

    await sendNotification(notification);
  }

  /**
   * Show browser notification (web fallback)
   */
  private async showBrowserNotification(
    title: string,
    body: string,
    icon?: string,
  ): Promise<void> {
    const notification = new Notification(title, {
      body,
      icon: icon || "/adrata-icon.png",
              badge: "/favicon.ico",
      requireInteraction: false,
      silent: false,
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    // Handle click to focus app
    notification['onclick'] = () => {
      window.focus();
      notification.close();
    };
  }

  /**
   * Show notification for a new message with Ross-Dan chat integration
   */
  async showMessageNotification(
    senderName: string,
    message: string,
    fromEmail?: string,
  ): Promise<void> {
    const title = `New message from ${senderName}`;
    const body =
      message.length > 100 ? `${message.substring(0, 100)}...` : message;

    await this.showNotification(title, body, {
      icon: "/adrata-icon.png",
      channelId: "messages",
      actionTypeId: "chat-messages",
    });

    // Update Mac dock badge if on desktop
    if (isDesktop()) {
      try {
        // You can implement unread count tracking here
        await this.updateDockBadge(1); // Example: increment by 1
      } catch (error) {
        console.warn("⚠️ [NOTIFICATIONS] Failed to update dock badge:", error);
      }
    }
  }

  /**
   * Show notification for Ross-Dan chat messages
   */
  async notifyRossDanMessage(
    senderName: string,
    message: string,
    isCurrentUser: boolean = false,
  ): Promise<void> {
    // Don't notify for own messages
    if (isCurrentUser) {
      return;
    }

    // Ensure notifications are initialized
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Special handling for Ross's welcome message
    if (message.includes("Welcome to a new world")) {
      await this.showNotification(
        "🌟 Ross Sylvester",
        "Welcome to a new world. Where the gap between what you want and what you can achieve disappears.",
        {
          icon: "/adrata-icon.png",
          channelId: "welcome",
        },
      );
      return;
    }

    // Regular message notification
    await this.showMessageNotification(senderName, message);
  }

  /**
   * Update Mac dock badge (desktop only)
   */
  async updateDockBadge(count: number): Promise<void> {
    if (!isDesktop()) {
      return;
    }

    try {
      console.log(`🍎 [NOTIFICATIONS] Updating dock badge to: ${count}`);
      if (count > 0) {
        await invoke("set_badge_count", { count });
        console.log(`✅ [NOTIFICATIONS] Dock badge set to ${count}`);
      } else {
        await invoke("clear_badge");
        console.log(`✅ [NOTIFICATIONS] Dock badge cleared`);
      }
    } catch (error) {
      // Gracefully handle badge failures - don't crash the app
      console.warn(
        "⚠️ [NOTIFICATIONS] Badge update failed (non-critical):",
        error,
      );
      // This is non-critical functionality, so we just log and continue
    }
  }

  /**
   * Clear Mac dock badge (desktop only)
   */
  async clearDockBadge(): Promise<void> {
    if (!isDesktop()) {
      return;
    }

    try {
      await invoke("clear_badge");
    } catch (error) {
      console.error("❌ [NOTIFICATIONS] Failed to clear dock badge:", error);
    }
  }

  /**
   * Check if notifications are available and permitted
   */
  isAvailable(): boolean {
    return this.hasPermission;
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): "granted" | "denied" | "default" | "unknown" {
    if (!this.isInitialized) {
      return "unknown";
    }

    if (isDesktop()) {
      return this.hasPermission ? "granted" : "denied";
    } else {
      return Notification.permission;
    }
  }

  /**
   * Force re-initialization (useful for debugging)
   */
  async reinitialize(): Promise<boolean> {
    this['isInitialized'] = false;
    this['hasPermission'] = false;
    this['permissionRequested'] = false;
    return this.initialize();
  }
}

// Export the singleton instance for easy use throughout the app
export const notificationService = NotificationService.getInstance();
