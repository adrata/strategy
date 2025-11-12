"use client";

import { useParams } from "next/navigation";
import { PipelineDetailPage } from "@/frontend/components/pipeline/PipelineDetailPage";

export default function PartnerOSPartnerDetailPage() {
  const params = useParams();
  const slug = params['id'] as string;
  
  return (
    <PipelineDetailPage
      section="partners"
      slug={slug}
    />
  );
}

