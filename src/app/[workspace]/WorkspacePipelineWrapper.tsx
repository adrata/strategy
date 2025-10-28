"use client";

import React from "react";
import { PipelineProvider } from "@/products/pipeline/context/PipelineContext";
// CRITICAL FIX: Remove SpeedrunDataProvider to eliminate duplicate data loading
// import { SpeedrunDataProvider } from "@/platform/services/speedrun-data-context";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { RevenueOSProvider } from "@/platform/ui/context/RevenueOSProvider";
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
    <RevenueOSProvider>
      <ZoomProvider>
        <PipelineProvider>
          <ProfilePopupProvider>
            {children}
          </ProfilePopupProvider>
        </PipelineProvider>
      </ZoomProvider>
    </RevenueOSProvider>
  );
}
