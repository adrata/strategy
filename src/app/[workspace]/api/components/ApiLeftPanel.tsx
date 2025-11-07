"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useParams, useRouter } from "next/navigation";
import { useProfilePanel } from "@/platform/ui/components/ProfilePanelContext";
import { useUnifiedAuth } from "@/platform/auth";
import { KeyIcon, ChartBarIcon, BellIcon, Cog6ToothIcon, BookOpenIcon } from "@heroicons/react/24/outline";

export function ApiLeftPanel() {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const workspace = params.workspace;
  const { setIsProfilePanelVisible } = useProfilePanel();
  const { user: authUser } = useUnifiedAuth();

  const navigationItems = [
    {
      id: 'keys',
      label: 'API Keys',
      icon: KeyIcon,
      description: 'Manage your API keys',
      path: `/api/keys`
    },
    {
      id: 'usage',
      label: 'Usage',
      icon: ChartBarIcon,
      description: 'API usage statistics',
      path: `/api/usage`
    },
    {
      id: 'documentation',
      label: 'Documentation',
      icon: BookOpenIcon,
      description: 'API documentation and guides',
      path: `/api/documentation`
    },
    {
      id: 'webhooks',
      label: 'Webhooks',
      icon: BellIcon,
      description: 'Webhook management',
      path: `/api/webhooks`
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Cog6ToothIcon,
      description: 'API configuration',
      path: `/api/settings`
    }
  ];

  const handleProfileClick = () => {
    setIsProfilePanelVisible(true);
  };

  const handleNavigation = (path: string, itemId: string) => {
    // If clicking API Keys and we're not done with onboarding, go to get-started
    if (itemId === 'keys' && pathname?.includes('/api/get-started')) {
      // Already on get-started, do nothing or go to keys if they have keys
      // For now, allow navigation
      router.push(`/${workspace}${path}`);
      return;
    }
    // If clicking API Keys from elsewhere, check if they should go to get-started first
    if (itemId === 'keys') {
      // Check if they have API keys - if not, go to get-started, else go to keys
      const hasKeys = stats.activeKeys > 0;
      if (!hasKeys && !pathname?.includes('/api/get-started')) {
        router.push(`/${workspace}/api/get-started`);
        return;
      }
    }
    router.push(`/${workspace}${path}`);
  };

  // Check if we're on the get-started onboarding page
  const isOnboarding = pathname?.includes('/api/get-started');

  // Get user initial
  const userInitial = authUser?.name ? authUser.name.charAt(0).toUpperCase() : 'U';
  const userName = authUser?.name || 'User';
  const workspaceName = workspace || 'Adrata';

  // Stats state
  const [stats, setStats] = useState({
    activeKeys: 0,
    requestsToday: 0,
    rateLimit: '0/1000'
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch API keys for stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/area/api-keys');
        if (response.ok) {
          const data = await response.json();
          const activeKeys = (data.data || []).filter((key: any) => key.isActive).length;
          setStats({
            activeKeys,
            requestsToday: 0, // TODO: Implement actual usage tracking
            rateLimit: '0/1000' // TODO: Implement actual rate limit tracking
          });
        }
      } catch (error) {
        console.error('Failed to fetch API stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="w-full h-full bg-background text-foreground border-r border-border flex flex-col">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 border-b border-border pt-0 pr-2 pl-2">
        {/* Header */}
        <div className="mx-2 mt-4 mb-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-background border border-border overflow-hidden" style={{ filter: 'none' }}>
              <span className="text-lg font-bold text-black">A</span>
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-foreground">API Access</h2>
              <p className="text-xs text-muted">Unlock more</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mx-2 mb-3 p-3 bg-panel-background rounded-lg">
          <div className="text-xs text-muted space-y-1">
            <div className="flex justify-between">
              <span>Active Keys:</span>
              <span className="font-medium">
                {statsLoading ? '...' : stats.activeKeys}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Requests Today:</span>
              <span className="font-medium">
                {statsLoading ? '...' : stats.requestsToday}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Rate Limit:</span>
              <span className="font-medium">
                {statsLoading ? '...' : stats.rateLimit}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Middle Section - Navigation Items */}
      <div className="flex-1 overflow-y-auto invisible-scrollbar px-2 py-2">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            // API Keys should be highlighted when on get-started OR on keys page
            const isActive = item.id === 'keys' 
              ? (pathname?.includes('/api/get-started') || pathname?.includes(item.path))
              : pathname?.includes(item.path);
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path, item.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-hover text-foreground'
                    : 'hover:bg-panel-background text-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${
                    isActive 
                      ? 'text-foreground' 
                      : 'text-muted'
                  }`} />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className="text-xs text-muted mt-0.5">
                      {item.description}
                    </div>
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
