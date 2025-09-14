"use client";

import { PipelineView } from "@/frontend/components/pipeline/PipelineView";
import { WorkspacePipelineWrapper } from "../WorkspacePipelineWrapper";

export default function WorkspaceDashboardPage() {
  return (
    <WorkspacePipelineWrapper>
      <PipelineView section="dashboard" />
    </WorkspacePipelineWrapper>
  );
}
