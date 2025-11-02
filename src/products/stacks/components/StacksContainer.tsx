"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { StacksMiddlePanel } from "@/frontend/components/stacks/StacksMiddlePanel";
import { useStacks } from "../context/StacksProvider";
import { generateSlug, extractIdFromSlug } from "@/platform/utils/url-utils";

interface StacksContainerProps {
  storyId?: string;
}

export function StacksContainer({ storyId }: StacksContainerProps) {
  let stacksContext;
  try {
    stacksContext = useStacks();
  } catch (error) {
    console.error('Failed to access Stacks context:', error);
    // Return error UI if context is not available
    return (
      <div className="h-full flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <p className="text-[var(--muted)]">Failed to load Stacks. Please ensure StacksProvider is wrapping this component.</p>
        </div>
      </div>
    );
  }

  const {
    activeSubSection,
    selectedItem,
    isLoading,
    onSubSectionChange,
    onItemClick,
  } = stacksContext || {
    activeSubSection: 'stacks',
    selectedItem: null,
    isLoading: false,
    onSubSectionChange: () => {},
    onItemClick: () => {},
  };

  const pathname = usePathname();
  const router = useRouter();
  const [showDetail, setShowDetail] = useState(true);

  // Determine active section based on URL
  useEffect(() => {
    console.log('🔍 [StacksContainer] URL changed:', pathname);
    
    // Check for story detail page pattern: /workspace/stacks/{storyId}
    // This must be checked BEFORE the catch-all to prevent routing to default section
    const pathParts = pathname.split('/').filter(Boolean);
    const knownSections = ['workstream', 'workstreams', 'backlog', 'metrics', 'deep-backlog', 'pipeline', 'sell', 'build'];
    
    // Check if this looks like a story detail page (has a storyId in the path)
    if (pathParts.length >= 3 && pathParts[1] === 'stacks') {
      const lastSegment = pathParts[pathParts.length - 1];
      
      // If the last segment is NOT a known section, it's likely a story ID
      if (lastSegment && !knownSections.includes(lastSegment)) {
        // Try to extract ID from slug - if it extracts something, it's likely a story
        const extractedId = extractIdFromSlug(lastSegment);
        // ULIDs are 26 characters and typically start with 'c' or '01'
        if (extractedId && (
          extractedId.length === 26 && (extractedId.startsWith('c') || extractedId.startsWith('01'))
        )) {
          console.log('✅ [StacksContainer] Detected story detail page, keeping current section');
          // Don't change activeSubSection - let storyId prop handle the detail view
          return;
        }
      }
    }
    
    // New URL structure: /stacks/{category}/{section}
    if (pathname.includes('/stacks/workstream')) {
      console.log('✅ [StacksContainer] Setting: workstream');
      onSubSectionChange('workstream');
    } else if (pathname.includes('/stacks/metrics')) {
      console.log('✅ [StacksContainer] Setting: metrics');
      onSubSectionChange('metrics');
    } else if (pathname.includes('/stacks/sell/deep-backlog')) {
      console.log('✅ [StacksContainer] Setting: deep-backlog');
      onSubSectionChange('deep-backlog');
    } else if (pathname.includes('/stacks/build/deep-backlog')) {
      console.log('✅ [StacksContainer] Setting: deep-backlog-build');
      onSubSectionChange('deep-backlog-build');
    } else if (pathname.includes('/stacks/backlog') && !pathname.includes('/stacks/sell/backlog') && !pathname.includes('/stacks/build/backlog')) {
      console.log('✅ [StacksContainer] Setting: backlog');
      onSubSectionChange('backlog');
    } else if (pathname.includes('/stacks/sell/backlog')) {
      console.log('✅ [StacksContainer] Setting: backlog');
      onSubSectionChange('backlog');
    } else if (pathname.includes('/stacks/build/backlog')) {
      console.log('✅ [StacksContainer] Setting: backlog-build');
      onSubSectionChange('backlog-build');
    } else if (pathname.includes('/stacks/sell/pipeline')) {
      console.log('✅ [StacksContainer] Setting: stacks');
      onSubSectionChange('stacks');
    } else if (pathname.includes('/stacks/build/pipeline')) {
      console.log('✅ [StacksContainer] Setting: stacks-build');
      onSubSectionChange('stacks-build');
    } else if (pathname.includes('/stacks')) {
      console.log('✅ [StacksContainer] Default: stacks');
      onSubSectionChange('stacks');
    }
  }, [pathname, onSubSectionChange]);

  // Handle item selection with URL navigation
  const handleItemClick = async (item: any) => {
    onItemClick(item);
    setShowDetail(true);
    
    if (!item?.id) return;
    
    const workspaceSlug = pathname.split('/')[1];
    
    // Always use slug format for better URLs
    if (item.title) {
      const slug = generateSlug(item.title, item.id);
      router.push(`/${workspaceSlug}/stacks/${slug}`);
    } else {
      // If title is missing, fetch the story first to get the title
      try {
        const response = await fetch(`/api/v1/stacks/stories/${item.id}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.story?.title) {
            const slug = generateSlug(data.story.title, item.id);
            router.push(`/${workspaceSlug}/stacks/${slug}`);
          } else {
            // Last resort: use raw ID
            router.push(`/${workspaceSlug}/stacks/${item.id}`);
          }
        } else {
          // Fallback to raw ID if fetch fails
          router.push(`/${workspaceSlug}/stacks/${item.id}`);
        }
      } catch (error) {
        console.error('Failed to fetch story title:', error);
        // Fallback to raw ID
        router.push(`/${workspaceSlug}/stacks/${item.id}`);
      }
    }
  };

  return (
    <StacksMiddlePanel
      activeSubSection={activeSubSection}
      selectedItem={selectedItem}
      onItemClick={handleItemClick}
      isLoading={isLoading}
      storyId={storyId}
    />
  );
}
