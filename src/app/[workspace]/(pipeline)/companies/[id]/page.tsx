"use client";

import { useParams } from "next/navigation";
import { PipelineDetailPage } from "@/frontend/components/pipeline/PipelineDetailPage";

export default function CompanyDetailPage() {
  const params = useParams();
  const slug = params['id'] as string;
  
  // 🔍 DEBUG: Log what we're actually getting
  console.log('🔍 [COMPANIES PAGE] Params:', params);
  console.log('🔍 [COMPANIES PAGE] Slug:', slug);
  console.log('🔍 [COMPANIES PAGE] Slug length:', slug?.length);
  console.log('🔍 [COMPANIES PAGE] Slug type:', typeof slug);

  return (
    <PipelineDetailPage
      section="companies"
      slug={slug}
    />
  );
}