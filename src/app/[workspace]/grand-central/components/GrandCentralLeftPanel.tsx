"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useGrandCentral } from "../layout";
import { useUnifiedAuth } from "@/platform/auth";
import { useProfilePanel } from "@/platform/ui/components/ProfilePanelContext";
// import { usePipeline } from "@/products/pipeline/context/PipelineContext";

export function GrandCentralLeftPanel() {
  const pathname = usePathname();
  const params = useParams();
  const workspace = params.workspace;
  const { activeTab, setActiveTab } = useGrandCentral();
  const { user: authUser } = useUnifiedAuth();
  const { isProfilePanelVisible, setIsProfilePanelVisible } = useProfilePanel();
  // const { user, workspace: workspaceName } = usePipeline();
  
  // User profile data for firstName and lastName
  const [userProfile, setUserProfile] = useState<{ firstName?: string; lastName?: string } | null>(null);
  
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
  
  // Determine current tab from pathname
  const currentTab = pathname.includes('/apis') ? 'apis' :
                    pathname.includes('/mcps') ? 'mcps' :
                    pathname.includes('/connectors') ? 'all-connectors' : 'apis';
  
  // Get display name - prefer firstName + lastName, fallback to name
  const getDisplayName = () => {
    if (userProfile?.firstName && userProfile?.lastName && userProfile.firstName.trim() && userProfile.lastName.trim()) {
      return `${userProfile.firstName} ${userProfile.lastName}`;
    }
    if (userProfile?.firstName && userProfile.firstName.trim()) {
      return userProfile.firstName;
    }
    return authUser?.name || 'User';
  };
  
  // Get initial for avatar
  const getInitial = () => {
    if (userProfile?.firstName) {
      return userProfile.firstName.charAt(0).toUpperCase();
    }
    return authUser?.name?.charAt(0)?.toUpperCase() || 'U';
  };

  return (
    <div className="w-full h-full bg-background text-foreground border-r border-border flex flex-col">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 pt-0 pr-2 pl-2">
        {/* Header */}
        <div className="mx-2 mt-4 mb-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-background border border-border overflow-hidden" style={{ filter: 'none' }}>
              <span className="text-lg font-bold text-black">GC</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Grand Central</h2>
              <p className="text-xs text-muted">Integration Hub</p>
            </div>
          </div>
        </div>

      </div>

      {/* Navigation Sections */}
      <div className="flex-1 space-y-1 p-2">
        {/* All Integrations Section */}
        <button
          onClick={() => window.location.href = `/${workspace}/grand-central/integrations`}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
            pathname.includes('/integrations')
              ? 'bg-hover text-foreground'
              : 'hover:bg-panel-background text-gray-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">All Integrations</span>
          </div>
          <div className="text-xs text-muted mt-1">
            Connect your email accounts
          </div>
        </button>
      </div>

      {/* Fixed Bottom Section - Profile Button */}
      <div className="flex-shrink-0 p-2" style={{ paddingBottom: '15px' }}>
        <button
          onClick={() => setIsProfilePanelVisible(!isProfilePanelVisible)}
          className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
            isProfilePanelVisible ? 'bg-hover' : 'hover:bg-hover'
          }`}
          title="Profile"
        >
          <div className="w-8 h-8 bg-loading-bg rounded-xl flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">{getInitial()}</span>
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-foreground">{getDisplayName()}</div>
            <div className="text-xs text-muted">{typeof workspace === 'string' ? workspace : workspace?.name || authUser?.workspaces?.find(w => w.id === authUser.activeWorkspaceId)?.name || 'Workspace'}</div>
          </div>
        </button>
      </div>
    </div>
  );
}