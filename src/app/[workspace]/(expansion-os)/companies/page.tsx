import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "Companies • Expansion OS",
  description: "Companies management for expansion",
};

export default function ExpansionOSCompaniesPage() {
  return <PipelineContent section="companies" osType="expansion" />;
}

