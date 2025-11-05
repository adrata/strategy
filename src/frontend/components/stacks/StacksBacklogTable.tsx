"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StacksContextMenu } from './StacksContextMenu';
import { StacksFilters } from './StacksFilters';
import { AddStacksModal } from './AddStacksModal';
import { useUnifiedAuth } from '@/platform/auth';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { getWorkspaceIdBySlug } from '@/platform/config/workspace-mapping';
import { useStacks } from '@/products/stacks/context/StacksProvider';
import { usePathname } from 'next/navigation';
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
  type?: 'story' | 'task'; // Track if this is a story or task
}

interface StacksBacklogTableProps {
  onItemClick?: (item: BacklogItem) => void;
}


const PRIORITY_COLORS = {
  urgent: 'bg-priority-high-bg text-priority-high-text',
  high: 'bg-priority-high-bg text-priority-high-text',
  medium: 'bg-priority-medium-bg text-priority-medium-text',
  low: 'bg-priority-low-bg text-priority-low-text',
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

// Sortable Item Component with drag handle
interface BacklogItemProps {
  item: BacklogItem;
  index: number;
  isUpNext?: boolean;
  onItemClick?: (item: BacklogItem) => void;
  onContextMenu: (e: React.MouseEvent, itemId: string, isUpNext?: boolean) => void;
  isBug: (item: BacklogItem) => boolean;
}

function BacklogItemComponent({
  item,
  index,
  isUpNext = false,
  onItemClick,
  onContextMenu,
  isBug,
}: BacklogItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const StatusIcon = STATUS_ICONS[item.status] || ClockIcon;
  const itemIsBug = isBug(item);
  
  // Filter out 'bug' tag since it's already shown in the red pill
  const filteredTags = item.tags?.filter(tag => tag.toLowerCase() !== 'bug') || [];
  const displayTag = filteredTags.length > 0 ? filteredTags[0] : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-background border border-border rounded-lg p-3 hover:bg-hover hover:border-primary transition-all duration-200 ${
        isDragging ? 'opacity-50 shadow-lg z-50' : ''
      }`}
      {...attributes}
      {...listeners}
      onClick={() => onItemClick?.(item)}
      onContextMenu={(e) => onContextMenu(e, item.id, isUpNext)}
    >
      <div className="flex items-start gap-3">
        {/* Item Number/Letter */}
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-panel-background text-foreground rounded text-xs font-semibold">
          {isUpNext ? `1${String.fromCharCode(65 + index)}` : `B${index + 1}`}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {itemIsBug && (
              <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                bug
              </span>
            )}
            <h4 className="text-sm font-medium text-foreground truncate">
              {item.title}
            </h4>
          </div>
          {item.description && (
            <p className="text-xs text-muted line-clamp-2 mb-2">
              {item.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted">
            {item.assignee && <span>{item.assignee}</span>}
            {displayTag && (
              <span className="bg-panel-background px-2 py-0.5 rounded">
                {displayTag}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StacksBacklogTable({ onItemClick }: StacksBacklogTableProps) {
  const { user: authUser } = useUnifiedAuth();
  const { ui } = useRevenueOS();
  const pathname = usePathname();
  
  // Get refresh trigger from context to sync with other components
  const stacksContext = useStacks();
  const refreshTrigger = stacksContext?.refreshTrigger || 0;
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'createdAt' | 'title' | 'rank'>('rank');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [visibleColumns, setVisibleColumns] = useState(['rank', 'title', 'status', 'assignee', 'dueDate', 'workstream']);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    priority: 'all',
    status: 'all',
    workstream: 'all',
    assignee: 'all'
  });

  // Configure dnd-kit sensors for simple drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Get workspace slug from pathname (consistent with other components)
  const workspaceSlug = pathname.split('/').filter(Boolean)[0];
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
        const cacheBuster = `&_t=${Date.now()}`;
        
        // Fetch both stories and tasks to match left panel counting
        const storiesUrl = `/api/v1/stacks/stories?workspaceId=${workspaceId}${cacheBuster}`;
        const tasksUrl = `/api/stacks/tasks?workspaceId=${workspaceId}${cacheBuster}`;
        
        console.log('🔍 [StacksBacklogTable] Fetching from:', storiesUrl, tasksUrl);
        console.log('🔍 [StacksBacklogTable] Request workspace ID:', workspaceId);
        
        const [storiesResponse, tasksResponse] = await Promise.all([
          fetch(storiesUrl, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            },
            cache: 'no-store' as RequestCache,
          }),
          fetch(tasksUrl, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            },
            cache: 'no-store' as RequestCache,
          })
        ]);
        
        console.log('🔍 [StacksBacklogTable] Stories response status:', storiesResponse.status, storiesResponse.ok);
        console.log('🔍 [StacksBacklogTable] Tasks response status:', tasksResponse.status, tasksResponse.ok);
        
        let stories: any[] = [];
        let tasks: any[] = [];
        
        if (storiesResponse.ok) {
          const storiesData = await storiesResponse.json();
          stories = storiesData.stories || [];
          console.log('📊 [StacksBacklogTable] Fetched stories:', stories.length);
        } else {
          console.warn('⚠️ [StacksBacklogTable] Stories API returned:', storiesResponse.status);
        }
        
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          tasks = tasksData.tasks || [];
          console.log('📊 [StacksBacklogTable] Fetched tasks:', tasks.length);
        } else {
          console.warn('⚠️ [StacksBacklogTable] Tasks API returned:', tasksResponse.status);
        }
        
        // Combine stories and tasks, matching left panel logic
        // Mark stories with type for easier identification
        const markedStories = stories.map((s: any) => ({ ...s, type: undefined })); // Stories don't have type
        const markedTasks = tasks.map((t: any) => ({ ...t, type: t.type || 'task' })); // Tasks have type
        const allItems = [...markedStories, ...markedTasks];
        
        console.log('📊 [StacksBacklogTable] Combined items:', {
          totalStories: stories.length,
          totalTasks: tasks.length,
          totalItems: allItems.length,
          workspaceId
        });
        
        if (allItems.length === 0) {
          console.log('ℹ️ [StacksBacklogTable] No items found for workspace:', workspaceId);
        }
        
        // Map both stories and tasks to backlog item format
        // First, sort by rank to preserve order
        const sortedItems = [...allItems].sort((a, b) => {
          const rankA = a.rank !== null && a.rank !== undefined ? a.rank : 999999;
          const rankB = b.rank !== null && b.rank !== undefined ? b.rank : 999999;
          if (rankA !== rankB) return rankA - rankB;
          // If ranks are equal or both null, sort by createdAt
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        });
        
        const backlogItems = sortedItems.map((item: any, index: number) => {
          // Add 'bug' tag if it's a task with type='bug'
          const tags = item.tags || [];
          if (item.type === 'bug') {
            tags.push('bug');
          }
          
          // Determine if this is a story or task
          const itemType = item.type ? 'task' : 'story';
          
          // Use existing rank if available, otherwise assign based on sorted position
          const rank = item.rank !== null && item.rank !== undefined ? item.rank : index + 1;
          
          return {
            id: item.id,
            title: item.title,
            description: item.description,
            priority: item.priority,
            status: item.status,
            assignee: item.assignee?.name || item.assignee || null,
            dueDate: item.dueDate || null,
            tags: tags,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            rank: rank,
            type: itemType as 'story' | 'task'
          };
        });
        
        // Persist initial ranks for items without ranks
        const itemsNeedingRanks = backlogItems.filter(item => 
          item.rank === null || item.rank === undefined || 
          (allItems.find((orig: any) => orig.id === item.id)?.rank === null || 
           allItems.find((orig: any) => orig.id === item.id)?.rank === undefined)
        );
        
        if (itemsNeedingRanks.length > 0) {
          // Persist ranks in the background
          Promise.all(itemsNeedingRanks.map(item => {
            const updatePayload: any = { rank: item.rank };
            const endpoint = item.type === 'task' 
              ? `/api/stacks/tasks/${item.id}`
              : `/api/v1/stacks/stories/${item.id}`;
            
            return fetch(endpoint, {
              method: 'PATCH',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...updatePayload, userId: authUser?.id })
            }).catch(err => {
              console.warn(`Failed to persist rank for ${item.type} ${item.id}:`, err);
            });
          })).catch(() => {
            // Silently fail - ranks will be set on next drag
          });
        }
        
        console.log('🔄 [StacksBacklogTable] Mapped backlog items:', backlogItems.length, 'items');
        
        setItems(backlogItems);
        
        // If either request failed critically, log the error but still try to show what we have
        if (!storiesResponse.ok && !tasksResponse.ok) {
          if (storiesResponse.status === 400 || tasksResponse.status === 400) {
            console.error('❌ [StacksBacklogTable] Workspace ID missing or invalid');
          } else if (storiesResponse.status === 401 || tasksResponse.status === 401) {
            console.error('❌ [StacksBacklogTable] Authentication failed');
          } else if (storiesResponse.status === 403 || tasksResponse.status === 403) {
            console.error('❌ [StacksBacklogTable] Access denied to workspace');
          } else {
            console.error('❌ [StacksBacklogTable] Unexpected error:', storiesResponse.status, tasksResponse.status);
          }
          
          // If both failed completely, set empty items
          if (allItems.length === 0) {
            setItems([]);
          }
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
  }, [ui.activeWorkspace?.id, authUser?.activeWorkspaceId, pathname, workspaceSlug, refreshTrigger]); // Refresh when context triggers update or pathname changes
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
      // Exclude deep-backlog items from regular backlog view
      if (item.status === 'deep-backlog') {
        return false;
      }
      
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

  // Get active item for drag overlay
  const activeItem = useMemo(() => {
    if (!activeId) return null;
    return items.find(item => item.id === activeId);
  }, [activeId, items]);

  // Simple drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    // Determine which section the items belong to
    const activeItem = items.find(item => item.id === activeIdStr);
    const overItem = items.find(item => item.id === overIdStr);

    if (!activeItem || !overItem) {
      return;
    }

    const activeIsUpNext = activeItem.status === 'up-next' || activeItem.status === 'todo';
    const overIsUpNext = overItem.status === 'up-next' || overItem.status === 'todo';

    // Determine target section (where the item is being dropped)
    const targetSection = overIsUpNext ? 'upNext' : 'backlog';
    const sourceSection = activeIsUpNext ? 'upNext' : 'backlog';
    
    // If moving between sections, update the status
    const isCrossSectionMove = activeIsUpNext !== overIsUpNext;
    const newStatus = isCrossSectionMove 
      ? (overIsUpNext ? 'up-next' : 'in-progress') 
      : activeItem.status;
    
    // Get items in the target section (where we're dropping)
    const targetSectionItems = items.filter(item => 
      targetSection === 'upNext' 
        ? (item.status === 'up-next' || item.status === 'todo')
        : (item.status !== 'up-next' && item.status !== 'todo')
    );
    
    // Find the drop position in the target section
    const dropIndex = targetSectionItems.findIndex(item => item.id === overIdStr);
    
    let itemsWithNewRanks: BacklogItem[];
    
    // If dropping an item from another section, only move that item
    if (isCrossSectionMove) {
      // Remove the dragged item from its current position
      const itemsWithoutDragged = items.filter(item => item.id !== activeIdStr);
      
      // Find where in the target section to insert (based on drop position)
      // Get items in target section from itemsWithoutDragged
      const targetSectionItemsWithoutDragged = itemsWithoutDragged.filter(item => 
        targetSection === 'upNext'
          ? (item.status === 'up-next' || item.status === 'todo')
          : (item.status !== 'up-next' && item.status !== 'todo')
      );
      
      // Insert the dragged item at the drop position in the target section
      const updatedTargetItems = [...targetSectionItemsWithoutDragged];
      const insertIndex = Math.min(dropIndex, updatedTargetItems.length);
      updatedTargetItems.splice(insertIndex, 0, { ...activeItem, status: newStatus as BacklogItem['status'] });
      
      // Get items from the source section (items not in target section)
      const sourceSectionItemsWithoutDragged = itemsWithoutDragged.filter(item => 
        targetSection === 'upNext'
          ? (item.status !== 'up-next' && item.status !== 'todo')
          : (item.status === 'up-next' || item.status === 'todo')
      );
      
      // Merge sections: target section items first, then source section items
      const allReorderedItems = targetSection === 'upNext' 
        ? [...updatedTargetItems, ...sourceSectionItemsWithoutDragged]
        : [...sourceSectionItemsWithoutDragged, ...updatedTargetItems];
      
      // Update ranks only for positioning, don't reorder other items
      itemsWithNewRanks = allReorderedItems.map((item, index) => ({
        ...item,
        rank: index + 1
      }));
      
      setItems(itemsWithNewRanks);
    } else {
      // Same section reordering (existing logic)
      const oldIndex = targetSectionItems.findIndex(item => item.id === activeIdStr);
      const newIndex = targetSectionItems.findIndex(item => item.id === overIdStr);

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      // Reorder items within the section
      const reorderedSection = arrayMove(targetSectionItems, oldIndex, newIndex);

      // Get other items (items not in the reordered section)
      const otherItems = items.filter(item => 
        targetSection === 'upNext'
          ? (item.status !== 'up-next' && item.status !== 'todo')
          : (item.status === 'up-next' || item.status === 'todo')
      );

      // Merge sections back together
      const allReorderedItems = targetSection === 'upNext' 
        ? [...reorderedSection, ...otherItems]
        : [...otherItems, ...reorderedSection];

      // Update ranks
      itemsWithNewRanks = allReorderedItems.map((item, index) => ({
        ...item,
        rank: index + 1
      }));

      setItems(itemsWithNewRanks);
    }

    // Persist to API
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

    // Update ranks and status via API
    try {
      const updatePromises = itemsWithNewRanks.map(item => {
        const updatePayload: any = { rank: item.rank };
        
        // If this is the moved item and it's a cross-section move, also update status
        if (isCrossSectionMove && item.id === activeIdStr) {
          updatePayload.status = newStatus;
        }
        
        // Determine the correct API endpoint based on item type
        const endpoint = item.type === 'task' 
          ? `/api/stacks/tasks/${item.id}`
          : `/api/v1/stacks/stories/${item.id}`;
        
        // Add userId for task updates (required by task API)
        if (item.type === 'task') {
          updatePayload.userId = authUser?.id;
        }
        
        return fetch(endpoint, {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload)
        });
      });

      const responses = await Promise.all(updatePromises);
      const failedUpdates = responses.filter(r => !r.ok);

      if (failedUpdates.length > 0) {
        console.error(`Failed to update ${failedUpdates.length} item order(s)`);
        // Refresh to revert optimistic update - fetch both stories and tasks
        const [storiesResponse, tasksResponse] = await Promise.all([
          fetch(`/api/v1/stacks/stories?workspaceId=${workspaceId}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          }),
          fetch(`/api/stacks/tasks?workspaceId=${workspaceId}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          })
        ]);
        
        if (storiesResponse.ok && tasksResponse.ok) {
          const [storiesData, tasksData] = await Promise.all([
            storiesResponse.json(),
            tasksResponse.json()
          ]);
          
          const stories = storiesData.stories || [];
          const tasks = tasksData.tasks || [];
          const markedStories = stories.map((s: any) => ({ ...s, type: undefined }));
          const markedTasks = tasks.map((t: any) => ({ ...t, type: t.type || 'task' }));
          const allItems = [...markedStories, ...markedTasks];
          
          const sortedItems = [...allItems].sort((a, b) => {
            const rankA = a.rank !== null && a.rank !== undefined ? a.rank : 999999;
            const rankB = b.rank !== null && b.rank !== undefined ? b.rank : 999999;
            if (rankA !== rankB) return rankA - rankB;
            return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          });
          
          const backlogItems = sortedItems.map((item: any, index: number) => {
            const tags = item.tags || [];
            if (item.type === 'bug') tags.push('bug');
            const itemType = item.type ? 'task' : 'story';
            const rank = item.rank !== null && item.rank !== undefined ? item.rank : index + 1;
            
            return {
              id: item.id,
              title: item.title,
              description: item.description,
              priority: item.priority,
              status: item.status,
              assignee: item.assignee?.name || item.assignee || null,
              dueDate: item.dueDate || null,
              tags: tags,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              rank: rank,
              type: itemType as 'story' | 'task'
            };
          });
          
          setItems(backlogItems);
        }
      } else {
        // Success - refresh to get server-confirmed order
        const [storiesResponse, tasksResponse] = await Promise.all([
          fetch(`/api/v1/stacks/stories?workspaceId=${workspaceId}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          }),
          fetch(`/api/stacks/tasks?workspaceId=${workspaceId}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          })
        ]);
        
        if (storiesResponse.ok && tasksResponse.ok) {
          const [storiesData, tasksData] = await Promise.all([
            storiesResponse.json(),
            tasksResponse.json()
          ]);
          
          const stories = storiesData.stories || [];
          const tasks = tasksData.tasks || [];
          const markedStories = stories.map((s: any) => ({ ...s, type: undefined }));
          const markedTasks = tasks.map((t: any) => ({ ...t, type: t.type || 'task' }));
          const allItems = [...markedStories, ...markedTasks];
          
          const sortedItems = [...allItems].sort((a, b) => {
            const rankA = a.rank !== null && a.rank !== undefined ? a.rank : 999999;
            const rankB = b.rank !== null && b.rank !== undefined ? b.rank : 999999;
            if (rankA !== rankB) return rankA - rankB;
            return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          });
          
          const backlogItems = sortedItems.map((item: any, index: number) => {
            const tags = item.tags || [];
            if (item.type === 'bug') tags.push('bug');
            const itemType = item.type ? 'task' : 'story';
            const rank = item.rank !== null && item.rank !== undefined ? item.rank : index + 1;
            
            return {
              id: item.id,
              title: item.title,
              description: item.description,
              priority: item.priority,
              status: item.status,
              assignee: item.assignee?.name || item.assignee || null,
              dueDate: item.dueDate || null,
              tags: tags,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              rank: rank,
              type: itemType as 'story' | 'task'
            };
          });
          
          setItems(backlogItems);
        }
      }
    } catch (error) {
      console.error('Error updating item order:', error);
      // Refresh to revert optimistic update on error - fetch both stories and tasks
      const [storiesResponse, tasksResponse] = await Promise.all([
        fetch(`/api/v1/stacks/stories?workspaceId=${workspaceId}`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }),
        fetch(`/api/stacks/tasks?workspaceId=${workspaceId}`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        })
      ]);
      
      if (storiesResponse.ok && tasksResponse.ok) {
        const [storiesData, tasksData] = await Promise.all([
          storiesResponse.json(),
          tasksResponse.json()
        ]);
        
        const stories = storiesData.stories || [];
        const tasks = tasksData.tasks || [];
        const markedStories = stories.map((s: any) => ({ ...s, type: undefined }));
        const markedTasks = tasks.map((t: any) => ({ ...t, type: t.type || 'task' }));
        const allItems = [...markedStories, ...markedTasks];
        
        const sortedItems = [...allItems].sort((a, b) => {
          const rankA = a.rank !== null && a.rank !== undefined ? a.rank : 999999;
          const rankB = b.rank !== null && b.rank !== undefined ? b.rank : 999999;
          if (rankA !== rankB) return rankA - rankB;
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        });
        
        const backlogItems = sortedItems.map((item: any, index: number) => {
          const tags = item.tags || [];
          if (item.type === 'bug') tags.push('bug');
          const itemType = item.type ? 'task' : 'story';
          const rank = item.rank !== null && item.rank !== undefined ? item.rank : index + 1;
          
          return {
            id: item.id,
            title: item.title,
            description: item.description,
            priority: item.priority,
            status: item.status,
            assignee: item.assignee?.name || item.assignee || null,
            dueDate: item.dueDate || null,
            tags: tags,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            rank: rank,
            type: itemType as 'story' | 'task'
          };
        });
        
        setItems(backlogItems);
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
              rank: story.rank !== null && story.rank !== undefined ? story.rank : index + 1
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

  const handleMoveToUpNext = async () => {
    if (!contextMenu.itemId) return;

    const item = items.find(i => i.id === contextMenu.itemId);
    if (!item) return;

    // Change status to 'up-next'
    const newStatus = 'up-next';

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
        console.log(`Successfully moved ${item.title} to Up Next`);
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
              rank: story.rank !== null && story.rank !== undefined ? story.rank : index + 1
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

  const handleMoveToDeepBacklog = async () => {
    if (!contextMenu.itemId) return;

    const item = items.find(i => i.id === contextMenu.itemId);
    if (!item) return;

    // Change status to 'deep-backlog'
    const newStatus = 'deep-backlog';

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
        console.log(`Successfully moved ${item.title} to deep backlog`);
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
              rank: story.rank !== null && story.rank !== undefined ? story.rank : index + 1
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

  const handleDelete = async () => {
    if (!contextMenu.itemId) return;

    const item = items.find(i => i.id === contextMenu.itemId);
    if (!item) return;

    // Show confirmation dialog
    if (!window.confirm(`Are you sure you want to delete "${item.title}"?`)) {
      setContextMenu(prev => ({ ...prev, isVisible: false }));
      return;
    }

    // Optimistic update - remove item from UI
    setItems(prevItems => prevItems.filter(i => i.id !== contextMenu.itemId));
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
      console.error('No workspace ID available for deleting story');
      // Revert on error
      setItems(prevItems => {
        const index = prevItems.findIndex(i => i.status === item.status);
        const newItems = [...prevItems];
        newItems.splice(index, 0, item);
        return newItems;
      });
      return;
    }

    // Delete via API
    try {
      const response = await fetch(`/api/v1/stacks/stories/${item.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Revert on failure
        setItems(prevItems => {
          const index = prevItems.findIndex(i => i.status === item.status);
          const newItems = [...prevItems];
          newItems.splice(index, 0, item);
          return newItems;
        });
        console.error('Failed to delete story:', await response.text());
      } else {
        console.log(`Successfully deleted story "${item.title}"`);
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
              rank: story.rank !== null && story.rank !== undefined ? story.rank : index + 1
            }));
            setItems(backlogItems);
          }
        }
      }
    } catch (error) {
      // Revert on error
      setItems(prevItems => {
        const index = prevItems.findIndex(i => i.status === item.status);
        const newItems = [...prevItems];
        newItems.splice(index, 0, item);
        return newItems;
      });
      console.error('Error deleting story:', error);
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
    console.log('Stacks added:', newStack);
    // Trigger refresh via context - this will sync left panel and middle panel
    if (stacksContext?.triggerRefresh) {
      stacksContext.triggerRefresh();
    }
    // The useEffect with refreshTrigger dependency will automatically refresh
    setShowAddStacksModal(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Backlog</h1>
            <p className="text-sm text-muted mt-1">Prioritized work queue</p>
          </div>
          <button 
            onClick={() => setShowAddStacksModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-panel-background text-foreground border border-border rounded-md hover:bg-hover transition-colors"
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
        {loading ? (
          <div className="p-4">
            {/* Up Next Section Skeleton */}
            <div className="mb-6">
              <div className="mb-3">
                <div className="h-4 bg-loading-bg rounded w-16 animate-pulse mb-1"></div>
                <div className="h-3 bg-loading-bg rounded w-12 animate-pulse"></div>
              </div>
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="bg-background border border-border rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-loading-bg rounded animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-loading-bg rounded w-3/4 animate-pulse"></div>
                        <div className="h-3 bg-loading-bg rounded w-full animate-pulse"></div>
                        <div className="h-3 bg-loading-bg rounded w-1/2 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Backlog Section Skeleton */}
            <div className="mb-6">
              <div className="mb-3">
                <div className="h-4 bg-loading-bg rounded w-20 animate-pulse mb-1"></div>
                <div className="h-3 bg-loading-bg rounded w-12 animate-pulse"></div>
              </div>
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-background border border-border rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-loading-bg rounded animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-loading-bg rounded w-3/4 animate-pulse"></div>
                        <div className="h-3 bg-loading-bg rounded w-full animate-pulse"></div>
                        <div className="h-3 bg-loading-bg rounded w-1/2 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : itemsToDisplay.upNextItems.length === 0 && itemsToDisplay.otherItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No backlog items found
            </h3>
            <p className="text-muted">
              {searchQuery ? 'Try adjusting your search terms' : 'Create your first backlog item to get started'}
            </p>
            <div className="mt-4 text-xs text-muted">
              Total items: {items.length} | Filtered: {filteredItems.length}
            </div>
          </div>
        ) : (
          <div className="p-4">
            {/* Single DndContext wrapping both sections for cross-section dragging */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              {/* Combined SortableContext with all items for cross-section dragging */}
              <SortableContext
                items={[...itemsToDisplay.upNextItems, ...itemsToDisplay.otherItems].map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {/* Up Next Section */}
                {itemsToDisplay.upNextItems.length > 0 && (
                  <>
                    <div className="mb-3">
                      <div className="flex items-end gap-2" style={{ paddingBottom: '2px' }}>
                        <h3 className="text-sm font-semibold text-foreground">Up Next</h3>
                        <span className="text-xs text-muted">
                          {itemsToDisplay.upNextItems.length} {itemsToDisplay.upNextItems.length === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-6">
                      {itemsToDisplay.upNextItems.map((item, index) => (
                        <BacklogItemComponent
                          key={item.id}
                          item={item}
                          index={index}
                          isUpNext={true}
                          onItemClick={onItemClick}
                          onContextMenu={handleContextMenu}
                          isBug={isBug}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Divider Line */}
                {itemsToDisplay.upNextItems.length > 0 && itemsToDisplay.otherItems.length > 0 && (
                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-background px-2 text-xs text-muted">Below the Line</span>
                    </div>
                  </div>
                )}

                {/* Backlog Section */}
                {itemsToDisplay.otherItems.length > 0 && (
                  <>
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-foreground mb-1">Backlog</h3>
                      <div className="text-xs text-muted">{itemsToDisplay.otherItems.length} items</div>
                    </div>
                    
                    <div className="space-y-2">
                      {itemsToDisplay.otherItems.map((item, index) => (
                        <BacklogItemComponent
                          key={item.id}
                          item={item}
                          index={index}
                          isUpNext={false}
                          onItemClick={onItemClick}
                          onContextMenu={handleContextMenu}
                          isBug={isBug}
                        />
                      ))}
                    </div>
                  </>
                )}
              </SortableContext>
              
              {/* Single DragOverlay for all items */}
              <DragOverlay>
                {activeId && (() => {
                  const activeItem = items.find(item => item.id === activeId);
                  if (!activeItem) return null;
                  return (
                    <div className="bg-background border-2 border-primary rounded-lg p-3 shadow-xl opacity-90">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-panel-background text-foreground rounded text-xs font-semibold">
                          {(activeItem.status === 'up-next' || activeItem.status === 'todo')
                            ? String.fromCharCode(65 + itemsToDisplay.upNextItems.findIndex(i => i.id === activeItem.id))
                            : `B${itemsToDisplay.otherItems.findIndex(i => i.id === activeItem.id) + 1}`}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground truncate">
                            {activeItem.title}
                          </h4>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </DragOverlay>
            </DndContext>
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
        onMoveToUpNext={handleMoveToUpNext}
        showMoveToUpNext={contextMenu.isUpNext === false}
        onMoveToDeepBacklog={handleMoveToDeepBacklog}
        showMoveToDeepBacklog={contextMenu.isUpNext === false}
        onDelete={handleDelete}
      />
    </div>
  );
}
