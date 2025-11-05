"use client";

import React, { useState, useEffect } from 'react';
import { 
  PlusIcon,
  EllipsisVerticalIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CogIcon,
  PaperAirplaneIcon,
  RectangleStackIcon,
  ListBulletIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';
import { FlagIcon } from '@heroicons/react/24/solid';
import { useUnifiedAuth } from '@/platform/auth';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { getWorkspaceIdBySlug } from '@/platform/config/workspace-mapping';
import { StacksContextMenu } from './StacksContextMenu';
import { useStacks } from '@/products/stacks/context/StacksProvider';
import { usePathname } from 'next/navigation';
// Removed mock data imports

interface StackCard {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'up-next' | 'in-progress' | 'shipped' | 'qa1' | 'qa2' | 'built';
  viewType?: 'detail' | 'list' | 'grid';
  product?: string | null;
  section?: string | null;
  assignee?: string;
  dueDate?: string;
  tags?: string[];
  epoch?: {
    id: string;
    title: string;
    description?: string;
  };
  timeInStatus?: number; // days in current status
  isFlagged?: boolean;
  points?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

interface StacksBoardProps {
  onCardClick?: (card: StackCard) => void;
}

// Mock data for demonstration
const MOCK_CARDS: StackCard[] = [
  {
    id: '1',
    title: 'Implement user authentication',
    description: 'Set up OAuth2 with Google and Microsoft',
    priority: 'high',
    status: 'up-next',
    assignee: 'Ryan',
    dueDate: '2024-01-15',
    tags: ['backend', 'auth']
  },
  {
    id: '2',
    title: 'Design landing page',
    description: 'Create responsive design for homepage',
    priority: 'medium',
    status: 'in-progress',
    assignee: 'Sarah',
    dueDate: '2024-01-20',
    tags: ['frontend', 'design']
  },
  {
    id: '3',
    title: 'Database optimization',
    description: 'Optimize queries and add indexes',
    priority: 'low',
    status: 'shipped',
    assignee: 'Mike',
    dueDate: '2024-01-25',
    tags: ['database', 'performance']
  },
  {
    id: '4',
    title: 'API documentation',
    description: 'Write comprehensive API docs',
    priority: 'medium',
    status: 'qa1',
    assignee: 'Alex',
    dueDate: '2024-01-10',
    tags: ['documentation', 'api']
  },
  {
    id: '5',
    title: 'Mobile app testing',
    description: 'Test on iOS and Android devices',
    priority: 'urgent',
    status: 'qa2',
    assignee: 'Emma',
    dueDate: '2024-01-12',
    tags: ['mobile', 'testing']
  },
  {
    id: '6',
    title: 'Performance monitoring',
    description: 'Set up monitoring and alerting',
    priority: 'medium',
    status: 'built',
    assignee: 'David',
    dueDate: '2024-01-30',
    tags: ['monitoring', 'performance']
  }
];

const STACK_COLUMNS = [
  {
    key: 'up-next',
    label: 'Up Next',
    color: 'bg-background border-border',
    icon: ClockIcon,
    description: 'Ready to start'
  },
  {
    key: 'in-progress',
    label: 'Working On',
    color: 'bg-background border-border',
    icon: CogIcon,
    description: 'In progress'
  },
  {
    key: 'built',
    label: 'Built',
    color: 'bg-background border-border',
    icon: CheckCircleIcon,
    description: 'Fully completed'
  },
  {
    key: 'qa1',
    label: 'QA1',
    color: 'bg-background border-border',
    icon: ClockIcon,
    description: 'First quality assurance'
  },
  {
    key: 'qa2',
    label: 'QA2',
    color: 'bg-background border-border',
    icon: ClockIcon,
    description: 'Second quality assurance'
  },
  {
    key: 'shipped',
    label: 'Shipped',
    color: 'bg-background border-border',
    icon: PaperAirplaneIcon,
    description: 'Shipped to production'
  }
];

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-700 border-gray-200',
  medium: 'bg-gray-200 text-gray-800 border-gray-300',
  high: 'bg-gray-300 text-gray-900 border-gray-400',
  urgent: 'bg-gray-400 text-white border-gray-500'
};

export function StacksBoard({ onCardClick }: StacksBoardProps) {
  const { user: authUser } = useUnifiedAuth();
  const { ui } = useRevenueOS();
  const pathname = usePathname();
  
  // Get refresh trigger from context to sync with other components
  const stacksContext = useStacks();
  const refreshTrigger = stacksContext?.refreshTrigger || 0;
  
  const [draggedCard, setDraggedCard] = useState<StackCard | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [cards, setCards] = useState<StackCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; card: StackCard } | null>(null);
  
  // Get workspace slug from pathname (consistent with other components)
  const workspaceSlug = pathname.split('/').filter(Boolean)[0];
  const isNotaryEveryday = workspaceSlug === 'ne';
  
  // Define selling workstreams (revenue-generating)
  const SELLING_WORKSTREAMS = ['Video', 'Cold', 'Referral', 'Events', 'Social'];
  
  // Fetch stories from database
  useEffect(() => {
    const fetchStories = async () => {
      // Resolve workspace ID with fallback logic
      let workspaceId = ui.activeWorkspace?.id;
      
      // Fallback 1: Get from URL workspace slug if UI workspace is missing
      if (!workspaceId && workspaceSlug) {
        const urlWorkspaceId = getWorkspaceIdBySlug(workspaceSlug);
        if (urlWorkspaceId) {
          console.log(`🔍 [StacksBoard] Resolved workspace ID from URL slug "${workspaceSlug}": ${urlWorkspaceId}`);
          workspaceId = urlWorkspaceId;
        }
      }
      
      // Fallback 2: Use user's active workspace ID
      if (!workspaceId && authUser?.activeWorkspaceId) {
        console.log(`🔍 [StacksBoard] Using user activeWorkspaceId: ${authUser.activeWorkspaceId}`);
        workspaceId = authUser.activeWorkspaceId;
      }
      
      console.log('🔍 [StacksBoard] Starting fetch, workspace:', ui.activeWorkspace);
      console.log('🔍 [StacksBoard] Workspace ID (resolved):', workspaceId);
      console.log('🔍 [StacksBoard] URL workspace slug:', workspaceSlug);
      console.log('🔍 [StacksBoard] User activeWorkspaceId:', authUser?.activeWorkspaceId);
      
      if (!workspaceId) {
        console.warn('⚠️ [StacksBoard] No workspace ID available after all fallbacks, cannot fetch stories');
        console.warn('⚠️ [StacksBoard] activeWorkspace:', ui.activeWorkspace);
        setCards([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const cacheBuster = `&_t=${Date.now()}`;
        const storiesUrl = `/api/v1/stacks/stories?workspaceId=${workspaceId}${cacheBuster}`;
        const tasksUrl = `/api/stacks/tasks?workspaceId=${workspaceId}${cacheBuster}`;
        
        console.log('🔍 [StacksBoard] Fetching from:', storiesUrl, tasksUrl);
        console.log('🔍 [StacksBoard] Request workspace ID:', workspaceId);
        
        // Fetch both stories and tasks in parallel
        const [storiesResponse, tasksResponse] = await Promise.all([
          fetch(storiesUrl, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }),
          fetch(tasksUrl, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        ]);
        
        console.log('🔍 [StacksBoard] Response status:', storiesResponse.status, tasksResponse.status);
        
        let stories: any[] = [];
        let tasks: any[] = [];
        
        if (storiesResponse.ok) {
          const storiesData = await storiesResponse.json();
          stories = storiesData.stories || [];
          console.log('📊 [StacksBoard] Fetched stories from database:', {
            totalStories: stories.length,
            workspaceId,
            isNotaryEveryday
          });
        } else {
          console.warn('⚠️ [StacksBoard] Stories API returned:', storiesResponse.status, storiesResponse.statusText);
        }
        
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          tasks = tasksData.tasks || [];
          console.log('📊 [StacksBoard] Fetched tasks from database:', {
            totalTasks: tasks.length,
            bugs: tasks.filter((t: any) => t.type === 'bug').length,
            workspaceId
          });
        } else {
          console.warn('⚠️ [StacksBoard] Tasks API returned:', tasksResponse.status, tasksResponse.statusText);
        }
        
        // Combine stories and tasks, treating tasks similar to stories
        const allItems = [...stories, ...tasks];
        
        if (allItems.length === 0) {
          console.log('ℹ️ [StacksBoard] No stories or tasks found for workspace:', workspaceId);
          setCards([]);
          return;
        }
        
        const sellingItems = filterSellingStories(allItems);
        console.log('🎯 [StacksBoard] Filtered selling items:', {
          original: allItems.length,
          filtered: sellingItems.length,
          stories: sellingItems.filter((s: any) => !s.type || s.type === 'story').length,
          tasks: sellingItems.filter((s: any) => s.type === 'task').length,
          bugs: sellingItems.filter((s: any) => s.type === 'bug').length,
          items: sellingItems.map((s: any) => ({ id: s.id, title: s.title, status: s.status, type: s.type }))
        });
        
        // Workstream board shows items with any workstream board column status
        // Allowed statuses: up-next, in-progress, built, qa1, qa2, shipped
        // Also include 'todo' status and map it to 'up-next' column
        // Cards can appear in any column based on their status
        const workstreamBoardStatuses = ['up-next', 'in-progress', 'built', 'qa1', 'qa2', 'shipped', 'todo'];
        const workstreamItems = sellingItems.filter((item: any) => {
          // Include items with any workstream board column status
          // Also include 'todo' status (will be mapped to 'up-next' column)
          return workstreamBoardStatuses.includes(item.status);
        }).map((item: any) => {
          // Map 'todo' status to 'up-next' for display on board
          if (item.status === 'todo') {
            return { ...item, status: 'up-next' };
          }
          return item;
        });
        
        console.log('🔍 [StacksBoard] After filtering for workstream (all board statuses):', {
          before: sellingItems.length,
          after: workstreamItems.length,
          removed: sellingItems.length - workstreamItems.length,
          removedStatuses: sellingItems
            .filter((s: any) => !workstreamBoardStatuses.includes(s.status))
            .reduce((acc: any, item: any) => {
              const status = item.status || 'null';
              acc[status] = (acc[status] || 0) + 1;
              return acc;
            }, {})
        });
        
        // Log status distribution before conversion
        const statusCounts = workstreamItems.reduce((acc: any, item: any) => {
          acc[item.status || 'null'] = (acc[item.status || 'null'] || 0) + 1;
          return acc;
        }, {});
        console.log('📊 [StacksBoard] Status distribution (workstream only):', statusCounts);
        
        // Convert stories and tasks to StackCard format
        const convertedCards = workstreamItems.map((item: any) => {
          // If it's a task (has type field), use task conversion, otherwise use story conversion
          if (item.type === 'bug' || item.type === 'task') {
            return convertTaskToStackCard(item);
          }
          return convertNotaryStoryToStackCard(item);
        });
        
        console.log('🔄 [StacksBoard] Converted cards:', convertedCards.length, 'cards');
        
        // Log status distribution after conversion
        const convertedStatusCounts = convertedCards.reduce((acc: any, card: StackCard) => {
          acc[card.status] = (acc[card.status] || 0) + 1;
          return acc;
        }, {});
        console.log('📊 [StacksBoard] Converted status distribution:', convertedStatusCounts);
        
        setCards(convertedCards);
        
        // Log warnings if either request failed (but we still have some data)
        if (!storiesResponse.ok || !tasksResponse.ok) {
          if (!storiesResponse.ok) {
            console.warn('⚠️ [StacksBoard] Stories API failed, but continuing with tasks');
          }
          if (!tasksResponse.ok) {
            console.warn('⚠️ [StacksBoard] Tasks API failed, but continuing with stories');
          }
        }
      } catch (error) {
        console.error('❌ [StacksBoard] Error fetching stories:', error);
        console.error('❌ [StacksBoard] Error details:', {
          message: error instanceof Error ? error.message : String(error),
          workspaceId,
          stack: error instanceof Error ? error.stack : undefined
        });
        setCards([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [ui.activeWorkspace?.id, authUser?.activeWorkspaceId, pathname, workspaceSlug, isNotaryEveryday, refreshTrigger]); // Refresh when context triggers update or pathname changes
  
  // Helper function to filter selling stories and tasks
  // Currently returns all items (stories and tasks) since we don't have category filtering yet
  // In the future, this could filter by project category or other criteria
  const filterSellingStories = (items: any[]): any[] => {
    return items;
  };

  // Helper function to convert Notary story to StackCard format
  const convertNotaryStoryToStackCard = (story: any): StackCard => {
    // Map status values to board column statuses
    // Note: 'todo' status is mapped to 'up-next' before this function is called
    let mappedStatus = story.status;
    
    if (story.status === 'done') {
      mappedStatus = 'built';
    } else if (story.status === 'up-next') {
      mappedStatus = 'up-next';
    } else if (story.status === 'in-progress') {
      mappedStatus = 'in-progress';
    } else if (story.status === 'built') {
      mappedStatus = 'built';
    } else if (story.status === 'qa1') {
      mappedStatus = 'qa1';
    } else if (story.status === 'qa2') {
      mappedStatus = 'qa2';
    } else if (story.status === 'shipped') {
      mappedStatus = 'shipped';
    } else if (!story.status || story.status === 'todo') {
      // Should not happen (filtered out above), but handle gracefully
      console.warn(`⚠️ [StacksBoard] Received todo/null status story "${story.title}" in convert function - this should be filtered out`);
      mappedStatus = 'up-next';
    } else {
      // Unknown status - default to 'up-next' instead of passing through invalid status
      console.warn(`⚠️ [StacksBoard] Unknown status "${story.status}" for story "${story.title}", defaulting to 'up-next'`);
      mappedStatus = 'up-next';
    }
    
    return {
      id: story.id,
      title: story.title,
      description: story.description,
      priority: story.priority || 'medium',
      status: mappedStatus as StackCard['status'],
      viewType: story.viewType || 'detail',
      product: story.product || null,
      section: story.section || null,
      assignee: story.assignee?.name || undefined,
      dueDate: story.dueDate,
      tags: story.tags || [],
      epoch: story.epoch,
      timeInStatus: story.timeInStatus,
      isFlagged: story.isFlagged || false,
      points: story.points || null,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt
    };
  };

  // Helper function to convert task (including bugs) to StackCard format
  const convertTaskToStackCard = (task: any): StackCard => {
    // Map status values to board column statuses
    // Note: 'todo' status is mapped to 'up-next' before this function is called
    let mappedStatus = task.status;
    
    if (task.status === 'done') {
      mappedStatus = 'built';
    } else if (task.status === 'up-next') {
      mappedStatus = 'up-next';
    } else if (task.status === 'in-progress') {
      mappedStatus = 'in-progress';
    } else if (task.status === 'built') {
      mappedStatus = 'built';
    } else if (task.status === 'qa1') {
      mappedStatus = 'qa1';
    } else if (task.status === 'qa2') {
      mappedStatus = 'qa2';
    } else if (task.status === 'shipped') {
      mappedStatus = 'shipped';
    } else if (!task.status || task.status === 'todo') {
      // Should not happen (filtered out above), but handle gracefully
      console.warn(`⚠️ [StacksBoard] Received todo/null status task "${task.title}" in convert function - this should be filtered out`);
      mappedStatus = 'up-next';
    } else {
      // Unknown status - default to 'up-next' instead of passing through invalid status
      console.warn(`⚠️ [StacksBoard] Unknown status "${task.status}" for task "${task.title}", defaulting to 'up-next'`);
      mappedStatus = 'up-next';
    }
    
    // Build tags array - include 'bug' tag if it's a bug
    const tags = task.type === 'bug' ? ['bug', ...(task.tags || [])] : (task.tags || []);
    
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority || 'medium',
      status: mappedStatus as StackCard['status'],
      viewType: task.type === 'bug' ? 'bug' : 'detail', // Set viewType to 'bug' for bugs
      product: task.product || null,
      section: task.section || null,
      assignee: task.assignee?.name || undefined,
      dueDate: task.dueDate || undefined,
      tags: tags,
      epoch: null, // Tasks don't have epochs
      timeInStatus: 0, // Tasks don't track timeInStatus
      isFlagged: false, // Tasks don't have isFlagged
      points: null, // Tasks don't have points
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    };
  };

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

  // Group cards by status
  const groupedCards = cards.reduce((acc, card) => {
    if (!acc[card.status]) {
      acc[card.status] = [];
    }
    acc[card.status].push(card);
    return acc;
  }, {} as Record<string, StackCard[]>);

  const handleDragStart = (e: React.DragEvent, card: StackCard) => {
    setDraggedCard(card);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.id);
    
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.6';
      e.currentTarget.style.transform = 'scale(1.05) rotate(2deg)';
      e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.25)';
      e.currentTarget.style.transition = 'all 0.2s ease-in-out';
      e.currentTarget.style.zIndex = '1000';
      e.currentTarget.style.cursor = 'grabbing';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
      e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.zIndex = 'auto';
      e.currentTarget.style.cursor = 'grab';
    }
    setDraggedCard(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    
    // Horizontal scroll when dragging near edges
    if (scrollContainer && draggedCard) {
      const rect = scrollContainer.getBoundingClientRect();
      const scrollThreshold = 50;
      const scrollSpeed = 10;
      
      if (e.clientX - rect.left < scrollThreshold) {
        scrollContainer.scrollLeft -= scrollSpeed;
      } else if (rect.right - e.clientX < scrollThreshold) {
        scrollContainer.scrollLeft += scrollSpeed;
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedCard && draggedCard.status !== columnKey) {
      setDragOverColumn(columnKey);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only clear if we're actually leaving the column container
    // Check if the relatedTarget is outside the current target
    const currentTarget = e.currentTarget as HTMLElement;
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    
    // If there's no related target or it's not a child of current target, clear drag over
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (!draggedCard || draggedCard.status === targetStatus) {
      setDraggedCard(null);
      return;
    }

    // Optimistic UI update
    const previousStatus = draggedCard.status;
    setCards(prevCards => 
      prevCards.map(card => 
        card.id === draggedCard.id 
          ? { ...card, status: targetStatus as StackCard['status'] }
          : card
      )
    );
    
    console.log(`Moving card ${draggedCard.title} to ${targetStatus}`);
    setDraggedCard(null);

    // Persist to database in background
    try {
      const response = await fetch(`/api/v1/stacks/stories/${draggedCard.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: targetStatus
        })
      });

      if (!response.ok) {
        // Revert optimistic update on failure
        setCards(prevCards => 
          prevCards.map(card => 
            card.id === draggedCard.id 
              ? { ...card, status: previousStatus as StackCard['status'] }
              : card
          )
        );
        console.error('Failed to update card status:', await response.text());
      } else {
        console.log(`Successfully moved card ${draggedCard.title} to ${targetStatus}`);
        
        // If status changed to 'shipped', notify ShipButton to refresh immediately
        if (targetStatus === 'shipped') {
          console.log('📦 [StacksBoard] Card moved to shipped, notifying ShipButton');
          window.dispatchEvent(new CustomEvent('stacks-status-changed', {
            detail: { status: 'shipped', storyId: draggedCard.id }
          }));
        }
      }
    } catch (error) {
      // Revert optimistic update on error
      setCards(prevCards => 
        prevCards.map(card => 
          card.id === draggedCard.id 
            ? { ...card, status: previousStatus as StackCard['status'] }
            : card
        )
      );
      console.error('Error updating card status:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleContextMenu = (e: React.MouseEvent, card: StackCard) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      card
    });
  };

  const handleMoveToTop = async () => {
    if (!contextMenu) return;
    const card = contextMenu.card;
    const cardsInColumn = cards.filter(c => c.status === card.status);
    const currentIndex = cardsInColumn.findIndex(c => c.id === card.id);
    
    if (currentIndex === 0) {
      setContextMenu(null);
      return;
    }

    // Optimistic update - move card to top of its column
    setCards(prevCards => {
      const filtered = prevCards.filter(c => c.id !== card.id);
      const sameStatus = filtered.filter(c => c.status === card.status);
      return [card, ...sameStatus, ...filtered.filter(c => c.status !== card.status)];
    });

    setContextMenu(null);
    // TODO: Implement API call to persist new order
  };

  const handleMoveUp = async () => {
    if (!contextMenu) return;
    const card = contextMenu.card;
    const cardsInColumn = cards.filter(c => c.status === card.status);
    const currentIndex = cardsInColumn.findIndex(c => c.id === card.id);
    
    if (currentIndex === 0) {
      setContextMenu(null);
      return;
    }

    // Optimistic update - swap with card above
    setCards(prevCards => {
      const newCards = [...prevCards];
      const sameStatus = newCards.filter(c => c.status === card.status);
      const otherCards = newCards.filter(c => c.status !== card.status);
      const cardIndex = sameStatus.findIndex(c => c.id === card.id);
      
      if (cardIndex > 0) {
        [sameStatus[cardIndex - 1], sameStatus[cardIndex]] = [sameStatus[cardIndex], sameStatus[cardIndex - 1]];
      }
      
      return [...sameStatus, ...otherCards];
    });

    setContextMenu(null);
    // TODO: Implement API call to persist new order
  };

  const handleMoveDown = async () => {
    if (!contextMenu) return;
    const card = contextMenu.card;
    const cardsInColumn = cards.filter(c => c.status === card.status);
    const currentIndex = cardsInColumn.findIndex(c => c.id === card.id);
    
    if (currentIndex === cardsInColumn.length - 1) {
      setContextMenu(null);
      return;
    }

    // Optimistic update - swap with card below
    setCards(prevCards => {
      const newCards = [...prevCards];
      const sameStatus = newCards.filter(c => c.status === card.status);
      const cardIndex = sameStatus.findIndex(c => c.id === card.id);
      
      if (cardIndex < sameStatus.length - 1) {
        [sameStatus[cardIndex], sameStatus[cardIndex + 1]] = [sameStatus[cardIndex + 1], sameStatus[cardIndex]];
      }
      
      const otherCards = newCards.filter(c => c.status !== card.status);
      return [...sameStatus, ...otherCards];
    });

    setContextMenu(null);
    // TODO: Implement API call to persist new order
  };

  const handleMoveToBottom = async () => {
    if (!contextMenu) return;
    const card = contextMenu.card;
    const cardsInColumn = cards.filter(c => c.status === card.status);
    const currentIndex = cardsInColumn.findIndex(c => c.id === card.id);
    
    if (currentIndex === cardsInColumn.length - 1) {
      setContextMenu(null);
      return;
    }

    // Optimistic update - move card to bottom of its column
    setCards(prevCards => {
      const filtered = prevCards.filter(c => c.id !== card.id);
      const sameStatus = filtered.filter(c => c.status === card.status);
      const otherCards = filtered.filter(c => c.status !== card.status);
      return [...sameStatus, card, ...otherCards];
    });

    setContextMenu(null);
    // TODO: Implement API call to persist new order
  };

  const handleDelete = async () => {
    if (!contextMenu) return;
    const card = contextMenu.card;
    
    if (!window.confirm(`Are you sure you want to delete "${card.title}"?`)) {
      setContextMenu(null);
      return;
    }

    // Optimistic update
    setCards(prevCards => prevCards.filter(c => c.id !== card.id));
    setContextMenu(null);

    try {
      const response = await fetch(`/api/v1/stacks/stories/${card.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        // Revert on failure
        setCards(prevCards => {
          const index = prevCards.findIndex(c => c.status === card.status);
          const newCards = [...prevCards];
          newCards.splice(index, 0, card);
          return newCards;
        });
        console.error('Failed to delete card:', await response.text());
      } else {
        console.log(`Successfully deleted card ${card.title}`);
      }
    } catch (error) {
      // Revert on error
      setCards(prevCards => {
        const index = prevCards.findIndex(c => c.status === card.status);
        const newCards = [...prevCards];
        newCards.splice(index, 0, card);
        return newCards;
      });
      console.error('Error deleting card:', error);
    }
  };

  // Always show board structure immediately to prevent loading glitch

  return (
    <>
      <style>{`
        .stacks-kanban-container {
          display: flex;
          flex-wrap: nowrap;
          gap: 1.5rem;
          padding: 0.5rem;
          height: 100%;
          overflow-x: auto;
          overflow-y: hidden;
        }
        
        /* Show horizontal scrollbar */
        .stacks-kanban-container::-webkit-scrollbar {
          height: 8px;
        }
        .stacks-kanban-container::-webkit-scrollbar-track {
          background: var(--background);
        }
        .stacks-kanban-container::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 4px;
        }
        .stacks-kanban-container::-webkit-scrollbar-thumb:hover {
          background: var(--muted);
        }
        
        .stacks-column-content::-webkit-scrollbar {
          display: none;
        }
        .stacks-column-content {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div 
        ref={setScrollContainer}
        className="stacks-kanban-container"
      >
      {STACK_COLUMNS.map((column, columnIndex) => {
        const cards = groupedCards[column.key] || [];
        const Icon = column.icon;

        const isDragOver = dragOverColumn === column.key && draggedCard?.status !== column.key;
        
        // Helper function to convert index to letter (0 -> A, 1 -> B, etc.)
        const getLetterSuffix = (index: number): string => {
          return String.fromCharCode(65 + index); // 65 is ASCII for 'A'
        };
        
        return (
          <div
            key={column.key}
            className="flex-shrink-0"
            style={{ minWidth: '288px', width: '288px' }}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, column.key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.key)}
          >
            <div 
              className={`bg-background rounded-lg h-full flex flex-col transition-all duration-200 ${
                isDragOver 
                  ? 'ring-2 ring-primary border-2 border-primary' 
                  : 'border border-border'
              }`}
            >
              {/* Stage Header */}
              <div className={`p-4 border-b transition-colors duration-200 ${
                isDragOver 
                  ? 'border-primary/50 bg-hover/30' 
                  : 'border-border'
              }`}>
                <h3 className="font-medium text-foreground mb-2 text-sm uppercase tracking-wide flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {column.label}
                </h3>
                <div className="flex justify-between text-xs text-muted">
                  <span>{column.description}</span>
                </div>
                <p className="text-xs text-muted mt-1">{cards.length} {cards.length === 1 ? 'stack' : 'stacks'}</p>
              </div>

              {/* Stories List */}
              <div className={`stacks-column-content flex-1 p-4 space-y-2 overflow-y-auto transition-colors duration-200 ${
                isDragOver ? 'bg-hover/20' : ''
              }`}
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
              >
                {cards.length === 0 ? (
                  <div className={`text-center py-8 text-muted transition-colors duration-200 ${
                    isDragOver ? 'border-2 border-dashed border-primary rounded-lg bg-primary/5 flex flex-col items-center justify-center min-h-[120px]' : ''
                  }`}>
                    {isDragOver ? (
                      <span className="text-sm text-primary font-medium">Drop here</span>
                    ) : (
                      <p className="text-xs">No stacks</p>
                    )}
                  </div>
                ) : (
                  <>
                    {cards.map((card, index) => {
                      const columnNumber = columnIndex + 1;
                      const letterSuffix = getLetterSuffix(index);
                      const displayNumber = `${columnNumber}${letterSuffix}`;
                      
                      return (
                      <div
                        key={card.id}
                        className={`relative bg-background border border-border rounded-lg p-3 hover:border-primary transition-colors cursor-pointer ${
                          draggedCard?.id === card.id ? 'opacity-50' : ''
                        }`}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, card)}
                        onDragEnd={handleDragEnd}
                        onClick={() => onCardClick?.(card)}
                        onContextMenu={(e) => handleContextMenu(e, card)}
                      >
                        {/* Rank number in top left */}
                        <div className="absolute top-2 left-2 w-6 h-6 bg-panel-background text-foreground rounded-[12px] flex items-center justify-center text-xs font-bold flex-shrink-0 shrink-0">
                          {displayNumber}
                        </div>
                        
                        {/* Flag icon in top right */}
                        {card.isFlagged && (
                          <div className="absolute top-[9px] right-2">
                            <FlagIcon className="h-4 w-4 text-red-500" />
                          </div>
                        )}
                        
                        <div className="mb-2 ml-8">
                          <h4 className="font-medium text-foreground text-sm leading-tight mb-1">
                            {card.title}
                          </h4>
                          {card.description && (
                            <p className="text-xs text-muted">
                              {card.description}
                            </p>
                          )}
                        </div>
                        
                        {/* Epoch Tag */}
                        {card.epoch && (
                          <div className="mb-2 ml-8">
                            <span className="bg-panel-background text-foreground px-2 py-1 rounded text-xs font-medium">
                              Ep: {card.epoch.title.replace(' Workstream', '')}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center text-xs text-muted">
                          <div className="flex items-center gap-2">
                            {card.points !== undefined && card.points !== null ? (
                              <span className="bg-panel-background text-muted px-2 py-1 rounded text-xs font-medium">
                                {card.points} pts
                              </span>
                            ) : null}
                            {card.timeInStatus !== undefined && card.timeInStatus > 0 && (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                card.timeInStatus >= 7 ? 'bg-error-bg text-error-text' : 
                                card.timeInStatus >= 3 ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-panel-background text-muted'
                              }`}>
                                {card.timeInStatus === 1 ? '1d' : `${card.timeInStatus}d`}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {card.assignee && (
                              <span className="bg-panel-background text-foreground px-2 py-1 rounded-full text-xs">
                                {card.assignee}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Tags */}
                        {card.tags && card.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {card.tags.map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="bg-panel-background text-muted px-2 py-1 rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      );
                    })}
                    {isDragOver && (
                      <div className="mt-2 py-3 border-2 border-dashed border-primary rounded-lg bg-primary/5 flex items-center justify-center">
                        <span className="text-xs text-primary font-medium">Drop here</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <StacksContextMenu
          isVisible={true}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
          onMoveToTop={handleMoveToTop}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onMoveToBottom={handleMoveToBottom}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}
