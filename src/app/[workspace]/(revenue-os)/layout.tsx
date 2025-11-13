"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PanelLayout } from "@/platform/ui/components/layout/PanelLayout";
import { LeftPanel } from "@/products/pipeline/components/LeftPanel";
import { PartnerOSLeftPanel } from "@/products/partneros/components/PartnerOSLeftPanel";
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
import { OasisThreadView } from "@/products/oasis/components/OasisThreadView";
import { StacksLeftPanel } from "@/frontend/components/stacks/StacksLeftPanel";
import { StacksDetailPanel } from "@/products/stacks/components/StacksDetailPanel";
import { useStacks, StacksProvider } from "@/products/stacks/context/StacksProvider";
import { WorkbenchLeftPanel } from "@/app/[workspace]/workbench/components/WorkbenchLeftPanel";
import { InboxLeftPanel } from "@/products/inbox/components/InboxLeftPanel";
import { InboxProvider } from "@/products/inbox/context/InboxProvider";
import { useUnifiedAuth } from "@/platform/auth";
import { SettingsPopup } from "@/frontend/components/pipeline/SettingsPopup";
import { useSettingsPopup } from "@/platform/ui/components/SettingsPopupContext";
import { NovaBrowser } from "@/products/pipeline/components/NovaBrowser";
import { ProfilePanel } from "@/platform/ui/components/ProfilePanel";
import { ProfilePanelProvider, useProfilePanel } from "@/platform/ui/components/ProfilePanelContext";
import { FeatureAccessProvider } from "@/platform/ui/context/FeatureAccessProvider";
import { OasisProvider } from "@/products/oasis/context/OasisProvider";
import { OasisLayoutContext, useOasisLayout, type OasisLayoutContextType } from "@/products/oasis/context/OasisLayoutContext";

// Re-export useOasisLayout for backward compatibility
export { useOasisLayout };

