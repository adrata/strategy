"use client";

import { useParams } from "next/navigation";
import { PipelineDetailPage } from "@/frontend/components/pipeline/PipelineDetailPage";
import { RevenueOSProvider } from "@/platform/ui/context/RevenueOSProvider";
import { PipelineProvider } from "@/products/pipeline/context/PipelineContext";
import { SpeedrunDataProvider } from "@/platform/services/speedrun-data-context";
import { RecordContextProvider } from "@/platform/ui/context/RecordContextProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";

export default function PersonRecordPage() {
  const params = useParams();
  const sellerId = params['id'] as string;
  const companyId = params['companyId'] as string;
  const personId = params['personId'] as string;
  
  console.log('👤 [PERSON RECORD] Seller ID:', sellerId, 'Company ID:', companyId, 'Person ID:', personId);

  return (
    <RevenueOSProvider>
      <PipelineProvider>
        <SpeedrunDataProvider>
          <RecordContextProvider>
            <ProfilePopupProvider>
              <PipelineDetailPage
                section="people"
                slug={personId}
              />
            </ProfilePopupProvider>
          </RecordContextProvider>
        </SpeedrunDataProvider>
      </PipelineProvider>
    </RevenueOSProvider>
  );
}
