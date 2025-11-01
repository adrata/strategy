"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useWorkshop } from "../layout";
import { useUnifiedAuth } from "@/platform/auth";
import { useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
import { useProfilePanel } from "@/platform/ui/components/ProfilePanelContext";
import { 
  DocumentTextIcon,
  ClockIcon,
  PlusIcon,
  CloudArrowUpIcon,
} from "@heroicons/react/24/outline";

export function WorkshopLeftPanel() {
  const {
    activeTab,
    setActiveTab,
    setIsUploadModalOpen,
    setIsCreateModalOpen,
  } = useWorkshop();

  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const { ui } = useRevenueOS();
  const pathname = usePathname();
  const { setIsProfilePanelVisible } = useProfilePanel();
  
  // State for user profile data
  const [userProfile, setUserProfile] = useState<{ firstName?: string; lastName?: string } | null>(null);
  
  // Get workspace slug from pathname
  const workspaceSlug = pathname.split('/')[1];

  // Fetch user profile data with firstName and lastName
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
              lastName: data.settings.lastName
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
    setIsProfilePanelVisible(true);
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
        <div className="p-4 text-center">
          <div className="text-sm text-[var(--muted)]">Loading Workshop...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 pt-4">
        {/* My Documents */}
        <button
          onClick={() => setActiveTab('my-documents')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            activeTab === 'my-documents'
              ? 'bg-[var(--hover)] text-[var(--foreground)]'
              : 'hover:bg-[var(--panel-background)] text-[var(--foreground)]'
          }`}
        >
          <DocumentTextIcon className="w-4 h-4" />
          <span className="text-sm font-medium">My Documents</span>
        </button>

        {/* Recent */}
        <button
          onClick={() => setActiveTab('recent')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            activeTab === 'recent'
              ? 'bg-[var(--hover)] text-[var(--foreground)]'
              : 'hover:bg-[var(--panel-background)] text-[var(--foreground)]'
          }`}
        >
          <ClockIcon className="w-4 h-4" />
          <span className="text-sm font-medium">Recent</span>
        </button>

        {/* Quick Actions */}
        <div className="pt-4 space-y-1">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="text-sm font-medium">New Document</span>
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--panel-background)] text-[var(--foreground)] transition-colors border border-[var(--border)]"
          >
            <CloudArrowUpIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Upload</span>
          </button>
        </div>
      </div>

      {/* Fixed Bottom Section - Profile Button */}
      <div className="flex-shrink-0 p-2" style={{ paddingBottom: '15px' }}>
        <button
          onClick={handleProfileClick}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--hover)] transition-colors"
          title="Profile"
        >
          <div className="w-8 h-8 bg-[var(--loading-bg)] rounded-xl flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">
              {(userProfile?.firstName?.charAt(0) || authUser?.name?.charAt(0) || 'U').toUpperCase()}
            </span>
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-[var(--foreground)]">
              {userProfile?.firstName && userProfile?.lastName && userProfile.firstName.trim() && userProfile.lastName.trim()
                ? `${userProfile.firstName.charAt(0).toUpperCase() + userProfile.firstName.slice(1)} ${userProfile.lastName.charAt(0).toUpperCase() + userProfile.lastName.slice(1)}` 
                : authUser?.name ? authUser.name.charAt(0).toUpperCase() + authUser.name.slice(1) : 'User'}
            </div>
            <div className="text-xs text-[var(--muted)]">
              {(() => {
                const workspaceName = ui.activeWorkspace?.name || workspaceSlug || 'Workspace';
                return workspaceName.charAt(0).toUpperCase() + workspaceName.slice(1);
              })()}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
