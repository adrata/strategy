/**
 * Pusher Real-time Sync Service
 * Enables live updates across web, desktop, and mobile platforms
 * Perfect for Vercel deployment
 */

import React from "react";
import Pusher from "pusher";
import PusherClient from "pusher-js";
import { pusherConnectionManager } from './pusher-connection-manager';

// Server-side Pusher instance (for sending events)
export const pusherServer = new Pusher({
  appId: process['env']['PUSHER_APP_ID'] || "",
  key: process['env']['PUSHER_KEY'] || "",
  secret: process['env']['PUSHER_SECRET'] || "",
  cluster: process['env']['PUSHER_CLUSTER'] || "us2",
  useTLS: true,
});

// Client-side Pusher instance (for receiving events)
let pusherClient: PusherClient | null = null;

export interface RealTimeUpdate {
  type:
    | "lead_created"
    | "lead_updated"
    | "contact_created"
    | "contact_updated"
    | "account_created"
    | "account_updated"
    | "opportunity_created"
    | "opportunity_updated"
    | "monaco_pipeline_progress"
    | "monaco_pipeline_completed"
    | "data_sync_complete"
    | "user_joined"
    | "user_left";
  payload: any;
  timestamp: string;
  source: "web" | "desktop" | "mobile";
  userId: string;
  workspaceId: string;
}

export interface PusherChannels {
  workspace: string; // `workspace-${workspaceId}`
  user: string; // `user-${userId}`
  monaco: string; // `monaco-${workspaceId}`
  crm: string; // `crm-${workspaceId}`
}

/**
 * Server-side service for broadcasting real-time updates
 */
export class PusherServerService {
  /**
   * Broadcast Pipeline data update to all connected clients
   */
  static async broadcastCRMUpdate(update: RealTimeUpdate): Promise<void> {
    try {
      const channels = [
        `workspace-${update.workspaceId}`,
        `user-${update.userId}`,
        `crm-${update.workspaceId}`,
      ];

      console.log(`📡 Broadcasting ${update.type} to channels:`, channels);

      // Send to all relevant channels
      await Promise.all(
        channels.map((channel) =>
          pusherServer.trigger(channel, "crm-update", update),
        ),
      );

      console.log(`✅ Broadcast successful: ${update.type}`);
    } catch (error) {
      console.error("❌ Failed to broadcast Pipeline update:", error);
    }
  }

  /**
   * Broadcast Monaco Pipeline progress
   */
  static async broadcastMonacoProgress(
    workspaceId: string,
    executionId: string,
    progress: any,
  ): Promise<void> {
    try {
      const update: RealTimeUpdate = {
        type: "monaco_pipeline_progress",
        payload: {
          execution_id: executionId,
          progress,
        },
        timestamp: new Date().toISOString(),
        source: "web",
        userId: progress.trigger_user || "system",
        workspaceId,
      };

      const channels = [`workspace-${workspaceId}`, `monaco-${workspaceId}`];

      await Promise.all(
        channels.map((channel) =>
          pusherServer.trigger(channel, "monaco-progress", update),
        ),
      );

      console.log(
        `🔥 Monaco progress broadcast: ${executionId} - ${progress.percentage}%`,
      );
    } catch (error) {
      console.error("❌ Failed to broadcast Monaco progress:", error);
    }
  }

  /**
   * Broadcast Monaco Pipeline completion
   */
  static async broadcastMonacoComplete(
    workspaceId: string,
    executionId: string,
    results: any,
  ): Promise<void> {
    try {
      const update: RealTimeUpdate = {
        type: "monaco_pipeline_completed",
        payload: {
          execution_id: executionId,
          results,
        },
        timestamp: new Date().toISOString(),
        source: "web",
        userId: results.trigger_user || "system",
        workspaceId,
      };

      const channels = [`workspace-${workspaceId}`, `monaco-${workspaceId}`];

      await Promise.all(
        channels.map((channel) =>
          pusherServer.trigger(channel, "monaco-complete", update),
        ),
      );

      console.log(`🎉 Monaco completion broadcast: ${executionId}`);
    } catch (error) {
      console.error("❌ Failed to broadcast Monaco completion:", error);
    }
  }

