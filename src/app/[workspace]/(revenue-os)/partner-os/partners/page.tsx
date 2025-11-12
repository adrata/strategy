import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "Partners • PartnerOS",
  description: "PartnerOS partners management",
};

export default function PartnerOSPartnersPage() {
  return <PipelineContent section="partners" />;
}

