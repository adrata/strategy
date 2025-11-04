"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useWorkbench } from "../layout";
import { WorkbenchFolder } from "../types/folder";
import { WorkbenchDocument } from "../types/document";
import { generateSlug } from "@/platform/utils/url-utils";
import { useUnifiedAuth } from "@/platform/auth";
import { useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
import { apiFetch, apiPost } from "@/platform/api-fetch";
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
  folder?: WorkbenchFolder;
  document?: WorkbenchDocument;
  children: ExplorerNode[];
  level: number;
}

export function DocumentExplorer() {
  const router = useRouter();
  const {
    workspace,
    currentFolderId,
    setCurrentFolderId,
  } = useWorkbench();
  const { user: authUser } = useUnifiedAuth();
  const { ui } = useRevenueOS();
  
  const workspaceId = ui.activeWorkspace?.id || authUser?.activeWorkspaceId;
  const [folders, setFolders] = useState<WorkbenchFolder[]>([]);
  const [documents, setDocuments] = useState<WorkbenchDocument[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load all folders and documents
  useEffect(() => {
    if (workspaceId) {
      loadData();
    } else {
      // If no workspaceId, set loading to false to prevent stuck state
      setIsLoading(false);
    }
  }, [workspaceId]);

  const ensureStandardFolders = async (existingFolders: WorkbenchFolder[]) => {
    // If folders already exist, no need to create defaults
    if (existingFolders.length > 0) {
      return existingFolders;
    }

    // Check if user is authenticated before attempting to create folders
    if (!authUser?.id || !workspaceId) {
      console.log('Skipping folder creation - user not authenticated or workspaceId missing', {
        hasAuthUser: !!authUser?.id,
        hasWorkspaceId: !!workspaceId
      });
      return existingFolders;
    }

    // Get workspace name for the top-level folder
    const workspaceName = ui.activeWorkspace?.name || workspace?.name || 'Workspace';
    
    try {
      // Create the workspace folder (top-level container)
      const workspaceFolder = await apiPost<WorkbenchFolder>(
        '/api/v1/documents/folders',
        {
          name: workspaceName,
          workspaceId,
          description: 'Main workspace folder',
        },
        null
      );

      if (!workspaceFolder) {
        console.error('Failed to create workspace folder - check authentication and network', {
          workspaceId,
          workspaceName,
          hasAuthUser: !!authUser?.id
        });
        return existingFolders;
      }

      const workspaceFolderId = workspaceFolder.id;
      
      // Create standard subfolders
      const standardFolders = [
        { name: 'Clients', description: 'Client-specific documents' },
        { name: 'Prospects', description: 'Prospect and lead materials' },
        { name: 'Templates', description: 'Reusable document templates' },
        { name: 'Archive', description: 'Archived documents' },
      ];

      const createdFolders: WorkbenchFolder[] = [workspaceFolder];

      // Create subfolders under the workspace folder
      for (const folder of standardFolders) {
        try {
          const subfolder = await apiPost<WorkbenchFolder>(
            '/api/v1/documents/folders',
            {
              name: folder.name,
              description: folder.description,
              parentId: workspaceFolderId,
              workspaceId,
            },
            null
          );
          
          if (subfolder) {
            createdFolders.push(subfolder);
          }
        } catch (err) {
          console.error(`Failed to create folder ${folder.name}:`, err);
        }
      }

      return createdFolders;
    } catch (error) {
      console.error('Error creating standard folders:', error);
      return existingFolders;
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load all folders
      let foldersData = await apiFetch<WorkbenchFolder[]>(
        `/api/v1/documents/folders?workspaceId=${workspaceId}`,
        {},
        []
      );
      
      // If folders data is empty and we got a successful response, try to create defaults
      if (foldersData && foldersData.length === 0 && workspaceId && authUser?.id) {
        // Ensure standard folders exist if none exist
        const foldersWithDefaults = await ensureStandardFolders(foldersData);
        
        // If we created new folders, reload to get the complete hierarchy from server
        if (foldersWithDefaults && foldersWithDefaults.length > foldersData.length) {
          // Reload all folders from server to get complete hierarchy
          const reloadedFolders = await apiFetch<WorkbenchFolder[]>(
            `/api/v1/documents/folders?workspaceId=${workspaceId}`,
            {},
            []
          );
          setFolders(reloadedFolders || []);
        } else {
          setFolders(foldersData || []);
        }
      } else {
        setFolders(foldersData || []);
      }

      // Load all documents (root level only, documents in folders will be shown via folder structure)
      const docsData = await apiFetch<{
        documents: WorkbenchDocument[];
      }>(
        `/api/v1/documents/documents?workspaceId=${workspaceId}&limit=1000&status=active`,
        {},
        { documents: [] }
      );
      setDocuments(docsData?.documents || []);
    } catch (error) {
      console.error('Error loading explorer data:', error);
      // Set empty arrays on error to prevent stuck loading state
      setFolders([]);
      setDocuments([]);
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
          className={`flex items-center gap-0.5 px-1 py-0.5 text-xs cursor-pointer hover:bg-hover transition-colors ${
            isSelected ? 'bg-hover' : ''
          }`}
          style={{ paddingLeft: `${node.level * 12 + 4}px` }}
        >
          {/* Expand/Collapse Button */}
          {isFolder && hasChildren ? (
            <button
              className="p-0.5 hover:bg-panel-background rounded flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-3 h-3 text-muted" />
              ) : (
                <ChevronRightIcon className="w-3 h-3 text-muted" />
              )}
            </button>
          ) : (
            <div className="w-3.5 flex-shrink-0" />
          )}

          {/* Icon */}
          <div className="flex-shrink-0 mr-1">
            {isFolder ? (
              <FolderIcon className="w-3.5 h-3.5 text-muted" />
            ) : (
              (() => {
                const Icon = getDocumentIcon(node.document?.documentType || 'paper');
                return <Icon className="w-3.5 h-3.5 text-muted" />;
              })()
            )}
          </div>

          {/* Name */}
          <span className="text-xs text-foreground truncate flex-1">
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
              <div className="w-3.5 h-3.5 bg-loading-bg rounded animate-pulse flex-shrink-0"></div>
              <div className="w-3.5 h-3.5 bg-loading-bg rounded animate-pulse flex-shrink-0"></div>
              <div className="h-3 bg-loading-bg rounded animate-pulse" style={{ width: `${width}%` }}></div>
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
          <div className="text-xs text-muted">No folders or documents</div>
        </div>
      ) : (
        buildTree.map(node => renderNode(node))
      )}
    </div>
  );
}

