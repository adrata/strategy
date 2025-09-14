/**
 * Real-time Streaming Service with Pusher
 * Provides instant updates for pipeline data changes
 */

import Pusher from 'pusher';
import { cache } from './';

// Server-side Pusher instance
let pusherServer: Pusher | null = null;

function getPusherServer(): Pusher | null {
  if (!pusherServer) {
    try {
      const appId = process['env']['PUSHER_APP_ID'];
      const key = process['env']['PUSHER_KEY'];
      const secret = process['env']['PUSHER_SECRET'];
      const cluster = process['env']['PUSHER_CLUSTER'] || 'us2';

      if (!appId || !key || !secret) {
        console.warn('🔴 [PUSHER] Missing configuration - real-time updates disabled');
        return null;
      }

      pusherServer = new Pusher({
        appId,
        key,
        secret,
        cluster,
        useTLS: true,
      });

      console.log('🟢 [PUSHER] Server initialized successfully');
    } catch (error) {
      console.error('🔴 [PUSHER] Failed to initialize:', error);
      return null;
    }
  }

  return pusherServer;
}

export class RealtimeStreaming {
  /**
   * Broadcast pipeline data update to all connected clients
   */
  static async broadcastPipelineUpdate(
    workspaceId: string,
    userId: string,
    section: string,
    data: any
  ): Promise<boolean> {
    try {
      const pusher = getPusherServer();
      if (!pusher) {
        console.warn('🔴 [PUSHER] Server not available - skipping broadcast');
        return false;
      }

      const channelName = `workspace-${workspaceId}`;
      const eventName = 'pipeline-update';
      
      const payload = {
        section,
        data,
        userId,
        timestamp: new Date().toISOString(),
        type: 'data-update'
      };

      await pusher.trigger(channelName, eventName, payload);
      
      console.log(`📡 [PUSHER] Broadcasted ${section} update to ${channelName}`);
      return true;
    } catch (error) {
      console.error('🔴 [PUSHER] Broadcast failed:', error);
      return false;
    }
  }

  /**
   * Broadcast cache invalidation to all clients
   */
  static async broadcastCacheInvalidation(
    workspaceId: string,
    patterns: string[]
  ): Promise<boolean> {
    try {
      const pusher = getPusherServer();
      if (!pusher) {
        return false;
      }

      const channelName = `workspace-${workspaceId}`;
      const eventName = 'cache-invalidation';
      
      const payload = {
        patterns,
        timestamp: new Date().toISOString(),
        type: 'cache-invalidation'
      };

      await pusher.trigger(channelName, eventName, payload);
      
      console.log(`🧹 [PUSHER] Broadcasted cache invalidation to ${channelName}`);
      return true;
    } catch (error) {
      console.error('🔴 [PUSHER] Cache invalidation broadcast failed:', error);
      return false;
    }
  }

  /**
   * Stream partial data updates as they become available
   */
  static async streamPartialUpdate(
    workspaceId: string,
    userId: string,
    partialData: {
      section: string;
      data: any;
      isComplete: boolean;
      progress?: number;
    }
  ): Promise<boolean> {
    try {
      const pusher = getPusherServer();
      if (!pusher) {
        return false;
      }

      const channelName = `user-${userId}`;
      const eventName = 'partial-update';
      
      const payload = {
        ...partialData,
        workspaceId,
        timestamp: new Date().toISOString(),
        type: 'partial-update'
      };

      await pusher.trigger(channelName, eventName, payload);
      
      console.log(`🔄 [PUSHER] Streamed partial ${partialData.section} update (${partialData.progress || 0}%)`);
      return true;
    } catch (error) {
      console.error('🔴 [PUSHER] Partial update stream failed:', error);
      return false;
    }
  }

  /**
   * Notify clients of performance metrics
   */
  static async broadcastPerformanceMetrics(
    workspaceId: string,
    metrics: {
      loadTime: number;
      cacheHitRate: number;
      queriesExecuted: number;
      memoryUsage?: number;
    }
  ): Promise<boolean> {
    try {
      const pusher = getPusherServer();
      if (!pusher) {
        return false;
      }

      const channelName = `workspace-${workspaceId}`;
      const eventName = 'performance-metrics';
      
      const payload = {
        ...metrics,
        timestamp: new Date().toISOString(),
        type: 'performance-metrics'
      };

      await pusher.trigger(channelName, eventName, payload);
      
      console.log(`📊 [PUSHER] Broadcasted performance metrics: ${metrics.loadTime}ms`);
      return true;
    } catch (error) {
      console.error('🔴 [PUSHER] Performance metrics broadcast failed:', error);
      return false;
    }
  }

  /**
   * Invalidate cache and notify all clients
   */
  static async invalidateAndNotify(
    workspaceId: string,
    patterns: string[]
  ): Promise<void> {
    // Invalidate local cache
    const invalidated = await cache.invalidate(patterns);
    
    // Notify all clients to invalidate their cache
    if (invalidated > 0) {
      await this.broadcastCacheInvalidation(workspaceId, patterns);
    }
  }

  /**
   * Get Pusher authentication for client connections
   */
  static authenticateUser(
    socketId: string,
    channelName: string,
    userId: string,
    workspaceId: string
  ): { auth: string } | null {
    try {
      const pusher = getPusherServer();
      if (!pusher) {
        return null;
      }

      // Verify user has access to this workspace
      if (!channelName.includes(workspaceId)) {
        console.warn(`🔴 [PUSHER] Unauthorized channel access: ${channelName} for user ${userId}`);
        return null;
      }

      const auth = pusher.authorizeChannel(socketId, channelName, {
        user_id: userId,
        user_info: {
          workspaceId,
          timestamp: new Date().toISOString()
        }
      });

      console.log(`🔐 [PUSHER] Authenticated user ${userId} for channel ${channelName}`);
      return auth;
    } catch (error) {
      console.error('🔴 [PUSHER] Authentication failed:', error);
      return null;
    }
  }

  /**
   * Get connection statistics
   */
  static async getConnectionStats(): Promise<{
    connected: boolean;
    channels?: number;
    connections?: number;
  }> {
    try {
      const pusher = getPusherServer();
      if (!pusher) {
        return { connected: false };
      }

      // Note: Pusher doesn't provide direct stats API in the Node.js library
      // This would require additional API calls to Pusher's REST API
      return { 
        connected: true,
        channels: 0, // Would need REST API call
        connections: 0 // Would need REST API call
      };
    } catch (error) {
      console.error('🔴 [PUSHER] Stats retrieval failed:', error);
      return { connected: false };
    }
  }
}

// Export convenience functions
export const realtime = {
  broadcast: RealtimeStreaming.broadcastPipelineUpdate.bind(RealtimeStreaming),
  invalidate: RealtimeStreaming.invalidateAndNotify.bind(RealtimeStreaming),
  stream: RealtimeStreaming.streamPartialUpdate.bind(RealtimeStreaming),
  metrics: RealtimeStreaming.broadcastPerformanceMetrics.bind(RealtimeStreaming),
  auth: RealtimeStreaming.authenticateUser.bind(RealtimeStreaming),
  stats: RealtimeStreaming.getConnectionStats.bind(RealtimeStreaming),
};
