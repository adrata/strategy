"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useWorkshop } from "./layout";
import { DocumentGrid } from "./components/DocumentGrid";
import { DocumentList } from "./components/DocumentList";
import { DocumentViewer } from "./components/DocumentViewer";
import { StatsView } from "./components/StatsView";
import { DocumentExplorer } from "./components/DocumentExplorer";
import { UploadModal } from "./components/UploadModal";
import { DocumentTypeSelector } from "./components/DocumentTypeSelector";
import { ShareModal } from "./components/ShareModal";
import { StandardHeader } from "@/platform/ui/components/layout/StandardHeader";
import { generateSlug } from "@/platform/utils/url-utils";
import { useRouter } from "next/navigation";
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  CloudArrowUpIcon,
  DocumentPlusIcon,
  ArrowsUpDownIcon,
} from "@heroicons/react/24/outline";

export default function WorkshopPage() {
  const router = useRouter();
  const {
    selectedDocument,
    selectedFolder,
    viewingDocument,
    setViewingDocument,
    isEditMode,
    setIsEditMode,
    activeTab,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    selectedDocumentType,
    setSelectedDocumentType,
    currentFolderId,
    isUploadModalOpen,
    setIsUploadModalOpen,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isShareModalOpen,
    setIsShareModalOpen,
    workspace,
  } = useWorkshop();

  const [showFilters, setShowFilters] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState('name');

  // Set page title dynamically
  useEffect(() => {
    document.title = "Workbench • Documents";
  }, []);

  const handleCreateDocument = useCallback(async (documentType: string) => {
    try {
      // Create a new document via API
      const response = await fetch('/api/v1/documents/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `New ${documentType.charAt(0).toUpperCase() + documentType.slice(1)} Document`,
          documentType: documentType,
          workspaceId: workspace?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create document');
      }

      const newDocument = await response.json();
      
      // Generate slug for navigation
      const slug = generateSlug(newDocument.title, newDocument.id);
      const workspaceSlug = workspace?.slug || 'default';
      
      // Navigate to the new document using slug-based URL
      router.push(`/${workspaceSlug}/workbench/${slug}`);
      
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating document:', error);
      // Fallback to old behavior if API fails
      const newDocument = {
        id: `new-${Date.now()}`,
        title: `New ${documentType.charAt(0).toUpperCase() + documentType.slice(1)} Document`,
        documentType: documentType,
        content: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setViewingDocument(newDocument);
      setIsCreateModalOpen(false);
    }
  }, [setIsCreateModalOpen, setViewingDocument, workspace, router]);

  const handleUploadFiles = useCallback(() => {
    setIsUploadModalOpen(true);
  }, [setIsUploadModalOpen]);

  const handleShareDocument = useCallback(() => {
    if (selectedDocument) {
      setIsShareModalOpen(true);
    }
  }, [selectedDocument, setIsShareModalOpen]);

  const handleBackToGrid = useCallback(() => {
    setViewingDocument(null);
    setIsEditMode(false);
  }, [setViewingDocument, setIsEditMode]);

  const handleToggleEditMode = useCallback(() => {
    setIsEditMode(!isEditMode);
  }, [isEditMode, setIsEditMode]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Standardized Header - Only show when not viewing a document */}
      {!viewingDocument && (
        <StandardHeader
          title="Workbench"
          subtitle={
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">
                {activeTab === 'my-documents' && 'My Documents'}
                {activeTab === 'shared-with-me' && 'Shared with Me'}
                {activeTab === 'recent' && 'Recent'}
                {activeTab === 'starred' && 'Starred'}
                {activeTab === 'trash' && 'Trash'}
                {activeTab === 'stats' && 'Stats'}
                {activeTab === 'folders' && 'My Folders'}
              </span>
              {selectedFolder && (
                <>
                  <span className="text-muted">/</span>
                  <span className="text-sm text-gray-700">{selectedFolder.name}</span>
                </>
              )}
            </div>
          }
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={handleUploadFiles}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-background border border-border rounded-lg hover:bg-panel-background transition-colors"
              >
                <CloudArrowUpIcon className="w-4 h-4" />
                Upload
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                New
              </button>
            </div>
          }
        />
      )}

      {/* Sub-header with Search and Controls - Only show when not viewing a document */}
      {!viewingDocument && (
        <div className="flex items-center gap-4 py-2 w-full bg-background px-6">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-4 pr-10 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors w-full bg-background"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="relative min-w-32">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="relative w-full bg-background border border-border rounded-lg px-3 py-2 text-left text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors flex items-center gap-2"
          >
            <FunnelIcon className="w-4 h-4 text-muted" />
            <span className="block truncate text-foreground">Filter</span>
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="relative min-w-32">
          <button
            type="button"
            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
            className="relative w-full bg-background border border-border rounded-lg px-3 py-2 text-left text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors flex items-center gap-2"
          >
            <ArrowsUpDownIcon className="w-4 h-4 text-muted" />
            <span className="block truncate text-foreground">Sort</span>
          </button>
        </div>

        {/* Columns Dropdown */}
        <div className="relative min-w-32">
          <button
            type="button"
            onClick={() => setIsColumnsDropdownOpen(!isColumnsDropdownOpen)}
            className="relative w-full bg-background border border-border rounded-lg px-3 py-2 text-left text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <span className="block truncate text-foreground">Columns</span>
          </button>
        </div>

      </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="px-6 py-4 border-b border-border bg-panel-background">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Type
              </label>
              <select
                value={selectedDocumentType || ''}
                onChange={(e) => setSelectedDocumentType(e.target.value || null)}
                className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="paper">Paper</option>
                <option value="pitch">Pitch</option>
                <option value="grid">Grid</option>
                <option value="code">Code</option>
              </select>
            </div>
            
            {/* Add more filters here */}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {viewingDocument ? (
          <DocumentViewer
            document={viewingDocument}
            isEditMode={isEditMode}
            onBack={handleBackToGrid}
            onToggleEditMode={handleToggleEditMode}
            onShare={handleShareDocument}
          />
        ) : activeTab === 'stats' ? (
          <StatsView />
        ) : activeTab === 'folders' ? (
          <DocumentExplorer />
        ) : (
          viewMode === 'grid' ? (
            <DocumentGrid />
          ) : (
            <DocumentList />
          )
        )}
      </div>

      {/* Modals */}
      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
      />
      
      <DocumentTypeSelector 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onSelect={handleCreateDocument}
      />
      
      {selectedDocument && (
        <ShareModal 
          isOpen={isShareModalOpen} 
          onClose={() => setIsShareModalOpen(false)}
          document={selectedDocument}
        />
      )}
    </div>
  );
}
