"use client";

import { useParams } from "next/navigation";
import { PipelineDetailPage } from "@/frontend/components/pipeline/PipelineDetailPage";
import { AcquisitionOSProvider } from "@/platform/ui/context/AcquisitionOSProvider";
import { PipelineProvider } from "@/products/pipeline/context/PipelineContext";
import { SpeedrunDataProvider } from "@/platform/services/speedrun-data-context";
import { RecordContextProvider } from "@/platform/ui/context/RecordContextProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";
import { CompaniesErrorBoundary } from "@/frontend/components/pipeline/CompaniesErrorBoundary";

export default function CompanyDetailPage() {
  const params = useParams();
  const slug = params['id'] as string;
  
  // 🔍 DEBUG: Log what we're actually getting
  console.log('🔍 [COMPANIES PAGE] Params:', params);
  console.log('🔍 [COMPANIES PAGE] Slug:', slug);
  console.log('🔍 [COMPANIES PAGE] Slug length:', slug?.length);
  console.log('🔍 [COMPANIES PAGE] Slug type:', typeof slug);

  return (
    <AcquisitionOSProvider>
      <PipelineProvider>
        <SpeedrunDataProvider>
          <RecordContextProvider>
            <ProfilePopupProvider>
              <CompaniesErrorBoundary
                onError={(error, errorInfo) => {
                  console.error('🚨 [COMPANY DETAIL] Error caught by boundary:', error, errorInfo);
                }}
                onRetry={() => {
                  console.log('🔄 [COMPANY DETAIL] Retrying after error...');
                }}
                maxRetries={3}
              >
                <PipelineDetailPage
                  section="companies"
                  slug={slug}
                />
              </CompaniesErrorBoundary>
            </ProfilePopupProvider>
          </RecordContextProvider>
        </SpeedrunDataProvider>
      </PipelineProvider>
    </AcquisitionOSProvider>
  );
}