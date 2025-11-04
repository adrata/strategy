"use client";

/**
 * Vision Document Modal
 * 
 * Modal component for viewing and editing Paper and Pitch documents
 * Similar to AddLeadModal pattern - centered modal overlay
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { PresentationView } from '@/frontend/components/pipeline/PresentationView';
import { PitchRegularView } from '@/frontend/components/pipeline/PitchRegularView';

interface VisionDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string | null;
  documentType: 'paper' | 'pitch' | null;
}

export function VisionDocumentModal({ 
  isOpen, 
  onClose, 
  documentId, 
  documentType 
}: VisionDocumentModalProps) {
  const [documentData, setDocumentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  useEffect(() => {
    if (!isOpen || !documentId || !documentType) {
      return;
    }

    const fetchDocument = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/v1/stacks/vision/${documentId}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch document');
        }

        const data = await response.json();
        if (data.document?.documentType !== documentType) {
          throw new Error(`Document is not a ${documentType}`);
        }

        setDocumentData(data.document);
      } catch (err) {
        console.error('Error fetching document:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [isOpen, documentId, documentType]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDocumentData(null);
      setLoading(true);
      setError(null);
      setIsPresentationMode(false);
    }
  }, [isOpen]);

  if (!isOpen || !documentId || !documentType) {
    return null;
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted">Loading document...</p>
          </div>
        </div>
      );
    }

    if (error || !documentData) {
      return (
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {error || 'Document Not Found'}
            </h2>
            <p className="text-muted">
              {error || 'The document could not be loaded.'}
            </p>
          </div>
        </div>
      );
    }

    if (documentType === 'pitch') {
      const pitchData = {
        content: documentData.content || { slides: {} },
        title: documentData.title
      };

      if (isPresentationMode) {
        return (
          <PresentationView
            pitchData={pitchData}
            onExitPresentation={() => setIsPresentationMode(false)}
          />
        );
      }

      return (
        <PitchRegularView
          pitchData={pitchData}
          onEnterPresentation={() => setIsPresentationMode(true)}
          documentId={documentId}
        />
      );
    } else {
      // Paper rendering
      if (typeof documentData.content === 'string') {
        return (
          <div className="prose prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ __html: documentData.content }} />
          </div>
        );
      } else if (documentData.content && typeof documentData.content === 'object') {
        if (documentData.content.html) {
          return (
            <div className="prose prose-lg max-w-none">
              <div dangerouslySetInnerHTML={{ __html: documentData.content.html }} />
            </div>
          );
        } else if (documentData.content.markdown) {
          return (
            <div className="prose prose-lg max-w-none">
              <pre className="whitespace-pre-wrap">{documentData.content.markdown}</pre>
            </div>
          );
        } else {
          return (
            <div className="prose prose-lg max-w-none">
              <pre>{JSON.stringify(documentData.content, null, 2)}</pre>
            </div>
          );
        }
      } else {
        return (
          <div className="text-muted">
            <p>No content available for this paper.</p>
          </div>
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] mx-4 flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-hover transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 text-muted" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {documentData?.title || `Loading ${documentType}...`}
                </h2>
                <p className="text-sm text-muted capitalize">
                  {documentType} Document
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-hover transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-muted" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto invisible-scrollbar p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

