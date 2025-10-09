"use client";

import React, { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseIcon } from "@heroicons/react/24/outline";
import { useZoom } from "@/platform/ui/components/ZoomProvider";
import { PanelLayout } from "@/platform/ui/components/layout/PanelLayout";
import { ThinLeftPanel } from "@/platform/ui/components/layout/ThinLeftPanel";
import { ProfileBox } from "@/platform/ui/components/ProfileBox";
import { ThemePicker } from "@/platform/ui/components/ThemePicker";
import {
  ProfilePopupProvider,
  useProfilePopup,
} from "@/platform/ui/components/ProfilePopupContext";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { WorkspaceDataRouter } from "@/platform/services/workspace-data-router";
import { ACTION_PLATFORM_APPS } from "@/platform/config";
import { useUnifiedAuth } from "@/platform/auth";
import { AddModal } from "./AddModal";
import { SettingsModal } from "./SettingsModal";
import { RossWelcomeToast } from "@/platform/ui/components/RossWelcomeToast";
import { ConditionalSpeedrunProvider } from "./ConditionalSpeedrunProvider";
import { SpeedrunEngineModal } from "./SpeedrunEngineModal";
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
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
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
  } = useAcquisitionOS();

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
        
        if (context.isDemo) {
          setWorkspaceContext({
            workspaceName: "ZeroPoint",
            companyName: "ZeroPoint", 
            userDisplayName: "James Gold"
          });
        } else {
          // Determine workspace name based on user's active workspace
          const userWorkspaceId = authUser?.activeWorkspaceId || authUser?.workspaces?.[0]?.id;
          
                  const activeWorkspace = authUser?.workspaces?.find(w => w['id'] === userWorkspaceId);
        if (activeWorkspace) {
          setWorkspaceContext({
            workspaceName: activeWorkspace.name,
            companyName: activeWorkspace.name,
            userDisplayName: currentUser?.name || authUser?.name || ""
          });
          } else {
            setWorkspaceContext({
              workspaceName: "",
              companyName: "",
              userDisplayName: currentUser?.name || authUser?.name || ""
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

  // Get filtered and sorted apps
  const getDisplayApps = (): ActionPlatformApp[] => {
    if (appPreferences['length'] === 0) {
      return ACTION_PLATFORM_APPS;
    }

    // Filter out hidden apps and sort by order
    return appPreferences
      .filter((pref) => pref.isVisible)
      .sort((a, b) => a.order - b.order)
      .map((pref) => ACTION_PLATFORM_APPS.find((app) => app['id'] === pref.id))
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
                      setIsSettingsModalOpen(true);
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
                      zIndex: 1000,
                    }}
                  >
                    <ProfileBox
                      user={{
                        name: workspaceContext?.userDisplayName || currentUser?.name || "Dan Mirolli"
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
            <div className="h-full flex flex-col" style={{ marginTop: "-6px" }}>
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

        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
        />

        {/* Speedrun Engine Modal */}
        <SpeedrunEngineModal
          isOpen={isSpeedrunEngineModalOpen}
          onClose={() => setIsSpeedrunEngineModalOpen(false)}
        />
      </div>
    </ConditionalSpeedrunProvider>
  );
}

// Main exported component with ProfilePopupProvider
export function AcquisitionOSLayout({
  leftPanel,
  middlePanel,
  rightPanel,
  shouldShowLeftPanel,
  shouldShowThinLeftPanel,
}: AcquisitionOSLayoutProps) {
  return (
    <ProfilePopupProvider>
      <AcquisitionOSLayoutInner
        leftPanel={leftPanel}
        middlePanel={middlePanel}
        rightPanel={rightPanel}
        shouldShowLeftPanel={shouldShowLeftPanel}
        shouldShowThinLeftPanel={shouldShowThinLeftPanel}
      />
    </ProfilePopupProvider>
  );
}

// Legacy aliases for backwards compatibility
export const ActionPlatformLayout = AcquisitionOSLayout;
