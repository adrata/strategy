"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeftIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { useOasisLayout } from '@/products/oasis/context/OasisLayoutContext';
import { useUnifiedAuth } from "@/platform/auth";
import { formatMessageTime } from '@/platform/utils/dateUtils';

interface OasisThreadViewProps {
  // Component is rendered in right panel slot via layout
}

export function OasisThreadView({}: OasisThreadViewProps) {
  const layoutContext = useOasisLayout();
  const { threadData, setThreadData, threadNavigationStack, setThreadNavigationStack } = layoutContext;
  const { user: authUser } = useUnifiedAuth();
  const [threadInput, setThreadInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get current thread level from navigation stack
  const currentLevel = threadNavigationStack.length > 0 
    ? threadNavigationStack[threadNavigationStack.length - 1].level 
    : 1;
  
  // If no thread data, don't render
  if (!threadData) {
    return null;
  }

  // Use real thread messages from threadData, no mock data
  const messages = threadData.threadMessages || [];
  const isNestedThread = currentLevel > 1;
  
  // Extract channelId and dmId from threadData with proper typing
  const channelId = threadData.channelId || '';
  const dmId = threadData.dmId || '';

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleBack = async () => {
    if (threadNavigationStack.length > 1) {
      // Pop from stack to go back one level
      const newStack = threadNavigationStack.slice(0, -1);
      setThreadNavigationStack(newStack);
      
      // Update thread data to previous level
      if (newStack.length > 0) {
        const prevLevelData = newStack[newStack.length - 1];
        try {
          // Fetch thread messages for previous level
          const workspaceId = authUser?.activeWorkspaceId || '';
          
          const params = new URLSearchParams({
            workspaceId,
            ...(channelId && { channelId }),
            ...(dmId && { dmId }),
            parentMessageId: prevLevelData.messageId || prevLevelData.parentMessageId || ''
          });
          
          const response = await fetch(`/api/v1/oasis/oasis/messages?${params}`, {
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            const prevThreadMessages = data.messages || [];
            
            setThreadData({
              messageId: prevLevelData.messageId,
              threadMessages: prevThreadMessages,
              parentMessageId: prevLevelData.parentMessageId,
              channelId: threadData.channelId,
              dmId: threadData.dmId
            });
          }
        } catch (error) {
          console.error('Failed to fetch previous thread messages:', error);
        }
      } else {
        // Going back to main chat - close thread
        setThreadData(null);
        setThreadNavigationStack([]);
      }
    } else {
      // Close thread view entirely
      setThreadData(null);
      setThreadNavigationStack([]);
    }
  };

  const handleThreadReplyClick = async (messageId: string) => {
    try {
      // Fetch thread messages for the nested thread
      const workspaceId = authUser?.activeWorkspaceId || '';
      
      // Use the channel or DM context to fetch nested thread messages
      const params = new URLSearchParams({
        workspaceId,
        ...(channelId && { channelId }),
        ...(dmId && { dmId }),
        parentMessageId: messageId
      });
      
      const response = await fetch(`/api/v1/oasis/oasis/messages?${params}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const nestedThreadMessages = data.messages || [];
        
        // Push to navigation stack for nested thread
        const newStack = [...threadNavigationStack, {
          messageId,
          parentMessageId: threadData.messageId,
          level: currentLevel + 1
        }];
        setThreadNavigationStack(newStack);
        
        // Update thread data with nested thread messages
        setThreadData({
          messageId,
          threadMessages: nestedThreadMessages,
          parentMessageId: threadData.messageId,
          channelId: threadData.channelId,
          dmId: threadData.dmId
        });
      }
    } catch (error) {
      console.error('Failed to fetch nested thread messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadInput.trim() || !threadData) return;

    try {
      // Send thread reply
      const response = await fetch('/api/v1/oasis/oasis/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          parentMessageId: threadData.messageId,
          content: threadInput.trim(),
          channelId: threadData.channelId || null,
          dmId: threadData.dmId || null
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Add new message to thread messages
        const newMessage = {
          id: data.message.id,
          content: data.message.content,
          senderId: data.message.senderId,
          senderName: data.message.senderName || 'Unknown',
          senderUsername: data.message.senderUsername,
          createdAt: data.message.createdAt,
          threadCount: 0,
          threadMessages: []
        };
        setThreadData({
          ...threadData,
          threadMessages: [...threadData.threadMessages, newMessage]
        });
        setThreadInput('');
      }
    } catch (error) {
      console.error('Failed to send thread message:', error);
    }
  };

  return (
    <div className="w-full h-full bg-background border-l border-border flex flex-col">
      {/* Thread Header */}
      <div className="flex-shrink-0 p-4 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-1 hover:bg-hover rounded-md transition-colors"
            title={isNestedThread ? "Back to previous thread" : "Back to main chat"}
          >
            {isNestedThread ? (
              <ChevronLeftIcon className="w-5 h-5 text-muted" />
            ) : (
              <ArrowLeftIcon className="w-5 h-5 text-muted" />
            )}
          </button>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {threadData.messageId.substring(0, 8)}
            </h2>
            <p className="text-sm text-muted">
              {isNestedThread ? `Nested thread (Level ${currentLevel})` : 'Thread replies'}
            </p>
          </div>
        </div>
      </div>

      {/* Thread Messages */}
      <div className="flex-1 overflow-y-auto invisible-scrollbar p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center text-muted">
              <p className="text-sm">No replies yet</p>
            </div>
          </div>
        ) : (
          messages.map((message: any) => (
            <div 
              key={message.id} 
              className="flex gap-3 group hover:bg-hover rounded-lg p-2 -m-2 cursor-pointer transition-colors"
              onClick={() => {
                // If this message has thread replies, allow clicking to open nested thread
                if (message.threadCount > 0) {
                  handleThreadReplyClick(message.id);
                }
              }}
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-background border border-border rounded flex items-center justify-center">
                  <span className="text-base font-medium text-foreground">
                    {message.senderName && message.senderName.length > 0 
                      ? message.senderName.charAt(0).toUpperCase() 
                      : '?'}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground">{message.senderName || 'Unknown'}</span>
                  <span className="text-sm text-muted">{formatMessageTime(message.createdAt)}</span>
                </div>
                
                <p className="text-sm text-foreground mb-2">{message.content}</p>
                
                {/* Thread indicator for nested threads */}
                {message.threadCount > 0 && (
                  <button 
                    className="text-sm text-muted hover:text-foreground flex items-center gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleThreadReplyClick(message.id);
                    }}
                  >
                    <span>{message.threadCount} replies</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Thread Input - Matches OasisChatPanel styling */}
      <div className="flex-shrink-0 p-4 border-t border-border bg-background">
        <form onSubmit={handleSendMessage} className="relative">
          <input
            type="text"
            value={threadInput}
            onChange={(e) => setThreadInput(e.target.value)}
            placeholder="You"
            className="w-full px-4 py-8 pr-20 border border-border rounded-lg focus:outline-none focus:border-muted text-sm bg-panel-background"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
            <button
              type="submit"
              disabled={!threadInput.trim()}
              className="px-2 py-1.5 bg-background border border-border rounded-md hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
