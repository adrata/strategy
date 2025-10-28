"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PanelLayout } from "@/platform/ui/components/layout/PanelLayout";
import { RightPanel } from "@/platform/ui/components/chat/RightPanel";
import { RevenueOSProvider, useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
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
  
  // Document viewing in middle panel
  viewingDocument: AtriumDocument | null;
  setViewingDocument: (document: AtriumDocument | null) => void;
  isEditMode: boolean;
  setIsEditMode: (editMode: boolean) => void;
  
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
  const [viewingDocument, setViewingDocument] = useState<AtriumDocument | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
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
        viewingDocument,
        setViewingDocument,
        isEditMode,
        setIsEditMode,
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
        <RevenueOSProvider>
          <ZoomProvider>
            <ProfilePopupProvider>
              <AtriumLayoutContent>
                {children}
              </AtriumLayoutContent>
            </ProfilePopupProvider>
          </ZoomProvider>
        </RevenueOSProvider>
      </AtriumContext.Provider>
    </QueryClientProvider>
  );
}

// Custom Right Panel for Atrium
function AtriumRightPanel() {
  return <RightPanel />;
}

// Layout content component that can use context hooks
function AtriumLayoutContent({ children }: { children: React.ReactNode }) {
  const { ui } = useRevenueOS();

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