  /**
   * Broadcast data sync completion
   */
  static async broadcastDataSync(
    workspaceId: string,
    userId: string,
    syncResults: any,
  ): Promise<void> {
    try {
      const update: RealTimeUpdate = {
        type: "data_sync_complete",
        payload: syncResults,
        timestamp: new Date().toISOString(),
        source: "web",
        userId,
        workspaceId,
      };

      await pusherServer.trigger(
        `workspace-${workspaceId}`,
        "data-sync",
        update,
      );

      console.log(`🔄 Data sync broadcast: ${workspaceId}`);
    } catch (error) {
      console.error("❌ Failed to broadcast data sync:", error);
    }
  }

  /**
   * Notify user presence (join/leave)
   */
  static async broadcastUserPresence(
    workspaceId: string,
    userId: string,
    action: "joined" | "left",
    userInfo: any,
  ): Promise<void> {
    try {
      const update: RealTimeUpdate = {
        type: action === "joined" ? "user_joined" : "user_left",
        payload: userInfo,
        timestamp: new Date().toISOString(),
        source: "web",
        userId,
        workspaceId,
      };

      await pusherServer.trigger(
        `workspace-${workspaceId}`,
        "user-presence",
        update,
      );

      console.log(`👥 User presence broadcast: ${userInfo.name} ${action}`);
    } catch (error) {
      console.error("❌ Failed to broadcast user presence:", error);
    }
  }
}

/**
 * Client-side service for receiving real-time updates
 */
export class PusherClientService {
  private channels: Map<string, any> = new Map();
  private isConnected = false;
  private workspaceId = "";
  private userId = "";

  /**
   * Initialize Pusher client connection
   * Uses connection manager for connection pooling and reuse
   */
  initialize(workspaceId: string, userId: string): void {
    if (typeof window === "undefined") {
      console.log("⚠️ Pusher client not available on server side");
      return;
    }

    this['workspaceId'] = workspaceId;
    this['userId'] = userId;

    // Use connection manager for optimized connection reuse
    const connection = pusherConnectionManager.getConnection(workspaceId, userId);
    
    if (connection) {
      pusherClient = connection;
      this['isConnected'] = connection.connection.state === 'connected';
      
      // Subscribe to connection state changes
      pusherConnectionManager.subscribe((state) => {
        this['isConnected'] = state.isConnected;
      });
      
      console.log("🔗 [Pusher Client] Initialized using connection manager");
    } else {
      // Fallback to direct initialization if manager fails
      console.warn("⚠️ [Pusher Client] Connection manager unavailable, using direct initialization");
      const pusherKey = process['env']['NEXT_PUBLIC_PUSHER_KEY'] || "";
      const pusherCluster = process['env']['NEXT_PUBLIC_PUSHER_CLUSTER'] || "us2";
      
      pusherClient = new PusherClient(pusherKey, {
        cluster: pusherCluster,
        authEndpoint: "/api/pusher/auth",
        auth: {
          headers: {
            "X-Workspace-ID": workspaceId,
            "X-User-ID": userId,
          },
        },
      });

      pusherClient.connection.bind("connected", () => {
        console.log("✅ Pusher connected");
        this['isConnected'] = true;
      });

      pusherClient.connection.bind("disconnected", () => {
        console.log("❌ Pusher disconnected");
        this['isConnected'] = false;
      });

      pusherClient.connection.bind("error", (error: any) => {
        console.error("❌ Pusher connection error:", error);
      });
    }
  }

