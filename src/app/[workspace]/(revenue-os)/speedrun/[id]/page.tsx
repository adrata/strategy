"use client";

import { useParams } from "next/navigation";
import { PipelineDetailPage } from "@/frontend/components/pipeline/PipelineDetailPage";
import { RevenueOSProvider } from "@/platform/ui/context/RevenueOSProvider";
import { PipelineProvider } from "@/products/pipeline/context/PipelineContext";
import { SpeedrunDataProvider } from "@/platform/services/speedrun-data-context";
// import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";
import { RecordContextProvider } from "@/platform/ui/context/RecordContextProvider";

export default function SpeedrunDetailPage() {
  const params = useParams();
  const slug = params['id'] as string;

  return (
    <RevenueOSProvider>
      <RecordContextProvider>
        <PipelineProvider>
          <SpeedrunDataProvider>
            <ProfilePopupProvider>
              <PipelineDetailPage
                section="speedrun"
                slug={slug}
              />
            </ProfilePopupProvider>
          </SpeedrunDataProvider>
        </PipelineProvider>
      </RecordContextProvider>
    </RevenueOSProvider>
  );
}
