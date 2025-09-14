"use client";

import { useParams } from "next/navigation";
import { PipelineDetailPage } from "@/frontend/components/pipeline/PipelineDetailPage";
import { AcquisitionOSProvider } from "@/platform/ui/context/AcquisitionOSProvider";
import { PipelineProvider } from "@/products/pipeline/context/PipelineContext";
import { SpeedrunDataProvider } from "@/platform/services/speedrun-data-context";
import { RecordContextProvider } from "@/platform/ui/context/RecordContextProvider";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";

export default function PersonDetailPage() {
  const params = useParams();
  const slug = params['id'] as string;

  return (
    <ZoomProvider>
      <AcquisitionOSProvider>
        <PipelineProvider>
          <SpeedrunDataProvider>
            <RecordContextProvider>
              <ProfilePopupProvider>
                <PipelineDetailPage
                  section="people"
                  slug={slug}
                />
              </ProfilePopupProvider>
            </RecordContextProvider>
          </SpeedrunDataProvider>
        </PipelineProvider>
      </AcquisitionOSProvider>
    </ZoomProvider>
  );
}
