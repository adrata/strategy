"use client";

/**
 * Stacks Middle Panel Component
 * 
 * Main content area for Stacks section with chat-like interface.
 * Follows 2025 best practices with proper state management and performance.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { StacksMetrics } from './StacksMetrics';
import { StacksItemList } from './StacksItemList';
import { StacksItemDetail } from './StacksItemDetail';
import { StacksBoard } from './StacksBoard';
import { StacksBacklogList } from './StacksBacklogList';
import { StacksBacklogTable } from './StacksBacklogTable';
import { StacksFilters } from './StacksFilters';
import { ShipButton } from './ShipButton';
import { AddStacksModal } from './AddStacksModal';
import { StoryDetailView } from './StoryDetailView';
import { VisionList } from './VisionList';
import { VisionDocumentDetail } from './VisionDocumentDetail';
import { ErrorBoundary } from '@/frontend/components/ErrorBoundary';
import { useStacks } from '@/products/stacks/context/StacksProvider';

interface StacksMiddlePanelProps {
  activeSubSection: string;
  selectedItem: any;
  onItemClick: (item: any) => void;
  isLoading: boolean;
  storyId?: string;
}

interface StacksItem {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done' | 'idea';
  priority: 'low' | 'medium' | 'high';
  type: 'epic' | 'story' | 'bug' | 'future';
  assignee?: string;
  createdAt: string;
  updatedAt: string;
}

// Mock data for demonstration
const mockEpics: StacksItem[] = [
  {
    id: '01HZ8K9M2N3P4Q5R6S7T8U9V0',
    title: 'User Authentication System',
    description: 'Complete overhaul of user authentication including OAuth, 2FA, and session management',
    status: 'in-progress',
    priority: 'high',
    type: 'epic',
    assignee: 'John Doe',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20'
  },
  {
    id: '01HZ8K9M2N3P4Q5R6S7T8U9V1',
    title: 'Dashboard Redesign',
    description: 'Modern responsive dashboard with improved UX and performance',
    status: 'todo',
    priority: 'medium',
    type: 'epic',
    assignee: 'Jane Smith',
    createdAt: '2024-01-16',
    updatedAt: '2024-01-18'
  }
];

const mockStories: StacksItem[] = [
  {
    id: '01HZ8K9M2N3P4Q5R6S7T8U9V2',
    title: 'User can login with email and password',
    description: 'As a user, I want to login with my email and password so that I can access my account',
    status: 'done',
    priority: 'high',
    type: 'story',
    assignee: 'John Doe',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-19'
  },
  {
    id: '01HZ8K9M2N3P4Q5R6S7T8U9V3',
    title: 'User can reset forgotten password',
    description: 'As a user, I want to reset my password when I forget it so that I can regain access to my account',
    status: 'in-progress',
    priority: 'medium',
    type: 'story',
    assignee: 'Jane Smith',
    createdAt: '2024-01-12',
    updatedAt: '2024-01-21'
  }
];

const mockBugs: StacksItem[] = [
  {
    id: '01HZ8K9M2N3P4Q5R6S7T8U9V4',
    title: 'Login button not responding on mobile',
    description: 'The login button becomes unresponsive when tapped on mobile devices running iOS 17',
    status: 'todo',
    priority: 'high',
    type: 'bug',
    assignee: 'Mike Johnson',
    createdAt: '2024-01-22',
    updatedAt: '2024-01-22'
  },
  {
    id: '01HZ8K9M2N3P4Q5R6S7T8U9V5',
    title: 'Dashboard cards overlapping on small screens',
    description: 'Dashboard cards overlap when screen width is less than 768px',
    status: 'in-progress',
    priority: 'medium',
    type: 'bug',
    assignee: 'Sarah Wilson',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-23'
  }
];

const mockFutures: StacksItem[] = [
  {
    id: '01HZ8K9M2N3P4Q5R6S7T8U9V6',
    title: 'AI-powered code suggestions',
    description: 'Integrate AI to provide intelligent code completion and suggestions based on project context',
    status: 'idea',
    priority: 'low',
    type: 'future',
    assignee: 'Alex Chen',
    createdAt: '2024-01-25',
    updatedAt: '2024-01-25'
  },
  {
    id: '01HZ8K9M2N3P4Q5R6S7T8U9V7',
    title: 'Real-time collaboration features',
    description: 'Add real-time editing capabilities for multiple users working on the same project',
    status: 'idea',
    priority: 'medium',
    type: 'future',
    assignee: 'Emma Davis',
    createdAt: '2024-01-24',
    updatedAt: '2024-01-24'
  },
  {
    id: '01HZ8K9M2N3P4Q5R6S7T8U9V8',
    title: 'Advanced analytics dashboard',
    description: 'Create comprehensive analytics dashboard with custom metrics and reporting',
    status: 'idea',
    priority: 'low',
    type: 'future',
    assignee: 'David Brown',
    createdAt: '2024-01-23',
    updatedAt: '2024-01-23'
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'todo': return 'bg-hover text-gray-800';
    case 'in-progress': return 'bg-blue-100 text-blue-800';
    case 'done': return 'bg-green-100 text-green-800';
    default: return 'bg-hover text-gray-800';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'low': return 'text-green-600';
    case 'medium': return 'text-yellow-600';
    case 'high': return 'text-red-600';
    default: return 'text-muted';
  }
};

export function StacksMiddlePanel({ 
  activeSubSection, 
  selectedItem, 
  onItemClick, 
  isLoading,
  storyId
}: StacksMiddlePanelProps) {
  const stacksContext = useStacks();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailItem, setDetailItem] = useState<StacksItem | null>(null);
  const [showAddStacksModal, setShowAddStacksModal] = useState(false);
  const [sortField, setSortField] = useState('priority');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [visibleColumns, setVisibleColumns] = useState(['title', 'priority', 'status', 'assignee', 'epic', 'workstream', 'dueDate', 'timeInStatus']);
  const [filters, setFilters] = useState({
    priority: 'all',
    status: 'all',
    workstream: 'all',
    assignee: 'all'
  });
  const [selectedVisionDocument, setSelectedVisionDocument] = useState<{ id: string; documentType: 'paper' | 'pitch' } | null>(null);

  // Handle story detail view when storyId is provided
  useEffect(() => {
    if (storyId && !selectedItem) {
      // TODO: Fetch story details from API using storyId
      // For now, we'll show a placeholder
      console.log('Loading story details for:', storyId);
    }
  }, [storyId, selectedItem]);

  // Show story detail view if storyId is provided
  if (storyId) {
    return (
      <StoryDetailView 
        storyId={storyId}
        onClose={() => {
          // Navigate back to workstream
          const workspaceSlug = window.location.pathname.split('/')[1];
          window.location.href = `/${workspaceSlug}/stacks/workstream`;
        }}
      />
    );
  }

  // Get items based on active section
  const getItemsForSection = (section: string): StacksItem[] => {
    switch (section) {
      case 'epics': return mockEpics;
      case 'stories': return mockStories;
      case 'bugs': return mockBugs;
      case 'futures': return mockFutures;
      default: return [];
    }
  };

  const currentItems = getItemsForSection(activeSubSection);

  // Filter items based on search and status
  const filteredItems = useMemo(() => {
    return currentItems.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [currentItems, searchQuery, filterStatus]);

  const handleCreateItem = () => {
    setShowAddStacksModal(true);
  };

  const handleStacksAdded = (stacks: any) => {
    console.log('Stacks added:', stacks);
    // Trigger refresh via context - this will sync left panel and middle panel
    if (stacksContext?.triggerRefresh) {
      stacksContext.triggerRefresh();
    }
  };

  const handleItemClick = (item: StacksItem) => {
    setDetailItem(item);
    setShowDetailModal(true);
    onItemClick(item);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setDetailItem(null);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleSortChange = (field: string) => {
    setSortField(field);
    // Toggle direction if same field, otherwise default to desc
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortDirection('desc');
    }
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleColumnVisibilityChange = (columns: string[]) => {
    setVisibleColumns(columns);
  };

  // Show loading state if isLoading is true
  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary)]"></div>
            <p className="text-muted text-sm">Loading Stacks...</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle special sections that don't use the item list interface
  if (activeSubSection === 'vision') {
    return (
      <div className="h-full flex flex-col bg-background">
        {selectedVisionDocument ? (
          <VisionDocumentDetail
            documentId={selectedVisionDocument.id}
            documentType={selectedVisionDocument.documentType}
            onBack={() => setSelectedVisionDocument(null)}
          />
        ) : (
          <VisionList onDocumentSelect={(document) => {
            setSelectedVisionDocument({
              id: document.id,
              documentType: document.documentType
            });
          }} />
        )}
      </div>
    );
  }

  if (activeSubSection === 'chronicle') {
    return (
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground capitalize">
                {activeSubSection}
              </h1>
              <p className="text-sm text-muted mt-1">
                Business intelligence reports and insights
              </p>
            </div>
          </div>
        </div>

        {/* Chronicle Content - Coming Soon */}
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Chronicle Coming Soon
              </h3>
              <p className="text-muted mb-4">
                Business intelligence reports will be available here soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeSubSection === 'metrics') {
    return (
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground capitalize">
                {activeSubSection}
              </h1>
              <p className="text-sm text-muted mt-1">
                Product and engineering performance indicators
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Content */}
        <div className="flex-1 overflow-hidden">
          <StacksMetrics />
        </div>
      </div>
    );
  }

  // Handle item list sections (epics, stories, bugs, futures)
  if (['epics', 'stories', 'bugs', 'futures'].includes(activeSubSection)) {
    return (
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground capitalize">
                {activeSubSection}
              </h1>
              <p className="text-sm text-muted mt-1">
                Manage your {activeSubSection} items and projects
              </p>
            </div>
            <button
              onClick={handleCreateItem}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              New {activeSubSection.slice(0, -1)}
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search stacks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-4 w-4 text-muted" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="all">All Status</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
                {activeSubSection === 'futures' && <option value="idea">Idea</option>}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <StacksItemList
            items={filteredItems}
            onItemClick={handleItemClick}
            isLoading={isLoading}
            searchQuery={searchQuery}
          />
        </div>

        {/* Detail Modal */}
        {showDetailModal && detailItem && (
          <StacksItemDetail
            item={detailItem}
            onClose={handleCloseDetail}
          />
        )}
      </div>
    );
  }

  // Get header title and description based on active section
  const getHeaderInfo = () => {
    switch (activeSubSection) {
      case 'workstream':
        return {
          title: 'Workstream',
          description: 'Visual task management board'
        };
      case 'backlog':
        return {
          title: 'Backlog',
          description: 'Prioritized work queue'
        };
      case 'metrics':
        return {
          title: 'Metrics',
          description: 'Performance and analytics'
        };
      default:
        return {
          title: 'Stacks',
          description: 'Visual task management board'
        };
    }
  };

  const headerInfo = getHeaderInfo();

  // Handle stacks section (also handles workstream)
  if (activeSubSection === 'stacks' || activeSubSection === 'stacks-build' || activeSubSection === 'workstream') {
    return (
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {headerInfo.title}
              </h1>
              <p className="text-sm text-muted mt-1">
                {headerInfo.description}
              </p>
            </div>
            <div className="flex items-center gap-3">
                <button
                  onClick={handleCreateItem}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Stacks
                </button>
                <ErrorBoundary>
                  <ShipButton />
                </ErrorBoundary>
            </div>
          </div>

          {/* Add Stacks Modal */}
          <AddStacksModal
            isOpen={showAddStacksModal}
            onClose={() => setShowAddStacksModal(false)}
            onStacksAdded={handleStacksAdded}
          />

          {/* Search and Filters */}
          <StacksFilters
            section="stories"
            totalCount={0} // TODO: Get actual count from data
            onSearchChange={handleSearchChange}
            onSortChange={handleSortChange}
            onFilterChange={handleFilterChange}
            onColumnVisibilityChange={handleColumnVisibilityChange}
            visibleColumns={visibleColumns}
            sortField={sortField}
            sortDirection={sortDirection}
          />
        </div>

        {/* Stacks Board Content */}
        <div className="flex-1 overflow-hidden">
          <StacksBoard onCardClick={onItemClick} />
        </div>
      </div>
    );
  }

  // Handle backlog section (both sell and build)
  if (activeSubSection === 'backlog' || activeSubSection === 'backlog-build') {
    return (
      <ErrorBoundary>
        <StacksBacklogTable onItemClick={onItemClick} />
      </ErrorBoundary>
    );
  }

  // Handle metrics section
  if (activeSubSection === 'metrics') {
    return <StacksMetrics />;
  }

  // Handle deep backlog section (both sell and build)
  if (activeSubSection === 'deep-backlog' || activeSubSection === 'deep-backlog-build') {
    return <StacksBacklogList onItemClick={onItemClick} />;
  }

  // Default fallback for other sections
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground capitalize">
              {activeSubSection}
            </h1>
            <p className="text-sm text-muted mt-1">
              Manage your {activeSubSection} tasks and projects
            </p>
          </div>
          <button
            onClick={handleCreateItem}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            New Task
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search stacks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-hover border border-border rounded-lg transition-colors">
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
              Sort
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-hover border border-border rounded-lg transition-colors">
              <FunnelIcon className="h-4 w-4" />
              Filter
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-hover border border-border rounded-lg transition-colors">
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
              Columns
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {activeSubSection} Coming Soon
              </h3>
              <p className="text-muted mb-4">
                This section is under development
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

