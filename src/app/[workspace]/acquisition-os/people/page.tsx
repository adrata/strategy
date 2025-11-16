import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "People • Acquisition OS",
  description: "People management for acquisition",
};

export default function AcquisitionOSPeoplePage() {
  return <PipelineContent section="people" osType="acquisition" />;
}

