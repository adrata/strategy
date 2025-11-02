"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useWorkshop } from "../layout";
import { WorkshopFolder } from "../types/folder";
import { WorkshopDocument } from "../types/document";
import { generateSlug } from "@/platform/utils/url-utils";
import { useUnifiedAuth } from "@/platform/auth";
import { useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
import { apiFetch } from "@/platform/api-fetch";
import { 
  FolderIcon,
  DocumentTextIcon,
  PresentationChartBarIcon,
  TableCellsIcon,
  CodeBracketIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

interface ExplorerNode {
  id: string;
  name: string;
  type: 'folder' | 'document';
  folder?: WorkshopFolder;
  document?: WorkshopDocument;
  children: ExplorerNode[];
  level: number;
}

export function DocumentExplorer() {
  const router = useRouter();
  const {
    workspace,
    currentFolderId,
    setCurrentFolderId,
  } = useWorkshop();
  const { user: authUser } = useUnifiedAuth();
  const { ui } = useRevenueOS();
  
  const workspaceId = ui.activeWorkspace?.id || authUser?.activeWorkspaceId;
  const [folders, setFolders] = useState<WorkshopFolder[]>([]);
  const [documents, setDocuments] = useState<WorkshopDocument[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load all folders and documents
  useEffect(() => {
    if (workspaceId) {
      loadData();
    }
  }, [workspaceId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load all folders
      const foldersData = await apiFetch<WorkshopFolder[]>(
        `/api/v1/documents/folders?workspaceId=${workspaceId}`,
        {},
        []
      );
      setFolders(foldersData);

      // Load all documents (root level only, documents in folders will be shown via folder structure)
      const docsData = await apiFetch<{
        documents: WorkshopDocument[];
      }>(
        `/api/v1/documents/documents?workspaceId=${workspaceId}&limit=1000&status=active`,
        {},
        { documents: [] }
      );
      setDocuments(docsData.documents || []);
    } catch (error) {
      console.error('Error loading explorer data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buildTree = useMemo(() => {
    const nodeMap = new Map<string, ExplorerNode>();
    const rootNodes: ExplorerNode[] = [];

    // Build folder nodes
    folders.forEach(folder => {
      const node: ExplorerNode = {
        id: `folder-${folder.id}`,
        name: folder.name,
        type: 'folder',
        folder,
        children: [],
        level: 0,
      };
      nodeMap.set(node.id, node);
    });

    // Build document nodes (only root level documents)
    documents
      .filter(doc => !doc.folderId)
      .forEach(doc => {
        const node: ExplorerNode = {
          id: `doc-${doc.id}`,
          name: doc.title,
          type: 'document',
          document: doc,
          children: [],
          level: 0,
        };
        nodeMap.set(node.id, node);
        rootNodes.push(node);
      });

    // Build folder hierarchy
    folders.forEach(folder => {
      const node = nodeMap.get(`folder-${folder.id}`);
      if (!node) return;

      // Add child folders
      const childFolders = folders.filter(f => f.parentId === folder.id);
      childFolders.forEach(childFolder => {
        const childNode = nodeMap.get(`folder-${childFolder.id}`);
        if (childNode) {
          node.children.push(childNode);
        }
      });

      // Add documents in this folder
      const folderDocs = documents.filter(doc => doc.folderId === folder.id);
      folderDocs.forEach(doc => {
        node.children.push({
          id: `doc-${doc.id}`,
          name: doc.title,
          type: 'document',
          document: doc,
          children: [],
          level: node.level + 1,
        });
      });

      // Sort children: folders first, then documents
      node.children.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      // Set level for children
      const setLevel = (n: ExplorerNode, level: number) => {
        n.level = level;
        n.children.forEach(child => setLevel(child, level + 1));
      };
      setLevel(node, 0);

      if (!folder.parentId) {
        rootNodes.push(node);
      }
    });

    // Sort root nodes
    rootNodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return rootNodes;
  }, [folders, documents]);

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleNodeClick = (node: ExplorerNode) => {
    if (node.type === 'folder' && node.folder) {
      setCurrentFolderId(node.folder.id);
    } else if (node.type === 'document' && node.document) {
      const slug = generateSlug(node.document.title, node.document.id);
      const workspaceSlug = workspace?.slug || 'default';
      router.push(`/${workspaceSlug}/workbench/${slug}`);
    }
  };

  const getDocumentIcon = (documentType: string) => {
    switch (documentType) {
      case 'paper':
        return DocumentTextIcon;
      case 'pitch':
        return PresentationChartBarIcon;
      case 'grid':
        return TableCellsIcon;
      case 'code':
        return CodeBracketIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const renderNode = (node: ExplorerNode) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = node.type === 'folder' && node.folder?.id === currentFolderId;
    const hasChildren = node.children.length > 0;
    const isFolder = node.type === 'folder';

    return (
      <div key={node.id}>
        <div
          onClick={() => handleNodeClick(node)}
          className={`flex items-center gap-0.5 px-1 py-0.5 text-xs cursor-pointer hover:bg-[var(--hover)] transition-colors ${
            isSelected ? 'bg-[var(--hover)]' : ''
          }`}
          style={{ paddingLeft: `${node.level * 12 + 4}px` }}
        >
          {/* Expand/Collapse Button */}
          {isFolder && hasChildren ? (
            <button
              className="p-0.5 hover:bg-[var(--panel-background)] rounded flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-3 h-3 text-[var(--muted)]" />
              ) : (
                <ChevronRightIcon className="w-3 h-3 text-[var(--muted)]" />
              )}
            </button>
          ) : (
            <div className="w-3.5 flex-shrink-0" />
          )}

          {/* Icon */}
          <div className="flex-shrink-0 mr-1">
            {isFolder ? (
              <FolderIcon className="w-3.5 h-3.5 text-[var(--muted)]" />
            ) : (
              (() => {
                const Icon = getDocumentIcon(node.document?.documentType || 'paper');
                return <Icon className="w-3.5 h-3.5 text-[var(--muted)]" />;
              })()
            )}
          </div>

          {/* Name */}
          <span className="text-xs text-[var(--foreground)] truncate flex-1">
            {node.name}
          </span>
        </div>

        {/* Children */}
        {isFolder && isExpanded && (
          <div>
            {node.children.map(child => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="py-1">
        {Array.from({ length: 6 }).map((_, i) => {
          const width = 60 + (i % 3) * 20;
          return (
            <div key={i} className="flex items-center gap-0.5 px-1 py-0.5" style={{ paddingLeft: `${(i % 3) * 12 + 4}px` }}>
              <div className="w-3.5 h-3.5 bg-[var(--loading-bg)] rounded animate-pulse flex-shrink-0"></div>
              <div className="w-3.5 h-3.5 bg-[var(--loading-bg)] rounded animate-pulse flex-shrink-0"></div>
              <div className="h-3 bg-[var(--loading-bg)] rounded animate-pulse" style={{ width: `${width}%` }}></div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="py-1">
      {buildTree.length === 0 ? (
        <div className="p-4 text-center">
          <div className="text-xs text-[var(--muted)]">No folders or documents</div>
        </div>
      ) : (
        buildTree.map(node => renderNode(node))
      )}
    </div>
  );
}

