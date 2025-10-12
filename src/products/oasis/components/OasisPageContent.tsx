"use client";

import React, { useState } from "react";
import { OasisChatPanel } from "@/products/oasis/components/OasisChatPanel";
import { StandardHeader } from "@/platform/ui/components/layout/StandardHeader";
import { 
  PlusIcon, 
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  AtSymbolIcon,
  StarIcon,
  ArchiveBoxIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon
} from "@heroicons/react/24/outline";
import { useOasis } from "@/app/[workspace]/(pipeline)/layout";

export function OasisPageContent() {
  const { activeSection, selectedChannel } = useOasis();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);

  // Calculate communication stats
  const communicationStats = {
    channels: 3,
    messages: 15,
    mentions: 2,
    unread: 10
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'channels': return 'Team Channels';
      case 'direct-messages': return 'Direct Messages';
      case 'mentions': return 'Mentions';
      case 'starred': return 'Starred Messages';
      case 'archived': return 'Archived';
      case 'settings': return 'Settings';
      default: return 'Communication Hub';
    }
  };

  const getSectionIcon = () => {
    switch (activeSection) {
      case 'channels': return <ChatBubbleLeftRightIcon className="w-4 h-4" />;
      case 'direct-messages': return <UserGroupIcon className="w-4 h-4" />;
      case 'mentions': return <AtSymbolIcon className="w-4 h-4" />;
      case 'starred': return <StarIcon className="w-4 h-4" />;
      case 'archived': return <ArchiveBoxIcon className="w-4 h-4" />;
      case 'settings': return <Cog6ToothIcon className="w-4 h-4" />;
      default: return <ChatBubbleLeftRightIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Standardized Header */}
      <StandardHeader
        title="Oasis"
        subtitle={
          <div className="flex items-center gap-2">
            {getSectionIcon()}
            <span className="text-sm text-[var(--muted)]">{getSectionTitle()}</span>
            {selectedChannel && (
              <>
                <span className="text-[var(--muted)]">/</span>
                <span className="text-sm text-gray-700">#{selectedChannel.name}</span>
              </>
            )}
          </div>
        }
        stats={[
          { label: "Channels", value: communicationStats.channels },
          { label: "Messages", value: communicationStats.messages },
          { label: "Unread", value: communicationStats.unread }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--panel-background)] transition-colors">
              <PlusIcon className="w-4 h-4" />
              New Channel
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              Start Chat
            </button>
          </div>
        }
      />

      {/* Sub-header with Search and Controls */}
      <div className="flex items-center gap-4 py-2 w-full bg-[var(--background)] px-6">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-4 pr-10 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors w-full bg-[var(--background)]"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="relative min-w-32">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="relative w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-left text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors flex items-center gap-2"
          >
            <FunnelIcon className="w-4 h-4 text-[var(--muted)]" />
            <span className="block truncate text-[var(--foreground)]">Filter</span>
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="relative min-w-32">
          <button
            type="button"
            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
            className="relative w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-left text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors flex items-center gap-2"
          >
            <ArrowsUpDownIcon className="w-4 h-4 text-[var(--muted)]" />
            <span className="block truncate text-[var(--foreground)]">Sort</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <OasisChatPanel />
      </div>
    </div>
  );
}
