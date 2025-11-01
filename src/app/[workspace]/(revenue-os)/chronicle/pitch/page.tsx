"use client";

import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { sampleChronicleReports } from '@/lib/chronicle-sample-data';
import { PresentationView } from '@/frontend/components/pipeline/PresentationView';
import { PitchRegularView } from '@/frontend/components/pipeline/PitchRegularView';



export default function PitchPage() {
  const { user } = useUnifiedAuth();
  const { data: acquisitionData } = useRevenueOS();
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [pitchData, setPitchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const workspaceId = acquisitionData?.auth?.authUser?.activeWorkspaceId || user?.activeWorkspaceId;

  useEffect(() => {
    // Find the pitch report from sample data
    const pitchReport = sampleChronicleReports.find(report => report.reportType === 'PITCH');
    
    if (pitchReport) {
      setPitchData(pitchReport);
    }
    
    setLoading(false);
  }, []);

  const handlePresent = () => {
    setIsPresentationMode(true);
  };

  const handleClosePresentation = () => {
    setIsPresentationMode(false);
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-[var(--muted)]">Loading pitch...</p>
        </div>
      </div>
    );
  }

  if (!pitchData) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            Pitch Not Found
          </h2>
          <p className="text-[var(--muted)]">
            The pitch document could not be loaded.
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
        />
      )}
    </div>
  );
}
