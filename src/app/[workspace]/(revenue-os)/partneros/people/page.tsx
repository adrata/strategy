import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "People • PartnerOS",
  description: "PartnerOS people management",
};

export default function PartnerOSPeoplePage() {
  return <PipelineContent section="people" />;
}

