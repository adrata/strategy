import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "Speedrun • PartnerOS",
  description: "PartnerOS speedrun management",
};

export default function PartnerOSSpeedrunPage() {
  return (
    <div className="h-full">
      <PipelineContent section="speedrun" />
    </div>
  );
}

