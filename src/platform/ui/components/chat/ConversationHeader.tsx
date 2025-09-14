"use client";

import React from 'react';
import { 
  PlusIcon, 
  ClockIcon, 
  XMarkIcon, 
  EllipsisHorizontalIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  TrophyIcon,
  FlagIcon,
  CalendarIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";

interface Conversation {
  id: string;
  title: string;
  messages: any[];
  lastActivity: Date;
  isActive: boolean;
}

interface ConversationHeaderProps {
  conversations: Conversation[];
  activeConversationId: string;
  showConversationHistory: boolean;
  showMenuPopup: boolean;
  onSwitchConversation: (id: string) => void;
  onCreateNewConversation: () => void;
  onToggleConversationHistory: () => void;
  onToggleMenuPopup: () => void;
  onCloseConversation: (id: string) => void;
  onSetViewMode: (mode: 'chat' | 'actions' | 'achievements') => void;
  onClosePanel: () => void;
  menuPopupRef: React.RefObject<HTMLDivElement>;
  conversationHistoryRef: React.RefObject<HTMLDivElement>;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export function ConversationHeader({
  conversations,
  activeConversationId,
  showConversationHistory,
  showMenuPopup,
  onSwitchConversation,
  onCreateNewConversation,
  onToggleConversationHistory,
  onToggleMenuPopup,
  onCloseConversation,
  onSetViewMode,
  onClosePanel,
  menuPopupRef,
  conversationHistoryRef
}: ConversationHeaderProps) {
  return (
    <div className="flex flex-col flex-shrink-0">
      {/* Top row with tabs and controls */}
      <div className="flex flex-row items-center justify-between px-4 pt-5 pb-2">
        {/* Conversation Tabs */}
        <div className="flex items-center overflow-x-auto flex-1 mr-4">
          {conversations.map((conv) => (
            <div key={conv.id} className="relative mr-2 group">
              <button
                onClick={() => onSwitchConversation(conv.id)}
                className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  conv.isActive
                    ? 'bg-gray-100 text-gray-800 dark:bg-gray-200 dark:text-gray-900'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)]'
                }`}
              >
                <span className="group-hover:opacity-50 transition-opacity">{conv.title}</span>
              </button>
              {conversations.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseConversation(conv.id);
                  }}
                  className={`absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                    conv.isActive 
                      ? 'bg-white text-gray-700 hover:bg-gray-50' 
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex flex-row items-center space-x-2">
          {/* New Chat Button (+ icon) */}
          <button
            onClick={onCreateNewConversation}
            className="w-7 h-7 text-[var(--muted)] cursor-pointer hover:text-[var(--foreground)] transition-colors flex items-center justify-center"
            title="New Chat"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
          
          {/* Conversation History Button */}
          <button
            onClick={onToggleConversationHistory}
            className="w-7 h-7 text-[var(--muted)] cursor-pointer hover:text-[var(--foreground)] transition-colors flex items-center justify-center"
            title="Conversation History"
          >
            <ClockIcon className="w-5 h-5" />
          </button>
          
          
          <XMarkIcon 
            className="w-6 h-6 text-[var(--muted)] cursor-pointer hover:text-[var(--foreground)] transition-colors" 
            title="Close" 
            onClick={onClosePanel} 
          />
        </div>
      </div>
      
      {/* Conversation History Popup */}
      {showConversationHistory && (
        <div ref={conversationHistoryRef} className="absolute top-16 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-2 w-[240px] max-h-[400px] overflow-y-auto z-50">
          <div className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
            Conversation History
          </div>
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSwitchConversation(conv.id)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {conv.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {conv.messages.length} messages • {formatTimeAgo(conv.lastActivity)}
                  </div>
                </div>
                {conv['isActive'] && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