// Wrapper component for sprint left panel that uses SprintContext
function SprintLeftPanelWrapper() {
  const { selectedRecord, setSelectedRecord, currentSprintIndex, setCurrentSprintIndex, completedRecords } = useSprint();

  // Update selected record in sprint context instead of navigating away
  const handleRecordSelect = (record: any) => {
    console.log('🔍 [SPRINT LEFT PANEL WRAPPER] handleRecordSelect called:', {
      recordId: record?.id,
      recordName: record?.name || record?.fullName,
      currentSelectedRecordId: selectedRecord?.id,
      willUpdate: record?.id !== selectedRecord?.id
    });
    setSelectedRecord(record);
    // Log after state update (will be logged on next render)
    setTimeout(() => {
      console.log('🔍 [SPRINT LEFT PANEL WRAPPER] State updated, new selectedRecord:', {
        newSelectedRecordId: record?.id,
        recordName: record?.name || record?.fullName
      });
    }, 0);
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
  
  // Get Stacks context at the top level to avoid hooks order issues
  const stacksContext = useStacks();
  
  // Check if this is a base /adrata route (not pipeline routes) - define early for use below
  const isBaseAdrataRoute = pathname.includes('/adrata') && 
                            !pathname.includes('/speedrun') && 
                            !pathname.includes('/leads') && 
                            !pathname.includes('/prospects') && 
                            !pathname.includes('/opportunities') &&
                            !pathname.includes('/people') &&
                            !pathname.includes('/companies') &&
                            !pathname.includes('/clients') &&
                            !pathname.includes('/partners') &&
                            !pathname.includes('/sellers') &&
                            !pathname.includes('/customers') &&
                            !pathname.includes('/stacks') &&
                            !pathname.includes('/oasis') &&
                            !pathname.includes('/inbox') &&
                            !pathname.includes('/workbench') &&
                            !pathname.includes('/workbench');
  
  // Get thread data from OasisLayoutContext if available
  // Use a hook-like pattern to ensure reactivity
  let threadData = null;
  let oasisLayoutContext: OasisLayoutContextType | undefined;
  try {
    oasisLayoutContext = useOasisLayout();
    threadData = oasisLayoutContext.threadData;
  } catch (error) {
    // Context not available (not in Oasis route), continue
    threadData = null;
  }
  
  // Debug logging for thread data changes
  useEffect(() => {
    if (pathname.includes('/oasis')) {
      console.log('🔍 [LAYOUT] Thread data state:', {
        hasThreadData: !!threadData,
        messageId: threadData?.messageId,
        threadMessagesCount: threadData?.threadMessages?.length || 0,
        contextAvailable: !!oasisLayoutContext
      });
    }
  }, [pathname, threadData, oasisLayoutContext]);
  
  // Memoize right panel to ensure it updates when threadData changes
  const rightPanel = React.useMemo(() => {
    // Check if thread view should be shown (for Oasis routes)
    if (pathname.includes('/oasis') && threadData) {
      return <OasisThreadView key={`thread-${threadData.messageId}`} />;
    }
    
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
    } else if (pathname.includes('/inbox')) {
      // Inbox - show AI chat
      return <RightPanel />;
    } else {
      // All other apps (RevenueOS, Oasis, Workbench, /adrata/oasis, /adrata/stacks, etc.) - show AI chat
      return <RightPanel />;
    }
  }, [pathname, threadData, isBaseAdrataRoute, stacksContext?.selectedItem]);
  
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

  // Get user data for profile panel
  const pipelineUser = authUser || { name: "User", email: "" };
  const company = "Adrata"; // You can get this from workspace context if needed
  
  // Get actual workspace name from user's workspaces to prevent flicker
  // Use useMemo to ensure stable value and prevent flicker during authUser updates
  const workspace = React.useMemo(() => {
    const activeWorkspaceForProfile = authUser?.workspaces?.find(w => w['id'] === authUser.activeWorkspaceId);
    return activeWorkspaceForProfile?.name || "Adrata"; // Use actual workspace name, fallback to "Adrata"
  }, [authUser?.workspaces, authUser?.activeWorkspaceId]);
  
  const username = authUser?.name ? `@${authUser.name.toLowerCase().replace(/\s+/g, "")}` : "@user";
  
  // Determine current app based on pathname
  const getCurrentApp = () => {
    if (pathname.includes('/oasis')) return 'oasis';
    if (pathname.includes('/workbench')) return 'workbench';
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
    // Also check for partneros/ prefix routes
    const isPipelineRoute = pathname.includes('/speedrun') || 
                            pathname.includes('/leads') || 
                            pathname.includes('/prospects') || 
                            pathname.includes('/opportunities') ||
                            pathname.includes('/people') ||
                            pathname.includes('/companies') ||
                            pathname.includes('/clients') ||
                            pathname.includes('/partners') ||
                            pathname.includes('/sellers') ||
                            pathname.includes('/customers') ||
                            pathname.includes('/stacks') ||
                            pathname.includes('/oasis') ||
                            pathname.includes('/workshop') ||
                            pathname.includes('/workbench') ||
                            pathname.includes('/partner-os/');
    
    // Check if we're in PartnerOS mode - prioritize URL check over sessionStorage
    // If URL has /partner-os/ prefix, it's PartnerOS; otherwise it's RevenueOS
    const isPartnerOSMode = typeof window !== 'undefined' && pathname.includes('/partner-os/');
    
    // Check for specific app routes FIRST (before generic /adrata check)
    // This ensures /adrata/oasis, /adrata/stacks, and /adrata/workshop get their proper left panels
    if (pathname.includes('/oasis')) {
      return <OasisLeftPanel key="oasis-left-panel" />;
    } else if (pathname.includes('/stacks')) {
      return <StacksLeftPanel activeSubSection={stacksContext?.activeSubSection || 'stacks'} onSubSectionChange={stacksContext?.onSubSectionChange || (() => {})} />;
    } else if (pathname.includes('/inbox')) {
      return <InboxLeftPanel key="inbox-left-panel" />;
    } else if (pathname.includes('/workbench')) {
      return <WorkbenchLeftPanel key="workbench-left-panel" />;
    } else if (pathname.includes('/adrata') && !isPipelineRoute) {
      // Only hide left panel for base /adrata chat route, not pipeline routes
      // Base Adrata chat route - minimal or null left panel since chat is in middle
      return null;
    } else if (pathname.includes('/speedrun/sprint')) {
      // Special left panel for sprint view - use SprintContext
      return <SprintLeftPanelWrapper />;
    } else if (isPartnerOSMode && isPipelineRoute) {
      // Show PartnerOS left panel when in PartnerOS mode
      return (
        <PartnerOSLeftPanel 
          key={`partneros-left-panel-${currentSection}`}
          activeSection={currentSection}
          onSectionChange={onSectionChange}
        />
      );
    } else {
      // Default to Pipeline left panel for other routes
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

  // Right panel is now memoized above to ensure reactivity to threadData changes
  
  // Determine right panel visibility based on route
  // Show right panel if thread is open, or based on route/UI state
  const isRightPanelVisible = pathname.includes('/pinpoint/adrata') 
    ? true 
    : (threadData !== null && pathname.includes('/oasis')) 
    ? true 
    : ui.isRightPanelVisible;

  // For /pinpoint/adrata route, always show profile panel and prevent closing
  const isPinpointAdrataRoute = pathname.includes('/pinpoint/adrata');
  
  // Get left panel visibility from UI context
  const isLeftPanelVisible = ui.isLeftPanelVisible;
  
  // Hide left panel for base Adrata routes (since chat is in middle panel)
  // Always show left panel for inbox routes
  const shouldShowLeftPanel = pathname.includes('/inbox') ? true : (!isBaseAdrataRoute && isLeftPanelVisible);
  
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

  // Ensure right panel is visible when thread is opened
  useEffect(() => {
    if (pathname.includes('/oasis') && threadData) {
      // Always ensure right panel is visible when threadData exists
      console.log('🔍 [LAYOUT] Thread data detected, ensuring right panel is visible:', {
        hasThreadData: !!threadData,
        messageId: threadData.messageId,
        threadMessagesCount: threadData.threadMessages?.length || 0,
        currentVisibility: ui.isRightPanelVisible
      });
      
      // Force right panel visible when thread data exists
      ui.setIsRightPanelVisible(true);
      
      // Double-check after a brief delay
      setTimeout(() => {
        if (!ui.isRightPanelVisible) {
          console.warn('⚠️ [LAYOUT] Right panel still not visible after timeout, forcing again');
          ui.setIsRightPanelVisible(true);
        }
      }, 50);
    } else if (pathname.includes('/oasis') && !threadData) {
      // If we're on Oasis but no thread data, check if right panel should be hidden
      // (but don't force hide, let UI state manage it)
      console.log('🔍 [LAYOUT] On Oasis route but no thread data');
    }
  }, [pathname, threadData, ui]);
  
  // Keep profile panel open when navigating between RevenueOS, Oasis, Workbench, and other apps
  // Check if we're on a route where profile panel should stay open
  const shouldKeepProfilePanelOpen = pathname.includes('/speedrun') || 
                                     pathname.includes('/oasis') || 
                                     pathname.includes('/workbench') || 
                                     pathname.includes('/workbench') || 
                                     pathname.includes('/adrata') ||
                                     pathname.includes('/stacks') ||
                                     pathname.includes('/inbox') ||
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
        rightPanel={rightPanel}
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
    // Also handle /[workspace]/partner-os/speedrun, /[workspace]/partner-os/leads, etc.
    // The first segment is the workspace slug, the second might be 'partner-os', third is the section
    if (segments.length >= 2) {
      let section = segments[1];
      
      // Check if second segment is 'partner-os', then use third segment as section
      if (section === 'partner-os' && segments.length >= 3) {
        section = segments[2];
        // Set PartnerOS mode in sessionStorage when detected from URL
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('activeSubApp', 'partneros');
        }
      } else {
        // If NOT in partner-os route, clear PartnerOS mode from sessionStorage
        // This ensures RevenueOS routes don't stay in PartnerOS mode
        if (typeof window !== 'undefined') {
          const currentActiveSubApp = sessionStorage.getItem('activeSubApp');
          // Only clear if we're navigating to a pipeline route (not other apps)
          const isPipelineSection = ['speedrun', 'leads', 'prospects', 'opportunities', 'companies', 'people', 'clients', 'partners', 'sellers'].includes(section);
          if (isPipelineSection && currentActiveSubApp === 'partneros') {
            sessionStorage.removeItem('activeSubApp');
          }
        }
      }
      
      // Validate it's a known section
      const validSections = ['speedrun', 'leads', 'prospects', 'opportunities', 'companies', 'people', 'clients', 'partners', 'sellers', 'metrics', 'dashboard', 'chronicle', 'oasis', 'stacks', 'inbox', 'workbench', 'olympus', 'grand-central', 'tower', 'database', 'atrium', 'encode', 'particle', 'docs'];
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
  const [threadData, setThreadData] = useState<{ messageId: string; threadMessages: any[]; parentMessageId: string | null; channelId: string | null; dmId: string | null } | null>(null);
  const [threadNavigationStack, setThreadNavigationStack] = useState<Array<{ messageId: string; parentMessageId: string | null; level: number }>>([]);

  const oasisLayoutContextValue = {
    activeSection,
    setActiveSection,
    selectedChannel,
    setSelectedChannel,
    isVideoCallActive,
    setIsVideoCallActive,
    videoCallRoom,
    setVideoCallRoom,
    threadData,
    setThreadData,
    threadNavigationStack,
    setThreadNavigationStack
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
    
    // Check if we're currently in PartnerOS mode (from URL or sessionStorage)
    // Only use PartnerOS mode if URL explicitly has partner-os/ prefix
    const isCurrentlyPartnerOS = typeof window !== 'undefined' && (
      pathname.includes('/partner-os/') || 
      sessionStorage.getItem('activeSubApp') === 'partneros'
    );
    
    // For PartnerOS mode, use partner-os/ prefix for partners section and related sections
    // For speedrun, leads, prospects - it's fine to keep them without prefix
    // But when viewing partners section, use partner-os/ prefix for all sections
    let targetSection = section;
    if (isCurrentlyPartnerOS && (section === 'partners' || section === 'speedrun' || section === 'leads' || section === 'prospects' || section === 'opportunities' || section === 'companies' || section === 'people')) {
      // Use partner-os/ prefix for partners section and related sections in PartnerOS mode
      targetSection = `partner-os/${section}`;
    }
    
    // Navigate using Next.js router for client-side navigation
    if (workspaceSlug) {
      router.push(`/${workspaceSlug}/${targetSection}`);
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
                      <InboxProvider>
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
                      </InboxProvider>
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
