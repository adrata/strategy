import { Metadata } from "next";
import { PipelineView } from "@/frontend/components/pipeline/PipelineView";
import { WorkspacePipelineWrapper } from "../WorkspacePipelineWrapper";

export const metadata: Metadata = {
  title: "Opportunities",
  description: "Opportunities management",
};

export default function WorkspaceOpportunitiesPage() {
  // Use the original PipelineView component with proper providers
  return (
    <WorkspacePipelineWrapper>
      <PipelineView section="opportunities" />
    </WorkspacePipelineWrapper>
  );
}
