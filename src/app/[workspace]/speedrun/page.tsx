import { Metadata } from "next";
import { PipelineView } from "@/frontend/components/pipeline/PipelineView";
import { WorkspacePipelineWrapper } from "../WorkspacePipelineWrapper";

export const metadata: Metadata = {
  title: "Speedrun",
  description: "Pipeline speedrun management",
};

export default function WorkspaceSpeedrunPage() {
  return (
    <div className="h-full">
      <WorkspacePipelineWrapper>
        <PipelineView section="speedrun" />
      </WorkspacePipelineWrapper>
    </div>
  );
}
