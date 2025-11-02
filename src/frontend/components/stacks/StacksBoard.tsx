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
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { useUnifiedAuth } from '@/platform/auth';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { getWorkspaceIdBySlug } from '@/platform/config/workspace-mapping';
import { StacksContextMenu } from './StacksContextMenu';
// Removed mock data imports

interface StackCard {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'up-next' | 'in-progress' | 'shipped' | 'qa1' | 'qa2' | 'built';
  viewType?: 'main' | 'list' | 'grid';
  product?: string | null;
  section?: string | null;
  assignee?: string;
  dueDate?: string;
  tags?: string[];
  epic?: {
    id: string;
    title: string;
    description?: string;
  };
  timeInStatus?: number; // days in current status
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
    color: 'bg-[var(--background)] border-[var(--border)]',
    icon: ClockIcon,
    description: 'Ready to start'
  },
  {
    key: 'in-progress',
    label: 'Working On',
    color: 'bg-[var(--background)] border-[var(--border)]',
    icon: CogIcon,
    description: 'In progress'
  },
  {
    key: 'built',
    label: 'Built',
    color: 'bg-[var(--background)] border-[var(--border)]',
    icon: CheckCircleIcon,
    description: 'Fully completed'
  },
  {
    key: 'qa1',
    label: 'QA1',
    color: 'bg-[var(--background)] border-[var(--border)]',
    icon: ClockIcon,
    description: 'First quality assurance'
  },
  {
    key: 'qa2',
    label: 'QA2',
    color: 'bg-[var(--background)] border-[var(--border)]',
    icon: ClockIcon,
    description: 'Second quality assurance'
  },
  {
    key: 'shipped',
    label: 'Shipped',
    color: 'bg-[var(--background)] border-[var(--border)]',
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
  const [draggedCard, setDraggedCard] = useState<StackCard | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [cards, setCards] = useState<StackCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; card: StackCard } | null>(null);
  
  // Check if we're in Notary Everyday workspace (check by workspace slug 'ne')
  const workspaceSlug = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : '';
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
        const apiUrl = `/api/v1/stacks/stories?workspaceId=${workspaceId}`;
        console.log('🔍 [StacksBoard] Fetching from:', apiUrl);
        console.log('🔍 [StacksBoard] Request workspace ID:', workspaceId);
        
        const response = await fetch(apiUrl, {
          credentials: 'include', // Include cookies for authentication
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('🔍 [StacksBoard] Response status:', response.status, response.ok);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 [StacksBoard] Fetched stories from database:', {
            totalStories: data.stories?.length || 0,
            stories: data.stories,
            workspaceId,
            isNotaryEveryday
          });
          
          if (data.stories && Array.isArray(data.stories)) {
            if (data.stories.length === 0) {
              console.log('ℹ️ [StacksBoard] No stories found for workspace:', workspaceId);
            }
            
            const sellingStories = filterSellingStories(data.stories);
            console.log('🎯 [StacksBoard] Filtered selling stories:', {
              original: data.stories.length,
              filtered: sellingStories.length,
              stories: sellingStories.map((s: any) => ({ id: s.id, title: s.title, status: s.status }))
            });
            
            // Filter out backlog items (todo status) - they belong in backlog view, not workstream board
            // Workstream board should only show items that are actively in progress or beyond
            const workstreamStories = sellingStories.filter((story: any) => {
              // Exclude 'todo' status items - they belong in backlog
              return story.status !== 'todo' && story.status !== null && story.status !== undefined;
            });
            
            console.log('🔍 [StacksBoard] After filtering backlog items (todo):', {
              before: sellingStories.length,
              after: workstreamStories.length,
              removed: sellingStories.length - workstreamStories.length
            });
            
            // Log status distribution before conversion
            const statusCounts = workstreamStories.reduce((acc: any, story: any) => {
              acc[story.status || 'null'] = (acc[story.status || 'null'] || 0) + 1;
              return acc;
            }, {});
            console.log('📊 [StacksBoard] Status distribution (workstream only):', statusCounts);
            
            const convertedCards = workstreamStories.map(convertNotaryStoryToStackCard);
            console.log('🔄 [StacksBoard] Converted cards:', convertedCards.length, 'cards');
            
            // Log status distribution after conversion
            const convertedStatusCounts = convertedCards.reduce((acc: any, card: StackCard) => {
              acc[card.status] = (acc[card.status] || 0) + 1;
              return acc;
            }, {});
            console.log('📊 [StacksBoard] Converted status distribution:', convertedStatusCounts);
            
            setCards(convertedCards);
          } else {
            console.warn('⚠️ [StacksBoard] Invalid response format - stories is not an array');
            console.warn('⚠️ [StacksBoard] Response data:', data);
            setCards([]);
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
          
          console.error('❌ [StacksBoard] API request failed:', {
            status: response.status,
            statusText: response.statusText,
            workspaceId,
            error: errorData
          });
          
          if (response.status === 400 && errorData?.code === 'WORKSPACE_REQUIRED') {
            console.error('❌ [StacksBoard] Workspace ID missing or invalid');
          } else if (response.status === 401) {
            console.error('❌ [StacksBoard] Authentication failed');
          } else if (response.status === 403) {
            console.error('❌ [StacksBoard] Access denied to workspace');
          } else {
            console.error('❌ [StacksBoard] Unexpected error:', response.status);
          }
          
          setCards([]);
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
  }, [ui.activeWorkspace?.id, authUser?.activeWorkspaceId, workspaceSlug, isNotaryEveryday]);
  
  // Helper function to filter selling stories
  const filterSellingStories = (stories: any[]): any[] => {
    // For now, return all stories since we don't have category filtering yet
    // In the future, this could filter by project category or other criteria
    return stories;
  };

  // Helper function to convert Notary story to StackCard format
  const convertNotaryStoryToStackCard = (story: any): StackCard => {
    // Map status values to board column statuses
    // Note: This function should only receive items that are NOT 'todo' status
    // (they should be filtered out before this function is called)
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
      viewType: story.viewType || 'main',
      product: story.product || null,
      section: story.section || null,
      assignee: story.assignee?.name || undefined,
      dueDate: story.dueDate,
      tags: story.tags || [],
      epic: story.epic,
      timeInStatus: story.timeInStatus,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt
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
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(288px, 1fr));
          gap: 1.5rem;
          padding: 0.5rem;
          height: 100%;
          overflow-y: auto;
        }
        
        /* At wider screens, show all in one row with horizontal scroll */
        @media (min-width: 1920px) {
          .stacks-kanban-container {
            display: flex;
            flex-wrap: nowrap;
            overflow-x: auto;
            overflow-y: hidden;
          }
        }
        
        /* At medium screens, allow 2 rows */
        @media (min-width: 1400px) and (max-width: 1919px) {
          .stacks-kanban-container {
            grid-template-columns: repeat(3, 288px);
          }
        }
        
        /* At smaller screens, allow wrapping to 2 rows */
        @media (max-width: 1399px) {
          .stacks-kanban-container {
            grid-template-columns: repeat(2, 288px);
          }
        }
        
        /* Very small screens - single column */
        @media (max-width: 640px) {
          .stacks-kanban-container {
            grid-template-columns: 1fr;
          }
        }
        
        .stacks-kanban-container::-webkit-scrollbar {
          display: none;
        }
        .stacks-kanban-container {
          -ms-overflow-style: none;
          scrollbar-width: none;
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
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
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
              className={`bg-[var(--background)] rounded-lg h-full flex flex-col transition-all duration-200 ${
                isDragOver 
                  ? 'ring-2 ring-[var(--accent)] border-2 border-[var(--accent)]' 
                  : 'border border-[var(--border)]'
              }`}
            >
              {/* Stage Header */}
              <div className={`p-4 border-b transition-colors duration-200 ${
                isDragOver 
                  ? 'border-[var(--accent)]/50 bg-[var(--hover)]/30' 
                  : 'border-[var(--border)]'
              }`}>
                <h3 className="font-medium text-[var(--foreground)] mb-2 text-sm uppercase tracking-wide flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {column.label}
                </h3>
                <div className="flex justify-between text-xs text-[var(--muted)]">
                  <span>{column.description}</span>
                </div>
                <p className="text-xs text-[var(--muted)] mt-1">{cards.length} {cards.length === 1 ? 'stack' : 'stacks'}</p>
              </div>

              {/* Stories List */}
              <div className={`stacks-column-content flex-1 p-4 space-y-2 overflow-y-auto transition-colors duration-200 ${
                isDragOver ? 'bg-[var(--hover)]/20' : ''
              }`}
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
              >
                {cards.length === 0 ? (
                  <div className={`text-center py-8 text-[var(--muted)] transition-colors duration-200 ${
                    isDragOver ? 'border-2 border-dashed border-[var(--accent)] rounded-lg bg-[var(--accent)]/5 flex flex-col items-center justify-center min-h-[120px]' : ''
                  }`}>
                    {isDragOver ? (
                      <span className="text-sm text-[var(--accent)] font-medium">Drop here</span>
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
                        className={`relative bg-[var(--background)] border border-[var(--border)] rounded-lg p-3 hover:border-[var(--accent)] transition-colors cursor-pointer ${
                          draggedCard?.id === card.id ? 'opacity-50' : ''
                        }`}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, card)}
                        onDragEnd={handleDragEnd}
                        onClick={() => onCardClick?.(card)}
                        onContextMenu={(e) => handleContextMenu(e, card)}
                      >
                        {/* Rank number in top left */}
                        <div className="absolute top-2 left-2 w-6 h-6 bg-[var(--panel-background)] text-[var(--foreground)] rounded-[12px] flex items-center justify-center text-xs font-bold flex-shrink-0 shrink-0">
                          {displayNumber}
                        </div>
                        
                        <div className="mb-2 ml-8">
                          <h4 className="font-medium text-[var(--foreground)] text-sm leading-tight mb-1">
                            {card.title}
                          </h4>
                          {card.description && (
                            <p className="text-xs text-[var(--muted)]">
                              {card.description}
                            </p>
                          )}
                        </div>
                        
                        {/* Epic Tag */}
                        {card.epic && (
                          <div className="mb-2 ml-8">
                            <span className="bg-[var(--panel-background)] text-[var(--foreground)] px-2 py-1 rounded text-xs font-medium">
                              Ep: {card.epic.title.replace(' Workstream', '')}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center text-xs text-[var(--muted)]">
                          <div className="flex items-center gap-2">
                            <span className="bg-[var(--panel-background)] text-[var(--muted)] px-2 py-1 rounded text-xs">
                              {card.viewType === 'list' ? 'List' : card.viewType === 'grid' ? 'Grid' : 'Main'}
                            </span>
                            {card.timeInStatus !== undefined && card.timeInStatus >= 3 && (
                              <span className="bg-[var(--error-bg)] text-[var(--error-text)] px-2 py-1 rounded text-xs font-medium">
                                {card.timeInStatus === 1 ? '1 Day' : `${card.timeInStatus} Days`}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {card.assignee && (
                              <span className="bg-[var(--panel-background)] text-[var(--foreground)] px-2 py-1 rounded-full text-xs">
                                {card.assignee}
                              </span>
                            )}
                            {card.updatedAt && (
                              <span className="text-[var(--muted)]">
                                {formatRelativeTime(card.updatedAt)}
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
                                className="bg-[var(--panel-background)] text-[var(--muted)] px-2 py-1 rounded text-xs"
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
                      <div className="mt-2 py-3 border-2 border-dashed border-[var(--accent)] rounded-lg bg-[var(--accent)]/5 flex items-center justify-center">
                        <span className="text-xs text-[var(--accent)] font-medium">Drop here</span>
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
