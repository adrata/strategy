"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { PanelLayout } from "@/platform/ui/components/layout/PanelLayout";
import { RightPanel } from "@/platform/ui/components/chat/RightPanel";
import { ProfilePanel } from "@/platform/ui/components/ProfilePanel";
import { ProfilePanelProvider, useProfilePanel } from "@/platform/ui/components/ProfilePanelContext";
import { useUnifiedAuth } from "@/platform/auth";
import { RevenueOSProvider, useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";

interface TestDriveLayoutProps {
  children: React.ReactNode;
}

// Inner component that uses the ProfilePanelContext
function TestDriveLayoutInner({ children }: TestDriveLayoutProps) {
  const { ui } = useRevenueOS();
  const { user: authUser } = useUnifiedAuth();
  const { isProfilePanelVisible, setIsProfilePanelVisible } = useProfilePanel();
  const pathname = usePathname();

  // Force profile panel visible for test-drive (cannot be minimized)
  useEffect(() => {
    if (!isProfilePanelVisible) {
      setIsProfilePanelVisible(true);
      // Set sessionStorage flag to keep it open
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('profilePanelShouldStayOpen', 'true');
      }
    }
  }, [isProfilePanelVisible, setIsProfilePanelVisible]);

  // Get user data for profile panel
  const profileUser = authUser || { name: "User", email: "" };
  const company = "Adrata";
  
  // Get actual workspace name from user's workspaces
  const workspace = React.useMemo(() => {
    const activeWorkspaceForProfile = authUser?.workspaces?.find(w => w['id'] === authUser.activeWorkspaceId);
    return activeWorkspaceForProfile?.name || "Adrata";
  }, [authUser?.workspaces, authUser?.activeWorkspaceId]);

  const username = authUser?.name ? `@${authUser.name.toLowerCase().replace(/\s+/g, "")}` : "@user";
  const currentApp = 'test-drive';

  return (
    <PanelLayout
      thinLeftPanel={null}
      leftPanel={null}
      middlePanel={children}
      rightPanel={<RightPanel />}
      profilePanel={
        <ProfilePanel
          user={profileUser}
          company={company}
          workspace={workspace}
          isOpen={true}
          onClose={() => {}}
          username={username}
          currentApp={currentApp}
          userId={authUser?.id}
          userEmail={authUser?.email}
          onToggleLeftPanel={ui.toggleLeftPanel}
          hideCloseButton={true}
        />
      }
      isProfilePanelVisible={true}
      zoom={100}
      isLeftPanelVisible={false}
      isRightPanelVisible={true}
      onToggleLeftPanel={ui.toggleLeftPanel}
      onToggleRightPanel={ui.toggleRightPanel}
    />
  );
}

export default function TestDriveLayout({ children }: TestDriveLayoutProps) {
  return (
    <RevenueOSProvider>
      <ProfilePanelProvider>
        <TestDriveLayoutInner>{children}</TestDriveLayoutInner>
      </ProfilePanelProvider>
    </RevenueOSProvider>
  );
}

