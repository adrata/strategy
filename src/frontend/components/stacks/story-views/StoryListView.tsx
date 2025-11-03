"use client";

/**
 * Story List View
 * 
 * Simple table/list view for story details
 */

import React from 'react';
import { 
  TagIcon, 
  UserIcon, 
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface StoryListViewProps {
  story: any;
}

export function StoryListView({ story }: StoryListViewProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const fields = [
    { label: 'Title', value: story.title || 'Not provided', icon: TagIcon },
    { label: 'Status', value: story.status || 'Not set', icon: CheckCircleIcon },
    { label: 'Priority', value: story.priority || 'Not set', icon: ClockIcon },
    { 
      label: 'Assignee', 
      value: story.assignee 
        ? (typeof story.assignee === 'object' 
          ? `${story.assignee.firstName || ''} ${story.assignee.lastName || ''}`.trim() || story.assignee.name || story.assignee.email
          : story.assignee)
        : 'Unassigned',
      icon: UserIcon 
    },
    { label: 'Created', value: formatDate(story.createdAt), icon: CalendarIcon },
    { label: 'Updated', value: formatDate(story.updatedAt), icon: CalendarIcon },
  ];

  if (story.description) {
    fields.push({
      label: 'Description',
      value: story.description,
      icon: TagIcon
    });
  }

  if (story.epoch) {
    fields.push({
      label: 'Epoch',
      value: typeof story.epoch === 'object' ? story.epoch.title : story.epoch,
      icon: TagIcon
    });
  }

  if (story.project) {
    fields.push({
      label: 'Project',
      value: typeof story.project === 'object' ? story.project.name : story.project,
      icon: TagIcon
    });
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <table className="w-full border-collapse">
          <tbody className="bg-white rounded-lg border border-border overflow-hidden">
            {fields.map((field, index) => {
              const Icon = field.icon;
              return (
                <tr 
                  key={field.label}
                  className={`border-b border-border last:border-b-0 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-hover'
                  }`}
                >
                  <td className="px-6 py-4 w-48">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted" />
                      <span className="text-sm font-medium text-foreground">
                        {field.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted whitespace-pre-wrap">
                      {field.value}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

