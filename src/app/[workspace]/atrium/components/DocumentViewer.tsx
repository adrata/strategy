"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { WorkshopDocument } from "../types/document";
import { PaperEditorWrapper } from "./editors/PaperEditorWrapper";
import { CodeEditorWrapper } from "./editors/CodeEditorWrapper";
import { MatrixEditor } from "../editors/MatrixEditor";
import { generateSlug } from "@/platform/utils/url-utils";
import { 
  ArrowLeftIcon,
  PencilIcon,
  EyeIcon,
  ShareIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  ChartBarIcon,
  PresentationChartBarIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";

interface DocumentViewerProps {
  document: WorkshopDocument;
  isEditMode: boolean;
  onBack: () => void;
  onToggleEditMode: () => void;
  onShare?: () => void;
}

export function DocumentViewer({ document, isEditMode, onBack, onToggleEditMode, onShare }: DocumentViewerProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async (content: any) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/v1/documents/documents/${document.id}/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          updatedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save document: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error saving document:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [document.id]);

  const handleAutoSave = useCallback(async (content: any) => {
    try {
      // Auto-save with minimal error handling
      await fetch(`/api/v1/documents/documents/${document.id}/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          updatedAt: new Date().toISOString(),
          isAutoSave: true,
        }),
      });
    } catch (err) {
      // Silently fail for auto-save
      console.warn('Auto-save failed:', err);
    }
  }, [document.id]);

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'paper':
        return <DocumentTextIcon className="w-5 h-5 text-blue-600" />;
      case 'pitch':
        return <PresentationChartBarIcon className="w-5 h-5 text-purple-600" />;
      case 'grid':
        return <TableCellsIcon className="w-5 h-5 text-green-600" />;
      case 'code':
        return <CodeBracketIcon className="w-5 h-5 text-[var(--muted)]" />;
      case 'matrix':
        return <ChartBarIcon className="w-5 h-5 text-orange-600" />;
      default:
        return <DocumentTextIcon className="w-5 h-5 text-[var(--muted)]" />;
    }
  };

  const renderEditor = () => {
    const editorProps = {
      document,
      onSave: handleSave,
      onAutoSave: handleAutoSave,
    };

    switch (document.documentType) {
      case 'paper':
        return <PaperEditorWrapper {...editorProps} />;
      case 'code':
        return <CodeEditorWrapper {...editorProps} />;
      case 'matrix':
        return <MatrixEditor {...editorProps} />;
      case 'pitch':
        // TODO: Implement PitchEditor
        return (
          <div className="h-full flex items-center justify-center bg-[var(--background)]">
            <div className="text-center">
              <PresentationChartBarIcon className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Pitch Editor</h3>
              <p className="text-[var(--muted)]">Presentation editor coming soon...</p>
            </div>
          </div>
        );
      case 'grid':
        // TODO: Implement GridEditor
        return (
          <div className="h-full flex items-center justify-center bg-[var(--background)]">
            <div className="text-center">
              <TableCellsIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Grid Editor</h3>
              <p className="text-[var(--muted)]">Spreadsheet editor coming soon...</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="h-full flex items-center justify-center bg-[var(--background)]">
            <div className="text-center">
              <DocumentTextIcon className="w-16 h-16 text-[var(--muted)] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Unknown Document Type</h3>
              <p className="text-[var(--muted)]">This document type is not supported yet.</p>
            </div>
          </div>
        );
    }
  };

  const renderReadOnlyView = () => {
    // Show the document content directly without editor interface
    switch (document.documentType) {
      case 'paper':
        return (
          <div className="h-full bg-[var(--background)] overflow-auto">
            <div className="px-6 py-6">
              <div className="max-w-4xl mx-auto">
                <div className="prose prose-lg max-w-none">
                  <h1 className="text-3xl font-bold text-[var(--foreground)] mb-6">{document.title}</h1>
                  {document.description && (
                    <p className="text-lg text-[var(--muted)] mb-8">{document.description}</p>
                  )}
                  <div className="text-gray-800 leading-relaxed">
                    {document.content ? (
                      typeof document.content === 'string' ? (
                        <div dangerouslySetInnerHTML={{ __html: document.content }} />
                      ) : document.content.content ? (
                        <div dangerouslySetInnerHTML={{ __html: document.content.content }} />
                      ) : (
                        <p>Document content is available. Click "Update" to view and modify.</p>
                      )
                    ) : (
                      <div className="text-center py-12">
                        <DocumentTextIcon className="w-16 h-16 text-[var(--muted)] mx-auto mb-4" />
                        <p className="text-[var(--muted)]">This document is empty. Click "Update" to start writing.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'code':
        return (
          <div className="h-full bg-[var(--foreground)] text-[var(--foreground)] overflow-auto">
            <div className="px-6 py-6">
              <pre className="text-sm font-mono leading-relaxed">
                <code>
                  {document.content ? (
                    typeof document.content === 'string' ? document.content :
                    document.content.content ? document.content.content :
                    JSON.stringify(document.content, null, 2)
                  ) : (
                    <div className="text-center py-12">
                      <CodeBracketIcon className="w-16 h-16 text-[var(--muted)] mx-auto mb-4" />
                      <p className="text-[var(--muted)]">This code document is empty. Click "Update" to start coding.</p>
                    </div>
                  )}
                </code>
              </pre>
            </div>
          </div>
        );
      
      case 'matrix':
        return (
          <div className="h-full bg-[var(--background)] overflow-auto">
            <div className="px-6 py-6">
              {document.content && document.content.charts ? (
                <div className="space-y-6">
                  <h1 className="text-2xl font-bold text-[var(--foreground)]">{document.title}</h1>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {document.content.charts.map((chart: any, index: number) => (
                      <div key={index} className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">{chart.title}</h3>
                        <div className="text-center text-[var(--muted)]">
                          <ChartBarIcon className="w-12 h-12 mx-auto mb-2" />
                          <p>Chart visualization would appear here</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ChartBarIcon className="w-16 h-16 text-[var(--muted)] mx-auto mb-4" />
                  <p className="text-[var(--muted)]">This dashboard is empty. Click "Update" to create charts.</p>
                </div>
              )}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="h-full flex items-center justify-center bg-[var(--background)]">
            <div className="text-center max-w-md">
              <div className="flex items-center justify-center mb-4">
                {getDocumentIcon(document.documentType)}
              </div>
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">{document.title}</h3>
              <p className="text-[var(--muted)] mb-4">
                {document.description || 'No description available'}
              </p>
              <p className="text-sm text-[var(--muted)]">
                Click "Update" to modify this document
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover)] rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <button
              onClick={() => {
                // Navigate back to workshop main page
                const currentPath = window.location.pathname;
                const workspaceMatch = currentPath.match(/^\/([^\/]+)\//);
                if (workspaceMatch) {
                  const workspaceSlug = workspaceMatch[1];
                  router.push(`/${workspaceSlug}/workshop`);
                } else {
                  router.push('/workshop');
                }
              }}
              className="hover:text-[var(--foreground)] transition-colors"
            >
              All Files
            </button>
            <span>/</span>
            <span className="text-[var(--foreground)] font-medium">{document.title}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-xs text-[var(--muted)]">Saving...</span>
          )}
          <button
            onClick={onShare}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200"
            title="Share"
          >
            Share
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {renderEditor()}
      </div>
    </div>
  );
}
