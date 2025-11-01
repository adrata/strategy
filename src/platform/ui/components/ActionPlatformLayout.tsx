"use client";

import React, { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  BriefcaseIcon,
  PaperAirplaneIcon,
  FunnelIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  Squares2X2Icon,
  DocumentIcon,
  ChartBarIcon,
  PresentationChartBarIcon,
  SparklesIcon,
  CommandLineIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { useZoom } from "@/platform/ui/components/ZoomProvider";
import { PanelLayout } from "@/platform/ui/components/layout/PanelLayout";
import { ThinLeftPanel } from "@/platform/ui/components/layout/ThinLeftPanel";
import { ProfileBox } from "@/platform/ui/components/ProfileBox";
import { ThemePicker } from "@/platform/ui/components/ThemePicker";
import {
  ProfilePopupProvider,
  useProfilePopup,
} from "@/platform/ui/components/ProfilePopupContext";
import { useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
import { WorkspaceDataRouter } from "@/platform/services/workspace-data-router";
import { ACTION_PLATFORM_APPS } from "@/platform/config";
import { useUnifiedAuth } from "@/platform/auth";
import { getFilteredSectionsForWorkspace } from "@/platform/utils/section-filter";
import { AddModal } from "./AddModal";
// import { SettingsModal } from "./SettingsModal"; // Deprecated, using SettingsPopup instead
import { RossWelcomeToast } from "@/platform/ui/components/RossWelcomeToast";
import { ConditionalSpeedrunProvider } from "./ConditionalSpeedrunProvider";
import { SpeedrunEngineModal } from "./SpeedrunEngineModal";
import { SettingsPopup } from "@/frontend/components/pipeline/SettingsPopup";
import { SettingsPopupProvider, useSettingsPopup } from "./SettingsPopupContext";
import type { ActionPlatformApp } from "../../types";

interface AcquisitionOSLayoutProps {
  leftPanel: React.ReactNode;
  middlePanel: React.ReactNode;
  rightPanel: React.ReactNode;
  shouldShowLeftPanel: boolean;
  shouldShowThinLeftPanel?: boolean;
}

interface AppPreference {
  id: string;
  isVisible: boolean;
  order: number;
}

// Inner component that uses ProfilePopupContext
function AcquisitionOSLayoutInner({
  leftPanel,
  middlePanel,
  rightPanel,
  shouldShowLeftPanel,
  shouldShowThinLeftPanel = true,
}: AcquisitionOSLayoutProps) {
  const router = useRouter();
  const { zoom } = useZoom();
  const { isSettingsOpen, setIsSettingsOpen } = useSettingsPopup();
  // const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); // Deprecated
  const [isSpeedrunEngineModalOpen, setIsSpeedrunEngineModalOpen] = useState(false);
  const [appPreferences, setAppPreferences] = useState<AppPreference[]>([]);
  const [lastActiveSections, setLastActiveSections] = useState<
    Record<string, string>
  >({});

  // Use centralized profile popup context
  const {
    isProfileOpen,
    setIsProfileOpen,
    profileAnchor,
    setProfileAnchor,
    profilePopupRef,
    openProfilePopup,
    closeAllPopups,
  } = useProfilePopup();

  const {
    ui: {
      activeSubApp,
      activeSection,
      setActiveSubApp,
      setActiveSection,
      isLeftPanelVisible,
      isRightPanelVisible,
      isThemeModalOpen,
      setIsThemeModalOpen,
      toggleRightPanel,
      toggleLeftPanel,
      detailViewType,
    },
  } = useRevenueOS();

  // Left panel visibility - allow all apps to show left panel
  const effectiveLeftPanelVisible = shouldShowLeftPanel;

  // Get current user for profile - use unified auth directly
  const { user: authUser } = useUnifiedAuth();
  const currentUser = authUser || {
    name: "Dan Mirolli",
    email: "dan@adrata.com",
  }; // Fallback to Dan
  
  // Dynamic workspace context - import the workspace data router
  const [workspaceContext, setWorkspaceContext] = useState<{
    workspaceName: string;
    companyName: string;
    userDisplayName: string;
    userFirstName?: string;
    userLastName?: string;
  } | null>(null);
  
  // Optimized workspace context loading - NO FALLBACK DATA
  useEffect(() => {
    // Don't set fallback data - wait for real data to avoid UI flashing
    // const userWorkspaceId = authUser?.activeWorkspaceId || authUser?.workspaces?.[0]?.id;
    // const activeWorkspace = authUser?.workspaces?.find(w => w['id'] === userWorkspaceId);
    // const defaultContext = {
    //   workspaceName: activeWorkspace?.name || "",
    //   companyName: activeWorkspace?.name || "", 
    //   userDisplayName: currentUser?.name || authUser?.name || ""
    // };
    // setWorkspaceContext(defaultContext);

    // Load actual context in background (non-blocking)
    const loadWorkspaceContext = async () => {
      try {
        const context = await WorkspaceDataRouter.getWorkspaceContext();
        
        // Fetch user profile data for firstName and lastName
        let userProfile = null;
        if (authUser?.id) {
          try {
            const response = await fetch('/api/settings/user', {
              credentials: 'include'
            });
            
            if (response.ok) {
              const data = await response.json();
              console.log('🔍 ActionPlatformLayout: User profile data fetched:', {
                success: data.success,
                firstName: data.settings?.firstName,
                lastName: data.settings?.lastName,
                name: authUser?.name
              });
              if (data.success && data.settings) {
                userProfile = {
                  firstName: data.settings.firstName,
                  lastName: data.settings.lastName
                };
              }
            }
          } catch (error) {
            console.error('Failed to fetch user profile:', error);
          }
        }
        
        if (context.isDemo) {
          setWorkspaceContext({
            workspaceName: "ZeroPoint",
            companyName: "ZeroPoint", 
            userDisplayName: "James Gold",
            userFirstName: userProfile?.firstName,
            userLastName: userProfile?.lastName
          });
        } else {
          // Determine workspace name based on user's active workspace
          const userWorkspaceId = authUser?.activeWorkspaceId || authUser?.workspaces?.[0]?.id;
          
                  const activeWorkspace = authUser?.workspaces?.find(w => w['id'] === userWorkspaceId);
        if (activeWorkspace) {
          setWorkspaceContext({
            workspaceName: activeWorkspace.name,
            companyName: activeWorkspace.name,
            userDisplayName: currentUser?.name || authUser?.name || "",
            userFirstName: userProfile?.firstName,
            userLastName: userProfile?.lastName
          });
          } else {
            setWorkspaceContext({
              workspaceName: "",
              companyName: "",
              userDisplayName: currentUser?.name || authUser?.name || "",
              userFirstName: userProfile?.firstName,
              userLastName: userProfile?.lastName
            });
          }
        }
      } catch (error) {
        console.warn("Workspace context loading failed, using defaults:", error);
        // Keep default context set above
      }
    };
    
    // Load asynchronously without blocking UI
    loadWorkspaceContext();
  }, [currentUser?.name, authUser?.activeWorkspaceId, authUser?.workspaces]);
  
  const company = workspaceContext?.companyName || "Adrata";
  const workspace = workspaceContext?.workspaceName || "Adrata";
  const username = currentUser?.name
    ? `@${currentUser.name.toLowerCase().replace(/\s+/g, "")}`
    : "@dan";

  // Get current app info
  const getCurrentSubApp = () =>
    ACTION_PLATFORM_APPS.find((app) => app['id'] === activeSubApp) ||
    ACTION_PLATFORM_APPS[0];
  const currentSubApp = getCurrentSubApp();
  const brandColor = currentSubApp?.color || "#2563EB";

  // Helper function for initials
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 3);
  };

  // Handle profile click using centralized context
  const handleThinPanelProfileClick = (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    console.log('🔘 Profile clicked in ThinLeftPanel!', { 
      isProfileOpen, 
      profileAnchor, 
      currentUser: !!currentUser,
      authUser: !!authUser 
    });
    e.preventDefault();
    e.stopPropagation();
    
    if (isProfileOpen) {
      console.log('🔒 Closing profile popup');
      closeAllPopups();
    } else {
      console.log('🔓 Opening profile popup with anchor:', e.currentTarget);
      console.log('🔍 Profile popup conditions:', {
        isProfileOpen: isProfileOpen,
        profileAnchor: !!profileAnchor,
        currentUser: !!currentUser,
        willRender: isProfileOpen && profileAnchor && currentUser
      });
      openProfilePopup(e.currentTarget);
    }
  };

  // Listen for theme modal events
  useEffect(() => {
    // Fallback handler for force-theme-modal-open event
    const handleForceThemeModal = () => {
      console.log(
        "🎨 ActionPlatformLayout: Received force-theme-modal-open event",
      );
      setIsThemeModalOpen(true);
    };

    // Always listen for the fallback event
    window.addEventListener("force-theme-modal-open", handleForceThemeModal);

    return () => {
      window.removeEventListener(
        "force-theme-modal-open",
        handleForceThemeModal,
      );
    };
  }, [setIsThemeModalOpen]);

  // Optimized app preferences loading - non-blocking
  useEffect(() => {
    // Fast path - set empty array immediately for UI responsiveness
    setAppPreferences([]);

    // Load preferences asynchronously
    const loadAppPreferences = () => {
      try {
        const savedPreferences = localStorage.getItem("aos-app-preferences");
        if (savedPreferences) {
          const parsed = JSON.parse(savedPreferences);
          
          // Simple migration check
          const currentAppIds = ACTION_PLATFORM_APPS.map(app => app.id);
          const savedAppIds = parsed.map((pref: AppPreference) => pref.id);
          const missingApps = currentAppIds.filter(id => !savedAppIds.includes(id));
          
          if (missingApps.length > 0) {
            const updatedPreferences = [...parsed];
            const maxOrder = Math.max(...parsed.map((p: AppPreference) => p.order), -1);
            
            missingApps.forEach((appId, index) => {
              updatedPreferences.push({
                id: appId,
                isVisible: true,
                order: maxOrder + 1 + index
              });
            });
            
            localStorage.setItem("aos-app-preferences", JSON.stringify(updatedPreferences));
            setAppPreferences(updatedPreferences);
          } else {
            setAppPreferences(parsed);
          }
        }
      } catch (error) {
        console.warn("App preferences loading failed, using defaults:", error);
        setAppPreferences([]);
      }
    };

    // Load asynchronously without blocking UI
    setTimeout(loadAppPreferences, 0);

    // Listen for app preferences updates
    const handleAppPreferencesUpdate = (event: CustomEvent) => {
      if (event.detail) {
        setAppPreferences(event.detail);
      } else {
        setAppPreferences([]);
      }
    };

    window.addEventListener(
      "aos-apps-updated",
      handleAppPreferencesUpdate as EventListener,
    );

    return () => {
      window.removeEventListener(
        "aos-apps-updated",
        handleAppPreferencesUpdate as EventListener,
      );
    };
  }, []);

  // Track last active section for each app
  useEffect(() => {
    if (activeSubApp && activeSection) {
      setLastActiveSections((prev) => ({
        ...prev,
        [activeSubApp]: activeSection,
      }));
    }
  }, [activeSubApp, activeSection]);

  // Get filtered and sorted apps - include all platform apps for admin users
  const getDisplayApps = (): ActionPlatformApp[] => {
    // Get workspace context for section filtering
    const workspaceSlug = workspaceContext?.workspaceName || authUser?.activeWorkspaceId || 'default';
    
    // For admin users, show all platform apps from ThinLeftPanel
    const isAdminUser = authUser?.email && ['ross@adrata.com', 'todd@adrata.com', 'dan@adrata.com'].includes(authUser.email);
    
    if (isAdminUser) {
      // Import platformApps from ThinLeftPanel and convert to ActionPlatformApp format
      const allPlatformApps: ActionPlatformApp[] = [
        { id: "Speedrun", name: "Speedrun", description: "Take better action.", icon: PaperAirplaneIcon, color: "#6B7280", sections: ["inbox", "prospects", "leads", "pipeline", "analytics", "settings"] },
        { id: "pipeline", name: "Pipeline", description: "Win major deals.", icon: FunnelIcon, color: "#059669", sections: ["speedrun", "chronicle", "opportunities", "leads", "prospects", "clients", "partners", "companies", "people", "metrics"] },
        { id: "monaco", name: "Monaco", description: "Make connections.", icon: UserGroupIcon, color: "#7C3AED", sections: ["companies", "people", "sellers", "sequences", "analytics"] },
        { id: "stacks", name: "Stacks", description: "Product + Engineering collaboration.", icon: Squares2X2Icon, color: "#7C3AED", sections: ["stacks", "backlog", "epics", "stories", "bugs"] },
        { id: "workshop", name: "Workshop", description: "Document collaboration & management.", icon: DocumentIcon, color: "#10B981", sections: ["documents", "templates", "shared"] },
        { id: "tower", name: "Tower", description: "Operations control center.", icon: ChartBarIcon, color: "#8B5CF6", sections: ["operations", "control", "optimization"] },
        { id: "grand-central", name: "Grand Central", description: "Integration hub & workflow automation.", icon: Cog6ToothIcon, color: "#8B5CF6", sections: ["integrations", "automation", "workflows"] },
        { id: "olympus", name: "Olympus", description: "Workflow orchestration & execution.", icon: PresentationChartBarIcon, color: "#DC2626", sections: ["workflows", "orchestration", "execution"] },
        { id: "particle", name: "Particle", description: "A/B testing & experimentation platform.", icon: SparklesIcon, color: "#F59E0B", sections: ["testing", "experimentation", "analytics"] },
        { id: "encode", name: "Encode", description: "Code editor & development environment.", icon: CommandLineIcon, color: "#0891B2", sections: ["code", "development", "editor"] },
        { id: "database", name: "Database", description: "Database management & query interface.", icon: TableCellsIcon, color: "#059669", sections: ["database", "queries", "management"] },
        { id: "settings", name: "Settings", description: "Configure your workspace.", icon: Cog6ToothIcon, color: "#6B7280", sections: ["apps", "preferences"] },
      ];
      
      // Apply section filtering for admin users too (based on workspace)
      const filteredApps = allPlatformApps.map(app => ({
        ...app,
        sections: getFilteredSectionsForWorkspace({
          workspaceSlug,
          appId: app.id
        })
      }));
      
      if (appPreferences['length'] === 0) {
        return filteredApps;
      }

      // Filter out hidden apps and sort by order
      return appPreferences
        .filter((pref) => pref.isVisible)
        .sort((a, b) => a.order - b.order)
        .map((pref) => filteredApps.find((app) => app['id'] === pref.id))
        .filter(Boolean) as ActionPlatformApp[];
    }

    // For non-admin users, apply section filtering to ACTION_PLATFORM_APPS
    const filteredApps = ACTION_PLATFORM_APPS.map(app => ({
      ...app,
      sections: getFilteredSectionsForWorkspace({
        workspaceSlug,
        appId: app.id
      })
    }));

    if (appPreferences['length'] === 0) {
      return filteredApps;
    }

    // Filter out hidden apps and sort by order
    return appPreferences
      .filter((pref) => pref.isVisible)
      .sort((a, b) => a.order - b.order)
      .map((pref) => filteredApps.find((app) => app['id'] === pref.id))
      .filter(Boolean) as ActionPlatformApp[];
  };

  return (
    <ConditionalSpeedrunProvider>
      <div
        style={{
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <PanelLayout
          thinLeftPanel={
            shouldShowThinLeftPanel ? (
              <>
                <ThinLeftPanel
                  apps={getDisplayApps().map((app) => ({
                    name: app.name,
                    slug: app.id,
                    icon: app.icon,
                  }))}
                  activeApp={activeSubApp}
                  workspaceId={workspaceContext?.workspaceName?.toLowerCase() || authUser?.activeWorkspaceId}
                  workspace={workspaceContext?.workspaceName || workspace}
                  onAppClick={(slug: string) => {
                    console.log("🔥 ThinLeftPanel: onAppClick called with slug =", slug);
                    
                    if (slug === "settings") {
                      setIsSettingsOpen(true); // Use SettingsPopup instead
                      return;
                    }

                    // LIGHTNING-FAST CLIENT-SIDE NAVIGATION (like Stripe)
                    // Update state immediately for instant UI response
                    console.log("🔥 ThinLeftPanel: Setting activeSubApp to", slug);
                    setActiveSubApp(slug);
                    const selectedApp = ACTION_PLATFORM_APPS.find(
                      (app) => app['id'] === slug,
                    );
                    
                    let targetSection = "";
                    if (selectedApp && selectedApp.sections.length > 0) {
                      targetSection = selectedApp['sections'][0] || "";
                      setActiveSection(targetSection);
                    } else {
                      setActiveSection("");
                    }

                    // Navigate to proper route using Next.js router - UNIFIED AOS STRUCTURE
                    let newUrl = "";
                    if (slug === "pipeline") {
                      // For pipeline, remember last visited section or default to leads
                      const lastPipelineSection = localStorage.getItem("pipeline_last_section") || "leads";
                      const section = lastPipelineSection || "leads";
                      newUrl = `/aos/${section}`;
                      console.log(`🚀 [PIPELINE] Navigation: Using last section '${section}' in AOS`);
                    } else if (slug === "monaco") {
                      newUrl = `/aos/monaco`;
                    } else if (slug === "Speedrun") {
                      newUrl = `/aos/speedrun`;
                      console.log("🔥 ThinLeftPanel: Navigating to Speedrun at", newUrl);
                    } else {
                      // Use AOS structure for all apps
                      newUrl = `/aos/${slug}`;
                    }

                    console.log("🔥 ThinLeftPanel: About to navigate to", newUrl);
                    // Use Next.js router for proper navigation
                    router.push(newUrl);
                  }}
                  profile={{
                    name: workspaceContext?.userDisplayName || currentUser?.name || "User",
                    initial: getInitials(workspaceContext?.userDisplayName || currentUser?.name),
                  }}
                  onProfileClick={handleThinPanelProfileClick}
                  currentAppName="Action Platform"
                  currentAppIcon={BriefcaseIcon}
                  currentPlatformApp="aos"
                />
                {console.log("🔥 ActionPlatformLayout: activeSubApp =", activeSubApp)}
                {isProfileOpen && profileAnchor && currentUser && (
                  <div
                    ref={profilePopupRef}
                    style={{
                      position: "fixed",
                      left: profileAnchor.getBoundingClientRect().left,
                      bottom:
                        window.innerHeight -
                        profileAnchor.getBoundingClientRect().top +
                        10, // Position above profile icon
                      zIndex: 9999,
                    }}
                  >
                    <ProfileBox
                      user={{
                        name: workspaceContext?.userDisplayName || currentUser?.name || "Dan Mirolli",
                        firstName: workspaceContext?.userFirstName,
                        lastName: workspaceContext?.userLastName
                      }}
                      company={company}
                      workspace={workspace}
                      username={username}
                      isProfileOpen={isProfileOpen}
                      setIsProfileOpen={setIsProfileOpen}
                      onThemesClick={() => {
                        console.log(
                          "🎨🔥 ActionPlatformLayout: onThemesClick callback triggered!",
                        );
                        console.log(
                          "🎨 ActionPlatformLayout: Current isThemeModalOpen:",
                          isThemeModalOpen,
                        );
                        console.log(
                          "🎨 ActionPlatformLayout: Current isProfileOpen:",
                          isProfileOpen,
                        );

                        closeAllPopups();
                        console.log(
                          "🎨 ActionPlatformLayout: Profile closed, now opening theme modal...",
                        );

                        setIsThemeModalOpen(true);
                        console.log(
                          "🎨 ActionPlatformLayout: Theme modal should now be open - isThemeModalOpen set to true",
                        );
                      }}
                      onSpeedrunEngineClick={() => {
                        console.log(
                          "⚡ ActionPlatformLayout: Speedrun Engine clicked - opening modal",
                        );
                        closeAllPopups();
                        setIsSpeedrunEngineModalOpen(true);
                      }}
                    />
                  </div>
                )}
              </>
            ) : null
          }
          leftPanel={effectiveLeftPanelVisible ? leftPanel : null}
          middlePanel={
            <div className="h-full flex flex-col">
              {middlePanel}
            </div>
          }
          rightPanel={
            isRightPanelVisible && detailViewType !== "report"
              ? rightPanel
              : null
          }
          zoom={zoom}
          isLeftPanelVisible={effectiveLeftPanelVisible}
          isRightPanelVisible={
            isRightPanelVisible && detailViewType !== "report"
          }
          accentColor={brandColor}
          onToggleRightPanel={toggleRightPanel}
          onToggleLeftPanel={toggleLeftPanel}
        />

        {/* Theme Modal */}
        {(() => {
          console.log(
            "🎨 ActionPlatformLayout: Checking theme modal render condition:",
            {
              isThemeModalOpen,
              shouldRender: !!isThemeModalOpen,
            },
          );
          return isThemeModalOpen;
        })() && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            style={{ zIndex: 9999 }}
            onClick={() => {
              console.log(
                "🎨 ActionPlatformLayout: Theme modal backdrop clicked - closing modal",
              );
              setIsThemeModalOpen(false);
            }}
          >
            <div
              className="bg-[var(--background)] rounded-2xl border border-[var(--border)] shadow-2xl p-6 w-full max-w-md"
              style={{ zIndex: 10000 }}
              onClick={(e) => {
                console.log(
                  "🎨 ActionPlatformLayout: Theme modal content clicked - preventing close",
                );
                e.stopPropagation();
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[var(--foreground)]">
                  Theme Settings
                </h2>
                <button
                  onClick={() => {
                    console.log(
                      "🎨 ActionPlatformLayout: Theme modal X button clicked - closing modal",
                    );
                    setIsThemeModalOpen(false);
                  }}
                  className="p-2 hover:bg-[var(--hover-bg)] rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              <ThemePicker />
            </div>
          </div>
        )}

        {/* Add Modal */}
        <AddModal />

        {/* Settings Modal - Deprecated, using SettingsPopup instead */}
        {/* <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
        /> */}

        {/* Speedrun Engine Modal */}
        <SpeedrunEngineModal
          isOpen={isSpeedrunEngineModalOpen}
          onClose={() => setIsSpeedrunEngineModalOpen(false)}
        />

        {/* Settings Popup */}
        <SettingsPopup
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </div>
    </ConditionalSpeedrunProvider>
  );
}

// Main exported component with ProfilePopupProvider and SettingsPopupProvider
export function AcquisitionOSLayout({
  leftPanel,
  middlePanel,
  rightPanel,
  shouldShowLeftPanel,
  shouldShowThinLeftPanel,
}: AcquisitionOSLayoutProps) {
  return (
    <ProfilePopupProvider>
      <SettingsPopupProvider>
        <AcquisitionOSLayoutInner
          leftPanel={leftPanel}
          middlePanel={middlePanel}
          rightPanel={rightPanel}
          shouldShowLeftPanel={shouldShowLeftPanel}
          shouldShowThinLeftPanel={shouldShowThinLeftPanel}
        />
      </SettingsPopupProvider>
    </ProfilePopupProvider>
  );
}

// Legacy aliases for backwards compatibility
export const ActionPlatformLayout = AcquisitionOSLayout;
