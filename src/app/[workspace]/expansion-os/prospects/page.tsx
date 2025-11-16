import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "Prospects • Expansion OS",
  description: "Prospects management for expansion",
};

export default function ExpansionOSProspectsPage() {
  return <PipelineContent section="prospects" osType="expansion" />;
}

