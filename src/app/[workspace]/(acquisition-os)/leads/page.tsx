import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "Leads • Acquisition OS",
  description: "Leads management for acquisition",
};

export default function AcquisitionOSLeadsPage() {
  return <PipelineContent section="leads" osType="acquisition" />;
}

