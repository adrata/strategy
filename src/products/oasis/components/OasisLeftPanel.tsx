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
  BuildingOfficeIcon,
  LockClosedIcon
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
  workspaceId?: string; // Add workspace ID for message fetching (for cross-workspace DMs)
  isPrivate?: boolean; // Channel visibility
}

// Mock data will be replaced with real data from hooks

// No navigation items - just channels and DMs

export const OasisLeftPanel = React.memo(function OasisLeftPanel() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const { data: acquisitionData } = useRevenueOS();
  
  // CRITICAL FIX: All hooks must be called unconditionally at the top level
  // Never wrap hooks in try-catch or conditionals
  const oasisContext = useOasis();
  const layoutContext = useOasisLayout();
  const { setIsProfilePanelVisible } = useProfilePanel();
  const params = useParams();
  
  // Extract values from contexts (these may be null/undefined if context isn't ready)
  const selectedChannel = layoutContext?.selectedChannel || null;
  const setSelectedChannel = layoutContext?.setSelectedChannel || (() => {});
  
  // Unified loading state - check auth first
  const isLoading = authLoading;
  
  if (isLoading) {
    return (
      <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-background text-foreground border-r border-border flex flex-col h-full">
        {/* Header Skeleton */}
        <div className="flex-shrink-0 p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-loading-bg rounded-xl animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 bg-loading-bg rounded w-20 animate-pulse" />
              <div className="h-3 bg-loading-bg rounded w-32 animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          <div className="space-y-2">
            <div className="h-3 bg-loading-bg rounded w-16 animate-pulse mb-2" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-2 px-2 py-1.5">
                <div className="h-4 bg-loading-bg rounded w-4 animate-pulse" />
                <div className="h-4 bg-loading-bg rounded flex-1 animate-pulse" />
              </div>
            ))}
          </div>
          
          <div className="border-t border-border pt-2 space-y-2">
            <div className="h-3 bg-loading-bg rounded w-24 animate-pulse mb-2" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-2 px-2 py-1.5">
                <div className="w-6 h-6 bg-loading-bg rounded-full animate-pulse" />
                <div className="h-4 bg-loading-bg rounded flex-1 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Get workspace ID from auth user or acquisition data
  const workspaceId = authUser?.activeWorkspaceId || acquisitionData?.auth?.authUser?.activeWorkspaceId || '';
  
  console.log('🔍 [OASIS LEFT PANEL] Auth user:', authUser);
  console.log('🔍 [OASIS LEFT PANEL] Acquisition data:', acquisitionData?.auth?.authUser);
  console.log('🔍 [OASIS LEFT PANEL] URL params:', params);
  console.log('🔍 [OASIS LEFT PANEL] Workspace ID:', workspaceId);
  
  // CRITICAL FIX: Validate workspaceId before calling hooks
  // If workspaceId is empty, hooks will fail or return empty data
  const safeWorkspaceId = workspaceId && workspaceId !== 'default' && workspaceId.trim() !== '' ? workspaceId : '';
  
  // Real data hooks - only call if we have a valid workspaceId and not loading
  // Unified loading check prevents duplicate skeleton rendering
  // CRITICAL: All hooks must be called before any conditional returns
  const { channels, loading: channelsLoading, createChannel } = useOasisChannels(safeWorkspaceId);
  const { dms, loading: dmsLoading, error: dmsError, createDM } = useOasisDMs(safeWorkspaceId);
  const { userCount, isConnected } = useOasisPresence(safeWorkspaceId);
  const { autoCreateRossDMs } = useAutoCreateRossDMs();
  
  // Combined loading state - if any data is loading, show skeleton
  // This prevents showing skeleton then immediately showing real content
  const isDataLoading = channelsLoading || dmsLoading;
  
  // If data is still loading after context is ready, show skeleton
  if (isDataLoading && !isLoading) {
    return (
      <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-background text-foreground border-r border-border flex flex-col h-full">
        {/* Header Skeleton */}
        <div className="flex-shrink-0 p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-loading-bg rounded-xl animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 bg-loading-bg rounded w-20 animate-pulse" />
              <div className="h-3 bg-loading-bg rounded w-32 animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          <div className="space-y-2">
            <div className="h-3 bg-loading-bg rounded w-16 animate-pulse mb-2" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-2 px-2 py-1.5">
                <div className="h-4 bg-loading-bg rounded w-4 animate-pulse" />
                <div className="h-4 bg-loading-bg rounded flex-1 animate-pulse" />
              </div>
            ))}
          </div>
          
          <div className="border-t border-border pt-2 space-y-2">
            <div className="h-3 bg-loading-bg rounded w-24 animate-pulse mb-2" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-2 px-2 py-1.5">
                <div className="w-6 h-6 bg-loading-bg rounded-full animate-pulse" />
                <div className="h-4 bg-loading-bg rounded flex-1 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Ref to track if initial channel selection has been made
  const hasInitialSelection = useRef(false);
  const hasAutoCreatedRossDMs = useRef(false);

  // Auto-create DMs with Ross when component loads (only once per workspace)
  useEffect(() => {
    if (safeWorkspaceId && !hasAutoCreatedRossDMs.current) {
      hasAutoCreatedRossDMs.current = true;
      console.log('🤖 [OASIS LEFT PANEL] Auto-creating Ross DMs for workspace:', safeWorkspaceId);
      autoCreateRossDMs(safeWorkspaceId)
        .then(result => {
          console.log('✅ [OASIS LEFT PANEL] Auto-creation completed:', result);
        })
        .catch(error => {
          console.error('❌ [OASIS LEFT PANEL] Failed to auto-create Ross DMs:', error);
        });
    }
  }, [safeWorkspaceId, autoCreateRossDMs]);

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
            const participant = matchingDM.participants[0];
            const getDisplayName = () => {
              if (participant?.name && participant.name.trim()) return participant.name;
              if (participant?.username && participant.username.trim()) return participant.username;
              if (participant?.email) {
                const emailPrefix = participant.email.split('@')[0];
                if (emailPrefix) return emailPrefix;
              }
              return '';
            };
            
            const conversation = {
              id: matchingDM.id,
              name: getDisplayName(),
              type: 'dm' as const,
              unread: matchingDM.unreadCount || 0,
              isActive: true,
              lastMessage: matchingDM.lastMessage?.content || 'Started conversation',
              lastMessageTime: matchingDM.lastMessage?.createdAt ? new Date(matchingDM.lastMessage.createdAt).toLocaleTimeString() : 'now',
              status: 'online' as const,
              isWorkspaceMember: true,
              workspaceName: participant?.workspaceName, // Add workspace name for pill display
              workspaceId: matchingDM.workspaceId // Add workspace ID for message fetching (for cross-workspace DMs)
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
    if (conversation.id === 'me-self-dm' && safeWorkspaceId && authUser?.id) {
      try {
        // First check if self-DM already exists
        const response = await fetch(`/api/v1/oasis/oasis/dms?workspaceId=${safeWorkspaceId}`, {
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
            workspaceId: safeWorkspaceId,
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
    if (safeWorkspaceId && conversation.id !== 'me-self-dm') {
      saveLastConversation(
        safeWorkspaceId,
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

  const handleChannelConfirm = async (name: string, description?: string, isPrivate?: boolean) => {
    try {
      const newChannel = await createChannel(name, description, isPrivate);
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
    isWorkspaceMember: true,
    isPrivate: channel.isPrivate === true
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
  const getInitial = (name: string | undefined | null) => {
    if (!name || !name.trim()) return '?';
    // Parse name to get first letter of first name
    const nameParts = name.trim().split(' ');
    if (nameParts.length > 0 && nameParts[0].length > 0) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    if (name.trim().length > 0) {
      return name.trim().charAt(0).toUpperCase();
    }
    return '?';
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
    // Add other DMs - filter out DMs with no valid participant data
    ...dms
      .filter(dm => {
        // Only include DMs that have at least one participant with valid data
        const participant = dm.participants[0];
        return participant && (participant.name || participant.username || participant.email);
      })
      .map(dm => {
      // Get the first participant (excluding current user)
      const participant = dm.participants[0];
      
      // Get display name with fallback: name -> username -> email prefix (never fallback to "User")
      const getDisplayName = () => {
        if (participant?.name && participant.name.trim()) {
          return participant.name.charAt(0).toUpperCase() + participant.name.slice(1);
        }
        if (participant?.username && participant.username.trim()) {
          return participant.username.charAt(0).toUpperCase() + participant.username.slice(1);
        }
        // Extract email prefix as last fallback
        if (participant?.email) {
          const emailPrefix = participant.email.split('@')[0];
          if (emailPrefix && emailPrefix.trim()) {
            return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
          }
        }
        // If we truly have no data, return a placeholder (should not reach here due to filter above)
        return 'Unknown';
      };
      
      return {
      id: dm.id,
      name: getDisplayName(),
      type: 'dm' as const,
      unread: dm.unreadCount || 0, // Use unread count from API
      isActive: selectedChannel?.id === dm.id,
      lastMessage: dm.lastMessage?.content || 'Started conversation',
      lastMessageTime: dm.lastMessage?.createdAt ? new Date(dm.lastMessage.createdAt).toLocaleTimeString() : 'now',
      status: 'online' as const,
      isWorkspaceMember: true,
      workspaceName: participant?.workspaceName, // Add workspace name for pill display
      workspaceId: dm.workspaceId // Add workspace ID for message fetching (for cross-workspace DMs)
      };
    })
  ];

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-background text-foreground border-r border-border flex flex-col h-full">
        <div className="p-4 text-center">
          <div className="text-sm text-muted">Loading Oasis...</div>
        </div>
      </div>
    );
  }
  
  // CRITICAL FIX: Show error state if workspaceId is missing after auth loads
  if (!safeWorkspaceId && !authLoading) {
    console.warn('⚠️ [OASIS LEFT PANEL] No workspace ID available:', {
      authUser: !!authUser,
      authUserActiveWorkspaceId: authUser?.activeWorkspaceId,
      acquisitionDataExists: !!acquisitionData,
      acquisitionDataActiveWorkspaceId: acquisitionData?.auth?.authUser?.activeWorkspaceId
    });
    return (
      <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-background text-foreground border-r border-border flex flex-col h-full">
        <div className="p-4 text-center">
          <div className="text-sm text-red-500">Invalid workspace</div>
          <div className="text-xs text-muted mt-1">Please refresh the page</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-background text-foreground border-r border-border flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-background border border-border rounded-xl flex items-center justify-center">
            <span className="text-lg font-bold text-foreground">
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
            <h2 className="text-lg font-bold text-foreground">Oasis</h2>
            <p className="text-xs text-muted">Communication Hub</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto invisible-scrollbar">
        {/* Channels Section */}
        <div className="p-2">
          <div className="flex items-center justify-between px-2 py-1 mb-2">
            <h3 className="text-xs font-medium text-muted uppercase tracking-wide">Channels</h3>
            <button 
              onClick={handleAddChannel}
              className="text-muted hover:text-foreground transition-colors"
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
                    <div className="h-4 bg-loading-bg rounded w-4 animate-pulse"></div>
                    <div className="h-4 bg-loading-bg rounded flex-1 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : channelConversations.length === 0 ? (
              <div className="px-2 py-2 text-xs text-muted text-center">
                No channels yet. Click + to create one.
              </div>
            ) : (
              channelConversations.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => handleConversationClick(channel)}
                  className={`w-full text-left px-2 py-1.5 rounded-md transition-colors flex items-center gap-2 ${
                    selectedChannel?.id === channel.id
                      ? 'bg-hover text-foreground'
                      : 'hover:bg-hover text-foreground'
                  }`}
                >
                  <HashtagIcon className="w-3 h-3 text-muted" />
                  <span className="text-sm font-medium truncate">#{channel.name}</span>
                    {channel.isPrivate === true && (
                     <LockClosedIcon className="w-3 h-3 text-muted" />
                    )}
                    {channel.unread > 0 && !channel.isActive && (
                    <span className="ml-auto px-2 py-1 bg-muted-light text-foreground text-xs font-medium rounded-full min-w-[1.25rem] h-5 flex items-center justify-center">
                      {channel.unread}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Direct Messages Section */}
        <div className="p-2 border-t border-border">
          <div className="flex items-center justify-between px-2 py-1 mb-2">
            <h3 className="text-xs font-medium text-muted uppercase tracking-wide">Direct Messages</h3>
            {!dmsError && (
              <button 
                onClick={handleAddDM}
                className="text-muted hover:text-foreground transition-colors"
                title="Add DM"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="space-y-1">
            {dmsError ? (
              <div className="px-2 py-3 text-xs text-muted text-center border border-border rounded-md bg-background/50">
                <div className="text-red-500 font-medium mb-1">Database Migration Required</div>
                <div className="text-muted">Please contact support to resolve this issue.</div>
              </div>
            ) : dmsLoading ? (
              <div className="space-y-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-2 px-2 py-1.5">
                    <div className="h-4 bg-loading-bg rounded w-4 animate-pulse"></div>
                    <div className="h-4 bg-loading-bg rounded flex-1 animate-pulse"></div>
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
                      ? 'bg-hover text-foreground'
                      : 'hover:bg-hover text-foreground'
                  }`}
                >
                  <div className="relative">
                    <div className="w-4 h-4 bg-background border border-border rounded flex items-center justify-center">
                      <span className="text-xs font-medium text-foreground">
                        {dm.id === 'me-self-dm' ? getInitial(authUser?.name) : getInitial(dm.name)}
                      </span>
                    </div>
                    {dm.status === 'online' && (
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-success rounded-full border border-border"></div>
                    )}
                  </div>
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium truncate">{dm.name}</span>
                    {dm.workspaceName && (() => {
                      // Check if this is a different workspace from current
                      const currentWorkspace = authUser?.workspaces?.find(w => w['id'] === authUser?.activeWorkspaceId);
                      const isDifferentWorkspace = currentWorkspace && dm.workspaceName !== currentWorkspace.name;
                      
                      // Improved styling: lighter colors for better visibility
                      // Same workspace: subtle blue tint
                      // Different workspace: soft purple/gray tint
                      const pillClass = isDifferentWorkspace 
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700' 
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700';
                      
                      return (
                        <span className={`px-2 py-0.5 ${pillClass} text-xs font-medium rounded-md whitespace-nowrap flex items-center gap-1`}>
                          <BuildingOfficeIcon className="w-3 h-3" />
                          {dm.workspaceName === "Notary Everyday" ? "NE" : dm.workspaceName === "Adrata" ? "Adrata" : dm.workspaceName}
                        </span>
                      );
                    })()}
                  </div>
                  {dm.unread > 0 && (
                    <span className="ml-auto w-5 h-5 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full flex items-center justify-center">
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
      <div className="flex-shrink-0 p-2 border-t border-border" style={{ paddingBottom: '15px' }}>
        <button
          onClick={handleProfileClick}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-hover transition-colors"
          title="Profile"
        >
          <div className="w-8 h-8 bg-background border border-border rounded-xl flex items-center justify-center">
            <span className="text-sm font-medium text-foreground">
              {getInitial(authUser?.name)}
            </span>
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-foreground">
              {authUser?.name || 'User'}
            </div>
            <div className="text-xs text-muted">
              {authUser?.email === 'ross@adrata.com' 
                ? 'Adrata' 
                : authUser?.workspaces?.find(w => w['id'] === authUser?.activeWorkspaceId)?.name || 'Adrata'}
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
        workspaceId={safeWorkspaceId}
      />
    </div>
  );
});