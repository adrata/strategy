"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { useOasisChat } from '../hooks/useOasisChat';

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

interface OasisContextType {
  // State
  selectedChat: { type: "channel" | "dm"; id: string; name?: string } | null;
  chats: Chat[];
  messages: Message[];
  onlineUsers: Set<string>;
  typingUsers: Array<{ id: string; name: string }>;
  loading: boolean;
  sending: boolean;
  messagesLoading: boolean;

  // Actions
  selectChat: (chat: { type: "channel" | "dm"; id: string; name?: string }) => void;
  sendMessage: (content: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  startTyping: () => void;
  stopTyping: () => void;
  
  // Utility functions
  getInitials: (name: string | null | undefined) => string;
  getDirectMessages: () => Array<{ chat: Chat; label: string }>;
  getOrderedChannels: () => Chat[];
  getChatDisplayName: (chat: Chat) => string;
  getMessageSenderDisplayName: (sender: { id: string; name: string | null; email: string }) => string;
  isUserOnline: (userId: string) => boolean;
}

const OasisContext = createContext<OasisContextType | undefined>(undefined);

interface OasisProviderProps {
  children: ReactNode;
}

export function OasisProvider({ children }: OasisProviderProps) {
  const { user } = useUnifiedAuth();
  const [selectedChat, setSelectedChat] = useState<{ type: "channel" | "dm"; id: string; name?: string } | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const {
    fetchChats,
    fetchMessages,
    sendMessage: apiSendMessage,
    editMessage: apiEditMessage,
    deleteMessage: apiDeleteMessage,
    addReaction: apiAddReaction,
    removeReaction: apiRemoveReaction,
    startTyping: apiStartTyping,
    stopTyping: apiStopTyping,
  } = useOasisChat();

  // Load chats on mount
  useEffect(() => {
    const loadChats = async () => {
      if (!user?.activeWorkspaceId) return;
      
      setLoading(true);
      try {
        const fetchedChats = await fetchChats();
        setChats(fetchedChats);
        
        // Auto-select first channel if none selected
        if (!selectedChat && fetchedChats.length > 0) {
          const firstChannel = fetchedChats.find(chat => chat.type === 'channel');
          if (firstChannel) {
            selectChat({ type: firstChannel.type, id: firstChannel.id, name: firstChannel.name });
          }
        }
      } catch (error) {
        console.error('Failed to load chats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, [user?.activeWorkspaceId]);

  // Load messages when chat is selected
  useEffect(() => {
    if (!selectedChat) return;

    const loadMessages = async () => {
      setMessagesLoading(true);
      try {
        const fetchedMessages = await fetchMessages(selectedChat.id);
        setMessages(fetchedMessages);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setMessagesLoading(false);
      }
    };

    loadMessages();
  }, [selectedChat]);

  // Utility functions
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getDirectMessages = (): Array<{ chat: Chat; label: string }> => {
    return chats
      .filter(chat => chat.type === 'dm')
      .map(chat => ({
        chat,
        label: chat.name || 'Direct Message'
      }));
  };

  const getOrderedChannels = (): Chat[] => {
    return chats
      .filter(chat => chat.type === 'channel')
      .sort((a, b) => {
        // Pin #general first
        if (a.name === 'general') return -1;
        if (b.name === 'general') return 1;
        return (a.name || '').localeCompare(b.name || '');
      });
  };

  const getChatDisplayName = (chat: Chat): string => {
    if (chat.type === 'channel') {
      return `#${chat.name || 'unknown'}`;
    }
    return chat.name || 'Direct Message';
  };

  const getMessageSenderDisplayName = (sender: { id: string; name: string | null; email: string; username?: string | null }): string => {
    // Use name first, then username, then email prefix (never fallback to "User")
    if (sender.name && sender.name.trim()) return sender.name;
    if (sender.username && sender.username.trim()) return sender.username;
    if (sender.email) {
      const emailPrefix = sender.email.split('@')[0];
      if (emailPrefix) return emailPrefix;
    }
    return '';
  };

  const isUserOnline = (userId: string): boolean => {
    return onlineUsers.has(userId);
  };

  // Action handlers
  const selectChat = (chat: { type: "channel" | "dm"; id: string; name?: string }) => {
    setSelectedChat(chat);
    setMessages([]); // Clear messages while loading new ones
  };

  const sendMessage = async (content: string) => {
    if (!selectedChat || !content.trim()) return;

    setSending(true);
    try {
      await apiSendMessage(selectedChat.id, content);
      // Messages will be refreshed by the useEffect
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const editMessage = async (messageId: string, content: string) => {
    try {
      await apiEditMessage(messageId, content);
      // Messages will be refreshed by the useEffect
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await apiDeleteMessage(messageId);
      // Messages will be refreshed by the useEffect
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      await apiAddReaction(messageId, emoji);
      // Messages will be refreshed by the useEffect
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const removeReaction = async (messageId: string, emoji: string) => {
    try {
      await apiRemoveReaction(messageId, emoji);
      // Messages will be refreshed by the useEffect
    } catch (error) {
      console.error('Failed to remove reaction:', error);
    }
  };

  const startTyping = () => {
    if (selectedChat) {
      apiStartTyping(selectedChat.id);
    }
  };

  const stopTyping = () => {
    if (selectedChat) {
      apiStopTyping(selectedChat.id);
    }
  };

  const contextValue: OasisContextType = {
    // State
    selectedChat,
    chats,
    messages,
    onlineUsers,
    typingUsers,
    loading,
    sending,
    messagesLoading,

    // Actions
    selectChat,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    startTyping,
    stopTyping,

    // Utility functions
    getInitials,
    getDirectMessages,
    getOrderedChannels,
    getChatDisplayName,
    getMessageSenderDisplayName,
    isUserOnline,
  };

  return (
    <OasisContext.Provider value={contextValue}>
      {children}
    </OasisContext.Provider>
  );
}

export function useOasis() {
  const context = useContext(OasisContext);
  if (context === undefined) {
    throw new Error('useOasis must be used within an OasisProvider');
  }
  return context;
}


