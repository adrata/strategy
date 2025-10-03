"use client";

import { PipelineView } from "@/frontend/components/pipeline/PipelineView";
import { WorkspacePipelineWrapper } from "../WorkspacePipelineWrapper";
import { ErrorBoundary } from "@/frontend/components/ErrorBoundary";

export default function WorkspaceSellersPage() {
  console.log(`🧪🧪🧪 [SELLERS PAGE] Page executing for SELLERS section`);
  
  // Use PipelineView with error boundary
  return (
    <WorkspacePipelineWrapper>
      <ErrorBoundary>
        <PipelineView section="sellers" />
      </ErrorBoundary>
    </WorkspacePipelineWrapper>
  );
}
