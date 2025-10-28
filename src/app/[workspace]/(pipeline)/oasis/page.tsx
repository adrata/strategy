"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getLastConversation } from '@/products/oasis/utils/conversation-persistence';
import { useUnifiedAuth } from '@/platform/auth';
import { OasisGuard } from '@/platform/ui/components/FeatureGuard';

function OasisRedirectContent() {
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

  // Show skeleton UI while redirecting
  return (
    <div className="h-full bg-[var(--background)] flex">
      {/* Left Panel Skeleton */}
      <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
        <div className="p-4 border-b border-[var(--border)]">
          <div className="h-6 bg-[var(--loading-bg)] rounded animate-pulse mb-2" />
          <div className="h-4 bg-[var(--loading-bg)] rounded w-2/3 animate-pulse" />
        </div>
        
        <div className="p-4">
          <div className="h-4 bg-[var(--loading-bg)] rounded w-1/2 animate-pulse mb-3" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[var(--loading-bg)] rounded animate-pulse" />
                <div className="h-4 bg-[var(--loading-bg)] rounded flex-1 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-[var(--border)]">
          <div className="h-4 bg-[var(--loading-bg)] rounded w-1/2 animate-pulse mb-3" />
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[var(--loading-bg)] rounded-full animate-pulse" />
                <div className="h-4 bg-[var(--loading-bg)] rounded flex-1 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Header Skeleton */}
        <div className="p-4 border-b border-[var(--border)] bg-[var(--background)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-[var(--loading-bg)] rounded animate-pulse" />
              <div className="h-6 bg-[var(--loading-bg)] rounded w-32 animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 bg-[var(--loading-bg)] rounded w-20 animate-pulse" />
              <div className="h-8 bg-[var(--loading-bg)] rounded w-24 animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* Messages Skeleton */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 px-2">
              <div className="w-10 h-10 bg-[var(--loading-bg)] rounded animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--loading-bg)] rounded w-1/4 animate-pulse" />
                <div className="h-4 bg-[var(--loading-bg)] rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-[var(--loading-bg)] rounded w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
        
        {/* Input Skeleton */}
        <div className="p-4 border-t border-[var(--border)]">
          <div className="h-12 bg-[var(--loading-bg)] rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function OasisRedirectPage() {
  return (
    <OasisGuard>
      <OasisRedirectContent />
    </OasisGuard>
  );
}
