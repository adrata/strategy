import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "Opportunities • PartnerOS",
  description: "PartnerOS opportunities management",
};

export default function PartnerOSOpportunitiesPage() {
  return <PipelineContent section="opportunities" />;
}