  /**
   * Subscribe to workspace updates
   */
  subscribeToWorkspace(
    onCRMUpdate: (update: RealTimeUpdate) => void,
    onDataSync: (update: RealTimeUpdate) => void,
    onUserPresence: (update: RealTimeUpdate) => void,
  ): void {
    if (!pusherClient) {
      console.error("❌ Pusher client not initialized");
      return;
    }

    const channelName = `workspace-${this.workspaceId}`;
    const channel = pusherClient.subscribe(channelName);
    this.channels.set("workspace", channel);

    // Bind event handlers
    channel.bind("crm-update", onCRMUpdate);
    channel.bind("data-sync", onDataSync);
    channel.bind("user-presence", onUserPresence);

    console.log(`📡 Subscribed to workspace channel: ${channelName}`);
  }

  /**
   * Subscribe to Monaco Pipeline updates
   */
  subscribeToMonaco(
    onProgress: (update: RealTimeUpdate) => void,
    onComplete: (update: RealTimeUpdate) => void,
  ): void {
    if (!pusherClient) {
      console.error("❌ Pusher client not initialized");
      return;
    }

    const channelName = `monaco-${this.workspaceId}`;
    const channel = pusherClient.subscribe(channelName);
    this.channels.set("monaco", channel);

    // Bind event handlers
    channel.bind("monaco-progress", onProgress);
    channel.bind("monaco-complete", onComplete);

    console.log(`⚡ Subscribed to Monaco channel: ${channelName}`);
  }

  /**
   * Subscribe to user-specific updates
   */
  subscribeToUser(onPersonalUpdate: (update: RealTimeUpdate) => void): void {
    if (!pusherClient) {
      console.error("❌ Pusher client not initialized");
      return;
    }

    const channelName = `user-${this.userId}`;
    const channel = pusherClient.subscribe(channelName);
    this.channels.set("user", channel);

    // Bind event handlers
    channel.bind("crm-update", onPersonalUpdate);

    console.log(`👤 Subscribed to user channel: ${channelName}`);
  }

  /**
   * Subscribe to Speedrun signals
   */
  subscribeToSpeedrunSignals(onSignal: (update: RealTimeUpdate) => void): void {
    if (!pusherClient) {
      console.error("❌ Pusher client not initialized");
      return;
    }

    const channelName = `workspace-${this.workspaceId}`;
    console.log(`🔍 [Pusher Client] Attempting to subscribe to speedrun signals on channel: ${channelName}`);
    console.log(`🔍 [Pusher Client] Workspace ID: ${this.workspaceId}, User ID: ${this.userId}`);
    
    const channel = pusherClient.subscribe(channelName);
    this.channels.set("speedrun", channel);

    // Bind speedrun signal event
    channel.bind("speedrun_signal", (data: any) => {
      console.log(`🚨 [Pusher Client] Speedrun signal received on channel ${channelName}:`, data);
      onSignal(data);
    });

    console.log(`🚨 Subscribed to speedrun signals on channel: ${channelName}`);
  }

  /**
   * Subscribe to Zoho update notifications
   */
  subscribeToZohoNotifications(onNotification: (data: any) => void): void {
    if (!pusherClient) {
      console.error("❌ Pusher client not initialized");
      return;
    }

    const channelName = `workspace-${this.workspaceId}`;
    console.log(`🔍 [Pusher Client] Subscribing to Zoho notifications on channel: ${channelName}`);
    
    const channel = pusherClient.subscribe(channelName);
    this.channels.set("zoho", channel);

    // Bind Zoho update event
    channel.bind("zoho_update", (data: any) => {
      console.log(`🔔 [Pusher Client] Zoho notification received on channel ${channelName}:`, data);
      onNotification(data);
    });

    console.log(`🔔 Subscribed to Zoho notifications on channel: ${channelName}`);
  }

