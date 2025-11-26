"use client";

import { useParams } from "next/navigation";
import { PipelineDetailPage } from "@/frontend/components/pipeline/PipelineDetailPage";

/**
 * Person Detail Page
 * 
 * IMPORTANT: This page does NOT have its own providers.
 * It inherits from the layout's providers to ensure context is shared properly.
 * 
 * The layout at (revenue-os)/layout.tsx provides:
 * - RevenueOSProvider
 * - RecordContextProvider (critical for AI panel to receive record data)
 * - PipelineProvider
 * - SpeedrunDataProvider
 * - ProfilePopupProvider
 */
export default function PersonDetailPage() {
  const params = useParams();
  const slug = params['id'] as string;

  return (
    <PipelineDetailPage
      section="people"
      slug={slug}
    />
  );
}
