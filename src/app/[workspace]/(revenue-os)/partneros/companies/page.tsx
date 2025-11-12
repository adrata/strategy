import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "Companies • PartnerOS",
  description: "PartnerOS companies management",
};

export default function PartnerOSCompaniesPage() {
  return <PipelineContent section="companies" />;
}

