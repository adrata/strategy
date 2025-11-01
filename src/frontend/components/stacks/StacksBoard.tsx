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
// Removed mock data imports

interface StackCard {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'up-next' | 'in-progress' | 'shipped' | 'qa1' | 'qa2' | 'built';
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
    color: 'bg-white border-gray-300',
    icon: ClockIcon,
    description: 'Ready to start'
  },
  {
    key: 'in-progress',
    label: 'Working On',
    color: 'bg-white border-gray-300',
    icon: CogIcon,
    description: 'In progress'
  },
  {
    key: 'built',
    label: 'Built',
    color: 'bg-white border-gray-300',
    icon: CheckCircleIcon,
    description: 'Fully completed'
  },
  {
    key: 'qa1',
    label: 'QA1',
    color: 'bg-white border-gray-300',
    icon: ClockIcon,
    description: 'First quality assurance'
  },
  {
    key: 'qa2',
    label: 'QA2',
    color: 'bg-white border-gray-300',
    icon: ClockIcon,
    description: 'Second quality assurance'
  },
  {
    key: 'shipped',
    label: 'Shipped',
    color: 'bg-white border-gray-300',
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
  const [cards, setCards] = useState<StackCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null);
  
  // Check if we're in Notary Everyday workspace (check by workspace slug 'ne')
  const workspaceSlug = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : '';
  const isNotaryEveryday = workspaceSlug === 'ne';
  
  // Define selling workstreams (revenue-generating)
  const SELLING_WORKSTREAMS = ['Video', 'Cold', 'Referral', 'Events', 'Social'];
  
  // Fetch stories from database
  useEffect(() => {
    const fetchStories = async () => {
      console.log('🔍 [StacksBoard] Starting fetch, workspace:', ui.activeWorkspace);
      
      if (!ui.activeWorkspace?.id) {
        console.warn('⚠️ [StacksBoard] No workspace ID, setting empty cards');
        setCards([]);
        setLoading(false);
        return;
      }

      try {
        const apiUrl = `/api/v1/stacks/stories?workspaceId=${ui.activeWorkspace.id}`;
        console.log('🔍 [StacksBoard] Fetching from:', apiUrl);
        
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
            isNotaryEveryday
          });
          
          if (data.stories && Array.isArray(data.stories)) {
            const sellingStories = filterSellingStories(data.stories);
            console.log('🎯 [StacksBoard] Filtered selling stories:', sellingStories);
            
            const convertedCards = sellingStories.map(convertNotaryStoryToStackCard);
            console.log('🔄 [StacksBoard] Converted cards:', convertedCards);
            
            setCards(convertedCards);
          } else {
            console.warn('⚠️ [StacksBoard] No stories in response or invalid format');
            setCards([]);
          }
        } else {
          const errorText = await response.text();
          console.warn('⚠️ [StacksBoard] API failed:', response.status, errorText);
          setCards([]);
        }
      } catch (error) {
        console.error('❌ [StacksBoard] Error fetching stories:', error);
        setCards([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [ui.activeWorkspace?.id, isNotaryEveryday]);
  
  // Helper function to filter selling stories
  const filterSellingStories = (stories: any[]): any[] => {
    // For now, return all stories since we don't have category filtering yet
    // In the future, this could filter by project category or other criteria
    return stories;
  };

  // Helper function to convert Notary story to StackCard format
  const convertNotaryStoryToStackCard = (story: any): StackCard => {
    // Map 'done' status to 'built' for backward compatibility
    let mappedStatus = story.status;
    if (story.status === 'done') {
      mappedStatus = 'built';
    }
    
    return {
      id: story.id,
      title: story.title,
      description: story.description,
      priority: story.priority || 'medium',
      status: mappedStatus as StackCard['status'],
      assignee: story.assignee ? `${story.assignee.firstName} ${story.assignee.lastName}` : undefined,
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

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Add visual feedback for drop zone with better styling
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.borderColor = '#2563eb';
      e.currentTarget.style.backgroundColor = '#eff6ff';
      e.currentTarget.style.borderWidth = '2px';
      e.currentTarget.style.borderStyle = 'dashed';
      e.currentTarget.style.transition = 'all 0.2s ease-in-out';
      e.currentTarget.style.transform = 'scale(1.02)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.15)';
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remove visual feedback for drop zone with smooth transition
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.borderColor = '#d1d5db';
      e.currentTarget.style.backgroundColor = 'white';
      e.currentTarget.style.borderWidth = '1px';
      e.currentTarget.style.borderStyle = 'solid';
      e.currentTarget.style.transform = 'scale(1)';
      e.currentTarget.style.boxShadow = 'none';
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    if (!draggedCard || draggedCard.status === targetStatus) {
      setDraggedCard(null);
      return;
    }

    // Update card status in state
    setCards(prevCards => 
      prevCards.map(card => 
        card.id === draggedCard.id 
          ? { ...card, status: targetStatus as StackCard['status'] }
          : card
      )
    );
    
    console.log(`Moving card ${draggedCard.title} to ${targetStatus}`);
    setDraggedCard(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

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
          height: 8px;
          width: 8px;
        }
        .stacks-kanban-container::-webkit-scrollbar-track {
          background: #d1d5db;
        }
        .stacks-kanban-container::-webkit-scrollbar-thumb {
          background: #6b7280;
          border-radius: 4px;
        }
        .stacks-kanban-container::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
      `}</style>
      <div 
        ref={setScrollContainer}
        className="stacks-kanban-container"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#6b7280 #d1d5db'
        }}
      >
      {STACK_COLUMNS.map((column) => {
        const cards = groupedCards[column.key] || [];
        const Icon = column.icon;

        return (
          <div
            key={column.key}
            className="flex-shrink-0"
            style={{ minWidth: '288px', width: '288px' }}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.key)}
          >
            <div className={`bg-white rounded-lg h-full flex flex-col`}>
              {/* Stage Header */}
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2 text-sm uppercase tracking-wide flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {column.label}
                </h3>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{column.description}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{cards.length} {cards.length === 1 ? 'story' : 'stories'}</p>
              </div>

              {/* Stories List */}
              <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                {cards.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-xs">No stacks</p>
                  </div>
                ) : (
                  cards.map((card, index) => (
                    <div
                      key={card.id}
                      className={`relative bg-white border border-gray-300 rounded-lg p-3 hover:border-gray-400 transition-colors cursor-pointer ${
                        draggedCard?.id === card.id ? 'opacity-50' : ''
                      }`}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, card)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onCardClick?.(card)}
                    >
                      {/* Rank number in top left */}
                      <div className="absolute top-2 left-2 w-6 h-6 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      
                      <div className="mb-2 ml-8">
                        <h4 className="font-medium text-gray-900 text-sm leading-tight mb-1">
                          {card.title}
                        </h4>
                        {card.description && (
                          <p className="text-xs text-gray-600">
                            {card.description}
                          </p>
                        )}
                      </div>
                      
                      {/* Epic Tag */}
                      {card.epic && (
                        <div className="mb-2 ml-8">
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                            Ep: {card.epic.title.replace(' Workstream', '')}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          {card.assignee && (
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                              {card.assignee}
                            </span>
                          )}
                          {card.timeInStatus !== undefined && card.timeInStatus >= 3 && (
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">
                              {card.timeInStatus === 1 ? '1 Day' : `${card.timeInStatus} Days`}
                            </span>
                          )}
                        </div>
                        {card.updatedAt && (
                          <span className="text-gray-500">
                            {formatRelativeTime(card.updatedAt)}
                          </span>
                        )}
                      </div>

                      {/* Tags */}
                      {card.tags && card.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {card.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      })}
      </div>
    </>
  );
}
