"use client";

/**
 * Add Stacks Modal Component
 * 
 * Simple, clean modal for creating Story, Epic, or Epoch
 * Similar to Add Lead modal - single column, minimal design
 */

import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { useUnifiedAuth } from '@/platform/auth';

interface AddStacksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStacksAdded: (stacks: any) => void;
}

type WorkTypeTab = 'story' | 'epic' | 'epoch';

export function AddStacksModal({ isOpen, onClose, onStacksAdded }: AddStacksModalProps) {
  const { ui } = useRevenueOS();
  const { user } = useUnifiedAuth();
  const [activeWorkType, setActiveWorkType] = useState<WorkTypeTab>('story');
  const [isLoading, setIsLoading] = useState(false);

  // Form data - different fields for different types
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    // Story-specific
    epicId: '',
    // Epic-specific
    epochId: '',
    // Epoch-specific
    goal: '',
    timeframe: ''
  });

  // Fetch available epics and epochs for selection
  const [availableEpics, setAvailableEpics] = useState<any[]>([]);
  const [availableEpochs, setAvailableEpochs] = useState<any[]>([]);

  useEffect(() => {
    const fetchEpicsAndEpochs = async () => {
      if (!ui.activeWorkspace?.id) return;

      try {
        // Fetch epics
        const response = await fetch(
          `/api/stacks/epics?workspaceId=${ui.activeWorkspace.id}`,
          { credentials: 'include' }
        );

        if (response.ok) {
          const data = await response.json();
          const epics = data.epics || [];
          setAvailableEpics(epics.filter((e: any) => !e.isEpoch));
          setAvailableEpochs(epics.filter((e: any) => e.isEpoch));
        }
      } catch (error) {
        console.error('Failed to fetch epics/epochs:', error);
      }
    };

    if (isOpen) {
      fetchEpicsAndEpochs();
    }
  }, [isOpen, ui.activeWorkspace?.id]);

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus title input when modal opens
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveWorkType('story');
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        epicId: '',
        epochId: '',
        goal: '',
        timeframe: ''
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    setIsLoading(true);

    try {
      const workspaceId = ui.activeWorkspace?.id;
      if (!workspaceId) {
        alert('No workspace found');
        return;
      }

      // Get or create project
      const projectResponse = await fetch(`/api/stacks/projects?workspaceId=${workspaceId}`, {
        credentials: 'include'
      });

      let projectId;
      if (projectResponse.ok) {
        const projectsData = await projectResponse.json();
        const projects = projectsData.projects || [];
        if (projects.length > 0) {
          projectId = projects[0].id;
        } else {
          const userId = user?.id || '';
          if (!userId) {
            alert('User ID not found');
            setIsLoading(false);
            return;
          }
          const createProjectResponse = await fetch('/api/stacks/projects', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workspaceId,
              userId,
              name: 'Default Project',
              description: 'Default project for stacks'
            })
          });
          if (createProjectResponse.ok) {
            const newProject = await createProjectResponse.json();
            projectId = newProject.project?.id;
          }
        }
      }

      if (!projectId) {
        alert('Failed to get or create project');
        setIsLoading(false);
        return;
      }

      if (activeWorkType === 'story') {
        // Create story
        const storyData: any = {
          projectId,
          title: formData.title,
          description: formData.description || undefined,
          status: 'up-next',
          priority: formData.priority
        };

        if (formData.epicId) {
          storyData.epicId = formData.epicId;
        }

        const response = await fetch('/api/v1/stacks/stories', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(storyData)
        });

        if (response.ok) {
          const data = await response.json();
          onStacksAdded(data.story || data);
          onClose();
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to create story');
        }
      } else if (activeWorkType === 'epic') {
        // Create epic
        const userId = user?.id || '';
        if (!userId) {
          alert('User ID not found');
          setIsLoading(false);
          return;
        }

        const epicData: any = {
          workspaceId,
          userId,
          projectId,
          title: formData.title,
          description: formData.description || undefined,
          priority: formData.priority,
          status: 'todo'
        };

        if (formData.epochId) {
          epicData.epochId = formData.epochId;
        }

        const response = await fetch('/api/stacks/epics', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(epicData)
        });

        if (response.ok) {
          const data = await response.json();
          onStacksAdded(data.epic || data);
          onClose();
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to create epic');
        }
      } else if (activeWorkType === 'epoch') {
        // Create epoch (as epic with epoch flag)
        const userId = user?.id || '';
        if (!userId) {
          alert('User ID not found');
          setIsLoading(false);
          return;
        }

        const epochData: any = {
          workspaceId,
          userId,
          projectId,
          title: formData.title,
          description: formData.description || undefined,
          priority: formData.priority,
          status: 'todo',
          isEpoch: true,
          goal: formData.goal || undefined,
          timeframe: formData.timeframe || undefined
        };

        const response = await fetch('/api/stacks/epics', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(epochData)
        });

        if (response.ok) {
          const data = await response.json();
          onStacksAdded(data.epic || data);
          onClose();
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to create epoch');
        }
      }
    } catch (error) {
      console.error('Error creating stack:', error);
      alert('Error creating stack. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const workTypeLabels = {
    story: 'Story',
    epic: 'Epic',
    epoch: 'Epoch'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Add {workTypeLabels[activeWorkType]}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Create a new {workTypeLabels[activeWorkType].toLowerCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Work Type Tabs - Minimal */}
          <div>
            <div className="flex gap-2 border-b border-gray-200">
              <button
                type="button"
                onClick={() => setActiveWorkType('story')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeWorkType === 'story'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Story
              </button>
              <button
                type="button"
                onClick={() => setActiveWorkType('epic')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeWorkType === 'epic'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Epic
              </button>
              <button
                type="button"
                onClick={() => setActiveWorkType('epoch')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeWorkType === 'epoch'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Epoch
              </button>
            </div>
          </div>

          {/* Title - Required for all */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              ref={titleInputRef}
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={`Enter ${activeWorkType} title`}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={`Describe the ${activeWorkType}`}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none resize-none"
            />
          </div>

          {/* Story-specific fields */}
          {activeWorkType === 'story' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Epic (optional)
              </label>
              <select
                value={formData.epicId}
                onChange={(e) => setFormData(prev => ({ ...prev, epicId: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none"
              >
                <option value="">None</option>
                {availableEpics.map((epic) => (
                  <option key={epic.id} value={epic.id}>
                    {epic.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Epic-specific fields */}
          {activeWorkType === 'epic' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Epoch (optional)
              </label>
              <select
                value={formData.epochId}
                onChange={(e) => setFormData(prev => ({ ...prev, epochId: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none"
              >
                <option value="">None</option>
                {availableEpochs.map((epoch) => (
                  <option key={epoch.id} value={epoch.id}>
                    {epoch.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Epoch-specific fields */}
          {activeWorkType === 'epoch' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal
                </label>
                <input
                  type="text"
                  value={formData.goal}
                  onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                  placeholder="What is the main goal of this epoch?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeframe
                </label>
                <input
                  type="text"
                  value={formData.timeframe}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeframe: e.target.value }))}
                  placeholder="e.g., Q1 2024, 6 months"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none"
                />
              </div>
            </>
          )}

          {/* Priority - Common field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : `Create ${workTypeLabels[activeWorkType]}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
