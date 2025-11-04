import { OasisPageContent } from "@/products/oasis/components/OasisPageContent";
import { Metadata } from 'next';

interface OasisPageProps {
  params: Promise<{
    workspace: string;
    id: string; // e.g., "general-abc123" or "dan-mirolli-xyz789"
  }>;
}

// Generate metadata for browser tab title
export async function generateMetadata({ params }: OasisPageProps): Promise<Metadata> {
  const { id } = await params;
  
  // Parse the ID to extract the human-readable name
  // Format: "general-abc123" -> "General"
  // Format: "dan-mirolli-xyz789" -> "Dan Mirolli"
  let conversationName = 'Oasis';
  
  if (id) {
    // Split by last hyphen to separate name from ID
    const lastHyphenIndex = id.lastIndexOf('-');
    if (lastHyphenIndex > 0) {
      const namePart = id.substring(0, lastHyphenIndex);
      // Convert kebab-case to Title Case
      conversationName = namePart
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
  }
  
  return {
    title: `Oasis • ${conversationName}`,
  };
}

export default async function WorkspaceOasisPage({ params }: OasisPageProps) {
  const { id } = await params;
  
  // Parse the ID to extract conversation type and ID
  let conversationType: string | null = null;
  let conversationId: string | null = null;
  
  if (id) {
    // Split by last hyphen to separate name from ID
    const lastHyphenIndex = id.lastIndexOf('-');
    if (lastHyphenIndex > 0) {
      const namePart = id.substring(0, lastHyphenIndex);
      const idPart = id.substring(lastHyphenIndex + 1);
      
      // Determine if it's a channel or DM based on the name pattern
      // Channels are single words: general, sell, build, etc.
      // DMs are hyphenated names: dan-mirolli, ryan-hoffman, etc.
      if (namePart.includes('-')) {
        conversationType = 'dm';
      } else {
        conversationType = 'channel';
      }
      
      conversationId = idPart;
    }
  }

  return (
    <OasisPageContent
      conversationType={conversationType}
      conversationId={conversationId}
    />
  );
}
