"use client";

/**
 * Story Main View
 * 
 * Standard record view similar to lead records - simple and clean with inline editing
 */

import React, { useState, useEffect } from 'react';
import { InlineEditField } from '@/frontend/components/pipeline/InlineEditField';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { StacksCommentsSection } from './StacksCommentsSection';
import { SuccessMessage } from '@/platform/ui/components/SuccessMessage';

interface StoryMainViewProps {
  story: any;
  onStoryUpdate?: (updatedStory: any) => void;
}

export function StoryMainView({ story: initialStory, onStoryUpdate }: StoryMainViewProps) {
  const [story, setStory] = useState(initialStory);
  const { ui } = useRevenueOS();
  const [workspaceUsers, setWorkspaceUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Update story when prop changes
  useEffect(() => {
    setStory(initialStory);
  }, [initialStory]);

  // Guard against null/undefined story
  if (!story || !story.id) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-muted">Story not found or loading...</div>
      </div>
    );
  }

  // Fetch workspace users for assignee dropdown
  useEffect(() => {
    const fetchWorkspaceUsers = async () => {
      if (!ui.activeWorkspace?.id) return;

      setLoadingUsers(true);
      try {
        const response = await fetch(
          `/api/workspace/users?workspaceId=${ui.activeWorkspace.id}`,
          { credentials: 'include' }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.users) {
            setWorkspaceUsers(data.data.users);
          } else if (Array.isArray(data)) {
            setWorkspaceUsers(data);
          } else if (data.users) {
            setWorkspaceUsers(data.users);
          }
        }
      } catch (error) {
        console.error('Failed to fetch workspace users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchWorkspaceUsers();
  }, [ui.activeWorkspace?.id]);

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
        
        // Show success message
        const fieldName = field === 'isFlagged' ? 'Flag' :
                         field === 'acceptanceCriteria' ? 'Acceptance Criteria' :
                         field === 'description' ? 'Description' :
                         field === 'assigneeId' ? 'Assignee' :
                         field === 'priority' ? 'Priority' :
                         field.charAt(0).toUpperCase() + field.slice(1);
        setSuccessMessage(`${fieldName} updated successfully!`);
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        
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
    <div 
      className="h-full overflow-y-auto p-6 story-main-view-scrollable"
      style={{ 
        scrollbarWidth: 'thin', 
        scrollbarColor: 'rgba(0, 0, 0, 0.3) rgba(0, 0, 0, 0.05)' 
      }}
    >
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
                      { value: 'urgent', label: 'Urgent' },
                      { value: 'high', label: 'High' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'low', label: 'Low' }
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
                <div className="mt-1">
                  <InlineEditField
                    value={story.assignee?.id || ''}
                    field="assigneeId"
                    recordId={story.id}
                    recordType="stacks"
                    inputType="select"
                    options={[
                      { value: '', label: 'Unassigned' },
                      ...(Array.isArray(workspaceUsers) ? workspaceUsers.filter((user: any) => user && user.id).map((user: any) => {
                        // Format name properly: firstName + lastName, fallback to name, then email
                        const displayName = 
                          (user?.firstName && user?.lastName 
                            ? `${user.firstName} ${user.lastName}`.trim()
                            : user?.firstName || user?.lastName || user?.name || user?.email || 'Unknown User');
                        return {
                          value: user.id,
                          label: displayName
                        };
                      }) : [])
                    ]}
                    onSave={handleSave}
                    className="text-sm font-medium"
                  />
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

              {story.epoch && (
                <div>
                  <label className="text-xs text-muted uppercase tracking-wide">Epoch</label>
                  <div className="text-sm text-foreground mt-1">
                    {typeof story.epoch === 'object' ? story.epoch.title : story.epoch}
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

              <div>
                <label className="text-xs text-muted uppercase tracking-wide">Flag</label>
                <div className="mt-1">
                  <InlineEditField
                    value={story.isFlagged ? 'true' : 'false'}
                    field="isFlagged"
                    recordId={story.id}
                    recordType="stacks"
                    inputType="select"
                    options={[
                      { value: 'false', label: 'No' },
                      { value: 'true', label: 'Yes' }
                    ]}
                    onSave={async (field, value, recordId, recordType) => {
                      await handleSave(field, value === 'true', recordId, recordType);
                    }}
                    className="text-sm font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description and Acceptance Criteria Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Description Box - Left */}
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

          {/* Acceptance Criteria Box - Right */}
          <div className="bg-background rounded-lg border border-border p-6">
            <h3 className="text-sm font-medium text-foreground uppercase tracking-wide border-b border-border pb-2 mb-4">Acceptance Criteria</h3>
            <div className="mt-1">
              <InlineEditField
                value={story.acceptanceCriteria || ''}
                field="acceptanceCriteria"
                recordId={story.id}
                recordType="stacks"
                type="textarea"
                placeholder="Enter acceptance criteria"
                onSave={handleSave}
                className="text-sm text-foreground whitespace-pre-wrap"
              />
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <StacksCommentsSection storyId={story.id} />
      </div>
      
      {/* Success Message */}
      <SuccessMessage
        message={successMessage}
        isVisible={showSuccessMessage}
        onClose={() => setShowSuccessMessage(false)}
        type="success"
      />
    </div>
  );
}

