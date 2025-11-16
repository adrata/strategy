import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "People • Expansion OS",
  description: "People management for expansion",
};

export default function ExpansionOSPeoplePage() {
  return <PipelineContent section="people" osType="expansion" />;
}

