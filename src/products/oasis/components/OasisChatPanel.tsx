"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useOasisLayout } from '@/app/[workspace]/(revenue-os)/layout';
import { useUnifiedAuth } from "@/platform/auth";
import { useOasisMessages } from '@/products/oasis/hooks/useOasisMessages';
import { useOasisTyping } from '@/products/oasis/hooks/useOasisTyping';
import { VideoCallService } from '@/platform/services/video-call-service';
import { 
  PaperAirplaneIcon,
  CheckIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  AtSymbolIcon,
  StarIcon,
  ArchiveBoxIcon,
  Cog6ToothIcon,
  ArrowLeftIcon,
  HashtagIcon,
  VideoCameraIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { CompleteActionModal } from '@/platform/ui/components/CompleteActionModal';

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

interface OasisChatPanelProps {
  onShowThread?: () => void;
}

// Mock data will be replaced with real data from hooks

export function OasisChatPanel({ onShowThread }: OasisChatPanelProps = {}) {
  const { activeSection, selectedChannel, setIsVideoCallActive, setVideoCallRoom } = useOasisLayout();
  const { user: authUser } = useUnifiedAuth();
  
  // Get workspace ID from auth user
  const workspaceId = authUser?.activeWorkspaceId || '';
  
  // Real data hooks - only call when we have a selected channel
  const { 
    messages: realMessages, 
    loading: messagesLoading, 
    sendMessage, 
    editMessage, 
    deleteMessage, 
    addReaction, 
    removeReaction,
    markAsRead
  } = useOasisMessages(
    workspaceId,
    selectedChannel?.type === 'channel' ? selectedChannel.id : undefined,
    selectedChannel?.type === 'dm' ? selectedChannel.id : undefined
  );
  
  const { typingUsers, startTyping, stopTyping } = useOasisTyping(
    workspaceId,
    selectedChannel?.type === 'channel' ? selectedChannel.id : undefined,
    selectedChannel?.type === 'dm' ? selectedChannel.id : undefined
  );
  
  const [messageInput, setMessageInput] = useState('');
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Add Action Modal state
  const [showAddActionModal, setShowAddActionModal] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Video call functionality
  const handleVideoCall = async () => {
    try {
      const roomName = `${selectedChannel?.type}-${selectedChannel?.name}`;
      
      // Create video call room
      const room = await VideoCallService.createRoom(
        roomName,
        [authUser?.id || ''], // Start with current user, add others later
        60 // 1 hour duration
      );
      
      // Set video call state in Oasis context
      setIsVideoCallActive(true);
      setVideoCallRoom({ id: room.id, name: roomName });
      
      console.log('📹 Started video call for:', selectedChannel?.name, 'Room:', room.id);
    } catch (error) {
      console.error('Failed to start video call:', error);
      alert('Failed to start video call. Please try again.');
    }
  };

  // Handle action submission
  const handleActionSubmit = async (actionData: any) => {
    setIsSubmittingAction(true);
    try {
      const response = await fetch('/api/v1/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: actionData.type,
          subject: actionData.action.length > 100 ? actionData.action.substring(0, 100) + '...' : actionData.action,
          description: actionData.action,
          status: 'COMPLETED',
          completedAt: new Date().toISOString(),
          // Include person/company IDs if available
          ...(actionData.personId && actionData.personId.trim() !== '' && { personId: actionData.personId }),
          ...(actionData.companyId && actionData.companyId.trim() !== '' && { companyId: actionData.companyId })
        })
      });

      if (response.ok) {
        setShowAddActionModal(false);
        console.log('✅ Action logged successfully from Oasis');
      } else {
        throw new Error('Failed to log action');
      }
    } catch (error) {
      console.error('Failed to log action:', error);
      alert('Failed to log action. Please try again.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [realMessages]);

  // Mark messages as read when they are viewed
  useEffect(() => {
    if (realMessages.length > 0) {
      const unreadMessageIds = realMessages
        .filter(msg => msg.senderId !== authUser?.id) // Only mark others' messages as read
        .map(msg => msg.id);
      
      if (unreadMessageIds.length > 0) {
        markAsRead(unreadMessageIds);
      }
    }
  }, [realMessages, authUser?.id, markAsRead]);

  // Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    try {
      await sendMessage(messageInput);
      setMessageInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
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

  // Show skeleton loading state when no channel is selected
  if (!selectedChannel) {
    return (
      <div className="flex-1 flex flex-col bg-background h-full">
        {/* Header Skeleton */}
        <div className="flex-shrink-0 p-4 border-b border-border bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-loading-bg rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 bg-loading-bg rounded w-32 animate-pulse" />
                <div className="h-4 bg-loading-bg rounded w-24 animate-pulse" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-8 bg-loading-bg rounded w-24 animate-pulse" />
              <div className="h-8 bg-loading-bg rounded w-28 animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* Messages Skeleton */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 px-2">
              <div className="w-10 h-10 bg-loading-bg rounded animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-loading-bg rounded w-1/4 animate-pulse" />
                <div className="h-4 bg-loading-bg rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-loading-bg rounded w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
        
        {/* Input Skeleton */}
        <div className="flex-shrink-0 p-4 border-t border-border">
          <div className="h-12 bg-loading-bg rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  // Chat view with messages
  return (
    <div className="flex-1 flex flex-col bg-background h-full">
      {/* Chat Header */}
      <div className="flex-shrink-0 p-4 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedChannel.type === 'channel' && (
              <HashtagIcon className="w-5 h-5 text-muted" />
            )}
            {selectedChannel.type === 'dm' && (
              <div className="w-8 h-8 bg-background border border-border rounded flex items-center justify-center">
                <span className="text-sm font-medium text-foreground">
                  {selectedChannel.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {selectedChannel.type === 'channel' ? `#${selectedChannel.name}` : selectedChannel.name}
              </h2>
              {selectedChannel.type === 'dm' && selectedChannel.status && (
                <p className="text-sm text-muted">
                  {selectedChannel.status === 'online' ? 'Online' : 
                   selectedChannel.status === 'away' ? 'Away' : 'Offline'}
                </p>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Add Action Button */}
            <button
              onClick={() => setShowAddActionModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-panel-background hover:bg-hover text-foreground rounded-md transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Add Action</span>
            </button>
            
            {/* Video Call Button */}
            <button
              onClick={handleVideoCall}
              className="flex items-center gap-2 px-3 py-1.5 bg-warning/10 hover:bg-warning/20 text-warning rounded-md transition-colors"
            >
              <VideoCameraIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Video Call</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 flex flex-col justify-end">
        {messagesLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 px-2">
                <div className="w-10 h-10 bg-loading-bg rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-loading-bg rounded w-1/4 animate-pulse" />
                  <div className="h-4 bg-loading-bg rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-loading-bg rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : realMessages.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center text-muted">
              <p className="text-lg font-medium mb-2">
                {selectedChannel.type === 'channel'
                  ? 'Welcome to the channel!'
                  : 'Start the conversation'}
              </p>
              <p className="text-sm">
                {selectedChannel.type === 'channel'
                  ? 'This is the beginning of your conversation in this channel.'
                  : 'This is the beginning of your direct message conversation.'}
              </p>
            </div>
          </div>
        ) : (
          realMessages.map((message) => (
          <div 
            key={message.id} 
            className="flex gap-3 group hover:bg-hover rounded-lg p-2 -m-2 cursor-pointer transition-colors"
            onMouseEnter={() => setHoveredMessage(message.id)}
            onMouseLeave={() => setHoveredMessage(null)}
            onClick={() => onShowThread?.()}
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
                <span className="text-sm text-muted">{new Date(message.createdAt).toLocaleTimeString()}</span>
              </div>
              
              <p className="text-sm text-foreground mb-2">{message.content}</p>
              
              {/* Reactions */}
              {message.reactions && message.reactions.length > 0 && (
                <div className="flex gap-2 mb-2">
                  {message.reactions.map((reaction) => (
                    <button
                      key={reaction.id}
                      className="flex items-center gap-1 px-2 py-1 bg-hover hover:bg-loading-bg rounded-full text-sm transition-colors"
                    >
                      <span>{reaction.emoji}</span>
                      <span className="text-muted">{reaction.userName}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Thread indicator */}
              {message.threadCount > 0 && (
                <button 
                  className="text-sm text-muted hover:text-foreground flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowThread?.();
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

      {/* Typing Indicators */}
      {typingUsers.length > 0 && (
        <div className="flex-shrink-0 px-4 py-2 border-t border-border bg-background">
          <div className="text-sm text-muted">
            {typingUsers.map((user, index) => (
              <span key={user.userId}>
                {user.userName} is typing
                {index < typingUsers.length - 1 && ', '}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Message Input - Bottom Aligned */}
      <div className="flex-shrink-0 p-4 border-t border-border bg-background">
        <form onSubmit={handleSendMessage} className="relative">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value);
              if (e.target.value.trim()) {
                startTyping();
              } else {
                stopTyping();
              }
            }}
            onBlur={() => stopTyping()}
            placeholder={`Message ${selectedChannel.type === 'channel' ? `#${selectedChannel.name}` : selectedChannel.name}...`}
            className="w-full px-4 py-8 pr-20 border border-border rounded-lg focus:outline-none focus:border-muted text-sm bg-panel-background"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
            <button
              type="submit"
              disabled={!messageInput.trim()}
              className="px-2 py-1.5 bg-background border border-border rounded-md hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* Add Action Modal */}
      <CompleteActionModal
        isOpen={showAddActionModal}
        onClose={() => setShowAddActionModal(false)}
        onSubmit={handleActionSubmit}
        isLoading={isSubmittingAction}
        section="oasis"
      />
    </div>
  );
}