  /**
   * Subscribe to a specific channel with custom event handler
   * Optimized with proper cleanup and duplicate prevention
   * Waits for Pusher connection before subscribing
   */
  subscribeToChannel(channelName: string, eventName: string, onEvent: (data: any) => void): () => void {
    // Create unique key for this subscription
    const subscriptionKey = `${channelName}-${eventName}`;
    
    // Check if already subscribed to avoid duplicates
    if (this.channels.has(subscriptionKey)) {
      console.log(`⚠️ [Pusher Client] Already subscribed to ${eventName} on channel: ${channelName}`);
      // Return cleanup function that does nothing (already subscribed)
      return () => {};
    }

    let channel: any = null;
    let eventHandler: any = null;
    let cleanedUp = false;
    let hasLoggedWarning = false;
    let retryInterval: NodeJS.Timeout | null = null;
    let connectionHandler: (() => void) | null = null;

    const attemptSubscription = (isRetry = false) => {
      if (!pusherClient) {
        // Only log warning once per subscription attempt, not on every retry
        if (!hasLoggedWarning) {
          console.warn(`⏳ [Pusher Client] Pusher not ready, will retry subscription to ${eventName} on ${channelName}`);
          hasLoggedWarning = true;
        }
        return false;
      }

      console.log(`🔍 [Pusher Client] Subscribing to ${eventName} on channel: ${channelName}`);
      
      channel = pusherClient.subscribe(channelName);
      this.channels.set(subscriptionKey, channel);

      // Bind custom event with error handling
      eventHandler = (data: any) => {
        try {
          console.log(`📡 [Pusher Client] ${eventName} received on channel ${channelName}:`, data);
          onEvent(data);
        } catch (error) {
          console.error(`❌ [Pusher Client] Error in event handler for ${eventName}:`, error);
        }
      };
      
      channel.bind(eventName, eventHandler);
      console.log(`📡 Subscribed to ${eventName} on channel: ${channelName}`);
      return true;
    };

    // Try immediate subscription
    if (!attemptSubscription()) {
      // If Pusher not ready, wait for connection and retry
      connectionHandler = () => {
        if (!cleanedUp && pusherClient && pusherClient.connection.state === 'connected') {
          console.log(`🔄 [Pusher Client] Pusher connected, retrying subscription to ${eventName} on ${channelName}`);
          attemptSubscription(true);
          // Unbind after successful subscription
          if (pusherClient && connectionHandler) {
            pusherClient.connection.unbind('connected', connectionHandler);
            connectionHandler = null;
          }
        }
      };

      // Wait for connection
      if (pusherClient) {
        pusherClient.connection.bind('connected', connectionHandler);
      } else {
        // Retry every 2 seconds until Pusher is available (max 10 attempts)
        // Increased interval to reduce log frequency
        let retryCount = 0;
        retryInterval = setInterval(() => {
          retryCount++;
          if (cleanedUp || retryCount > 10) {
            if (retryInterval) {
              clearInterval(retryInterval);
              retryInterval = null;
            }
            return;
          }
          
          if (attemptSubscription(true)) {
            if (retryInterval) {
              clearInterval(retryInterval);
              retryInterval = null;
            }
          }
        }, 2000);
      }
    }

    // Return cleanup function
    return () => {
      try {
        cleanedUp = true;
        // Clear retry interval if it exists
        if (retryInterval) {
          clearInterval(retryInterval);
          retryInterval = null;
        }
        // Unbind connection handler if it exists
        if (pusherClient && connectionHandler) {
          pusherClient.connection.unbind('connected', connectionHandler);
          connectionHandler = null;
        }
        console.log(`🧹 [Pusher Client] Unsubscribing from ${eventName} on channel: ${channelName}`);
        if (channel && eventHandler) {
          channel.unbind(eventName, eventHandler);
        }
        this.channels.delete(subscriptionKey);
      } catch (error) {
        console.error(`❌ [Pusher Client] Error unsubscribing from ${eventName}:`, error);
      }
    };
  }

