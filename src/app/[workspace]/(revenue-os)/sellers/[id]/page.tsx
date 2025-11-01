"use client";

import { useParams } from "next/navigation";
import { PipelineDetailPage } from "@/frontend/components/pipeline/PipelineDetailPage";
import { RevenueOSProvider } from "@/platform/ui/context/RevenueOSProvider";
import { PipelineProvider } from "@/products/pipeline/context/PipelineContext";
import { SpeedrunDataProvider } from "@/platform/services/speedrun-data-context";
import { RecordContextProvider } from "@/platform/ui/context/RecordContextProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";

export default function SellerDetailPage() {
  const params = useParams();
  const slug = params['id'] as string;
  
  // 🔍 DEBUG: Log what we're actually getting
  console.log('🔍 [SELLERS PAGE] Params:', params);
  console.log('🔍 [SELLERS PAGE] Slug:', slug);
  console.log('🔍 [SELLERS PAGE] Slug length:', slug?.length);
  console.log('🔍 [SELLERS PAGE] Slug type:', typeof slug);

  return (
    <RevenueOSProvider>
      <PipelineProvider>
        <SpeedrunDataProvider>
          <RecordContextProvider>
            <ProfilePopupProvider>
              <PipelineDetailPage
                section="sellers"
                slug={slug}
              />
            </ProfilePopupProvider>
          </RecordContextProvider>
        </SpeedrunDataProvider>
      </PipelineProvider>
    </RevenueOSProvider>
  );
}
