"use client";

import React from "react";
import { MonacoContentSimple } from "@/products/monaco/components/MonacoContentSimple";
import { useRouter } from "next/navigation";
import { useWorkspaceNavigation } from "@/platform/hooks/useWorkspaceNavigation";

interface PipelineSpeedrunContentProps {
  activeSection: string;
  icpLists: any[];
  allSections: Array<{
    id: string;
    name: string;
    description: string;
    count: number;
  }>;
  completedLists: any[];
  isTransferring: boolean;
  selectedRecord: any;
  setSelectedRecord: (record: any) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onTransferAll: () => void;
  searchCompanies: (query: string) => Promise<void>;
  onSpeedrunModeToggle: () => void;
}

/**
 * Pipeline Speedrun Content - Modified version of Monaco Content with Pipeline routing
 * This wraps MonacoContentSimple and overrides keyboard shortcuts to route to Pipeline
 */
export function PipelineSpeedrunContent(props: PipelineSpeedrunContentProps) {
  const router = useRouter();
  const { navigateToMonaco } = useWorkspaceNavigation();

  // Override keyboard shortcuts for Pipeline context
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Command+G (Mac) or Ctrl+G (Windows/Linux) - Start Pipeline Speedrun
      if ((event.metaKey || event.ctrlKey) && event['key'] === 'g') {
        event.preventDefault();
        event.stopPropagation();
        console.log('🚀 Command+G pressed - Navigating to Monaco Speedrun from Pipeline context');
        navigateToMonaco('speedrun/sprint?from=pipeline');
      }
    };

    // Add with capture to override Monaco's handler
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [router]);

  // Intercept clicks on Monaco's Start button and redirect to Monaco with Pipeline context
  React.useEffect(() => {
    const handleStartButtonClick = (event: Event) => {
      const target = event.target as HTMLElement;
      // Check if this is Monaco's Start button link
      if (target.closest('a[href="/monaco/speedrun/sprint"]')) {
        event.preventDefault();
        event.stopPropagation();
        console.log('🚀 Monaco Start button intercepted - routing to Monaco Speedrun with Pipeline context');
        navigateToMonaco('speedrun/sprint?from=pipeline');
      }
    };

    // Add click listener with capture to intercept before the link navigation
    document.addEventListener('click', handleStartButtonClick, true);
    return () => document.removeEventListener('click', handleStartButtonClick, true);
  }, [router]);

  return (
    <div className="relative w-full h-full">
      {/* Render Monaco Content Simple - this will show the normal Start button but we intercept its clicks */}
      <MonacoContentSimple {...props} />
    </div>
  );
}
