"use client";

import { PipelineView } from "@/frontend/components/pipeline/PipelineView";
import { WorkspacePipelineWrapper } from "../WorkspacePipelineWrapper";

export default function WorkspaceCustomersPage() {
  // Use the EXACT same approach as working Speedrun
  return (
    <WorkspacePipelineWrapper>
      <PipelineView section="customers" />
    </WorkspacePipelineWrapper>
  );
}