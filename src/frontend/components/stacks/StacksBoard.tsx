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
import { StacksContextMenu } from './StacksContextMenu';
import { useStacks } from '@/products/stacks/context/StacksProvider';
import { usePathname } from 'next/navigation';
import { StackCard, StacksStory, StacksTask } from './types';
import { 
  STACK_STATUS, 
  STACK_PRIORITY, 
  WORKSTREAM_BOARD_STATUSES,
  normalizeStatusForDisplay,
  getStatusLabel
} from './constants';
import { useWorkspaceId } from './utils/workspaceId';
// Removed mock data imports

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
    key: STACK_STATUS.UP_NEXT,
    label: getStatusLabel(STACK_STATUS.UP_NEXT),
    color: 'bg-background border-border',
    icon: ClockIcon,
    description: 'Ready to start'
  },
  {
    key: STACK_STATUS.IN_PROGRESS,
    label: getStatusLabel(STACK_STATUS.IN_PROGRESS),
    color: 'bg-background border-border',
    icon: CogIcon,
    description: 'In progress'
  },
  {
    key: STACK_STATUS.BUILT,
    label: getStatusLabel(STACK_STATUS.BUILT),
    color: 'bg-background border-border',
    icon: CheckCircleIcon,
    description: 'Fully completed'
  },
  {
    key: STACK_STATUS.QA1,
    label: getStatusLabel(STACK_STATUS.QA1),
    color: 'bg-background border-border',
    icon: ClockIcon,
    description: 'First quality assurance'
  },
  {
    key: STACK_STATUS.QA2,
    label: getStatusLabel(STACK_STATUS.QA2),
    color: 'bg-background border-border',
    icon: ClockIcon,
    description: 'Second quality assurance'
  },
  {
    key: STACK_STATUS.SHIPPED,
    label: getStatusLabel(STACK_STATUS.SHIPPED),
    color: 'bg-background border-border',
    icon: PaperAirplaneIcon,
    description: 'Shipped to production'
  }
];

const PRIORITY_COLORS: Record<typeof STACK_PRIORITY[keyof typeof STACK_PRIORITY], string> = {
  [STACK_PRIORITY.LOW]: 'bg-gray-100 text-gray-700 border-gray-200',
  [STACK_PRIORITY.MEDIUM]: 'bg-gray-200 text-gray-800 border-gray-300',
  [STACK_PRIORITY.HIGH]: 'bg-gray-300 text-gray-900 border-gray-400',
  [STACK_PRIORITY.URGENT]: 'bg-gray-400 text-white border-gray-500'
};

