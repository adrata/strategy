import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "Leads",
  description: "Leads management",
};

export default function WorkspaceLeadsPage() {
  // Use the simplified PipelineContent component (LeftPanel is now in layout)
  return <PipelineContent section="leads" />;
}
