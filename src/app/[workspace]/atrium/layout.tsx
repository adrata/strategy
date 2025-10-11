"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PanelLayout } from "@/platform/ui/components/layout/PanelLayout";
import { RightPanel } from "@/platform/ui/components/chat/RightPanel";
import { AcquisitionOSProvider, useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";
import { AtriumLeftPanel } from "./components/AtriumLeftPanel";
import { AtriumDocument } from "./types/document";
import { AtriumFolder } from "./types/folder";

const queryClient = new QueryClient();

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

interface AtriumContextType {
  // Selected items
  selectedDocument: AtriumDocument | null;
  setSelectedDocument: (document: AtriumDocument | null) => void;
  selectedFolder: AtriumFolder | null;
  setSelectedFolder: (folder: AtriumFolder | null) => void;
  
  // Active tabs
  activeTab: 'my-documents' | 'shared-with-me' | 'recent' | 'starred' | 'trash';
  setActiveTab: (tab: 'my-documents' | 'shared-with-me' | 'recent' | 'starred' | 'trash') => void;
  
  // View mode
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  
  // Search and filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedDocumentType: string | null;
  setSelectedDocumentType: (type: string | null) => void;
  
  // Current folder context
  currentFolderId: string | null;
  setCurrentFolderId: (folderId: string | null) => void;
  
  // UI state
  isUploadModalOpen: boolean;
  setIsUploadModalOpen: (open: boolean) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  isShareModalOpen: boolean;
  setIsShareModalOpen: (open: boolean) => void;
}

const AtriumContext = createContext<AtriumContextType | undefined>(undefined);

export const useAtrium = () => {
  const context = useContext(AtriumContext);
  if (!context) {
    throw new Error('useAtrium must be used within AtriumProvider');
  }
  return context;
};

interface AtriumLayoutProps {
  children: React.ReactNode;
}

export default function AtriumLayout({ children }: AtriumLayoutProps) {
  const [selectedDocument, setSelectedDocument] = useState<AtriumDocument | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<AtriumFolder | null>(null);
  const [activeTab, setActiveTab] = useState<'my-documents' | 'shared-with-me' | 'recent' | 'starred' | 'trash'>('my-documents');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <AtriumContext.Provider value={{ 
        selectedDocument, 
        setSelectedDocument,
        selectedFolder,
        setSelectedFolder,
        activeTab, 
        setActiveTab,
        viewMode,
        setViewMode,
        searchQuery,
        setSearchQuery,
        selectedDocumentType,
        setSelectedDocumentType,
        currentFolderId,
        setCurrentFolderId,
        isUploadModalOpen,
        setIsUploadModalOpen,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isShareModalOpen,
        setIsShareModalOpen,
      }}>
        <AcquisitionOSProvider>
          <ZoomProvider>
            <ProfilePopupProvider>
              <AtriumLayoutContent>
                {children}
              </AtriumLayoutContent>
            </ProfilePopupProvider>
          </ZoomProvider>
        </AcquisitionOSProvider>
      </AtriumContext.Provider>
    </QueryClientProvider>
  );
}

// Custom Right Panel for Atrium
function AtriumRightPanel() {
  const { selectedDocument, setSelectedDocument, selectedFolder, setSelectedFolder } = useAtrium();

  // Handle document selection
  if (selectedDocument) {
    return (
      <div className="h-full flex flex-col bg-white border-l border-gray-200">
        {/* Header with X button */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div>
            <h2 className="font-semibold text-gray-900">{selectedDocument.title}</h2>
            <p className="text-sm text-gray-500 capitalize">{selectedDocument.documentType}</p>
          </div>
          <button
            onClick={() => setSelectedDocument(null)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Document Details */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner
              </label>
              <div className="text-sm text-gray-900">{selectedDocument.owner?.name}</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Created
              </label>
              <div className="text-sm text-gray-900">
                {new Date(selectedDocument.createdAt).toLocaleDateString()}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Modified
              </label>
              <div className="text-sm text-gray-900">
                {new Date(selectedDocument.updatedAt).toLocaleDateString()}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                selectedDocument.status === 'published' ? 'text-green-600 bg-green-100' :
                selectedDocument.status === 'draft' ? 'text-yellow-600 bg-yellow-100' :
                selectedDocument.status === 'archived' ? 'text-gray-600 bg-gray-100' :
                'text-red-600 bg-red-100'
              }`}>
                {selectedDocument.status.charAt(0).toUpperCase() + selectedDocument.status.slice(1)}
              </div>
            </div>

            {selectedDocument.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <div className="text-sm text-gray-900">{selectedDocument.description}</div>
              </div>
            )}

            {selectedDocument.tags && selectedDocument.tags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <div className="flex flex-wrap gap-1">
                  {selectedDocument.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statistics
              </label>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Views: {selectedDocument.viewCount || 0}</div>
                <div>Downloads: {selectedDocument.downloadCount || 0}</div>
                <div>Versions: {selectedDocument._count?.versions || 0}</div>
                <div>Comments: {selectedDocument._count?.comments || 0}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle folder selection
  if (selectedFolder) {
    return (
      <div className="h-full flex flex-col bg-white border-l border-gray-200">
        {/* Header with X button */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div>
            <h2 className="font-semibold text-gray-900">{selectedFolder.name}</h2>
            <p className="text-sm text-gray-500">Folder</p>
          </div>
          <button
            onClick={() => setSelectedFolder(null)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Folder Details */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner
              </label>
              <div className="text-sm text-gray-900">{selectedFolder.owner?.name}</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Created
              </label>
              <div className="text-sm text-gray-900">
                {new Date(selectedFolder.createdAt).toLocaleDateString()}
              </div>
            </div>

            {selectedFolder.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <div className="text-sm text-gray-900">{selectedFolder.description}</div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contents
              </label>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Documents: {selectedFolder._count?.documents || 0}</div>
                <div>Subfolders: {selectedFolder._count?.children || 0}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <RightPanel />;
}

// Layout content component that can use context hooks
function AtriumLayoutContent({ children }: { children: React.ReactNode }) {
  const { ui } = useAcquisitionOS();

  return (
    <PanelLayout
      thinLeftPanel={null}
      leftPanel={<AtriumLeftPanel />}
      middlePanel={children}
      rightPanel={<AtriumRightPanel />}
      zoom={100}
      isLeftPanelVisible={ui.isLeftPanelVisible}
      isRightPanelVisible={ui.isRightPanelVisible}
      onToggleLeftPanel={ui.toggleLeftPanel}
      onToggleRightPanel={ui.toggleRightPanel}
    />
  );
}
