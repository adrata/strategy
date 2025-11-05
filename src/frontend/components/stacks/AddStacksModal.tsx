"use client";

/**
 * Add Stacks Modal Component
 * 
 * Simple, clean modal for creating Story, Bug, or Epic
 * Similar to Add Lead modal - single column, minimal design
 */

import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { useUnifiedAuth } from '@/platform/auth';
import { Select } from '@/platform/ui/components/Select';

interface AddStacksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStacksAdded: (stacks: any) => void;
}

type WorkTypeTab = 'story' | 'bug' | 'epic';

export function AddStacksModal({ isOpen, onClose, onStacksAdded }: AddStacksModalProps) {
  const { ui } = useRevenueOS();
  const { user } = useUnifiedAuth();
  const [activeWorkType, setActiveWorkType] = useState<WorkTypeTab>('story');
  const [isLoading, setIsLoading] = useState(false);

  // Check if we're in Notary Everyday workspace (check by workspace slug 'ne')
  const workspaceSlug = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : '';
  const isNotaryEveryday = workspaceSlug === 'ne';

  // Form data - different fields for different types
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    product: '' as '' | 'API' | 'RevenueOS' | 'Workshop' | 'Adrata' | 'Oasis' | 'Stacks',
    section: '',
    status: 'up-next' as 'up-next' | 'todo' | 'in-progress' | 'built' | 'qa1' | 'qa2' | 'shipped',
    assigneeId: '',
    points: '',
    // Epic-specific (epochId is used for linking epics to epochs)
    epochId: ''
  });

  // Workspace users for assignee dropdown
  const [workspaceUsers, setWorkspaceUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch available epics for selection
  const [availableEpics, setAvailableEpics] = useState<any[]>([]);
  
  // Epic search state
  const [epicSearchQuery, setEpicSearchQuery] = useState('');
  const [epicSearchResults, setEpicSearchResults] = useState<any[]>([]);
  const [isSearchingEpics, setIsSearchingEpics] = useState(false);
  const [selectedEpic, setSelectedEpic] = useState<any | null>(null);
  const [showEpicDropdown, setShowEpicDropdown] = useState(false);
  const [showCreateEpicForm, setShowCreateEpicForm] = useState(false);
  const [newEpicTitle, setNewEpicTitle] = useState('');

  useEffect(() => {
    const fetchEpics = async () => {
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
        }
      } catch (error) {
        console.error('Failed to fetch epics:', error);
      }
    };

    if (isOpen) {
      fetchEpics();
    }
  }, [isOpen, ui.activeWorkspace?.id]);

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

    if (isOpen) {
      fetchWorkspaceUsers();
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

  // RevenueOS sections for the section dropdown
  const revenueOSSections = [
    { value: 'speedrun', label: 'Speedrun' },
    { value: 'leads', label: 'Leads' },
    { value: 'prospects', label: 'Prospects' },
    { value: 'opportunities', label: 'Opportunities' },
    { value: 'clients', label: 'Clients' },
    { value: 'people', label: 'People' },
    { value: 'companies', label: 'Companies' },
    { value: 'partners', label: 'Partners' },
    { value: 'chronicle', label: 'Chronicle' },
    { value: 'metrics', label: 'Metrics' },
    { value: 'dashboard', label: 'Dashboard' }
  ];

  // Reset form when modal closes or when switching tabs
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      product: '',
      section: '',
      status: 'up-next',
      assigneeId: '',
      epochId: ''
    });
    setEpicSearchQuery('');
    setSelectedEpic(null);
    setEpicSearchResults([]);
    setShowEpicDropdown(false);
    setShowCreateEpicForm(false);
  };

  useEffect(() => {
    if (!isOpen) {
      setActiveWorkType('story');
      resetForm();
    }
  }, [isOpen]);

  // Reset form when switching tabs
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkType]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.epic-search-container')) {
        setShowEpicDropdown(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
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

  const handleEpicSelect = (epic: any) => {
    setSelectedEpic(epic);
    setFormData(prev => ({ ...prev, epochId: epic.id }));
    setEpicSearchQuery(epic.title);
    setEpicSearchResults([]);
    setShowEpicDropdown(false);
  };

  const handleEpicRemove = () => {
    setSelectedEpic(null);
    setFormData(prev => ({ ...prev, epochId: '' }));
    setEpicSearchQuery('');
    setEpicSearchResults([]);
  };

  const handleCreateEpic = async () => {
    if (!newEpicTitle.trim()) return;
    
    const workspaceId = ui.activeWorkspace?.id;
    if (!workspaceId || !user?.id) return;

    try {
      // API will auto-create project if needed
      const response = await fetch('/api/stacks/epics', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          userId: user.id,
          title: newEpicTitle,
          status: 'todo'
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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    setIsLoading(true);

    try {
      // Resolve workspace ID with fallback logic (same as other Stacks components)
      let workspaceId = ui.activeWorkspace?.id;
      
      // Fallback 1: Get from URL workspace slug if UI workspace is missing
      if (!workspaceId && workspaceSlug) {
        const { getWorkspaceIdBySlug } = await import('@/platform/config/workspace-mapping');
        const urlWorkspaceId = getWorkspaceIdBySlug(workspaceSlug);
        if (urlWorkspaceId) {
          console.log(`🔍 [AddStacksModal] Resolved workspace ID from URL slug "${workspaceSlug}": ${urlWorkspaceId}`);
          workspaceId = urlWorkspaceId;
        }
      }
      
      // Fallback 2: Use user's active workspace ID
      if (!workspaceId && user?.activeWorkspaceId) {
        console.log(`🔍 [AddStacksModal] Using user activeWorkspaceId: ${user.activeWorkspaceId}`);
        workspaceId = user.activeWorkspaceId;
      }
      
      if (!workspaceId) {
        alert('No workspace found. Please try refreshing the page.');
        console.error('❌ [AddStacksModal] No workspace ID available after all fallbacks');
        setIsLoading(false);
        return;
      }
      
      console.log('✅ [AddStacksModal] Using workspace ID:', workspaceId);

      if (activeWorkType === 'story') {
        // Create story - API will auto-create project if needed
        const storyData: any = {
          title: formData.title,
          description: formData.description || undefined,
          status: formData.status
        };

        if (formData.product) {
          storyData.product = formData.product;
        }
        if (formData.section) {
          storyData.section = formData.section;
        }
        if (formData.assigneeId) {
          storyData.assigneeId = formData.assigneeId;
        }
        if (formData.points && formData.points.trim()) {
          const pointsValue = parseInt(formData.points, 10);
          if (!isNaN(pointsValue) && pointsValue > 0) {
            storyData.points = pointsValue;
          }
        }
        // Note: projectId is auto-created by API if not provided
        // Pass workspaceId as query param to ensure correct workspace is used
        const apiUrl = `/api/v1/stacks/stories?workspaceId=${workspaceId}`;
        console.log('📤 [AddStacksModal] Creating story with workspaceId:', workspaceId);

        const response = await fetch(apiUrl, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(storyData)
        });

        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          onStacksAdded(data.story || data);
          onClose();
        } else {
          let errorMessage = 'Failed to create story';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            // Response might not be valid JSON
            const text = await response.text().catch(() => '');
            errorMessage = text || `Failed to create story (${response.status})`;
          }
          alert(errorMessage);
        }
      } else if (activeWorkType === 'bug') {
        // Create bug as task with type='bug' - API will auto-create project if needed
        const bugData: any = {
          title: formData.title,
          description: formData.description || undefined,
          status: 'up-next', // Bugs always default to 'up-next'
          type: 'bug',
          storyId: null
        };

        if (formData.product) {
          bugData.product = formData.product;
        }
        if (formData.section) {
          bugData.section = formData.section;
        }
        if (formData.assigneeId) {
          bugData.assigneeId = formData.assigneeId;
        }

        const response = await fetch('/api/stacks/tasks', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bugData)
        });

        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          onStacksAdded(data.task || data);
          onClose();
        } else {
          let errorMessage = 'Failed to create bug';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            // Response might not be valid JSON
            const text = await response.text().catch(() => '');
            errorMessage = text || `Failed to create bug (${response.status})`;
          }
          alert(errorMessage);
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
          // projectId will be auto-created by API if not provided
          title: formData.title,
          description: formData.description || undefined,
          status: 'todo'
        };

        if (formData.product) {
          epicData.product = formData.product;
        }
        if (formData.section) {
          epicData.section = formData.section;
        }
        if (formData.epochId) {
          epicData.epochId = formData.epochId;
        }
        if (formData.assigneeId) {
          epicData.assigneeId = formData.assigneeId;
        }

        const response = await fetch('/api/stacks/epics', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(epicData)
        });

        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          onStacksAdded(data.epic || data);
          onClose();
        } else {
          let errorMessage = 'Failed to create epic';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            // Response might not be valid JSON
            const text = await response.text().catch(() => '');
            errorMessage = text || `Failed to create epic (${response.status})`;
          }
          alert(errorMessage);
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
    bug: 'Bug',
    epic: 'Epic'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Add Stacks
            </h2>
            <p className="text-sm text-muted mt-1">
              Create a new {workTypeLabels[activeWorkType].toLowerCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-hover rounded transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-muted" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Work Type Tabs - Minimal */}
          <div>
            <div className="flex gap-2 border-b border-border">
              <button
                type="button"
                onClick={() => setActiveWorkType('story')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeWorkType === 'story'
                    ? 'text-foreground border-b-2 border-primary'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                Story
              </button>
              <button
                type="button"
                onClick={() => setActiveWorkType('bug')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeWorkType === 'bug'
                    ? 'text-foreground border-b-2 border-primary'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                Bug
              </button>
              <button
                type="button"
                onClick={() => setActiveWorkType('epic')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeWorkType === 'epic'
                    ? 'text-foreground border-b-2 border-primary'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                Epic
              </button>
            </div>
          </div>


          {/* Product Dropdown - Hidden for Notary Everyday */}
          {!isNotaryEveryday && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Product
            </label>
            <Select
              value={formData.product}
              onChange={(newProduct) => {
                setFormData(prev => ({ 
                  ...prev, 
                  product: newProduct as typeof formData.product,
                  section: newProduct !== 'RevenueOS' ? '' : prev.section // Clear section if product changes away from RevenueOS
                }));
              }}
              options={[
                { value: '', label: 'Select a product...' },
                { value: 'API', label: 'API' },
                { value: 'RevenueOS', label: 'RevenueOS' },
                { value: 'Workshop', label: 'Workshop' },
                { value: 'Adrata', label: 'Adrata' },
                { value: 'Oasis', label: 'Oasis' },
                { value: 'Stacks', label: 'Stacks' }
              ]}
              placeholder="Select a product..."
              className="w-full"
            />
          </div>
          )}

          {/* Features Dropdown - Only show when RevenueOS is selected and not Notary Everyday */}
          {!isNotaryEveryday && formData.product === 'RevenueOS' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Features
              </label>
              <Select
                value={formData.section}
                onChange={(value) => setFormData(prev => ({ ...prev, section: value }))}
                options={[
                  { value: '', label: 'Select a feature...' },
                  ...revenueOSSections.map((section) => ({
                    value: section.value,
                    label: section.label
                  }))
                ]}
                placeholder="Select a feature..."
                className="w-full"
              />
            </div>
          )}

          {/* Workstream/Column Dropdown */}
          {activeWorkType !== 'bug' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Workstream
              </label>
              <Select
                value={formData.status}
                onChange={(newStatus) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    status: newStatus as typeof formData.status
                  }));
                }}
                options={[
                  { value: 'up-next', label: 'Up Next' },
                  { value: 'todo', label: 'Todo/Backlog' },
                  { value: 'in-progress', label: 'In Progress' },
                  { value: 'built', label: 'Built' },
                  { value: 'qa1', label: 'QA1' },
                  { value: 'qa2', label: 'QA2' },
                  { value: 'shipped', label: 'Shipped' }
                ]}
                placeholder="Select workstream..."
                className="w-full"
              />
            </div>
          )}

          {/* Title - Required for all */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              ref={titleInputRef}
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={`Enter ${activeWorkType} title`}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-1 focus:ring-[var(--focus-ring)] focus:border-primary outline-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={`Describe the ${activeWorkType}`}
              rows={4}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-1 focus:ring-[var(--focus-ring)] focus:border-primary outline-none resize-none"
            />
          </div>

          {/* Points - Optional for stories */}
          {activeWorkType === 'story' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Points (optional)
              </label>
              <input
                type="number"
                min="0"
                value={formData.points}
                onChange={(e) => setFormData(prev => ({ ...prev, points: e.target.value }))}
                placeholder="e.g., 3, 5, 8, 13"
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-1 focus:ring-[var(--focus-ring)] focus:border-primary outline-none"
              />
              <p className="text-xs text-muted mt-1">Story points for effort estimation</p>
            </div>
          )}

          {/* Assign Dropdown - At bottom of each form */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Assign
            </label>
            <Select
              value={formData.assigneeId}
              onChange={(assigneeId) => setFormData(prev => ({ ...prev, assigneeId }))}
              options={[
                { value: '', label: 'Select assignee...' },
                ...workspaceUsers.map((user: any) => {
                  // Format name properly: firstName + lastName, fallback to name, then email
                  const displayName = 
                    (user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`.trim()
                      : user.firstName || user.lastName || user.name || user.email || 'Unknown User');
                  return {
                    value: user.id,
                    label: displayName
                  };
                })
              ]}
              placeholder="Select assignee..."
              className="w-full"
              disabled={loadingUsers}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: '#111827',
                color: '#ffffff',
                border: '1px solid #111827'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#1f2937';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#111827';
                }
              }}
            >
              {isLoading ? 'Creating...' : `Create ${workTypeLabels[activeWorkType]}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
