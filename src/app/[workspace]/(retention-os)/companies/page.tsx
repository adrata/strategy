import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "Companies • Retention OS",
  description: "Companies management for retention",
};

export default function RetentionOSCompaniesPage() {
  return <PipelineContent section="companies" osType="retention" />;
}

