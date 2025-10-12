import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "Clients • Pipeline",
  description: "Clients management",
};

export default function WorkspaceClientsPage() {
  // Use the simplified PipelineContent component (LeftPanel is now in layout)
  return <PipelineContent section="clients" />;
}
