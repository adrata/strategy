"use client";

import React, { useState, useEffect } from 'react';
import { useStacks } from '@/products/stacks/context/StacksProvider';
import { useWorkspaceId } from './utils/workspaceId';
import { StacksItemList } from './StacksItemList';

interface EpicStoriesListProps {
  epicId: string;
  onItemClick: (item: any) => void;
}

export function EpicStoriesList({ epicId, onItemClick }: EpicStoriesListProps) {
  const { stories } = useStacks() || {};
  const workspaceId = useWorkspaceId();
  const [epicStories, setEpicStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchEpicStories = async () => {
      if (!workspaceId || !epicId) {
        // Fallback to filtering from context stories
        const contextStories = stories || [];
        setEpicStories(contextStories.filter((story: any) => story.epicId === epicId));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/v1/stacks/stories?workspaceId=${workspaceId}&epicId=${epicId}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setEpicStories(data.stories || []);
        } else {
          // Fallback to filtering from context stories
          const contextStories = stories || [];
          setEpicStories(contextStories.filter((story: any) => story.epicId === epicId));
        }
      } catch (error) {
        console.error('Failed to fetch epic stories:', error);
        // Fallback to filtering from context stories
        const contextStories = stories || [];
        setEpicStories(contextStories.filter((story: any) => story.epicId === epicId));
      } finally {
        setLoading(false);
      }
    };

    fetchEpicStories();
  }, [workspaceId, epicId, stories]);

  // Convert stories to StacksItem format
  const items = epicStories.map((story: any) => {
    // Determine if story is a bug based on viewType
    const isBug = story.viewType === 'bug';
    
    return {
      id: story.id,
      title: story.title,
      description: story.description || '',
      status: story.status || 'todo',
      priority: story.priority || 'medium',
      type: (isBug ? 'bug' : 'story') as const, // Set type to 'bug' if viewType is 'bug'
      assignee: story.assignee?.name || story.assignee?.email || '',
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (epicStories.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted mb-2">No stories in this epic yet</p>
          <p className="text-sm text-muted">Create stories and assign them to this epic</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <StacksItemList 
        items={items}
        onItemClick={onItemClick}
        searchQuery={searchQuery}
        isLoading={loading}
      />
    </div>
  );
}

