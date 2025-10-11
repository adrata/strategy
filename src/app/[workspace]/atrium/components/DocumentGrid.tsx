"use client";

import React, { useState, useEffect } from "react";
import { useAtrium } from "../layout";
import { AtriumDocument } from "../types/document";
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
  const {
    activeTab,
    searchQuery,
    selectedDocumentType,
    currentFolderId,
    setViewingDocument,
  } = useAtrium();

  const [documents, setDocuments] = useState<AtriumDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load documents
  useEffect(() => {
    loadDocuments();
  }, [activeTab, searchQuery, selectedDocumentType, currentFolderId]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // TODO: Implement actual API call
      // const response = await fetch('/api/atrium/documents?...');
      // const data = await response.json();
      
      // Mock data for now
      const mockDocuments: AtriumDocument[] = [
        {
          id: '1',
          title: 'Project Proposal',
          description: 'Q1 2024 project proposal document',
          documentType: 'paper',
          status: 'published',
          version: '1.0',
          isEncrypted: false,
          classification: 'internal',
          requiresAuth: false,
          tags: ['proposal', 'q1-2024'],
          isStarred: false,
          isTemplate: false,
          ownerId: 'user1',
          workspaceId: 'workspace1',
          fileType: 'application/json',
          viewCount: 15,
          downloadCount: 3,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-20'),
          content: '<h1>Project Proposal</h1><p>This is a sample project proposal document. You can edit this content by clicking the Edit button above.</p><h2>Objectives</h2><ul><li>Increase productivity by 25%</li><li>Reduce costs by 15%</li><li>Improve customer satisfaction</li></ul><h2>Timeline</h2><p>The project is expected to be completed within 6 months, starting from Q1 2024.</p>',
          owner: {
            id: 'user1',
            name: 'John Doe',
            email: 'john@example.com',
          },
          _count: {
            shares: 2,
            versions: 3,
            comments: 5,
            activities: 12,
          },
        },
        {
          id: '2',
          title: 'JavaScript Code Sample',
          description: 'Sample JavaScript code for demonstration',
          documentType: 'code',
          status: 'published',
          version: '2.1',
          isEncrypted: false,
          classification: 'internal',
          requiresAuth: false,
          tags: ['javascript', 'sample'],
          isStarred: true,
          isTemplate: false,
          ownerId: 'user2',
          workspaceId: 'workspace1',
          fileType: 'application/json',
          viewCount: 8,
          downloadCount: 1,
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-18'),
          content: `// Welcome to Atrium Code Editor
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

const products = [
  { name: 'Laptop', price: 999 },
  { name: 'Mouse', price: 25 },
  { name: 'Keyboard', price: 75 }
];

const total = calculateTotal(products);
console.log('Total:', total);

// This is a sample code document
// You can edit this code by clicking the Edit button above`,
          owner: {
            id: 'user2',
            name: 'Jane Smith',
            email: 'jane@example.com',
          },
          _count: {
            shares: 1,
            versions: 4,
            comments: 2,
            activities: 8,
          },
        },
      ];

      setDocuments(mockDocuments);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-[var(--muted)]">Loading documents...</span>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {documents.map((document) => {
          const Icon = getDocumentIcon(document.documentType);
          const typeColor = getDocumentTypeColor(document.documentType);
          
          return (
            <div
              key={document.id}
              onClick={() => setViewingDocument(document)}
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
