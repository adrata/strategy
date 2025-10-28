import { Metadata } from "next";
import { StacksContainer } from "@/products/stacks/components/StacksContainer";
import { StacksGuard } from "@/platform/ui/components/FeatureGuard";

export const metadata: Metadata = {
  title: "Stacks Backlog • Sell • Project Acceleration",
  description: "Prioritized task backlog for Stacks Sell workstream",
};

export default function WorkspaceStacksSellBacklogPage() {
  return (
    <StacksGuard>
      <div className="h-full">
        <StacksContainer />
      </div>
    </StacksGuard>
  );
}
