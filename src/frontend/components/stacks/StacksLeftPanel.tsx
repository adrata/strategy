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
import { useProfilePanel } from '@/platform/ui/components/ProfilePanelContext';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { getWorkspaceIdBySlug } from '@/platform/config/workspace-mapping';
import { useStacks } from '@/products/stacks/context/StacksProvider';

interface StacksLeftPanelProps {
  activeSubSection: string;
  onSubSectionChange: (section: string) => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  getCount?: (stats: { total: number; active: number; completed: number; upNextCount: number; backlogCount: number; workstreamCount: number; visionCount: number }) => number | React.ReactNode;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'vision',
    label: 'Vision',
    icon: EyeIcon,
    description: 'Papers and pitches',
    getCount: (stats) => stats.visionCount // Vision shows count of papers and pitches
  },
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
    getCount: (stats) => stats.upNextCount + stats.backlogCount // Backlog shows both "Up Next" and "Backlog" items
  },
  {
    id: 'metrics',
    label: 'Metrics',
    icon: ChartBarIcon,
    description: 'Performance and analytics',
    getCount: () => null // Metrics doesn't show count
  }
];

export function StacksLeftPanel({ activeSubSection, onSubSectionChange }: StacksLeftPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user: authUser } = useUnifiedAuth();
  const { isProfilePanelVisible, setIsProfilePanelVisible } = useProfilePanel();
  const { ui } = useRevenueOS();
  
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
    visionCount: 0
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
      // Resolve workspace ID with fallback logic (same as StacksBoard)
      let workspaceId = ui.activeWorkspace?.id;
      
      // Fallback 1: Get from URL workspace slug if UI workspace is missing
      if (!workspaceId && workspaceSlug) {
        const urlWorkspaceId = getWorkspaceIdBySlug(workspaceSlug);
        if (urlWorkspaceId) {
          console.log(`🔍 [StacksLeftPanel] Resolved workspace ID from URL slug "${workspaceSlug}": ${urlWorkspaceId}`);
          workspaceId = urlWorkspaceId;
        }
      }
      
      // Fallback 2: Use user's active workspace ID
      if (!workspaceId && authUser?.activeWorkspaceId) {
        console.log(`🔍 [StacksLeftPanel] Using user activeWorkspaceId: ${authUser.activeWorkspaceId}`);
        workspaceId = authUser.activeWorkspaceId;
      }
      
      console.log('🔍 [StacksLeftPanel] Starting fetch, workspace:', ui.activeWorkspace);
      console.log('🔍 [StacksLeftPanel] Workspace ID (resolved):', workspaceId);
      console.log('🔍 [StacksLeftPanel] URL workspace slug:', workspaceSlug);
      console.log('🔍 [StacksLeftPanel] User activeWorkspaceId:', authUser?.activeWorkspaceId);
      
      if (!workspaceId) {
        console.warn('⚠️ [StacksLeftPanel] No workspace ID available after all fallbacks, resetting stats');
        setStats(prev => ({ ...prev, total: 0, active: 0, completed: 0, upNextCount: 0, backlogCount: 0, workstreamCount: 0, visionCount: 0 }));
        setStatsLoading(false);
        return;
      }
      
      console.log('🔍 [StacksLeftPanel] Fetching counts for workspace:', workspaceId);

      // Add cache-busting timestamp to prevent stale data
      const cacheBuster = `&_t=${Date.now()}`;

      // Get current stats to preserve visionCount on error
      const previousVisionCount = stats.visionCount;

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

        // Fetch vision documents (papers and pitches) with cache-busting and no-cache headers
        const visionResponse = await fetch(`/api/v1/stacks/vision?workspaceId=${workspaceId}${cacheBuster}`, {
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
        let visionCount = 0;

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

        if (visionResponse.ok) {
          try {
            const visionData = await visionResponse.json();
            visionCount = visionData.documents?.length || 0;
            console.log('📊 [StacksLeftPanel] Vision API success - count:', visionCount, 'documents:', visionData.documents?.length, 'workspace:', workspaceId);
            
            // Log document details for debugging
            if (visionData.documents && visionData.documents.length > 0) {
              console.log('📄 [StacksLeftPanel] Vision documents:', visionData.documents.map((d: any) => ({ id: d.id, title: d.title, type: d.documentType })));
            }
          } catch (e) {
            console.error('❌ [StacksLeftPanel] Failed to parse vision response:', e);
            console.error('❌ [StacksLeftPanel] Response status:', visionResponse.status, 'statusText:', visionResponse.statusText);
            visionCount = 0;
          }
        } else {
          console.error('❌ [StacksLeftPanel] Vision API failed:', visionResponse.status, visionResponse.statusText);
          console.error('❌ [StacksLeftPanel] Workspace ID:', workspaceId);
          
          // Try to get error message for debugging - clone response first to avoid consuming body
          try {
            const clonedResponse = visionResponse.clone();
            const errorText = await clonedResponse.text();
            if (errorText) {
              try {
                const errorData = JSON.parse(errorText);
                console.error('❌ [StacksLeftPanel] Vision API error details:', errorData);
              } catch (parseError) {
                console.error('❌ [StacksLeftPanel] Vision API error (non-JSON):', errorText.substring(0, 200));
              }
            }
          } catch (e) {
            console.error('❌ [StacksLeftPanel] Could not read vision error response:', e);
          }
          
          // Don't reset count to 0 on error - keep previous count if available
          // This prevents showing 0 when there's a transient error
          if (previousVisionCount > 0) {
            console.warn('⚠️ [StacksLeftPanel] Keeping previous vision count due to API error:', previousVisionCount);
            visionCount = previousVisionCount;
          } else {
            visionCount = 0;
          }
        }

        // Combine stories and tasks for totals
        const allItems = [...stories, ...tasks];
        const total = allItems.length;
        
        // Active = all statuses except 'done' and 'shipped'
        const active = allItems.filter((item: any) => 
          item.status && item.status !== 'done' && item.status !== 'shipped'
        ).length;
        
        // Completed = 'done' and 'shipped'
        const completed = allItems.filter((item: any) => 
          item.status === 'done' || item.status === 'shipped'
        ).length;

        // Up Next = items with status 'up-next' or 'todo'
        const upNextCount = allItems.filter((item: any) => 
          item.status === 'up-next' || item.status === 'todo'
        ).length;

        // Workstream = items with any workstream board column status
        // The workstream board displays items across all columns: UP NEXT, WORKING ON, BUILT, QA1, QA2, SHIPPED
        // Cards appear in the column matching their status
        const workstreamBoardStatuses = ['up-next', 'in-progress', 'built', 'qa1', 'qa2', 'shipped'];
        const workstreamCount = allItems.filter((item: any) => 
          workstreamBoardStatuses.includes(item.status)
        ).length;

        // Backlog = items with statuses not shown on workstream board (excluding workstream board statuses, 'done', and 'todo')
        const backlogCount = allItems.filter((item: any) => 
          item.status && 
          item.status !== 'done' && 
          item.status !== 'todo' &&
          !workstreamBoardStatuses.includes(item.status)
        ).length;

        console.log('📊 [StacksLeftPanel] Final counts:', { 
          total, 
          active, 
          completed, 
          upNextCount, 
          workstreamCount, 
          backlogCount, 
          visionCount, 
          stories: stories.length, 
          tasks: tasks.length,
          workspace: workspaceId 
        });

        setStats({ total, active, completed, upNextCount, backlogCount, workstreamCount, visionCount });
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
        // Preserve visionCount if we had a previous value, otherwise reset to 0
        // This prevents showing 0 when there's a transient error
        const preservedVisionCount = previousVisionCount > 0 ? previousVisionCount : 0;
        setStats({ total: 0, active: 0, completed: 0, upNextCount: 0, backlogCount: 0, workstreamCount: 0, visionCount: preservedVisionCount });
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
  }, [ui.activeWorkspace?.id, authUser?.activeWorkspaceId, workspaceSlug, pathname]); // Add pathname to refresh when navigating

  // Sync stats from StacksContext when context data changes (for same-page sync)
  useEffect(() => {
    if (contextStories.length > 0 || contextTasks.length > 0) {
      console.log('🔄 [StacksLeftPanel] Context data changed, recalculating stats from context');
      
      // Combine stories and tasks from context
      const allItems = [...(contextStories || []), ...(contextTasks || [])];
      const total = allItems.length;
      
      // Active = all statuses except 'done' and 'shipped'
      const active = allItems.filter((item: any) => 
        item.status && item.status !== 'done' && item.status !== 'shipped'
      ).length;
      
      // Completed = 'done' and 'shipped'
      const completed = allItems.filter((item: any) => 
        item.status === 'done' || item.status === 'shipped'
      ).length;

      // Up Next = items with status 'up-next' or 'todo'
      const upNextCount = allItems.filter((item: any) => 
        item.status === 'up-next' || item.status === 'todo'
      ).length;

      // Workstream = items with any workstream board column status
      const workstreamBoardStatuses = ['up-next', 'in-progress', 'built', 'qa1', 'qa2', 'shipped'];
      const workstreamCount = allItems.filter((item: any) => 
        workstreamBoardStatuses.includes(item.status)
      ).length;

      // Backlog = items with statuses not shown on workstream board
      const backlogCount = allItems.filter((item: any) => 
        item.status && 
        item.status !== 'done' && 
        item.status !== 'todo' &&
        !workstreamBoardStatuses.includes(item.status)
      ).length;

      // Update stats (preserve visionCount from previous state)
      setStats(prev => ({
        total,
        active,
        completed,
        upNextCount,
        backlogCount,
        workstreamCount,
        visionCount: prev.visionCount // Keep vision count, it's fetched separately
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
    // Extract section from pathname
    let detectedSection: string | null = null;
    
    if (pathname.includes('/stacks/vision')) {
      detectedSection = 'vision';
    } else if (pathname.includes('/stacks/workstream') || pathname.includes('/workstream')) {
      detectedSection = 'workstream';
    } else if (pathname.includes('/sell/pipeline') || pathname.includes('/pipeline/sell')) {
      detectedSection = 'workstream';
    } else if (pathname.includes('/stacks/backlog') || pathname.includes('/backlog')) {
      detectedSection = 'backlog';
    } else if (pathname.includes('/stacks/metrics') || pathname.includes('/metrics')) {
      detectedSection = 'metrics';
    } else if (pathname.includes('/stacks')) {
      // If we're on /stacks but no specific section, default to vision
      detectedSection = 'vision';
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
              <span className="text-lg font-bold text-black">S</span>
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
              <span className="text-xs font-semibold text-black">
                {statsLoading ? '...' : stats.total}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-muted">Active</span>
              <span className="text-xs font-semibold text-black">
                {statsLoading ? '...' : stats.active}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-muted">Completed</span>
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
                    : 'hover:bg-panel-background text-gray-700'
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
    </div>
  );
}


