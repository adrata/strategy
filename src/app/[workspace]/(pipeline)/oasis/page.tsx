"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getLastConversation } from '@/products/oasis/utils/conversation-persistence';
import { useUnifiedAuth } from '@/platform/auth';

export default function OasisRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params.workspace as string;
  const { user: authUser } = useUnifiedAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const redirectToChannel = async () => {
      if (isRedirecting) return;
      setIsRedirecting(true);

      try {
        // Get the last conversation from localStorage
        const lastConversation = getLastConversation(workspaceSlug);
        
        if (lastConversation) {
          // Redirect to the last conversation
          const generateSlug = (name: string) => {
            return name.toLowerCase().replace(/\s+/g, '-');
          };
          
          const slug = `${generateSlug(lastConversation.conversationName)}-${lastConversation.conversationId}`;
          router.replace(`/${workspaceSlug}/oasis/${slug}`);
          return;
        }

        // No last conversation, fetch channels and redirect to #general
        const workspaceId = authUser?.activeWorkspaceId;
        if (!workspaceId) {
          console.error('No workspace ID available for channel fetching');
          router.replace(`/${workspaceSlug}/oasis/general-default`);
          return;
        }

        // Fetch channels from API
        const response = await fetch(`/api/v1/oasis/oasis/channels?workspaceId=${workspaceId}`);
        if (!response.ok) {
          console.error('Failed to fetch channels:', response.status);
          router.replace(`/${workspaceSlug}/oasis/general-default`);
          return;
        }

        const data = await response.json();
        const channels = data.channels || [];
        
        // Find #general channel or use first available channel
        const generalChannel = channels.find((channel: any) => channel.name === 'general');
        const targetChannel = generalChannel || channels[0];
        
        if (!targetChannel) {
          console.error('No channels available');
          router.replace(`/${workspaceSlug}/oasis/general-default`);
          return;
        }

        // Build redirect URL with real channel ID
        const generateSlug = (name: string) => {
          return name.toLowerCase().replace(/\s+/g, '-');
        };
        
        const slug = `${generateSlug(targetChannel.name)}-${targetChannel.id}`;
        router.replace(`/${workspaceSlug}/oasis/${slug}`);
        
      } catch (error) {
        console.error('Error during redirect:', error);
        router.replace(`/${workspaceSlug}/oasis/general-default`);
      }
    };

    // Only redirect if we have auth user (to get workspace ID)
    if (authUser?.activeWorkspaceId) {
      redirectToChannel();
    }
  }, [workspaceSlug, router, authUser?.activeWorkspaceId, isRedirecting]);

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
