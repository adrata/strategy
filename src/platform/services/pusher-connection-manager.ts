/**
 * Pusher Connection Manager
 * 
 * Manages a single, reusable Pusher connection across the application
 * Implements connection pooling and health monitoring
 * Based on best practices for Next.js + Pusher real-time systems
 */

import React from 'react';
import PusherClient from 'pusher-js';
import { initializePusher } from '@/platform/pusher';

interface ConnectionState {
  isConnected: boolean;
  connectionState: string;
  lastConnected: number | null;
  reconnectAttempts: number;
}

class PusherConnectionManager {
  private static instance: PusherConnectionManager;
  private pusherClient: PusherClient | null = null;
  private connectionState: ConnectionState = {
    isConnected: false,
    connectionState: 'disconnected',
    lastConnected: null,
    reconnectAttempts: 0
  };
  private subscribers: Set<(state: ConnectionState) => void> = new Set();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  private constructor() {
    // Private constructor for singleton pattern
  }

  static getInstance(): PusherConnectionManager {
    if (!PusherConnectionManager.instance) {
      PusherConnectionManager.instance = new PusherConnectionManager();
    }
    return PusherConnectionManager.instance;
  }

  /**
   * Get or create Pusher client connection
   * Optionally accepts workspaceId and userId for auth configuration
   */
  getConnection(workspaceId?: string, userId?: string): PusherClient | null {
    if (this.pusherClient) {
      return this.pusherClient;
    }

    // Initialize Pusher connection
    if (workspaceId && userId) {
      // Initialize with auth configuration
      const pusherKey = process['env']['NEXT_PUBLIC_PUSHER_KEY'] || "";
      const pusherCluster = process['env']['NEXT_PUBLIC_PUSHER_CLUSTER'] || "us2";
      
      if (!pusherKey) {
        console.warn("⚠️ [PUSHER MANAGER] Pusher key not found");
        return null;
      }

      this.pusherClient = new PusherClient(pusherKey, {
        cluster: pusherCluster,
        authEndpoint: "/api/pusher/auth",
        auth: {
          headers: {
            "X-Workspace-ID": workspaceId,
            "X-User-ID": userId,
          },
        },
        forceTLS: true,
        enabledTransports: ["ws", "wss"],
        activityTimeout: 120000,
        pongTimeout: 30000,
        unavailableTimeout: 10000,
      });
    } else {
      // Fallback to standard initialization
      this.pusherClient = initializePusher();
    }
    
    if (this.pusherClient) {
      this.setupConnectionListeners();
      this.startHealthCheck();
    }

    return this.pusherClient;
  }

  /**
   * Setup connection event listeners
   */
  private setupConnectionListeners(): void {
    if (!this.pusherClient) return;

    this.pusherClient.connection.bind('connected', () => {
      console.log('✅ [PUSHER MANAGER] Connection established');
      this.connectionState.isConnected = true;
      this.connectionState.connectionState = 'connected';
      this.connectionState.lastConnected = Date.now();
      this.connectionState.reconnectAttempts = 0;
      this.reconnectDelay = 1000; // Reset delay
      this.notifySubscribers();
    });

    this.pusherClient.connection.bind('disconnected', () => {
      console.log('❌ [PUSHER MANAGER] Connection disconnected');
      this.connectionState.isConnected = false;
      this.connectionState.connectionState = 'disconnected';
      this.notifySubscribers();
    });

    this.pusherClient.connection.bind('error', (error: any) => {
      console.error('❌ [PUSHER MANAGER] Connection error:', error);
      this.connectionState.connectionState = 'error';
      this.notifySubscribers();
    });

    this.pusherClient.connection.bind('state_change', (states: any) => {
      const newState = states.current;
      console.log(`🔄 [PUSHER MANAGER] State changed: ${states.previous} -> ${newState}`);
      this.connectionState.connectionState = newState;
      this.connectionState.isConnected = newState === 'connected';
      this.notifySubscribers();
    });
  }

  /**
   * Start health check monitoring
   */
  private startHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(() => {
      if (!this.pusherClient) {
        this.connectionState.isConnected = false;
        this.connectionState.connectionState = 'disconnected';
        this.notifySubscribers();
        return;
      }

      const state = this.pusherClient.connection.state;
      const isConnected = state === 'connected';
      
      if (this.connectionState.isConnected !== isConnected) {
        this.connectionState.isConnected = isConnected;
        this.connectionState.connectionState = state;
        this.notifySubscribers();
      }

      // Auto-reconnect if disconnected and not already reconnecting
      if (!isConnected && state === 'disconnected' && this.connectionState.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect();
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.connectionState.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('⚠️ [PUSHER MANAGER] Max reconnect attempts reached');
      return;
    }

    this.connectionState.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.connectionState.reconnectAttempts - 1), 30000);
    
    console.log(`🔄 [PUSHER MANAGER] Attempting reconnect (${this.connectionState.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
    
    setTimeout(() => {
      if (this.pusherClient && this.pusherClient.connection.state === 'disconnected') {
        this.pusherClient.connect();
      }
    }, delay);
  }

  /**
   * Subscribe to connection state changes
   */
  subscribe(callback: (state: ConnectionState) => void): () => void {
    this.subscribers.add(callback);
    
    // Immediately call with current state
    callback(this.connectionState);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notify all subscribers of state changes
   */
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.connectionState);
      } catch (error) {
        console.error('❌ [PUSHER MANAGER] Error in subscriber callback:', error);
      }
    });
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Check if connection is healthy
   */
  isHealthy(): boolean {
    if (!this.pusherClient) return false;
    
    const state = this.pusherClient.connection.state;
    return state === 'connected' || state === 'connecting';
  }

  /**
   * Force reconnection
   */
  reconnect(): void {
    if (this.pusherClient) {
      this.connectionState.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.pusherClient.disconnect();
      setTimeout(() => {
        this.pusherClient = initializePusher();
        if (this.pusherClient) {
          this.setupConnectionListeners();
        }
      }, 1000);
    }
  }

  /**
   * Cleanup and disconnect
   */
  disconnect(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.pusherClient) {
      this.pusherClient.disconnect();
      this.pusherClient = null;
    }

    this.subscribers.clear();
    this.connectionState = {
      isConnected: false,
      connectionState: 'disconnected',
      lastConnected: null,
      reconnectAttempts: 0
    };
  }
}

// Export singleton instance
export const pusherConnectionManager = PusherConnectionManager.getInstance();

// React hook for connection state
export function usePusherConnection() {
  const [state, setState] = React.useState<ConnectionState>(pusherConnectionManager.getState());

  React.useEffect(() => {
    const unsubscribe = pusherConnectionManager.subscribe((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, []);

  return {
    ...state,
    isHealthy: pusherConnectionManager.isHealthy(),
    reconnect: () => pusherConnectionManager.reconnect()
  };
}

