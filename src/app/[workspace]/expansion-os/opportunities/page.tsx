import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "Opportunities • Expansion OS",
  description: "Opportunities management for expansion",
};

export default function ExpansionOSOpportunitiesPage() {
  return <PipelineContent section="opportunities" osType="expansion" />;
}

