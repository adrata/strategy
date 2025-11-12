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
import { useRouter } from 'next/navigation';
import { generateSlug } from '@/platform/utils/url-utils';

interface AddStacksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStacksAdded: (stacks: any) => void;
}

type WorkTypeTab = 'story' | 'bug' | 'epic';

export function AddStacksModal({ isOpen, onClose, onStacksAdded }: AddStacksModalProps) {
  const { ui } = useRevenueOS();
  const { user } = useUnifiedAuth();
  const router = useRouter();
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
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
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

  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      priority: 'medium',
      section: '',
      status: 'up-next',
      assigneeId: '',
      epochId: ''
    });
    setUploadedImages([]);
    setIsDragging(false);
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

  // Image upload handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeWorkType === 'bug') {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (activeWorkType !== 'bug') return;

    const files = Array.from(e.dataTransfer.files);
    handleImageFiles(files);
  };

  const handleImageFiles = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      alert('Please drop image files only (PNG, JPG, GIF, WebP)');
      return;
    }

    // Validate file sizes (max 10MB each)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validFiles = imageFiles.filter(file => {
      if (file.size > maxSize) {
        alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    // Limit to 10 images total
    const remainingSlots = 10 - uploadedImages.length;
    if (validFiles.length > remainingSlots) {
      alert(`Maximum 10 images allowed. You can add ${remainingSlots} more.`);
      return;
    }

    const filesToAdd = validFiles.slice(0, remainingSlots);
    setUploadedImages(prev => [...prev, ...filesToAdd]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleImageFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Upload images to task after creation
  const uploadImagesToTask = async (taskId: string, workspaceId: string) => {
    if (uploadedImages.length === 0) return [];

    setUploadingImages(true);
    const uploadedAttachments: any[] = [];

    try {
      for (const imageFile of uploadedImages) {
        const formData = new FormData();
        formData.append('file', imageFile);

        const response = await fetch(`/api/stacks/tasks/${taskId}/upload`, {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          if (data.attachment) {
            uploadedAttachments.push(data.attachment);
          }
        } else {
          console.error('Failed to upload image:', imageFile.name);
        }
      }
    } catch (error) {
      console.error('Error uploading images:', error);
    } finally {
      setUploadingImages(false);
    }

    return uploadedAttachments;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    setIsLoading(true);

    try {
      // CRITICAL FIX: Always prioritize URL workspace slug as source of truth
      // This ensures consistent workspace resolution between bug creation and lookup
      // The URL slug is the most reliable source since it's what the user is actually viewing
      let workspaceId: string | null = null;
      
      // Priority 1: Get from URL workspace slug (MOST RELIABLE - source of truth)
      if (workspaceSlug) {
        const { getWorkspaceIdBySlug } = await import('@/platform/config/workspace-mapping');
        const urlWorkspaceId = getWorkspaceIdBySlug(workspaceSlug);
        if (urlWorkspaceId) {
          console.log(`🔍 [AddStacksModal] Resolved workspace ID from URL slug "${workspaceSlug}": ${urlWorkspaceId}`);
          workspaceId = urlWorkspaceId;
        }
      }
      
      // Fallback 2: Use UI active workspace (only if URL slug didn't work)
      if (!workspaceId && ui.activeWorkspace?.id) {
        console.log(`🔍 [AddStacksModal] Using UI activeWorkspace: ${ui.activeWorkspace.id}`);
        workspaceId = ui.activeWorkspace.id;
      }
      
      // Fallback 3: Use user's active workspace ID (last resort)
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
          storyId: null,
          priority: formData.priority
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

        // Pass workspaceId as query parameter to ensure correct workspace is used
        const apiUrl = `/api/stacks/tasks?workspaceId=${workspaceId}`;
        console.log('📤 [AddStacksModal] Creating bug task with workspaceId:', workspaceId);

        const response = await fetch(apiUrl, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bugData)
        });

        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          const createdTask = data.task || data;
          
          console.log('✅ [AddStacksModal] Bug created successfully:', {
            taskId: createdTask.id,
            taskTitle: createdTask.title,
            taskType: createdTask.type,
            projectId: createdTask.project?.id,
            projectWorkspaceId: createdTask.project?.workspaceId,
            creationWorkspaceId: workspaceId,
            timestamp: new Date().toISOString()
          });
          
          // Upload images if any
          if (uploadedImages.length > 0) {
            await uploadImagesToTask(createdTask.id, workspaceId);
          }
          
          onStacksAdded(createdTask);
          
          // CRITICAL FIX: Match story behavior - close modal instead of navigating immediately
          // This avoids workspace resolution timing issues and lets the user navigate manually
          // Stories work perfectly because they don't navigate immediately
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

          {/* Priority Dropdown - Only for bugs */}
          {activeWorkType === 'bug' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Priority
              </label>
              <Select
                value={formData.priority}
                onChange={(newPriority) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    priority: newPriority as typeof formData.priority
                  }));
                }}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'urgent', label: 'Urgent' }
                ]}
                placeholder="Select priority..."
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
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              Description
              {activeWorkType === 'bug' && uploadedImages.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {uploadedImages.length} {uploadedImages.length === 1 ? 'image' : 'images'}
                </span>
              )}
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`${activeWorkType === 'bug' && isDragging ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
            >
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={
                  activeWorkType === 'bug'
                    ? 'Describe the bug. You can drag and drop screenshots or image files here.'
                    : `Describe the ${activeWorkType}`
                }
                rows={4}
                className={`w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-1 focus:ring-[var(--focus-ring)] focus:border-primary outline-none resize-none ${
                  activeWorkType === 'bug' && isDragging ? 'border-blue-500' : ''
                }`}
              />
              {activeWorkType === 'bug' && (
                <div className="mt-2 flex justify-end">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2 py-1 text-xs text-muted hover:text-foreground bg-background border border-border rounded hover:bg-hover transition-colors"
                  >
                    Add Image
                  </button>
                </div>
              )}
            </div>
            {/* Image previews */}
            {activeWorkType === 'bug' && uploadedImages.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className="w-20 h-20 object-cover rounded border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove image"
                    >
                      ×
                    </button>
                    <p className="text-xs text-muted mt-1 truncate w-20" title={image.name}>
                      {image.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
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
              disabled={isLoading || uploadingImages}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: '#111827',
                color: '#ffffff',
                border: '1px solid #111827'
              }}
              onMouseEnter={(e) => {
                if (!isLoading && !uploadingImages) {
                  e.currentTarget.style.backgroundColor = '#1f2937';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading && !uploadingImages) {
                  e.currentTarget.style.backgroundColor = '#111827';
                }
              }}
            >
              {uploadingImages ? 'Uploading images...' : isLoading ? 'Creating...' : `Create ${workTypeLabels[activeWorkType]}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
