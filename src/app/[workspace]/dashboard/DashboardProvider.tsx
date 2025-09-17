"use client";

import React from "react";
import { AcquisitionOSProvider } from "@/platform/ui/context/AcquisitionOSProvider";
import { PipelineProvider } from "@/products/pipeline/context/PipelineContext";
import { SpeedrunDataProvider } from "@/platform/services/speedrun-data-context";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";

interface DashboardProviderProps {
  children: React.ReactNode;
}

/**
 * 🚀 PERFORMANCE: Shared Dashboard Provider
 * 
 * This provider ensures that all dashboard pages share the same provider instances,
 * preventing multiple AcquisitionOSProvider instances from running simultaneously
 * and causing duplicate API calls.
 */
export function DashboardProvider({ children }: DashboardProviderProps) {
  return (
    <AcquisitionOSProvider>
      <ZoomProvider>
        <PipelineProvider>
          <SpeedrunDataProvider>
            <ProfilePopupProvider>
              {children}
            </ProfilePopupProvider>
          </SpeedrunDataProvider>
        </PipelineProvider>
      </ZoomProvider>
    </AcquisitionOSProvider>
  );
}
