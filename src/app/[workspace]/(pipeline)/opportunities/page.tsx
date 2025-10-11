import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "Opportunities",
  description: "Opportunities management",
};

export default function WorkspaceOpportunitiesPage() {
  // Use the original PipelineView component with proper providers
  return <PipelineContent section="opportunities" />;
}
