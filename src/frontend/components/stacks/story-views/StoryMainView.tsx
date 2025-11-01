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
      case 'up-next': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'qa1': return 'bg-purple-100 text-purple-800';
      case 'qa2': return 'bg-indigo-100 text-indigo-800';
      case 'built': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Overview Section */}
        <div className="bg-white rounded-lg border border-[var(--border)] p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Overview</h2>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <TagIcon className="w-5 h-5 text-[var(--muted)]" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-[var(--foreground)] block mb-1">Title</span>
                  <span className="text-sm text-[var(--muted)]">{story.title || 'Not provided'}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <DocumentTextIcon className="w-5 h-5 text-[var(--muted)]" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-[var(--foreground)] block mb-1">Status</span>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(story.status)}`}>
                    {story.status || 'Not set'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-[var(--muted)]" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-[var(--foreground)] block mb-1">Priority</span>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(story.priority)}`}>
                    {story.priority || 'Not set'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {story.assignee && (
                <div className="flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-[var(--muted)]" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-[var(--foreground)] block mb-1">Assignee</span>
                    <span className="text-sm text-[var(--muted)]">
                      {typeof story.assignee === 'object' 
                        ? `${story.assignee.firstName || ''} ${story.assignee.lastName || ''}`.trim() || story.assignee.name || story.assignee.email
                        : story.assignee}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-[var(--muted)]" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-[var(--foreground)] block mb-1">Created</span>
                  <span className="text-sm text-[var(--muted)]">{formatDate(story.createdAt)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <ClockIcon className="w-5 h-5 text-[var(--muted)]" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-[var(--foreground)] block mb-1">Last Updated</span>
                  <span className="text-sm text-[var(--muted)]">{formatDate(story.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        {story.description && (
          <div className="bg-white rounded-lg border border-[var(--border)] p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Description</h2>
            <div className="prose prose-sm max-w-none">
              <p className="text-[var(--foreground)] whitespace-pre-wrap">
                {story.description}
              </p>
            </div>
          </div>
        )}

        {/* Additional Details */}
        <div className="bg-white rounded-lg border border-[var(--border)] p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Details</h2>
          
          <div className="grid grid-cols-2 gap-6">
            {story.epic && (
              <div className="flex items-center gap-3">
                <TagIcon className="w-5 h-5 text-[var(--muted)]" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-[var(--foreground)] block mb-1">Epic</span>
                  <span className="text-sm text-[var(--muted)]">
                    {typeof story.epic === 'object' ? story.epic.title : story.epic}
                  </span>
                </div>
              </div>
            )}
            
            {story.project && (
              <div className="flex items-center gap-3">
                <TagIcon className="w-5 h-5 text-[var(--muted)]" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-[var(--foreground)] block mb-1">Project</span>
                  <span className="text-sm text-[var(--muted)]">
                    {typeof story.project === 'object' ? story.project.name : story.project}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

