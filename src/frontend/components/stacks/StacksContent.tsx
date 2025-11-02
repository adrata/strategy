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
  const [activeSubSection, setActiveSubSection] = useState<string>('workstream');
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
    if (pathname.includes('/chronicle')) {
      setActiveSubSection('chronicle');
    } else if (pathname.includes('/workstream')) {
      setActiveSubSection('workstream');
    } else if (pathname.includes('/metrics')) {
      setActiveSubSection('metrics');
    } else if (pathname.includes('/backlog')) {
      setActiveSubSection('backlog');
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
    } else if (pathname.includes('/metrics')) {
      setActiveSubSection('metrics');
    } else {
      setActiveSubSection('workstream');
    }
  }, [pathname]);

  // Navigation handlers
  const handleSubSectionChange = (newSubSection: string) => {
    setActiveSubSection(newSubSection);
    const basePath = pathname.split('/').slice(0, -1).join('/');
    
    if (newSubSection === 'stacks') {
      router.push(basePath);
    } else {
      router.push(`${basePath}/${newSubSection}`);
    }
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
    </ProfilePopupProvider>
  );
}


