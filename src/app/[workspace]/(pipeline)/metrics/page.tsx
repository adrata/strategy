import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "Metrics",
  description: "Sales performance metrics and KPIs",
};

export default function WorkspaceMetricsPage() {
  return <PipelineContent section="metrics" />;
}