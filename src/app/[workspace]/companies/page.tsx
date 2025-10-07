"use client";

import { PipelineView } from "@/frontend/components/pipeline/PipelineView";
import { WorkspacePipelineWrapper } from "../WorkspacePipelineWrapper";
import { CompaniesErrorBoundary } from "@/frontend/components/pipeline/CompaniesErrorBoundary";

export default function WorkspaceCompaniesPage() {
  // Use the original PipelineView component with proper providers and error boundary
  return (
    <WorkspacePipelineWrapper>
      <CompaniesErrorBoundary
        onError={(error, errorInfo) => {
          console.error('🚨 [COMPANIES PAGE] Error caught by boundary:', error, errorInfo);
        }}
        onRetry={() => {
          console.log('🔄 [COMPANIES PAGE] Retrying after error...');
        }}
        maxRetries={3}
      >
        <PipelineView section="companies" />
      </CompaniesErrorBoundary>
    </WorkspacePipelineWrapper>
  );
}
