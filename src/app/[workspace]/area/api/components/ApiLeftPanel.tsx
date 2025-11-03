"use client";

import React, { useState } from "react";
import { usePathname, useParams } from "next/navigation";
import { useApi } from "../layout";
import { useProfilePanel } from "@/platform/ui/components/ProfilePanelContext";
import { useUnifiedAuth } from "@/platform/auth";
import { KeyIcon, ChartBarIcon, BellIcon, Cog6ToothIcon, BookOpenIcon } from "@heroicons/react/24/outline";

export function ApiLeftPanel() {
  const pathname = usePathname();
  const params = useParams();
  const workspace = params.workspace;
  const { activeTab, setActiveTab } = useApi();
  const { setIsProfilePanelVisible } = useProfilePanel();
  const { user: authUser } = useUnifiedAuth();

  const navigationItems = [
    {
      id: 'keys' as const,
      label: 'API Keys',
      icon: KeyIcon,
      description: 'Manage your API keys'
    },
    {
      id: 'usage' as const,
      label: 'Usage',
      icon: ChartBarIcon,
      description: 'API usage statistics'
    },
    {
      id: 'documentation' as const,
      label: 'Documentation',
      icon: BookOpenIcon,
      description: 'API documentation and guides'
    },
    {
      id: 'webhooks' as const,
      label: 'Webhooks',
      icon: BellIcon,
      description: 'Webhook management'
    },
    {
      id: 'settings' as const,
      label: 'Settings',
      icon: Cog6ToothIcon,
      description: 'API configuration'
    }
  ];

  const handleProfileClick = () => {
    setIsProfilePanelVisible(true);
  };

  // Get user initial
  const userInitial = authUser?.name ? authUser.name.charAt(0).toUpperCase() : 'U';
  const userName = authUser?.name || 'User';
  const workspaceName = workspace || 'Adrata';

  return (
    <div className="w-full h-full bg-background text-foreground border-r border-border flex flex-col">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 border-b border-border p-4">
        <h2 className="text-base font-semibold text-foreground">API Area</h2>
        <p className="text-xs text-muted mt-0.5">Manage integrations</p>
      </div>

      {/* Scrollable Middle Section - Navigation Items */}
      <div className="flex-1 overflow-y-auto invisible-scrollbar px-2 py-2">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-hover text-foreground'
                    : 'hover:bg-panel-background text-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-foreground' : 'text-muted'}`} />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className="text-xs text-muted mt-0.5">{item.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fixed Bottom Section - Profile Button */}
      <div className="flex-shrink-0 p-2" style={{ paddingBottom: '15px' }}>
        <button
          onClick={handleProfileClick}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-hover transition-colors"
          title="Profile"
        >
          <div className="w-8 h-8 bg-loading-bg rounded-xl flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">{userInitial}</span>
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-foreground">{userName}</div>
            <div className="text-xs text-muted">
              {workspaceName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}