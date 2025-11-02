"use client";

/**
 * Story Main View
 * 
 * Standard record view similar to lead records - simple and clean with inline editing
 */

import React, { useState, useEffect } from 'react';
import { InlineEditField } from '@/frontend/components/pipeline/InlineEditField';

interface StoryMainViewProps {
  story: any;
  onStoryUpdate?: (updatedStory: any) => void;
}

export function StoryMainView({ story: initialStory, onStoryUpdate }: StoryMainViewProps) {
  const [story, setStory] = useState(initialStory);

  // Update story when prop changes
  useEffect(() => {
    setStory(initialStory);
  }, [initialStory]);

  const handleSave = async (field: string, value: string | any, recordId: string, recordType: string) => {
    try {
      const response = await fetch(`/api/v1/stacks/stories/${recordId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [field]: value
        })
      });

      if (response.ok) {
        const data = await response.json();
        const updatedStory = data.story;
        
        // Update local state
        setStory(updatedStory);
        
        // Notify parent component of update
        if (onStoryUpdate) {
          onStoryUpdate(updatedStory);
        }
        
        console.log('✅ [StoryMainView] Story updated successfully:', field, value);
      } else {
        const errorText = await response.text();
        console.error('❌ [StoryMainView] Failed to update story:', errorText);
        throw new Error('Failed to update story');
      }
    } catch (error) {
      console.error('❌ [StoryMainView] Error updating story:', error);
      throw error;
    }
  };
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };


  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="w-full space-y-6">
        {/* Overview Section */}
        <div className="bg-background rounded-lg border border-border p-6">
          <h3 className="text-sm font-medium text-foreground uppercase tracking-wide border-b border-border pb-2 mb-4">Overview</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted uppercase tracking-wide">Title</label>
                <div className="mt-1">
                  <InlineEditField
                    value={story.title || ''}
                    field="title"
                    recordId={story.id}
                    recordType="stacks"
                    placeholder="Enter title"
                    onSave={handleSave}
                    className="text-sm font-medium text-foreground"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs text-muted uppercase tracking-wide">Status</label>
                <div className="mt-1">
                  <InlineEditField
                    value={story.status || ''}
                    field="status"
                    recordId={story.id}
                    recordType="stacks"
                    inputType="select"
                    options={[
                      { value: 'up-next', label: 'Up Next' },
                      { value: 'in-progress', label: 'In Progress' },
                      { value: 'built', label: 'Built' },
                      { value: 'qa1', label: 'QA1' },
                      { value: 'qa2', label: 'QA2' },
                      { value: 'shipped', label: 'Shipped' }
                    ]}
                    onSave={handleSave}
                    className="text-sm font-medium"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs text-muted uppercase tracking-wide">Priority</label>
                <div className="mt-1">
                  <InlineEditField
                    value={story.priority || ''}
                    field="priority"
                    recordId={story.id}
                    recordType="stacks"
                    inputType="select"
                    options={[
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' },
                      { value: 'urgent', label: 'Urgent' }
                    ]}
                    onSave={handleSave}
                    className="text-sm font-medium"
                  />
                </div>
              </div>

              {story.product && (
                <div>
                  <label className="text-xs text-muted uppercase tracking-wide">Product</label>
                  <div className="text-sm text-foreground mt-1">{story.product}</div>
                </div>
              )}

              {story.section && (
                <div>
                  <label className="text-xs text-muted uppercase tracking-wide">Section</label>
                  <div className="text-sm text-foreground mt-1">{story.section}</div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted uppercase tracking-wide">Assignee</label>
                <div className="text-sm text-foreground mt-1">
                  {story.assignee 
                    ? (typeof story.assignee === 'object' 
                      ? story.assignee.name || `${story.assignee.firstName || ''} ${story.assignee.lastName || ''}`.trim() || story.assignee.email
                      : story.assignee)
                    : 'Unassigned'}
                </div>
              </div>
              
              <div>
                <label className="text-xs text-muted uppercase tracking-wide">Created</label>
                <div className="text-sm text-foreground mt-1">{formatDate(story.createdAt)}</div>
              </div>
              
              <div>
                <label className="text-xs text-muted uppercase tracking-wide">Last Updated</label>
                <div className="text-sm text-foreground mt-1">{formatDate(story.updatedAt)}</div>
              </div>

              {story.epic && (
                <div>
                  <label className="text-xs text-muted uppercase tracking-wide">Epic</label>
                  <div className="text-sm text-foreground mt-1">
                    {typeof story.epic === 'object' ? story.epic.title : story.epic}
                  </div>
                </div>
              )}

              {story.project && (
                <div>
                  <label className="text-xs text-muted uppercase tracking-wide">Project</label>
                  <div className="text-sm text-foreground mt-1">
                    {typeof story.project === 'object' ? story.project.name : story.project}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="bg-background rounded-lg border border-border p-6">
          <h3 className="text-sm font-medium text-foreground uppercase tracking-wide border-b border-border pb-2 mb-4">Description</h3>
          <div className="mt-1">
            <InlineEditField
              value={story.description || ''}
              field="description"
              recordId={story.id}
              recordType="stacks"
              type="textarea"
              placeholder="Enter description"
              onSave={handleSave}
              className="text-sm text-foreground whitespace-pre-wrap"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

