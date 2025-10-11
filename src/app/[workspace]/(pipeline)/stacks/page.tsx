import { Metadata } from "next";
import { StacksContainer } from "@/products/stacks/components/StacksContainer";
import { StacksProvider } from "@/products/stacks/context/StacksProvider";

export const metadata: Metadata = {
  title: "Stacks",
  description: "Project management and task tracking",
};

export default function WorkspaceStacksPage() {
  return (
    <StacksProvider>
      <div className="h-full">
        <StacksContainer />
      </div>
    </StacksProvider>
  );
}


