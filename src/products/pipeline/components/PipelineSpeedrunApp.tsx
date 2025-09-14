"use client";

import React from "react";
import { PipelineProvider } from "@/products/pipeline/context/PipelineContext";
import { SpeedrunDataProvider } from "@/platform/services/speedrun-data-context";
import { MonacoProvider } from "@/products/monaco/context/MonacoContext";
import { PipelineStandaloneCleanContent } from "./PipelineStandaloneCleanContent";

/**
 * Pipeline Speedrun App - Monaco Layout for Pipeline Speedrun Sprint
 * Identical to Monaco speedrun sprint mode but uses Pipeline data context
 */
export function PipelineSpeedrunApp() {
  console.log("🚀 PipelineSpeedrunApp: Rendering Pipeline Speedrun mode with Monaco layout");
  
  return (
    <PipelineProvider>
      <SpeedrunDataProvider>
        <MonacoProvider>
          <PipelineStandaloneCleanContent />
        </MonacoProvider>
      </SpeedrunDataProvider>
    </PipelineProvider>
  );
}
