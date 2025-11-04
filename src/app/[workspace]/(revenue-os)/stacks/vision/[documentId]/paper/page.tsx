"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function VisionPaperPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params?.documentId as string;
  
  const [paperData, setPaperData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaper = async () => {
      if (!documentId) {
        setError('Document ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/v1/stacks/vision/${documentId}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch paper document');
        }

        const data = await response.json();
        if (data.document?.documentType !== 'paper') {
          throw new Error('Document is not a paper');
        }

        setPaperData(data.document);
        setError(null);
      } catch (err) {
        console.error('Error fetching paper:', err);
        setError(err instanceof Error ? err.message : 'Failed to load paper');
      } finally {
        setLoading(false);
      }
    };

    fetchPaper();
  }, [documentId]);

  const handleBack = () => {
    const workspaceSlug = window.location.pathname.split('/')[1];
    router.push(`/${workspaceSlug}/stacks/vision`);
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">Loading paper...</p>
        </div>
      </div>
    );
  }

  if (error || !paperData) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-muted hover:text-foreground mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Vision
          </button>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {error || 'Paper Not Found'}
          </h2>
          <p className="text-muted">
            {error || 'The paper document could not be loaded.'}
          </p>
        </div>
      </div>
    );
  }

  // Render paper content
  // The content could be in JSON format or markdown
  const renderContent = () => {
    if (typeof paperData.content === 'string') {
      return (
        <div className="prose prose-lg max-w-none">
          <div dangerouslySetInnerHTML={{ __html: paperData.content }} />
        </div>
      );
    } else if (paperData.content && typeof paperData.content === 'object') {
      // If content is JSON, render it appropriately
      if (paperData.content.html) {
        return (
          <div className="prose prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ __html: paperData.content.html }} />
          </div>
        );
      } else if (paperData.content.markdown) {
        // You might want to use a markdown renderer here
        return (
          <div className="prose prose-lg max-w-none">
            <pre className="whitespace-pre-wrap">{paperData.content.markdown}</pre>
          </div>
        );
      } else {
        return (
          <div className="prose prose-lg max-w-none">
            <pre>{JSON.stringify(paperData.content, null, 2)}</pre>
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
  };

  return (
    <div className="h-full w-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border p-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Vision
          </button>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {paperData.title}
        </h1>
        {paperData.description && (
          <p className="text-muted text-lg">
            {paperData.description}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto invisible-scrollbar p-6">
        <div className="max-w-4xl mx-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

