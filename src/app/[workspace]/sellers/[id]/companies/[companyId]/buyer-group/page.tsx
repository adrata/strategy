"use client";

import { useParams } from "next/navigation";
import { PipelineView } from "@/frontend/components/pipeline/PipelineView";
import { AcquisitionOSProvider } from "@/platform/ui/context/AcquisitionOSProvider";
import { PipelineProvider } from "@/products/pipeline/context/PipelineContext";
import { SpeedrunDataProvider } from "@/platform/services/speedrun-data-context";
import { RecordContextProvider } from "@/platform/ui/context/RecordContextProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";

export default function BuyerGroupPage() {
  const params = useParams();
  const sellerId = params['id'] as string;
  const companyId = params['companyId'] as string;
  
  console.log('👥 [BUYER GROUP] Seller ID:', sellerId, 'Company ID:', companyId);

  return (
    <AcquisitionOSProvider>
      <PipelineProvider>
        <SpeedrunDataProvider>
          <RecordContextProvider>
            <ProfilePopupProvider>
              <PipelineView
                section="people"
                sellerId={sellerId}
                companyId={companyId}
                title="Buyer Group"
                subtitle={`Stakeholders at ${companyId}`}
              />
            </ProfilePopupProvider>
          </RecordContextProvider>
        </SpeedrunDataProvider>
      </PipelineProvider>
    </AcquisitionOSProvider>
  );
}
