"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { PlusIcon, DocumentTextIcon, PresentationChartBarIcon } from '@heroicons/react/24/outline';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { useUnifiedAuth } from '@/platform/auth';
import { usePathname } from 'next/navigation';
import { getWorkspaceIdBySlug } from '@/platform/config/workspace-mapping';
import { useStacks } from '@/products/stacks/context/StacksProvider';
import { EpicGoalBar } from './EpicGoalBar';
import { AddEpicModal } from './AddEpicModal';
import { StacksEpic } from './types';

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
  const workspaceSlug = pathname.split('/').filter(Boolean)[0];
  const stacksContext = useStacks();
  const { epics, triggerRefresh, isLoading: contextLoading } = stacksContext || { epics: [], triggerRefresh: () => {}, isLoading: false };

  const [coreDocs, setCoreDocs] = useState<CoreDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddEpicModalOpen, setIsAddEpicModalOpen] = useState(false);
  const [selectedEpic, setSelectedEpic] = useState<StacksEpic | null>(null);

  // Debug: Log epics
  useEffect(() => {
    console.log('📊 [EpicsPage] Epics from context:', epics?.length, epics);
    console.log('📊 [EpicsPage] Context loading:', contextLoading);
    console.log('📊 [EpicsPage] Full context:', stacksContext);
  }, [epics, contextLoading, stacksContext]);

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

  // Only show loading spinner for core docs initial load
  // Epics come from context and should display even while loading
  const isInitialLoad = loading && coreDocs.length === 0;

  return (
    <div className="h-full flex flex-col bg-background overflow-y-auto">
      {/* Header with Add Epics button */}
      <div className="flex-shrink-0 p-6 border-b border-border bg-background">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Epics</h1>
            <p className="text-sm text-muted mt-1">Strategy and execution planning</p>
          </div>
          <button
            onClick={() => setIsAddEpicModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm"
            type="button"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add Epic</span>
          </button>
        </div>

        {/* 3 Core Documents */}
        {coreDocs.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {coreDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 bg-card rounded-lg border border-border hover:border-[var(--primary)] transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  {doc.documentType === 'paper' ? (
                    <DocumentTextIcon className="w-6 h-6 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                  ) : (
                    <PresentationChartBarIcon className="w-6 h-6 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">{doc.title}</h3>
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
      </div>

      {/* Epic Cards */}
      <div className="flex-1 p-6">
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
        ) : (
          <div className="space-y-4">
            {(epics || []).map((epic) => (
              <div
                key={epic.id}
                onClick={() => handleEpicClick(epic)}
                className={`w-full p-6 bg-hover rounded-lg border border-border hover:border-[var(--primary)] transition-all cursor-pointer ${
                  selectedEpic?.id === epic.id ? 'border-[var(--primary)] bg-panel-background' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-foreground mb-2">{epic.title}</h2>
                    {epic.description && (
                      <p className="text-sm text-muted">{epic.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {epic.status && (
                      <span className="px-2 py-1 text-xs font-medium rounded capitalize bg-panel-background text-foreground">
                        {epic.status}
                      </span>
                    )}
                    {epic.priority && (
                      <span className="px-2 py-1 text-xs font-medium rounded capitalize bg-panel-background text-foreground">
                        {epic.priority}
                      </span>
                    )}
                  </div>
                </div>
                <EpicGoalBar epicId={epic.id} />
              </div>
            ))}
          </div>
        )}
      </div>

      {isAddEpicModalOpen && (
        <AddEpicModal
          isOpen={isAddEpicModalOpen}
          onClose={() => setIsAddEpicModalOpen(false)}
          onEpicCreated={handleEpicCreated}
        />
      )}
    </div>
  );
}

