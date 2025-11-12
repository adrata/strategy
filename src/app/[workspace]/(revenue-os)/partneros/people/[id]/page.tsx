"use client";

import { useParams } from "next/navigation";
import { PipelineDetailPage } from "@/frontend/components/pipeline/PipelineDetailPage";

export default function PartnerOSPersonDetailPage() {
  const params = useParams();
  const slug = params['id'] as string;
  
  return (
    <PipelineDetailPage
      section="people"
      slug={slug}
    />
  );
}

