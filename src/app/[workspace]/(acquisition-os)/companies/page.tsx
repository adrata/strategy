import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "Companies • Acquisition OS",
  description: "Companies management for acquisition",
};

export default function AcquisitionOSCompaniesPage() {
  return <PipelineContent section="companies" osType="acquisition" />;
}

