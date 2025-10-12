import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "Prospects • Pipeline",
  description: "Pipeline prospects management",
};

export default function ProspectsPage() {
  // Use the simplified PipelineContent component (LeftPanel is now in layout)
  return <PipelineContent section="prospects" />;
}