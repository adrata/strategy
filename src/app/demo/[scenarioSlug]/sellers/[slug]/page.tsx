"use client";

import { useParams } from "next/navigation";
import { PipelineDetailPage } from "@/frontend/components/pipeline/PipelineDetailPage";
import { PipelineProvider } from "@/products/pipeline/context/PipelineContext";
import { SpeedrunDataProvider } from "@/platform/services/speedrun-data-context";
import { RecordContextProvider } from "@/platform/ui/context/RecordContextProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";

export default function SellerDetailPage() {
  const params = useParams();
  const slug = params['slug'] as string;
  
  // 🔍 DEBUG: Log what we're actually getting
  console.log('🔍 [DEMO SELLERS PAGE] Params:', params);
  console.log('🔍 [DEMO SELLERS PAGE] Slug:', slug);
  console.log('🔍 [DEMO SELLERS PAGE] Slug length:', slug?.length);
  console.log('🔍 [DEMO SELLERS PAGE] Slug type:', typeof slug);

  return (
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
  );
}