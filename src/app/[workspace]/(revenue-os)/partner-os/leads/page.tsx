import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "Leads • PartnerOS",
  description: "PartnerOS leads management",
};

export default function PartnerOSLeadsPage() {
  return <PipelineContent section="leads" />;
}