  /**
   * Disconnect from all channels
   */
  disconnect(): void {
    if (!pusherClient) return;

    // Unsubscribe from all channels
    this.channels.forEach((channel, name) => {
      pusherClient?.unsubscribe(channel.name);
      console.log(`📡 Unsubscribed from ${name} channel`);
    });

    this.channels.clear();
    pusherClient.disconnect();
    this['isConnected'] = false;

    console.log("🔌 Pusher client disconnected");
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    connected: boolean;
    channels: string[];
    workspaceId: string;
    userId: string;
  } {
    return {
      connected: this.isConnected,
      channels: Array.from(this.channels.keys()),
      workspaceId: this.workspaceId,
      userId: this.userId,
    };
  }
}

// Export singleton instance
export const pusherClientService = new PusherClientService();

/**
 * React Hook for Pusher real-time updates
 */
export function usePusherRealTime(workspaceId: string, userId: string) {
  const [isConnected, setIsConnected] = React.useState(false);
  const [lastUpdate, setLastUpdate] = React.useState<RealTimeUpdate | null>(
    null,
  );
  const [crmUpdates, setCrmUpdates] = React.useState<RealTimeUpdate[]>([]);
  const [monacoProgress, setMonacoProgress] = React.useState<
    Record<string, any>
  >({});

  React.useEffect(() => {
    if (!workspaceId || !userId) return;

    // Initialize Pusher
    pusherClientService.initialize(workspaceId, userId);

    // Subscribe to workspace updates
    pusherClientService.subscribeToWorkspace(
      (update) => {
        console.log("📨 Pipeline Update received:", update);
        setLastUpdate(update);
        setCrmUpdates((prev) => [...prev.slice(-9), update]); // Keep last 10 updates
      },
      (update) => {
        console.log("🔄 Data Sync received:", update);
        setLastUpdate(update);
      },
      (update) => {
        console.log("👥 User Presence received:", update);
        setLastUpdate(update);
      },
    );

    // Subscribe to Monaco updates
    pusherClientService.subscribeToMonaco(
      (update) => {
        console.log("⚡ Monaco Progress received:", update);
        const { execution_id, progress } = update.payload;
        setMonacoProgress((prev) => ({
          ...prev,
          [execution_id]: progress,
        }));
        setLastUpdate(update);
      },
      (update) => {
        console.log("🎉 Monaco Complete received:", update);
        const { execution_id } = update.payload;
        setMonacoProgress((prev) => ({
          ...prev,
          [execution_id]: { ...prev[execution_id], status: "completed" },
        }));
        setLastUpdate(update);
      },
    );

    // Subscribe to user-specific updates
    pusherClientService.subscribeToUser((update) => {
      console.log("👤 Personal Update received:", update);
      setLastUpdate(update);
    });

    // Subscribe to Speedrun signals
    pusherClientService.subscribeToSpeedrunSignals((update) => {
      console.log("🚨 Speedrun Signal received:", update);
      setLastUpdate(update);
    });

    setIsConnected(true);

    // Cleanup on unmount
    return () => {
      pusherClientService.disconnect();
      setIsConnected(false);
    };
  }, [workspaceId, userId]);

  return {
    isConnected,
    lastUpdate,
    crmUpdates,
    monacoProgress,
    connectionStatus: pusherClientService.getConnectionStatus(),
  };
}

// Helper function to trigger real-time updates from API routes
export async function triggerRealTimeUpdate(
  update: RealTimeUpdate,
): Promise<void> {
  return PusherServerService.broadcastCRMUpdate(update);
}

// Helper function to trigger Monaco Pipeline updates
export async function triggerMonacoUpdate(
  workspaceId: string,
  executionId: string,
  progress: any,
  type: "progress" | "complete" = "progress",
): Promise<void> {
  if (type === "progress") {
    return PusherServerService.broadcastMonacoProgress(
      workspaceId,
      executionId,
      progress,
    );
  } else {
    return PusherServerService.broadcastMonacoComplete(
      workspaceId,
      executionId,
      progress,
    );
  }
}