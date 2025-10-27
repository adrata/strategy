import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "Chronicle • Pipeline",
  description: "Weekly reports and chronicles",
};



export default function WorkspaceChroniclePage() {
  return <PipelineContent section="chronicle" />;
}
