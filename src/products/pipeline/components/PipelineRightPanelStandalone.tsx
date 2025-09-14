"use client";

import React from "react";
import { AIRightPanel } from "@/platform/ui/components/chat/AIRightPanel";

interface PipelineRightPanelStandaloneProps {
  activeSection: string;
}

export function PipelineRightPanelStandalone({
  activeSection
}: PipelineRightPanelStandaloneProps) {
  // Reuse the existing AIRightPanel 
  // which already works well for Pipeline
  
  return (
    <AIRightPanel />
  );
}