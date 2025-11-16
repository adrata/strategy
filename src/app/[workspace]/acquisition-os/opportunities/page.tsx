import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "Opportunities • Acquisition OS",
  description: "Opportunities management for acquisition",
};

export default function AcquisitionOSOpportunitiesPage() {
  return <PipelineContent section="opportunities" osType="acquisition" />;
}

