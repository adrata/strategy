"use client";

/**
 * Story Detail View Component
 * 
 * Provides different view types for story details:
 * - Main: Standard record view (similar to lead records)
 * - List: Table/list view
 * - Grid: Excel-like grid view
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon,
  ChevronRightIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline';
import { useRouter, usePathname } from 'next/navigation';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { useUnifiedAuth } from '@/platform/auth';
import { StoryMainView } from './story-views/StoryMainView';
import { generateSlug, extractIdFromSlug } from '@/platform/utils/url-utils';

interface StoryDetailViewProps {
  storyId: string;
  onClose?: () => void;
}

// Helper function to get the next status in the workflow
const getNextStatus = (currentStatus: string): string | null => {
  const workflow: Record<string, string> = {
    'up-next': 'in-progress',
    'todo': 'in-progress',
    'in-progress': 'built',
    'built': 'qa1',
    'qa1': 'qa2',
    'qa2': 'shipped'
  };
  
  return workflow[currentStatus] || null;
};

// Helper function to format status label
const formatStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'up-next': 'Up Next',
    'todo': 'Up Next',
    'in-progress': 'In Progress',
    'built': 'Built',
    'qa1': 'QA1',
    'qa2': 'QA2',
    'shipped': 'Shipped'
  };
  
  return labels[status] || status;
};

export function StoryDetailView({ storyId, onClose }: StoryDetailViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { ui } = useRevenueOS();
  const { user } = useUnifiedAuth();
  const [story, setStory] = useState<any>(null);
  const [storyType, setStoryType] = useState<'story' | 'task'>('story');
  const [loading, setLoading] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [stories, setStories] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  // Fetch stories list for navigation
  useEffect(() => {
    const fetchStories = async () => {
      // Use same fallback logic for consistency
      let workspaceId = ui.activeWorkspace?.id;
      
      if (!workspaceId) {
        const workspaceSlug = pathname.split('/')[1];
        if (workspaceSlug) {
          try {
            const { getWorkspaceIdBySlug } = await import('@/platform/config/workspace-mapping');
            const urlWorkspaceId = getWorkspaceIdBySlug(workspaceSlug);
            if (urlWorkspaceId) {
              workspaceId = urlWorkspaceId;
            }
          } catch (error) {
            console.warn('⚠️ [StoryDetailView] Failed to resolve workspace from URL slug:', error);
          }
        }
      }
      
      if (!workspaceId && user?.activeWorkspaceId) {
        workspaceId = user.activeWorkspaceId;
      }
      
      if (!workspaceId) return;

      try {
        // Add cache-busting to ensure fresh data
        const response = await fetch(
          `/api/v1/stacks/stories?workspaceId=${workspaceId}&t=${Date.now()}`,
          { 
            credentials: 'include',
            cache: 'no-store'
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.stories) {
            setStories(data.stories);
            // Find current story index
            const index = data.stories.findIndex((s: any) => s.id === storyId);
            setCurrentIndex(index >= 0 ? index : null);
          }
        }
      } catch (error) {
        console.error('❌ [StoryDetailView] Error fetching stories:', error);
      }
    };

    fetchStories();
  }, [storyId, ui.activeWorkspace?.id, user?.activeWorkspaceId, pathname]);

  // Fetch story data and redirect to slugged URL if needed
  useEffect(() => {
    const fetchStory = async () => {
      // CRITICAL FIX: Always prioritize URL workspace slug as source of truth
      // This ensures consistent workspace resolution between bug creation and lookup
      // The URL slug is the most reliable source since it's what the user is actually viewing
      const workspaceSlug = pathname.split('/')[1];
      let workspaceId: string | null = null;
      
      // Priority 1: Get from URL workspace slug (MOST RELIABLE - source of truth)
      if (workspaceSlug) {
        try {
          const { getWorkspaceIdBySlug } = await import('@/platform/config/workspace-mapping');
          const urlWorkspaceId = getWorkspaceIdBySlug(workspaceSlug);
          if (urlWorkspaceId) {
            console.log(`🔍 [StoryDetailView] Resolved workspace ID from URL slug "${workspaceSlug}": ${urlWorkspaceId}`);
            workspaceId = urlWorkspaceId;
          }
        } catch (error) {
          console.warn('⚠️ [StoryDetailView] Failed to resolve workspace from URL slug:', error);
        }
      }
      
      // Fallback 2: Use UI active workspace (only if URL slug didn't work)
      if (!workspaceId && ui.activeWorkspace?.id) {
        console.log(`🔍 [StoryDetailView] Using UI activeWorkspace: ${ui.activeWorkspace.id}`);
        workspaceId = ui.activeWorkspace.id;
      }
      
      // Fallback 3: Use user's active workspace ID (last resort)
      if (!workspaceId && user?.activeWorkspaceId) {
        console.log(`🔍 [StoryDetailView] Using user activeWorkspaceId: ${user.activeWorkspaceId}`);
        workspaceId = user.activeWorkspaceId;
      }
      
      if (!workspaceId || !storyId) {
        console.error('❌ [StoryDetailView] No workspace ID available after all fallbacks:', {
          uiActiveWorkspace: ui.activeWorkspace?.id,
          userActiveWorkspaceId: user?.activeWorkspaceId,
          pathname,
          storyId
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('🔍 [StoryDetailView] Fetching story:', {
          storyId,
          workspaceId,
          source: ui.activeWorkspace?.id === workspaceId ? 'ui.activeWorkspace' : 
                  user?.activeWorkspaceId === workspaceId ? 'user.activeWorkspaceId' : 'URL slug',
          uiActiveWorkspaceId: ui.activeWorkspace?.id,
          userActiveWorkspaceId: user?.activeWorkspaceId
        });
        
        // Add cache-busting query parameter and workspaceId to ensure correct workspace lookup
        const response = await fetch(
          `/api/v1/stacks/stories/${storyId}?workspaceId=${workspaceId}&t=${Date.now()}`,
          { 
            credentials: 'include',
            cache: 'no-store'
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.story) {
            console.log('✅ [StoryDetailView] Story/Task loaded:', data.story, 'type:', data.type);
            setStory(data.story);
            setStoryType(data.type || data.story.type || 'story');
            
            // Redirect to slugged URL if current URL is just an ID
            if (data.story.title && !hasRedirected) {
              const pathParts = pathname.split('/').filter(Boolean);
              const lastSegment = pathParts[pathParts.length - 1];
              
              // Check if current URL is just an ID (no title in slug)
              const extractedId = extractIdFromSlug(lastSegment);
              // If the last segment equals the storyId (raw ID), redirect to slugged version
              if (lastSegment === storyId || (extractedId === storyId && !lastSegment.includes('-'))) {
                const workspaceSlug = pathParts[0];
                const slug = generateSlug(data.story.title, storyId);
                const newUrl = `/${workspaceSlug}/stacks/${slug}`;
                
                console.log('🔄 [StoryDetailView] Redirecting to slugged URL:', newUrl);
                setHasRedirected(true);
                router.replace(newUrl);
                return;
              }
            }
          } else {
            console.warn('⚠️ [StoryDetailView] No story in response');
            setStory(null);
            setStoryType('story');
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ [StoryDetailView] Failed to fetch story');
          console.error('❌ [StoryDetailView] Status:', response.status);
          console.error('❌ [StoryDetailView] Story ID:', storyId);
          console.error('❌ [StoryDetailView] Workspace ID:', ui.activeWorkspace?.id);
          console.error('❌ [StoryDetailView] Error data:', errorData);
          setStory(null);
          setStoryType('story');
        }
      } catch (error) {
        console.error('❌ [StoryDetailView] Error fetching story:', error);
        setStory(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [storyId, ui.activeWorkspace?.id, user?.activeWorkspaceId, pathname, router, hasRedirected]);

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      // Check if we came from backlog section
      const referrer = typeof window !== 'undefined' ? document.referrer : '';
      const currentPath = pathname;
      const workspaceSlug = currentPath.split('/')[1];
      
      // Check navigation source from sessionStorage
      const navigationSource = typeof window !== 'undefined' 
        ? sessionStorage.getItem('stacks-navigation-source') 
        : null;
      
      // Check if story status indicates it's a backlog item
      // Backlog statuses include 'up-next', 'todo', 'backlog', and 'deep-backlog'
      const isBacklogStatus = story && (
        story.status === 'up-next' || 
        story.status === 'todo' || 
        story.status === 'backlog' || 
        story.status === 'deep-backlog'
      );
      
      // Check if referrer, navigation source, or story status indicates we came from backlog
      const cameFromBacklog = referrer.includes('/backlog') || 
                             navigationSource === 'backlog' || 
                             navigationSource === 'up-next' ||
                             isBacklogStatus;
      const cameFromEpics = referrer.includes('/epics') || navigationSource === 'epics';
      
      if (cameFromBacklog && workspaceSlug) {
        // Navigate back to backlog
        router.push(`/${workspaceSlug}/stacks/backlog`);
      } else if (cameFromEpics && workspaceSlug) {
        // Navigate back to epics
        router.push(`/${workspaceSlug}/stacks/epics`);
      } else {
        // Default: navigate to workstream (the main stacks view)
        if (workspaceSlug) {
          router.push(`/${workspaceSlug}/stacks`);
        } else {
          // Fallback to browser history if no workspace slug
          router.back();
        }
      }
    }
  };

  const handleUpdate = async () => {
    if (!story?.id) return;
    
    // Resolve workspace ID with fallbacks
    let workspaceId = ui.activeWorkspace?.id;
    if (!workspaceId) {
      const workspaceSlug = pathname.split('/')[1];
      if (workspaceSlug) {
        try {
          const { getWorkspaceIdBySlug } = await import('@/platform/config/workspace-mapping');
          const urlWorkspaceId = getWorkspaceIdBySlug(workspaceSlug);
          if (urlWorkspaceId) {
            workspaceId = urlWorkspaceId;
          }
        } catch (error) {
          console.warn('⚠️ [StoryDetailView] Failed to resolve workspace from URL slug:', error);
        }
      }
    }
    if (!workspaceId && user?.activeWorkspaceId) {
      workspaceId = user.activeWorkspaceId;
    }
    if (!workspaceId) return;
    
    try {
      setIsUpdating(true);
      
      // Fetch fresh story data from API with workspaceId
      const response = await fetch(
        `/api/v1/stacks/stories/${story.id}?workspaceId=${workspaceId}&t=${Date.now()}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.story) {
          setStory(data.story);
          console.log('✅ [StoryDetailView] Story data refreshed');
        }
      } else {
        console.error('❌ [StoryDetailView] Failed to refresh story:', await response.text());
      }
    } catch (error) {
      console.error('❌ [StoryDetailView] Error refreshing story:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAdvanceStatus = async () => {
    if (!story || isUpdating) return;
    
    const nextStatus = getNextStatus(story.status);
    if (!nextStatus) {
      console.warn('Already at final status or invalid status');
      return;
    }

    try {
      setIsUpdating(true);
      const response = await fetch(`/api/v1/stacks/stories/${story.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: nextStatus
        })
      });

      if (response.ok) {
        const data = await response.json();
        setStory(data.story);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to advance status:', errorData);
      }
    } catch (error) {
      console.error('Error advancing status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Determine section name from pathname or navigation source
  const getSectionName = () => {
    // Check navigation source from sessionStorage first
    const navigationSource = typeof window !== 'undefined' 
      ? sessionStorage.getItem('stacks-navigation-source') 
      : null;
    
    // Check if story status indicates it's a backlog item
    // Backlog statuses include 'up-next', 'todo', 'backlog', and 'deep-backlog'
    const isBacklogStatus = story && (
      story.status === 'up-next' || 
      story.status === 'todo' || 
      story.status === 'backlog' || 
      story.status === 'deep-backlog'
    );
    
    if (navigationSource === 'backlog' || navigationSource === 'up-next' || isBacklogStatus) {
      return 'Backlog';
    }
    if (navigationSource === 'epics') {
      return 'Epics';
    }
    
    // Fallback to checking pathname
    const pathParts = pathname.split('/').filter(Boolean);
    if (pathParts.includes('backlog')) return 'Backlog';
    if (pathParts.includes('workstream')) return 'Workstream';
    if (pathParts.includes('epics')) return 'Epics';
    return 'Stacks';
  };

  // Navigation handlers
  const handleNavigatePrevious = () => {
    if (currentIndex === null || currentIndex <= 0 || !stories.length) return;
    
    const previousStory = stories[currentIndex - 1];
    if (previousStory) {
      const workspaceSlug = pathname.split('/').filter(Boolean)[0];
      const slug = generateSlug(previousStory.title || 'Untitled Story', previousStory.id);
      router.push(`/${workspaceSlug}/stacks/${slug}`);
    }
  };

  const handleNavigateNext = () => {
    if (currentIndex === null || currentIndex >= stories.length - 1 || !stories.length) return;
    
    const nextStory = stories[currentIndex + 1];
    if (nextStory) {
      const workspaceSlug = pathname.split('/').filter(Boolean)[0];
      const slug = generateSlug(nextStory.title || 'Untitled Story', nextStory.id);
      router.push(`/${workspaceSlug}/stacks/${slug}`);
    }
  };

  const nextStatus = story ? getNextStatus(story.status) : null;
  const nextStatusLabel = nextStatus ? formatStatusLabel(nextStatus) : null;

  // Removed view buttons - always use main view

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="bg-background border-b border-border px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-loading-bg rounded-full animate-pulse"></div>
            <div>
              <div className="h-8 w-48 bg-loading-bg rounded animate-pulse mb-2"></div>
              <div className="h-4 w-32 bg-loading-bg rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="flex-1 px-6 py-6">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="h-6 w-32 bg-loading-bg rounded animate-pulse"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-loading-bg rounded animate-pulse" style={{ width: i === 4 ? '60%' : '100%' }}></div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-6 w-40 bg-loading-bg rounded animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-4 bg-loading-bg rounded animate-pulse" style={{ width: i === 5 ? '60%' : '100%' }}></div>
                  ))}
                </div>
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-4 bg-loading-bg rounded animate-pulse" style={{ width: i === 5 ? '60%' : '100%' }}></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background">
        <p className="text-muted mb-4">Story or task not found</p>
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Breadcrumb Header */}
      <div className="flex-shrink-0 bg-background border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-muted hover:text-foreground transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>All {getSectionName()}</span>
            </button>
            <ChevronRightIcon className="h-4 w-4 text-muted" />
            <span className="font-medium text-foreground">
              {story.title || 'Untitled Story'}
            </span>
          </div>
          
          {/* Navigation Arrows */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleNavigatePrevious}
              disabled={currentIndex === null || currentIndex <= 0 || !stories.length}
              className={`p-2 rounded-md transition-all duration-200 ${
                currentIndex === null || currentIndex <= 0 || !stories.length
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-foreground hover:text-blue-600 hover:bg-panel-background'
              }`}
              title="Previous story"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleNavigateNext}
              disabled={currentIndex === null || currentIndex >= stories.length - 1 || !stories.length}
              className={`p-2 rounded-md transition-all duration-200 ${
                currentIndex === null || currentIndex >= stories.length - 1 || !stories.length
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-foreground hover:text-blue-600 hover:bg-panel-background'
              }`}
              title="Next story"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="flex-shrink-0 border-b border-border px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Rank Squircle - similar to leads */}
            {currentIndex !== null && (() => {
              // Calculate alphanumeric rank (1A, 2B, etc.)
              // Group stories by priority, then assign letters within each priority group
              const priorityOrder = ['urgent', 'high', 'medium', 'low'];
              const currentStory = stories[currentIndex];
              const currentPriority = currentStory?.priority || 'medium';
              
              // Group stories by priority
              const groupedByPriority: Record<string, any[]> = {};
              stories.forEach((s, idx) => {
                const priority = s.priority || 'medium';
                if (!groupedByPriority[priority]) {
                  groupedByPriority[priority] = [];
                }
                groupedByPriority[priority].push({ ...s, originalIndex: idx });
              });
              
              // Calculate rank within priority group
              let rankNumber = 1;
              for (const priority of priorityOrder) {
                if (priority === currentPriority) {
                  const groupStories = groupedByPriority[priority] || [];
                  const storyInGroup = groupStories.find(s => s.id === currentStory?.id);
                  const letterIndex = storyInGroup ? groupStories.indexOf(storyInGroup) : 0;
                  const letter = String.fromCharCode(65 + letterIndex); // A, B, C, etc.
                  
                  // Calculate the base number: count stories in higher priority groups
                  let baseNumber = 1;
                  for (const higherPriority of priorityOrder) {
                    if (higherPriority === priority) break;
                    baseNumber += (groupedByPriority[higherPriority]?.length || 0);
                  }
                  
                  // If there are multiple stories in the same priority group, use the same number
                  rankNumber = baseNumber;
                  const rankDisplay = `${rankNumber}${letter}`;
                  
                  return (
                    <div className="w-10 h-10 bg-background border border-border rounded-xl flex items-center justify-center overflow-hidden relative">
                      <span className="text-sm font-semibold text-foreground">
                        {rankDisplay}
                      </span>
                    </div>
                  );
                }
                rankNumber += (groupedByPriority[priority]?.length || 0);
              }
              
              // Fallback to numeric if calculation fails
              return (
                <div className="w-10 h-10 bg-background border border-border rounded-xl flex items-center justify-center overflow-hidden relative">
                  <span className="text-sm font-semibold text-foreground">
                    {currentIndex + 1}
                  </span>
                </div>
              );
            })()}
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {story.title || 'Untitled Story'}
              </h1>
              <p className="text-sm text-muted mt-1">
                {story.status || 'No status'} • {story.priority || 'No priority'}
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUpdating ? 'Refreshing...' : (() => {
                try {
                  // Bugs are tasks with type='bug' - check type field first
                  // Also check tags as fallback since API adds 'bug' tag for bugs
                  if (story?.type === 'bug' || story?.tags?.includes('bug')) {
                    return 'Update Bug';
                  }
                  
                  // Regular tasks have type='task'
                  if (story?.type === 'task' || storyType === 'task') {
                    return 'Update Task';
                  }
                  
                  // Stories use viewType or default to 'Story'
                  const viewType = story?.viewType || 'detail';
                  const typeMap: Record<string, string> = {
                    'bug': 'Bug',
                    'task': 'Task',
                    'story': 'Story',
                    'detail': 'Story'
                  };
                  return `Update ${typeMap[viewType] || 'Story'}`;
                } catch {
                  return 'Update Story';
                }
              })()}
            </button>
            {nextStatus && nextStatusLabel && (
              <button
                onClick={handleAdvanceStatus}
                disabled={isUpdating}
                className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUpdating ? 'Updating...' : (
                  <>
                    Advance to <span className="italic">{nextStatusLabel}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {story ? (
          <StoryMainView 
            story={story} 
            onStoryUpdate={(updatedStory) => {
              // Update story state when child component saves
              setStory(updatedStory);
            }}
          />
        ) : (
          <div className="p-6 text-muted">Loading story details...</div>
        )}
      </div>
    </div>
  );
}

