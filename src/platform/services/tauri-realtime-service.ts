import WebSocket from "@tauri-apps/plugin-websocket";

// Tauri-native real-time service to replace Pusher for desktop
export class TauriRealtimeService {
  private ws: any = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    console.log(
      "🔌 [TAURI_REALTIME] Initializing Tauri WebSocket service for desktop",
    );
  }

  async connect(): Promise<void> {
    try {
      console.log("🔌 [TAURI_REALTIME] Connecting to WebSocket server...");

      // Connect to our same backend WebSocket endpoint
      const wsUrl = this.getWebSocketUrl();
      this['ws'] = await WebSocket.connect(wsUrl);

      this['isConnected'] = true;
      this['reconnectAttempts'] = 0;

      console.log("✅ [TAURI_REALTIME] Connected to WebSocket server");

      // Set up message listener
      this.ws.addListener((message: any) => {
        this.handleMessage(message);
      });

      // Auto-subscribe to Ross-Dan channels
      console.log(
        "📡 [TAURI_REALTIME] Auto-subscribing to Ross-Dan channels...",
      );
      this.subscribe("chat-ross-dan-real");
      this.subscribe("chat-ross-dan-typing");

      console.log("✅ [TAURI_REALTIME] Auto-subscription complete");
    } catch (error) {
      console.error("❌ [TAURI_REALTIME] Failed to connect:", error);
      this.handleReconnect();
    }
  }

  private getWebSocketUrl(): string {
    // Connect to the WebSocket server on port 3001
    // In development, this would be ws://localhost:3001
    // In production, this would be wss://action.adrata.com:3001
    const protocol = window['location']['protocol'] === "https:" ? "wss:" : "ws:";
    const host =
      window['location']['hostname'] === "tauri.localhost"
        ? "localhost:3001" // Development - connect to WebSocket server on port 3001
        : window.location.hostname + ":3001"; // Production - connect to same host on port 3001

    return `${protocol}//${host}`;
  }

  private handleMessage(message: any) {
    try {
      console.log("📨 [TAURI_REALTIME] Received message:", message);

      // Parse the message - it should contain channel and event info
      let data;
      if (typeof message['data'] === "string") {
        data = JSON.parse(message.data);
      } else {
        data = message.data;
      }

      const { channel, event, payload } = data;

      if (channel && event) {
        this.triggerEvent(channel, event, payload);
      }
    } catch (error) {
      console.error("❌ [TAURI_REALTIME] Error parsing message:", error);
    }
  }

  private triggerEvent(channel: string, event: string, payload: any) {
    const eventKey = `${channel}:${event}`;
    const channelListeners = this.listeners.get(eventKey);

    if (channelListeners) {
      console.log(
        `🎯 [TAURI_REALTIME] Triggering event ${eventKey} for ${channelListeners.size} listeners`,
      );
      channelListeners.forEach((callback) => {
        try {
          callback({ event, payload, channel });
        } catch (error) {
          console.error("❌ [TAURI_REALTIME] Error in event callback:", error);
        }
      });
    }
  }

  subscribe(channel: string): TauriChannel {
    console.log(`📡 [TAURI_REALTIME] Subscribing to channel: ${channel}`);

    // Send subscription message to server
    if (this['ws'] && this.isConnected) {
      try {
        this.ws.send(
          JSON.stringify({
            type: "subscribe",
            channel: channel,
            timestamp: new Date().toISOString(),
          }),
        );
        console.log(
          `✅ [TAURI_REALTIME] Subscription message sent for: ${channel}`,
        );
      } catch (error) {
        console.error(
          `❌ [TAURI_REALTIME] Failed to send subscription for ${channel}:`,
          error,
        );
      }
    } else {
      console.warn(
        `⚠️ [TAURI_REALTIME] Cannot subscribe to ${channel} - not connected`,
      );
    }

    return new TauriChannel(channel, this);
  }

  addListener(channel: string, event: string, callback: Function): () => void {
    const eventKey = `${channel}:${event}`;

    if (!this.listeners.has(eventKey)) {
      this.listeners.set(eventKey, new Set());
    }

    this.listeners.get(eventKey)!.add(callback);

    console.log(`👂 [TAURI_REALTIME] Added listener for ${eventKey}`);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventKey);
      if (listeners) {
        listeners.delete(callback);
        if (listeners['size'] === 0) {
          this.listeners.delete(eventKey);
        }
      }
    };
  }

  private async handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("❌ [TAURI_REALTIME] Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `🔄 [TAURI_REALTIME] Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`,
    );

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect() {
    if (this.ws) {
      console.log("🔌 [TAURI_REALTIME] Disconnecting WebSocket");
      this.ws.disconnect();
      this['ws'] = null;
      this['isConnected'] = false;
    }
  }

  getConnectionState(): "connected" | "disconnected" | "connecting" {
    return this.isConnected ? "connected" : "disconnected";
  }
}

class TauriChannel {
  constructor(
    private channelName: string,
    private service: TauriRealtimeService,
  ) {}

  bind(event: string, callback: Function): () => void {
    return this.service.addListener(this.channelName, event, callback);
  }
}

// Create and export a singleton instance
export const tauriRealtimeService = new TauriRealtimeService();

// Auto-connect when service is created
if (typeof window !== "undefined") {
  // Check if we're in Tauri environment
  if ((window as any).__TAURI__) {
    console.log(
      "🚀 [TAURI_REALTIME] Detected Tauri environment, auto-connecting...",
    );
    // Add a small delay to ensure the WebSocket server is ready
    setTimeout(() => {
      tauriRealtimeService.connect().catch((error) => {
        console.error("❌ [TAURI_REALTIME] Auto-connect failed:", error);
      });
    }, 2000); // 2 second delay
  } else {
    console.log(
      "🌐 [TAURI_REALTIME] Not in Tauri environment, skipping WebSocket connection",
    );
  }
}
