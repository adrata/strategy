"use client";

import { PipelineView } from "@/frontend/components/pipeline/PipelineView";
import { WorkspacePipelineWrapper } from "../WorkspacePipelineWrapper";

export default function WorkspacePeoplePage() {
  // Use the original PipelineView component with proper providers
  return (
    <WorkspacePipelineWrapper>
      <PipelineView section="people" />
    </WorkspacePipelineWrapper>
  );
}
