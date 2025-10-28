import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";
import { ChronicleGuard } from "@/platform/ui/components/FeatureGuard";

export const metadata: Metadata = {
  title: "Chronicle • Pipeline",
  description: "Weekly reports and chronicles",
};

export default function WorkspaceChroniclePage() {
  return (
    <ChronicleGuard>
      <PipelineContent section="chronicle" />
    </ChronicleGuard>
  );
}
