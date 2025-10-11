"use client";

import React, { useState } from "react";
import { useOasis } from "../context/OasisProvider";
import { 
  PlusIcon, 
  ChevronDownIcon, 
  ChevronRightIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";

interface OasisLeftPanelProps {
  className?: string;
}

export function OasisLeftPanel({ className = "" }: OasisLeftPanelProps) {
  const {
    selectedChat,
    chats,
    loading,
    selectChat,
    getOrderedChannels,
    getDirectMessages,
    getChatDisplayName,
    isUserOnline,
  } = useOasis();

  const [channelsExpanded, setChannelsExpanded] = useState(true);
  const [dmsExpanded, setDmsExpanded] = useState(true);

  const channels = getOrderedChannels();
  const directMessages = getDirectMessages();

  const handleChatSelect = (chat: { type: "channel" | "dm"; id: string; name?: string }) => {
    selectChat(chat);
  };

  if (loading) {
    return (
      <div className={`w-64 bg-[var(--background)] border-r border-[var(--border)] flex flex-col ${className}`}>
        <div className="p-4">
          <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
        </div>
        <div className="flex-1 p-4 space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-64 bg-[var(--background)] border-r border-[var(--border)] flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-1">
          Oasis
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Workspace communication
        </p>
      </div>

      {/* Channels Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {/* Channels Header */}
          <button
            onClick={() => setChannelsExpanded(!channelsExpanded)}
            className="flex items-center justify-between w-full px-2 py-1 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <div className="flex items-center gap-2">
              {channelsExpanded ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
              <UserGroupIcon className="w-4 h-4" />
              <span>Channels</span>
            </div>
            <PlusIcon className="w-4 h-4 hover:bg-[var(--hover-bg)] rounded p-0.5" />
          </button>

          {/* Channels List */}
          {channelsExpanded && (
            <div className="mt-1 space-y-0.5">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => handleChatSelect({ 
                    type: 'channel', 
                    id: channel.id, 
                    name: channel.name 
                  })}
                  className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${
                    selectedChat?.id === channel.id
                      ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                      : 'text-[var(--foreground)] hover:bg-[var(--hover-bg)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--muted)]">#</span>
                    <span className="truncate">{channel.name}</span>
                    {channel.memberCount && (
                      <span className="text-xs text-[var(--muted)] ml-auto">
                        {channel.memberCount}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Direct Messages Header */}
          <button
            onClick={() => setDmsExpanded(!dmsExpanded)}
            className="flex items-center justify-between w-full px-2 py-1 mt-4 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <div className="flex items-center gap-2">
              {dmsExpanded ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              <span>Direct Messages</span>
            </div>
            <PlusIcon className="w-4 h-4 hover:bg-[var(--hover-bg)] rounded p-0.5" />
          </button>

          {/* Direct Messages List */}
          {dmsExpanded && (
            <div className="mt-1 space-y-0.5">
              {directMessages.map(({ chat, label }) => (
                <button
                  key={chat.id}
                  onClick={() => handleChatSelect({ 
                    type: 'dm', 
                    id: chat.id, 
                    name: chat.name 
                  })}
                  className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${
                    selectedChat?.id === chat.id
                      ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                      : 'text-[var(--foreground)] hover:bg-[var(--hover-bg)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-xs font-medium text-[var(--accent-foreground)]">
                        {label.charAt(0).toUpperCase()}
                      </div>
                      {chat.members && chat.members.length > 0 && (
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[var(--background)] ${
                            isUserOnline(chat.members[0].id) ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                      )}
                    </div>
                    <span className="truncate">{label}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>Online</span>
        </div>
      </div>
    </div>
  );
}

