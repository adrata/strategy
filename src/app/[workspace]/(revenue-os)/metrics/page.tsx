import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";
import { MetricsGuard } from "@/platform/ui/components/FeatureGuard";

export const metadata: Metadata = {
  title: "Metrics • Pipeline",
  description: "Sales performance metrics and KPIs",
};

export default function WorkspaceMetricsPage() {
  return (
    <MetricsGuard>
      <PipelineContent section="metrics" />
    </MetricsGuard>
  );
}