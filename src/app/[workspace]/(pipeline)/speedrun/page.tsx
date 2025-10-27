import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "Speedrun • Pipeline",
  description: "Pipeline speedrun management",
};


export default function WorkspaceSpeedrunPage() {
  return (
    <div className="h-full">
      <PipelineContent section="speedrun" />
    </div>
  );
}
