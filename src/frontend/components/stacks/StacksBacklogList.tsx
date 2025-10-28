"use client";

import React, { useState } from 'react';
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
import { useUnifiedAuth } from '@/platform/auth';
import { NOTARY_EVERYDAY_EPOCHS, Story as NotaryStory } from './notary-everyday-data';

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

interface StacksBacklogListProps {
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

export function StacksBacklogList({ onItemClick }: StacksBacklogListProps) {
  const { user: authUser } = useUnifiedAuth();
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'createdAt' | 'title' | 'rank'>('rank');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedItem, setDraggedItem] = useState<BacklogItem | null>(null);
  
  // Check if we're in Notary Everyday workspace
  const isNotaryEveryday = authUser?.activeWorkspace?.name === 'Notary Everyday';
  
  // Define selling workstreams (revenue-generating)
  const SELLING_WORKSTREAMS = ['Video', 'Cold', 'Referral', 'Events', 'Social'];
  
  // Convert Notary Stories to BacklogItems if in Notary Everyday workspace
  const convertNotaryStoryToBacklogItem = (story: NotaryStory, index: number): BacklogItem => ({
    id: story.id,
    title: story.title,
    description: story.description,
    priority: story.priority,
    status: story.status as 'todo' | 'in-progress' | 'review' | 'done',
    assignee: story.assignee,
    dueDate: story.dueDate,
    tags: [getWorkstreamForStory(story), ...(story.tags || [])],
    createdAt: story.createdAt,
    updatedAt: story.updatedAt,
    rank: index + 1
  });
  
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
  
  // Helper function to get workstream for a story
  const getWorkstreamForStory = (story: NotaryStory): string => {
    // Find which epoch this story belongs to
    for (const epoch of NOTARY_EVERYDAY_EPOCHS) {
      for (const epic of epoch.epics) {
        if (epic.stories.some(s => s.id === story.id)) {
          return epoch.name;
        }
      }
    }
    return 'Unknown';
  };
  
  // Filter stories for selling workstreams only
  const filterSellingStories = (stories: NotaryStory[]): NotaryStory[] => {
    return stories.filter(story => {
      const workstream = getWorkstreamForStory(story);
      return SELLING_WORKSTREAMS.includes(workstream);
    });
  };
  
  // Get all stories from all epochs and convert to backlog items (filtered for selling)
  const notaryBacklogItems = isNotaryEveryday 
    ? (() => {
        const allStories = NOTARY_EVERYDAY_EPOCHS.flatMap(epoch => 
          epoch.epics.flatMap(epic => epic.stories)
        );
        const sellingStories = filterSellingStories(allStories);
        return sellingStories.map((story, index) => convertNotaryStoryToBacklogItem(story, index));
      })()
    : [];
  
  const [items, setItems] = useState<BacklogItem[]>(isNotaryEveryday ? notaryBacklogItems : []);
  const [contextMenu, setContextMenu] = useState<{
    isVisible: boolean;
    position: { x: number; y: number };
    itemId: string;
  }>({
    isVisible: false,
    position: { x: 0, y: 0 },
    itemId: ''
  });

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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Deep Backlog</h2>
            <p className="text-sm text-[var(--muted)]">Long-term ideas and feedback capture</p>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors">
            <PlusIcon className="h-4 w-4" />
            Add Item
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search deep backlog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="all">All Status</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="rank">Sort by Rank</option>
              <option value="priority">Sort by Priority</option>
              <option value="dueDate">Sort by Due Date</option>
              <option value="createdAt">Sort by Created</option>
              <option value="title">Sort by Title</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-y-auto invisible-scrollbar">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              No deep backlog items found
            </h3>
            <p className="text-[var(--muted)]">
              {searchQuery ? 'Try adjusting your search terms' : 'Create your first deep backlog item to get started'}
            </p>
          </div>
        ) : (
          <div className="p-4">
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