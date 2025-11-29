"use client";

import React from "react";

interface Conversation {
  id: string;
  name: string;
  messages: Array<{
    id: string;
    content: string;
    timestamp: Date;
    sender?: string;
    image?: any;
  }>;
  unreadCount: number;
  lastMessage?: {
    content: string;
    timestamp: Date;
    sender?: string;
  };
}

interface ConversationsListProps {
  conversations: Conversation[];
  onConversationSelect: (conversationId: string) => void;
  markConversationAsRead: (conversationId: string) => void;
}

export function ConversationsList({
  conversations,
  onConversationSelect,
  markConversationAsRead,
}: ConversationsListProps) {
  const formatTime = (date: Date | string | undefined | null) => {
    // Safely convert to Date if needed
    const dateObj = date instanceof Date ? date : date ? new Date(date) : null;
    
    // Check if date is valid
    if (!dateObj || isNaN(dateObj.getTime())) {
      return 'Unknown';
    }
    
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return dateObj.toLocaleDateString();
  };

  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.lastMessage) {
      return "No messages yet";
    }

    const { content, sender } = conversation.lastMessage;
    const senderPrefix = sender && sender !== "You" ? `${sender}: ` : "";

    if (!content && conversation.lastMessage) {
      // Check if it's an image message
      const lastMessage =
        conversation['messages'][conversation.messages.length - 1];
      if (lastMessage?.image) {
        return `${senderPrefix}📷 Photo`;
      }
    }

    return `${senderPrefix}${content || "No content"}`;
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation['id'] === "ross-dan-real") {
      return (
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">R&D</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
      );
    }

    // Default avatar
    return (
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
        <span className="text-white text-sm font-bold">
          {conversation.name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  };

  const handleConversationClick = (conversation: Conversation) => {
    if (conversation.unreadCount > 0) {
      markConversationAsRead(conversation.id);
    }
    onConversationSelect(conversation.id);
  };

  if (!Array.isArray(conversations) || conversations['length'] === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted dark:text-muted">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
          <p className="text-sm">Start a new conversation to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-foreground dark:text-white mb-4">
          Recent Conversations
        </h2>

        <div className="space-y-3">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => handleConversationClick(conversation)}
              className="w-full p-3 rounded-lg hover:bg-panel-background transition-colors text-left group"
            >
              <div className="flex items-start space-x-3">
                {/* Avatar */}
                {getConversationAvatar(conversation)}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3
                      className={`font-medium truncate ${
                        conversation.unreadCount > 0
                          ? "text-foreground dark:text-white"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {conversation.name}
                    </h3>
                    {conversation['lastMessage'] && (
                      <span className="text-xs text-muted dark:text-muted flex-shrink-0 ml-2">
                        {formatTime(conversation.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p
                      className={`text-sm truncate ${
                        conversation.unreadCount > 0
                          ? "text-muted dark:text-gray-300 font-medium"
                          : "text-muted dark:text-muted"
                      }`}
                    >
                      {getLastMessagePreview(conversation)}
                    </p>

                    {conversation.unreadCount > 0 && (
                      <span className="ml-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full flex-shrink-0">
                        {conversation.unreadCount > 99
                          ? "99+"
                          : conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
