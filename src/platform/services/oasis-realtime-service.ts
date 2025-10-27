/**
 * Oasis Real-time Service
 * 
 * Extends the existing Pusher service with Oasis-specific events
 * Optimized for Vercel serverless deployment
 */

import { pusherServer } from './pusher-real-time-service';
import type { OasisMessage, OasisReaction } from '@prisma/client';

export interface OasisRealtimeEvent {
  type:
    | 'oasis_message_sent'
    | 'oasis_message_edited'
    | 'oasis_message_deleted'
    | 'oasis_user_typing'
    | 'oasis_user_stopped_typing'
    | 'oasis_message_read'
    | 'oasis_reaction_added'
    | 'oasis_reaction_removed';
  payload: any;
  timestamp: string;
  userId: string;
  workspaceId: string;
  channelId?: string;
  dmId?: string;
}

export class OasisRealtimeService {
  /**
   * Broadcast a new message to all channel/DM participants
   */
  static async broadcastMessage(
    workspaceId: string,
    message: OasisMessage & { sender: { name: string; username?: string } }
  ): Promise<void> {
    try {
      const event: OasisRealtimeEvent = {
        type: 'oasis_message_sent',
        payload: {
          id: message.id,
          content: message.content,
          channelId: message.channelId,
          dmId: message.dmId,
          senderId: message.senderId,
          senderName: message.sender.name,
          senderUsername: message.sender.username,
          parentMessageId: message.parentMessageId,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt
        },
        timestamp: new Date().toISOString(),
        userId: message.senderId,
        workspaceId,
        channelId: message.channelId || undefined,
        dmId: message.dmId || undefined
      };

      // Broadcast to workspace channel for general presence
      await pusherServer.trigger(
        `workspace-${workspaceId}`,
        'oasis-message',
        event
      );

      // If it's a channel message, also broadcast to channel-specific channel
      if (message.channelId) {
        await pusherServer.trigger(
          `oasis-channel-${message.channelId}`,
          'oasis-message',
          event
        );
      }

      // If it's a DM, broadcast to DM-specific channel
      if (message.dmId) {
        await pusherServer.trigger(
          `oasis-dm-${message.dmId}`,
          'oasis-message',
          event
        );
      }

      console.log(`📨 [OASIS] Message broadcasted: ${message.id}`);
    } catch (error) {
      console.error('❌ [OASIS] Failed to broadcast message:', error);
    }
  }

  /**
   * Broadcast message edit to all participants
   */
  static async broadcastMessageEdit(
    workspaceId: string,
    message: OasisMessage & { sender: { name: string; username?: string } }
  ): Promise<void> {
    try {
      const event: OasisRealtimeEvent = {
        type: 'oasis_message_edited',
        payload: {
          id: message.id,
          content: message.content,
          channelId: message.channelId,
          dmId: message.dmId,
          senderId: message.senderId,
          updatedAt: message.updatedAt
        },
        timestamp: new Date().toISOString(),
        userId: message.senderId,
        workspaceId,
        channelId: message.channelId || undefined,
        dmId: message.dmId || undefined
      };

      await this.broadcastToRelevantChannels(workspaceId, event, message.channelId, message.dmId);
      console.log(`✏️ [OASIS] Message edit broadcasted: ${message.id}`);
    } catch (error) {
      console.error('❌ [OASIS] Failed to broadcast message edit:', error);
    }
  }

  /**
   * Broadcast message deletion to all participants
   */
  static async broadcastMessageDelete(
    workspaceId: string,
    messageId: string,
    channelId?: string,
    dmId?: string
  ): Promise<void> {
    try {
      const event: OasisRealtimeEvent = {
        type: 'oasis_message_deleted',
        payload: { messageId },
        timestamp: new Date().toISOString(),
        userId: '', // Will be set by caller
        workspaceId,
        channelId,
        dmId
      };

      await this.broadcastToRelevantChannels(workspaceId, event, channelId, dmId);
      console.log(`🗑️ [OASIS] Message deletion broadcasted: ${messageId}`);
    } catch (error) {
      console.error('❌ [OASIS] Failed to broadcast message deletion:', error);
    }
  }

