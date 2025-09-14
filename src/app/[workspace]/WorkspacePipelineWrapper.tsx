"use client";

import React from "react";
import { PipelineProvider } from "@/products/pipeline/context/PipelineContext";
// CRITICAL FIX: Remove SpeedrunDataProvider to eliminate duplicate data loading
// import { SpeedrunDataProvider } from "@/platform/services/speedrun-data-context";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { AcquisitionOSProvider } from "@/platform/ui/context/AcquisitionOSProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";

interface WorkspacePipelineWrapperProps {
  children: React.ReactNode;
}

/**
 * Workspace Pipeline Wrapper
 * Provides all necessary context providers for workspace-specific pipeline pages
 * Ensures consistent provider hierarchy across all pipeline routes
 */
export function WorkspacePipelineWrapper({ children }: WorkspacePipelineWrapperProps) {
  return (
    <AcquisitionOSProvider>
      <ZoomProvider>
        <PipelineProvider>
          <ProfilePopupProvider>
            {children}
          </ProfilePopupProvider>
        </PipelineProvider>
      </ZoomProvider>
    </AcquisitionOSProvider>
  );
}
