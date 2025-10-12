"use client";

import React, { useState, useEffect } from "react";
import { useEncode } from "../layout";
import { FileTree } from "./FileTree";
import { useUnifiedAuth } from "@/platform/auth";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { FileSystemService } from "../services/FileSystemService";
import { 
  FolderIcon,
  DocumentTextIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ClockIcon,
  StarIcon,
  TrashIcon,
  CloudArrowUpIcon,
  DocumentPlusIcon,
} from "@heroicons/react/24/outline";

interface ProjectStats {
  totalFiles: number;
  totalSize: string;
  lastModified: Date;
  fileTypeBreakdown: Record<string, number>;
}

export function EncodeLeftPanel() {
  const {
    currentProject,
    setCurrentProject,
    projects,
    files,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    createFile,
    createFolder,
  } = useEncode();

  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const { data: acquisitionData } = useAcquisitionOS();
  const fileSystemService = FileSystemService.getInstance();

  const [projectStats, setProjectStats] = useState<ProjectStats>({
    totalFiles: 0,
    totalSize: '0 B',
    lastModified: new Date(),
    fileTypeBreakdown: {}
  });

  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [isDesktop, setIsDesktop] = useState(false);

  // Check if running in desktop mode
  useEffect(() => {
    setIsDesktop(fileSystemService.isDesktopMode());
  }, [fileSystemService]);

  // Calculate project stats
  useEffect(() => {
    if (files.length > 0) {
      const totalFiles = files.filter(f => !f.isDirectory).length;
      const totalSize = files.reduce((size, file) => size + file.content.length, 0);
      const lastModified = files.reduce((latest, file) => 
        file.updatedAt > latest ? file.updatedAt : latest, 
        new Date(0)
      );
      
      const fileTypeBreakdown = files
        .filter(f => !f.isDirectory)
        .reduce((breakdown, file) => {
          const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown';
          breakdown[ext] = (breakdown[ext] || 0) + 1;
          return breakdown;
        }, {} as Record<string, number>);

      setProjectStats({
        totalFiles,
        totalSize: formatFileSize(totalSize),
        lastModified,
        fileTypeBreakdown
      });
    }
  }, [files]);

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const handleCreateFile = async () => {
    if (!newFileName.trim() || !currentProject) return;
    
    try {
      await createFile('/', newFileName, '');
      setNewFileName('');
      setIsCreatingFile(false);
    } catch (error) {
      console.error('Failed to create file:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !currentProject) return;
    
    try {
      await createFolder('/', newFolderName);
      setNewFolderName('');
      setIsCreatingFolder(false);
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleProjectChange = (projectId: string) => {
    if (projectId === 'real-filesystem') {
      // Handle real filesystem project
      const realProject = {
        id: 'real-filesystem',
        name: 'Real Filesystem',
        description: 'Access to local filesystem',
        workspaceId: 'real',
        userId: 'real',
        files: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setCurrentProject(realProject);
    } else {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setCurrentProject(project);
      }
    }
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
        <div className="p-4 text-center">
          <div className="text-sm text-[var(--muted)]">Loading Encode...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 pt-0 pr-2 pl-2">
        {/* Header - matching other apps style */}
        <div className="mx-2 mt-4 mb-2">
          {/* App Icon */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--background)] border border-[var(--border)] overflow-hidden" style={{ filter: 'none' }}>
              <span className="text-lg font-bold text-black">E</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)]">Encode</h2>
              <p className="text-xs text-[var(--muted)]">Code Editor</p>
            </div>
          </div>
        </div>

        {/* Project Switcher */}
        <div className="mx-2 mb-4">
          <select
            value={currentProject?.id || ''}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors"
          >
            <option value="">Select Project</option>
            {isDesktop && (
              <option value="real-filesystem">📁 Real Filesystem</option>
            )}
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Project Stats Dashboard */}
        {currentProject && (
          <div className="mx-2 mb-4 p-3 bg-[var(--hover)] rounded-lg border border-[var(--border)]">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-[var(--muted)]">Files</span>
                <span className="text-xs font-semibold text-black">
                  {projectStats.totalFiles}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-[var(--muted)]">Size</span>
                <span className="text-xs font-semibold text-black">
                  {projectStats.totalSize}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-[var(--muted)]">Modified</span>
                <span className="text-xs font-semibold text-black">
                  {projectStats.lastModified.toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mx-2 mb-4 space-y-2">
          <button
            onClick={() => setIsCreatingFile(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--panel-background)] transition-colors"
          >
            <DocumentPlusIcon className="w-4 h-4" />
            New File
          </button>
          <button
            onClick={() => setIsCreatingFolder(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--panel-background)] transition-colors"
          >
            <FolderIcon className="w-4 h-4" />
            New Folder
          </button>
        </div>
      </div>

      {/* Scrollable Middle Section - File Tree */}
      <div className="flex-1 overflow-y-auto invisible-scrollbar px-2">
        {currentProject ? (
          <FileTree />
        ) : (
          <div className="p-4 text-center">
            <div className="text-sm text-[var(--muted)]">No project selected</div>
            <div className="text-xs text-[var(--muted)] mt-1">
              Create or select a project to start coding
            </div>
          </div>
        )}
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

      {/* Create File Modal */}
      {isCreatingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--background)] p-6 rounded-lg border border-[var(--border)] w-80">
            <h3 className="text-lg font-semibold mb-4">Create New File</h3>
            <input
              type="text"
              placeholder="File name (e.g., index.js)"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:border-gray-400 mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFile()}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateFile}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreatingFile(false);
                  setNewFileName('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {isCreatingFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--background)] p-6 rounded-lg border border-[var(--border)] w-80">
            <h3 className="text-lg font-semibold mb-4">Create New Folder</h3>
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:border-gray-400 mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateFolder}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
