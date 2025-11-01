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
  Squares2X2Icon, 
  ListBulletIcon, 
  TableCellsIcon,
  ArrowLeftIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { StoryMainView } from './story-views/StoryMainView';
import { StoryListView } from './story-views/StoryListView';
import { StoryGridView } from './story-views/StoryGridView';

interface StoryDetailViewProps {
  storyId: string;
  onClose?: () => void;
}

type ViewType = 'main' | 'list' | 'grid';

export function StoryDetailView({ storyId, onClose }: StoryDetailViewProps) {
  const router = useRouter();
  const { ui } = useRevenueOS();
  const [viewType, setViewType] = useState<ViewType>('main');
  const [story, setStory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch story data
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
  }, [storyId, ui.activeWorkspace?.id]);

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      // Navigate back to stacks
      const workspaceSlug = window.location.pathname.split('/')[1];
      router.push(`/${workspaceSlug}/stacks/workstream`);
    }
  };

  const viewButtons = [
    { type: 'main' as ViewType, label: 'Main', icon: Squares2X2Icon },
    { type: 'list' as ViewType, label: 'List', icon: ListBulletIcon },
    { type: 'grid' as ViewType, label: 'Grid', icon: TableCellsIcon },
  ];

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
      <div className="flex-shrink-0 p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
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
          
          {/* View Type Selector */}
          <div className="flex items-center gap-2 bg-[var(--panel-background)] rounded-lg p-1 border border-[var(--border)]">
            {viewButtons.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => setViewType(type)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  viewType === type
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover)]'
                }`}
                title={`Switch to ${label} view`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {viewType === 'main' && <StoryMainView story={story} />}
        {viewType === 'list' && <StoryListView story={story} />}
        {viewType === 'grid' && <StoryGridView story={story} />}
      </div>
    </div>
  );
}

