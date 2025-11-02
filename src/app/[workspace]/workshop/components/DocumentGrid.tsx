"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkshop } from "../layout";
import { WorkshopDocument } from "../types/document";
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

export function DocumentGrid() {
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

  const workspaceId = ui.activeWorkspace?.id || authUser?.activeWorkspaceId;

  // Load documents
  useEffect(() => {
    loadDocuments();
  }, [activeTab, searchQuery, selectedDocumentType, currentFolderId, workspaceId, authUser?.id]);

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
      } else {
        params.append('sortBy', 'updatedAt');
        params.append('sortOrder', 'desc');
      }

      const data = await apiFetch<{
        documents: WorkshopDocument[];
        pagination?: { total: number };
      }>(`/api/v1/documents/documents?${params.toString()}`);
      setDocuments(data.documents || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load documents';
      setError(errorMessage);
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

  if (isLoading || error) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
              <div className="space-y-3">
                <div className="h-12 w-12 bg-[var(--loading-bg)] rounded-lg animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-[var(--loading-bg)] rounded animate-pulse"></div>
                  <div className="h-3 bg-[var(--loading-bg)] rounded w-3/4 animate-pulse"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 bg-[var(--loading-bg)] rounded w-16 animate-pulse"></div>
                  <div className="h-3 bg-[var(--loading-bg)] rounded w-12 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
              className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
            >
              {/* Document Header */}
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${typeColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1 hover:bg-[var(--hover)] rounded">
                    <EyeIcon className="w-4 h-4 text-[var(--muted)]" />
                  </button>
                  <button className="p-1 hover:bg-[var(--hover)] rounded">
                    <ShareIcon className="w-4 h-4 text-[var(--muted)]" />
                  </button>
                  <button className="p-1 hover:bg-[var(--hover)] rounded">
                    <EllipsisVerticalIcon className="w-4 h-4 text-[var(--muted)]" />
                  </button>
                </div>
              </div>

              {/* Document Info */}
              <div className="space-y-2">
                <h3 className="font-medium text-[var(--foreground)] line-clamp-2">
                  {document.title}
                </h3>
                {document.description && (
                  <p className="text-sm text-[var(--muted)] line-clamp-2">
                    {document.description}
                  </p>
                )}
                
                {/* Document Meta */}
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span className="capitalize">{document.documentType}</span>
                  <span>{formatFileSize(document.fileSize)}</span>
                </div>

                {/* Owner and Date */}
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>{document.owner?.name}</span>
                  <span>{new Date(document.updatedAt).toLocaleDateString()}</span>
                </div>

                {/* Tags */}
                {document.tags && document.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {document.tags.slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--hover)] text-[var(--muted)]"
                      >
                        {tag}
                      </span>
                    ))}
                    {document.tags.length > 2 && (
                      <span className="text-xs text-[var(--muted)]">
                        +{document.tags.length - 2} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
