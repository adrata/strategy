"use client";
import React from 'react';
import { PipelineView } from "@/frontend/components/pipeline/PipelineView";
import { AcquisitionOSProvider } from "@/platform/ui/context/AcquisitionOSProvider";
import { PipelineProvider } from "@/products/pipeline/context/PipelineContext";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";

export default function DemoPipelineOpportunitiesPage() {
  return (
    <AcquisitionOSProvider>
      <ZoomProvider>
        <PipelineProvider>
          <ProfilePopupProvider>
            <PipelineView section="opportunities" />
          </ProfilePopupProvider>
        </PipelineProvider>
      </ZoomProvider>
    </AcquisitionOSProvider>
  );
}
