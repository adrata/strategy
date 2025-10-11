import { Metadata } from "next";
import { StacksContent } from "@/frontend/components/stacks/StacksContent";

export const metadata: Metadata = {
  title: "Stacks",
  description: "Project management and task tracking",
};

export default function WorkspaceStacksPage() {
  return <StacksContent section="stacks" />;
}


