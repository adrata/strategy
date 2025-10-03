import { Metadata } from "next";
import { PipelineView } from "@/frontend/components/pipeline/PipelineView";
import { WorkspacePipelineWrapper } from "../WorkspacePipelineWrapper";
import { ErrorBoundary } from "@/frontend/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Leads",
  description: "Leads management",
};

export default function WorkspaceLeadsPage() {
  console.log(`🧪🧪🧪 [LEADS PAGE] Page executing for LEADS section`);
  
  // Use PipelineView with error boundary
  return (
    <WorkspacePipelineWrapper>
      <ErrorBoundary>
        <PipelineView section="leads" />
      </ErrorBoundary>
    </WorkspacePipelineWrapper>
  );
}
