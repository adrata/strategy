"use client";

import { useCallback } from 'react';
import { useUnifiedAuth } from '@/platform/auth';

interface Chat {
  id: string;
  type: 'channel' | 'dm';
  name?: string;
  description?: string;
  members?: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  memberCount?: number;
}

interface Message {
  id: string;
  content: string;
  chatId: string;
  senderId: string;
  createdAt: string;
  updatedAt?: string;
  sender: {
    id: string;
    name: string | null;
    email: string;
  };
  reactions?: Array<{
    emoji: string;
    userId: string;
  }>;
}

export function useOasisChat() {
  const { user } = useUnifiedAuth();

  const fetchChats = useCallback(async (): Promise<Chat[]> => {
    if (!user?.activeWorkspaceId) {
      throw new Error('No workspace ID available');
    }

    try {
      const response = await fetch(`/api/v1/collaboration/chat/chats?workspaceId=${user.activeWorkspaceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch chats: ${response.statusText}`);
      }

      const data = await response.json();
      return data.chats || [];
    } catch (error) {
      console.error('Error fetching chats:', error);
      throw error;
    }
  }, [user?.activeWorkspaceId]);

  const fetchMessages = useCallback(async (chatId: string): Promise<Message[]> => {
    try {
      const response = await fetch(`/api/v1/collaboration/chat/messages?chatId=${chatId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }, []);

  const sendMessage = useCallback(async (chatId: string, content: string): Promise<void> => {
    if (!user?.activeWorkspaceId || !user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch('/api/v1/collaboration/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          content,
          workspaceId: user.activeWorkspaceId,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [user?.activeWorkspaceId, user?.id]);

  const editMessage = useCallback(async (messageId: string, content: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch('/api/v1/collaboration/chat/messages', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          content,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to edit message: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  }, [user?.id]);

  const deleteMessage = useCallback(async (messageId: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch('/api/v1/collaboration/chat/messages', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete message: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }, [user?.id]);

  const addReaction = useCallback(async (messageId: string, emoji: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch('/api/v1/collaboration/chat/reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          emoji,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add reaction: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }, [user?.id]);

  const removeReaction = useCallback(async (messageId: string, emoji: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch('/api/v1/collaboration/chat/reactions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          emoji,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to remove reaction: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  }, [user?.id]);

  const startTyping = useCallback(async (chatId: string): Promise<void> => {
    if (!user?.id) {
      return; // Don't throw error for typing indicators
    }

    try {
      await fetch('/api/v1/collaboration/chat/typing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          userId: user.id,
          action: 'start',
        }),
      });
    } catch (error) {
      // Silently fail for typing indicators
      console.warn('Error sending typing indicator:', error);
    }
  }, [user?.id]);

  const stopTyping = useCallback(async (chatId: string): Promise<void> => {
    if (!user?.id) {
      return; // Don't throw error for typing indicators
    }

    try {
      await fetch('/api/v1/collaboration/chat/typing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          userId: user.id,
          action: 'stop',
        }),
      });
    } catch (error) {
      // Silently fail for typing indicators
      console.warn('Error sending typing indicator:', error);
    }
  }, [user?.id]);

  return {
    fetchChats,
    fetchMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    startTyping,
    stopTyping,
  };
}


