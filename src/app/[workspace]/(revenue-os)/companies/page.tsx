import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "Companies • Pipeline",
  description: "Companies management",
};


export default function WorkspaceCompaniesPage() {
  // Use the simplified PipelineContent component (LeftPanel is now in layout)
  // Removed CompaniesErrorBoundary to prevent cache error page flashing
  return <PipelineContent section="companies" />;
}
