import { Metadata } from "next";
import { PipelineContent } from "@/frontend/components/pipeline/PipelineContent";

export const metadata: Metadata = {
  title: "Clients • Retention OS",
  description: "Clients management for retention",
};

export default function RetentionOSClientsPage() {
  return <PipelineContent section="clients" osType="retention" />;
}

