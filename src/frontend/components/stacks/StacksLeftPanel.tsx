"use client";

/**
 * Stacks Left Panel Component
 * 
 * Left navigation panel for Stacks section with Kanban, Backlog, and Deep Backlog.
 * Follows 2025 best practices with proper accessibility and performance.
 */

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  QueueListIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useUnifiedAuth } from '@/platform/auth';
import { useProfilePanel } from '@/platform/ui/components/ProfilePanelContext';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';

interface StacksLeftPanelProps {
  activeSubSection: string;
  onSubSectionChange: (section: string) => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'workstream',
    label: 'Workstream',
    icon: QueueListIcon,
    description: 'Visual task management'
  },
  {
    id: 'backlog',
    label: 'Backlog',
    icon: ClipboardDocumentListIcon,
    description: 'Prioritized work queue'
  },
  {
    id: 'metrics',
    label: 'Metrics',
    icon: ChartBarIcon,
    description: 'Performance and analytics'
  }
];

export function StacksLeftPanel({ activeSubSection, onSubSectionChange }: StacksLeftPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user: authUser } = useUnifiedAuth();
  const { isProfilePanelVisible, setIsProfilePanelVisible } = useProfilePanel();
  const { ui } = useRevenueOS();
  
  // State for user profile data
  const [userProfile, setUserProfile] = useState<{ firstName?: string; lastName?: string } | null>(null);
  
  // State for story counts
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  
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

  // Fetch story counts
  useEffect(() => {
    const fetchStoryCounts = async () => {
      if (!ui.activeWorkspace?.id) {
        setStats({ total: 0, active: 0, completed: 0 });
        setStatsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/v1/stacks/stories?workspaceId=${ui.activeWorkspace.id}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const stories = data.stories || [];
          
          const total = stories.length;
          // Active = all statuses except 'done' and 'shipped'
          const active = stories.filter((story: any) => 
            story.status && story.status !== 'done' && story.status !== 'shipped'
          ).length;
          // Completed = 'done' and 'shipped'
          const completed = stories.filter((story: any) => 
            story.status === 'done' || story.status === 'shipped'
          ).length;

          setStats({ total, active, completed });
        } else {
          setStats({ total: 0, active: 0, completed: 0 });
        }
      } catch (error) {
        console.error('Failed to fetch story counts:', error);
        setStats({ total: 0, active: 0, completed: 0 });
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStoryCounts();
  }, [ui.activeWorkspace?.id]);

  // Get current workspace from pathname
  const workspaceSlug = pathname.split('/')[1];
  
  // Check if we're in Notary Everyday workspace
  const isNotaryEveryday = workspaceSlug === 'ne' || 
                          (typeof window !== "undefined" && window.location.pathname.startsWith('/ne/')) ||
                          authUser?.activeWorkspaceId === '01K1VBYmf75hgmvmz06psnc9ug' ||
                          authUser?.activeWorkspaceId === '01K7DNYR5VZ7JY36KGKKN76XZ1' ||
                          authUser?.activeWorkspaceId === 'cmezxb1ez0001pc94yry3ntjk';

  const handleNavigation = (section: string) => {
    onSubSectionChange(section);
    
    // Map section to URL path
    let urlPath = section;
    if (section === 'workstream') {
      urlPath = 'workstream';
    } else if (section === 'backlog') {
      urlPath = 'backlog';
    } else if (section === 'metrics') {
      urlPath = 'metrics';
    }
    
    router.push(`/${workspaceSlug}/stacks/${urlPath}`);
  };

  // Update activeSubSection based on pathname (for workstream URL)
  useEffect(() => {
    if (pathname.includes('/stacks/workstream')) {
      onSubSectionChange('workstream');
    } else if (pathname.includes('/stacks/backlog')) {
      onSubSectionChange('backlog');
    } else if (pathname.includes('/stacks/metrics')) {
      onSubSectionChange('metrics');
    }
  }, [pathname, onSubSectionChange]);

  const handleProfileClick = () => {
    setIsProfilePanelVisible(!isProfilePanelVisible);
  };

  // All navigation items are displayed (no category grouping)
  const displayItems = navigationItems;

  return (
    <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 pt-0 pr-2 pl-2">
        {/* Header - matching Speedrun style */}
        <div className="mx-2 mt-4 mb-2">
          {/* Company Icon */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--background)] border border-[var(--border)] overflow-hidden" style={{ filter: 'none' }}>
              <span className="text-lg font-bold text-black">S</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)]">Stacks</h2>
              <p className="text-xs text-[var(--muted)]">Work Acceleration</p>
            </div>
          </div>
        </div>

        {/* Project Management Dashboard */}
        <div className="mx-2 mb-4 p-3 bg-[var(--hover)] rounded-lg border border-[var(--border)]">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-[var(--muted)]">Total Items</span>
              <span className="text-xs font-semibold text-black">
                {statsLoading ? '...' : stats.total}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-[var(--muted)]">Active</span>
              <span className="text-xs font-semibold text-black">
                {statsLoading ? '...' : stats.active}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-[var(--muted)]">Completed</span>
              <span className="text-xs font-semibold text-black">
                {statsLoading ? '...' : stats.completed}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Middle Section - Navigation */}
      <div className="flex-1 overflow-y-auto invisible-scrollbar px-2">
        <nav className="space-y-1" role="navigation" aria-label="Stacks navigation">
          {displayItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSubSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[var(--hover)] text-[var(--foreground)]'
                    : 'hover:bg-[var(--panel-background)] text-gray-700'
                }`}
                aria-current={isActive ? 'page' : undefined}
                aria-describedby={`${item.id}-description`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                <div className="text-xs text-[var(--muted)] mt-1">
                  {item.description}
                </div>
              </button>
            );
          })}
        </nav>
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
                      ? `${userProfile.firstName} ${userProfile.lastName}` 
                      : authUser?.name || 'User'}
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    {ui.activeWorkspace?.name || workspaceSlug?.charAt(0).toUpperCase() + workspaceSlug?.slice(1) || 'Workspace'}
                  </div>
          </div>
        </button>
      </div>
    </div>
  );
}


