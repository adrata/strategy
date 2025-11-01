"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PanelLayout } from "@/platform/ui/components/layout/PanelLayout";
import { RightPanel } from "@/platform/ui/components/chat/RightPanel";
import { RevenueOSProvider, useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";
import { ProfilePanelProvider, useProfilePanel } from "@/platform/ui/components/ProfilePanelContext";
import { ProfilePanel } from "@/platform/ui/components/ProfilePanel";
import { useUnifiedAuth } from "@/platform/auth";
import { WorkshopLeftPanel } from "./components/WorkshopLeftPanel";
import { WorkshopDocument } from "./types/document";
import { WorkshopFolder } from "./types/folder";

const queryClient = new QueryClient();

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

interface WorkshopContextType {
  // Selected items
  selectedDocument: WorkshopDocument | null;
  setSelectedDocument: (document: WorkshopDocument | null) => void;
  selectedFolder: WorkshopFolder | null;
  setSelectedFolder: (folder: WorkshopFolder | null) => void;
  
  // Document viewing in middle panel
  viewingDocument: WorkshopDocument | null;
  setViewingDocument: (document: WorkshopDocument | null) => void;
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

const WorkshopContext = createContext<WorkshopContextType | undefined>(undefined);

export const useWorkshop = () => {
  const context = useContext(WorkshopContext);
  if (!context) {
    throw new Error('useWorkshop must be used within WorkshopProvider');
  }
  return context;
};

interface WorkshopLayoutProps {
  children: React.ReactNode;
}

export default function WorkshopLayout({ children }: WorkshopLayoutProps) {
  const [selectedDocument, setSelectedDocument] = useState<WorkshopDocument | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<WorkshopFolder | null>(null);
  const [viewingDocument, setViewingDocument] = useState<WorkshopDocument | null>(null);
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
      <WorkshopContext.Provider value={{ 
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
              <ProfilePanelProvider>
                <WorkshopLayoutContent>
                  {children}
                </WorkshopLayoutContent>
              </ProfilePanelProvider>
            </ProfilePopupProvider>
          </ZoomProvider>
        </RevenueOSProvider>
      </WorkshopContext.Provider>
    </QueryClientProvider>
  );
}

// Custom Right Panel for Workshop
function WorkshopRightPanel() {
  return <RightPanel />;
}

// Layout content component that can use context hooks
function WorkshopLayoutContent({ children }: { children: React.ReactNode }) {
  const { ui } = useRevenueOS();
  const { user: authUser } = useUnifiedAuth();
  const { isProfilePanelVisible, setIsProfilePanelVisible } = useProfilePanel();
  const params = useParams();
  const workspaceSlug = params.workspace as string;

  // Prepare user data for ProfilePanel
  const profileUser = {
    name: authUser?.name || 'User',
    lastName: undefined
  };

  // Get workspace name
  const workspace = ui.activeWorkspace?.name || workspaceSlug || 'Workspace';
  const company = workspace;

  // Get username from auth
  const username = authUser?.name || undefined;

  return (
    <PanelLayout
      thinLeftPanel={null}
      leftPanel={<WorkshopLeftPanel />}
      middlePanel={children}
      rightPanel={<WorkshopRightPanel />}
      profilePanel={
        <ProfilePanel
          user={profileUser}
          company={company}
          workspace={workspace}
          isOpen={isProfilePanelVisible}
          onClose={() => setIsProfilePanelVisible(false)}
          username={username}
          currentApp="workshop"
        />
      }
      isProfilePanelVisible={isProfilePanelVisible}
      zoom={100}
      isLeftPanelVisible={ui.isLeftPanelVisible}
      isRightPanelVisible={ui.isRightPanelVisible}
      onToggleLeftPanel={ui.toggleLeftPanel}
      onToggleRightPanel={ui.toggleRightPanel}
    />
  );
}
