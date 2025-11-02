"use client";

import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface ThreadMessage {
  id: string;
  content: string;
  author: {
    name: string;
    avatar: string;
  };
  timestamp: string;
  isRead: boolean;
}

interface OasisThreadViewProps {
  isVisible: boolean;
  onClose: () => void;
  threadMessages?: ThreadMessage[];
  conversationName?: string;
}

export function OasisThreadView({ isVisible, onClose, threadMessages = [], conversationName = "Thread" }: OasisThreadViewProps) {
  if (!isVisible) return null;

  // Mock thread messages
  const mockThreadMessages: ThreadMessage[] = [
    {
      id: '1',
      content: 'This is a great point! I think we should definitely consider the API integration approach.',
      author: { name: 'Sarah Chen', avatar: 'SC' },
      timestamp: '2m ago',
      isRead: true
    },
    {
      id: '2',
      content: 'I agree with Sarah. The REST API would be more straightforward for our use case.',
      author: { name: 'Mike Johnson', avatar: 'MJ' },
      timestamp: '1m ago',
      isRead: true
    },
    {
      id: '3',
      content: 'What about the performance implications? GraphQL might be better for our data fetching patterns.',
      author: { name: 'Alex Rodriguez', avatar: 'AR' },
      timestamp: '30s ago',
      isRead: false
    }
  ];

  const messages = threadMessages.length > 0 ? threadMessages : mockThreadMessages;

  return (
    <div className="fixed top-0 right-0 w-96 h-screen z-50 flex flex-col bg-background border-l border-border">
      {/* Thread Header */}
      <div className="flex-shrink-0 p-4 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1 hover:bg-hover rounded-md transition-colors"
            title="Back to main chat"
          >
            <ArrowLeftIcon className="w-5 h-5 text-muted" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{conversationName}</h2>
            <p className="text-sm text-muted">Thread replies</p>
          </div>
        </div>
      </div>

      {/* Thread Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-background border border-border rounded flex items-center justify-center">
                <span className="text-sm font-medium text-foreground">{message.author.avatar}</span>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-foreground">{message.author.name}</span>
                <span className="text-sm text-muted">{message.timestamp}</span>
                {message.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </div>
              
              <p className="text-foreground">{message.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Thread Input */}
      <div className="flex-shrink-0 p-4 border-t border-border bg-background">
        <div className="relative">
          <input
            type="text"
            placeholder="Reply in thread..."
            className="w-full px-4 py-3 pr-12 border border-border rounded-lg focus:outline-none focus:border-muted text-sm bg-background"
          />
          <button className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1.5 bg-background border border-border rounded-md hover:bg-hover transition-colors">
            <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
