"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useWorkbench } from "../layout";
import { useUnifiedAuth } from "@/platform/auth";
import { useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
import { useProfilePanel } from "@/platform/ui/components/ProfilePanelContext";
import { apiFetch } from "@/platform/api-fetch";
import { DocumentExplorer } from "./DocumentExplorer";

export function WorkbenchLeftPanel() {
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const { ui } = useRevenueOS();
  const pathname = usePathname();
  const { isProfilePanelVisible, setIsProfilePanelVisible } = useProfilePanel();
  
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
        const docsData = await apiFetch<{
          documents?: any[];
          pagination?: { total: number };
        }>(`/api/v1/documents/documents?workspaceId=${workspaceId}&limit=1&status=active`, {}, {
          documents: [],
          pagination: { total: 0 }
        });
        const totalDocuments = docsData?.pagination?.total || 0;
        
        // Fetch my documents count
        const myDocsData = await apiFetch<{
          documents?: any[];
          pagination?: { total: number };
        }>(`/api/v1/documents/documents?workspaceId=${workspaceId}&ownerId=${authUser.id}&limit=1&status=active`, {}, {
          documents: [],
          pagination: { total: 0 }
        });
        const myDocuments = myDocsData?.pagination?.total || 0;
        
        // Fetch folders count
        const foldersData = await apiFetch<any[]>(`/api/v1/documents/folders?workspaceId=${workspaceId}`, {}, []);
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
    // If ProfilePanel is already open, toggle the left panel instead
    if (isProfilePanelVisible) {
      ui.toggleLeftPanel();
    } else {
      setIsProfilePanelVisible(true);
    }
  };

  // Show skeleton while auth is loading or stats are loading
  const isLoading = authLoading || (stats === null && workspaceId && authUser?.id);

  if (isLoading) {
    return (
      <aside className="w-full h-full bg-background text-foreground border-r border-border flex flex-col">
        {/* Header Skeleton */}
        <div className="flex-shrink-0 pt-0 pr-2 pl-2">
          <div className="mx-2 mt-4 mb-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-loading-bg rounded-xl animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 bg-loading-bg rounded w-20 animate-pulse" />
                <div className="h-3 bg-loading-bg rounded w-16 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Stats Box Skeleton */}
          <div className="mx-2 mb-3 p-3 bg-hover rounded-lg border border-border">
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-3 bg-loading-bg rounded w-12 animate-pulse" />
                  <div className="h-3 bg-loading-bg rounded w-8 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Explorer Skeleton */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 pt-2 pb-1">
            <div className="h-3 bg-loading-bg rounded w-20 animate-pulse mb-2" />
          </div>
          <div className="py-1 px-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-1 px-1 py-0.5 mb-1" style={{ paddingLeft: `${(i % 2) * 12 + 4}px` }}>
                <div className="w-3.5 h-3.5 bg-loading-bg rounded animate-pulse flex-shrink-0 mr-1" />
                <div className="h-3 bg-loading-bg rounded animate-pulse" style={{ width: `${60 + (i % 3) * 15}%` }} />
              </div>
            ))}
          </div>
        </div>

        {/* Profile Skeleton */}
        <div className="flex-shrink-0 p-2" style={{ paddingBottom: '15px' }}>
          <div className="w-full flex items-center gap-3 p-2">
            <div className="w-8 h-8 bg-loading-bg rounded-xl animate-pulse" />
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-loading-bg rounded w-24 animate-pulse" />
              <div className="h-2 bg-loading-bg rounded w-16 animate-pulse" />
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full h-full bg-background text-foreground border-r border-border flex flex-col">
      {/* Sidebar Header */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-background border border-border">
            <span className="text-base font-bold text-foreground">W</span>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Workbench</h2>
            <p className="text-xs text-muted">Documents</p>
          </div>
        </div>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Stats Section */}
        <div className="flex-shrink-0 p-4 border-b border-border">
          <div className="p-3 bg-hover rounded-lg border border-border">
            <div className="text-xs text-muted space-y-1.5">
              <div className="flex justify-between items-center">
                <span>Total:</span>
                <span className="font-medium text-foreground">
                  {stats ? stats.totalDocuments.toLocaleString() : 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>My Docs:</span>
                <span className="font-medium text-foreground">
                  {stats ? stats.myDocuments.toLocaleString() : 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Folders:</span>
                <span className="font-medium text-foreground">
                  {stats ? stats.totalFolders.toLocaleString() : 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* File Explorer Section */}
        <div className="flex-1 overflow-y-auto">
          {/* Workspace Header - No border above */}
          <div className="px-4 pt-3 pb-2">
            <h3 className="text-xs font-medium text-muted uppercase tracking-wide">
              {(() => {
                const workspaceName = ui.activeWorkspace?.name || workspaceSlug || 'Workspace';
                return workspaceName.charAt(0).toUpperCase() + workspaceName.slice(1);
              })()}
            </h3>
          </div>
          <DocumentExplorer />
        </div>
      </div>

      {/* Sidebar Footer - Profile */}
      <div className="flex-shrink-0 p-4">
        <button
          onClick={handleProfileClick}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-hover transition-colors"
          title="Profile"
        >
          <div className="w-8 h-8 bg-loading-bg rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-gray-700">
              {(userProfile?.firstName?.charAt(0) || authUser?.name?.charAt(0) || 'U').toUpperCase()}
            </span>
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="text-sm font-medium text-foreground truncate">
              {userProfile?.firstName && userProfile?.lastName && userProfile.firstName.trim() && userProfile.lastName.trim()
                ? `${userProfile.firstName.charAt(0).toUpperCase() + userProfile.firstName.slice(1)} ${userProfile.lastName.charAt(0).toUpperCase() + userProfile.lastName.slice(1)}` 
                : authUser?.name ? authUser.name.charAt(0).toUpperCase() + authUser.name.slice(1) : 'User'}
            </div>
            <div className="text-xs text-muted truncate">
              {(() => {
                const workspaceName = ui.activeWorkspace?.name || workspaceSlug || 'Workspace';
                return workspaceName.charAt(0).toUpperCase() + workspaceName.slice(1);
              })()}
            </div>
          </div>
        </button>
      </div>
    </aside>
  );
}
