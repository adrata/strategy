import { Metadata } from "next";
import { StacksContainer } from "@/products/stacks/components/StacksContainer";
import { StacksGuard } from "@/platform/ui/components/FeatureGuard";

interface StoryPageProps {
  params: {
    workspace: string;
    storyId: string;
  };
}

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  return {
    title: `Story ${params.storyId} • Stacks • Pipeline`,
    description: "Story details and management",
  };
}

export default function WorkspaceStacksStoryPage({ params }: StoryPageProps) {
  return (
    <StacksGuard>
      <div className="h-full">
        <StacksContainer storyId={params.storyId} />
      </div>
    </StacksGuard>
  );
}
