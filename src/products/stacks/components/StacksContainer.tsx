"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { StacksMiddlePanel } from "@/frontend/components/stacks/StacksMiddlePanel";
import { useStacks } from "../context/StacksProvider";

interface StacksContainerProps {
  storyId?: string;
}

export function StacksContainer({ storyId }: StacksContainerProps) {
  const {
    activeSubSection,
    selectedItem,
    isLoading,
    onSubSectionChange,
    onItemClick,
  } = useStacks();

  const pathname = usePathname();
  const router = useRouter();
  const [showDetail, setShowDetail] = useState(true);

  // Determine active section based on URL
  useEffect(() => {
    console.log('🔍 [StacksContainer] URL changed:', pathname);
    
    // New URL structure: /stacks/{category}/{section}
    if (pathname.includes('/stacks/sell/deep-backlog')) {
      console.log('✅ [StacksContainer] Setting: deep-backlog');
      onSubSectionChange('deep-backlog');
    } else if (pathname.includes('/stacks/build/deep-backlog')) {
      console.log('✅ [StacksContainer] Setting: deep-backlog-build');
      onSubSectionChange('deep-backlog-build');
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
  const handleItemClick = (item: any) => {
    onItemClick(item);
    setShowDetail(true);
    
    // Navigate to story detail page
    if (item?.id) {
      const workspaceSlug = pathname.split('/')[1];
      router.push(`/${workspaceSlug}/stacks/${item.id}`);
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
