import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "Partners • Pipeline",
  description: "Partners management",
};

export default function WorkspacePartnersPage() {
  return <PipelineContent section="partners" />;
}
