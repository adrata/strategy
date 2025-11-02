"use client";

/**
 * Oasis Middle Panel Component
 * 
 * Main communication interface for Oasis.
 * Clean, modern design with message threads and real-time updates.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  PaperClipIcon,
  FaceSmileIcon,
  EllipsisHorizontalIcon,
  CheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface OasisMiddlePanelProps {
  activeSection: string;
  selectedChannel: any;
  onChannelSelect: (channel: any) => void;
  isLoading: boolean;
}

interface Message {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    status: 'online' | 'away' | 'offline';
  };
  timestamp: string;
  isRead: boolean;
  reactions?: Array<{
    emoji: string;
    count: number;
    users: string[];
  }>;
  threadCount?: number;
}

interface Channel {
  id: string;
  name: string;
  type: 'channel' | 'dm';
  lastMessage?: Message;
  unreadCount: number;
  isActive: boolean;
  members: number;
}

// Mock data for demonstration
const mockChannels: Channel[] = [
  {
    id: 'general',
    name: 'general',
    type: 'channel',
    unreadCount: 3,
    isActive: true,
    members: 12,
    lastMessage: {
      id: '1',
      content: 'Hey team, just wanted to update everyone on the project status...',
      author: {
        id: 'user1',
        name: 'Sarah Chen',
        avatar: 'SC',
        status: 'online'
      },
      timestamp: '2m ago',
      isRead: false
    }
  },
  {
    id: 'design',
    name: 'design',
    type: 'channel',
    unreadCount: 0,
    isActive: false,
    members: 5,
    lastMessage: {
      id: '2',
      content: 'The new mockups are ready for review',
      author: {
        id: 'user2',
        name: 'Mike Johnson',
        avatar: 'MJ',
        status: 'away'
      },
      timestamp: '1h ago',
      isRead: true
    }
  },
  {
    id: 'dev-team',
    name: 'dev-team',
    type: 'channel',
    unreadCount: 7,
    isActive: false,
    members: 8,
    lastMessage: {
      id: '3',
      content: 'Bug fix deployed to staging environment',
      author: {
        id: 'user3',
        name: 'Alex Rodriguez',
        avatar: 'AR',
        status: 'online'
      },
      timestamp: '30m ago',
      isRead: false
    }
  }
];

const mockMessages: Message[] = [
  {
    id: '1',
    content: 'Hey team, just wanted to update everyone on the project status. We\'re making great progress on the new features.',
    author: {
      id: 'user1',
      name: 'Sarah Chen',
      avatar: 'SC',
      status: 'online'
    },
    timestamp: '2m ago',
    isRead: true,
    reactions: [
      { emoji: '👍', count: 3, users: ['user2', 'user3', 'user4'] },
      { emoji: '🚀', count: 1, users: ['user5'] }
    ],
    threadCount: 2
  },
  {
    id: '2',
    content: 'Thanks for the update Sarah! The new dashboard looks amazing.',
    author: {
      id: 'user2',
      name: 'Mike Johnson',
      avatar: 'MJ',
      status: 'away'
    },
    timestamp: '1m ago',
    isRead: true
  },
  {
    id: '3',
    content: 'I have a question about the API integration. Should we use REST or GraphQL?',
    author: {
      id: 'user3',
      name: 'Alex Rodriguez',
      avatar: 'AR',
      status: 'online'
    },
    timestamp: '30s ago',
    isRead: false
  }
];

export function OasisMiddlePanel({ 
  activeSection, 
  selectedChannel, 
  onChannelSelect, 
  isLoading 
}: OasisMiddlePanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(mockMessages);

  // Filter channels based on search
  const filteredChannels = useMemo(() => {
    if (!searchQuery) return mockChannels;
    return mockChannels.filter(channel => 
      channel.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Handle sending a message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: messageInput,
      author: {
        id: 'current-user',
        name: 'You',
        avatar: 'JD',
        status: 'online'
      },
      timestamp: 'now',
      isRead: true
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageInput('');
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-success';
      case 'away': return 'bg-warning';
      case 'offline': return 'bg-muted';
      default: return 'bg-muted';
    }
  };

  if (activeSection === 'channels') {
    return (
      <div className="flex-1 flex flex-col bg-background">
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-foreground">Channels</h1>
            <button className="p-2 text-muted hover:text-muted hover:bg-hover rounded-lg transition-colors">
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {filteredChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => onChannelSelect(channel)}
                className={`w-full p-4 rounded-lg border transition-colors text-left ${
                  selectedChannel?.id === channel.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-border hover:bg-panel-background'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-primary font-medium">#{channel.name}</span>
                    <span className="text-sm text-muted">{channel.members} members</span>
                  </div>
                  {channel.unreadCount > 0 && (
                    <span className="px-2 py-1 bg-error/10 text-error text-xs font-medium rounded-full">
                      {channel.unreadCount}
                    </span>
                  )}
                </div>
                
                {channel.lastMessage && (
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <span className="font-medium">{channel.lastMessage.author.name}:</span>
                    <span className="truncate">{channel.lastMessage.content}</span>
                    <span className="text-xs text-muted ml-auto">{channel.lastMessage.timestamp}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Channel view
  if (selectedChannel) {
    return (
      <div className="flex-1 flex flex-col bg-background">
        {/* Channel Header */}
        <div className="flex-shrink-0 p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-foreground">#{selectedChannel.name}</span>
              <span className="text-sm text-muted">{selectedChannel.members} members</span>
            </div>
            <button className="p-2 text-muted hover:text-muted hover:bg-hover rounded-lg transition-colors">
              <EllipsisHorizontalIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium text-white">{message.author.avatar}</span>
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(message.author.status)}`}></div>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground">{message.author.name}</span>
                  <span className="text-sm text-muted">{message.timestamp}</span>
                  {message.isRead && (
                    <CheckIcon className="w-4 h-4 text-blue-500" />
                  )}
                </div>
                
                <p className="text-foreground mb-2">{message.content}</p>
                
                {/* Reactions */}
                {message.reactions && message.reactions.length > 0 && (
                  <div className="flex gap-2 mb-2">
                    {message.reactions.map((reaction, index) => (
                      <button
                        key={index}
                        className="flex items-center gap-1 px-2 py-1 bg-hover hover:bg-loading-bg rounded-full text-sm transition-colors"
                      >
                        <span>{reaction.emoji}</span>
                        <span className="text-muted">{reaction.count}</span>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Thread indicator */}
                {message.threadCount && (
                  <button className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
                    <span>{message.threadCount} replies</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="flex-shrink-0 p-4 border-t border-border">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={`Message #${selectedChannel.name}`}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                <button
                  type="button"
                  className="p-1 text-muted hover:text-muted transition-colors"
                >
                  <PaperClipIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-1 text-muted hover:text-muted transition-colors"
                >
                  <FaceSmileIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={!messageInput.trim()}
              className="px-2 py-1.5 bg-background border border-border rounded-md hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Default view
  return (
    <div className="flex-1 flex items-center justify-center bg-panel-background">
      <div className="text-center">
        <div className="w-16 h-16 bg-loading-bg rounded-full flex items-center justify-center mx-auto mb-4">
          <ChatBubbleLeftRightIcon className="w-8 h-8 text-muted" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">Welcome to Oasis</h3>
        <p className="text-muted">Select a channel to start communicating</p>
      </div>
    </div>
  );
}
