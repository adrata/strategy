"use client";

import { PipelineView } from "@/frontend/components/pipeline/PipelineView";
import { WorkspacePipelineWrapper } from "../WorkspacePipelineWrapper";

export default function WorkspaceCompaniesPage() {
  // Use the original PipelineView component with proper providers
  // Removed CompaniesErrorBoundary to prevent cache error page flashing
  return (
    <WorkspacePipelineWrapper>
      <PipelineView section="companies" />
    </WorkspacePipelineWrapper>
  );
}
