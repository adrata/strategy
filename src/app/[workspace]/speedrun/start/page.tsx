"use client";

import { SpeedrunSprintView } from "@/frontend/components/pipeline/SpeedrunSprintView";
import { WorkspacePipelineWrapper } from "@/app/[workspace]/WorkspacePipelineWrapper";

export default function SpeedrunStartPage() {
  return (
    <WorkspacePipelineWrapper>
      <div className="h-full">
        <SpeedrunSprintView />
      </div>
    </WorkspacePipelineWrapper>
  );
}
