"use client";

import { PipelineView } from "@/frontend/components/pipeline/PipelineView";
import { WorkspacePipelineWrapper } from "../WorkspacePipelineWrapper";

export default function WorkspaceSpeedrunPage() {
  // Use PipelineView with unified API approach (simpler and working)
  return (
    <WorkspacePipelineWrapper>
      <PipelineView section="speedrun" />
    </WorkspacePipelineWrapper>
  );
}