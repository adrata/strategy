/**
 * Oasis Messages Hook
 * 
 * Fetches and manages messages with real-time updates
 */

import { useState, useEffect, useCallback } from 'react';
import { usePusherRealTime } from '@/platform/services/pusher-real-time-service';

export interface OasisMessage {
  id: string;
  content: string;
  channelId: string | null;
  dmId: string | null;
  senderId: string;
  senderName: string;
  senderUsername: string | null;
  parentMessageId: string | null;
  createdAt: string;
  updatedAt: string;
  reactions: OasisReaction[];
  threadCount: number;
  threadMessages: OasisThreadMessage[];
}

export interface OasisReaction {
  id: string;
  emoji: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface OasisThreadMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderUsername: string | null;
  createdAt: string;
}

export function useOasisMessages(
  workspaceId: string,
  channelId?: string,
  dmId?: string
) {
  const [messages, setMessages] = useState<OasisMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // Get Pusher real-time updates
  const { lastUpdate } = usePusherRealTime(workspaceId, '');

  // Fetch messages with caching
  const fetchMessages = useCallback(async (reset = false) => {
    const conversationId = channelId || dmId;
    const conversationType = channelId ? 'channel' : 'dm';
    const cacheKey = `oasis-messages-${conversationId}`;
    
    // Try to load from cache first for instant display
    if (reset && typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { messages: cachedMessages, timestamp } = JSON.parse(cached);
          // Use cache if it's less than 5 minutes old
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            setMessages(cachedMessages);
            setOffset(50);
            console.log('⚡ [OASIS MESSAGES] Loaded from cache:', cachedMessages.length, 'messages');
          }
        }
      } catch (error) {
        console.warn('Failed to load messages from cache:', error);
      }
    }
    
    try {
      setLoading(true);
      setError(null);

      const currentOffset = reset ? 0 : offset;
      const params = new URLSearchParams({
        workspaceId,
        limit: '50',
        offset: currentOffset.toString()
      });

      if (channelId) params.append('channelId', channelId);
      if (dmId) params.append('dmId', dmId);

      const response = await fetch(`/api/v1/oasis/oasis/messages?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      
      if (reset) {
        setMessages(data.messages);
        setOffset(50);
        
        // Cache the messages
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            messages: data.messages,
            timestamp: Date.now(),
            conversationId,
            conversationType
          }));
        }
      } else {
        setMessages(prev => [...prev, ...data.messages]);
        setOffset(prev => prev + 50);
      }
      
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('❌ [OASIS MESSAGES] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, channelId, dmId, offset]);

  // Send message
  const sendMessage = async (content: string, parentMessageId?: string) => {
    try {
      const response = await fetch('/api/v1/oasis/oasis/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId,
          dmId,
          content,
          parentMessageId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Add message to list (optimistic update)
      setMessages(prev => [data.message, ...prev]);
      
      // Trigger AI response if this is a DM with Adrata AI
      if (dmId && workspaceId) {
        try {
          // Check if this is a DM with Adrata AI by looking at the message sender
          // We'll trigger AI response for any DM (assuming it's with Adrata AI for now)
          const aiResponse = await fetch('/api/v1/oasis/oasis/ai-response', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messageContent: content,
              dmId,
              workspaceId
            }),
          });

          if (aiResponse.ok) {
            const aiMessage = await aiResponse.json();
            // Add AI response to messages
            setMessages(prev => [aiMessage, ...prev]);
          }
        } catch (aiError) {
          // Don't fail the main message send if AI response fails
          console.warn('AI response failed:', aiError);
        }
      }
      
      return data.message;
    } catch (err) {
      console.error('❌ [OASIS MESSAGES] Send error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    }
  };

  // Edit message
  const editMessage = async (messageId: string, content: string) => {
    try {
      const response = await fetch(`/api/v1/oasis/oasis/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to edit message');
      }

      const data = await response.json();
      
      // Update message in list
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: data.message.content, updatedAt: data.message.updatedAt }
            : msg
        )
      );
      
      return data.message;
    } catch (err) {
      console.error('❌ [OASIS MESSAGES] Edit error:', err);
      setError(err instanceof Error ? err.message : 'Failed to edit message');
      throw err;
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/v1/oasis/oasis/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      // Remove message from list
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err) {
      console.error('❌ [OASIS MESSAGES] Delete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete message');
      throw err;
    }
  };

  // Add reaction
  const addReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/v1/oasis/oasis/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emoji }),
      });

      if (!response.ok) {
        throw new Error('Failed to add reaction');
      }

      const data = await response.json();
      
      // Update message with new reaction
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, reactions: [...msg.reactions, data.reaction] }
            : msg
        )
      );
      
      return data.reaction;
    } catch (err) {
      console.error('❌ [OASIS MESSAGES] Add reaction error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add reaction');
      throw err;
    }
  };

  // Remove reaction
  const removeReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/v1/oasis/oasis/messages/${messageId}/reactions?emoji=${emoji}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove reaction');
      }

      // Update message by removing reaction
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                reactions: msg.reactions.filter(r => !(r.emoji === emoji))
              }
            : msg
        )
      );
    } catch (err) {
      console.error('❌ [OASIS MESSAGES] Remove reaction error:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove reaction');
      throw err;
    }
  };

  // Load more messages
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchMessages(false);
    }
  };

  // Mark messages as read
  const markAsRead = async (messageIds: string[]) => {
    try {
      const response = await fetch('/api/oasis/read-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageIds,
          workspaceId,
          channelId,
          dmId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark messages as read');
      }
    } catch (error) {
      console.error('❌ [OASIS MESSAGES] Mark as read error:', error);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (workspaceId && (channelId || dmId)) {
      setMessages([]);
      setOffset(0);
      setHasMore(true);
      fetchMessages(true);
    }
  }, [workspaceId, channelId, dmId]);

  // Listen for real-time updates
  useEffect(() => {
    if (lastUpdate?.type === 'oasis-message' || lastUpdate?.type === 'oasis-event') {
      const event = lastUpdate.payload;
      
      // Check if this event is relevant to current channel/DM
      if (
        (channelId && event.channelId === channelId) ||
        (dmId && event.dmId === dmId)
      ) {
        if (event.type === 'oasis_message_sent') {
          // Add new message
          setMessages(prev => [event, ...prev]);
        } else if (event.type === 'oasis_message_edited') {
          // Update existing message
          setMessages(prev => 
            prev.map(msg => 
              msg.id === event.id 
                ? { ...msg, content: event.content, updatedAt: event.updatedAt }
                : msg
            )
          );
        } else if (event.type === 'oasis_message_deleted') {
          // Remove message
          setMessages(prev => prev.filter(msg => msg.id !== event.messageId));
        } else if (event.type === 'oasis_reaction_added') {
          // Add reaction
          setMessages(prev => 
            prev.map(msg => 
              msg.id === event.messageId 
                ? { ...msg, reactions: [...msg.reactions, event] }
                : msg
            )
          );
        } else if (event.type === 'oasis_reaction_removed') {
          // Remove reaction
          setMessages(prev => 
            prev.map(msg => 
              msg.id === event.messageId 
                ? { 
                    ...msg, 
                    reactions: msg.reactions.filter(r => !(r.emoji === event.emoji))
                  }
                : msg
            )
          );
        }
      }
    }
  }, [lastUpdate, channelId, dmId]);

  return {
    messages,
    loading,
    error,
    hasMore,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    loadMore,
    markAsRead,
    refetch: () => fetchMessages(true)
  };
}
