"use client";

/**
 * Add Stacks Modal Component
 * 
 * Simple, clean modal for creating Story, Epic, or Epoch
 * Similar to Add Lead modal - single column, minimal design
 */

import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
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
  
  // Epic search state
  const [epicSearchQuery, setEpicSearchQuery] = useState('');
  const [epicSearchResults, setEpicSearchResults] = useState<any[]>([]);
  const [isSearchingEpics, setIsSearchingEpics] = useState(false);
  const [selectedEpic, setSelectedEpic] = useState<any | null>(null);
  const [showEpicDropdown, setShowEpicDropdown] = useState(false);
  const [showCreateEpicForm, setShowCreateEpicForm] = useState(false);
  const [newEpicTitle, setNewEpicTitle] = useState('');
  
  // Epoch search state
  const [epochSearchQuery, setEpochSearchQuery] = useState('');
  const [epochSearchResults, setEpochSearchResults] = useState<any[]>([]);
  const [isSearchingEpochs, setIsSearchingEpochs] = useState(false);
  const [selectedEpoch, setSelectedEpoch] = useState<any | null>(null);
  const [showEpochDropdown, setShowEpochDropdown] = useState(false);
  const [showCreateEpochForm, setShowCreateEpochForm] = useState(false);
  const [newEpochTitle, setNewEpochTitle] = useState('');

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
      setEpicSearchQuery('');
      setEpochSearchQuery('');
      setSelectedEpic(null);
      setSelectedEpoch(null);
      setEpicSearchResults([]);
      setEpochSearchResults([]);
      setShowEpicDropdown(false);
      setShowEpochDropdown(false);
      setShowCreateEpicForm(false);
      setShowCreateEpochForm(false);
    }
  }, [isOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.epic-search-container') && !target.closest('.epoch-search-container')) {
        setShowEpicDropdown(false);
        setShowEpochDropdown(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const searchEpics = async (query: string) => {
    if (!ui.activeWorkspace?.id || !query.trim()) return;
    
    setIsSearchingEpics(true);
    try {
      const response = await fetch(
        `/api/stacks/epics?workspaceId=${ui.activeWorkspace.id}&search=${encodeURIComponent(query)}`,
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        const epics = data.epics || [];
        const filteredEpics = epics.filter((e: any) => !e.isEpoch);
        setEpicSearchResults(filteredEpics);
        setShowEpicDropdown(true);
      }
    } catch (error) {
      console.error('Error searching epics:', error);
    } finally {
      setIsSearchingEpics(false);
    }
  };

  // Debounced epic search
  useEffect(() => {
    if (!epicSearchQuery.trim()) {
      setEpicSearchResults([]);
      setShowEpicDropdown(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchEpics(epicSearchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epicSearchQuery, ui.activeWorkspace?.id]);

  const searchEpochs = async (query: string) => {
    if (!ui.activeWorkspace?.id || !query.trim()) return;
    
    setIsSearchingEpochs(true);
    try {
      const response = await fetch(
        `/api/stacks/epics?workspaceId=${ui.activeWorkspace.id}&search=${encodeURIComponent(query)}`,
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        const epics = data.epics || [];
        const filteredEpochs = epics.filter((e: any) => e.isEpoch);
        setEpochSearchResults(filteredEpochs);
        setShowEpochDropdown(true);
      }
    } catch (error) {
      console.error('Error searching epochs:', error);
    } finally {
      setIsSearchingEpochs(false);
    }
  };

  // Debounced epoch search
  useEffect(() => {
    if (!epochSearchQuery.trim()) {
      setEpochSearchResults([]);
      setShowEpochDropdown(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchEpochs(epochSearchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epochSearchQuery, ui.activeWorkspace?.id]);

  const handleEpicSelect = (epic: any) => {
    setSelectedEpic(epic);
    setFormData(prev => ({ ...prev, epicId: epic.id }));
    setEpicSearchQuery(epic.title);
    setEpicSearchResults([]);
    setShowEpicDropdown(false);
  };

  const handleEpicRemove = () => {
    setSelectedEpic(null);
    setFormData(prev => ({ ...prev, epicId: '' }));
    setEpicSearchQuery('');
    setEpicSearchResults([]);
  };

  const handleEpochSelect = (epoch: any) => {
    setSelectedEpoch(epoch);
    setFormData(prev => ({ ...prev, epochId: epoch.id }));
    setEpochSearchQuery(epoch.title);
    setEpochSearchResults([]);
    setShowEpochDropdown(false);
  };

  const handleEpochRemove = () => {
    setSelectedEpoch(null);
    setFormData(prev => ({ ...prev, epochId: '' }));
    setEpochSearchQuery('');
    setEpochSearchResults([]);
  };

  const handleCreateEpic = async () => {
    if (!newEpicTitle.trim()) return;
    
    const workspaceId = ui.activeWorkspace?.id;
    if (!workspaceId || !user?.id) return;

    // Get or create project first
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
        const createProjectResponse = await fetch('/api/stacks/projects', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId,
            userId: user.id,
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
      return;
    }

    try {
      const response = await fetch('/api/stacks/epics', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          userId: user.id,
          projectId,
          title: newEpicTitle,
          status: 'todo',
          priority: formData.priority
        })
      });

      if (response.ok) {
        const data = await response.json();
        const newEpic = data.epic;
        handleEpicSelect(newEpic);
        setNewEpicTitle('');
        setShowCreateEpicForm(false);
        // Refresh available epics
        const refreshResponse = await fetch(
          `/api/stacks/epics?workspaceId=${workspaceId}`,
          { credentials: 'include' }
        );
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const epics = refreshData.epics || [];
          setAvailableEpics(epics.filter((e: any) => !e.isEpoch));
        }
      } else {
        alert('Failed to create epic');
      }
    } catch (error) {
      console.error('Error creating epic:', error);
      alert('Error creating epic');
    }
  };

  const handleCreateEpoch = async () => {
    if (!newEpochTitle.trim()) return;
    
    const workspaceId = ui.activeWorkspace?.id;
    if (!workspaceId || !user?.id) return;

    // Get or create project first
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
        const createProjectResponse = await fetch('/api/stacks/projects', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId,
            userId: user.id,
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
      return;
    }

    try {
      const response = await fetch('/api/stacks/epics', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          userId: user.id,
          projectId,
          title: newEpochTitle,
          status: 'todo',
          priority: formData.priority,
          isEpoch: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        const newEpoch = data.epic;
        handleEpochSelect(newEpoch);
        setNewEpochTitle('');
        setShowCreateEpochForm(false);
        // Refresh available epochs
        const refreshResponse = await fetch(
          `/api/stacks/epics?workspaceId=${workspaceId}`,
          { credentials: 'include' }
        );
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const epics = refreshData.epics || [];
          setAvailableEpochs(epics.filter((e: any) => e.isEpoch));
        }
      } else {
        alert('Failed to create epoch');
      }
    } catch (error) {
      console.error('Error creating epoch:', error);
      alert('Error creating epoch');
    }
  };

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
      <div className="bg-[var(--background)] rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              Add Stacks
            </h2>
            <p className="text-sm text-[var(--muted)] mt-1">
              Create a new {workTypeLabels[activeWorkType].toLowerCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--hover)] rounded transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-[var(--muted)]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Work Type Tabs - Minimal */}
          <div>
            <div className="flex gap-2 border-b border-[var(--border)]">
              <button
                type="button"
                onClick={() => setActiveWorkType('story')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeWorkType === 'story'
                    ? 'text-[var(--foreground)] border-b-2 border-[var(--accent)]'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                Story
              </button>
              <button
                type="button"
                onClick={() => setActiveWorkType('epic')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeWorkType === 'epic'
                    ? 'text-[var(--foreground)] border-b-2 border-[var(--accent)]'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                Epic
              </button>
              <button
                type="button"
                onClick={() => setActiveWorkType('epoch')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeWorkType === 'epoch'
                    ? 'text-[var(--foreground)] border-b-2 border-[var(--accent)]'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                Epoch
              </button>
            </div>
          </div>

          {/* Title - Required for all */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              ref={titleInputRef}
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={`Enter ${activeWorkType} title`}
              className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--focus-ring)] focus:border-[var(--accent)] outline-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={`Describe the ${activeWorkType}`}
              rows={4}
              className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--focus-ring)] focus:border-[var(--accent)] outline-none resize-none"
            />
          </div>

          {/* Story-specific fields */}
          {activeWorkType === 'story' && (
            <div className="relative epic-search-container">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Epic
              </label>
              {selectedEpic ? (
                <div className="flex items-center gap-2 p-2 bg-[var(--panel-background)] border border-[var(--border)] rounded-lg">
                  <span className="flex-1 text-sm text-[var(--foreground)]">{selectedEpic.title}</span>
                  <button
                    type="button"
                    onClick={handleEpicRemove}
                    className="p-1 hover:bg-[var(--hover)] rounded transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4 text-[var(--muted)]" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                    <input
                      type="text"
                      value={epicSearchQuery}
                      onChange={(e) => {
                        setEpicSearchQuery(e.target.value);
                        setShowEpicDropdown(true);
                      }}
                      onFocus={() => {
                        if (epicSearchQuery) {
                          searchEpics(epicSearchQuery);
                        }
                      }}
                      placeholder="Search or create epic..."
                      className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--focus-ring)] focus:border-[var(--accent)] outline-none"
                    />
                  </div>
                  {showEpicDropdown && (epicSearchResults.length > 0 || epicSearchQuery.trim() || showCreateEpicForm) && (
                    <div className="absolute z-10 w-full mt-1 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {isSearchingEpics ? (
                        <div className="p-3 text-sm text-[var(--muted)]">Searching...</div>
                      ) : (
                        <>
                          {epicSearchResults.map((epic) => (
                            <button
                              key={epic.id}
                              type="button"
                              onClick={() => handleEpicSelect(epic)}
                              className="w-full text-left px-4 py-2 hover:bg-[var(--hover)] text-sm text-[var(--foreground)]"
                            >
                              {epic.title}
                            </button>
                          ))}
                          {epicSearchResults.length === 0 && epicSearchQuery.trim() && !showCreateEpicForm && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowCreateEpicForm(true);
                                setNewEpicTitle(epicSearchQuery);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-[var(--hover)] text-sm text-blue-600 flex items-center gap-2"
                            >
                              <PlusIcon className="h-4 w-4" />
                              Create "{epicSearchQuery}"
                            </button>
                          )}
                          {showCreateEpicForm && (
                            <div className="p-3 border-t border-gray-200">
                              <input
                                type="text"
                                value={newEpicTitle}
                                onChange={(e) => setNewEpicTitle(e.target.value)}
                                placeholder="Epic title"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-2"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={handleCreateEpic}
                                  className="flex-1 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800"
                                >
                                  Create Epic
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowCreateEpicForm(false);
                                    setNewEpicTitle('');
                                  }}
                                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Epic-specific fields */}
          {activeWorkType === 'epic' && (
            <div className="relative epoch-search-container">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Epoch
              </label>
              {selectedEpoch ? (
                <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-300 rounded-lg">
                  <span className="flex-1 text-sm text-gray-900">{selectedEpoch.title}</span>
                  <button
                    type="button"
                    onClick={handleEpochRemove}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={epochSearchQuery}
                      onChange={(e) => {
                        setEpochSearchQuery(e.target.value);
                        setShowEpochDropdown(true);
                      }}
                      onFocus={() => {
                        if (epochSearchQuery) {
                          searchEpochs(epochSearchQuery);
                        }
                      }}
                      placeholder="Search or create epoch..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none"
                    />
                  </div>
                  {showEpochDropdown && (epochSearchResults.length > 0 || epochSearchQuery.trim() || showCreateEpochForm) && (
                    <div className="absolute z-10 w-full mt-1 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {isSearchingEpochs ? (
                        <div className="p-3 text-sm text-gray-500">Searching...</div>
                      ) : (
                        <>
                          {epochSearchResults.map((epoch) => (
                            <button
                              key={epoch.id}
                              type="button"
                              onClick={() => handleEpochSelect(epoch)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-900"
                            >
                              {epoch.title}
                            </button>
                          ))}
                          {epochSearchResults.length === 0 && epochSearchQuery.trim() && !showCreateEpochForm && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowCreateEpochForm(true);
                                setNewEpochTitle(epochSearchQuery);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-blue-600 flex items-center gap-2"
                            >
                              <PlusIcon className="h-4 w-4" />
                              Create "{epochSearchQuery}"
                            </button>
                          )}
                          {showCreateEpochForm && (
                            <div className="p-3 border-t border-gray-200">
                              <input
                                type="text"
                                value={newEpochTitle}
                                onChange={(e) => setNewEpochTitle(e.target.value)}
                                placeholder="Epoch title"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-2"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={handleCreateEpoch}
                                  className="flex-1 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800"
                                >
                                  Create Epoch
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowCreateEpochForm(false);
                                    setNewEpochTitle('');
                                  }}
                                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
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
              className="px-4 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--hover)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium bg-gray-900 text-white border border-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: 'white' }}
            >
              {isLoading ? 'Creating...' : `Create ${workTypeLabels[activeWorkType]}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
