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
  ChartBarIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useUnifiedAuth } from '@/platform/auth';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { useProfilePanel } from '@/platform/ui/components/ProfilePanelContext';
import { useStacks } from '@/products/stacks/context/StacksProvider';
import { STACK_STATUS, WORKSTREAM_BOARD_STATUSES } from './constants';
import { useWorkspaceId } from './utils/workspaceId';

interface StacksLeftPanelProps {
  activeSubSection: string;
  onSubSectionChange: (section: string) => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  getCount?: (stats: { total: number; active: number; completed: number; upNextCount: number; backlogCount: number; workstreamCount: number; epicsCount: number }) => number | React.ReactNode;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'workstream',
    label: 'Workstream',
    icon: QueueListIcon,
    description: 'Visual task management',
    getCount: (stats) => stats.workstreamCount // Workstream shows only 'up-next' items (what the board displays)
  },
  {
    id: 'backlog',
    label: 'Backlog',
    icon: ClipboardDocumentListIcon,
    description: 'Prioritized work queue',
    getCount: (stats) => stats.backlogCount // Backlog = Up Next items + Backlog items (below the line)
  },
  {
    id: 'epics',
    label: 'Epics',
    icon: EyeIcon,
    description: 'Epics and strategy',
    getCount: (stats) => stats.epicsCount || 0 // Epics count
  },
  {
    id: 'stories',
    label: 'Stories',
    icon: ClipboardDocumentListIcon,
    description: 'All stories list',
    getCount: (stats) => {
      // Count all stories (not tasks/bugs)
      // This will be calculated from the stories API
      return stats.total || 0;
    }
  },
  {
    id: 'metrics',
    label: 'Metrics',
    icon: ChartBarIcon,
    description: 'Performance and analytics',
    getCount: () => 9 // Number of metric cards displayed (Velocity, Cycle Time, Throughput, Lead Time, WIP, Completed This Week, Avg Time to Done, Shipped This Month, Active Items)
  }
];

