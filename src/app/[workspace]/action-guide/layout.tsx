"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/platform/auth";
import { PanelLayout } from "@/platform/ui/components/layout/PanelLayout";
import { RightPanel } from "@/platform/ui/components/chat/RightPanel";
import { AcquisitionOSProvider, useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";
import { ActionGuideLeftPanel } from "./components/ActionGuideLeftPanel";
import { ActionGuideContextType, ActionGuidePage } from "./types/action-guide";

const ActionGuideContext = createContext<ActionGuideContextType | undefined>(undefined);

export const useActionGuide = () => {
  const context = useContext(ActionGuideContext);
  if (!context) {
    throw new Error('useActionGuide must be used within an ActionGuideProvider');
  }
  return context;
};

interface ActionGuideLayoutProps {
  children: React.ReactNode;
}

export default function ActionGuideLayout({ children }: ActionGuideLayoutProps) {
  const [selectedPage, setSelectedPage] = useState<ActionGuidePage | null>(null);
  const [activeSection, setActiveSection] = useState<string>('getting-started');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { user: authUser } = useUnifiedAuth();
  const router = useRouter();

  // Access control - restricted to dan, ross, and todd only
  useEffect(() => {
    if (!authUser?.email) {
      console.log('🚫 Action Guide: No user found - redirecting to login');
      router.push('/login');
      return;
    }

    // Check if user is authorized to access Action Guide
    const isAuthorized = ['ross@adrata.com', 'todd@adrata.com', 'dan@adrata.com'].includes(authUser.email);
    if (!isAuthorized) {
      console.log('🚫 Action Guide: Unauthorized access attempt by', authUser.email);
      // Redirect back to workspace
      const workspace = params.workspace as string;
      router.push(`/${workspace}`);
    }
  }, [authUser?.email, router, params.workspace]);

  // Don't render if not authenticated
  if (!authUser?.email) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">Authentication Required</h2>
          <p className="text-[var(--muted)]">Please log in to access the Action Guide.</p>
        </div>
      </div>
    );
  }

  // Check authorization
  const isAuthorized = ['ross@adrata.com', 'todd@adrata.com', 'dan@adrata.com'].includes(authUser.email);
  if (!isAuthorized) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">Access Denied</h2>
          <p className="text-[var(--muted)]">Action Guide access is restricted to authorized users only.</p>
        </div>
      </div>
    );
  }

  return (
    <ActionGuideContext.Provider value={{
      selectedPage,
      setSelectedPage,
      activeSection,
      setActiveSection,
      searchQuery,
      setSearchQuery
    }}>
      <AcquisitionOSProvider>
        <ZoomProvider>
          <ProfilePopupProvider>
            <ActionGuideLayoutContent>
              {children}
            </ActionGuideLayoutContent>
          </ProfilePopupProvider>
        </ZoomProvider>
      </AcquisitionOSProvider>
    </ActionGuideContext.Provider>
  );
}

function ActionGuideLayoutContent({ children }: { children: React.ReactNode }) {
  const { ui } = useAcquisitionOS();

  return (
    <PanelLayout
      leftPanel={<ActionGuideLeftPanel />}
      middlePanel={children}
      rightPanel={<RightPanel />}
      isLeftPanelVisible={ui.isLeftPanelVisible}
      isRightPanelVisible={ui.isRightPanelVisible}
      onToggleLeftPanel={ui.toggleLeftPanel}
      onToggleRightPanel={ui.toggleRightPanel}
    />
  );
}
