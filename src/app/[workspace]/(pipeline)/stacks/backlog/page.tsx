import { Metadata } from "next";
import { StacksContent } from "@/frontend/components/stacks/StacksContent";

export const metadata: Metadata = {
  title: "Backlog",
  description: "Backlog management and task prioritization",
};

export default function WorkspaceStacksBacklogPage() {
  return <StacksContent section="backlog" />;
}


