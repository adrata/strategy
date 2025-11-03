"use client";

import React, { createContext, useContext, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PanelLayout } from "@/platform/ui/components/layout/PanelLayout";
import { RevenueOSProvider, useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";
import { SettingsPopupProvider } from "@/platform/ui/components/SettingsPopupContext";
import { ProfilePanelProvider, useProfilePanel } from "@/platform/ui/components/ProfilePanelContext";
import { ApiLeftPanel } from "./components/ApiLeftPanel";
import { RightPanel } from "@/platform/ui/components/chat/RightPanel";
import { ProfilePanel } from "@/platform/ui/components/ProfilePanel";
import { useUnifiedAuth } from "@/platform/auth";
import { useParams } from "next/navigation";
import { getWorkspaceBySlug } from "@/platform/config/workspace-mapping";

const queryClient = new QueryClient();

interface ApiContextType {
  selectedKey: string | null;
  setSelectedKey: (key: string | null) => void;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within ApiProvider');
  }
  return context;
};

interface ApiLayoutProps {
  children: React.ReactNode;
}

export default function ApiLayout({ children }: ApiLayoutProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <ApiContext.Provider value={{ 
        selectedKey, 
        setSelectedKey
      }}>
        <RevenueOSProvider>
          <ZoomProvider>
            <ProfilePopupProvider>
              <SettingsPopupProvider>
                <ProfilePanelProvider>
                  <ApiLayoutContent>
                    {children}
                  </ApiLayoutContent>
                </ProfilePanelProvider>
              </SettingsPopupProvider>
            </ProfilePopupProvider>
          </ZoomProvider>
        </RevenueOSProvider>
      </ApiContext.Provider>
    </QueryClientProvider>
  );
}

// Layout content component that can use context hooks
function ApiLayoutContent({ children }: { children: React.ReactNode }) {
  const { ui } = useRevenueOS();
  const { isProfilePanelVisible, setIsProfilePanelVisible } = useProfilePanel();
  const { user: authUser } = useUnifiedAuth();
  const params = useParams();
  const workspace = params.workspace as string;
  
  // Get workspace data
  const workspaceData = getWorkspaceBySlug(workspace);
  const company = workspaceData?.name || workspace;
  
  // Get user data
  const user = {
    name: authUser?.name || 'User',
    firstName: undefined,
    lastName: undefined,
  };

  return (
    <PanelLayout
      thinLeftPanel={null}
      leftPanel={<ApiLeftPanel />}
      middlePanel={children}
      rightPanel={<RightPanel />}
      profilePanel={
        <ProfilePanel
          user={user}
          company={company}
          workspace={workspace}
          isOpen={isProfilePanelVisible}
          onClose={() => setIsProfilePanelVisible(false)}
          currentApp="api-keys"
          userId={authUser?.id}
          userEmail={authUser?.email}
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
  );
}