  /**
   * Broadcast typing indicator (ephemeral, no DB storage)
   */
  static async broadcastTyping(
    workspaceId: string,
    userId: string,
    userName: string,
    channelId?: string,
    dmId?: string
  ): Promise<void> {
    try {
      const event: OasisRealtimeEvent = {
        type: 'oasis_user_typing',
        payload: {
          userId,
          userName,
          channelId,
          dmId
        },
        timestamp: new Date().toISOString(),
        userId,
        workspaceId,
        channelId,
        dmId
      };

      await this.broadcastToRelevantChannels(workspaceId, event, channelId, dmId);
    } catch (error) {
      console.error('❌ [OASIS] Failed to broadcast typing indicator:', error);
    }
  }

  /**
   * Broadcast stop typing indicator (ephemeral, no DB storage)
   */
  static async broadcastStopTyping(
    workspaceId: string,
    userId: string,
    channelId?: string,
    dmId?: string
  ): Promise<void> {
    try {
      const event: OasisRealtimeEvent = {
        type: 'oasis_user_stopped_typing',
        payload: {
          userId,
          channelId,
          dmId
        },
        timestamp: new Date().toISOString(),
        userId,
        workspaceId,
        channelId,
        dmId
      };

      await this.broadcastToRelevantChannels(workspaceId, event, channelId, dmId);
    } catch (error) {
      console.error('❌ [OASIS] Failed to broadcast stop typing:', error);
    }
  }

  /**
   * Broadcast message read receipt
   */
  static async broadcastMessageRead(
    workspaceId: string,
    messageId: string,
    userId: string,
    channelId?: string,
    dmId?: string
  ): Promise<void> {
    try {
      const event: OasisRealtimeEvent = {
        type: 'oasis_message_read',
        payload: {
          messageId,
          userId,
          readAt: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        userId,
        workspaceId,
        channelId,
        dmId
      };

      await this.broadcastToRelevantChannels(workspaceId, event, channelId, dmId);
      console.log(`👁️ [OASIS] Read receipt broadcasted: ${messageId} by ${userId}`);
    } catch (error) {
      console.error('❌ [OASIS] Failed to broadcast read receipt:', error);
    }
  }

  /**
   * Broadcast reaction added to message
   */
  static async broadcastReaction(
    workspaceId: string,
    reaction: OasisReaction & { user: { name: string; username?: string } },
    channelId?: string,
    dmId?: string
  ): Promise<void> {
    try {
      const event: OasisRealtimeEvent = {
        type: 'oasis_reaction_added',
        payload: {
          id: reaction.id,
          messageId: reaction.messageId,
          userId: reaction.userId,
          userName: reaction.user.name,
          emoji: reaction.emoji,
          createdAt: reaction.createdAt
        },
        timestamp: new Date().toISOString(),
        userId: reaction.userId,
        workspaceId,
        channelId,
        dmId
      };

      await this.broadcastToRelevantChannels(workspaceId, event, channelId, dmId);
      console.log(`😀 [OASIS] Reaction broadcasted: ${reaction.emoji} on ${reaction.messageId}`);
    } catch (error) {
      console.error('❌ [OASIS] Failed to broadcast reaction:', error);
    }
  }

  /**
   * Broadcast reaction removed from message
   */
  static async broadcastReactionRemoved(
    workspaceId: string,
    messageId: string,
    userId: string,
    emoji: string,
    channelId?: string,
    dmId?: string
  ): Promise<void> {
    try {
      const event: OasisRealtimeEvent = {
        type: 'oasis_reaction_removed',
        payload: {
          messageId,
          userId,
          emoji
        },
        timestamp: new Date().toISOString(),
        userId,
        workspaceId,
        channelId,
        dmId
      };

      await this.broadcastToRelevantChannels(workspaceId, event, channelId, dmId);
      console.log(`😞 [OASIS] Reaction removal broadcasted: ${emoji} on ${messageId}`);
    } catch (error) {
      console.error('❌ [OASIS] Failed to broadcast reaction removal:', error);
    }
  }

  /**
   * Helper method to broadcast to relevant channels
   */
  private static async broadcastToRelevantChannels(
    workspaceId: string,
    event: OasisRealtimeEvent,
    channelId?: string,
    dmId?: string
  ): Promise<void> {
    // Always broadcast to workspace channel for general presence
    await pusherServer.trigger(
      `workspace-${workspaceId}`,
      'oasis-event',
      event
    );

    // Broadcast to specific channel if applicable
    if (channelId) {
      await pusherServer.trigger(
        `oasis-channel-${channelId}`,
        'oasis-event',
        event
      );
    }

    // Broadcast to specific DM if applicable
    if (dmId) {
      await pusherServer.trigger(
        `oasis-dm-${dmId}`,
        'oasis-event',
        event
      );
    }
  }
}
