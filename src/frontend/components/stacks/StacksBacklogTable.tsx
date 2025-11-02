"use client";

import React, { useState, useEffect } from 'react';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  EllipsisVerticalIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { StacksContextMenu } from './StacksContextMenu';
import { StacksFilters } from './StacksFilters';
import { AddStacksModal } from './AddStacksModal';
import { useUnifiedAuth } from '@/platform/auth';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { getWorkspaceIdBySlug } from '@/platform/config/workspace-mapping';
// Removed mock data imports

interface BacklogItem {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'up-next' | 'in-progress' | 'review' | 'done' | 'shipped' | 'qa1' | 'qa2' | 'built';
  assignee?: string;
  dueDate?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  rank?: number;
}

interface StacksBacklogTableProps {
  onItemClick?: (item: BacklogItem) => void;
}


const PRIORITY_COLORS = {
  urgent: 'bg-[var(--priority-high-bg)] text-[var(--priority-high-text)]',
  high: 'bg-[var(--priority-high-bg)] text-[var(--priority-high-text)]',
  medium: 'bg-[var(--priority-medium-bg)] text-[var(--priority-medium-text)]',
  low: 'bg-[var(--priority-low-bg)] text-[var(--priority-low-text)]',
};

const STATUS_ICONS = {
  todo: ClockIcon,
  'up-next': ClockIcon,
  'in-progress': ExclamationTriangleIcon,
  review: ClockIcon,
  done: CheckCircleIcon,
  shipped: PaperAirplaneIcon,
  qa1: ClockIcon,
  qa2: ClockIcon,
  built: CheckCircleIcon
};

