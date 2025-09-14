"use client";

import { PipelineView } from "@/frontend/components/pipeline/PipelineView";
import { WorkspacePipelineWrapper } from "../WorkspacePipelineWrapper";

export default function WorkspaceMetricsPage() {
  return (
    <WorkspacePipelineWrapper>
      <PipelineView section="metrics" />
    </WorkspacePipelineWrapper>
  );
}
