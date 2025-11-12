"use client";

import { useParams } from "next/navigation";
import { PipelineDetailPage } from "@/frontend/components/pipeline/PipelineDetailPage";

export default function PartnerOSOpportunityDetailPage() {
  const params = useParams();
  const slug = params['id'] as string;
  
  return (
    <PipelineDetailPage
      section="opportunities"
      slug={slug}
    />
  );
}

