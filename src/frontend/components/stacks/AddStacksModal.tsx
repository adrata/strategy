"use client";

/**
 * Add Stacks Modal Component
 * 
 * Modal for creating new stacks (Story, Epic, or Epoch)
 * with Company or Person context tabs
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

type ContextTab = 'company' | 'person';
type WorkTypeTab = 'story' | 'epic' | 'epoch';

export function AddStacksModal({ isOpen, onClose, onStacksAdded }: AddStacksModalProps) {
  const { ui } = useRevenueOS();
  const { user } = useUnifiedAuth();
  const [activeContextTab, setActiveContextTab] = useState<ContextTab>('company');
  const [activeWorkType, setActiveWorkType] = useState<WorkTypeTab>('story');
  const [isLoading, setIsLoading] = useState(false);

  // Company form data
  const [companyFormData, setCompanyFormData] = useState({
    companyName: '',
    website: '',
    linkedin: ''
  });

  // Person form data
  const [personFormData, setPersonFormData] = useState({
    firstName: '',
    lastName: '',
    jobTitle: '',
    company: ''
  });

  // Stack details (shared)
  const [stackFormData, setStackFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  });

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
      setActiveContextTab('company');
      setActiveWorkType('story');
      setCompanyFormData({ companyName: '', website: '', linkedin: '' });
      setPersonFormData({ firstName: '', lastName: '', jobTitle: '', company: '' });
      setStackFormData({ title: '', description: '', priority: 'medium' });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stackFormData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    setIsLoading(true);

    try {
      // Get workspace ID
      const workspaceId = ui.activeWorkspace?.id;
      if (!workspaceId) {
        alert('No workspace found');
        return;
      }

      // First, get or create project (we'll use a default project for now)
      // In a real implementation, you'd want to let users select/create projects
      const projectResponse = await fetch(`/api/stacks/projects?workspaceId=${workspaceId}`, {
        credentials: 'include'
      });

      let projectId;
      if (projectResponse.ok) {
        const projectsData = await projectResponse.json();
        const projects = projectsData.projects || [];
        // Use first project or create a default one
        if (projects.length > 0) {
          projectId = projects[0].id;
        } else {
          // Create default project
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

      // Determine if we need to create an Epic or Epoch first
      let epicId = null;

      if (activeWorkType === 'epic' || activeWorkType === 'epoch') {
        // For Epic/Epoch, we create them as epics in the system
        // Epoch is treated as a special epic
        const userId = user?.id || '';
        if (!userId) {
          alert('User ID not found');
          setIsLoading(false);
          return;
        }
        const epicResponse = await fetch('/api/stacks/epics', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId,
            userId,
            projectId,
            title: stackFormData.title,
            description: stackFormData.description || undefined,
            priority: stackFormData.priority,
            status: 'todo'
          })
        });

        if (epicResponse.ok) {
          const epicData = await epicResponse.json();
          epicId = epicData.epic?.id;
          onStacksAdded(epicData.epic || epicData);
          onClose();
        } else {
          const error = await epicResponse.json();
          alert(error.error || 'Failed to create epic/epoch');
        }
      } else {
        // Create story directly
        const storyData: any = {
          projectId,
          title: stackFormData.title,
          description: stackFormData.description || undefined,
          status: 'up-next',
          priority: stackFormData.priority
        };

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
          alert(error.error || 'Failed to create stack');
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

  const workTypeDescriptions = {
    story: 'Short work',
    epic: 'Longer work',
    epoch: 'Major work'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--background)] rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                Add Stacks
              </h2>
              <p className="text-sm text-[var(--muted)]">Create a new {workTypeLabels[activeWorkType].toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--hover)] transition-colors"
          >
            <XMarkIcon className="w-4.5 h-4.5 text-[var(--muted)]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Work Type Tabs */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Work Type
            </label>
            <div className="flex gap-1 bg-[var(--panel-background)] rounded-lg p-1">
              <button
                type="button"
                onClick={() => setActiveWorkType('story')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeWorkType === 'story'
                    ? 'text-white shadow-sm bg-blue-600'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover)]'
                }`}
              >
                Story
              </button>
              <button
                type="button"
                onClick={() => setActiveWorkType('epic')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeWorkType === 'epic'
                    ? 'text-white shadow-sm bg-blue-600'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover)]'
                }`}
              >
                Epic
              </button>
              <button
                type="button"
                onClick={() => setActiveWorkType('epoch')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeWorkType === 'epoch'
                    ? 'text-white shadow-sm bg-blue-600'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover)]'
                }`}
              >
                Epoch
              </button>
            </div>
            <p className="text-xs text-[var(--muted)] mt-1">
              {workTypeDescriptions[activeWorkType]}
            </p>
          </div>

          {/* Context Tabs (Company or Person) */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Context
            </label>
            <div className="flex gap-1 bg-[var(--panel-background)] rounded-lg p-1">
              <button
                type="button"
                onClick={() => setActiveContextTab('company')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeContextTab === 'company'
                    ? 'text-white shadow-sm bg-blue-600'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover)]'
                }`}
              >
                Company
              </button>
              <button
                type="button"
                onClick={() => setActiveContextTab('person')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeContextTab === 'person'
                    ? 'text-white shadow-sm bg-blue-600'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover)]'
                }`}
              >
                Person
              </button>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - Context Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                {activeContextTab === 'company' ? 'Company Details' : 'Person Details'}
              </h3>

              {activeContextTab === 'company' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={companyFormData.companyName}
                      onChange={(e) => setCompanyFormData(prev => ({ ...prev, companyName: e.target.value }))}
                      placeholder="Enter company name"
                      className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="text"
                      value={companyFormData.website}
                      onChange={(e) => setCompanyFormData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="Enter website"
                      className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      LinkedIn
                    </label>
                    <input
                      type="text"
                      value={companyFormData.linkedin}
                      onChange={(e) => setCompanyFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                      placeholder="Enter LinkedIn URL"
                      className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={personFormData.firstName}
                        onChange={(e) => setPersonFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="Enter first name"
                        className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={personFormData.lastName}
                        onChange={(e) => setPersonFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Enter last name"
                        className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={personFormData.jobTitle}
                      onChange={(e) => setPersonFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                      placeholder="Enter job title"
                      className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      value={personFormData.company}
                      onChange={(e) => setPersonFormData(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="Enter company"
                      className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Right Column - Stack Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                {workTypeLabels[activeWorkType]} Details
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  ref={titleInputRef}
                  type="text"
                  value={stackFormData.title}
                  onChange={(e) => setStackFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={`Enter ${workTypeLabels[activeWorkType].toLowerCase()} title`}
                  className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={stackFormData.description}
                  onChange={(e) => setStackFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={`Describe the ${workTypeLabels[activeWorkType].toLowerCase()}`}
                  rows={6}
                  className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={stackFormData.priority}
                  onChange={(e) => setStackFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-colors"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--hover)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-700 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : `Create ${workTypeLabels[activeWorkType]}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

