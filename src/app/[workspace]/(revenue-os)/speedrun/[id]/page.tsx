"use client";

import { useParams } from "next/navigation";
import { PipelineDetailPage } from "@/frontend/components/pipeline/PipelineDetailPage";

/**
 * Speedrun Detail Page
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
export default function SpeedrunDetailPage() {
  const params = useParams();
  const slug = params['id'] as string;

  return (
    <PipelineDetailPage
      section="speedrun"
      slug={slug}
    />
  );
}
