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
  
  // State for stats
  const [stats, setStats] = useState<{
    totalDocuments: number;
    totalFolders: number;
    myDocuments: number;
  } | null>(null);
  
  // Get workspace slug from pathname
  const workspaceSlug = pathname.split('/')[1];
  const workspaceId = ui.activeWorkspace?.id || authUser?.activeWorkspaceId;

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

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!workspaceId || !authUser?.id) return;
      
      try {
        // Fetch total documents count
        const docsResponse = await fetch(`/api/v1/documents/documents?workspaceId=${workspaceId}&limit=1&status=active`);
        const docsData = await docsResponse.json();
        const totalDocuments = docsData?.pagination?.total || 0;
        
        // Fetch my documents count
        const myDocsResponse = await fetch(`/api/v1/documents/documents?workspaceId=${workspaceId}&ownerId=${authUser.id}&limit=1&status=active`);
        const myDocsData = await myDocsResponse.json();
        const myDocuments = myDocsData?.pagination?.total || 0;
        
        // Fetch folders count
        const foldersResponse = await fetch(`/api/v1/documents/folders?workspaceId=${workspaceId}`);
        const foldersData = await foldersResponse.json();
        const totalFolders = Array.isArray(foldersData) ? foldersData.length : 0;
        
        setStats({
          totalDocuments,
          totalFolders,
          myDocuments
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Set default stats on error
        setStats({
          totalDocuments: 0,
          totalFolders: 0,
          myDocuments: 0
        });
      }
    };
    
    fetchStats();
  }, [workspaceId, authUser?.id]);

  const handleProfileClick = () => {
    setIsProfilePanelVisible(true);
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
        <div className="p-4 text-center">
          <div className="text-sm text-[var(--muted)]">Loading Workbench...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 pt-0 pr-2 pl-2">
        {/* Header */}
        <div className="mx-2 mt-4 mb-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--background)] border border-[var(--border)] overflow-hidden" style={{ filter: 'none' }}>
              <DocumentTextIcon className="w-5 h-5 text-[var(--foreground)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)]">Workbench</h2>
              <p className="text-xs text-[var(--muted)]">Documents</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
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
            <span className="text-sm font-medium">New</span>
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
