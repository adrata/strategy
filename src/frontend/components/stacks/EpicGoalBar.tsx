"use client";

import React, { useState, useEffect } from 'react';
import { Progress } from '@/platform/shared/components/ui/progress';
import { useWorkspaceId } from './utils/workspaceId';

interface EpicGoalBarProps {
  epicId: string;
}

interface EpicStats {
  totalStories: number;
  completedStories: number;
  progress: number;
}

export function EpicGoalBar({ epicId }: EpicGoalBarProps) {
  const workspaceId = useWorkspaceId();
  const [stats, setStats] = useState<EpicStats>({
    totalStories: 0,
    completedStories: 0,
    progress: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEpicStats = async () => {
      if (!workspaceId || !epicId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch stories for this epic
        const response = await fetch(`/api/v1/stacks/stories?workspaceId=${workspaceId}&epicId=${epicId}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const stories = data.stories || [];
          const totalStories = stories.length;
          const completedStories = stories.filter((story: any) => 
            story.status === 'done' || story.status === 'completed' || story.status === 'shipped'
          ).length;
          const progress = totalStories > 0 ? Math.round((completedStories / totalStories) * 100) : 0;

          setStats({
            totalStories,
            completedStories,
            progress
          });
        }
      } catch (error) {
        console.error('Failed to fetch epic stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEpicStats();
  }, [workspaceId, epicId]);

  if (loading) {
    return (
      <div className="w-full">
        <div className="h-2 bg-loading-bg rounded-full animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">Progress</span>
        <span className="text-sm text-muted">
          {stats.completedStories} / {stats.totalStories} stories ({stats.progress}%)
        </span>
      </div>
      <Progress value={stats.progress} className="h-2" />
    </div>
  );
}

