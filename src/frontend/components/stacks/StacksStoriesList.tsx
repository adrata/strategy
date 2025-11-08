"use client";

/**
 * Stacks Stories List View
 * 
 * Displays all stories in a sidebar-style list, similar to Oasis channels
 * Works with left panel (list) and right panel (details) layout
 */

import React, { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useUnifiedAuth } from '@/platform/auth';
import { useStacks } from '@/products/stacks/context/StacksProvider';
import { StacksStory } from './types';
import { STACK_STATUS } from './constants';

interface StacksStoriesListProps {
  onItemClick: (item: any) => void;
  selectedItem?: any;
}

export function StacksStoriesList({ onItemClick, selectedItem }: StacksStoriesListProps) {
  const { user: authUser } = useUnifiedAuth();
  const pathname = usePathname();
  const workspaceSlug = pathname.split('/').filter(Boolean)[0];
  const workspaceId = authUser?.activeWorkspaceId;
  const stacksContext = useStacks();
  
  const [stories, setStories] = useState<StacksStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Use selectedItem from context if not provided as prop
  const currentSelectedItem = selectedItem || stacksContext?.selectedItem;

  // Fetch all stories
  useEffect(() => {
    const fetchStories = async () => {
      if (!workspaceId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/v1/stacks/stories?workspaceId=${workspaceId}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStories(data.stories || []);
        } else {
          console.error('Failed to fetch stories:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching stories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [workspaceId]);

  // Filter and sort stories
  const filteredAndSortedStories = useMemo(() => {
    let filtered = stories;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(story =>
        story.title?.toLowerCase().includes(query) ||
        story.description?.toLowerCase().includes(query) ||
        story.status?.toLowerCase().includes(query) ||
        story.priority?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any = a[sortField as keyof StacksStory];
      let bValue: any = b[sortField as keyof StacksStory];

      // Handle nested objects
      if (sortField === 'assignee' && typeof aValue === 'object') {
        aValue = aValue?.firstName || aValue?.lastName || aValue?.email || '';
      }
      if (sortField === 'assignee' && typeof bValue === 'object') {
        bValue = bValue?.firstName || bValue?.lastName || bValue?.email || '';
      }

      // Handle dates
      if (sortField === 'createdAt' || sortField === 'updatedAt') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      }

      // Handle strings
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
      }
      if (typeof bValue === 'string') {
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [stories, searchQuery, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case STACK_STATUS.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case STACK_STATUS.BUILT:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case STACK_STATUS.UP_NEXT:
      case STACK_STATUS.TODO:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case STACK_STATUS.SHIPPED:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-hover text-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
      case 'urgent':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'low':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-muted';
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary)]"></div>
          <p className="text-muted text-sm">Loading stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background border-r border-border" style={{ width: '320px', minWidth: '320px', maxWidth: '320px' }}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">Stories</h2>
          <p className="text-xs text-muted mt-1">
            {filteredAndSortedStories.length} {filteredAndSortedStories.length === 1 ? 'story' : 'stories'}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search stories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
      </div>

      {/* Stories List */}
      <div className="flex-1 overflow-y-auto">
        {filteredAndSortedStories.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted">
            <p className="text-sm">
              {searchQuery ? 'No stories found matching your search' : 'No stories found'}
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredAndSortedStories.map((story) => {
              const isSelected = currentSelectedItem?.id === story.id;
              
              return (
                <button
                  key={story.id}
                  onClick={() => {
                    onItemClick(story);
                    // Also update context
                    if (stacksContext?.onItemClick) {
                      stacksContext.onItemClick(story);
                    }
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-hover text-foreground border border-border'
                      : 'hover:bg-panel-background text-foreground'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        {/* Bug pill for bug type */}
                        {(story.viewType === 'bug' || story.tags?.includes('bug')) && (
                          <span className="bg-error-bg text-error-text px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0">
                            bug
                          </span>
                        )}
                        <div className="text-sm font-medium text-foreground truncate">
                          {story.title || 'Untitled'}
                        </div>
                      </div>
                      {story.description && (
                        <div className="text-xs text-muted mt-1 line-clamp-2">
                          {story.description}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(story.status)}`}>
                      {story.status || 'todo'}
                    </span>
                    <span className={`text-xs font-medium ${getPriorityColor(story.priority)}`}>
                      {story.priority || 'medium'}
                    </span>
                  </div>
                  
                  {story.assignee && (
                    <div className="text-xs text-muted mt-2">
                      {typeof story.assignee === 'object'
                        ? `${story.assignee.firstName || ''} ${story.assignee.lastName || ''}`.trim() || story.assignee.email || 'Unassigned'
                        : story.assignee}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

