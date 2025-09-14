/**
 * Pusher Client Configuration
 * Real-time communication for web and desktop platforms
 */

import PusherClient from "pusher-js";

// Initialize Pusher client
export let pusherClient: PusherClient | null = null;

// Initialize Pusher client
export function initializePusher(): PusherClient | null {
  if (typeof window === "undefined") {
    console.log("⚠️ Pusher not available on server side");
    return null;
  }

  if (pusherClient) {
    return pusherClient;
  }

  try {
    // Validate Pusher config before initialization
    const pusherKey = process['env']['NEXT_PUBLIC_PUSHER_KEY'] || "";
    const pusherCluster = process['env']['NEXT_PUBLIC_PUSHER_CLUSTER'] || "us3";
    
    if (!pusherKey) {
      console.warn("⚠️ Pusher key not found, running in offline mode");
      return null;
    }

    pusherClient = new PusherClient(pusherKey, {
      cluster: pusherCluster,
      forceTLS: true,
      enabledTransports: ["ws", "wss"],
      activityTimeout: 120000,
      pongTimeout: 30000,
      unavailableTimeout: 10000,
    });

    pusherClient.connection.bind("connected", () => {
      console.log("✅ Pusher connected");
    });

    pusherClient.connection.bind("disconnected", () => {
      console.log("❌ Pusher disconnected");
    });

    pusherClient.connection.bind("error", (error: any) => {
      // Use console.warn instead of console.error to avoid showing as error in browser
      console.warn("⚠️ Pusher connection error (continuing in offline mode):", error);
      // Graceful degradation - don't throw errors that break the UI
      // Just log the error and continue without real-time features
    });

    pusherClient.connection.bind("failed", () => {
      console.warn("⚠️ Pusher connection failed, running in offline mode");
    });

    // Set connection timeout - if not connected within 15 seconds, proceed anyway
    setTimeout(() => {
      if (pusherClient && pusherClient.connection.state !== "connected") {
        console.warn("⚠️ Pusher connection timeout, proceeding in offline mode");
      }
    }, 15000);

    return pusherClient;
  } catch (error) {
    console.error("❌ Failed to initialize Pusher:", error);
    return null;
  }
}

// Check if Pusher is available
export function isPusherAvailable(): boolean {
  try {
    return pusherClient !== null && pusherClient['connection']['state'] === "connected";
  } catch (error) {
    console.warn("⚠️ Error checking Pusher availability:", error);
    return false;
  }
}

// Get channel name helper
export function getChannelName(workspaceId: string, type: string): string {
  return `${type}-${workspaceId}`;
}

// Get connection state
export function getPusherConnectionState(): string {
  try {
    return pusherClient?.connection.state || "disconnected";
  } catch (error) {
    console.warn("⚠️ Error getting Pusher connection state:", error);
    return "error";
  }
}

// Global error handler for uncaught Pusher errors
if (typeof window !== "undefined") {
  // Add global error handler for Pusher connection issues
  window.addEventListener("error", (event) => {
    if (event['error'] && event['error']['message'] && 
        (event.error.message.includes("pusher") || 
         event.error.message.includes("Pusher") ||
         event.error.stack?.includes("pusher"))) {
      console.warn("⚠️ Caught global Pusher error (continuing in offline mode):", event.error);
      event.preventDefault(); // Prevent error from breaking the UI
      return false; // Prevent error from propagating
    }
  });

  // Auto-initialize on import
  initializePusher();
} 