"use client";

import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export default function WorkspaceCompaniesPage() {
  // Use the simplified PipelineContent component (LeftPanel is now in layout)
  // Removed CompaniesErrorBoundary to prevent cache error page flashing
  return <PipelineContent section="companies" />;
}
