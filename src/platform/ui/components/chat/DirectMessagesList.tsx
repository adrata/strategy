"use client";

import React, { useState } from 'react';
import { 
  ArrowLeftIcon
} from "@heroicons/react/24/outline";

interface DirectMessage {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
  isOnline?: boolean;
}

interface DirectMessagesListProps {
  dms: DirectMessage[];
  loading: boolean;
  onSelectDM: (dm: DirectMessage) => void;
  onBack: () => void;
}

export function DirectMessagesList({ 
  dms, 
  loading, 
  onSelectDM, 
  onBack 
}: DirectMessagesListProps) {

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with back button and start conversation */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button
          onClick={onBack}
          className="p-1 text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <button className="px-3 py-1.5 bg-gradient-to-r from-blue-400 to-blue-600 text-white text-sm font-medium rounded-md hover:from-blue-500 hover:to-blue-700 transition-all shadow-sm">
          Start Conversation
        </button>
      </div>

      {/* DM List - Oasis style */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-muted">
            Loading conversations...
          </div>
        ) : dms.length === 0 ? (
          <div className="p-4 text-center text-muted">
            No direct messages yet
          </div>
        ) : (
          <div className="p-2">
            {dms.map((dm) => (
              <button
                key={dm.id}
                onClick={() => onSelectDM(dm)}
                className="w-full flex items-center px-2 py-1.5 rounded-md hover:bg-hover transition-colors text-left"
              >
                <div className="relative mr-2">
                  <div className="w-4 h-4 bg-white border border-border rounded flex items-center justify-center">
                    <span className="text-xs font-medium text-foreground">
                      {dm.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {dm.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border border-background rounded-full"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground truncate">
                      {dm.name}
                    </span>
                    {dm.lastMessageTime && (
                      <span className="text-xs text-muted ml-2">
                        {formatTimeAgo(dm.lastMessageTime)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-muted truncate flex-1">
                      {dm.lastMessage || 'No messages yet'}
                    </p>
                    {dm.unreadCount && dm.unreadCount > 0 && (
                      <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
