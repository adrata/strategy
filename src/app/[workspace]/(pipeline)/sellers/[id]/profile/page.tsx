"use client";

import { useParams } from "next/navigation";
import { PipelineDetailPage } from "@/frontend/components/pipeline/PipelineDetailPage";
import { RevenueOSProvider } from "@/platform/ui/context/RevenueOSProvider";
import { PipelineProvider } from "@/products/pipeline/context/PipelineContext";
import { SpeedrunDataProvider } from "@/platform/services/speedrun-data-context";
import { RecordContextProvider } from "@/platform/ui/context/RecordContextProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";

export default function SellerProfilePage() {
  const params = useParams();
  const sellerId = params['id'] as string;
  
  console.log('👤 [SELLER PROFILE] Seller ID:', sellerId);

  return (
    <RevenueOSProvider>
      <PipelineProvider>
        <SpeedrunDataProvider>
          <RecordContextProvider>
            <ProfilePopupProvider>
              <PipelineDetailPage
                section="sellers"
                slug={sellerId}
              />
            </ProfilePopupProvider>
          </RecordContextProvider>
        </SpeedrunDataProvider>
      </PipelineProvider>
    </RevenueOSProvider>
  );
}
