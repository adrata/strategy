"use client";

/**
 * Vision Document Detail Component
 * 
 * Detail view component for viewing Paper and Pitch documents in the middle panel
 * Similar to ChronicleReportEnhanced pattern - no modal, just content in middle panel
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { PresentationView } from '@/frontend/components/pipeline/PresentationView';
import { PitchRegularView } from '@/frontend/components/pipeline/PitchRegularView';

interface VisionDocumentDetailProps {
  documentId: string;
  documentType: 'paper' | 'pitch';
  onBack?: () => void;
}

export function VisionDocumentDetail({ 
  documentId, 
  documentType,
  onBack 
}: VisionDocumentDetailProps) {
  const [documentData, setDocumentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  useEffect(() => {
    if (!documentId || !documentType) {
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
  }, [documentId, documentType]);

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
      const slideData = documentData.content || { slides: {} };

      if (isPresentationMode) {
        return (
          <PresentationView
            slideData={slideData}
            onClose={() => setIsPresentationMode(false)}
          />
        );
      }

      return (
        <PitchRegularView
          slideData={slideData}
          onPresent={() => setIsPresentationMode(true)}
          onBack={onBack}
          hideHeader={false}
        />
      );
    } else {
      // Paper rendering
      let contentToRender = documentData.content;
      
      // If content is a string, try to parse it as JSON first
      if (typeof contentToRender === 'string') {
        try {
          const parsed = JSON.parse(contentToRender);
          contentToRender = parsed;
        } catch (e) {
          // Not JSON, treat as HTML string
          return (
            <div className="prose prose-lg max-w-none">
              <div dangerouslySetInnerHTML={{ __html: contentToRender }} />
            </div>
          );
        }
      }
      
      // Now handle object content
      if (contentToRender && typeof contentToRender === 'object') {
        if (contentToRender.html) {
          return (
            <div className="prose prose-lg max-w-none">
              <div dangerouslySetInnerHTML={{ __html: contentToRender.html }} />
            </div>
          );
        } else if (contentToRender.markdown) {
          return (
            <div className="prose prose-lg max-w-none">
              <pre className="whitespace-pre-wrap font-sans">{contentToRender.markdown}</pre>
            </div>
          );
        } else if (contentToRender.text) {
          return (
            <div className="prose prose-lg max-w-none">
              <p className="whitespace-pre-wrap">{contentToRender.text}</p>
            </div>
          );
        } else if (contentToRender.content) {
          // Nested content structure
          return (
            <div className="prose prose-lg max-w-none">
              {typeof contentToRender.content === 'string' ? (
                <div dangerouslySetInnerHTML={{ __html: contentToRender.content }} />
              ) : (
                <p>{String(contentToRender.content)}</p>
              )}
            </div>
          );
        } else {
          // Fallback: show formatted JSON only in development
          const isDevelopment = process.env.NODE_ENV === 'development';
          return (
            <div className="prose prose-lg max-w-none">
              {isDevelopment ? (
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
                  {JSON.stringify(contentToRender, null, 2)}
                </pre>
              ) : (
                <div className="text-muted">
                  <p>Content format not recognized. Please contact support.</p>
                </div>
              )}
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
    <div className="h-full w-full bg-background">
      {/* Breadcrumb Header - Sticky (like Chronicle) */}
      <div className="sticky top-0 z-10 px-6 py-4 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-hover rounded-lg transition-colors"
              >
                <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted">Vision</span>
              <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-foreground font-medium">
                {documentData?.title || `Loading ${documentType}...`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Document Title - Sticky (like Chronicle) */}
      {documentData && (
        <div className="sticky top-[73px] z-10 px-6 py-6 border-b border-border bg-background">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {documentData.title}
            </h1>
            <p className="text-muted capitalize">
              {documentType} Document
            </p>
          </div>
        </div>
      )}

      {/* Content (like Chronicle) */}
      <div className="px-6 py-8 overflow-y-auto invisible-scrollbar max-w-5xl mx-auto bg-background">
        {renderContent()}
      </div>
    </div>
  );
}