export function StacksLeftPanel({ activeSubSection, onSubSectionChange }: StacksLeftPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user: authUser } = useUnifiedAuth();
  const { ui } = useRevenueOS();
  const { isProfilePanelVisible, setIsProfilePanelVisible } = useProfilePanel();
  const workspaceId = useWorkspaceId();
  
  // Get shared data from StacksContext for syncing
  const stacksContext = useStacks();
  const { stories: contextStories, tasks: contextTasks } = stacksContext || { stories: [], tasks: [] };
  
  // State for user profile data
  const [userProfile, setUserProfile] = useState<{ firstName?: string; lastName?: string } | null>(null);
  
  // State for story counts
    const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    upNextCount: 0,
    backlogCount: 0,
    workstreamCount: 0,
    epicsCount: 0
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

  // Get workspace slug from pathname
  const workspaceSlug = pathname.split('/').filter(Boolean)[0];

  // Fetch story and task counts
  useEffect(() => {
    const fetchStacksCounts = async () => {
      if (!workspaceId) {
        console.warn('⚠️ [StacksLeftPanel] No workspace ID available, resetting stats');
        setStats(prev => ({ ...prev, total: 0, active: 0, completed: 0, upNextCount: 0, backlogCount: 0, workstreamCount: 0, epicsCount: 0 }));
        setStatsLoading(false);
        return;
      }
      
      console.log('🔍 [StacksLeftPanel] Fetching counts for workspace:', workspaceId);

      // Add cache-busting timestamp to prevent stale data
      const cacheBuster = `&_t=${Date.now()}`;

      // Get current stats to preserve counts on error
      const previousEpicsCount = stats.epicsCount;

      try {
        // Fetch stories with cache-busting and no-cache headers
        const storiesResponse = await fetch(`/api/v1/stacks/stories?workspaceId=${workspaceId}${cacheBuster}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
          cache: 'no-store' as RequestCache,
        });

        // Fetch tasks/bugs with cache-busting and no-cache headers
        const tasksResponse = await fetch(`/api/stacks/tasks?workspaceId=${workspaceId}${cacheBuster}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
          cache: 'no-store' as RequestCache,
        });

        // Fetch epics with cache-busting and no-cache headers
        const epicsResponse = await fetch(`/api/stacks/epics?workspaceId=${workspaceId}${cacheBuster}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
          cache: 'no-store' as RequestCache,
        });

        let stories: any[] = [];
        let tasks: any[] = [];
        let epicsCount = 0;

        if (storiesResponse.ok) {
          try {
            const storiesData = await storiesResponse.json();
            stories = storiesData.stories || [];
          } catch (e) {
            console.warn('⚠️ [StacksLeftPanel] Failed to parse stories response:', e);
          }
        } else {
          console.warn('⚠️ [StacksLeftPanel] Stories API returned:', storiesResponse.status, storiesResponse.statusText);
        }

        if (tasksResponse.ok) {
          try {
            const tasksData = await tasksResponse.json();
            tasks = tasksData.tasks || [];
          } catch (e) {
            console.warn('⚠️ [StacksLeftPanel] Failed to parse tasks response:', e);
          }
        } else {
          console.warn('⚠️ [StacksLeftPanel] Tasks API returned:', tasksResponse.status, tasksResponse.statusText);
          // Try to get error message from response (only if not already consumed)
          try {
            const errorText = await tasksResponse.text();
            if (errorText) {
              try {
                const errorData = JSON.parse(errorText);
                console.warn('⚠️ [StacksLeftPanel] Tasks API error:', errorData.error || errorData.message);
              } catch (parseError) {
                console.warn('⚠️ [StacksLeftPanel] Tasks API error (non-JSON):', errorText);
              }
            }
          } catch (e) {
            // Response body already consumed or not available
            console.warn('⚠️ [StacksLeftPanel] Could not read tasks error response');
          }
        }

        if (epicsResponse.ok) {
          try {
            const epicsData = await epicsResponse.json();
            epicsCount = (epicsData.epics || epicsData.epochs || []).length;
            console.log('📊 [StacksLeftPanel] Epics API success - count:', epicsCount, 'epics:', (epicsData.epics || epicsData.epochs || []).length, 'workspace:', workspaceId);
          } catch (e) {
            console.error('❌ [StacksLeftPanel] Failed to parse epics response:', e);
            console.error('❌ [StacksLeftPanel] Response status:', epicsResponse.status, 'statusText:', epicsResponse.statusText);
            epicsCount = 0;
          }
        } else {
          console.warn('⚠️ [StacksLeftPanel] Epics API failed:', epicsResponse.status, epicsResponse.statusText);
          epicsCount = 0;
        }

        // Combine stories and tasks for totals
        const allItems = [...stories, ...tasks];
        const total = allItems.length;
        
        // Active = all statuses except 'done' and 'shipped'
        const active = allItems.filter((item: any) => 
          item.status && item.status !== STACK_STATUS.DONE && item.status !== STACK_STATUS.SHIPPED
        ).length;
        
        // Completed = 'done' and 'shipped'
        const completed = allItems.filter((item: any) => 
          item.status === STACK_STATUS.DONE || item.status === STACK_STATUS.SHIPPED
        ).length;

        // Up Next = items with status 'up-next' or 'todo'
        const upNextCount = allItems.filter((item: any) => 
          item.status === STACK_STATUS.UP_NEXT || item.status === STACK_STATUS.TODO
        ).length;

        // Backlog items = items with status 'backlog' (below the line)
        const backlogItemsCount = allItems.filter((item: any) => 
          item.status === STACK_STATUS.BACKLOG
        ).length;

        // Workstream = items with any workstream board column status
        const workstreamCount = allItems.filter((item: any) => 
          WORKSTREAM_BOARD_STATUSES.includes(item.status as typeof STACK_STATUS[keyof typeof STACK_STATUS])
        ).length;

        // Backlog count = Up Next items + Backlog items (both appear in backlog view)
        const backlogCount = upNextCount + backlogItemsCount;

        console.log('📊 [StacksLeftPanel] Final counts:', { 
          total, 
          active, 
          completed, 
          upNextCount, 
          backlogItemsCount,
          workstreamCount, 
          backlogCount, 
          epicsCount,
          stories: stories.length, 
          tasks: tasks.length,
          workspace: workspaceId 
        });

        setStats({ total, active, completed, upNextCount, backlogCount, workstreamCount, epicsCount });
      } catch (error) {
        console.error('❌ [StacksLeftPanel] Failed to fetch story/task counts:', error);
        // Log error details for debugging
        if (error instanceof Error) {
          console.error('❌ [StacksLeftPanel] Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
          });
        }
        // Preserve counts if we had previous values, otherwise reset to 0
        // This prevents showing 0 when there's a transient error
        const preservedEpicsCount = previousEpicsCount > 0 ? previousEpicsCount : 0;
        setStats({ total: 0, active: 0, completed: 0, upNextCount: 0, backlogCount: 0, workstreamCount: 0, epicsCount: preservedEpicsCount });
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStacksCounts();
    
    // Refresh counts periodically (every 30 seconds) to keep data fresh
    const refreshInterval = setInterval(() => {
      fetchStacksCounts();
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [workspaceId, pathname]); // Refresh when workspace ID or pathname changes

  // Sync stats from StacksContext when context data changes (for same-page sync)
  useEffect(() => {
    if (contextStories.length > 0 || contextTasks.length > 0) {
      console.log('🔄 [StacksLeftPanel] Context data changed, recalculating stats from context');
      
      // Combine stories and tasks from context
      const allItems = [...(contextStories || []), ...(contextTasks || [])];
      const total = allItems.length;
      
        // Active = all statuses except 'done' and 'shipped'
        const active = allItems.filter((item: any) => 
          item.status && item.status !== STACK_STATUS.DONE && item.status !== STACK_STATUS.SHIPPED
        ).length;
        
        // Completed = 'done' and 'shipped'
        const completed = allItems.filter((item: any) => 
          item.status === STACK_STATUS.DONE || item.status === STACK_STATUS.SHIPPED
        ).length;
        
        // Up Next = items with status 'up-next' or 'todo'
        const upNextCount = allItems.filter((item: any) => 
          item.status === STACK_STATUS.UP_NEXT || item.status === STACK_STATUS.TODO
        ).length;

        // Backlog items = items with status 'backlog' (below the line)
        const backlogItemsCount = allItems.filter((item: any) => 
          item.status === STACK_STATUS.BACKLOG
        ).length;

      // Workstream = items with any workstream board column status
      const workstreamCount = allItems.filter((item: any) => 
        WORKSTREAM_BOARD_STATUSES.includes(item.status as typeof STACK_STATUS[keyof typeof STACK_STATUS])
      ).length;

      // Backlog count = Up Next items + Backlog items (both appear in backlog view)
      const backlogCount = upNextCount + backlogItemsCount;

      // Update stats
      setStats(prev => ({
        total,
        active,
        completed,
        upNextCount,
        backlogCount,
        workstreamCount,
      }));
      
      console.log('✅ [StacksLeftPanel] Stats updated from context:', { total, active, completed, upNextCount, backlogCount, workstreamCount });
    }
  }, [contextStories, contextTasks]);

  // Check if we're in Notary Everyday workspace
  const isNotaryEveryday = workspaceSlug === 'ne' || 
                          (typeof window !== "undefined" && window.location.pathname.startsWith('/ne/')) ||
                          authUser?.activeWorkspaceId === '01K1VBYmf75hgmvmz06psnc9ug' ||
                          authUser?.activeWorkspaceId === '01K7DNYR5VZ7JY36KGKKN76XZ1' ||
                          authUser?.activeWorkspaceId === 'cmezxb1ez0001pc94yry3ntjk';

  const handleNavigation = (section: string) => {
    console.log('🔄 [StacksLeftPanel] handleNavigation called:', { 
      section, 
      currentActiveSubSection: activeSubSection, 
      pathname,
      willCallOnSubSectionChange: section !== activeSubSection
    });
    
    // Only navigate if we're actually changing sections
    if (section !== activeSubSection) {
      // Get workspace slug from pathname
      const pathParts = pathname.split('/').filter(Boolean);
      const workspaceSlug = pathParts[0] || 'workspace';
      
      // Build the correct path - /workspace/stacks/section
      const newPath = `/${workspaceSlug}/stacks/${section}`;
      
      console.log('🔄 [StacksLeftPanel] Navigating to:', newPath);
      router.push(newPath);
      
      // Also update the state via the provider
      onSubSectionChange(section);
    } else {
      console.log('⚠️ [StacksLeftPanel] Section already active, skipping navigation');
    }
  };

  // Update activeSubSection based on pathname (for URL-based navigation)
  // This syncs the UI state with the URL when navigating directly or via browser back/forward
  useEffect(() => {
    // Check if this is a story detail page (has a slug/ID that's not a known section)
    const pathParts = pathname.split('/').filter(Boolean);
    const knownSections = ['epics', 'workstream', 'metrics', 'backlog', 'chronicle', 'stories', 'bugs', 'futures'];
    
    // If we're on /stacks/{something}, check if it's a known section or a story slug
    if (pathParts.length >= 3 && pathParts[1] === 'stacks') {
      const lastSegment = pathParts[pathParts.length - 1];
      
      // If last segment is NOT a known section, it's likely a story detail page
      // Preserve current section or check sessionStorage for navigation source
      if (lastSegment && !knownSections.includes(lastSegment.toLowerCase())) {
        // This looks like a story detail page (slug/ID)
        // Check if we came from backlog (or other section) via sessionStorage
        const navigationSource = typeof window !== 'undefined' 
          ? sessionStorage.getItem('stacks-navigation-source')
          : null;
        
        if (navigationSource && knownSections.includes(navigationSource)) {
          // Use the navigation source (e.g., 'backlog') if it's a valid section
          console.log('📄 [StacksLeftPanel] Story detail page detected, using navigation source:', navigationSource);
          if (navigationSource !== activeSubSection) {
            onSubSectionChange(navigationSource);
          }
          return;
        }
        
        // Otherwise preserve current section
        console.log('📄 [StacksLeftPanel] Story detail page detected, preserving current section:', activeSubSection);
        return; // Don't change section when viewing a story detail
      }
    }
    
    // Extract section from pathname
    let detectedSection: string | null = null;
    
    if (pathname.includes('/stacks/epics')) {
      detectedSection = 'epics';
    } else if (pathname.includes('/stacks/workstream') || pathname.includes('/workstream')) {
      detectedSection = 'workstream';
    } else if (pathname.includes('/sell/pipeline') || pathname.includes('/pipeline/sell')) {
      detectedSection = 'workstream';
    } else if (pathname.includes('/stacks/backlog') || pathname.includes('/backlog')) {
      detectedSection = 'backlog';
    } else if (pathname.includes('/stacks/metrics') || pathname.includes('/metrics')) {
      detectedSection = 'metrics';
    } else if (pathname.includes('/stacks')) {
      // Only default to epics if we're truly on a base /stacks route
      // If we're on a story detail, don't change section
      const isJustStacks = pathParts.length >= 2 && pathParts[pathParts.length - 1] === 'stacks';
      if (isJustStacks) {
        detectedSection = 'epics';
      }
    }
    
    // Only update if we detected a different section and it doesn't match current state
    if (detectedSection && detectedSection !== activeSubSection) {
      console.log('🔄 [StacksLeftPanel] Pathname changed, updating section:', { 
        detectedSection, 
        currentActiveSubSection: activeSubSection,
        pathname 
      });
      onSubSectionChange(detectedSection);
    }
  }, [pathname, onSubSectionChange, activeSubSection]);

  const handleProfileClick = () => {
    setIsProfilePanelVisible(!isProfilePanelVisible);
  };

  // All navigation items are displayed (no category grouping)
  const displayItems = navigationItems;

  return (
    <div className="w-full h-full bg-background text-foreground border-r border-border flex flex-col">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 pt-0 pr-2 pl-2">
        {/* Header - matching Speedrun style */}
        <div className="mx-2 mt-4 mb-2">
          {/* Company Icon */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-background border border-border overflow-hidden" style={{ filter: 'none' }}>
              <span className="text-lg font-bold text-foreground">S</span>
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-foreground">Stacks</h2>
              <p className="text-xs text-muted">Work Acceleration</p>
            </div>
          </div>
        </div>

        {/* Project Management Dashboard */}
        <div className="mx-2 mb-4 p-3 bg-hover rounded-lg border border-border">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-muted">Total Items</span>
              <span className="text-xs font-semibold text-foreground">
                {statsLoading ? '...' : stats.total}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-muted">Active</span>
              <span className="text-xs font-semibold text-foreground">
                {statsLoading ? '...' : stats.active}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-muted">Completed</span>
              <span className="text-xs font-semibold text-foreground">
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
            // Check if this item is active - prioritize activeSubSection from props, then check pathname
            const isActive = activeSubSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🖱️ [StacksLeftPanel] Button clicked:', item.id);
                  handleNavigation(item.id);
                }}
                type="button"
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-hover text-foreground'
                    : 'hover:bg-panel-background text-foreground'
                }`}
                aria-current={isActive ? 'page' : undefined}
                aria-describedby={`${item.id}-description`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{item.label}</span>
                  {item.getCount && (
                    <span className="text-sm text-muted">
                      {statsLoading ? (
                        <div className="w-6 h-3 bg-loading-bg rounded animate-pulse"></div>
                      ) : (() => {
                        const count = item.getCount(stats);
                        return typeof count === 'number' ? count.toLocaleString() : count ?? 0;
                      })()}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted mt-1">
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
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-hover transition-colors"
          title="Profile"
        >
          <div className="w-8 h-8 bg-loading-bg rounded-xl flex items-center justify-center">
            <span className="text-sm font-medium text-foreground">
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
    </div>
  );
}


