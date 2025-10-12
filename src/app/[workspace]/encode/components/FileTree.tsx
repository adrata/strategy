"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useEncode } from "../layout";
import { FileTreeNode } from "../types/file";
import { FileSystemService } from "../services/FileSystemService";
import { 
  FolderIcon,
  FolderOpenIcon,
  DocumentTextIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  DocumentPlusIcon,
  FolderPlusIcon,
} from "@heroicons/react/24/outline";

interface FileTreeProps {
  className?: string;
}

export function FileTree({ className = "" }: FileTreeProps) {
  const {
    files,
    selectedFile,
    setSelectedFile,
    openFile,
    deleteFile,
    renameFile,
    createFile,
    createFolder,
    currentProject,
  } = useEncode();

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: FileTreeNode | null;
  } | null>(null);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [realFiles, setRealFiles] = useState<any[]>([]);
  const [currentRealPath, setCurrentRealPath] = useState('/');

  const fileSystemService = FileSystemService.getInstance();

  // Load real filesystem files when in real filesystem mode
  useEffect(() => {
    if (currentProject?.id === 'real-filesystem' && fileSystemService.isDesktopMode()) {
      loadRealFiles(currentRealPath);
    }
  }, [currentProject, currentRealPath, fileSystemService]);

  const loadRealFiles = async (path: string) => {
    try {
      const realFiles = await fileSystemService.readRealDirectory(path);
      setRealFiles(realFiles);
    } catch (error) {
      console.error('Failed to load real files:', error);
      setRealFiles([]);
    }
  };

  // Build file tree from files
  const fileTree = React.useMemo(() => {
    if (currentProject?.id === 'real-filesystem') {
      // Convert real files to file tree format
      return realFiles.map(file => ({
        id: file.id,
        name: file.name,
        path: file.path,
        isDirectory: file.isDirectory,
        children: [],
        file
      }));
    }
    return fileSystemService.buildFileTree(files);
  }, [files, realFiles, currentProject]);

  const toggleExpanded = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const handleNodeClick = useCallback(async (node: FileTreeNode) => {
    if (node.isDirectory) {
      if (currentProject?.id === 'real-filesystem') {
        // Handle real filesystem directory navigation
        const newPath = node.path.replace('/real', '');
        setCurrentRealPath(newPath);
        await loadRealFiles(newPath);
      } else {
        toggleExpanded(node.id);
      }
    } else {
      setSelectedFile(node.file || null);
      if (node.file) {
        if (currentProject?.id === 'real-filesystem') {
          // Load real file content
          try {
            const content = await fileSystemService.readRealFile(node.file.path.replace('/real', ''));
            const fileWithContent = { ...node.file, content };
            openFile(fileWithContent);
          } catch (error) {
            console.error('Failed to read real file:', error);
          }
        } else {
          openFile(node.file);
        }
      }
    }
  }, [toggleExpanded, setSelectedFile, openFile, currentProject, fileSystemService]);

  const handleContextMenu = useCallback((e: React.MouseEvent, node: FileTreeNode) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleRename = useCallback(async () => {
    if (!contextMenu?.node || !renameValue.trim()) return;
    
    try {
      await renameFile(contextMenu.node.id, renameValue);
      setIsRenaming(null);
      setRenameValue('');
      closeContextMenu();
    } catch (error) {
      console.error('Failed to rename:', error);
    }
  }, [contextMenu, renameValue, renameFile, closeContextMenu]);

  const handleDelete = useCallback(async () => {
    if (!contextMenu?.node) return;
    
    if (confirm(`Are you sure you want to delete "${contextMenu.node.name}"?`)) {
      try {
        await deleteFile(contextMenu.node.id);
        closeContextMenu();
      } catch (error) {
        console.error('Failed to delete:', error);
      }
    }
  }, [contextMenu, deleteFile, closeContextMenu]);

  const handleCreateFile = useCallback(async () => {
    if (!contextMenu?.node) return;
    
    const fileName = prompt('Enter file name:');
    if (fileName) {
      try {
        const path = contextMenu.node.isDirectory 
          ? contextMenu.node.path 
          : fileSystemService.getParentPath(contextMenu.node.path);
        await createFile(path, fileName);
        closeContextMenu();
      } catch (error) {
        console.error('Failed to create file:', error);
      }
    }
  }, [contextMenu, createFile, closeContextMenu]);

  const handleCreateFolder = useCallback(async () => {
    if (!contextMenu?.node) return;
    
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      try {
        const path = contextMenu.node.isDirectory 
          ? contextMenu.node.path 
          : fileSystemService.getParentPath(contextMenu.node.path);
        await createFolder(path, folderName);
        closeContextMenu();
      } catch (error) {
        console.error('Failed to create folder:', error);
      }
    }
  }, [contextMenu, createFolder, closeContextMenu]);

  const getFileIcon = (node: FileTreeNode) => {
    if (node.isDirectory) {
      return expandedNodes.has(node.id) ? (
        <FolderOpenIcon className="w-4 h-4 text-blue-500" />
      ) : (
        <FolderIcon className="w-4 h-4 text-blue-500" />
      );
    }
    
    const extension = fileSystemService.getFileExtension(node.name);
    const iconClass = "w-4 h-4";
    
    switch (extension) {
      case 'js':
      case 'jsx':
        return <DocumentTextIcon className={`${iconClass} text-yellow-500`} />;
      case 'ts':
      case 'tsx':
        return <DocumentTextIcon className={`${iconClass} text-blue-500`} />;
      case 'py':
        return <DocumentTextIcon className={`${iconClass} text-green-500`} />;
      case 'html':
        return <DocumentTextIcon className={`${iconClass} text-orange-500`} />;
      case 'css':
        return <DocumentTextIcon className={`${iconClass} text-blue-400`} />;
      case 'json':
        return <DocumentTextIcon className={`${iconClass} text-yellow-600`} />;
      case 'md':
        return <DocumentTextIcon className={`${iconClass} text-gray-500`} />;
      default:
        return <DocumentTextIcon className={`${iconClass} text-gray-400`} />;
    }
  };

  const renderNode = (node: FileTreeNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedFile?.id === node.id;
    const isBeingRenamed = isRenaming === node.id;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer hover:bg-[var(--hover)] transition-colors ${
            isSelected ? 'bg-[var(--hover)]' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => handleNodeClick(node)}
          onContextMenu={(e) => handleContextMenu(e, node)}
        >
          {/* Expand/Collapse Button */}
          {node.isDirectory && (
            <button
              className="p-0.5 hover:bg-gray-200 rounded"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(node.id);
              }}
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-3 h-3 text-gray-500" />
              ) : (
                <ChevronRightIcon className="w-3 h-3 text-gray-500" />
              )}
            </button>
          )}
          
          {/* File/Folder Icon */}
          <div className="flex-shrink-0">
            {getFileIcon(node)}
          </div>
          
          {/* File/Folder Name */}
          <div className="flex-1 min-w-0">
            {isBeingRenamed ? (
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRename}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleRename();
                  } else if (e.key === 'Escape') {
                    setIsRenaming(null);
                    setRenameValue('');
                  }
                }}
                className="w-full px-1 py-0.5 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                autoFocus
              />
            ) : (
              <span className="text-sm text-[var(--foreground)] truncate">
                {node.name}
              </span>
            )}
          </div>
        </div>
        
        {/* Children */}
        {node.isDirectory && isExpanded && node.children.map(child => 
          renderNode(child, depth + 1)
        )}
      </div>
    );
  };

  return (
    <div className={`${className}`}>
      {/* Real Filesystem Breadcrumb */}
      {currentProject?.id === 'real-filesystem' && (
        <div className="px-2 py-2 border-b border-[var(--border)]">
          <div className="flex items-center gap-1 text-xs text-[var(--muted)]">
            <button
              onClick={() => {
                setCurrentRealPath('/');
                loadRealFiles('/');
              }}
              className="hover:text-[var(--foreground)] transition-colors"
            >
              🏠 Home
            </button>
            {currentRealPath !== '/' && (
              <>
                <span>/</span>
                <span className="text-[var(--foreground)]">{currentRealPath}</span>
              </>
            )}
          </div>
        </div>
      )}

      {fileTree.length === 0 ? (
        <div className="p-4 text-center">
          <div className="text-sm text-[var(--muted)]">No files</div>
          <div className="text-xs text-[var(--muted)] mt-1">
            {currentProject?.id === 'real-filesystem' 
              ? 'Navigate to a directory with files'
              : 'Create files and folders to get started'
            }
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {fileTree.map(node => renderNode(node))}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={closeContextMenu}
          />
          <div
            className="fixed z-50 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg py-1 min-w-32"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
          >
            {contextMenu.node.isDirectory ? (
              <>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--hover)] flex items-center gap-2"
                  onClick={handleCreateFile}
                >
                  <DocumentPlusIcon className="w-4 h-4" />
                  New File
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--hover)] flex items-center gap-2"
                  onClick={handleCreateFolder}
                >
                  <FolderPlusIcon className="w-4 h-4" />
                  New Folder
                </button>
                <hr className="my-1 border-[var(--border)]" />
              </>
            ) : null}
            
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--hover)] flex items-center gap-2"
              onClick={() => {
                setIsRenaming(contextMenu.node!.id);
                setRenameValue(contextMenu.node!.name);
                closeContextMenu();
              }}
            >
              <PencilIcon className="w-4 h-4" />
              Rename
            </button>
            
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--hover)] flex items-center gap-2 text-red-600"
              onClick={handleDelete}
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
