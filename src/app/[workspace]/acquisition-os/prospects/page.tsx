import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "Prospects • Acquisition OS",
  description: "Prospects management for acquisition",
};

export default function AcquisitionOSProspectsPage() {
  return <PipelineContent section="prospects" osType="acquisition" />;
}

