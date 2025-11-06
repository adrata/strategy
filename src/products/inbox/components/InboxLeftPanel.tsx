"use client";

/**
 * Inbox Left Panel Component
 * 
 * Left navigation panel for Inbox application with email cards.
 * Similar structure to StacksLeftPanel with header, stats, and email cards.
 */

import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { useProfilePanel } from '@/platform/ui/components/ProfilePanelContext';
import { useInbox } from '../context/InboxProvider';
import { EmailCard } from './EmailCard';
import { EmailComposeModal } from './EmailComposeModal';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

export function InboxLeftPanel() {
  const { user: authUser } = useUnifiedAuth();
  const { ui } = useRevenueOS();
  const { isProfilePanelVisible, setIsProfilePanelVisible } = useProfilePanel();
  
  // Safely get inbox context - handle case where provider might not be available
  let inboxContext;
  try {
    inboxContext = useInbox();
  } catch (error) {
    console.error('Failed to get Inbox context:', error);
    // Return loading state if context not available
    return (
      <div className="w-full h-full bg-background text-foreground border-r border-border flex flex-col">
        <div className="flex-shrink-0 pt-0 pr-2 pl-2">
          <div className="mx-2 mt-4 mb-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-background border border-border overflow-hidden">
                <span className="text-lg font-bold text-black">I</span>
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-foreground">Inbox</h2>
                <p className="text-xs text-muted">Email Management</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto invisible-scrollbar px-2">
          <div className="text-center py-8 text-muted text-sm">Loading...</div>
        </div>
      </div>
    );
  }
  
  const { 
    emails, 
    selectedEmail, 
    stats,
    loading, 
    refreshing,
    selectEmail,
    refreshEmails
  } = inboxContext;
  
  // State for user profile data
  const [userProfile, setUserProfile] = useState<{ firstName?: string; lastName?: string; email?: string } | null>(null);
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);

  // Get workspace slug from pathname
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const workspaceSlug = pathname.split('/').filter(Boolean)[0];

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!authUser?.id) return;
      
      try {
        const response = await fetch('/api/settings/user', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.settings) {
            setUserProfile({
              firstName: data.settings.firstName,
              lastName: data.settings.lastName,
              email: data.user?.email
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };
    
    fetchUserProfile();
  }, [authUser?.id]);

  const handleProfileClick = () => {
    setIsProfilePanelVisible(!isProfilePanelVisible);
  };

  return (
    <div className="w-full h-full bg-background text-foreground border-r border-border flex flex-col">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 pt-0 pr-2 pl-2">
        {/* Header */}
        <div className="mx-2 mt-4 mb-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-background border border-border overflow-hidden">
              <span className="text-lg font-bold text-black">I</span>
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-foreground">Inbox</h2>
              <p className="text-xs text-muted">Email Management</p>
            </div>
          </div>
        </div>

        {/* Stats Box */}
        <div className="mx-2 mb-4 p-3 bg-hover rounded-lg border border-border">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-muted">Total</span>
              <span className="text-xs font-semibold text-black">
                {loading ? '...' : stats.total}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-muted">Unread</span>
              <span className="text-xs font-semibold text-black">
                {loading ? '...' : stats.unread}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-muted">Urgent</span>
              <span className="text-xs font-semibold text-black">
                {loading ? '...' : stats.urgent}
              </span>
            </div>
          </div>
        </div>

        {/* Compose Button */}
        <div className="mx-2 mb-4">
          <button
            onClick={() => setIsComposeModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
          >
            <PencilSquareIcon className="w-4 h-4" />
            <span>Compose</span>
          </button>
        </div>
      </div>

      {/* Scrollable Email Cards Section */}
      <div className="flex-1 overflow-y-auto invisible-scrollbar px-2">
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-3 rounded-lg bg-loading-bg animate-pulse">
                <div className="h-4 bg-loading-bg rounded mb-2" />
                <div className="h-3 bg-loading-bg rounded mb-1" />
                <div className="h-3 bg-loading-bg rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : emails.length === 0 ? (
          <div className="text-center py-8 text-muted text-sm">
            No emails found
          </div>
        ) : (
          <div className="space-y-2">
            {emails.map((email, index) => (
              <EmailCard
                key={email.id}
                email={email}
                isSelected={selectedEmail?.id === email.id}
                onClick={() => selectEmail(email)}
                rank={index + 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fixed Bottom Section - Profile Button */}
      <div className="flex-shrink-0 p-2" style={{ paddingBottom: '15px' }}>
        <button
          onClick={handleProfileClick}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-hover transition-colors"
          title="Profile"
        >
          <div className="w-8 h-8 bg-loading-bg rounded-xl flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">
              {(userProfile?.firstName?.charAt(0) || authUser?.name?.charAt(0) || 'U').toUpperCase()}
            </span>
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-foreground">
              {userProfile?.firstName && userProfile?.lastName && userProfile.firstName.trim() && userProfile.lastName.trim()
                ? `${userProfile.firstName.charAt(0).toUpperCase() + userProfile.firstName.slice(1)} ${userProfile.lastName.charAt(0).toUpperCase() + userProfile.lastName.slice(1)}` 
                : authUser?.name ? authUser.name.charAt(0).toUpperCase() + authUser.name.slice(1) : 'User'}
            </div>
            <div className="text-xs text-muted">
              {(() => {
                const workspaceName = ui.activeWorkspace?.name || workspaceSlug || 'Workspace';
                return workspaceName.charAt(0).toUpperCase() + workspaceName.slice(1);
              })()}
            </div>
          </div>
        </button>
      </div>

      {/* Email Compose Modal */}
      <EmailComposeModal
        isOpen={isComposeModalOpen}
        onClose={() => setIsComposeModalOpen(false)}
        userEmail={userProfile?.email}
        onSendSuccess={() => {
          // Refresh emails after successful send
          if (inboxContext?.refreshEmails) {
            inboxContext.refreshEmails();
          }
        }}
      />
    </div>
  );
}

