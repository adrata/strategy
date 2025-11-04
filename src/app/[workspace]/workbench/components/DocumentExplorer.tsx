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
    // Check if user is authenticated before attempting to create folders
    if (!authUser?.id || !workspaceId) {
      console.log('Skipping folder creation - user not authenticated or workspaceId missing', {
        hasAuthUser: !!authUser?.id,
        hasWorkspaceId: !!workspaceId
      });
      return existingFolders;
    }

    // Check if we already have root-level folders (don't create duplicates)
    const rootFolders = existingFolders.filter(f => !f.parentId);
    if (rootFolders.length > 0) {
      // Check if we have any of the standard folders
      const standardFolderNames = ['Projects', 'Templates', 'Archive', 'Personal'];
      const hasStandardFolders = rootFolders.some(f => 
        standardFolderNames.includes(f.name)
      );
      
      // If we already have folders but not the standard ones, create them at root level
      if (!hasStandardFolders) {
        try {
          const standardFolders = [
            { name: 'Projects', description: 'Project and client documents' },
            { name: 'Templates', description: 'Reusable document templates' },
            { name: 'Archive', description: 'Archived documents' },
            { name: 'Personal', description: 'Personal notes and documents' },
          ];

          const createdFolders: WorkbenchFolder[] = [...existingFolders];

          // Create standard folders at root level (no parent)
          for (const folder of standardFolders) {
            try {
              // Check if folder already exists to avoid duplicates
              const exists = existingFolders.some(f => 
                f.name === folder.name && !f.parentId
              );
              
              if (!exists) {
                const subfolder = await apiPost<WorkbenchFolder>(
                  '/api/v1/documents/folders',
                  {
                    name: folder.name,
                    description: folder.description,
                    parentId: null,
                    workspaceId,
                  },
                  null
                );
                
                if (subfolder) {
                  createdFolders.push(subfolder);
                }
              }
            } catch (err) {
              // If folder already exists (409), that's fine
              if ((err as any)?.status !== 409) {
                console.error(`Failed to create folder ${folder.name}:`, err);
              }
            }
          }

          return createdFolders;
        } catch (error) {
          console.error('Error creating standard folders:', error);
          return existingFolders;
        }
      }
      
      return existingFolders;
    }

    // No folders exist, create standard root-level folders
    try {
      const standardFolders = [
        { name: 'Projects', description: 'Project and client documents' },
        { name: 'Templates', description: 'Reusable document templates' },
        { name: 'Archive', description: 'Archived documents' },
        { name: 'Personal', description: 'Personal notes and documents' },
      ];

      const createdFolders: WorkbenchFolder[] = [];

      // Create standard folders at root level (no parent)
      for (const folder of standardFolders) {
        try {
          const subfolder = await apiPost<WorkbenchFolder>(
            '/api/v1/documents/folders',
            {
              name: folder.name,
              description: folder.description,
              parentId: null,
              workspaceId,
            },
            null
          );
          
          if (subfolder) {
            createdFolders.push(subfolder);
          }
        } catch (err) {
          // If folder already exists (409), that's fine
          if ((err as any)?.status !== 409) {
            console.error(`Failed to create folder ${folder.name}:`, err);
          }
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
    
    // Deduplicate folders by name and parentId (keep the first one found)
    const seenFolders = new Map<string, WorkbenchFolder>();
    const uniqueFolders: WorkbenchFolder[] = [];
    
    folders.forEach(folder => {
      const key = `${folder.name}-${folder.parentId || 'root'}`;
      if (!seenFolders.has(key)) {
        seenFolders.set(key, folder);
        uniqueFolders.push(folder);
      }
    });

    // Build folder nodes from unique folders only
    uniqueFolders.forEach(folder => {
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

    // Build folder hierarchy using unique folders
    uniqueFolders.forEach(folder => {
      const node = nodeMap.get(`folder-${folder.id}`);
      if (!node) return;

      // Add child folders
      const childFolders = uniqueFolders.filter(f => f.parentId === folder.id);
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

    // Sort root nodes: folders first, then documents, alphabetically
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
    const isRootLevel = node.level === 0;

    return (
      <div key={node.id}>
        <div
          onClick={() => handleNodeClick(node)}
          className={`flex items-center gap-1.5 px-2 py-1.5 text-xs cursor-pointer transition-colors rounded-md ${
            isSelected 
              ? 'bg-slate-100 text-slate-900' 
              : 'hover:bg-slate-50 text-slate-700'
          }`}
          style={{ paddingLeft: `${node.level * 16 + 8}px` }}
        >
          {/* Expand/Collapse Button */}
          {isFolder && hasChildren ? (
            <button
              className="p-0.5 hover:bg-slate-200 rounded flex-shrink-0 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronRightIcon className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>
          ) : (
            <div className="w-4 flex-shrink-0" />
          )}

          {/* Icon */}
          <div className="flex-shrink-0">
            {isFolder ? (
              <FolderIcon className={`w-4 h-4 ${isRootLevel ? 'text-slate-600' : 'text-slate-500'}`} />
            ) : (
              (() => {
                const Icon = getDocumentIcon(node.document?.documentType || 'paper');
                return <Icon className="w-4 h-4 text-slate-500" />;
              })()
            )}
          </div>

          {/* Name */}
          <span className={`text-xs truncate flex-1 ${isRootLevel && isFolder ? 'font-medium' : ''}`}>
            {node.name}
          </span>
          
          {/* Document count badge for folders */}
          {isFolder && hasChildren && (
            <span className="text-xs text-slate-400 flex-shrink-0">
              {node.children.length}
            </span>
          )}
        </div>

        {/* Children */}
        {isFolder && isExpanded && (
          <div className="ml-2">
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
          const width = 70 + (i % 2) * 15;
          return (
            <div key={i} className="flex items-center gap-2 px-2 py-1.5 mb-1">
              <div className="w-4 h-4 bg-loading-bg rounded animate-pulse flex-shrink-0" />
              <div className="h-3 bg-loading-bg rounded animate-pulse flex-1" style={{ maxWidth: `${width}%` }} />
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
