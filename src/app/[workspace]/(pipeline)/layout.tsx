"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PanelLayout } from "@/platform/ui/components/layout/PanelLayout";
import { LeftPanel } from "@/products/pipeline/components/LeftPanel";
import { RightPanel } from "@/platform/ui/components/chat/RightPanel";
import { SpeedrunSprintLeftPanel } from "@/frontend/components/pipeline/SpeedrunSprintLeftPanel";
import { SprintProvider, useSprint } from "@/frontend/components/pipeline/SprintContext";
import { AcquisitionOSProvider, useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { PipelineProvider } from "@/products/pipeline/context/PipelineContext";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";
import { SettingsPopupProvider } from "@/platform/ui/components/SettingsPopupContext";
import { SpeedrunDataProvider } from "@/platform/services/speedrun-data-context";
import { OasisLeftPanel } from "@/products/oasis/components/OasisLeftPanel";
import { StacksLeftPanel } from "@/frontend/components/stacks/StacksLeftPanel";
import { StacksDetailPanel } from "@/products/stacks/components/StacksDetailPanel";
import { useStacks, StacksProvider } from "@/products/stacks/context/StacksProvider";
import { useUnifiedAuth } from "@/platform/auth";
import { SettingsPopup } from "@/frontend/components/pipeline/SettingsPopup";
import { useSettingsPopup } from "@/platform/ui/components/SettingsPopupContext";
import { NovaBrowser } from "@/products/pipeline/components/NovaBrowser";
import { ProfilePanel } from "@/platform/ui/components/ProfilePanel";
import { ProfilePanelProvider, useProfilePanel } from "@/platform/ui/components/ProfilePanelContext";

// Oasis Context
interface OasisContextType {
  activeSection: 'channels' | 'direct-messages' | 'mentions' | 'starred' | 'archived' | 'settings';
  setActiveSection: (section: 'channels' | 'direct-messages' | 'mentions' | 'starred' | 'archived' | 'settings') => void;
  selectedChannel: any | null;
  setSelectedChannel: (channel: any | null) => void;
}

const OasisContext = createContext<OasisContextType | undefined>(undefined);

export const useOasis = () => {
  const context = useContext(OasisContext);
  if (!context) {
    console.error('useOasis hook called outside of OasisProvider');
    console.error('Current context value:', context);
    throw new Error('useOasis must be used within OasisProvider');
  }
  return context;
};

// Wrapper component for sprint left panel that uses SprintContext
function SprintLeftPanelWrapper() {
  const { selectedRecord, setSelectedRecord, currentSprintIndex, setCurrentSprintIndex, completedRecords } = useSprint();

  // Update selected record in sprint context instead of navigating away
  const handleRecordSelect = (record: any) => {
    setSelectedRecord(record);
  };
  
  return (
    <SpeedrunSprintLeftPanel
      selectedRecord={selectedRecord}
      onRecordSelect={handleRecordSelect}
      currentSprintIndex={currentSprintIndex}
      onSprintChange={setCurrentSprintIndex}
      completedRecords={completedRecords}
    />
  );
}

interface PipelineLayoutProps {
  children: React.ReactNode;
}

// Inner component that uses the ProfilePanelContext
function PipelineLayoutInner({ 
  children, 
  currentSection,
  onSectionChange,
  isSpeedrunVisible,
  setIsSpeedrunVisible,
  isOpportunitiesVisible,
  setIsOpportunitiesVisible,
  isProspectsVisible,
  setIsProspectsVisible,
  isLeadsVisible,
  setIsLeadsVisible,
  isCustomersVisible,
  setIsCustomersVisible,
  isPartnersVisible,
  setIsPartnersVisible,
  isNovaActive
}: {
  children: React.ReactNode;
  currentSection: string;
  onSectionChange: (section: string) => void;
  isSpeedrunVisible: boolean;
  setIsSpeedrunVisible: (visible: boolean) => void;
  isOpportunitiesVisible: boolean;
  setIsOpportunitiesVisible: (visible: boolean) => void;
  isProspectsVisible: boolean;
  setIsProspectsVisible: (visible: boolean) => void;
  isLeadsVisible: boolean;
  setIsLeadsVisible: (visible: boolean) => void;
  isCustomersVisible: boolean;
  setIsCustomersVisible: (visible: boolean) => void;
  isPartnersVisible: boolean;
  setIsPartnersVisible: (visible: boolean) => void;
  isNovaActive: boolean;
}) {
  // Now we can use the context hooks since we're inside the providers
  const { ui } = useAcquisitionOS();
  const { user: authUser } = useUnifiedAuth();
  const { isSettingsOpen, setIsSettingsOpen } = useSettingsPopup();
  const { isProfilePanelVisible, setIsProfilePanelVisible } = useProfilePanel();
  const pathname = usePathname();

  // Get user data for profile panel
  const pipelineUser = authUser || { name: "User", email: "" };
  const company = "Adrata"; // You can get this from workspace context if needed
  const workspace = "Adrata"; // You can get this from workspace context if needed
  const username = authUser?.name ? `@${authUser.name.toLowerCase().replace(/\s+/g, "")}` : "@user";
  
  // Determine current app based on pathname
  const getCurrentApp = () => {
    if (pathname.includes('/oasis')) return 'oasis';
    if (pathname.includes('/atrium')) return 'atrium';
    return 'revenueos'; // Default to AcquisitionOS
  };
  const currentApp = getCurrentApp();

  // User detection for conditional left panel visibility
  const currentUserEmail = authUser?.email;
  const ADMIN_EMAILS = ['ross@adrata.com', 'todd@adrata.com', 'dan@adrata.com'];
  const isAdminUser = ADMIN_EMAILS.includes(currentUserEmail || '');

  // Check if user is in Adrata workspace
  const isAdrataWorkspace = () => {
    const activeWorkspace = authUser?.workspaces?.find(
      w => w['id'] === authUser?.activeWorkspaceId
    );
    return activeWorkspace?.name?.toLowerCase() === 'adrata';
  };

  // Determine which left panel to show based on the current route
  const getLeftPanel = () => {
    if (pathname.includes('/oasis')) {
      // Only show Oasis left panel for Adrata workspace users
      if (isAdrataWorkspace()) {
        return <OasisLeftPanel />;
      } else {
        // Redirect non-Adrata users to default panel
        return (
          <LeftPanel 
            key={`left-panel-${isNovaActive ? "nova" : currentSection}`}
            activeSection={isNovaActive ? "nova" : currentSection}
            onSectionChange={onSectionChange}
            isSpeedrunVisible={isSpeedrunVisible}
            setIsSpeedrunVisible={setIsSpeedrunVisible}
            isOpportunitiesVisible={isOpportunitiesVisible}
            setIsOpportunitiesVisible={setIsOpportunitiesVisible}
            isProspectsVisible={isProspectsVisible}
            setIsProspectsVisible={setIsProspectsVisible}
            isLeadsVisible={isLeadsVisible}
            setIsLeadsVisible={setIsLeadsVisible}
            isCustomersVisible={isCustomersVisible}
            setIsCustomersVisible={setIsCustomersVisible}
            isPartnersVisible={isPartnersVisible}
            setIsPartnersVisible={setIsPartnersVisible}
          />
        );
      }
    } else if (pathname.includes('/stacks')) {
      return <StacksLeftPanel activeSubSection="stacks" onSubSectionChange={() => {}} />;
    } else if (pathname.includes('/speedrun/sprint')) {
      // Special left panel for sprint view - use SprintContext
      return <SprintLeftPanelWrapper />;
    } else {
      // Default to Speedrun left panel for other routes
      return (
        <LeftPanel 
          key={`left-panel-${isNovaActive ? "nova" : currentSection}`}
          activeSection={isNovaActive ? "nova" : currentSection}
          onSectionChange={onSectionChange}
          isSpeedrunVisible={isSpeedrunVisible}
          setIsSpeedrunVisible={setIsSpeedrunVisible}
          isOpportunitiesVisible={isOpportunitiesVisible}
          setIsOpportunitiesVisible={setIsOpportunitiesVisible}
          isProspectsVisible={isProspectsVisible}
          setIsProspectsVisible={setIsProspectsVisible}
          isLeadsVisible={isLeadsVisible}
          setIsLeadsVisible={setIsLeadsVisible}
          isCustomersVisible={isCustomersVisible}
          setIsCustomersVisible={setIsCustomersVisible}
          isPartnersVisible={isPartnersVisible}
          setIsPartnersVisible={setIsPartnersVisible}
        />
      );
    }
  };

  // Determine which right panel to show based on the current route
  const getRightPanel = () => {
    if (pathname.includes('/oasis')) {
      return <RightPanel />;
    } else if (pathname.includes('/stacks')) {
      // Try to get Stacks context for selected item
      let stacksContext = null;
      try {
        stacksContext = useStacks();
      } catch (error) {
        // Stacks context not available, that's fine
      }
      
      if (stacksContext?.selectedItem) {
        return <StacksDetailPanel item={stacksContext.selectedItem} />;
      } else {
        return <RightPanel />;
      }
    } else {
      return <RightPanel />;
    }
  };

  // Always show left panel for all sections (including Chronicle)
  const shouldShowLeftPanel = true;
  const isLeftPanelVisible = shouldShowLeftPanel && ui.isLeftPanelVisible;

  return (
    <>
      <PanelLayout
        thinLeftPanel={null}
        leftPanel={getLeftPanel()}
        middlePanel={isNovaActive ? <NovaBrowser /> : children}
        rightPanel={getRightPanel()}
        profilePanel={
          <ProfilePanel
            user={pipelineUser}
            company={company}
            workspace={workspace}
            isOpen={isProfilePanelVisible}
            onClose={() => setIsProfilePanelVisible(false)}
            username={username}
            currentApp={currentApp}
          />
        }
        isProfilePanelVisible={isProfilePanelVisible}
        zoom={100}
        isLeftPanelVisible={isLeftPanelVisible}
        isRightPanelVisible={ui.isRightPanelVisible}
        onToggleLeftPanel={ui.toggleLeftPanel}
        onToggleRightPanel={ui.toggleRightPanel}
      />
      
      {/* Settings Popup */}
      <SettingsPopup
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}

/**
 * Pipeline Layout
 * 
 * Provides the persistent left panel for all pipeline routes.
 * This layout ensures the left panel doesn't reload when navigating
 * between pipeline sections like /speedrun, /leads, /prospects, etc.
 * 
 * Also provides all necessary context providers for the pipeline.
 */
export default function PipelineLayout({ children }: PipelineLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Extract the current section from the pathname
  const getCurrentSection = () => {
    const segments = pathname.split('/').filter(Boolean);
    // Find the section after the workspace slug
    const workspaceIndex = segments.findIndex(segment => segment !== 'workspaces');
    if (workspaceIndex >= 0 && segments[workspaceIndex + 1]) {
      return segments[workspaceIndex + 1];
    }
    return 'dashboard'; // Default section
  };

  const currentSection = getCurrentSection();
  
  // State for Nova section (since it doesn't have a route)
  const [isNovaActive, setIsNovaActive] = useState(false);
  
  // Debug logging
  console.log('🔍 [PipelineLayout] Current state:', {
    currentSection,
    isNovaActive,
    finalSection: isNovaActive ? "nova" : currentSection
  });
  
  // State for left panel visibility controls
  const [isSpeedrunVisible, setIsSpeedrunVisible] = useState(true);
  const [isOpportunitiesVisible, setIsOpportunitiesVisible] = useState(true);
  const [isProspectsVisible, setIsProspectsVisible] = useState(true);
  const [isLeadsVisible, setIsLeadsVisible] = useState(true);
  const [isCustomersVisible, setIsCustomersVisible] = useState(false);
  const [isPartnersVisible, setIsPartnersVisible] = useState(true);


  // Oasis context state
  const [activeSection, setActiveSection] = useState<'channels' | 'direct-messages' | 'mentions' | 'starred' | 'archived' | 'settings'>('channels');
  const [selectedChannel, setSelectedChannel] = useState<any | null>(null);

  const oasisContextValue = {
    activeSection,
    setActiveSection,
    selectedChannel,
    setSelectedChannel
  };

  // Handle section changes with proper navigation
  const handleSectionChange = (section: string) => {
    console.log(`🔄 [PipelineLayout] Section change requested: ${section}`);
    
    // Special handling for Nova - don't navigate, just update state
    if (section === "nova") {
      console.log('🌌 [PipelineLayout] Nova section - setting isNovaActive to true');
      setIsNovaActive(true);
      return;
    }
    
    // Reset Nova state when navigating to other sections
    console.log(`🔄 [PipelineLayout] Non-Nova section - resetting Nova state`);
    setIsNovaActive(false);
    
    // Extract workspace from pathname
    const segments = pathname.split('/').filter(Boolean);
    const workspaceSlug = segments[0]; // First segment is the workspace slug
    
    // Navigate using Next.js router for client-side navigation
    if (workspaceSlug) {
      router.push(`/${workspaceSlug}/${section}`);
    }
  };

  return (
    <AcquisitionOSProvider>
      <ZoomProvider>
        <PipelineProvider>
          <StacksProvider>
            <SpeedrunDataProvider>
              <SprintProvider>
                <OasisContext.Provider value={oasisContextValue}>
                  <ProfilePopupProvider>
                    <SettingsPopupProvider>
                      <ProfilePanelProvider>
                        <PipelineLayoutInner
                          currentSection={isNovaActive ? "nova" : currentSection}
                          onSectionChange={handleSectionChange}
                          isSpeedrunVisible={isSpeedrunVisible}
                          setIsSpeedrunVisible={setIsSpeedrunVisible}
                          isOpportunitiesVisible={isOpportunitiesVisible}
                          setIsOpportunitiesVisible={setIsOpportunitiesVisible}
                          isProspectsVisible={isProspectsVisible}
                          setIsProspectsVisible={setIsProspectsVisible}
                          isLeadsVisible={isLeadsVisible}
                          setIsLeadsVisible={setIsLeadsVisible}
                          isCustomersVisible={isCustomersVisible}
                          setIsCustomersVisible={setIsCustomersVisible}
                          isPartnersVisible={isPartnersVisible}
                          setIsPartnersVisible={setIsPartnersVisible}
                          isNovaActive={isNovaActive}
                        >
                          {children}
                        </PipelineLayoutInner>
                      </ProfilePanelProvider>
                    </SettingsPopupProvider>
                  </ProfilePopupProvider>
                </OasisContext.Provider>
              </SprintProvider>
            </SpeedrunDataProvider>
          </StacksProvider>
        </PipelineProvider>
      </ZoomProvider>
    </AcquisitionOSProvider>
  );
}