export function StacksBoard({ onCardClick }: StacksBoardProps) {
  const { user: authUser } = useUnifiedAuth();
  const pathname = usePathname();
  const workspaceId = useWorkspaceId();
  
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
      
      if (!workspaceId) {
        console.warn('⚠️ [StacksBoard] No workspace ID available, cannot fetch stories');
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
        
        let stories: StacksStory[] = [];
        let tasks: StacksTask[] = [];
        
        if (storiesResponse.ok) {
          const storiesData = await storiesResponse.json();
          stories = (storiesData.stories || []) as StacksStory[];
        } else {
          console.warn('⚠️ [StacksBoard] Stories API returned:', storiesResponse.status, storiesResponse.statusText);
        }
        
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          tasks = (tasksData.tasks || []) as StacksTask[];
        } else {
          // Log detailed error information
          let errorBody = '';
          try {
            errorBody = await tasksResponse.text();
            const parsedError = JSON.parse(errorBody);
            console.error('❌ [StacksBoard] Tasks API error response:', {
              status: tasksResponse.status,
              statusText: tasksResponse.statusText,
              error: parsedError,
              url: tasksUrl
            });
          } catch (parseError) {
            console.error('❌ [StacksBoard] Tasks API error response (raw):', {
              status: tasksResponse.status,
              statusText: tasksResponse.statusText,
              body: errorBody,
              url: tasksUrl
            });
          }
        }
        
        // Combine stories and tasks
        const allItems: (StacksStory | StacksTask)[] = [...stories, ...tasks];
        
        if (allItems.length === 0) {
          setCards([]);
          return;
        }
        
        const sellingItems = filterSellingStories(allItems);
        
        // Filter for workstream board statuses and normalize 'todo' to 'up-next'
        const workstreamItems = sellingItems
          .filter((item) => WORKSTREAM_BOARD_STATUSES.includes(item.status as typeof STACK_STATUS[keyof typeof STACK_STATUS]))
          .map((item) => {
            // Map 'todo' status to 'up-next' for display on board
            if (item.status === STACK_STATUS.TODO) {
              return { ...item, status: STACK_STATUS.UP_NEXT };
            }
            return item;
          });
        
        // Convert stories and tasks to StackCard format
        const convertedCards = workstreamItems.map((item) => {
          // If it's a task (type is 'task' or 'bug'), use task conversion, otherwise use story conversion
          // Tasks have type: 'task' or type: 'bug', stories don't have a type property
          if (item.type === 'task' || item.type === 'bug') {
            return convertTaskToStackCard(item as StacksTask);
          }
          return convertNotaryStoryToStackCard(item as StacksStory);
        });
        
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
  }, [workspaceId, pathname, refreshTrigger]); // Refresh when workspace ID, pathname, or context triggers update
  
  // Helper function to filter selling stories and tasks
  // Currently returns all items (stories and tasks) since we don't have category filtering yet
  // In the future, this could filter by project category or other criteria
  const filterSellingStories = (items: (StacksStory | StacksTask)[]): (StacksStory | StacksTask)[] => {
    return items;
  };

  // Helper function to convert Notary story to StackCard format
  const convertNotaryStoryToStackCard = (story: StacksStory): StackCard => {
    // Map status values to board column statuses using normalizeStatusForDisplay
    // Note: 'todo' status is mapped to 'up-next' before this function is called
    let mappedStatus = normalizeStatusForDisplay(story.status);
    
    // Handle legacy 'done' status
    if (story.status === STACK_STATUS.DONE) {
      mappedStatus = STACK_STATUS.BUILT;
    } else if (!story.status || !WORKSTREAM_BOARD_STATUSES.includes(story.status as typeof STACK_STATUS[keyof typeof STACK_STATUS])) {
      // Unknown status - default to 'up-next' instead of passing through invalid status
      console.warn(`⚠️ [StacksBoard] Unknown or invalid status "${story.status}" for story "${story.title}", defaulting to 'up-next'`);
      mappedStatus = STACK_STATUS.UP_NEXT;
    }
    
    return {
      id: story.id,
      title: story.title,
      description: story.description || undefined,
      priority: story.priority || STACK_PRIORITY.MEDIUM,
      status: mappedStatus,
      viewType: story.viewType || 'detail',
      product: story.product || null,
      section: story.section || null,
      assignee: story.assignee?.name || (story.assignee?.firstName && story.assignee?.lastName 
        ? `${story.assignee.firstName} ${story.assignee.lastName}`.trim() 
        : undefined),
      dueDate: undefined,
      tags: story.tags || [],
      epoch: story.epoch ? {
        id: story.epoch.id,
        title: story.epoch.title,
        description: story.epoch.description || undefined
      } : undefined,
      timeInStatus: story.statusChangedAt 
        ? Math.floor((Date.now() - new Date(story.statusChangedAt).getTime()) / (1000 * 60 * 60 * 24))
        : undefined,
      isFlagged: story.isFlagged || false,
      points: story.points || null,
      createdAt: typeof story.createdAt === 'string' ? story.createdAt : story.createdAt.toISOString(),
      updatedAt: typeof story.updatedAt === 'string' ? story.updatedAt : story.updatedAt.toISOString(),
      rank: story.rank || null,
      type: 'story' as const,
      originalType: undefined
    };
  };

  // Helper function to convert task (including bugs) to StackCard format
  const convertTaskToStackCard = (task: StacksTask): StackCard => {
    // Map status values to board column statuses using normalizeStatusForDisplay
    // Note: 'todo' status is mapped to 'up-next' before this function is called
    let mappedStatus = normalizeStatusForDisplay(task.status);
    
    // Handle legacy 'done' status
    if (task.status === STACK_STATUS.DONE) {
      mappedStatus = STACK_STATUS.BUILT;
    } else if (!task.status || !WORKSTREAM_BOARD_STATUSES.includes(task.status as typeof STACK_STATUS[keyof typeof STACK_STATUS])) {
      // Unknown status - default to 'up-next' instead of passing through invalid status
      console.warn(`⚠️ [StacksBoard] Unknown or invalid status "${task.status}" for task "${task.title}", defaulting to 'up-next'`);
      mappedStatus = STACK_STATUS.UP_NEXT;
    }
    
    // Build tags array - include 'bug' tag if it's a bug
    const tags = task.type === 'bug' ? ['bug', ...(task.tags || [])] : (task.tags || []);
    
    return {
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      priority: task.priority || STACK_PRIORITY.MEDIUM,
      status: mappedStatus,
      viewType: task.type === 'bug' ? 'bug' : 'detail',
      product: task.product || null,
      section: task.section || null,
      assignee: task.assignee?.name || (task.assignee?.firstName && task.assignee?.lastName 
        ? `${task.assignee.firstName} ${task.assignee.lastName}`.trim() 
        : undefined),
      dueDate: undefined,
      tags: tags,
      epoch: undefined,
      timeInStatus: undefined,
      isFlagged: false,
      points: null,
      createdAt: typeof task.createdAt === 'string' ? task.createdAt : task.createdAt.toISOString(),
      updatedAt: typeof task.updatedAt === 'string' ? task.updatedAt : task.updatedAt.toISOString(),
      rank: task.rank || null,
      type: 'task' as const,
      originalType: task.type
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

  // Helper function to persist ranks for cards in a specific column
  const persistRanks = async (cardsInColumn: StackCard[], oldCards: StackCard[]): Promise<void> => {
    if (!workspaceId) {
      console.error('❌ [StacksBoard] No workspace ID available for persisting ranks');
      return;
    }

    try {
      // Create a map of old cards for O(1) lookup
      const oldCardsMap = new Map<string, StackCard>();
      oldCards.forEach(card => oldCardsMap.set(card.id, card));

      // Find cards whose rank changed
      const cardsWithChangedRanks = cardsInColumn.filter((card) => {
        const oldCard = oldCardsMap.get(card.id);
        if (!oldCard) return true; // New card, definitely needs update
        return oldCard.rank !== card.rank;
      });

      if (cardsWithChangedRanks.length === 0) {
        return; // No changes to persist
      }

      // Batch updates in parallel
      const updatePromises = cardsWithChangedRanks.map(card => {
        const updatePayload: any = { rank: card.rank };
        
        // Determine the correct API endpoint based on card type
        const endpoint = card.type === 'task' 
          ? `/api/stacks/tasks/${card.id}`
          : `/api/v1/stacks/stories/${card.id}`;
        
        // Add userId for task updates (required by task API)
        if (card.type === 'task') {
          updatePayload.userId = authUser?.id;
        }
        
        return fetch(endpoint, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload)
        });
      });

      await Promise.all(updatePromises);
      
      // Trigger refresh to sync with other components
      if (stacksContext?.triggerRefresh) {
        stacksContext.triggerRefresh();
      }
    } catch (error) {
      console.error('Error persisting ranks:', error);
      throw error;
    }
  };

  // Group cards by status and sort by rank within each group
  const groupedCards = cards.reduce((acc, card) => {
    if (!acc[card.status]) {
      acc[card.status] = [];
    }
    acc[card.status].push(card);
    return acc;
  }, {} as Record<string, StackCard[]>);

  // Sort cards within each status group by rank
  Object.keys(groupedCards).forEach(status => {
    groupedCards[status].sort((a, b) => {
      // Sort by rank first (ascending), then by createdAt if ranks are equal or missing
      const rankA = a.rank !== null && a.rank !== undefined ? a.rank : 999999;
      const rankB = b.rank !== null && b.rank !== undefined ? b.rank : 999999;
      if (rankA !== rankB) return rankA - rankB;
      // If ranks are equal or both missing, sort by createdAt
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB;
    });
  });

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
    
    if (!draggedCard) {
      setDraggedCard(null);
      return;
    }

    const previousStatus = draggedCard.status;
    const isSameColumn = draggedCard.status === targetStatus;
    const oldCards = [...cards];

    // Optimistic UI update
    let updatedCards: StackCard[];
    
    if (isSameColumn) {
      // Same-column reordering: move card to end of column and recalculate ranks
      const cardsInColumn = cards.filter(c => c.status === targetStatus);
      const otherCards = cards.filter(c => c.status !== targetStatus);
      const cardToMove = cardsInColumn.find(c => c.id === draggedCard.id);
      const cardsWithoutMoved = cardsInColumn.filter(c => c.id !== draggedCard.id);
      
      // Move card to end of column
      const reorderedColumn = [...cardsWithoutMoved, cardToMove!];
      
      // Recalculate ranks for the column
      const columnWithRanks = reorderedColumn.map((card, index) => ({
        ...card,
        rank: index + 1
      }));
      
      updatedCards = [...otherCards, ...columnWithRanks];
    } else {
      // Cross-column move: update status and recalculate ranks for target column
      const cardsInTargetColumn = cards.filter(c => c.status === targetStatus);
      const otherCards = cards.filter(c => c.status !== targetStatus && c.id !== draggedCard.id);
      const movedCard = { ...draggedCard, status: targetStatus as StackCard['status'] };
      
      // Add moved card to target column and recalculate ranks
      const updatedTargetColumn = [...cardsInTargetColumn, movedCard].map((card, index) => ({
        ...card,
        rank: index + 1
      }));
      
      updatedCards = [...otherCards, ...updatedTargetColumn];
    }

    setCards(updatedCards);
    console.log(`Moving card ${draggedCard.title} to ${targetStatus}`);
    setDraggedCard(null);

    // Persist changes to database
    try {
      // If status changed, update status first
      if (!isSameColumn) {
        const statusEndpoint = draggedCard.type === 'task'
          ? `/api/stacks/tasks/${draggedCard.id}`
          : `/api/v1/stacks/stories/${draggedCard.id}`;
        
        const statusPayload: any = { status: targetStatus };
        if (draggedCard.type === 'task') {
          statusPayload.userId = authUser?.id;
        }
        
        const statusResponse = await fetch(statusEndpoint, {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(statusPayload)
        });

        if (!statusResponse.ok) {
          // Revert optimistic update on failure
          setCards(oldCards);
          console.error('Failed to update card status:', await statusResponse.text());
          return;
        }
      }

      // Persist ranks for cards in the target column
      const cardsInTargetColumn = updatedCards.filter(c => c.status === targetStatus);
      await persistRanks(cardsInTargetColumn, oldCards);

      console.log(`Successfully moved card ${draggedCard.title} to ${targetStatus}`);
      
      // If status changed to 'shipped', notify ShipButton to refresh immediately
      if (targetStatus === STACK_STATUS.SHIPPED) {
        console.log('📦 [StacksBoard] Card moved to shipped, notifying ShipButton');
        window.dispatchEvent(new CustomEvent('stacks-status-changed', {
          detail: { status: STACK_STATUS.SHIPPED, storyId: draggedCard.id }
        }));
      }
    } catch (error) {
      // Revert optimistic update on error
      setCards(oldCards);
      console.error('Error updating card:', error);
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

    const oldCards = [...cards];

    // Optimistic update - move card to top of its column and recalculate ranks
    setCards(prevCards => {
      const filtered = prevCards.filter(c => c.id !== card.id);
      const sameStatus = filtered.filter(c => c.status === card.status);
      const otherCards = filtered.filter(c => c.status !== card.status);
      
      // Recalculate ranks for the column
      const reorderedColumn = [card, ...sameStatus].map((c, index) => ({
        ...c,
        rank: index + 1
      }));
      
      return [...reorderedColumn, ...otherCards];
    });

    setContextMenu(null);
    
    // Persist ranks - calculate updated column from oldCards
    try {
      const filtered = oldCards.filter(c => c.id !== card.id);
      const sameStatus = filtered.filter(c => c.status === card.status);
      const reorderedColumn = [card, ...sameStatus].map((c, index) => ({
        ...c,
        rank: index + 1
      }));
      await persistRanks(reorderedColumn, oldCards);
    } catch (error) {
      // Revert on error
      setCards(oldCards);
      console.error('Error moving card to top:', error);
    }
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

    const oldCards = [...cards];

    // Optimistic update - swap with card above and recalculate ranks
    setCards(prevCards => {
      const newCards = [...prevCards];
      const sameStatus = newCards.filter(c => c.status === card.status);
      const otherCards = newCards.filter(c => c.status !== card.status);
      const cardIndex = sameStatus.findIndex(c => c.id === card.id);
      
      if (cardIndex > 0) {
        [sameStatus[cardIndex - 1], sameStatus[cardIndex]] = [sameStatus[cardIndex], sameStatus[cardIndex - 1]];
      }
      
      // Recalculate ranks for the column
      const reorderedColumn = sameStatus.map((c, index) => ({
        ...c,
        rank: index + 1
      }));
      
      return [...reorderedColumn, ...otherCards];
    });

    setContextMenu(null);
    
    // Persist ranks - calculate updated column from oldCards
    try {
      const newCards = [...oldCards];
      const sameStatus = newCards.filter(c => c.status === card.status);
      const cardIndex = sameStatus.findIndex(c => c.id === card.id);
      
      if (cardIndex > 0) {
        [sameStatus[cardIndex - 1], sameStatus[cardIndex]] = [sameStatus[cardIndex], sameStatus[cardIndex - 1]];
      }
      
      const reorderedColumn = sameStatus.map((c, index) => ({
        ...c,
        rank: index + 1
      }));
      await persistRanks(reorderedColumn, oldCards);
    } catch (error) {
      // Revert on error
      setCards(oldCards);
      console.error('Error moving card up:', error);
    }
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

    const oldCards = [...cards];

    // Optimistic update - swap with card below and recalculate ranks
    setCards(prevCards => {
      const newCards = [...prevCards];
      const sameStatus = newCards.filter(c => c.status === card.status);
      const cardIndex = sameStatus.findIndex(c => c.id === card.id);
      
      if (cardIndex < sameStatus.length - 1) {
        [sameStatus[cardIndex], sameStatus[cardIndex + 1]] = [sameStatus[cardIndex + 1], sameStatus[cardIndex]];
      }
      
      const otherCards = newCards.filter(c => c.status !== card.status);
      
      // Recalculate ranks for the column
      const reorderedColumn = sameStatus.map((c, index) => ({
        ...c,
        rank: index + 1
      }));
      
      return [...reorderedColumn, ...otherCards];
    });

    setContextMenu(null);
    
    // Persist ranks - calculate updated column from oldCards
    try {
      const newCards = [...oldCards];
      const sameStatus = newCards.filter(c => c.status === card.status);
      const cardIndex = sameStatus.findIndex(c => c.id === card.id);
      
      if (cardIndex < sameStatus.length - 1) {
        [sameStatus[cardIndex], sameStatus[cardIndex + 1]] = [sameStatus[cardIndex + 1], sameStatus[cardIndex]];
      }
      
      const reorderedColumn = sameStatus.map((c, index) => ({
        ...c,
        rank: index + 1
      }));
      await persistRanks(reorderedColumn, oldCards);
    } catch (error) {
      // Revert on error
      setCards(oldCards);
      console.error('Error moving card down:', error);
    }
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

    const oldCards = [...cards];

    // Optimistic update - move card to bottom of its column and recalculate ranks
    setCards(prevCards => {
      const filtered = prevCards.filter(c => c.id !== card.id);
      const sameStatus = filtered.filter(c => c.status === card.status);
      const otherCards = filtered.filter(c => c.status !== card.status);
      
      // Recalculate ranks for the column
      const reorderedColumn = [...sameStatus, card].map((c, index) => ({
        ...c,
        rank: index + 1
      }));
      
      return [...reorderedColumn, ...otherCards];
    });

    setContextMenu(null);
    
    // Persist ranks - calculate updated column from oldCards
    try {
      const filtered = oldCards.filter(c => c.id !== card.id);
      const sameStatus = filtered.filter(c => c.status === card.status);
      const reorderedColumn = [...sameStatus, card].map((c, index) => ({
        ...c,
        rank: index + 1
      }));
      await persistRanks(reorderedColumn, oldCards);
    } catch (error) {
      // Revert on error
      setCards(oldCards);
      console.error('Error moving card to bottom:', error);
    }
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
      const endpoint = card.type === 'task' 
        ? `/api/stacks/tasks/${card.id}`
        : `/api/v1/stacks/stories/${card.id}`;
      
      const response = await fetch(endpoint, {
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
                            <FlagIcon className="h-4 w-4 text-error-text" />
                          </div>
                        )}
                        
                        <div className="mb-2 ml-8">
                          <div className="flex items-start gap-2 mb-1">
                            {/* Bug pill for bug type */}
                            {(card.originalType === 'bug' || card.tags?.includes('bug')) && (
                              <span className="bg-error-bg text-error-text px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0">
                                bug
                              </span>
                            )}
                            <h4 className="font-medium text-foreground text-sm leading-tight">
                              {card.title}
                            </h4>
                          </div>
                          {card.description && (
                            <p className="text-xs text-muted line-clamp-2">
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
