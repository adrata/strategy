"use client";

import React, { useState, useEffect } from "react";
import { useAtrium } from "../layout";
import { FolderTree } from "./FolderTree";
import { useUnifiedAuth } from "@/platform/auth";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { 
  DocumentTextIcon,
  ShareIcon,
  ClockIcon,
  StarIcon,
  TrashIcon,
  FolderIcon,
  PlusIcon,
  CloudArrowUpIcon,
  DocumentPlusIcon,
} from "@heroicons/react/24/outline";

interface NavigationTab {
  id: 'my-documents' | 'shared-with-me' | 'recent' | 'starred' | 'trash';
  name: string;
  icon: React.ComponentType<any>;
  count?: number;
  description: string;
}

export function AtriumLeftPanel() {
  const {
    activeTab,
    setActiveTab,
    currentFolderId,
    setCurrentFolderId,
    setIsUploadModalOpen,
    setIsCreateModalOpen,
  } = useAtrium();

  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const { data: acquisitionData } = useAcquisitionOS();

  const [documentCounts, setDocumentCounts] = useState({
    myDocuments: 0,
    sharedWithMe: 0,
    recent: 0,
    starred: 0,
    trash: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalDocuments: 0,
    storageUsed: '2.4 GB',
    storageLimit: '10 GB',
    sharedCount: 0,
  });

  const navigationTabs: NavigationTab[] = [
    {
      id: 'my-documents',
      name: 'My Documents',
      icon: DocumentTextIcon,
      count: documentCounts.myDocuments,
      description: 'Personal documents',
    },
    {
      id: 'shared-with-me',
      name: 'Shared with Me',
      icon: ShareIcon,
      count: documentCounts.sharedWithMe,
      description: 'Shared by others',
    },
    {
      id: 'recent',
      name: 'Recent',
      icon: ClockIcon,
      count: documentCounts.recent,
      description: 'Recently accessed',
    },
    {
      id: 'starred',
      name: 'Starred',
      icon: StarIcon,
      count: documentCounts.starred,
      description: 'Favorited documents',
    },
    {
      id: 'trash',
      name: 'Trash',
      icon: TrashIcon,
      count: documentCounts.trash,
      description: 'Deleted documents',
    },
  ];

  // Load document counts and stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        // TODO: Implement actual API calls
        // For now, use mock data
        setDocumentCounts({
          myDocuments: 24,
          sharedWithMe: 8,
          recent: 12,
          starred: 5,
          trash: 3,
        });
        setStats({
          totalDocuments: 32,
          storageUsed: '2.4 GB',
          storageLimit: '10 GB',
          sharedCount: 8,
        });
      } catch (error) {
        console.error('Failed to fetch atrium data:', error);
      }
    };

    fetchData();
  }, []);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId as any);
    setCurrentFolderId(null); // Clear folder selection when switching tabs
  };

  const handleFolderSelect = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setActiveTab('my-documents'); // Switch to my documents when selecting a folder
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="w-[13.335rem] min-w-[13.335rem] max-w-[13.335rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
        <div className="p-4 text-center">
          <div className="text-sm text-[var(--muted)]">Loading Atrium...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[13.335rem] min-w-[13.335rem] max-w-[13.335rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 pt-0 pr-2 pl-2">
        {/* Header */}
        <div className="mx-2 mt-4 mb-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--background)] border border-[var(--border)] overflow-hidden" style={{ filter: 'none' }}>
              <span className="text-lg font-bold text-black">A</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)]">Atrium</h2>
              <p className="text-xs text-[var(--muted)]">Document Storage</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mx-2 mb-3">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Stats */}
        <div className="mx-2 mb-3 p-3 bg-[var(--panel-background)] rounded-lg">
          <div className="text-xs text-[var(--muted)] space-y-1">
            <div className="flex justify-between">
              <span>Documents:</span>
              <span className="font-medium">{stats.totalDocuments}</span>
            </div>
            <div className="flex justify-between">
              <span>Storage:</span>
              <span className="font-medium">{stats.storageUsed} / {stats.storageLimit}</span>
            </div>
            <div className="flex justify-between">
              <span>Shared:</span>
              <span className="font-medium">{stats.sharedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 space-y-1 p-2">
        {navigationTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id && !currentFolderId;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-[var(--hover)] text-[var(--foreground)]'
                  : 'hover:bg-[var(--panel-background)] text-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{tab.name}</span>
                <span className="text-sm text-[var(--muted)]">
                  {tab.count || 0}
                </span>
              </div>
              <div className="text-xs text-[var(--muted)] mt-1">
                {tab.description}
              </div>
            </button>
          );
        })}

        {/* Quick Actions */}
        <div className="mt-4 space-y-1">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--panel-background)] text-gray-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <DocumentPlusIcon className="w-4 h-4" />
              <span className="font-medium text-sm">Create Document</span>
            </div>
            <div className="text-xs text-[var(--muted)] mt-1">
              New paper, pitch, or code
            </div>
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--panel-background)] text-gray-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <CloudArrowUpIcon className="w-4 h-4" />
              <span className="font-medium text-sm">Upload Files</span>
            </div>
            <div className="text-xs text-[var(--muted)] mt-1">
              Import existing files
            </div>
          </button>
        </div>

        {/* Folder Tree */}
        <div className="mt-4 space-y-2">
          <div className="px-3 py-1 text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
            Folders
          </div>
          <FolderTree onFolderSelect={handleFolderSelect} />
        </div>
      </div>

      {/* Fixed Bottom Section - Profile Button */}
      <div className="flex-shrink-0 p-2" style={{ paddingBottom: '15px' }}>
        <button
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--hover)] transition-colors"
          title="Profile"
        >
          <div className="w-8 h-8 bg-[var(--loading-bg)] rounded-xl flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">
              {authUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-[var(--foreground)]">
              {authUser?.name || 'User'}
            </div>
            <div className="text-xs text-[var(--muted)]">
              {acquisitionData?.auth?.authUser?.activeWorkspaceName || 'Workspace'}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
