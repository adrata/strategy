"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkshop } from "../layout";
import { WorkshopDocument } from "../types/document";
import { generateSlug } from "@/platform/utils/url-utils";
import { useUnifiedAuth } from "@/platform/auth";
import { useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
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
  } = useWorkshop();
  const { user: authUser } = useUnifiedAuth();
  const { ui } = useRevenueOS();

  const [documents, setDocuments] = useState<WorkshopDocument[]>([]);
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

      const response = await fetch(`/api/v1/documents/documents?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      setError('Failed to load documents');
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
        return 'text-[var(--muted)] bg-[var(--hover)]';
      default:
        return 'text-[var(--muted)] bg-[var(--hover)]';
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-[var(--muted)]">Loading documents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-2">{error}</div>
          <button
            onClick={loadDocuments}
            className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <DocumentTextIcon className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No documents found</h3>
          <p className="text-[var(--muted)] mb-4">
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
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="bg-[var(--panel-background)] border-b border-[var(--border)]">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
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
                  router.push(`/${workspaceSlug}/workshop/${slug}`);
                }}
                className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-[var(--panel-background)] cursor-pointer group"
              >
                {/* Name */}
                <div className="col-span-5 flex items-center gap-3">
                  <div className={`p-1.5 rounded ${typeColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-[var(--foreground)] truncate">
                      {document.title}
                    </div>
                    {document.description && (
                      <div className="text-sm text-[var(--muted)] truncate">
                        {document.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Type */}
                <div className="col-span-2 flex items-center">
                  <span className="capitalize text-sm text-[var(--muted)]">
                    {document.documentType}
                  </span>
                </div>

                {/* Size */}
                <div className="col-span-2 flex items-center">
                  <span className="text-sm text-[var(--muted)]">
                    {formatFileSize(document.fileSize)}
                  </span>
                </div>

                {/* Modified */}
                <div className="col-span-2 flex items-center">
                  <span className="text-sm text-[var(--muted)]">
                    {new Date(document.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center justify-center">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 hover:bg-[var(--loading-bg)] rounded">
                      <EyeIcon className="w-4 h-4 text-[var(--muted)]" />
                    </button>
                    <button className="p-1 hover:bg-[var(--loading-bg)] rounded">
                      <ShareIcon className="w-4 h-4 text-[var(--muted)]" />
                    </button>
                    <button className="p-1 hover:bg-[var(--loading-bg)] rounded">
                      <EllipsisVerticalIcon className="w-4 h-4 text-[var(--muted)]" />
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
