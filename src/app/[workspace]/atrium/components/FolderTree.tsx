"use client";

import React, { useState, useEffect } from "react";
import { WorkshopFolder } from "../types/folder";
import { 
  FolderIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

interface FolderTreeProps {
  onFolderSelect: (folderId: string | null) => void;
}

export function FolderTree({ onFolderSelect }: FolderTreeProps) {
  const [folders, setFolders] = useState<WorkshopFolder[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load folders
  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      setIsLoading(true);
      
      // TODO: Implement actual API call
      // const response = await fetch('/api/v1/documents/folders?...');
      // const data = await response.json();
      
      // Mock data for now
      const mockFolders: WorkshopFolder[] = [
        {
          id: '1',
          name: 'Projects',
          description: 'Project-related documents',
          parentId: null,
          ownerId: 'user1',
          workspaceId: 'workspace1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          _count: {
            documents: 5,
            children: 2,
          },
        },
        {
          id: '2',
          name: 'Q1 2024',
          description: 'First quarter documents',
          parentId: '1',
          ownerId: 'user1',
          workspaceId: 'workspace1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          _count: {
            documents: 3,
            children: 0,
          },
        },
        {
          id: '3',
          name: 'Templates',
          description: 'Document templates',
          parentId: null,
          ownerId: 'user1',
          workspaceId: 'workspace1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          _count: {
            documents: 8,
            children: 0,
          },
        },
      ];

      setFolders(mockFolders);
    } catch (err) {
      console.error('Error loading folders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFolderClick = (folderId: string) => {
    setSelectedFolderId(folderId);
    onFolderSelect(folderId);
  };

  const handleRootClick = () => {
    setSelectedFolderId(null);
    onFolderSelect(null);
  };

  const buildFolderTree = (parentId: string | null = null, level: number = 0): WorkshopFolder[] => {
    return folders
      .filter(folder => folder.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const renderFolder = (folder: WorkshopFolder, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const hasChildren = folder._count?.children > 0;

    return (
      <div key={folder.id}>
        <div
          onClick={() => handleFolderClick(folder.id)}
          className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg cursor-pointer transition-colors ${
            isSelected
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-700 hover:bg-[var(--hover)]'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="p-0.5 hover:bg-[var(--loading-bg)] rounded"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-3 h-3" />
              ) : (
                <ChevronRightIcon className="w-3 h-3" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}
          
          <FolderIcon className="w-4 h-4 flex-shrink-0" />
          <span className="truncate flex-1">{folder.name}</span>
          {folder._count?.documents > 0 && (
            <span className="text-xs text-[var(--muted)] bg-[var(--loading-bg)] px-1.5 py-0.5 rounded">
              {folder._count.documents}
            </span>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div>
            {buildFolderTree(folder.id, level + 1).map(childFolder =>
              renderFolder(childFolder, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Root level */}
      <div
        onClick={handleRootClick}
        className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg cursor-pointer transition-colors ${
          selectedFolderId === null
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-700 hover:bg-[var(--hover)]'
        }`}
      >
        <FolderIcon className="w-4 h-4" />
        <span>All Documents</span>
      </div>

      {/* Folder tree */}
      {buildFolderTree().map(folder => renderFolder(folder))}
    </div>
  );
}
