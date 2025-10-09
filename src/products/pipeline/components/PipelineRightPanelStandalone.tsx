"use client";

import React from "react";
import { RightPanel } from "@/platform/ui/components/chat/RightPanel";

interface PipelineRightPanelStandaloneProps {
  activeSection: string;
}

export function PipelineRightPanelStandalone({
  activeSection
}: PipelineRightPanelStandaloneProps) {
  // Reuse the existing RightPanel 
  // which already works well for Pipeline
  
  return (
    <RightPanel />
  );
}