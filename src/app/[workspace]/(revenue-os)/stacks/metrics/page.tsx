import { Metadata } from "next";
import { StacksContainer } from "@/products/stacks/components/StacksContainer";
import { StacksGuard } from "@/platform/ui/components/FeatureGuard";

export const metadata: Metadata = {
  title: "Stacks • Metrics • Pipeline",
  description: "Workstream performance and analytics",
};

export default function WorkspaceStacksMetricsPage() {
  return (
    <StacksGuard>
      <div className="h-full">
        <StacksContainer />
      </div>
    </StacksGuard>
  );
}

