import { Metadata } from "next";
import { StacksContainer } from "@/products/stacks/components/StacksContainer";
import { StacksGuard } from "@/platform/ui/components/FeatureGuard";

export const metadata: Metadata = {
  title: "Stacks • Workstream",
  description: "Visual task management board",
};

export default function WorkspaceStacksWorkstreamPage() {
  return (
    <StacksGuard>
      <div className="h-full">
        <StacksContainer />
      </div>
    </StacksGuard>
  );
}

