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
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useRouter, usePathname } from 'next/navigation';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { StoryMainView } from './story-views/StoryMainView';
import { generateSlug, extractIdFromSlug } from '@/platform/utils/url-utils';

interface StoryDetailViewProps {
  storyId: string;
  onClose?: () => void;
}

export function StoryDetailView({ storyId, onClose }: StoryDetailViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { ui } = useRevenueOS();
  const [story, setStory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);

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
      // Use browser history for smooth navigation without page reload
      router.back();
    }
  };

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-[var(--hover)] rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 text-[var(--muted)]" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">
                {story.title || 'Untitled Story'}
              </h1>
              <p className="text-sm text-[var(--muted)] mt-1">
                {story.status || 'No status'} • {story.priority || 'No priority'}
              </p>
            </div>
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

