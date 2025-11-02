"use client";

/**
 * Oasis Left Panel Component
 * 
 * Slack-like left navigation panel for Oasis communication hub.
 * Shows conversations, channels, DMs, and external company chats.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUnifiedAuth } from "@/platform/auth";
import { useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
import { useOasisLayout } from '@/app/[workspace]/(revenue-os)/layout';
import { useOasis } from '@/products/oasis/context/OasisProvider';
import { useOasisChannels } from '@/products/oasis/hooks/useOasisChannels';
import { useOasisDMs } from '@/products/oasis/hooks/useOasisDMs';
import { useOasisPresence } from '@/products/oasis/hooks/useOasisPresence';
import { useAutoCreateRossDMs } from '@/products/oasis/hooks/useAutoCreateRossDMs';
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
  workspaceName?: string; // Add workspace name for pill display
}

// Mock data will be replaced with real data from hooks

// No navigation items - just channels and DMs

export const OasisLeftPanel = React.memo(function OasisLeftPanel() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const { data: acquisitionData } = useRevenueOS();
  
  // Add error boundary for context usage
  let oasisContext;
  try {
    oasisContext = useOasis();
  } catch (error) {
    console.error('Failed to get Oasis context:', error);
    // Show skeleton loading state instead of error message
    return (
      <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
        {/* Header Skeleton */}
        <div className="flex-shrink-0 p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--loading-bg)] rounded-xl animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 bg-[var(--loading-bg)] rounded w-20 animate-pulse" />
              <div className="h-3 bg-[var(--loading-bg)] rounded w-32 animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          <div className="space-y-2">
            <div className="h-3 bg-[var(--loading-bg)] rounded w-16 animate-pulse mb-2" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-2 px-2 py-1.5">
                <div className="h-4 bg-[var(--loading-bg)] rounded w-4 animate-pulse" />
                <div className="h-4 bg-[var(--loading-bg)] rounded flex-1 animate-pulse" />
              </div>
            ))}
          </div>
          
          <div className="border-t border-[var(--border)] pt-2 space-y-2">
            <div className="h-3 bg-[var(--loading-bg)] rounded w-24 animate-pulse mb-2" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-2 px-2 py-1.5">
                <div className="w-6 h-6 bg-[var(--loading-bg)] rounded-full animate-pulse" />
                <div className="h-4 bg-[var(--loading-bg)] rounded flex-1 animate-pulse" />
              </div>
            ))}
          </div>
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
  const { autoCreateRossDMs } = useAutoCreateRossDMs();

  // Ref to track if initial channel selection has been made
  const hasInitialSelection = useRef(false);
  const hasAutoCreatedRossDMs = useRef(false);

  // Auto-create DMs with Ross when component loads (only once per workspace)
  useEffect(() => {
    if (workspaceId && !hasAutoCreatedRossDMs.current) {
      hasAutoCreatedRossDMs.current = true;
      console.log('🤖 [OASIS LEFT PANEL] Auto-creating Ross DMs for workspace:', workspaceId);
      autoCreateRossDMs(workspaceId)
        .then(result => {
          console.log('✅ [OASIS LEFT PANEL] Auto-creation completed:', result);
        })
        .catch(error => {
          console.error('❌ [OASIS LEFT PANEL] Failed to auto-create Ross DMs:', error);
        });
    }
  }, [workspaceId, autoCreateRossDMs]);

  // Auto-select channel when channels load and no channel is selected
  useEffect(() => {
    if (channels.length > 0 && !selectedChannel && !channelsLoading && !hasInitialSelection.current) {
      // Check if we're on a specific channel URL
      const currentPath = window.location.pathname;
      const pathSegments = currentPath.split('/');
      const oasisIndex = pathSegments.findIndex(segment => segment === 'oasis');
      
      if (oasisIndex !== -1 && pathSegments[oasisIndex + 1]) {
        // Extract conversation ID from URL (format: name-id)
        const conversationSlug = pathSegments[oasisIndex + 1];
        const lastHyphenIndex = conversationSlug.lastIndexOf('-');
        
        if (lastHyphenIndex > 0) {
          const conversationId = conversationSlug.substring(lastHyphenIndex + 1);
          const conversationName = conversationSlug.substring(0, lastHyphenIndex);
          
          // Find matching channel or DM
          const matchingChannel = channels.find(channel => channel.id === conversationId);
          const matchingDM = dms.find(dm => dm.id === conversationId);
          
          if (matchingChannel) {
            const conversation = {
              id: matchingChannel.id,
              name: matchingChannel.name,
              type: 'channel' as const,
              unread: matchingChannel.recentMessageCount,
              isActive: true,
              lastMessage: 'Channel created',
              lastMessageTime: 'now',
              isWorkspaceMember: true
            };
            setSelectedChannel(conversation);
            hasInitialSelection.current = true;
            return;
          } else if (matchingDM) {
            const conversation = {
              id: matchingDM.id,
              name: matchingDM.participants[0]?.name || 'Unknown User',
              type: 'dm' as const,
              unread: 0,
              isActive: true,
              lastMessage: matchingDM.lastMessage?.content || 'Started conversation',
              lastMessageTime: matchingDM.lastMessage?.createdAt ? new Date(matchingDM.lastMessage.createdAt).toLocaleTimeString() : 'now',
              status: 'online' as const,
              isWorkspaceMember: true
            };
            setSelectedChannel(conversation);
            hasInitialSelection.current = true;
            return;
          }
        }
      }
      
      // No URL match or no specific conversation, select #general or first channel
      const generalChannel = channels.find(channel => channel.name === 'general');
      const targetChannel = generalChannel || channels[0];
      
      if (targetChannel) {
        const conversation = {
          id: targetChannel.id,
          name: targetChannel.name,
          type: 'channel' as const,
          unread: targetChannel.recentMessageCount,
          isActive: true,
          lastMessage: 'Channel created',
          lastMessageTime: 'now',
          isWorkspaceMember: true
        };
        setSelectedChannel(conversation);
        hasInitialSelection.current = true;
      }
    }
  }, [channels, dms, channelsLoading, setSelectedChannel]);
  
  // State for creating new channels/DMs
  const [showAddChannelModal, setShowAddChannelModal] = useState(false);
  const [showAddDMModal, setShowAddDMModal] = useState(false);

  const handleConversationClick = async (conversation: Conversation) => {
    setSelectedChannel(conversation);
    
    // Navigate to the conversation with human-readable URLs
    const currentPath = window.location.pathname;
    const segments = currentPath.split('/').filter(Boolean);
    const workspaceSlug = segments[0];
    
    // Generate URL-friendly slug from name
    const generateSlug = (name: string) => {
      return name.toLowerCase().replace(/\s+/g, '-');
    };
    
    // Handle "Me" self-DM - create or find existing self-DM
    if (conversation.id === 'me-self-dm' && workspaceId && authUser?.id) {
      try {
        // First check if self-DM already exists
        const response = await fetch(`/api/v1/oasis/oasis/dms?workspaceId=${workspaceId}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          // Look for self-DM (DM with no other participants - only the current user)
          const selfDM = data.dms?.find((dm: any) => dm.participants.length === 0);
          
          if (selfDM) {
            // Use existing self-DM
            const slug = `${generateSlug('me')}-${selfDM.id}`;
            router.push(`/${workspaceSlug}/oasis/${slug}`);
            return;
          }
        }
        
        // Create new self-DM if it doesn't exist
        const createResponse = await fetch('/api/v1/oasis/oasis/dms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            workspaceId: workspaceId,
            participantIds: [] // Empty array creates a self-DM
          })
        });
        
        if (createResponse.ok) {
          const newDM = await createResponse.json();
          const slug = `${generateSlug('me')}-${newDM.dm.id}`;
          router.push(`/${workspaceSlug}/oasis/${slug}`);
          return;
        }
      } catch (error) {
        console.error('Failed to handle self-DM:', error);
        // Fall through to regular navigation
      }
    }
    
    // Save last conversation to localStorage
    if (workspaceId && conversation.id !== 'me-self-dm') {
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
    } else if (conversation.type === 'dm' && conversation.id !== 'me-self-dm') {
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
    console.log('🔘 Profile clicked in OasisLeftPanel!');
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

  // Log channel conversion for debugging
  useEffect(() => {
    if (!channelsLoading) {
      if (channels.length > 0) {
        const channelNames = channels.map(c => `#${c.name}`).join(', ');
        console.log(`🔄 [OASIS LEFT PANEL] Converted ${channels.length} channels: ${channelNames}`);
      } else {
        console.log('⚠️ [OASIS LEFT PANEL] No channels available to display');
      }
    }
  }, [channels, channelsLoading]);

  // Get current workspace name for the "Me" pill - use authUser workspaces, not acquisitionData
  const currentWorkspaceName = authUser?.workspaces?.find(w => w['id'] === authUser?.activeWorkspaceId)?.name || 'Adrata';

  // Helper to get initials - prefer first letter of first name if name can be parsed
  const getInitial = (name: string | undefined) => {
    if (!name) return 'U';
    // Parse name to get first letter of first name
    const nameParts = name.trim().split(' ');
    if (nameParts.length > 0) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

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
      isWorkspaceMember: true,
      workspaceName: currentWorkspaceName // Add workspace name for pill display
    },
    // Add other DMs
    ...dms.map(dm => ({
      id: dm.id,
      name: (() => {
        const participantName = dm.participants[0]?.name || 'Unknown User';
        // Capitalize first letter of name (Ross -> Ross, not ross)
        return participantName.charAt(0).toUpperCase() + participantName.slice(1);
      })(),
      type: 'dm' as const,
      unread: dm.unreadCount || 0, // Use unread count from API
      isActive: selectedChannel?.id === dm.id,
      lastMessage: dm.lastMessage?.content || 'Started conversation',
      lastMessageTime: dm.lastMessage?.createdAt ? new Date(dm.lastMessage.createdAt).toLocaleTimeString() : 'now',
      status: 'online' as const,
      isWorkspaceMember: true,
      workspaceName: dm.participants[0]?.workspaceName // Add workspace name for pill display
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
            ) : channelConversations.length === 0 ? (
              <div className="px-2 py-2 text-xs text-[var(--muted)] text-center">
                No channels yet. Click + to create one.
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
                    <span className="ml-auto px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded-full min-w-[1.25rem] h-5 flex items-center justify-center">
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
                        {dm.id === 'me-self-dm' ? getInitial(authUser?.name) : getInitial(dm.name)}
                      </span>
                    </div>
                    {dm.status === 'online' && (
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium truncate">{dm.name}</span>
                    {dm.workspaceName && (() => {
                      // Check if this is a different workspace from current
                      const currentWorkspace = authUser?.workspaces?.find(w => w['id'] === authUser?.activeWorkspaceId);
                      const isDifferentWorkspace = currentWorkspace && dm.workspaceName !== currentWorkspace.name;
                      
                      // Use different color for different workspace (purple/gray) vs same workspace (blue)
                      const pillClass = isDifferentWorkspace 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700';
                      
                      return (
                        <span className={`px-1.5 py-0.5 ${pillClass} text-xs font-medium rounded-full whitespace-nowrap flex items-center gap-1`}>
                          <BuildingOfficeIcon className="w-3 h-3" />
                          {dm.workspaceName === "Notary Everyday" ? "NE" : dm.workspaceName === "Adrata" ? "A" : dm.workspaceName}
                        </span>
                      );
                    })()}
                  </div>
                  {dm.unread > 0 && (
                    <span className="ml-auto px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded-full min-w-[1.25rem] h-5 flex items-center justify-center">
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
              {getInitial(authUser?.name)}
            </span>
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-[var(--foreground)]">
              {authUser?.name || 'User'}
            </div>
            <div className="text-xs text-[var(--muted)]">
              {authUser?.workspaces?.find(w => w['id'] === authUser?.activeWorkspaceId)?.name || 'Adrata'}
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
});