import { Metadata } from "next";
import { StacksContainer } from "@/products/stacks/components/StacksContainer";
import { StacksGuard } from "@/platform/ui/components/FeatureGuard";
import { extractIdFromSlug } from "@/platform/utils/url-utils";

interface StoryPageProps {
  params: Promise<{
    workspace: string;
    storyId: string;
  }>;
}

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `Story • Stacks • Pipeline`,
    description: "Story details and management",
  };
}

export default async function WorkspaceStacksStoryPage({ params }: StoryPageProps) {
  const resolvedParams = await params;
  // Extract ID from slug (handles both slug format and raw ID)
  const storyId = extractIdFromSlug(resolvedParams.storyId);
  
  return (
    <StacksGuard>
      <div className="h-full">
        <StacksContainer storyId={storyId} />
      </div>
    </StacksGuard>
  );
}
