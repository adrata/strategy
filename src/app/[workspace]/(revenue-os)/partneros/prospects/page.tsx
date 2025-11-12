import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "Prospects • PartnerOS",
  description: "PartnerOS prospects management",
};

export default function PartnerOSProspectsPage() {
  return <PipelineContent section="prospects" />;
}

