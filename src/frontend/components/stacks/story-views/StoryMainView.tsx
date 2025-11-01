"use client";

/**
 * Story Main View
 * 
 * Standard record view similar to lead records - simple and clean
 */

import React from 'react';
import { 
  TagIcon, 
  UserIcon, 
  CalendarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface StoryMainViewProps {
  story: any;
}

export function StoryMainView({ story }: StoryMainViewProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'up-next': return 'bg-[var(--hover)] text-[var(--foreground)] border border-[var(--border)]';
      case 'in-progress': return 'bg-[var(--hover)] text-[var(--foreground)] border border-[var(--border)]';
      case 'qa1': return 'bg-[var(--hover)] text-[var(--foreground)] border border-[var(--border)]';
      case 'qa2': return 'bg-[var(--hover)] text-[var(--foreground)] border border-[var(--border)]';
      case 'built': return 'bg-[var(--hover)] text-[var(--foreground)] border border-[var(--border)]';
      case 'shipped': return 'bg-[var(--hover)] text-[var(--foreground)] border border-[var(--border)]';
      default: return 'bg-[var(--hover)] text-[var(--foreground)] border border-[var(--border)]';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'bg-[var(--hover)] text-[var(--foreground)] border border-[var(--border)]';
      case 'high': return 'bg-[var(--hover)] text-[var(--foreground)] border border-[var(--border)]';
      case 'medium': return 'bg-[var(--hover)] text-[var(--foreground)] border border-[var(--border)]';
      case 'low': return 'bg-[var(--hover)] text-[var(--foreground)] border border-[var(--border)]';
      default: return 'bg-[var(--hover)] text-[var(--foreground)] border border-[var(--border)]';
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="w-full space-y-6">
        {/* Overview Section */}
        <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] p-6">
          <h3 className="text-sm font-medium text-[var(--foreground)] uppercase tracking-wide border-b border-[var(--border)] pb-2 mb-4">Overview</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Title</label>
                <div className="text-sm text-[var(--foreground)] mt-1">{story.title || 'Not provided'}</div>
              </div>
              
              <div>
                <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Status</label>
                <div className="mt-1">
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded border ${getStatusColor(story.status)}`}>
                    {story.status || 'Not set'}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Priority</label>
                <div className="mt-1">
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded border ${getPriorityColor(story.priority)}`}>
                    {story.priority || 'Not set'}
                  </span>
                </div>
              </div>

              {story.product && (
                <div>
                  <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Product</label>
                  <div className="text-sm text-[var(--foreground)] mt-1">{story.product}</div>
                </div>
              )}

              {story.section && (
                <div>
                  <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Section</label>
                  <div className="text-sm text-[var(--foreground)] mt-1">{story.section}</div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {story.assignee && (
                <div>
                  <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Assignee</label>
                  <div className="text-sm text-[var(--foreground)] mt-1">
                    {typeof story.assignee === 'object' 
                      ? `${story.assignee.firstName || ''} ${story.assignee.lastName || ''}`.trim() || story.assignee.name || story.assignee.email
                      : story.assignee}
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Created</label>
                <div className="text-sm text-[var(--foreground)] mt-1">{formatDate(story.createdAt)}</div>
              </div>
              
              <div>
                <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Last Updated</label>
                <div className="text-sm text-[var(--foreground)] mt-1">{formatDate(story.updatedAt)}</div>
              </div>

              {story.epic && (
                <div>
                  <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Epic</label>
                  <div className="text-sm text-[var(--foreground)] mt-1">
                    {typeof story.epic === 'object' ? story.epic.title : story.epic}
                  </div>
                </div>
              )}

              {story.project && (
                <div>
                  <label className="text-xs text-[var(--muted)] uppercase tracking-wide">Project</label>
                  <div className="text-sm text-[var(--foreground)] mt-1">
                    {typeof story.project === 'object' ? story.project.name : story.project}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description Section */}
        {story.description && (
          <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] p-6">
            <h3 className="text-sm font-medium text-[var(--foreground)] uppercase tracking-wide border-b border-[var(--border)] pb-2 mb-4">Description</h3>
            <div className="text-sm text-[var(--foreground)] whitespace-pre-wrap">
              {story.description}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

