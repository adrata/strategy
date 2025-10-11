"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useAtrium } from "./layout";
import { DocumentGrid } from "./components/DocumentGrid";
import { DocumentList } from "./components/DocumentList";
import { DocumentViewer } from "./components/DocumentViewer";
import { UploadModal } from "./components/UploadModal";
import { DocumentTypeSelector } from "./components/DocumentTypeSelector";
import { ShareModal } from "./components/ShareModal";
import { StandardHeader } from "@/platform/ui/components/layout/StandardHeader";
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  CloudArrowUpIcon,
  DocumentPlusIcon,
  ArrowsUpDownIcon,
} from "@heroicons/react/24/outline";

export default function AtriumPage() {
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
  } = useAtrium();

  const [showFilters, setShowFilters] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState('name');

  const handleCreateDocument = useCallback((documentType: string) => {
    // TODO: Implement document creation
    console.log('Creating document of type:', documentType);
    setIsCreateModalOpen(false);
  }, [setIsCreateModalOpen]);

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
    <div className="h-full flex flex-col bg-white">
      {/* Standardized Header - Only show when not viewing a document */}
      {!viewingDocument && (
        <StandardHeader
          title="Atrium"
          subtitle={
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {activeTab === 'my-documents' && 'My Documents'}
                {activeTab === 'shared-with-me' && 'Shared with Me'}
                {activeTab === 'recent' && 'Recent'}
                {activeTab === 'starred' && 'Starred'}
                {activeTab === 'trash' && 'Trash'}
              </span>
              {selectedFolder && (
                <>
                  <span className="text-gray-400">/</span>
                  <span className="text-sm text-gray-700">{selectedFolder.name}</span>
                </>
              )}
            </div>
          }
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={handleUploadFiles}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <CloudArrowUpIcon className="w-4 h-4" />
                Upload
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Create
              </button>
            </div>
          }
        />
      )}

      {/* Sub-header with Search and Controls - Only show when not viewing a document */}
      {!viewingDocument && (
        <div className="flex items-center gap-4 py-2 w-full bg-white px-6">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-4 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors w-full bg-white"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="relative min-w-32">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="relative w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-left text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors flex items-center gap-2"
          >
            <FunnelIcon className="w-4 h-4 text-gray-500" />
            <span className="block truncate text-gray-900">Filter</span>
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="relative min-w-32">
          <button
            type="button"
            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
            className="relative w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-left text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors flex items-center gap-2"
          >
            <ArrowsUpDownIcon className="w-4 h-4 text-gray-500" />
            <span className="block truncate text-gray-900">Sort</span>
          </button>
        </div>

        {/* Columns Dropdown */}
        <div className="relative min-w-32">
          <button
            type="button"
            onClick={() => setIsColumnsDropdownOpen(!isColumnsDropdownOpen)}
            className="relative w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-left text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <span className="block truncate text-gray-900">Columns</span>
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center border border-gray-300 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-l-lg transition-colors ${
              viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
            }`}
          >
            <Squares2X2Icon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-r-lg transition-colors ${
              viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
            }`}
          >
            <ListBulletIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Type
              </label>
              <select
                value={selectedDocumentType || ''}
                onChange={(e) => setSelectedDocumentType(e.target.value || null)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
