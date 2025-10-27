"use client";

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getLastConversation } from '@/products/oasis/utils/conversation-persistence';

export default function OasisRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params.workspace as string;

  useEffect(() => {
    // Get the last conversation from localStorage
    const lastConversation = getLastConversation(workspaceSlug);
    
    if (lastConversation) {
      // Redirect to the last conversation
      const generateSlug = (name: string) => {
        return name.toLowerCase().replace(/\s+/g, '-');
      };
      
      const slug = `${generateSlug(lastConversation.conversationName)}-${lastConversation.conversationId}`;
      router.replace(`/${workspaceSlug}/oasis/${slug}`);
    } else {
      // No last conversation, redirect to general channel
      // We'll need to get the general channel ID from the API or use a default
      router.replace(`/${workspaceSlug}/oasis/general-default`);
    }
  }, [workspaceSlug, router]);

  // Show loading state while redirecting
  return (
    <div className="h-full flex items-center justify-center bg-[var(--background)]">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-white text-2xl font-bold">O</span>
        </div>
        <div className="text-lg font-medium text-[var(--foreground)] mb-2">Loading Oasis...</div>
        <div className="text-sm text-[var(--muted)]">Redirecting to your last conversation</div>
      </div>
    </div>
  );
}
