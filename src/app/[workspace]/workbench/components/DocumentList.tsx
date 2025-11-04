"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkbench } from "../layout";
import { WorkbenchDocument } from "../types/document";
import { generateSlug } from "@/platform/utils/url-utils";
import { useUnifiedAuth } from "@/platform/auth";
import { useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
import { apiFetch } from "@/platform/api-fetch";
import { 
  DocumentTextIcon,
  PresentationChartBarIcon,
  TableCellsIcon,
  CodeBracketIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  ShareIcon,
  TrashIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

export function DocumentList() {
  const router = useRouter();
  const {
    activeTab,
    searchQuery,
    selectedDocumentType,
    currentFolderId,
    workspace,
  } = useWorkbench();
  const { user: authUser } = useUnifiedAuth();
  const { ui } = useRevenueOS();

  const [documents, setDocuments] = useState<WorkbenchDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const workspaceId = ui.activeWorkspace?.id || authUser?.activeWorkspaceId;

  // Load documents
  useEffect(() => {
    loadDocuments();
  }, [activeTab, searchQuery, selectedDocumentType, currentFolderId, sortBy, sortOrder, workspaceId, authUser?.id]);

  const loadDocuments = async () => {
    if (!workspaceId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams({
        workspaceId,
        limit: '100',
        status: 'active',
      });

      if (currentFolderId) {
        params.append('folderId', currentFolderId);
      }

      if (selectedDocumentType) {
        params.append('type', selectedDocumentType);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      if (activeTab === 'my-documents' && authUser?.id) {
        params.append('ownerId', authUser.id);
      }

      if (activeTab === 'starred') {
        params.append('starred', 'true');
      }

      if (activeTab === 'recent') {
        params.append('sortBy', 'updatedAt');
        params.append('sortOrder', 'desc');
      }

      params.append('sortBy', sortBy === 'name' ? 'title' : sortBy === 'date' ? 'updatedAt' : 'updatedAt');
      params.append('sortOrder', sortOrder);

      const data = await apiFetch<{
        documents: WorkbenchDocument[];
        pagination?: { total: number };
      }>(
        `/api/v1/documents/documents?${params.toString()}`,
        {},
        { documents: [], pagination: { total: 0 } }
      );
      setDocuments(data.documents || []);
      // Clear error if we got a successful response (even if it's a fallback)
      setError(null);
    } catch (err) {
      // Only set error if it's not an auth error (fallback should have handled it)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load documents';
      // If it's an auth error and we have fallback, don't set error
      if (!errorMessage.includes('Authentication required')) {
        setError(errorMessage);
      } else {
        // Auth error - use empty state
        setDocuments([]);
        setError(null);
      }
      console.error('Error loading documents:', err);
    } finally {
      setIsLoading(false);
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

  const getDocumentTypeColor = (documentType: string) => {
    switch (documentType) {
      case 'paper':
        return 'text-blue-600 bg-blue-100';
      case 'pitch':
        return 'text-purple-600 bg-purple-100';
      case 'grid':
        return 'text-green-600 bg-green-100';
      case 'code':
        return 'text-muted bg-hover';
      default:
        return 'text-muted bg-hover';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleSort = (column: 'name' | 'date' | 'size' | 'type') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  if (isLoading || error) {
    return (
      <div className="p-6">
        <div className="bg-background border border-border rounded-lg overflow-hidden">
          <div className="bg-panel-background border-b border-border">
            <div className="grid grid-cols-12 gap-4 px-4 py-3">
              {['Name', 'Type', 'Size', 'Modified', 'Actions'].map((col, i) => (
                <div key={i} className={`${i === 0 ? 'col-span-5' : i < 4 ? 'col-span-2' : 'col-span-1'} h-4 bg-loading-bg rounded animate-pulse`}></div>
              ))}
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 px-4 py-3">
                <div className="col-span-5 flex items-center gap-3">
                  <div className="h-8 w-8 bg-loading-bg rounded animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-loading-bg rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-loading-bg rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
                <div className="col-span-2 h-4 bg-loading-bg rounded animate-pulse"></div>
                <div className="col-span-2 h-4 bg-loading-bg rounded animate-pulse"></div>
                <div className="col-span-2 h-4 bg-loading-bg rounded animate-pulse"></div>
                <div className="col-span-1 h-4 bg-loading-bg rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <DocumentTextIcon className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No documents found</h3>
          <p className="text-muted mb-4">
            {searchQuery 
              ? "No documents match your search criteria."
              : "Get started by creating or uploading your first document."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Table Header */}
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <div className="bg-panel-background border-b border-border">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-muted uppercase tracking-wide">
            <div className="col-span-5">
              <button
                onClick={() => handleSort('name')}
                className="flex items-center gap-1 hover:text-gray-700"
              >
                Name
                {sortBy === 'name' && (
                  <span className="text-blue-500">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
            </div>
            <div className="col-span-2">
              <button
                onClick={() => handleSort('type')}
                className="flex items-center gap-1 hover:text-gray-700"
              >
                Type
                {sortBy === 'type' && (
                  <span className="text-blue-500">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
            </div>
            <div className="col-span-2">
              <button
                onClick={() => handleSort('size')}
                className="flex items-center gap-1 hover:text-gray-700"
              >
                Size
                {sortBy === 'size' && (
                  <span className="text-blue-500">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
            </div>
            <div className="col-span-2">
              <button
                onClick={() => handleSort('date')}
                className="flex items-center gap-1 hover:text-gray-700"
              >
                Modified
                {sortBy === 'date' && (
                  <span className="text-blue-500">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
            </div>
            <div className="col-span-1 text-center">Actions</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {documents.map((document) => {
            const Icon = getDocumentIcon(document.documentType);
            const typeColor = getDocumentTypeColor(document.documentType);
            
            return (
              <div
                key={document.id}
                onClick={() => {
                  const slug = generateSlug(document.title, document.id);
                  const workspaceSlug = workspace?.slug || 'default';
                  router.push(`/${workspaceSlug}/workbench/${slug}`);
                }}
                className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-panel-background cursor-pointer group"
              >
                {/* Name */}
                <div className="col-span-5 flex items-center gap-3">
                  <div className={`p-1.5 rounded ${typeColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground truncate">
                      {document.title}
                    </div>
                    {document.description && (
                      <div className="text-sm text-muted truncate">
                        {document.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Type */}
                <div className="col-span-2 flex items-center">
                  <span className="capitalize text-sm text-muted">
                    {document.documentType}
                  </span>
                </div>

                {/* Size */}
                <div className="col-span-2 flex items-center">
                  <span className="text-sm text-muted">
                    {formatFileSize(document.fileSize)}
                  </span>
                </div>

                {/* Modified */}
                <div className="col-span-2 flex items-center">
                  <span className="text-sm text-muted">
                    {new Date(document.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center justify-center">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 hover:bg-loading-bg rounded">
                      <EyeIcon className="w-4 h-4 text-muted" />
                    </button>
                    <button className="p-1 hover:bg-loading-bg rounded">
                      <ShareIcon className="w-4 h-4 text-muted" />
                    </button>
                    <button className="p-1 hover:bg-loading-bg rounded">
                      <EllipsisVerticalIcon className="w-4 h-4 text-muted" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
