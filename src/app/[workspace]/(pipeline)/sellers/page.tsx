import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "Sellers • Pipeline",
  description: "Sellers management",
};

export default function WorkspaceSellersPage() {
  // Use the simplified PipelineContent component (LeftPanel is now in layout)
  return <PipelineContent section="sellers" />;
}
