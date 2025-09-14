"use client";

import React from "react";
import { PipelineProvider } from "@/products/pipeline/context/PipelineContext";
import { SpeedrunDataProvider } from "@/platform/services/speedrun-data-context";
import { PipelineStandaloneCleanContent } from "./PipelineStandaloneCleanContent";

export function PipelineApp() {
  return (
    <PipelineProvider>
      <SpeedrunDataProvider>
        <PipelineStandaloneCleanContent />
      </SpeedrunDataProvider>
    </PipelineProvider>
  );
}