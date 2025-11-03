"use client";

/**
 * Story Grid View
 * 
 * Excel-like grid view for story details
 */

import React, { useState, useMemo } from 'react';
import { DataGrid } from '@/app/[workspace]/database/components/DataGrid';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';

interface StoryGridViewProps {
  story: any;
}

export function StoryGridView({ story }: StoryGridViewProps) {
  const { ui } = useRevenueOS();

  // Transform story data into grid format
  const gridData = useMemo(() => {
    if (!story) return null;

    // Create a single-row grid with story details
    const row: Record<string, any> = {
      id: story.id || '',
      title: story.title || '',
      description: story.description || '',
      status: story.status || '',
      priority: story.priority || '',
      assignee: story.assignee 
        ? (typeof story.assignee === 'object' 
          ? `${story.assignee.firstName || ''} ${story.assignee.lastName || ''}`.trim() || story.assignee.name || story.assignee.email
          : story.assignee)
        : 'Unassigned',
      epoch: story.epoch 
        ? (typeof story.epoch === 'object' ? story.epoch.title : story.epoch)
        : '',
      project: story.project 
        ? (typeof story.project === 'object' ? story.project.name : story.project)
        : '',
      createdAt: story.createdAt || '',
      updatedAt: story.updatedAt || '',
    };

    return {
      rows: [row],
      columns: Object.keys(row).map(key => ({
        key,
        name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim(),
        type: typeof row[key],
        width: 150,
        sortable: true,
        filterable: true,
        editable: true
      })),
      totalCount: 1
    };
  }, [story]);

  if (!gridData || !ui.activeWorkspace?.id) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-muted">Loading grid view...</div>
      </div>
    );
  }

  // For now, we'll show a simplified grid-like table
  // If you have the full DataGrid component, we can use it here
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          {/* Grid Header */}
          <div className="grid grid-cols-5 gap-0 border-b border-border bg-hover">
            {gridData.columns.slice(0, 5).map((col) => (
              <div
                key={col.key}
                className="px-4 py-3 text-sm font-semibold text-foreground border-r border-border last:border-r-0"
              >
                {col.name}
              </div>
            ))}
          </div>

          {/* Grid Rows */}
          {gridData.rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="grid grid-cols-5 gap-0 border-b border-border last:border-b-0 hover:bg-hover"
            >
              {gridData.columns.slice(0, 5).map((col) => (
                <div
                  key={col.key}
                  className="px-4 py-3 text-sm text-foreground border-r border-border last:border-r-0 overflow-hidden text-ellipsis whitespace-nowrap"
                  title={String(row[col.key] || '')}
                >
                  {String(row[col.key] || '')}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Additional columns if more than 5 */}
        {gridData.columns.length > 5 && (
          <div className="mt-4 bg-white rounded-lg border border-border overflow-hidden">
            <div className="grid grid-cols-5 gap-0 border-b border-border bg-hover">
              {gridData.columns.slice(5).map((col) => (
                <div
                  key={col.key}
                  className="px-4 py-3 text-sm font-semibold text-foreground border-r border-border last:border-r-0"
                >
                  {col.name}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-0">
              {gridData.columns.slice(5).map((col) => (
                <div
                  key={col.key}
                  className="px-4 py-3 text-sm text-foreground border-r border-border last:border-r-0 overflow-hidden text-ellipsis whitespace-nowrap"
                  title={String(gridData.rows[0]?.[col.key] || '')}
                >
                  {String(gridData.rows[0]?.[col.key] || '')}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

