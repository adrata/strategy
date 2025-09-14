"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { PipelineView } from "@/frontend/components/pipeline/PipelineView";
import { AcquisitionOSProvider } from "@/platform/ui/context/AcquisitionOSProvider";
import { PipelineProvider } from "@/products/pipeline/context/PipelineContext";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";

export default function DemoPipelineDashboardPage() {
  const params = useParams();
  const scenarioSlug = params['scenarioSlug'] as string;
  
  // State for visibility toggles
  const [isSpeedrunVisible, setIsSpeedrunVisible] = useState(true);
  const [isOpportunitiesVisible, setIsOpportunitiesVisible] = useState(true);
  const [isSellersVisible, setIsSellersVisible] = useState(true);

  return (
    <AcquisitionOSProvider>
      <ZoomProvider>
        <PipelineProvider>
          <ProfilePopupProvider>
            <PipelineView section="dashboard" />
          </ProfilePopupProvider>
        </PipelineProvider>
      </ZoomProvider>
    </AcquisitionOSProvider>
  );
}
