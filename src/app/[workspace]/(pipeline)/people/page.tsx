import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "People",
  description: "People management",
};

export default function WorkspacePeoplePage() {
  // Use the original PipelineView component with proper providers
  return <PipelineContent section="people" />;
}
