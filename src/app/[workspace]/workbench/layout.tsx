"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PanelLayout } from "@/platform/ui/components/layout/PanelLayout";
import { RightPanel } from "@/platform/ui/components/chat/RightPanel";
import { RevenueOSProvider, useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";
import { SettingsPopupProvider } from "@/platform/ui/components/SettingsPopupContext";
import { ProfilePanelProvider, useProfilePanel } from "@/platform/ui/components/ProfilePanelContext";
import { ProfilePanel } from "@/platform/ui/components/ProfilePanel";
import { useUnifiedAuth } from "@/platform/auth";
import { getWorkspaceSlugInfo } from "@/platform/auth/workspace-slugs";
import { WorkbenchLeftPanel } from "./components/WorkbenchLeftPanel";
import { WorkbenchDocument } from "./types/document";
import { WorkbenchFolder } from "./types/folder";

const queryClient = new QueryClient();

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

interface WorkbenchContextType {
  // Selected items
  selectedDocument: WorkbenchDocument | null;
  setSelectedDocument: (document: WorkbenchDocument | null) => void;
  selectedFolder: WorkbenchFolder | null;
  setSelectedFolder: (folder: WorkbenchFolder | null) => void;
  
  // Document viewing in middle panel
  viewingDocument: WorkbenchDocument | null;
  setViewingDocument: (document: WorkbenchDocument | null) => void;
  isEditMode: boolean;
  setIsEditMode: (editMode: boolean) => void;
  
  // Active tabs
  activeTab: 'my-documents' | 'shared-with-me' | 'recent' | 'starred' | 'trash' | 'stats' | 'folders';
  setActiveTab: (tab: 'my-documents' | 'shared-with-me' | 'recent' | 'starred' | 'trash' | 'stats' | 'folders') => void;
  
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
  
  // Workspace
  workspace: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

const WorkbenchContext = createContext<WorkbenchContextType | undefined>(undefined);

export const useWorkbench = () => {
  const context = useContext(WorkbenchContext);
  if (!context) {
    throw new Error('useWorkbench must be used within WorkbenchProvider');
  }
  return context;
};

interface WorkbenchLayoutProps {
  children: React.ReactNode;
}

export default function WorkbenchLayout({ children }: WorkbenchLayoutProps) {
  const [selectedDocument, setSelectedDocument] = useState<WorkbenchDocument | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<WorkbenchFolder | null>(null);
  const [viewingDocument, setViewingDocument] = useState<WorkbenchDocument | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-documents' | 'shared-with-me' | 'recent' | 'starred' | 'trash' | 'stats' | 'folders'>('my-documents');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Get workspace from auth context
  const { user: authUser } = useUnifiedAuth();
  
  // Create workspace object with slug information
  const workspace = useMemo(() => {
    const activeWorkspace = authUser?.workspaces?.find(w => w.id === authUser.activeWorkspaceId);
    if (!activeWorkspace) {
      return null;
    }
    const workspaceSlugInfo = getWorkspaceSlugInfo(activeWorkspace);
    return {
      id: activeWorkspace.id,
      name: activeWorkspace.name,
      slug: workspaceSlugInfo.slug
    };
  }, [authUser?.workspaces, authUser?.activeWorkspaceId]);

  return (
    <QueryClientProvider client={queryClient}>
      <WorkbenchContext.Provider value={{ 
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
        workspace,
      }}>
        <RevenueOSProvider>
          <ZoomProvider>
            <ProfilePopupProvider>
              <SettingsPopupProvider>
                <ProfilePanelProvider>
                  <WorkbenchLayoutContent>
                    {children}
                  </WorkbenchLayoutContent>
                </ProfilePanelProvider>
              </SettingsPopupProvider>
            </ProfilePopupProvider>
          </ZoomProvider>
        </RevenueOSProvider>
      </WorkbenchContext.Provider>
    </QueryClientProvider>
  );
}

// Custom Right Panel for Workbench
function WorkbenchRightPanel() {
  return <RightPanel />;
}

// Layout content component that can use context hooks
function WorkbenchLayoutContent({ children }: { children: React.ReactNode }) {
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
      leftPanel={<WorkbenchLeftPanel />}
      middlePanel={children}
      rightPanel={<WorkbenchRightPanel />}
      profilePanel={
        <ProfilePanel
          user={profileUser}
          company={company}
          workspace={workspace}
          isOpen={isProfilePanelVisible}
          onClose={() => setIsProfilePanelVisible(false)}
          username={username}
          currentApp="workbench"
          onToggleLeftPanel={ui.toggleLeftPanel}
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
