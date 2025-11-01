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
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { StacksContextMenu } from './StacksContextMenu';
import { StacksFilters } from './StacksFilters';
import { AddStacksModal } from './AddStacksModal';
import { useUnifiedAuth } from '@/platform/auth';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
// Removed mock data imports

interface BacklogItem {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in-progress' | 'review' | 'done';
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
  urgent: 'bg-gray-200 text-gray-800',
  high: 'bg-gray-200 text-gray-800',
  medium: 'bg-gray-100 text-gray-700',
  low: 'bg-gray-100 text-gray-600',
};

const STATUS_ICONS = {
  todo: ClockIcon,
  'in-progress': ExclamationTriangleIcon,
  review: ClockIcon,
  done: CheckCircleIcon
};

export function StacksBacklogTable({ onItemClick }: StacksBacklogTableProps) {
  const { user: authUser } = useUnifiedAuth();
  const { ui } = useRevenueOS();
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'createdAt' | 'title' | 'rank'>('rank');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedItem, setDraggedItem] = useState<BacklogItem | null>(null);
  const [sortField, setSortField] = useState('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [visibleColumns, setVisibleColumns] = useState(['rank', 'title', 'priority', 'status', 'assignee', 'dueDate', 'workstream']);
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
  const [loading, setLoading] = useState(true);
  const [showAddStacksModal, setShowAddStacksModal] = useState(false);
  
  // Fetch data from API
  useEffect(() => {
    const fetchItems = async () => {
      if (!ui.activeWorkspace?.id) {
        setItems([]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/v1/stacks/stories?workspaceId=${ui.activeWorkspace.id}`);
        if (response.ok) {
          const data = await response.json();
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
        } else {
          setItems([]);
        }
      } catch (error) {
        console.error('Error fetching backlog items:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [ui.activeWorkspace?.id]);
  const [contextMenu, setContextMenu] = useState<{
    isVisible: boolean;
    position: { x: number; y: number };
    itemId: string;
  }>({
    isVisible: false,
    position: { x: 0, y: 0 },
    itemId: ''
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
      const matchesSearch = searchQuery === '' || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
      
      return matchesSearch && matchesStatus;
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

  const handleContextMenu = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    setContextMenu({
      isVisible: true,
      position: { x: e.clientX, y: e.clientY },
      itemId
    });
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
    // Refresh the backlog items
    if (!ui.activeWorkspace?.id) return;
    
    fetch(`/api/v1/stacks/stories?workspaceId=${ui.activeWorkspace.id}`)
      .then(response => response.json())
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
      })
      .catch(error => {
        console.error('Error refreshing backlog items:', error);
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
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors"
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

      {/* Table Content */}
      <div className="flex-1 overflow-y-auto invisible-scrollbar">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              No backlog items found
            </h3>
            <p className="text-[var(--muted)]">
              {searchQuery ? 'Try adjusting your search terms' : 'Create your first backlog item to get started'}
            </p>
          </div>
        ) : (
          <div className="p-4">
            {/* Up Next Section Header */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Up Next</h3>
              <div className="text-xs text-gray-500">Backlog</div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-[var(--border)]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assignee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Workstream
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredItems.map((item, index) => {
                      const StatusIcon = STATUS_ICONS[item.status];
                      
                      return (
                        <React.Fragment key={item.id}>
                          <tr 
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => onItemClick?.(item)}
                            onContextMenu={(e) => handleContextMenu(e, item.id)}
                          >
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{item.rank || index + 1}
                            </td>
                            <td className="px-4 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {item.title}
                                </div>
                                {item.description && (
                                  <div className="text-sm text-gray-500 mt-1">
                                    {item.description}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[item.priority]}`}>
                                {item.priority}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <StatusIcon className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-900 capitalize">
                                  {item.status}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.assignee || '-'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.dueDate ? formatRelativeTime(item.dueDate) : '-'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {item.tags && item.tags.length > 0 && (
                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                                  {item.tags[0]}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                                <EllipsisVerticalIcon className="h-4 w-4 text-gray-400" />
                              </button>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden space-y-3">
              {filteredItems.map((item, index) => {
                const StatusIcon = STATUS_ICONS[item.status];
                
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-[var(--border)] rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer"
                    onClick={() => onItemClick?.(item)}
                    onContextMenu={(e) => handleContextMenu(e, item.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">
                            {item.rank || index + 1}
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[item.priority]}`}>
                            {item.priority}
                          </span>
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="text-sm text-gray-500 mb-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                        <EllipsisVerticalIcon className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <StatusIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 capitalize">
                            {item.status}
                          </span>
                        </div>
                        {item.assignee && (
                          <div className="flex items-center gap-1">
                            <UserIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">{item.assignee}</span>
                          </div>
                        )}
                        {item.dueDate && (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">{formatRelativeTime(item.dueDate)}</span>
                          </div>
                        )}
                      </div>
                      {item.tags && item.tags.length > 0 && (
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                          {item.tags[0]}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
      />
    </div>
  );
}
