import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "People • Retention OS",
  description: "People management for retention",
};

export default function RetentionOSPeoplePage() {
  return <PipelineContent section="people" osType="retention" />;
}

