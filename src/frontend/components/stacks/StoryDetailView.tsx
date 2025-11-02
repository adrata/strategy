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
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useRouter, usePathname } from 'next/navigation';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
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
  const [story, setStory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch story data and redirect to slugged URL if needed
  useEffect(() => {
    const fetchStory = async () => {
      if (!ui.activeWorkspace?.id || !storyId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('🔍 [StoryDetailView] Fetching story:', storyId);
        
        const response = await fetch(
          `/api/v1/stacks/stories/${storyId}`,
          { credentials: 'include' }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.story) {
            console.log('✅ [StoryDetailView] Story loaded:', data.story);
            setStory(data.story);
            
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
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ [StoryDetailView] Failed to fetch story:', response.status, errorData);
          setStory(null);
        }
      } catch (error) {
        console.error('❌ [StoryDetailView] Error fetching story:', error);
        setStory(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [storyId, ui.activeWorkspace?.id, pathname, router, hasRedirected]);

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      // Check if we came from backlog section
      const referrer = typeof window !== 'undefined' ? document.referrer : '';
      const currentPath = pathname;
      const workspaceSlug = currentPath.split('/')[1];
      
      // Check if referrer or current path indicates we came from backlog
      const cameFromBacklog = referrer.includes('/backlog') || 
                             (typeof window !== 'undefined' && 
                              (sessionStorage.getItem('stacks-navigation-source') === 'backlog' ||
                               sessionStorage.getItem('stacks-navigation-source') === 'up-next'));
      
      if (cameFromBacklog && workspaceSlug) {
        // Navigate back to backlog
        router.push(`/${workspaceSlug}/stacks/backlog`);
      } else {
        // Use browser history for smooth navigation without page reload
        router.back();
      }
    }
  };

  const handleUpdate = async () => {
    // This will trigger a save of any pending inline edits
    // The inline edit fields handle their own saves, so this button
    // could be used for manual save triggers or other update actions
    console.log('Update clicked for story:', story?.id);
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

  // Determine section name from pathname
  const getSectionName = () => {
    const pathParts = pathname.split('/').filter(Boolean);
    if (pathParts.includes('backlog')) return 'Backlog';
    if (pathParts.includes('workstream')) return 'Workstream';
    return 'Stacks';
  };

  const nextStatus = story ? getNextStatus(story.status) : null;
  const nextStatusLabel = nextStatus ? formatStatusLabel(nextStatus) : null;

  // Removed view buttons - always use main view

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--background)]">
        <div className="animate-pulse text-[var(--muted)]">Loading story...</div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[var(--background)]">
        <p className="text-[var(--muted)] mb-4">Story not found</p>
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
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-6 border-b border-[var(--border)]">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-4 text-sm">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>All {getSectionName()}</span>
          </button>
          <ChevronRightIcon className="h-4 w-4 text-[var(--muted)]" />
          <span className="font-medium text-[var(--foreground)]">
            {story.title || 'Untitled Story'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">
                {story.title || 'Untitled Story'}
              </h1>
              <p className="text-sm text-[var(--muted)] mt-1">
                {story.status || 'No status'} • {story.priority || 'No priority'}
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleUpdate}
              className="px-4 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--hover)] transition-colors"
            >
              Update
            </button>
            {nextStatus && nextStatusLabel && (
              <button
                onClick={handleAdvanceStatus}
                disabled={isUpdating}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUpdating ? 'Updating...' : `Advance to ${nextStatusLabel}`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <StoryMainView story={story} />
      </div>
    </div>
  );
}

