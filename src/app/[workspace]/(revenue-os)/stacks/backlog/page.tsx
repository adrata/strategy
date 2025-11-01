import { Metadata } from "next";
import { StacksContainer } from "@/products/stacks/components/StacksContainer";
import { StacksGuard } from "@/platform/ui/components/FeatureGuard";

export const metadata: Metadata = {
  title: "Backlog • Stacks • Pipeline",
  description: "Task prioritization and planning",
};

export default function WorkspaceStacksBacklogPage() {
  return (
    <StacksGuard>
      <div className="h-full">
        <StacksContainer />
      </div>
    </StacksGuard>
  );
}