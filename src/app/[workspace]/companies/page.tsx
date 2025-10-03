import { Metadata } from "next";
import { PipelineView } from "@/frontend/components/pipeline/PipelineView";
import { WorkspacePipelineWrapper } from "../WorkspacePipelineWrapper";

export const metadata: Metadata = {
  title: "Companies",
  description: "Companies management",
};

export default function WorkspaceCompaniesPage() {
  // Use the original PipelineView component with proper providers
  return (
    <WorkspacePipelineWrapper>
      <PipelineView section="companies" />
    </WorkspacePipelineWrapper>
  );
}
