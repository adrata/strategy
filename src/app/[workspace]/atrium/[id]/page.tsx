"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkshop } from "../layout";
import { WorkshopDocument } from "../types/document";
import { extractIdFromSlug } from "@/platform/utils/url-utils";
import { PaperEditor } from "../editors/PaperEditor";
import { CodeEditor } from "../editors/CodeEditor";
import { GridEditor } from "../editors/GridEditor";
import { MatrixEditor } from "../editors/MatrixEditor";
import { PitchEditorWrapper } from "../components/editors/PitchEditorWrapper";
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  ChartBarIcon,
  PresentationChartBarIcon,
  TableCellsIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface DocumentEditorPageProps {}

export default function DocumentEditorPage({}: DocumentEditorPageProps) {
  const params = useParams();
  const router = useRouter();
  const { workspace } = useWorkshop();
  const [document, setDocument] = useState<WorkshopDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const slug = params.id as string;
  const documentId = extractIdFromSlug(slug);

  // Load document
  useEffect(() => {
    if (!documentId || !workspace) {
      // If we can't extract an ID from the slug, try using the slug directly (backward compatibility)
      const fallbackId = slug;
      if (!fallbackId) return;
      
      const loadDocumentWithFallback = async () => {
        try {
          setLoading(true);
          setError(null);

          const response = await fetch(`/api/workshop/documents/${fallbackId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to load document: ${response.statusText}`);
          }

          const data = await response.json();
          setDocument(data);
        } catch (err) {
          console.error('Error loading document:', err);
          setError(err instanceof Error ? err.message : 'Failed to load document');
        } finally {
          setLoading(false);
        }
      };
      
      loadDocumentWithFallback();
      return;
    }

    const loadDocument = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/workshop/documents/${documentId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load document: ${response.statusText}`);
        }

        const data = await response.json();
        setDocument(data);
      } catch (err) {
        console.error('Error loading document:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [documentId, workspace, slug]);

  const handleSave = useCallback(async (content: any) => {
    if (!document) return;

    try {
      const response = await fetch(`/api/workshop/documents/${document.id}/content`, {
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

      const updatedDocument = await response.json();
      setDocument(updatedDocument);
    } catch (err) {
      console.error('Error saving document:', err);
      throw err;
    }
  }, [document]);

  const handleAutoSave = useCallback(async (content: any) => {
    if (!document) return;

    try {
      // Auto-save with minimal error handling
      await fetch(`/api/workshop/documents/${document.id}/content`, {
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
  }, [document]);

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'paper':
        return <DocumentTextIcon className="w-6 h-6 text-blue-600" />;
      case 'pitch':
        return <PresentationChartBarIcon className="w-6 h-6 text-purple-600" />;
      case 'grid':
        return <TableCellsIcon className="w-6 h-6 text-green-600" />;
      case 'code':
        return <CodeBracketIcon className="w-6 h-6 text-muted" />;
      case 'matrix':
        return <ChartBarIcon className="w-6 h-6 text-orange-600" />;
      default:
        return <DocumentTextIcon className="w-6 h-6 text-muted" />;
    }
  };

  const getDocumentTypeName = (type: string) => {
    switch (type) {
      case 'paper':
        return 'Paper Document';
      case 'pitch':
        return 'Presentation';
      case 'grid':
        return 'Spreadsheet';
      case 'code':
        return 'Code Document';
      case 'matrix':
        return 'Data Visualization';
      default:
        return 'Document';
    }
  };

  const renderEditor = () => {
    if (!document) return null;

    const editorProps = {
      document,
      onSave: handleSave,
      onAutoSave: handleAutoSave,
    };

    switch (document.documentType) {
      case 'paper':
        return <PaperEditor {...editorProps} />;
      case 'code':
        return <CodeEditor {...editorProps} />;
      case 'matrix':
        return <MatrixEditor {...editorProps} />;
      case 'pitch':
        return <PitchEditorWrapper {...editorProps} />;
      case 'grid':
        return <GridEditor {...editorProps} />;
      default:
        return (
          <div className="h-full flex items-center justify-center bg-background">
            <div className="text-center">
              <ExclamationTriangleIcon className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Unknown Document Type</h3>
              <p className="text-muted">This document type is not supported yet.</p>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Document</h3>
          <p className="text-muted mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Document Not Found</h3>
          <p className="text-muted mb-4">The document you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-border bg-panel-background">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </button>
        <span className="text-muted">/</span>
        <span className="text-sm text-muted">Workshop</span>
        <span className="text-muted">/</span>
        <div className="flex items-center gap-2">
          {getDocumentIcon(document.documentType)}
          <span className="text-sm font-medium text-foreground">{document.title}</span>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        {renderEditor()}
      </div>
    </div>
  );
}
