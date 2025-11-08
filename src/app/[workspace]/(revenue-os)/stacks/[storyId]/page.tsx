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
  const extractedId = extractIdFromSlug(resolvedParams.storyId);
  // Fallback to param value if extraction fails or returns empty
  const storyId = extractedId || resolvedParams.storyId;
  
  console.log('🔍 [WorkspaceStacksStoryPage] Param value:', resolvedParams.storyId);
  console.log('🔍 [WorkspaceStacksStoryPage] Extracted ID:', extractedId);
  console.log('🔍 [WorkspaceStacksStoryPage] Using storyId:', storyId);
  
  return (
    <StacksGuard>
      <div className="h-full">
        <StacksContainer storyId={storyId} />
      </div>
    </StacksGuard>
  );
}
