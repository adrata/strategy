"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useAtrium } from "./layout";
import { DocumentGrid } from "./components/DocumentGrid";
import { DocumentList } from "./components/DocumentList";
import { UploadModal } from "./components/UploadModal";
import { DocumentTypeSelector } from "./components/DocumentTypeSelector";
import { ShareModal } from "./components/ShareModal";
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  CloudArrowUpIcon,
  DocumentPlusIcon,
} from "@heroicons/react/24/outline";

export default function AtriumPage() {
  const {
    selectedDocument,
    selectedFolder,
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

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900">Atrium</h1>
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
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>

          {/* Filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
            }`}
          >
            <FunnelIcon className="w-4 h-4" />
          </button>

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

          {/* Actions */}
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
        </div>
      </div>

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
        {viewMode === 'grid' ? (
          <DocumentGrid />
        ) : (
          <DocumentList />
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
