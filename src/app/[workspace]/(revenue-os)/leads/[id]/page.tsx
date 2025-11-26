"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { PipelineDetailPage } from "@/frontend/components/pipeline/PipelineDetailPage";

/**
 * Lead Detail Page
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
export default function LeadDetailPage() {
  const params = useParams();
  // 🔧 INFINITE LOOP FIX: Memoize slug to prevent unnecessary re-renders
  // This prevents the component from remounting when params object reference changes
  const slug = useMemo(() => params['id'] as string, [params['id']]);

  return (
              <PipelineDetailPage
                section="leads"
                slug={slug}
              />
  );
}
