"use client";

import { useParams } from "next/navigation";
import { PipelineDetailPage } from "@/frontend/components/pipeline/PipelineDetailPage";
import { RevenueOSProvider } from "@/platform/ui/context/RevenueOSProvider";
import { PipelineProvider } from "@/products/pipeline/context/PipelineContext";
import { SpeedrunDataProvider } from "@/platform/services/speedrun-data-context";
import { RecordContextProvider } from "@/platform/ui/context/RecordContextProvider";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";

export default function PartnerDetailPage() {
  const params = useParams();
  const slug = params['id'] as string;

  return (
    <ZoomProvider>
      <RevenueOSProvider>
        <PipelineProvider>
          <SpeedrunDataProvider>
            <RecordContextProvider>
              <ProfilePopupProvider>
                <PipelineDetailPage
                  section="partners"
                  slug={slug}
                />
              </ProfilePopupProvider>
            </RecordContextProvider>
          </SpeedrunDataProvider>
        </PipelineProvider>
      </RevenueOSProvider>
    </ZoomProvider>
  );
}
