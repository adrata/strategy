import { Metadata } from "next";
import { PipelineView } from "@/frontend/components/pipeline/PipelineView";
import { WorkspacePipelineWrapper } from "../WorkspacePipelineWrapper";

export const metadata: Metadata = {
  title: "Prospects | Pipeline",
  description: "Pipeline prospects management",
};

export default function ProspectsPage() {
  return (
    <div className="h-full">
      <WorkspacePipelineWrapper>
        <PipelineView section="prospects" />
      </WorkspacePipelineWrapper>
    </div>
  );
}