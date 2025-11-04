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
      
      console.log('📄 [VisionDocumentDetail] Rendering paper content:', {
        type: typeof contentToRender,
        hasContent: !!contentToRender,
        contentPreview: typeof contentToRender === 'string' 
          ? contentToRender.substring(0, 100) 
          : typeof contentToRender === 'object' 
            ? Object.keys(contentToRender) 
            : 'unknown'
      });
      
      // Handle null/undefined content
      if (!contentToRender) {
        return (
          <div className="text-muted">
            <p>No content available for this paper.</p>
          </div>
        );
      }
      
      // If content is a string, try to parse it as JSON first
      if (typeof contentToRender === 'string') {
        // If it's empty, show message
        if (contentToRender.trim() === '') {
          return (
            <div className="text-muted">
              <p>This paper has no content yet.</p>
            </div>
          );
        }
        
        try {
          const parsed = JSON.parse(contentToRender);
          contentToRender = parsed;
          console.log('📄 [VisionDocumentDetail] Parsed JSON content:', Object.keys(parsed));
        } catch (e) {
          // Not JSON, treat as HTML string
          console.log('📄 [VisionDocumentDetail] Treating as HTML string');
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
          console.log('📄 [VisionDocumentDetail] Rendering HTML content');
          return (
            <div className="prose prose-lg max-w-none">
              <div dangerouslySetInnerHTML={{ __html: contentToRender.html }} />
            </div>
          );
        } else if (contentToRender.markdown) {
          console.log('📄 [VisionDocumentDetail] Rendering Markdown content');
          return (
            <div className="prose prose-lg max-w-none">
              <pre className="whitespace-pre-wrap font-sans">{contentToRender.markdown}</pre>
            </div>
          );
        } else if (contentToRender.text) {
          console.log('📄 [VisionDocumentDetail] Rendering text content');
          return (
            <div className="prose prose-lg max-w-none">
              <p className="whitespace-pre-wrap">{contentToRender.text}</p>
            </div>
          );
        } else if (contentToRender.content) {
          // Nested content structure
          console.log('📄 [VisionDocumentDetail] Rendering nested content');
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
          // Check if object has any string properties we can display
          const stringValues = Object.values(contentToRender).filter(v => typeof v === 'string' && v.trim() !== '');
          if (stringValues.length > 0) {
            console.log('📄 [VisionDocumentDetail] Rendering first string property from object');
            return (
              <div className="prose prose-lg max-w-none">
                <div dangerouslySetInnerHTML={{ __html: stringValues[0] as string }} />
              </div>
            );
          }
          
          // Fallback: show formatted JSON only in development
          const isDevelopment = process.env.NODE_ENV === 'development';
          console.warn('📄 [VisionDocumentDetail] Unrecognized content format, showing fallback');
          return (
            <div className="prose prose-lg max-w-none">
              {isDevelopment ? (
                <div>
                  <p className="text-sm text-muted mb-4">Content format not recognized. Raw content:</p>
                  <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs border border-gray-200">
                    {JSON.stringify(contentToRender, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-muted">
                  <p>Content format not recognized. Please contact support.</p>
                </div>
              )}
            </div>
          );
        }
      } else {
        // Fallback for other types
        console.warn('📄 [VisionDocumentDetail] Content is not string or object:', typeof contentToRender);
        return (
          <div className="text-muted">
            <p>Unable to display content. Content type: {typeof contentToRender}</p>
          </div>
        );
      }
    }
  };

  return (
    <div className="h-full w-full bg-background flex flex-col overflow-hidden">
      {/* Breadcrumb Header - Sticky (like Chronicle) */}
      <div className="sticky top-0 z-10 px-6 py-4 border-b border-border bg-background flex-shrink-0">
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
        <div className="sticky top-[73px] z-10 px-6 py-6 border-b border-border bg-background flex-shrink-0">
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

      {/* Content (like Chronicle) - Scrollable */}
      <div className="flex-1 overflow-y-auto invisible-scrollbar bg-background">
        <div className="px-6 py-8 max-w-5xl mx-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

