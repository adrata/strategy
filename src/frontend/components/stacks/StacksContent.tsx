"use client";

/**
 * Stacks Content Component
 * 
 * Main component for the Stacks section, similar to speedrun but with Jira-like functionality.
 * Follows 2025 best practices with proper modularization and performance optimization.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUnifiedAuth } from '@/platform/auth';
import { PanelLayout } from '@/platform/ui/components/layout/PanelLayout';
import { RightPanel } from '@/platform/ui/components/chat/RightPanel';
import { StacksLeftPanel } from './StacksLeftPanel';
import { StacksMiddlePanel } from './StacksMiddlePanel';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { ProfilePopupProvider } from '@/platform/ui/components/ProfilePopupContext';
import { SettingsPopupProvider } from '@/platform/ui/components/SettingsPopupContext';
import { ProfilePanel } from '@/platform/ui/components/ProfilePanel';
import { useProfilePanel } from '@/platform/ui/components/ProfilePanelContext';

interface StacksContentProps {
  section: string;
}

export function StacksContent({ section }: StacksContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, workspace } = useUnifiedAuth();
  const { ui } = useRevenueOS();
  const { isProfilePanelVisible, setIsProfilePanelVisible } = useProfilePanel();
  
  // State management
  const [activeSubSection, setActiveSubSection] = useState<string>('epics');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get user data for profile panel
  const stacksUser = user || { name: "User", email: "" };
  const company = "Adrata";
  const workspaceName = workspace?.name || ui.activeWorkspace?.name || "Adrata";
  const username = user?.name ? `@${user.name.toLowerCase().replace(/\s+/g, "")}` : "@user";
  
  // Determine current app based on pathname
  const getCurrentApp = () => {
    if (pathname.includes('/stacks')) return 'stacks';
    return 'revenueos';
  };
  const currentApp = getCurrentApp();

  // Determine active subsection from pathname
  useEffect(() => {
    // Check if this is a story detail page (has a slug/ID that's not a known section)
    const pathParts = pathname.split('/').filter(Boolean);
    const knownSections = ['epics', 'workstream', 'metrics', 'backlog', 'chronicle', 'stories', 'bugs', 'futures'];
    
    // If we're on /stacks/{something}, check if it's a known section or a story slug
    if (pathParts.length >= 3 && pathParts[1] === 'stacks') {
      const lastSegment = pathParts[pathParts.length - 1];
      
      // If last segment is NOT a known section, it's likely a story detail page
      // Don't change activeSubSection - preserve current section
      if (lastSegment && !knownSections.includes(lastSegment.toLowerCase())) {
        // This looks like a story detail page (slug/ID), preserve current section
        console.log('📄 [StacksContent] Story detail page detected, preserving current section:', activeSubSection);
        return; // Don't change section when viewing a story detail
      }
    }
    
    // Now check for known sections
    if (pathname.includes('/stacks/epics')) {
      setActiveSubSection('epics');
    } else if (pathname.includes('/stacks/workstream') || pathname.includes('/workstream')) {
      setActiveSubSection('workstream');
    } else if (pathname.includes('/stacks/metrics') || pathname.includes('/metrics')) {
      setActiveSubSection('metrics');
    } else if (pathname.includes('/stacks/backlog') || pathname.includes('/backlog')) {
      setActiveSubSection('backlog');
    } else if (pathname.includes('/chronicle')) {
      setActiveSubSection('chronicle');
    } else if (pathname.includes('/epics')) {
      setActiveSubSection('epics');
    } else if (pathname.includes('/stories')) {
      setActiveSubSection('stories');
    } else if (pathname.includes('/bugs')) {
      setActiveSubSection('bugs');
    } else if (pathname.includes('/futures')) {
      setActiveSubSection('futures');
    } else if (pathname.includes('/sell/pipeline') || pathname.includes('/pipeline/sell')) {
      setActiveSubSection('workstream');
    } else if (pathname.includes('/stacks')) {
      // Default to epics if we're in stacks but no specific section
      // Check if we're on /stacks without a specific section (e.g., /workspace/stacks)
      const isJustStacks = pathParts.length >= 2 && 
                          pathParts[pathParts.length - 1] === 'stacks' &&
                          !pathname.includes('/stacks/epics') &&
                          !pathname.includes('/stacks/workstream') &&
                          !pathname.includes('/stacks/metrics') &&
                          !pathname.includes('/stacks/backlog');
      
      if (isJustStacks) {
        // Navigate to epics section
        const workspaceSlug = pathParts[0] || 'workspace';
        router.push(`/${workspaceSlug}/stacks/epics`);
      } else {
        // Only default to epics if we're truly on a base /stacks route
        // If we're on a story detail, don't change section
        setActiveSubSection('epics');
      }
    }
  }, [pathname, router, activeSubSection]);

  // Navigation handlers
  const handleSubSectionChange = (newSubSection: string) => {
    console.log('🔄 [StacksContent] handleSubSectionChange called:', { newSubSection, currentPathname: pathname });
    
    // Update state immediately for responsive UI
    setActiveSubSection(newSubSection);
    
    // Get workspace slug from pathname
    const pathParts = pathname.split('/').filter(Boolean);
    const workspaceSlug = pathParts[0] || 'workspace';
    
    // Build the correct path - /workspace/stacks/section
    const newPath = newSubSection === 'stacks' 
      ? `/${workspaceSlug}/stacks`
      : `/${workspaceSlug}/stacks/${newSubSection}`;
    
    console.log('🔄 [StacksContent] Navigating to:', newPath);
    router.push(newPath);
  };

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
  };

  // Memoized components for performance
  const leftPanel = useMemo(() => (
    <StacksLeftPanel
      activeSubSection={activeSubSection}
      onSubSectionChange={handleSubSectionChange}
    />
  ), [activeSubSection]);

  const middlePanel = useMemo(() => (
    <StacksMiddlePanel
      activeSubSection={activeSubSection}
      selectedItem={selectedItem}
      onItemClick={handleItemClick}
      isLoading={isLoading}
    />
  ), [activeSubSection, selectedItem, isLoading]);

  const rightPanel = useMemo(() => (
    <RightPanel />
  ), []);

  return (
    <ProfilePopupProvider>
      <SettingsPopupProvider>
        <div className="h-full w-full">
          <PanelLayout
            thinLeftPanel={null}
            leftPanel={leftPanel}
            middlePanel={middlePanel}
            rightPanel={rightPanel}
            profilePanel={
              <ProfilePanel
                user={stacksUser}
                company={company}
                workspace={workspaceName}
                isOpen={isProfilePanelVisible}
                onClose={() => setIsProfilePanelVisible(false)}
                username={username}
                currentApp={currentApp}
                userId={user?.id}
                userEmail={user?.email}
                onToggleLeftPanel={ui.toggleLeftPanel}
              />
            }
            isProfilePanelVisible={isProfilePanelVisible}
            zoom={100}
            isLeftPanelVisible={ui.isLeftPanelVisible}
            isRightPanelVisible={ui.isRightPanelVisible}
            onToggleLeftPanel={ui.toggleLeftPanel}
            onToggleRightPanel={ui.toggleRightPanel}
          />
        </div>
      </SettingsPopupProvider>
    </ProfilePopupProvider>
  );
}