export function StacksBacklogTable({ onItemClick }: StacksBacklogTableProps) {
  const { user: authUser } = useUnifiedAuth();
  const { ui } = useRevenueOS();
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'createdAt' | 'title' | 'rank'>('rank');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [visibleColumns, setVisibleColumns] = useState(['rank', 'title', 'status', 'assignee', 'dueDate', 'workstream']);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    priority: 'all',
    status: 'all',
    workstream: 'all',
    assignee: 'all'
  });
  
  // Check if we're in Notary Everyday workspace (check by workspace slug 'ne')
  const workspaceSlug = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : '';
  const isNotaryEveryday = workspaceSlug === 'ne';
  
  console.log('🔍 [StacksBacklogTable] Debug info:', {
    workspaceSlug,
    isNotaryEveryday,
    pathname: typeof window !== 'undefined' ? window.location.pathname : 'server-side'
  });
  
  // Define selling workstreams (revenue-generating)
  const SELLING_WORKSTREAMS = ['Video', 'Cold', 'Referral', 'Events', 'Social'];
  
  // Removed mock data conversion function
  
  // Helper function to format relative time
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d`;
    } else if (diffInWeeks < 4) {
      return `${diffInWeeks}w`;
    } else {
      return `${diffInMonths}mo`;
    }
  };
  
  // Removed mock data functions
  
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddStacksModal, setShowAddStacksModal] = useState(false);
  
  // Fetch data from API
  useEffect(() => {
    const fetchItems = async () => {
      // Resolve workspace ID with fallback logic (same as StacksBoard)
      let workspaceId = ui.activeWorkspace?.id;
      
      // Fallback 1: Get from URL workspace slug if UI workspace is missing
      if (!workspaceId && workspaceSlug) {
        const urlWorkspaceId = getWorkspaceIdBySlug(workspaceSlug);
        if (urlWorkspaceId) {
          console.log(`🔍 [StacksBacklogTable] Resolved workspace ID from URL slug "${workspaceSlug}": ${urlWorkspaceId}`);
          workspaceId = urlWorkspaceId;
        }
      }
      
      // Fallback 2: Use user's active workspace ID
      if (!workspaceId && authUser?.activeWorkspaceId) {
        console.log(`🔍 [StacksBacklogTable] Using user activeWorkspaceId: ${authUser.activeWorkspaceId}`);
        workspaceId = authUser.activeWorkspaceId;
      }
      
      console.log('🔍 [StacksBacklogTable] Starting fetch, workspace:', ui.activeWorkspace);
      console.log('🔍 [StacksBacklogTable] Workspace ID (resolved):', workspaceId);
      console.log('🔍 [StacksBacklogTable] URL workspace slug:', workspaceSlug);
      console.log('🔍 [StacksBacklogTable] User activeWorkspaceId:', authUser?.activeWorkspaceId);
      
      if (!workspaceId) {
        console.warn('⚠️ [StacksBacklogTable] No workspace ID available after all fallbacks, cannot fetch backlog items');
        console.warn('⚠️ [StacksBacklogTable] activeWorkspace:', ui.activeWorkspace);
        setItems([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const apiUrl = `/api/v1/stacks/stories?workspaceId=${workspaceId}`;
        console.log('🔍 [StacksBacklogTable] Fetching from:', apiUrl);
        console.log('🔍 [StacksBacklogTable] Request workspace ID:', workspaceId);
        
        const response = await fetch(apiUrl, {
          credentials: 'include', // Include cookies for authentication
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('🔍 [StacksBacklogTable] Response status:', response.status, response.ok);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 [StacksBacklogTable] Fetched backlog items from database:', {
            totalStories: data.stories?.length || 0,
            stories: data.stories,
            workspaceId
          });
          
          if (data.stories && Array.isArray(data.stories)) {
            if (data.stories.length === 0) {
              console.log('ℹ️ [StacksBacklogTable] No stories found for workspace:', workspaceId);
            }
            
            const backlogItems = data.stories.map((story: any, index: number) => ({
              id: story.id,
              title: story.title,
              description: story.description,
              priority: story.priority,
              status: story.status,
              assignee: story.assignee?.name || story.assignee,
              dueDate: story.dueDate,
              tags: story.tags || [],
              createdAt: story.createdAt,
              updatedAt: story.updatedAt,
              rank: index + 1
            }));
            
            console.log('🔄 [StacksBacklogTable] Mapped backlog items:', backlogItems.length, 'items');
            
            setItems(backlogItems);
          } else {
            console.warn('⚠️ [StacksBacklogTable] Invalid response format - stories is not an array');
            console.warn('⚠️ [StacksBacklogTable] Response data:', data);
            setItems([]);
          }
        } else {
          let errorData;
          try {
            const errorText = await response.text();
            errorData = errorText;
            // Try to parse as JSON
            try {
              errorData = JSON.parse(errorText);
            } catch {
              // Keep as text if not JSON
            }
          } catch (parseError) {
            errorData = { error: 'Failed to parse error response' };
          }
          
          console.error('❌ [StacksBacklogTable] API request failed:', {
            status: response.status,
            statusText: response.statusText,
            workspaceId,
            error: errorData
          });
          
          if (response.status === 400 && errorData?.code === 'WORKSPACE_REQUIRED') {
            console.error('❌ [StacksBacklogTable] Workspace ID missing or invalid');
          } else if (response.status === 401) {
            console.error('❌ [StacksBacklogTable] Authentication failed');
          } else if (response.status === 403) {
            console.error('❌ [StacksBacklogTable] Access denied to workspace');
          } else {
            console.error('❌ [StacksBacklogTable] Unexpected error:', response.status);
          }
          
          setItems([]);
        }
      } catch (error) {
        console.error('❌ [StacksBacklogTable] Error fetching backlog items:', error);
        console.error('❌ [StacksBacklogTable] Error details:', {
          message: error instanceof Error ? error.message : String(error),
          workspaceId,
          stack: error instanceof Error ? error.stack : undefined
        });
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [ui.activeWorkspace?.id, authUser?.activeWorkspaceId, workspaceSlug]);
  const [contextMenu, setContextMenu] = useState<{
    isVisible: boolean;
    position: { x: number; y: number };
    itemId: string;
    isUpNext?: boolean;
  }>({
    isVisible: false,
    position: { x: 0, y: 0 },
    itemId: '',
    isUpNext: false
  });

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleSortChange = (field: string) => {
    setSortField(field);
    // Toggle direction if same field, otherwise default to asc for rank, desc for others
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortDirection(field === 'rank' ? 'asc' : 'desc');
    }
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleColumnVisibilityChange = (columns: string[]) => {
    setVisibleColumns(columns);
  };

  // Filter and sort items
  const filteredItems = items
    .filter(item => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Status filter
      const matchesStatus = filters.status === 'all' || item.status === filters.status;
      
      // Priority filter
      const matchesPriority = filters.priority === 'all' || item.priority === filters.priority;
      
      // Workstream filter (check tags for workstream names)
      const matchesWorkstream = filters.workstream === 'all' || 
        (item.tags && item.tags.some(tag => 
          tag.toLowerCase() === filters.workstream.toLowerCase()
        ));
      
      // Assignee filter
      const matchesAssignee = filters.assignee === 'all' || 
        (item.assignee && (
          item.assignee.toLowerCase().includes(filters.assignee.toLowerCase()) ||
          filters.assignee.toLowerCase() === item.assignee.toLowerCase()
        ));
      
      return matchesSearch && matchesStatus && matchesPriority && matchesWorkstream && matchesAssignee;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rank':
          return (a.rank || 0) - (b.rank || 0);
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'dueDate':
          return new Date(a.dueDate || '9999-12-31').getTime() - new Date(b.dueDate || '9999-12-31').getTime();
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  // Debug logging
  useEffect(() => {
    const upNextCount = filteredItems.filter(item => item.status === 'up-next').length;
    const otherCount = filteredItems.filter(item => item.status !== 'up-next').length;
    
    console.log('📊 [StacksBacklogTable] Filtering debug:', {
      totalItems: items.length,
      filteredItems: filteredItems.length,
      upNextItems: upNextCount,
      otherItems: otherCount,
      filters,
      searchQuery,
      firstFewItems: items.slice(0, 3).map(item => ({
        id: item.id,
        title: item.title.substring(0, 30),
        status: item.status,
        priority: item.priority,
        assignee: item.assignee,
        tags: item.tags
      }))
    });
  }, [items.length, filteredItems.length, filters, searchQuery]);

  // Helper function to check if an item is a bug
  const isBug = (item: BacklogItem): boolean => {
    if (!item.tags || item.tags.length === 0) return false;
    return item.tags.some(tag => tag.toLowerCase() === 'bug' || tag.toLowerCase().includes('bug'));
  };

  // Separate items into "Up Next" (status='up-next' or 'todo') and other items
  // Map 'todo' to 'up-next' for display purposes
  const upNextItems = filteredItems.filter(item => 
    item.status === 'up-next' || item.status === 'todo'
  );
  const otherItems = filteredItems.filter(item => 
    item.status !== 'up-next' && item.status !== 'todo'
  );
  
  // Debug: If filtering removed everything, show all items for debugging
  const itemsToDisplay = filteredItems.length > 0 ? { upNextItems, otherItems } : {
    upNextItems: items.filter(item => item.status === 'up-next' || item.status === 'todo'),
    otherItems: items.filter(item => item.status !== 'up-next' && item.status !== 'todo')
  };

  const handleContextMenu = (e: React.MouseEvent, itemId: string, isUpNext?: boolean) => {
    e.preventDefault();
    setContextMenu({
      isVisible: true,
      position: { x: e.clientX, y: e.clientY },
      itemId,
      isUpNext: isUpNext || false
    });
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItemId(itemId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', itemId);
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedItemId && draggedItemId !== itemId) {
      setDragOverItemId(itemId);
    }
  };

  const handleDragLeave = () => {
    setDragOverItemId(null);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetItemId: string, section: 'upNext' | 'backlog') => {
    e.preventDefault();
    setDragOverItemId(null);

    if (!draggedItemId || draggedItemId === targetItemId) {
      setDraggedItemId(null);
      return;
    }

    const itemsToReorder = section === 'upNext' ? itemsToDisplay.upNextItems : itemsToDisplay.otherItems;
    const draggedIndex = itemsToReorder.findIndex(item => item.id === draggedItemId);
    const targetIndex = itemsToReorder.findIndex(item => item.id === targetItemId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItemId(null);
      return;
    }

    // Optimistic update - reorder items
    const newItems = [...items];
    const draggedItem = newItems.find(item => item.id === draggedItemId);
    
    if (!draggedItem) {
      setDraggedItemId(null);
      return;
    }

    // Remove dragged item
    const itemsInSection = newItems.filter(item => 
      section === 'upNext' 
        ? (item.status === 'up-next' || item.status === 'todo')
        : (item.status !== 'up-next' && item.status !== 'todo')
    );
    const otherItems = newItems.filter(item => 
      section === 'upNext'
        ? (item.status !== 'up-next' && item.status !== 'todo')
        : (item.status === 'up-next' || item.status === 'todo')
    );

    // Reorder within section
    const reorderedSection = [...itemsInSection];
    const sectionDraggedIndex = reorderedSection.findIndex(item => item.id === draggedItemId);
    const sectionTargetIndex = reorderedSection.findIndex(item => item.id === targetItemId);

    if (sectionDraggedIndex !== -1 && sectionTargetIndex !== -1) {
      const [movedItem] = reorderedSection.splice(sectionDraggedIndex, 1);
      if (movedItem) {
        reorderedSection.splice(sectionTargetIndex, 0, movedItem);
      }

      // Update ranks
      const allReorderedItems = section === 'upNext' 
        ? [...reorderedSection, ...otherItems]
        : [...otherItems, ...reorderedSection];

      const itemsWithNewRanks = allReorderedItems.map((item, index) => ({
        ...item,
        rank: index + 1
      }));

      setItems(itemsWithNewRanks);
    }

    setDraggedItemId(null);

    // Persist to API
    // Resolve workspace ID
    let workspaceId = ui.activeWorkspace?.id;
    if (!workspaceId && workspaceSlug) {
      const urlWorkspaceId = getWorkspaceIdBySlug(workspaceSlug);
      if (urlWorkspaceId) {
        workspaceId = urlWorkspaceId;
      }
    }
    if (!workspaceId && authUser?.activeWorkspaceId) {
      workspaceId = authUser.activeWorkspaceId;
    }

    if (!workspaceId) {
      console.error('No workspace ID available for updating story order');
      return;
    }

    // Update ranks in the database (we'll need to update multiple items)
    try {
      // For now, we'll update the dragged item's position
      // In a full implementation, you might want to update all affected items
      const response = await fetch(`/api/v1/stacks/stories/${draggedItemId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Note: The API may need to support rank updates
          // For now, we'll refresh the list after reordering
        })
      });

      if (!response.ok) {
        console.error('Failed to update story order:', await response.text());
        // Refresh to revert optimistic update
        const refreshResponse = await fetch(`/api/v1/stacks/stories?workspaceId=${workspaceId}`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          if (data.stories && Array.isArray(data.stories)) {
            const backlogItems = data.stories.map((story: any, index: number) => ({
              id: story.id,
              title: story.title,
              description: story.description,
              priority: story.priority,
              status: story.status,
              assignee: story.assignee?.name || story.assignee,
              dueDate: story.dueDate,
              tags: story.tags || [],
              createdAt: story.createdAt,
              updatedAt: story.updatedAt,
              rank: index + 1
            }));
            setItems(backlogItems);
          }
        }
      } else {
        // Refresh to get updated order from server
        const refreshResponse = await fetch(`/api/v1/stacks/stories?workspaceId=${workspaceId}`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          if (data.stories && Array.isArray(data.stories)) {
            const backlogItems = data.stories.map((story: any, index: number) => ({
              id: story.id,
              title: story.title,
              description: story.description,
              priority: story.priority,
              status: story.status,
              assignee: story.assignee?.name || story.assignee,
              dueDate: story.dueDate,
              tags: story.tags || [],
              createdAt: story.createdAt,
              updatedAt: story.updatedAt,
              rank: index + 1
            }));
            setItems(backlogItems);
          }
        }
      }
    } catch (error) {
      console.error('Error updating story order:', error);
      // Refresh to revert optimistic update on error
      const refreshResponse = await fetch(`/api/v1/stacks/stories?workspaceId=${workspaceId}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        if (data.stories && Array.isArray(data.stories)) {
          const backlogItems = data.stories.map((story: any, index: number) => ({
            id: story.id,
            title: story.title,
            description: story.description,
            priority: story.priority,
            status: story.status,
            assignee: story.assignee?.name || story.assignee,
            dueDate: story.dueDate,
            tags: story.tags || [],
            createdAt: story.createdAt,
            updatedAt: story.updatedAt,
            rank: index + 1
          }));
          setItems(backlogItems);
        }
      }
    }
  };

  const handleMoveBelowTheLine = async () => {
    if (!contextMenu.itemId) return;

    const item = items.find(i => i.id === contextMenu.itemId);
    if (!item) return;

    // Change status from 'up-next'/'todo' to 'in-progress' to move below the line
    // Items with status other than 'up-next' or 'todo' go to the Backlog section
    const newStatus = item.status === 'up-next' || item.status === 'todo' 
      ? 'in-progress' 
      : item.status;

    // Optimistic update
    setItems(prevItems => 
      prevItems.map(i => 
        i.id === contextMenu.itemId ? { ...i, status: newStatus as any } : i
      )
    );

    setContextMenu(prev => ({ ...prev, isVisible: false }));

    // Resolve workspace ID
    let workspaceId = ui.activeWorkspace?.id;
    if (!workspaceId && workspaceSlug) {
      const urlWorkspaceId = getWorkspaceIdBySlug(workspaceSlug);
      if (urlWorkspaceId) {
        workspaceId = urlWorkspaceId;
      }
    }
    if (!workspaceId && authUser?.activeWorkspaceId) {
      workspaceId = authUser.activeWorkspaceId;
    }

    if (!workspaceId) {
      console.error('No workspace ID available for updating story status');
      return;
    }

    // Update via API
    try {
      const response = await fetch(`/api/v1/stacks/stories/${item.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        })
      });

      if (!response.ok) {
        // Revert on failure
        setItems(prevItems => 
          prevItems.map(i => 
            i.id === contextMenu.itemId ? { ...i, status: item.status } : i
          )
        );
        console.error('Failed to update story status:', await response.text());
      } else {
        console.log(`Successfully moved ${item.title} below the line`);
        // Refresh the list to get updated data
        const refreshResponse = await fetch(`/api/v1/stacks/stories?workspaceId=${workspaceId}`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          if (data.stories && Array.isArray(data.stories)) {
            const backlogItems = data.stories.map((story: any, index: number) => ({
              id: story.id,
              title: story.title,
              description: story.description,
              priority: story.priority,
              status: story.status,
              assignee: story.assignee?.name || story.assignee,
              dueDate: story.dueDate,
              tags: story.tags || [],
              createdAt: story.createdAt,
              updatedAt: story.updatedAt,
              rank: index + 1
            }));
            setItems(backlogItems);
          }
        }
      }
    } catch (error) {
      // Revert on error
      setItems(prevItems => 
        prevItems.map(i => 
          i.id === contextMenu.itemId ? { ...i, status: item.status } : i
        )
      );
      console.error('Error updating story status:', error);
    }
  };

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, isVisible: false }));
  };

  const moveItem = (itemId: string, direction: 'top' | 'up' | 'down' | 'bottom') => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      const currentIndex = newItems.findIndex(item => item.id === itemId);
      
      if (currentIndex === -1) return prevItems;
      
      const [item] = newItems.splice(currentIndex, 1);
      
      switch (direction) {
        case 'top':
          newItems.unshift(item);
          break;
        case 'up':
          newItems.splice(Math.max(0, currentIndex - 1), 0, item);
          break;
        case 'down':
          newItems.splice(Math.min(newItems.length, currentIndex + 1), 0, item);
          break;
        case 'bottom':
          newItems.push(item);
          break;
      }
      
      // Update ranks
      return newItems.map((item, index) => ({ ...item, rank: index + 1 }));
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleStacksAdded = (newStack: any) => {
    // Refresh the backlog items with workspace ID resolution
    let workspaceId = ui.activeWorkspace?.id;
    
    // Fallback 1: Get from URL workspace slug if UI workspace is missing
    if (!workspaceId && workspaceSlug) {
      const urlWorkspaceId = getWorkspaceIdBySlug(workspaceSlug);
      if (urlWorkspaceId) {
        workspaceId = urlWorkspaceId;
      }
    }
    
    // Fallback 2: Use user's active workspace ID
    if (!workspaceId && authUser?.activeWorkspaceId) {
      workspaceId = authUser.activeWorkspaceId;
    }
    
    if (!workspaceId) {
      console.warn('⚠️ [StacksBacklogTable] No workspace ID available for refresh');
      setShowAddStacksModal(false);
      return;
    }
    
    fetch(`/api/v1/stacks/stories?workspaceId=${workspaceId}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error(`API returned ${response.status}`);
        }
      })
      .then(data => {
        const backlogItems = data.stories?.map((story: any, index: number) => ({
          id: story.id,
          title: story.title,
          description: story.description,
          priority: story.priority,
          status: story.status,
          assignee: story.assignee?.name || story.assignee,
          dueDate: story.dueDate,
          tags: story.tags || [],
          createdAt: story.createdAt,
          updatedAt: story.updatedAt,
          rank: index + 1
        })) || [];
        setItems(backlogItems);
        console.log('🔄 [StacksBacklogTable] Refreshed backlog items:', backlogItems.length, 'items');
      })
      .catch(error => {
        console.error('❌ [StacksBacklogTable] Error refreshing backlog items:', error);
      });
    
    setShowAddStacksModal(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Backlog</h1>
            <p className="text-sm text-[var(--muted)] mt-1">Prioritized work queue</p>
          </div>
          <button 
            onClick={() => setShowAddStacksModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--panel-background)] text-[var(--foreground)] border border-[var(--border)] rounded-md hover:bg-[var(--hover)] transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Stacks
          </button>
        </div>

        {/* Add Stacks Modal */}
        <AddStacksModal
          isOpen={showAddStacksModal}
          onClose={() => setShowAddStacksModal(false)}
          onStacksAdded={handleStacksAdded}
        />

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <StacksFilters
            section="backlog"
            totalCount={items.length}
            onSearchChange={handleSearchChange}
            onSortChange={handleSortChange}
            onFilterChange={handleFilterChange}
            onColumnVisibilityChange={handleColumnVisibilityChange}
            visibleColumns={visibleColumns}
            sortField={sortField}
            sortDirection={sortDirection}
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-y-auto invisible-scrollbar">
        {itemsToDisplay.upNextItems.length === 0 && itemsToDisplay.otherItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              No backlog items found
            </h3>
            <p className="text-[var(--muted)]">
              {searchQuery ? 'Try adjusting your search terms' : 'Create your first backlog item to get started'}
            </p>
            <div className="mt-4 text-xs text-[var(--muted)]">
              Total items: {items.length} | Filtered: {filteredItems.length}
            </div>
          </div>
        ) : (
          <div className="p-4">
            {/* Up Next Section */}
            {itemsToDisplay.upNextItems.length > 0 && (
              <>
                <div className="mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">Up Next</h3>
                    <span className="text-xs text-[var(--muted)]">
                      {itemsToDisplay.upNextItems.length} {itemsToDisplay.upNextItems.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </div>
                
                {/* Cards View with Drag and Drop */}
                <div className="space-y-2 mb-6">
                  {itemsToDisplay.upNextItems.map((item, index) => {
                    const StatusIcon = STATUS_ICONS[item.status] || ClockIcon;
                    const isDragging = draggedItemId === item.id;
                    const isDragOver = dragOverItemId === item.id;
                    
                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onDragOver={(e) => handleDragOver(e, item.id)}
                        onDragLeave={handleDragLeave}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, item.id, 'upNext')}
                        className={`bg-[var(--background)] border border-[var(--border)] rounded-lg p-3 hover:bg-[var(--hover)] hover:border-[var(--accent)] transition-colors cursor-move ${
                          isDragging ? 'opacity-50' : ''
                        } ${isDragOver ? 'border-[var(--accent)] border-2' : ''}`}
                        onClick={() => onItemClick?.(item)}
                        onContextMenu={(e) => handleContextMenu(e, item.id, true)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[var(--panel-background)] text-[var(--foreground)] rounded text-xs font-semibold">
                            1{String.fromCharCode(65 + index)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {isBug(item) && (
                                <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                                  bug
                                </span>
                              )}
                              <h4 className="text-sm font-medium text-[var(--foreground)] truncate">
                                {item.title}
                              </h4>
                            </div>
                            {item.description && (
                              <p className="text-xs text-[var(--muted)] line-clamp-2 mb-2">
                                {item.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                              {item.assignee && (
                                <span>{item.assignee}</span>
                              )}
                              {item.tags && item.tags.length > 0 && (
                                <span className="bg-[var(--panel-background)] px-2 py-0.5 rounded">
                                  {item.tags[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Divider Line */}
            {itemsToDisplay.upNextItems.length > 0 && itemsToDisplay.otherItems.length > 0 && (
              <div className="border-t border-[var(--border)] my-6"></div>
            )}

            {/* Backlog Section */}
            {itemsToDisplay.otherItems.length > 0 && (
              <>
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">Backlog</h3>
                  <div className="text-xs text-[var(--muted)]">{itemsToDisplay.otherItems.length} items</div>
                </div>
                
                {/* Cards View with Drag and Drop */}
                <div className="space-y-2">
                  {itemsToDisplay.otherItems.map((item, index) => {
                    const StatusIcon = STATUS_ICONS[item.status] || ClockIcon;
                    const isDragging = draggedItemId === item.id;
                    const isDragOver = dragOverItemId === item.id;
                    
                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onDragOver={(e) => handleDragOver(e, item.id)}
                        onDragLeave={handleDragLeave}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, item.id, 'backlog')}
                        className={`bg-[var(--background)] border border-[var(--border)] rounded-lg p-3 hover:bg-[var(--hover)] hover:border-[var(--accent)] transition-colors cursor-move ${
                          isDragging ? 'opacity-50' : ''
                        } ${isDragOver ? 'border-[var(--accent)] border-2' : ''}`}
                        onClick={() => onItemClick?.(item)}
                        onContextMenu={(e) => handleContextMenu(e, item.id, false)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[var(--panel-background)] text-[var(--foreground)] rounded text-xs font-semibold">
                            B{index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {isBug(item) && (
                                <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                                  bug
                                </span>
                              )}
                              <h4 className="text-sm font-medium text-[var(--foreground)] truncate">
                                {item.title}
                              </h4>
                            </div>
                            {item.description && (
                              <p className="text-xs text-[var(--muted)] line-clamp-2 mb-2">
                                {item.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                              {item.assignee && (
                                <span>{item.assignee}</span>
                              )}
                              {item.tags && item.tags.length > 0 && (
                                <span className="bg-[var(--panel-background)] px-2 py-0.5 rounded">
                                  {item.tags[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Context Menu */}
      <StacksContextMenu
        isVisible={contextMenu.isVisible}
        position={contextMenu.position}
        onClose={closeContextMenu}
        onMoveToTop={() => moveItem(contextMenu.itemId, 'top')}
        onMoveUp={() => moveItem(contextMenu.itemId, 'up')}
        onMoveDown={() => moveItem(contextMenu.itemId, 'down')}
        onMoveToBottom={() => moveItem(contextMenu.itemId, 'bottom')}
        onMoveBelowTheLine={handleMoveBelowTheLine}
        showMoveBelowTheLine={contextMenu.isUpNext === true}
        onDelete={() => {
          // TODO: Implement delete functionality
          console.log('Delete item:', contextMenu.itemId);
          closeContextMenu();
        }}
      />
    </div>
  );
}
