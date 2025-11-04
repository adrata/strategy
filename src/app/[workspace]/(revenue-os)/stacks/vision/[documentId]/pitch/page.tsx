"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PresentationView } from '@/frontend/components/pipeline/PresentationView';
import { PitchRegularView } from '@/frontend/components/pipeline/PitchRegularView';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function VisionPitchPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params?.documentId as string;
  
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [pitchData, setPitchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPitch = async () => {
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
          throw new Error('Failed to fetch pitch document');
        }

        const data = await response.json();
        if (data.document?.documentType !== 'pitch') {
          throw new Error('Document is not a pitch');
        }

        // Transform the document content to match pitch format
        // The content should be in the format expected by PitchRegularView
        setPitchData({
          content: data.document.content || { slides: {} },
          title: data.document.title
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching pitch:', err);
        setError(err instanceof Error ? err.message : 'Failed to load pitch');
      } finally {
        setLoading(false);
      }
    };

    fetchPitch();
  }, [documentId]);

  const handlePresent = () => {
    setIsPresentationMode(true);
  };

  const handleClosePresentation = () => {
    setIsPresentationMode(false);
  };

  const handleBack = () => {
    const workspaceSlug = window.location.pathname.split('/')[1];
    router.push(`/${workspaceSlug}/stacks/vision`);
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">Loading pitch...</p>
        </div>
      </div>
    );
  }

  if (error || !pitchData) {
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
            {error || 'Pitch Not Found'}
          </h2>
          <p className="text-muted">
            {error || 'The pitch document could not be loaded.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      {isPresentationMode ? (
        <PresentationView 
          slideData={pitchData.content} 
          onClose={handleClosePresentation}
        />
      ) : (
        <PitchRegularView 
          slideData={pitchData.content} 
          onPresent={handlePresent}
          onBack={handleBack}
          hideHeader={false}
        />
      )}
    </div>
  );
}

