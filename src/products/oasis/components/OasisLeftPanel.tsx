"use client";

/**
 * Oasis Left Panel Component
 * 
 * Slack-like left navigation panel for Oasis communication hub.
 * Shows conversations, channels, DMs, and external company chats.
 */

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUnifiedAuth } from "@/platform/auth";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { useOasis } from '@/app/[workspace]/(pipeline)/layout';
import { useOasisChannels } from '@/products/oasis/hooks/useOasisChannels';
import { useOasisDMs } from '@/products/oasis/hooks/useOasisDMs';
import { useOasisPresence } from '@/products/oasis/hooks/useOasisPresence';
import { AddChannelModal } from '@/products/oasis/components/AddChannelModal';
import { AddDMModal } from '@/products/oasis/components/AddDMModal';
import { useProfilePanel } from '@/platform/ui/components/ProfilePanelContext';
import { saveLastConversation } from '@/products/oasis/utils/conversation-persistence';
import { 
  HashtagIcon, 
  UserGroupIcon, 
  AtSymbolIcon, 
  StarIcon, 
  ArchiveBoxIcon, 
  Cog6ToothIcon,
  PlusIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

interface Conversation {
  id: string;
  name: string;
  type: 'channel' | 'dm' | 'external';
  unread: number;
  isActive: boolean;
  isMuted?: boolean;
  isStarred?: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
  company?: string;
  participants?: number;
  status?: 'online' | 'away' | 'offline';
  isWorkspaceMember?: boolean;
}

// Mock data will be replaced with real data from hooks

// No navigation items - just channels and DMs

export function OasisLeftPanel() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const { data: acquisitionData } = useAcquisitionOS();
  
  // Add error boundary for context usage
  let oasisContext;
  try {
    oasisContext = useOasis();
  } catch (error) {
    console.error('Failed to get Oasis context:', error);
    return (
      <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
        <div className="p-4 text-center">
          <div className="text-sm text-red-500">Error loading Oasis context</div>
        </div>
      </div>
    );
  }
  
  const { selectedChannel, setSelectedChannel } = oasisContext;
  const { setIsProfilePanelVisible } = useProfilePanel();
  const params = useParams();
  
  // Get workspace ID from auth user or acquisition data
  const workspaceId = authUser?.activeWorkspaceId || acquisitionData?.auth?.authUser?.activeWorkspaceId || '';
  
  console.log('🔍 [OASIS LEFT PANEL] Auth user:', authUser);
  console.log('🔍 [OASIS LEFT PANEL] Acquisition data:', acquisitionData?.auth?.authUser);
  console.log('🔍 [OASIS LEFT PANEL] URL params:', params);
  console.log('🔍 [OASIS LEFT PANEL] Workspace ID:', workspaceId);
  
  // Real data hooks
  const { channels, loading: channelsLoading, createChannel } = useOasisChannels(workspaceId);
  const { dms, loading: dmsLoading, createDM } = useOasisDMs(workspaceId);
  const { userCount, isConnected } = useOasisPresence(workspaceId);
  
  // State for creating new channels/DMs
  const [showAddChannelModal, setShowAddChannelModal] = useState(false);
  const [showAddDMModal, setShowAddDMModal] = useState(false);

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedChannel(conversation);
    
    // Navigate to the conversation with human-readable URLs
    const currentPath = window.location.pathname;
    const segments = currentPath.split('/').filter(Boolean);
    const workspaceSlug = segments[0];
    
    // Generate URL-friendly slug from name
    const generateSlug = (name: string) => {
      return name.toLowerCase().replace(/\s+/g, '-');
    };
    
    // Save last conversation to localStorage
    if (workspaceId) {
      saveLastConversation(
        workspaceId,
        conversation.id,
        conversation.type as 'channel' | 'dm' | 'external',
        conversation.name
      );
    }
    
    if (conversation.type === 'channel') {
      // Format: general-abc123
      const slug = `${generateSlug(conversation.name)}-${conversation.id}`;
      router.push(`/${workspaceSlug}/oasis/${slug}`);
    } else if (conversation.type === 'dm') {
      // Format: dan-mirolli-xyz789
      const slug = `${generateSlug(conversation.name)}-${conversation.id}`;
      router.push(`/${workspaceSlug}/oasis/${slug}`);
    } else if (conversation.type === 'external') {
      // Format: ryan-hoffman-abc123
      const slug = `${generateSlug(conversation.name)}-${conversation.id}`;
      router.push(`/${workspaceSlug}/oasis/${slug}`);
    }
  };

  const handleAddChannel = () => {
    setShowAddChannelModal(true);
  };

  const handleChannelConfirm = async (name: string, description?: string) => {
    try {
      const newChannel = await createChannel(name, description);
      console.log('Channel created:', newChannel);
    } catch (error) {
      console.error('Failed to create channel:', error);
      alert('Failed to create channel. Please try again.');
    }
  };

  const handleAddDM = () => {
    setShowAddDMModal(true);
  };

  const handleDMConfirm = async (userIds: string[]) => {
    try {
      const newDM = await createDM(userIds);
      console.log('DM created:', newDM);
    } catch (error) {
      console.error('Failed to create DM:', error);
      alert('Failed to create DM. Please try again.');
    }
  };

  const handleProfileClick = () => {
    setIsProfilePanelVisible(true);
  };

  // Convert real data to Conversation format
  const channelConversations: Conversation[] = channels.map(channel => ({
    id: channel.id,
    name: channel.name,
    type: 'channel' as const,
    unread: channel.recentMessageCount,
    isActive: selectedChannel?.id === channel.id,
    lastMessage: 'Channel created',
    lastMessageTime: 'now',
    isWorkspaceMember: true
  }));

  const dmConversations: Conversation[] = [
    // Add "Me" self-DM at the top
    {
      id: 'me-self-dm',
      name: 'Me',
      type: 'dm' as const,
      unread: 0,
      isActive: selectedChannel?.id === 'me-self-dm',
      lastMessage: 'Personal notes and thoughts',
      lastMessageTime: 'now',
      status: 'online' as const,
      isWorkspaceMember: true
    },
    // Add other DMs
    ...dms.map(dm => ({
      id: dm.id,
      name: dm.participants[0]?.name || 'Unknown User',
      type: 'dm' as const,
      unread: 0, // TODO: Calculate unread count
      isActive: selectedChannel?.id === dm.id,
      lastMessage: dm.lastMessage?.content || 'Started conversation',
      lastMessageTime: dm.lastMessage?.createdAt ? new Date(dm.lastMessage.createdAt).toLocaleTimeString() : 'now',
      status: 'online' as const,
      isWorkspaceMember: true
    }))
  ];

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
        <div className="p-4 text-center">
          <div className="text-sm text-[var(--muted)]">Loading Oasis...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white border border-[var(--border)] rounded-xl flex items-center justify-center">
            <span className="text-lg font-bold text-[var(--foreground)]">
              {(() => {
                // Get workspace from auth user
                const workspaceName = authUser?.workspaces?.find(w => w['id'] === authUser?.activeWorkspaceId)?.name || "Adrata";
                // Special handling for specific companies
                if (workspaceName === "Notary Everyday") {
                  return "NE";
                }
                if (workspaceName === "Adrata") {
                  return "A";
                }
                // Default behavior for other workspaces - take first two letters
                return workspaceName.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2) || 'AD';
              })()}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">Oasis</h2>
            <p className="text-xs text-[var(--muted)]">Communication Hub</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto invisible-scrollbar">
        {/* Channels Section */}
        <div className="p-2">
          <div className="flex items-center justify-between px-2 py-1 mb-2">
            <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Channels</h3>
            <button 
              onClick={handleAddChannel}
              className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              title="Add Channel"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1">
            {channelsLoading ? (
              <div className="space-y-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex gap-2 px-2 py-1.5">
                    <div className="h-4 bg-[var(--loading-bg)] rounded w-4 animate-pulse"></div>
                    <div className="h-4 bg-[var(--loading-bg)] rounded flex-1 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : (
              channelConversations.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => handleConversationClick(channel)}
                  className={`w-full text-left px-2 py-1.5 rounded-md transition-colors flex items-center gap-2 ${
                    selectedChannel?.id === channel.id
                      ? 'bg-gray-100 text-gray-900'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <HashtagIcon className="w-3 h-3 text-[var(--muted)]" />
                  <span className="text-sm font-medium truncate">#{channel.name}</span>
                  {channel.unread > 0 && (
                    <span className="ml-auto px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded min-w-[1.25rem] text-center">
                      {channel.unread}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Direct Messages Section */}
        <div className="p-2 border-t border-[var(--border)]">
          <div className="flex items-center justify-between px-2 py-1 mb-2">
            <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Direct Messages</h3>
            <button 
              onClick={handleAddDM}
              className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              title="Add DM"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1">
            {dmsLoading ? (
              <div className="space-y-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-2 px-2 py-1.5">
                    <div className="h-4 bg-[var(--loading-bg)] rounded w-4 animate-pulse"></div>
                    <div className="h-4 bg-[var(--loading-bg)] rounded flex-1 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : (
              dmConversations.map((dm) => (
                <button
                  key={dm.id}
                  onClick={() => handleConversationClick(dm)}
                  className={`w-full text-left px-2 py-1.5 rounded-md transition-colors flex items-center gap-2 ${
                    selectedChannel?.id === dm.id
                      ? 'bg-gray-100 text-gray-900'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="relative">
                    <div className="w-4 h-4 bg-white border border-[var(--border)] rounded flex items-center justify-center">
                      <span className="text-xs font-medium text-[var(--foreground)]">
                        {dm.id === 'me-self-dm' ? (authUser?.name?.charAt(0) || 'M') : dm.name.charAt(0)}
                      </span>
                    </div>
                    {dm.status === 'online' && (
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-400 rounded-full border border-white"></div>
                    )}
                  </div>
                  <span className="text-sm font-medium truncate">{dm.name}</span>
                  {dm.unread > 0 && (
                    <span className="ml-auto px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded min-w-[1.25rem] text-center">
                      {dm.unread}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="flex-shrink-0 p-2 border-t border-[var(--border)]" style={{ paddingBottom: '15px' }}>
        <button
          onClick={handleProfileClick}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--hover)] transition-colors"
          title="Profile"
        >
          <div className="w-8 h-8 bg-white border border-[var(--border)] rounded-xl flex items-center justify-center">
            <span className="text-sm font-medium text-[var(--foreground)]">
              {authUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-[var(--foreground)]">
              {authUser?.name || 'User'}
            </div>
            <div className="text-xs text-[var(--muted)]">
              {acquisitionData?.auth?.authUser?.activeWorkspaceName || 'Workspace'}
            </div>
          </div>
        </button>
      </div>

      {/* Modals */}
      <AddChannelModal
        isOpen={showAddChannelModal}
        onClose={() => setShowAddChannelModal(false)}
        onConfirm={handleChannelConfirm}
      />
      
      <AddDMModal
        isOpen={showAddDMModal}
        onClose={() => setShowAddDMModal(false)}
        onConfirm={handleDMConfirm}
        workspaceId={workspaceId}
      />
    </div>
  );
}