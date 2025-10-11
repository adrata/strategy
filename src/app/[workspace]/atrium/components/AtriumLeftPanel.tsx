"use client";

import React, { useState, useEffect } from "react";
import { useAtrium } from "../layout";
import { FolderTree } from "./FolderTree";
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

  const [documentCounts, setDocumentCounts] = useState({
    myDocuments: 0,
    sharedWithMe: 0,
    recent: 0,
    starred: 0,
    trash: 0,
  });

  const navigationTabs: NavigationTab[] = [
    {
      id: 'my-documents',
      name: 'My Documents',
      icon: DocumentTextIcon,
      count: documentCounts.myDocuments,
    },
    {
      id: 'shared-with-me',
      name: 'Shared with Me',
      icon: ShareIcon,
      count: documentCounts.sharedWithMe,
    },
    {
      id: 'recent',
      name: 'Recent',
      icon: ClockIcon,
      count: documentCounts.recent,
    },
    {
      id: 'starred',
      name: 'Starred',
      icon: StarIcon,
      count: documentCounts.starred,
    },
    {
      id: 'trash',
      name: 'Trash',
      icon: TrashIcon,
      count: documentCounts.trash,
    },
  ];

  // Load document counts
  useEffect(() => {
    // TODO: Implement document count loading
    // This would fetch counts from the API
  }, []);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId as any);
    setCurrentFolderId(null); // Clear folder selection when switching tabs
  };

  const handleFolderSelect = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setActiveTab('my-documents'); // Switch to my documents when selecting a folder
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Atrium</h2>
        <p className="text-xs text-gray-500">Document Storage</p>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="space-y-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <DocumentPlusIcon className="w-4 h-4" />
            Create Document
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <CloudArrowUpIcon className="w-4 h-4" />
            Upload Files
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-2 py-2">
          <nav className="space-y-1">
            {navigationTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id && !currentFolderId;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </div>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      isActive
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Folder Tree */}
        <div className="px-2 py-2 border-t border-gray-200">
          <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
            <FolderIcon className="w-3 h-3" />
            Folders
          </div>
          <FolderTree onFolderSelect={handleFolderSelect} />
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <div>Storage: 2.4 GB / 10 GB</div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '24%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
