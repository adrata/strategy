"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PlusIcon, DocumentTextIcon, PresentationChartBarIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { useUnifiedAuth } from '@/platform/auth';
import { usePathname, useRouter } from 'next/navigation';
import { getWorkspaceIdBySlug } from '@/platform/config/workspace-mapping';
import { generateSlug } from '@/platform/utils/url-utils';
import { useStacks } from '@/products/stacks/context/StacksProvider';
import { EpicGoalBar } from './EpicGoalBar';
import { AddEpicModal } from './AddEpicModal';
import { EpicRankBadge } from './EpicRankBadge';
import { SortableEpicCard } from './SortableEpicCard';
import { StacksEpic } from './types';
import { getCategoryColors } from '@/platform/config/color-palette';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CoreDocument {
  id: string;
  title: string;
  description?: string;
  documentType: 'paper' | 'pitch';
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

interface EpicsPageProps {
  onEpicSelect?: (epic: StacksEpic) => void;
}

export function EpicsPage({ onEpicSelect }: EpicsPageProps) {
  const { ui } = useRevenueOS();
  const { user: authUser } = useUnifiedAuth();
  const pathname = usePathname();
  const router = useRouter();
  const workspaceSlug = pathname.split('/').filter(Boolean)[0];
  const stacksContext = useStacks();
  const { epics, triggerRefresh, isLoading: contextLoading } = stacksContext || { epics: [], triggerRefresh: () => {}, isLoading: false };

  const [coreDocs, setCoreDocs] = useState<CoreDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddEpicModalOpen, setIsAddEpicModalOpen] = useState(false);
  const [selectedEpic, setSelectedEpic] = useState<StacksEpic | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortedEpics, setSortedEpics] = useState<StacksEpic[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; epicId: string } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sort epics by rank (lower rank = more important), then by createdAt
  useEffect(() => {
    if (!epics || epics.length === 0) {
      setSortedEpics([]);
      return;
    }

    const sorted = [...epics].sort((a, b) => {
      // First sort by rank (if exists)
      if (a.rank !== null && a.rank !== undefined && b.rank !== null && b.rank !== undefined) {
        return a.rank - b.rank;
      }
      if (a.rank !== null && a.rank !== undefined) return -1;
      if (b.rank !== null && b.rank !== undefined) return 1;
      // Then by createdAt
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    
    setSortedEpics(sorted);
  }, [epics]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenu]);

  // Fetch core documents (3 most recent papers/pitches)
  const fetchCoreDocuments = useCallback(async () => {
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
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/v1/stacks/vision?workspaceId=${workspaceId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const documents = data.documents || [];
        // Get 3 most recent documents
        const sorted = documents.sort((a: CoreDocument, b: CoreDocument) => 
          new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
        );
        setCoreDocs(sorted.slice(0, 3));
      }
    } catch (error) {
      console.error('Failed to fetch core documents:', error);
    } finally {
      setLoading(false);
    }
  }, [ui.activeWorkspace?.id, workspaceSlug, authUser?.activeWorkspaceId, workspaceSlug]);

  useEffect(() => {
    fetchCoreDocuments();
  }, [fetchCoreDocuments]);

  const handleEpicClick = (epic: StacksEpic) => {
    setSelectedEpic(epic);
    if (onEpicSelect) {
      onEpicSelect(epic);
    }
  };

  const handleEpicCreated = () => {
    setIsAddEpicModalOpen(false);
    if (triggerRefresh) {
      triggerRefresh();
    }
  };

  // Get workspace ID for API calls
  const getWorkspaceId = (): string | null => {
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
    
    return workspaceId || null;
  };

  // Update epic ranks in API
  const updateEpicRanks = async (updatedEpics: StacksEpic[]) => {
    const workspaceId = getWorkspaceId();
    if (!workspaceId) {
      console.error('No workspace ID available');
      return;
    }

    try {
      // Update all epics with new ranks
      const updatePromises = updatedEpics.map((epic, index) => {
        const rank = index + 1;
        return fetch(`/api/stacks/epics/${epic.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            rank,
            workspaceId,
          }),
        });
      });

      await Promise.all(updatePromises);
      
      // Refresh epics after update
      if (triggerRefresh) {
        triggerRefresh();
      }
    } catch (error) {
      console.error('Failed to update epic ranks:', error);
    }
  };

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedEpics.findIndex((epic) => epic.id === active.id);
    const newIndex = sortedEpics.findIndex((epic) => epic.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Reorder epics
    const newSortedEpics = arrayMove(sortedEpics, oldIndex, newIndex);
    
    // Update ranks (1-based, lower = more important)
    const updatedEpics = newSortedEpics.map((epic, index) => ({
      ...epic,
      rank: index + 1,
    }));

    setSortedEpics(updatedEpics);
    
    // Persist to API
    await updateEpicRanks(updatedEpics);
  };

  // Right-click handler
  const handleContextMenu = (event: React.MouseEvent, epicId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      epicId,
    });
  };

  // Move epic to position
  const moveEpic = async (epicId: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    const currentIndex = sortedEpics.findIndex((e) => e.id === epicId);
    if (currentIndex === -1) return;

    let newIndex: number;
    
    switch (direction) {
      case 'up':
        newIndex = Math.max(0, currentIndex - 1);
        break;
      case 'down':
        newIndex = Math.min(sortedEpics.length - 1, currentIndex + 1);
        break;
      case 'top':
        newIndex = 0;
        break;
      case 'bottom':
        newIndex = sortedEpics.length - 1;
        break;
      default:
        return;
    }

    if (currentIndex === newIndex) return;

    const newSortedEpics = arrayMove(sortedEpics, currentIndex, newIndex);
    const updatedEpics = newSortedEpics.map((epic, index) => ({
      ...epic,
      rank: index + 1,
    }));

    setSortedEpics(updatedEpics);
    setContextMenu(null);
    
    await updateEpicRanks(updatedEpics);
  };

  // Only show loading spinner for core docs initial load
  // Epics come from context and should display even while loading
  const isInitialLoad = loading && coreDocs.length === 0;

  // Filter and apply to sorted epics
  const filteredAndSortedEpics = useMemo(() => {
    if (!sortedEpics || sortedEpics.length === 0) return [];
    
    return sortedEpics.filter(epic => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        epic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        epic.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || epic.status === statusFilter;
      
      // Priority filter
      const matchesPriority = priorityFilter === 'all' || epic.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [sortedEpics, searchQuery, statusFilter, priorityFilter]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Epics</h1>
            <p className="text-sm text-muted mt-1">Strategy and execution planning</p>
          </div>
          <button
            onClick={() => setIsAddEpicModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors font-medium text-sm"
            style={{
              backgroundColor: getCategoryColors('opportunities').light,
              borderColor: getCategoryColors('opportunities').border,
              color: getCategoryColors('opportunities').text,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = getCategoryColors('opportunities').bgHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = getCategoryColors('opportunities').light;
            }}
            type="button"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add Epic</span>
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* 3 Core Documents */}
          {coreDocs.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {coreDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    const slug = generateSlug(doc.title, doc.id);
                    router.push(`/${workspaceSlug}/workbench/${slug}`);
                  }}
                  className="group p-4 bg-card rounded-lg border border-border hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    {doc.documentType === 'paper' ? (
                      <DocumentTextIcon className="w-6 h-6 text-[var(--primary)] flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    ) : (
                      <PresentationChartBarIcon className="w-6 h-6 text-[var(--primary)] flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-[var(--primary)] transition-colors">{doc.title}</h3>
                      {doc.description && (
                        <p className="text-xs text-muted mt-1 line-clamp-2">{doc.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted capitalize">{doc.documentType}</span>
                        <span className="text-xs text-muted">•</span>
                        <span className="text-xs text-muted capitalize">{doc.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search epics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Epic Cards */}
          {!epics || epics.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted mb-4">No epics yet</p>
            <button
              onClick={() => setIsAddEpicModalOpen(true)}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Create your first epic
            </button>
          </div>
        ) : filteredAndSortedEpics.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted mb-2">No epics match your filters</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setPriorityFilter('all');
              }}
              className="text-sm text-[var(--primary)] hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredAndSortedEpics.map((e) => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {filteredAndSortedEpics.map((epic, index) => {
                  const rank = epic.rank || index + 1;
                  return (
                    <SortableEpicCard
                      key={epic.id}
                      epic={{ ...epic, rank }}
                      isSelected={selectedEpic?.id === epic.id}
                      isDragging={activeId === epic.id}
                      onClick={() => handleEpicClick(epic)}
                      onContextMenu={handleContextMenu}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
        </div>
      </div>

      {isAddEpicModalOpen && (
        <AddEpicModal
          isOpen={isAddEpicModalOpen}
          onClose={() => setIsAddEpicModalOpen(false)}
          onEpicCreated={handleEpicCreated}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-card border border-border rounded-lg shadow-lg z-50 py-2 min-w-[180px]"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          <button
            onClick={() => moveEpic(contextMenu.epicId, 'top')}
            className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
          >
            Move to Top
          </button>
          <button
            onClick={() => moveEpic(contextMenu.epicId, 'up')}
            className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
          >
            Move Up
          </button>
          <button
            onClick={() => moveEpic(contextMenu.epicId, 'down')}
            className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
          >
            Move Down
          </button>
          <button
            onClick={() => moveEpic(contextMenu.epicId, 'bottom')}
            className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
          >
            Move to Bottom
          </button>
        </div>
      )}
    </div>
  );
}

