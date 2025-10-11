"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useOasis } from '@/app/[workspace]/(pipeline)/layout';
import { 
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  CheckIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  AtSymbolIcon,
  StarIcon,
  ArchiveBoxIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

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

// Mock data for demonstration
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

export function OasisChatPanel() {
  const { activeSection, selectedChannel } = useOasis();
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      case 'online': return 'bg-green-400';
      case 'away': return 'bg-yellow-400';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  // Show different content based on active section
  if (activeSection === 'channels' && !selectedChannel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--panel-background)]">
        <div className="text-center">
          <div className="w-16 h-16 bg-[var(--loading-bg)] rounded-full flex items-center justify-center mx-auto mb-4">
            <ChatBubbleLeftRightIcon className="w-8 h-8 text-[var(--muted)]" />
          </div>
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Welcome to Oasis</h3>
          <p className="text-[var(--muted)]">Select a channel from the left panel to start communicating</p>
        </div>
      </div>
    );
  }

  if (activeSection === 'direct-messages') {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--panel-background)]">
        <div className="text-center">
          <div className="w-16 h-16 bg-[var(--loading-bg)] rounded-full flex items-center justify-center mx-auto mb-4">
            <UserGroupIcon className="w-8 h-8 text-[var(--muted)]" />
          </div>
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Direct Messages</h3>
          <p className="text-[var(--muted)]">Start a conversation with a team member</p>
        </div>
      </div>
    );
  }

  if (activeSection === 'mentions') {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--panel-background)]">
        <div className="text-center">
          <div className="w-16 h-16 bg-[var(--loading-bg)] rounded-full flex items-center justify-center mx-auto mb-4">
            <AtSymbolIcon className="w-8 h-8 text-[var(--muted)]" />
          </div>
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Mentions</h3>
          <p className="text-[var(--muted)]">Messages that mention you will appear here</p>
        </div>
      </div>
    );
  }

  if (activeSection === 'starred') {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--panel-background)]">
        <div className="text-center">
          <div className="w-16 h-16 bg-[var(--loading-bg)] rounded-full flex items-center justify-center mx-auto mb-4">
            <StarIcon className="w-8 h-8 text-[var(--muted)]" />
          </div>
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Starred Messages</h3>
          <p className="text-[var(--muted)]">Your starred messages will appear here</p>
        </div>
      </div>
    );
  }

  if (activeSection === 'archived') {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--panel-background)]">
        <div className="text-center">
          <div className="w-16 h-16 bg-[var(--loading-bg)] rounded-full flex items-center justify-center mx-auto mb-4">
            <ArchiveBoxIcon className="w-8 h-8 text-[var(--muted)]" />
          </div>
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Archived</h3>
          <p className="text-[var(--muted)]">Archived conversations will appear here</p>
        </div>
      </div>
    );
  }

  if (activeSection === 'settings') {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--panel-background)]">
        <div className="text-center">
          <div className="w-16 h-16 bg-[var(--loading-bg)] rounded-full flex items-center justify-center mx-auto mb-4">
            <Cog6ToothIcon className="w-8 h-8 text-[var(--muted)]" />
          </div>
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Settings</h3>
          <p className="text-[var(--muted)]">Communication preferences and settings</p>
        </div>
      </div>
    );
  }

  // Chat view with messages
  return (
    <div className="flex-1 flex flex-col bg-[var(--background)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
                <span className="font-medium text-[var(--foreground)]">{message.author.name}</span>
                <span className="text-sm text-[var(--muted)]">{message.timestamp}</span>
                {message.isRead && (
                  <CheckIcon className="w-4 h-4 text-blue-500" />
                )}
              </div>
              
              <p className="text-gray-700 mb-2">{message.content}</p>
              
              {/* Reactions */}
              {message.reactions && message.reactions.length > 0 && (
                <div className="flex gap-2 mb-2">
                  {message.reactions.map((reaction, index) => (
                    <button
                      key={index}
                      className="flex items-center gap-1 px-2 py-1 bg-[var(--hover)] hover:bg-[var(--loading-bg)] rounded-full text-sm transition-colors"
                    >
                      <span>{reaction.emoji}</span>
                      <span className="text-[var(--muted)]">{reaction.count}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Thread indicator */}
              {message.threadCount && (
                <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <span>{message.threadCount} replies</span>
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 p-6 border-t border-[var(--border)] bg-[var(--background)]">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={`Message ${selectedChannel ? `#${selectedChannel.name}` : 'in this channel'}...`}
              className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
              <button
                type="button"
                className="p-1.5 text-[var(--muted)] hover:text-[var(--muted)] transition-colors"
              >
                <PaperClipIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-1.5 text-[var(--muted)] hover:text-[var(--muted)] transition-colors"
              >
                <FaceSmileIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={!messageInput.trim()}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
