"use client";

import React, { useState, useEffect } from "react";
import { useUnifiedAuth } from "@/platform/auth";

interface Conversation {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  lastActivity: Date;
  isActive: boolean;
  welcomeMessage?: string;
}

interface ConversationsListGroupedProps {
  onConversationSelect?: (conversationId: string) => void;
}

export function ConversationsListGrouped({ onConversationSelect }: ConversationsListGroupedProps) {
  const { user } = useUnifiedAuth();
  const workspaceId = user?.activeWorkspaceId || user?.workspaces?.[0]?.id;
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Load conversations from localStorage and track active conversation
  useEffect(() => {
    if (!workspaceId || typeof window === 'undefined') return;

    const loadConversations = () => {
      try {
        const storageKey = `adrata-conversations-${workspaceId}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          const restoredConversations = parsed.map((conv: any) => {
            // Safely parse dates, falling back to current date if invalid
            const parsedLastActivity = conv.lastActivity ? new Date(conv.lastActivity) : new Date();
            const safeLastActivity = isNaN(parsedLastActivity.getTime()) ? new Date() : parsedLastActivity;
            
            return {
            ...conv,
              lastActivity: safeLastActivity,
              messages: (conv.messages || []).map((msg: any) => {
                const parsedTimestamp = msg.timestamp ? new Date(msg.timestamp) : new Date();
                const safeTimestamp = isNaN(parsedTimestamp.getTime()) ? new Date() : parsedTimestamp;
                return {
              ...msg,
                  timestamp: safeTimestamp,
                };
              })
            };
          });
          const sorted = restoredConversations.sort((a: Conversation, b: Conversation) => {
            const aTime = a.lastActivity instanceof Date && !isNaN(a.lastActivity.getTime()) 
              ? a.lastActivity.getTime() 
              : 0;
            const bTime = b.lastActivity instanceof Date && !isNaN(b.lastActivity.getTime()) 
              ? b.lastActivity.getTime() 
              : 0;
            return bTime - aTime;
          });
          setConversations(sorted);
          
          // Update selected conversation based on active state
          const activeConv = sorted.find(c => c.isActive);
          if (activeConv) {
            setSelectedConversationId(activeConv.id);
          }
        }
      } catch (error) {
        console.warn('Failed to load conversations:', error);
      }
    };

    loadConversations();

    // Listen for storage changes to sync across tabs/components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `adrata-conversations-${workspaceId}`) {
        loadConversations();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events for same-tab updates
    const handleConversationUpdate = () => {
      loadConversations();
    };

    window.addEventListener('conversationsUpdated', handleConversationUpdate);

    // Poll for changes periodically (every 2 seconds)
    const interval = setInterval(loadConversations, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('conversationsUpdated', handleConversationUpdate);
      clearInterval(interval);
    };
  }, [workspaceId]);

  // Safely get timestamp from a date value
  const safeGetTime = (date: Date | string | undefined | null): number => {
    if (!date) return 0;
    const dateObj = date instanceof Date ? date : new Date(date);
    const time = dateObj.getTime();
    return isNaN(time) ? 0 : time;
  };

  // Group conversations by Today and Yesterday
  const groupConversationsByDate = (convs: Conversation[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: {
      'Today': Conversation[];
      'Yesterday': Conversation[];
      'Earlier': Conversation[];
    } = {
      'Today': [],
      'Yesterday': [],
      'Earlier': []
    };

    convs.forEach(conv => {
      const convTime = safeGetTime(conv.lastActivity);
      if (convTime === 0) {
        groups['Earlier'].push(conv);
        return;
      }
      
      const convDate = new Date(convTime);
      const convDay = new Date(convDate.getFullYear(), convDate.getMonth(), convDate.getDate());

      if (convDay.getTime() === today.getTime()) {
        groups['Today'].push(conv);
      } else if (convDay.getTime() === yesterday.getTime()) {
        groups['Yesterday'].push(conv);
      } else {
        groups['Earlier'].push(conv);
      }
    });

    // Sort conversations within each group by lastActivity (most recent first)
    const sortByTime = (a: Conversation, b: Conversation) => 
      safeGetTime(b.lastActivity) - safeGetTime(a.lastActivity);
    
    groups['Today'].sort(sortByTime);
    groups['Yesterday'].sort(sortByTime);
    groups['Earlier'].sort(sortByTime);

    return groups;
  };

  const groupedConversations = groupConversationsByDate(conversations);

  const formatTime = (date: Date | string | undefined | null) => {
    // Safely convert to Date if needed
    const dateObj = date instanceof Date ? date : date ? new Date(date) : null;
    
    // Check if date is valid
    if (!dateObj || isNaN(dateObj.getTime())) {
      return 'Unknown';
    }
    
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const getLastMessagePreview = (conv: Conversation) => {
    if (conv.messages.length === 0) {
      return "No messages yet";
    }
    const lastMessage = conv.messages[conv.messages.length - 1];
    return lastMessage.content.slice(0, 60) + (lastMessage.content.length > 60 ? '...' : '');
  };

  const handleConversationClick = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    
    // Dispatch custom event to notify other components
    const event = new CustomEvent('switchConversation', { 
      detail: { conversationId } 
    });
    window.dispatchEvent(event);
    
    // Call optional callback if provided
    if (onConversationSelect) {
      onConversationSelect(conversationId);
    }
  };

  const renderConversationGroup = (title: string, convs: Conversation[]) => {
    if (convs.length === 0) return null;

    return (
      <div key={title} className="mb-6">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
          {title}
        </h3>
        <div className="space-y-1">
          {convs.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleConversationClick(conv.id)}
              className={`w-full px-4 py-3 text-left rounded-lg transition-colors ${
                selectedConversationId === conv.id || conv.isActive
                  ? 'bg-panel-background text-foreground'
                  : 'hover:bg-panel-background text-foreground'
              }`}
            >
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm truncate flex-1">
                    {conv.title}
                  </span>
                  <span className="text-xs text-muted ml-2 flex-shrink-0">
                    {formatTime(conv.lastActivity)}
                  </span>
                </div>
                <p className="text-xs text-muted truncate">
                  {getLastMessagePreview(conv)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center text-muted">
          <div className="text-4xl mb-3">💬</div>
          <h3 className="text-sm font-medium mb-1">No conversations yet</h3>
          <p className="text-xs">Start a new conversation to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-shrink-0 px-4 py-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">
          Chats
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto py-4 px-4">
        {renderConversationGroup('Today', groupedConversations['Today'])}
        {renderConversationGroup('Yesterday', groupedConversations['Yesterday'])}
        {renderConversationGroup('Earlier', groupedConversations['Earlier'])}
      </div>
    </div>
  );
}

