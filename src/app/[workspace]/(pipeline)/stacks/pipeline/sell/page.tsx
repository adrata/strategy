import { Metadata } from "next";
import { StacksContainer } from "@/products/stacks/components/StacksContainer";
import { StacksGuard } from "@/platform/ui/components/FeatureGuard";

export const metadata: Metadata = {
  title: "Stacks Pipeline • Sell • Pipeline",
  description: "Visual task management pipeline for Sell workstream",
};

export default function WorkspaceStacksPipelineSellPage() {
  return (
    <StacksGuard>
      <div className="h-full">
        <StacksContainer />
      </div>
    </StacksGuard>
  );
}
