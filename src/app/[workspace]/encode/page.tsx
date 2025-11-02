"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useEncode } from "./layout";
import { EncodeMiddlePanel } from "./components/EncodeMiddlePanel";
import { StandardHeader } from "@/platform/ui/components/layout/StandardHeader";
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  FolderIcon,
  DocumentTextIcon,
  PlayIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

export default function EncodePage() {
  const {
    currentProject,
    projects,
    files,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    showTerminal,
    setShowTerminal,
    createFile,
    createFolder,
  } = useEncode();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  // Calculate project stats
  const projectStats = React.useMemo(() => {
    if (!files.length) {
      return {
        totalFiles: 0,
        totalSize: '0 B',
        lastModified: new Date(),
        fileTypeBreakdown: {}
      };
    }

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

    return {
      totalFiles,
      totalSize: formatFileSize(totalSize),
      lastModified,
      fileTypeBreakdown
    };
  }, [files]);

  const handleCreateProject = useCallback(async () => {
    if (!newProjectName.trim()) return;
    
    try {
      const response = await fetch('/api/v1/files/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDescription,
        })
      });
      
      if (response.ok) {
        const newProject = await response.json();
        // The project will be loaded automatically by the context
        setNewProjectName('');
        setNewProjectDescription('');
        setIsCreatingProject(false);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  }, [newProjectName, newProjectDescription]);

  const handleCreateFile = useCallback(async () => {
    if (!currentProject) return;
    
    const fileName = prompt('Enter file name:');
    if (fileName) {
      try {
        await createFile('/', fileName, '');
      } catch (error) {
        console.error('Failed to create file:', error);
      }
    }
  }, [currentProject, createFile]);

  const handleCreateFolder = useCallback(async () => {
    if (!currentProject) return;
    
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      try {
        await createFolder('/', folderName);
      } catch (error) {
        console.error('Failed to create folder:', error);
      }
    }
  }, [currentProject, createFolder]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Standardized Header */}
      <StandardHeader
        title="Encode"
        subtitle={
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">Code Editor</span>
            {currentProject && (
              <>
                <span className="text-muted">/</span>
                <span className="text-sm text-gray-700">{currentProject.name}</span>
              </>
            )}
          </div>
        }
        stats={[
          { label: "Files", value: projectStats.totalFiles },
          { label: "Size", value: projectStats.totalSize },
          { label: "Modified", value: projectStats.lastModified.toLocaleDateString() }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreatingProject(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-background border border-border rounded-lg hover:bg-panel-background transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              New Project
            </button>
            <button
              onClick={handleCreateFile}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-background border border-border rounded-lg hover:bg-panel-background transition-colors"
            >
              <DocumentTextIcon className="w-4 h-4" />
              New File
            </button>
            <button
              onClick={handleCreateFolder}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FolderIcon className="w-4 h-4" />
              New Folder
            </button>
          </div>
        }
      />

      {/* Sub-header with Search and Controls */}
      <div className="flex items-center gap-4 py-2 w-full bg-background px-6">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search files..."
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

        {/* Terminal Toggle */}
        <button
          onClick={() => setShowTerminal(!showTerminal)}
          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            showTerminal 
              ? 'bg-blue-100 text-blue-600' 
              : 'bg-background border border-border text-gray-700 hover:bg-panel-background'
          }`}
        >
          <PlayIcon className="w-4 h-4" />
          Terminal
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <EncodeMiddlePanel />
      </div>

      {/* Create Project Modal */}
      {isCreatingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg border border-border w-96">
            <h3 className="text-lg font-semibold mb-4">Create New Project</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  placeholder="My Project"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-gray-400"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted mb-1">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="A brief description of your project..."
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-gray-400"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreateProject}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Project
              </button>
              <button
                onClick={() => {
                  setIsCreatingProject(false);
                  setNewProjectName('');
                  setNewProjectDescription('');
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
