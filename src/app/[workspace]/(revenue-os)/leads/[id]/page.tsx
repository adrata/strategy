"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { PipelineDetailPage } from "@/frontend/components/pipeline/PipelineDetailPage";

/**
 * Lead Detail Page
 * 
 * IMPORTANT: This page inherits all providers from layout.tsx:
 * - RevenueOSProvider
 * - RecordContextProvider (critical for AI right panel context)
 * - PipelineProvider
 * - SpeedrunDataProvider
 * - ProfilePopupProvider
 * 
 * DO NOT add redundant providers here - they create context isolation issues
 * where PipelineDetailPage sets context in the wrong provider tree.
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
