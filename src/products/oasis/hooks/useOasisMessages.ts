/**
 * Oasis Messages Hook
 * 
 * Fetches and manages messages with real-time updates
 */

import { useState, useEffect, useCallback } from 'react';
import { usePusherRealTime, pusherClientService } from '@/platform/services/pusher-real-time-service';

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

// Helper function to check if AI should respond
async function checkIfShouldTriggerAI(workspaceId: string, dmId?: string, channelId?: string, content?: string): Promise<boolean> {
  try {
    // If it's a DM, check if it's with Adrata AI
    if (dmId) {
      const response = await fetch(`/api/v1/oasis/oasis/dms/${dmId}?workspaceId=${workspaceId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const dm = await response.json();
        // Check if Adrata AI is a participant
        const hasAdrataAI = dm.participants?.some((p: any) => p.email === 'ai@adrata.com');
        return hasAdrataAI;
      }
    }
    
    // If it's a channel, check if message mentions Adrata
    if (channelId && content) {
      const lowerContent = content.toLowerCase();
      return lowerContent.includes('@adrata') || lowerContent.includes('adrata');
    }
    
    return false;
  } catch (error) {
    console.warn('Failed to check if should trigger AI:', error);
    return false;
  }
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

  // Get Pusher real-time updates from workspace channel
  const { lastUpdate } = usePusherRealTime(workspaceId, '');

  // Subscribe to workspace channel for 'oasis-message' events (fallback)
  useEffect(() => {
    if (!workspaceId) return;

    const workspaceChannelName = `workspace-${workspaceId}`;
    console.log(`📡 [OASIS MESSAGES] Subscribing to workspace channel for oasis-message: ${workspaceChannelName}`);

    // Subscribe to workspace channel for oasis-message events with cleanup
    const unsubscribeWorkspace = pusherClientService.subscribeToChannel(
      workspaceChannelName,
      'oasis-message',
      (event: any) => {
        console.log(`📨 [OASIS MESSAGES] Received message on workspace channel ${workspaceChannelName}:`, event);
        
        // Check if this event is relevant to current channel/DM
        // Event structure: { type, payload, dmId, channelId, ... }
        const eventChannelId = event.channelId || event.payload?.channelId;
        const eventDmId = event.dmId || event.payload?.dmId;
        const isRelevant = (channelId && eventChannelId === channelId) || (dmId && eventDmId === dmId);
        if (!isRelevant) return;

        if (event.type === 'oasis_message_sent') {
          // Add new message to the end (newest at bottom)
          setMessages(prev => {
            // Check if message already exists (avoid duplicates)
            const exists = prev.some(msg => msg.id === event.payload.id);
            if (exists) {
              console.log(`⚠️ [OASIS MESSAGES] Message ${event.payload.id} already exists, skipping`);
              return prev;
            }
            return [...prev, {
              id: event.payload.id,
              content: event.payload.content,
              channelId: event.payload.channelId,
              dmId: event.payload.dmId,
              senderId: event.payload.senderId,
              senderName: event.payload.senderName,
              senderUsername: event.payload.senderUsername,
              parentMessageId: event.payload.parentMessageId,
              createdAt: event.payload.createdAt,
              updatedAt: event.payload.updatedAt,
              reactions: [],
              threadCount: 0,
              threadMessages: []
            }];
          });
        } else if (event.type === 'oasis_message_edited') {
          // Update existing message
          setMessages(prev => 
            prev.map(msg => 
              msg.id === event.payload.id 
                ? { ...msg, content: event.payload.content, updatedAt: event.payload.updatedAt }
                : msg
            )
          );
        } else if (event.type === 'oasis_message_deleted') {
          // Remove message
          setMessages(prev => prev.filter(msg => msg.id !== event.payload.messageId));
        }
      }
    );

    // Cleanup
    return () => {
      console.log(`📡 [OASIS MESSAGES] Unsubscribing from workspace channel: ${workspaceChannelName}`);
      if (unsubscribeWorkspace) unsubscribeWorkspace();
    };
  }, [workspaceId, channelId, dmId]);

  // Subscribe to DM-specific channel for real-time updates
  useEffect(() => {
    if (!dmId || !workspaceId) return;

    const dmChannelName = `oasis-dm-${dmId}`;
    console.log(`📡 [OASIS MESSAGES] Subscribing to DM channel: ${dmChannelName}`);

    // Subscribe to DM-specific channel with cleanup
    const unsubscribeDM = pusherClientService.subscribeToChannel(
      dmChannelName,
      'oasis-message',
      (event: any) => {
        console.log(`📨 [OASIS MESSAGES] Received message on DM channel ${dmChannelName}:`, event);
        
        // Check if this event is for the current DM
        // Event structure: { type, payload, dmId, channelId, ... }
        const eventDmId = event.dmId || event.payload?.dmId;
        if (eventDmId === dmId) {
          if (event.type === 'oasis_message_sent') {
            // Add new message to the end (newest at bottom)
            setMessages(prev => {
              // Check if message already exists (avoid duplicates)
              const exists = prev.some(msg => msg.id === event.payload.id);
              if (exists) {
                console.log(`⚠️ [OASIS MESSAGES] Message ${event.payload.id} already exists, skipping`);
                return prev;
              }
              return [...prev, {
                id: event.payload.id,
                content: event.payload.content,
                channelId: event.payload.channelId,
                dmId: event.payload.dmId,
                senderId: event.payload.senderId,
                senderName: event.payload.senderName,
                senderUsername: event.payload.senderUsername,
                parentMessageId: event.payload.parentMessageId,
                createdAt: event.payload.createdAt,
                updatedAt: event.payload.updatedAt,
                reactions: [],
                threadCount: 0,
                threadMessages: []
              }];
            });
          } else if (event.type === 'oasis_message_edited') {
            // Update existing message
            setMessages(prev => 
              prev.map(msg => 
                msg.id === event.payload.id 
                  ? { ...msg, content: event.payload.content, updatedAt: event.payload.updatedAt }
                  : msg
              )
            );
          } else if (event.type === 'oasis_message_deleted') {
            // Remove message
            setMessages(prev => prev.filter(msg => msg.id !== event.payload.messageId));
          }
        }
      }
    );

    // Cleanup: unsubscribe when DM changes or component unmounts
    return () => {
      console.log(`📡 [OASIS MESSAGES] Unsubscribing from DM channel: ${dmChannelName}`);
      if (unsubscribeDM) unsubscribeDM();
    };
  }, [dmId, workspaceId]);

  // Subscribe to channel-specific channel for real-time updates
  useEffect(() => {
    if (!channelId || !workspaceId) return;

    const channelChannelName = `oasis-channel-${channelId}`;
    console.log(`📡 [OASIS MESSAGES] Subscribing to channel: ${channelChannelName}`);

    // Subscribe to channel-specific channel with cleanup
    const unsubscribeChannel = pusherClientService.subscribeToChannel(
      channelChannelName,
      'oasis-message',
      (event: any) => {
        console.log(`📨 [OASIS MESSAGES] Received message on channel ${channelChannelName}:`, event);
        
        // Check if this event is for the current channel
        // Event structure: { type, payload, dmId, channelId, ... }
        const eventChannelId = event.channelId || event.payload?.channelId;
        if (eventChannelId === channelId) {
          if (event.type === 'oasis_message_sent') {
            // Add new message to the end (newest at bottom)
            setMessages(prev => {
              // Check if message already exists (avoid duplicates)
              const exists = prev.some(msg => msg.id === event.payload.id);
              if (exists) {
                console.log(`⚠️ [OASIS MESSAGES] Message ${event.payload.id} already exists, skipping`);
                return prev;
              }
              return [...prev, {
                id: event.payload.id,
                content: event.payload.content,
                channelId: event.payload.channelId,
                dmId: event.payload.dmId,
                senderId: event.payload.senderId,
                senderName: event.payload.senderName,
                senderUsername: event.payload.senderUsername,
                parentMessageId: event.payload.parentMessageId,
                createdAt: event.payload.createdAt,
                updatedAt: event.payload.updatedAt,
                reactions: [],
                threadCount: 0,
                threadMessages: []
              }];
            });
          } else if (event.type === 'oasis_message_edited') {
            // Update existing message
            setMessages(prev => 
              prev.map(msg => 
                msg.id === event.payload.id 
                  ? { ...msg, content: event.payload.content, updatedAt: event.payload.updatedAt }
                  : msg
              )
            );
          } else if (event.type === 'oasis_message_deleted') {
            // Remove message
            setMessages(prev => prev.filter(msg => msg.id !== event.payload.messageId));
          }
        }
      }
    );

    // Cleanup: unsubscribe when channel changes or component unmounts
    return () => {
      console.log(`📡 [OASIS MESSAGES] Unsubscribing from channel: ${channelChannelName}`);
      if (unsubscribeChannel) unsubscribeChannel();
    };
  }, [channelId, workspaceId]);

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

      // Validate workspaceId is provided
      if (!workspaceId || workspaceId.trim() === '') {
        const errorMsg = 'Workspace ID is required to fetch messages';
        console.error('❌ [OASIS MESSAGES]', errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }

      // Validate conversation ID is provided
      if (!channelId && !dmId) {
        const errorMsg = 'Channel ID or DM ID is required to fetch messages';
        console.error('❌ [OASIS MESSAGES]', errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }

      const currentOffset = reset ? 0 : offset;
      const params = new URLSearchParams({
        workspaceId,
        limit: '50',
        offset: currentOffset.toString()
      });

      if (channelId) params.append('channelId', channelId);
      if (dmId) params.append('dmId', dmId);

      console.log('📡 [OASIS MESSAGES] Fetching messages:', {
        workspaceId,
        channelId,
        dmId,
        offset: currentOffset,
        reset
      });

      // Retry logic with exponential backoff for network errors
      const maxRetries = 3;
      let lastError: Error | null = null;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          // Create timeout abort controller
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
          
          const response = await fetch(`/api/v1/oasis/oasis/messages?${params}`, {
            credentials: 'include',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            // Get error details from response if available
            let errorMessage = 'Failed to fetch messages';
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;
            } catch {
              // If response is not JSON, use status text
              errorMessage = response.statusText || errorMessage;
            }
            
            console.error(`❌ [OASIS MESSAGES] Fetch failed: ${response.status} ${errorMessage}`, {
              url: `/api/v1/oasis/oasis/messages?${params}`,
              channelId,
              dmId,
              workspaceId,
              status: response.status,
              attempt: attempt + 1
            });
            
            // For server errors (5xx), retry. For client errors (4xx), don't retry
            if (response.status >= 500 && attempt < maxRetries - 1) {
              lastError = new Error(`${errorMessage} (${response.status})`);
              const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff, max 5s
              console.log(`⏳ [OASIS MESSAGES] Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            
            throw new Error(`${errorMessage} (${response.status})`);
          }

          const data = await response.json();
          
          // Success - break out of retry loop
          lastError = null;
      
          console.log('✅ [OASIS MESSAGES] Received response:', {
            messageCount: data.messages?.length || 0,
            hasMore: data.hasMore,
            workspaceId,
            channelId,
            dmId
          });
          
          // Validate response structure
          if (!data || !Array.isArray(data.messages)) {
            console.error('❌ [OASIS MESSAGES] Invalid response format:', data);
            throw new Error('Invalid response from server');
          }
      
          if (reset) {
            setMessages(data.messages || []);
            setOffset(50);
            
            // Check if conversation is empty and trigger initial greeting
            if (data.messages.length === 0 && workspaceId) {
              try {
                const aiResponse = await fetch('/api/v1/oasis/oasis/ai-response', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  credentials: 'include',
                  body: JSON.stringify({
                    channelId,
                    dmId,
                    workspaceId,
                    isInitial: true
                  }),
                });

                if (aiResponse.ok) {
                  const aiMessage = await aiResponse.json();
                  // Add initial greeting to messages
                  setMessages([aiMessage]);
                }
              } catch (aiError) {
                console.warn('Failed to create initial greeting:', aiError);
              }
            }
            
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
          break; // Success, exit retry loop
          
        } catch (fetchError: any) {
          // Detect network errors
          const isNetworkError = fetchError instanceof TypeError && 
            (fetchError.message.includes('Failed to fetch') || 
             fetchError.message.includes('ERR_NAME_NOT_RESOLVED') ||
             fetchError.message.includes('NetworkError') ||
             fetchError.name === 'TypeError');
          
          lastError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
          
          if (isNetworkError && attempt < maxRetries - 1) {
            const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff, max 5s
            console.warn(`⚠️ [OASIS MESSAGES] Network error, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries}):`, fetchError.message);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          // If this is the last attempt or not a network error, throw
          if (attempt === maxRetries - 1 || !isNetworkError) {
            throw lastError;
          }
        }
      }
      
      // If we exhausted retries and still have an error
      if (lastError) {
        throw lastError;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch messages';
      
      // Improve error messages for network errors
      let userFriendlyError = errorMessage;
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_NAME_NOT_RESOLVED')) {
        userFriendlyError = 'Unable to connect to the server. Please check your connection and try again.';
      } else if (errorMessage.includes('timeout')) {
        userFriendlyError = 'Request timed out. Please try again.';
      }
      
      console.error('❌ [OASIS MESSAGES] Error fetching messages:', userFriendlyError, err);
      setError(userFriendlyError);
      // Set empty messages on error to prevent UI stuck state
      if (reset) {
        setMessages([]);
      }
    } finally {
      setLoading(false);
    }
  }, [workspaceId, channelId, dmId, offset]);

  // Send message
  const sendMessage = async (content: string, parentMessageId?: string) => {
    // OPTIMISTIC UPDATE: Add message immediately for instant UI feedback
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: OasisMessage = {
      id: tempId,
      content,
      channelId: channelId || null,
      dmId: dmId || null,
      senderId: 'current-user', // Will be replaced with real data
      senderName: 'You',
      senderUsername: null,
      parentMessageId: parentMessageId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reactions: [],
      threadCount: 0,
      threadMessages: []
    };

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);
    console.log(`⚡ [OASIS MESSAGES] Optimistic update: added message ${tempId}`);

    try {
      const response = await fetch('/api/v1/oasis/oasis/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          channelId,
          dmId,
          content,
          parentMessageId
        }),
      });

      if (!response.ok) {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Replace optimistic message with real message from server
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? data.message : msg
      ));
      console.log(`✅ [OASIS MESSAGES] Replaced optimistic message with real message: ${data.message.id}`);
      
      // Trigger AI response only when Adrata is directly engaged
      if (workspaceId) {
        try {
          // Check if this is a DM with Adrata or if message mentions Adrata
          const shouldTriggerAI = await checkIfShouldTriggerAI(workspaceId, dmId, channelId, content);
          
          if (shouldTriggerAI) {
            const aiResponse = await fetch('/api/v1/oasis/oasis/ai-response', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                messageContent: content,
                channelId,
                dmId,
                workspaceId
              }),
            });

            if (aiResponse.ok) {
              const aiMessage = await aiResponse.json();
              // Add AI response to messages
              setMessages(prev => [...prev, aiMessage]);
            }
          }
        } catch (aiError) {
          // Don't fail the main message send if AI response fails
          console.warn('AI response failed:', aiError);
        }
      }
      
      return data.message;
    } catch (err) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
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
        credentials: 'include',
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
        credentials: 'include'
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
        credentials: 'include',
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
        credentials: 'include'
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
  const markAsRead = useCallback(async (messageIds: string[]) => {
    if (!messageIds || messageIds.length === 0) {
      return; // No messages to mark as read
    }

    try {
      const response = await fetch('/api/v1/oasis/oasis/read-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          messageIds,
          workspaceId,
          channelId,
          dmId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        console.error('❌ [OASIS MESSAGES] Mark as read failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Failed to mark messages as read: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      // Don't throw - just log the error so it doesn't break the UI
      console.error('❌ [OASIS MESSAGES] Mark as read error:', error);
    }
  }, [workspaceId, channelId, dmId]);

  // Mark messages as read when they are displayed
  useEffect(() => {
    if (messages.length > 0 && workspaceId) {
      // Mark all visible messages as read
      const messageIds = messages.map(msg => msg.id);
      markAsRead(messageIds);
    }
  }, [messages, workspaceId, markAsRead]);

  // Initial fetch - clear cache when workspaceId changes (important for cross-workspace DMs)
  useEffect(() => {
    if (workspaceId && (channelId || dmId)) {
      const conversationId = channelId || dmId;
      const cacheKey = `oasis-messages-${conversationId}`;
      
      // Clear cache when switching workspaces (for cross-workspace DMs like Ryan's)
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(cacheKey);
      }
      
      setMessages([]);
      setOffset(0);
      setHasMore(true);
      fetchMessages(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, channelId, dmId]);

  // Subscribe to workspace channel for 'oasis-event' events (reactions, read receipts)
  useEffect(() => {
    if (!workspaceId) return;

    const workspaceChannelName = `workspace-${workspaceId}`;
    console.log(`📡 [OASIS MESSAGES] Subscribing to workspace channel for oasis-event (reactions): ${workspaceChannelName}`);

    const unsubscribeWorkspaceEvents = pusherClientService.subscribeToChannel(
      workspaceChannelName,
      'oasis-event',
      (event: any) => {
        console.log(`📨 [OASIS MESSAGES] Received event on workspace channel ${workspaceChannelName}:`, event);
        
        // Check if this event is relevant to current channel/DM
        const eventChannelId = event.channelId || event.payload?.channelId;
        const eventDmId = event.dmId || event.payload?.dmId;
        const isRelevant = (channelId && eventChannelId === channelId) || (dmId && eventDmId === dmId);
        if (!isRelevant) return;

        if (event.type === 'oasis_reaction_added') {
          // Add reaction - use payload structure
          const reactionData = event.payload;
          setMessages(prev => 
            prev.map(msg => {
              if (msg.id === reactionData.messageId) {
                // Check if reaction already exists (avoid duplicates)
                const existingReaction = msg.reactions.find(
                  r => r.emoji === reactionData.emoji && r.userId === reactionData.userId
                );
                if (existingReaction) return msg;
                
                return {
                  ...msg,
                  reactions: [...msg.reactions, {
                    id: reactionData.id,
                    emoji: reactionData.emoji,
                    userId: reactionData.userId,
                    userName: reactionData.userName,
                    createdAt: reactionData.createdAt
                  }]
                };
              }
              return msg;
            })
          );
        } else if (event.type === 'oasis_reaction_removed') {
          // Remove reaction
          const reactionData = event.payload;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === reactionData.messageId 
                ? { 
                    ...msg, 
                    reactions: msg.reactions.filter(
                      r => !(r.emoji === reactionData.emoji && r.userId === reactionData.userId)
                    )
                  }
                : msg
            )
          );
        }
      }
    );

    return () => {
      console.log(`📡 [OASIS MESSAGES] Unsubscribing from workspace events channel: ${workspaceChannelName}`);
      if (unsubscribeWorkspaceEvents) unsubscribeWorkspaceEvents();
    };
  }, [workspaceId, channelId, dmId]);

  // Subscribe to DM-specific channel for 'oasis-event' events (reactions)
  useEffect(() => {
    if (!dmId || !workspaceId) return;

    const dmChannelName = `oasis-dm-${dmId}`;
    console.log(`📡 [OASIS MESSAGES] Subscribing to DM channel for oasis-event (reactions): ${dmChannelName}`);

    const unsubscribeDMEvents = pusherClientService.subscribeToChannel(
      dmChannelName,
      'oasis-event',
      (event: any) => {
        console.log(`📨 [OASIS MESSAGES] Received event on DM channel ${dmChannelName}:`, event);
        
        const eventDmId = event.dmId || event.payload?.dmId;
        if (eventDmId === dmId) {
          if (event.type === 'oasis_reaction_added') {
            const reactionData = event.payload;
            setMessages(prev => 
              prev.map(msg => {
                if (msg.id === reactionData.messageId) {
                  const existingReaction = msg.reactions.find(
                    r => r.emoji === reactionData.emoji && r.userId === reactionData.userId
                  );
                  if (existingReaction) return msg;
                  
                  return {
                    ...msg,
                    reactions: [...msg.reactions, {
                      id: reactionData.id,
                      emoji: reactionData.emoji,
                      userId: reactionData.userId,
                      userName: reactionData.userName,
                      createdAt: reactionData.createdAt
                    }]
                  };
                }
                return msg;
              })
            );
          } else if (event.type === 'oasis_reaction_removed') {
            const reactionData = event.payload;
            setMessages(prev => 
              prev.map(msg => 
                msg.id === reactionData.messageId 
                  ? { 
                      ...msg, 
                      reactions: msg.reactions.filter(
                        r => !(r.emoji === reactionData.emoji && r.userId === reactionData.userId)
                      )
                    }
                  : msg
              )
            );
          }
        }
      }
    );

    return () => {
      console.log(`📡 [OASIS MESSAGES] Unsubscribing from DM events channel: ${dmChannelName}`);
      if (unsubscribeDMEvents) unsubscribeDMEvents();
    };
  }, [dmId, workspaceId]);

  // Subscribe to channel-specific channel for 'oasis-event' events (reactions)
  useEffect(() => {
    if (!channelId || !workspaceId) return;

    const channelChannelName = `oasis-channel-${channelId}`;
    console.log(`📡 [OASIS MESSAGES] Subscribing to channel for oasis-event (reactions): ${channelChannelName}`);

    const unsubscribeChannelEvents = pusherClientService.subscribeToChannel(
      channelChannelName,
      'oasis-event',
      (event: any) => {
        console.log(`📨 [OASIS MESSAGES] Received event on channel ${channelChannelName}:`, event);
        
        const eventChannelId = event.channelId || event.payload?.channelId;
        if (eventChannelId === channelId) {
          if (event.type === 'oasis_reaction_added') {
            const reactionData = event.payload;
            setMessages(prev => 
              prev.map(msg => {
                if (msg.id === reactionData.messageId) {
                  const existingReaction = msg.reactions.find(
                    r => r.emoji === reactionData.emoji && r.userId === reactionData.userId
                  );
                  if (existingReaction) return msg;
                  
                  return {
                    ...msg,
                    reactions: [...msg.reactions, {
                      id: reactionData.id,
                      emoji: reactionData.emoji,
                      userId: reactionData.userId,
                      userName: reactionData.userName,
                      createdAt: reactionData.createdAt
                    }]
                  };
                }
                return msg;
              })
            );
          } else if (event.type === 'oasis_reaction_removed') {
            const reactionData = event.payload;
            setMessages(prev => 
              prev.map(msg => 
                msg.id === reactionData.messageId 
                  ? { 
                      ...msg, 
                      reactions: msg.reactions.filter(
                        r => !(r.emoji === reactionData.emoji && r.userId === reactionData.userId)
                      )
                    }
                  : msg
              )
            );
          }
        }
      }
    );

    return () => {
      console.log(`📡 [OASIS MESSAGES] Unsubscribing from channel events: ${channelChannelName}`);
      if (unsubscribeChannelEvents) unsubscribeChannelEvents();
    };
  }, [channelId, workspaceId]);

  // Listen for real-time updates (fallback for lastUpdate mechanism)
  useEffect(() => {
    if (lastUpdate?.type === 'oasis-message' || lastUpdate?.type === 'oasis-event') {
      const event = lastUpdate.payload;
      
      // Check if this event is relevant to current channel/DM
      if (
        (channelId && event.channelId === channelId) ||
        (dmId && event.dmId === dmId)
      ) {
        if (event.type === 'oasis_message_sent') {
          // Add new message to the end (newest at bottom)
          setMessages(prev => {
            const exists = prev.some(msg => msg.id === event.id);
            if (exists) return prev;
            return [...prev, event];
          });
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
        }
        // Note: Reactions are now handled via direct channel subscriptions above
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
