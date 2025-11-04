"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PanelLayout } from "@/platform/ui/components/layout/PanelLayout";
import { LeftPanel } from "@/products/pipeline/components/LeftPanel";
import { RightPanel } from "@/platform/ui/components/chat/RightPanel";
import { ConversationsListGrouped } from "@/platform/ui/components/chat/ConversationsListGrouped";
import { SpeedrunSprintLeftPanel } from "@/frontend/components/pipeline/SpeedrunSprintLeftPanel";
import { SprintProvider, useSprint } from "@/frontend/components/pipeline/SprintContext";
import { RevenueOSProvider, useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { PipelineProvider } from "@/products/pipeline/context/PipelineContext";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";
import { SettingsPopupProvider } from "@/platform/ui/components/SettingsPopupContext";
import { SpeedrunDataProvider } from "@/platform/services/speedrun-data-context";
import { OasisLeftPanel } from "@/products/oasis/components/OasisLeftPanel";
import { StacksLeftPanel } from "@/frontend/components/stacks/StacksLeftPanel";
import { StacksDetailPanel } from "@/products/stacks/components/StacksDetailPanel";
import { useStacks, StacksProvider } from "@/products/stacks/context/StacksProvider";
import { WorkshopLeftPanel } from "@/app/[workspace]/workshop/components/WorkshopLeftPanel";
import { useUnifiedAuth } from "@/platform/auth";
import { SettingsPopup } from "@/frontend/components/pipeline/SettingsPopup";
import { useSettingsPopup } from "@/platform/ui/components/SettingsPopupContext";
import { NovaBrowser } from "@/products/pipeline/components/NovaBrowser";
import { ProfilePanel } from "@/platform/ui/components/ProfilePanel";
import { ProfilePanelProvider, useProfilePanel } from "@/platform/ui/components/ProfilePanelContext";
import { FeatureAccessProvider } from "@/platform/ui/context/FeatureAccessProvider";
import { OasisProvider } from "@/products/oasis/context/OasisProvider";

// Oasis Context - Local state for layout-specific needs
interface OasisLayoutContextType {
  activeSection: 'channels' | 'direct-messages' | 'mentions' | 'starred' | 'archived' | 'settings';
  setActiveSection: (section: 'channels' | 'direct-messages' | 'mentions' | 'starred' | 'archived' | 'settings') => void;
  selectedChannel: any | null;
  setSelectedChannel: (channel: any | null) => void;
  isVideoCallActive: boolean;
  setIsVideoCallActive: (active: boolean) => void;
  videoCallRoom: { id: string; name: string } | null;
  setVideoCallRoom: (room: { id: string; name: string } | null) => void;
}

const OasisLayoutContext = createContext<OasisLayoutContextType | undefined>(undefined);

export const useOasisLayout = () => {
  const context = useContext(OasisLayoutContext);
  if (!context) {
    throw new Error('useOasisLayout must be used within OasisLayoutProvider');
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
  const { ui } = useRevenueOS();
  const { user: authUser } = useUnifiedAuth();
  const { isSettingsOpen, setIsSettingsOpen } = useSettingsPopup();
  const { isProfilePanelVisible, setIsProfilePanelVisible } = useProfilePanel();
  const pathname = usePathname();
  
  // Initialize profile panel state from sessionStorage on mount if needed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const shouldStayOpen = sessionStorage.getItem('profilePanelShouldStayOpen') === 'true';
      if (shouldStayOpen && !isProfilePanelVisible) {
        setIsProfilePanelVisible(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount
  
  // Get Stacks context at the top level to avoid hooks order issues
  const stacksContext = useStacks();

  // Get user data for profile panel
  const pipelineUser = authUser || { name: "User", email: "" };
  const company = "Adrata"; // You can get this from workspace context if needed
  const workspace = "Adrata"; // You can get this from workspace context if needed
  const username = authUser?.name ? `@${authUser.name.toLowerCase().replace(/\s+/g, "")}` : "@user";
  
  // Determine current app based on pathname
  const getCurrentApp = () => {
    if (pathname.includes('/oasis')) return 'oasis';
    if (pathname.includes('/workshop') || pathname.includes('/workbench')) return 'workshop';
    if (pathname.includes('/adrata')) return 'adrata';
    if (pathname.includes('/stacks')) return 'stacks';
    return 'revenueos'; // Default to AcquisitionOS
  };
  const currentApp = getCurrentApp();

  // User detection for conditional left panel visibility
  const currentUserEmail = authUser?.email;
  const ADMIN_EMAILS = ['ross@adrata.com', 'todd@adrata.com'];
  const isAdminUser = ADMIN_EMAILS.includes(currentUserEmail || '');

  // Determine which left panel to show based on the current route
  const getLeftPanel = () => {
    // Check if this is a pipeline route (speedrun, leads, prospects, etc.)
    const isPipelineRoute = pathname.includes('/speedrun') || 
                            pathname.includes('/leads') || 
                            pathname.includes('/prospects') || 
                            pathname.includes('/opportunities') ||
                            pathname.includes('/people') ||
                            pathname.includes('/companies') ||
                            pathname.includes('/partners') ||
                            pathname.includes('/sellers') ||
                            pathname.includes('/customers') ||
                            pathname.includes('/stacks') ||
                            pathname.includes('/oasis') ||
                            pathname.includes('/workshop') ||
                            pathname.includes('/workbench');
    
    // Check for specific app routes FIRST (before generic /adrata check)
    // This ensures /adrata/oasis, /adrata/stacks, and /adrata/workshop get their proper left panels
    if (pathname.includes('/oasis')) {
      return <OasisLeftPanel key="oasis-left-panel" />;
    } else if (pathname.includes('/stacks')) {
      return <StacksLeftPanel activeSubSection={stacksContext?.activeSubSection || 'stacks'} onSubSectionChange={stacksContext?.onSubSectionChange || (() => {})} />;
    } else if (pathname.includes('/workshop') || pathname.includes('/workbench')) {
      return <WorkshopLeftPanel key="workshop-left-panel" />;
    } else if (pathname.includes('/adrata') && !isPipelineRoute) {
      // Only hide left panel for base /adrata chat route, not pipeline routes
      // Base Adrata chat route - minimal or null left panel since chat is in middle
      return null;
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

  // Check if this is a base /adrata route (not pipeline routes) - define early for use below
  const isBaseAdrataRoute = pathname.includes('/adrata') && 
                            !pathname.includes('/speedrun') && 
                            !pathname.includes('/leads') && 
                            !pathname.includes('/prospects') && 
                            !pathname.includes('/opportunities') &&
                            !pathname.includes('/people') &&
                            !pathname.includes('/companies') &&
                            !pathname.includes('/partners') &&
                            !pathname.includes('/sellers') &&
                            !pathname.includes('/customers') &&
                            !pathname.includes('/stacks') &&
                            !pathname.includes('/oasis') &&
                            !pathname.includes('/workshop') &&
                            !pathname.includes('/workbench');

  // Determine which right panel to show based on the current route
  const getRightPanel = () => {
    // Only base Adrata app shows conversation list - all other apps (including /adrata/oasis, /adrata/stacks) show AI chat
    if (pathname.includes('/pinpoint/adrata') || isBaseAdrataRoute) {
      // Base Adrata routes - show conversation list (chat conversations)
      return <ConversationsListGrouped />;
    } else if (pathname.includes('/stacks')) {
      // Stacks - show detail panel if item selected, otherwise AI chat
      if (stacksContext?.selectedItem) {
        return <StacksDetailPanel item={stacksContext.selectedItem} />;
      } else {
        return <RightPanel />; // AI chat for Stacks
      }
    } else {
      // All other apps (RevenueOS, Oasis, Workbench, /adrata/oasis, /adrata/stacks, etc.) - show AI chat
      return <RightPanel />;
    }
  };
  
  // Determine right panel visibility based on route
  const isRightPanelVisible = pathname.includes('/pinpoint/adrata') 
    ? true 
    : ui.isRightPanelVisible;

  // For /pinpoint/adrata route, always show profile panel and prevent closing
  const isPinpointAdrataRoute = pathname.includes('/pinpoint/adrata');
  
  // Get left panel visibility from UI context
  const isLeftPanelVisible = ui.isLeftPanelVisible;
  
  // Hide left panel for base Adrata routes (since chat is in middle panel)
  const shouldShowLeftPanel = !isBaseAdrataRoute && isLeftPanelVisible;
  
  // For base /adrata routes, automatically open profile panel
  useEffect(() => {
    if (isBaseAdrataRoute && !isProfilePanelVisible) {
      setIsProfilePanelVisible(true);
      // Set sessionStorage flag to keep it open
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('profilePanelShouldStayOpen', 'true');
      }
    }
  }, [isBaseAdrataRoute, isProfilePanelVisible, setIsProfilePanelVisible]);
  
  // Keep profile panel open when navigating between RevenueOS, Oasis, Workbench, and other apps
  // Check if we're on a route where profile panel should stay open
  const shouldKeepProfilePanelOpen = pathname.includes('/speedrun') || 
                                     pathname.includes('/oasis') || 
                                     pathname.includes('/workshop') || 
                                     pathname.includes('/workbench') || 
                                     pathname.includes('/adrata') ||
                                     pathname.includes('/stacks') ||
                                     pathname.includes('/grand-central') ||
                                     pathname.includes('/api');
  
  // Preserve profile panel state when navigating between these routes
  // Check sessionStorage to see if profile panel should stay open after navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const shouldStayOpen = sessionStorage.getItem('profilePanelShouldStayOpen') === 'true';
      if (shouldStayOpen && shouldKeepProfilePanelOpen) {
        // Restore profile panel visibility after navigation
        if (!isProfilePanelVisible) {
          setIsProfilePanelVisible(true);
        }
        // Clear the flag after restoring (with a small delay to ensure state is set)
        setTimeout(() => {
          sessionStorage.removeItem('profilePanelShouldStayOpen');
        }, 100);
      }
    }
  }, [pathname, shouldKeepProfilePanelOpen, isProfilePanelVisible, setIsProfilePanelVisible]);
  
  // Force profile panel visible for base Adrata routes and Pinpoint Adrata routes
  const forcedProfilePanelVisible = (isBaseAdrataRoute || isPinpointAdrataRoute) ? true : isProfilePanelVisible;

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
            isOpen={forcedProfilePanelVisible}
            onClose={(isBaseAdrataRoute || isPinpointAdrataRoute) ? () => {} : () => {
              // Clear sessionStorage flag when user manually closes the panel
              if (typeof window !== 'undefined') {
                sessionStorage.removeItem('profilePanelShouldStayOpen');
              }
              setIsProfilePanelVisible(false);
            }}
            username={username}
            currentApp={currentApp}
            userId={authUser?.id}
            userEmail={authUser?.email}
            onToggleLeftPanel={ui.toggleLeftPanel}
            hideCloseButton={isBaseAdrataRoute || isPinpointAdrataRoute}
          />
        }
        isProfilePanelVisible={forcedProfilePanelVisible}
        zoom={100}
        isLeftPanelVisible={shouldShowLeftPanel}
        isRightPanelVisible={isRightPanelVisible}
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
  const { user: authUser } = useUnifiedAuth();
  
  // Extract the current section from the pathname
  const getCurrentSection = () => {
    const segments = pathname.split('/').filter(Boolean);
    
    // Handle routes like /[workspace]/speedrun, /[workspace]/leads, etc.
    // The first segment is the workspace slug, the second is the section
    if (segments.length >= 2) {
      const section = segments[1];
      // Validate it's a known section
      const validSections = ['speedrun', 'leads', 'prospects', 'opportunities', 'companies', 'people', 'clients', 'partners', 'sellers', 'metrics', 'dashboard', 'chronicle', 'oasis', 'stacks', 'workshop', 'olympus', 'grand-central', 'tower', 'database', 'atrium', 'encode', 'particle', 'docs'];
      if (validSections.includes(section)) {
        return section;
      }
    }
    
    // Handle root workspace route - default to dashboard
    if (segments.length === 1) {
      return 'dashboard';
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
  
  // Get workspace name to determine initial visibility
  const activeWorkspace = authUser?.workspaces?.find(w => w['id'] === authUser.activeWorkspaceId);
  const workspaceName = activeWorkspace?.name || "";
  const isTopWorkspace = workspaceName?.toLowerCase().includes('top') || false;
  
  // State for left panel visibility controls
  const [isSpeedrunVisible, setIsSpeedrunVisible] = useState(true);
  const [isOpportunitiesVisible, setIsOpportunitiesVisible] = useState(true);
  const [isProspectsVisible, setIsProspectsVisible] = useState(true);
  const [isLeadsVisible, setIsLeadsVisible] = useState(true);
  const [isCustomersVisible, setIsCustomersVisible] = useState(false);
  // Hide partners for TOP workspaces by default
  const [isPartnersVisible, setIsPartnersVisible] = useState(!isTopWorkspace);


  // Oasis context state
  const [activeSection, setActiveSection] = useState<'channels' | 'direct-messages' | 'mentions' | 'starred' | 'archived' | 'settings'>('channels');
  const [selectedChannel, setSelectedChannel] = useState<any | null>(null);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [videoCallRoom, setVideoCallRoom] = useState<{ id: string; name: string } | null>(null);

  const oasisLayoutContextValue = {
    activeSection,
    setActiveSection,
    selectedChannel,
    setSelectedChannel,
    isVideoCallActive,
    setIsVideoCallActive,
    videoCallRoom,
    setVideoCallRoom
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
    <RevenueOSProvider>
      <FeatureAccessProvider>
        <ZoomProvider>
          <PipelineProvider>
            <StacksProvider>
              <SpeedrunDataProvider>
                <SprintProvider>
                  <OasisLayoutContext.Provider value={oasisLayoutContextValue}>
                    <OasisProvider>
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
                    </OasisProvider>
                  </OasisLayoutContext.Provider>
                </SprintProvider>
              </SpeedrunDataProvider>
            </StacksProvider>
          </PipelineProvider>
        </ZoomProvider>
      </FeatureAccessProvider>
    </RevenueOSProvider>
  );
}
