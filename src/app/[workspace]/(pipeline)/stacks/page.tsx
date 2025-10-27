import { Metadata } from "next";
import { StacksContainer } from "@/products/stacks/components/StacksContainer";

export const metadata: Metadata = {
  title: "Stacks • Pipeline",
  description: "Project management and task tracking",
};



export default function WorkspaceStacksPage() {
  return (
    <div className="h-full">
      <StacksContainer />
    </div>
  );
}


