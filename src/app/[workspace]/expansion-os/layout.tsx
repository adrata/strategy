"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { PanelLayout } from "@/platform/ui/components/layout/PanelLayout";
import { LeftPanel } from "@/products/pipeline/components/LeftPanel";
import { RightPanel } from "@/platform/ui/components/chat/RightPanel";
import { ConversationsListGrouped } from "@/platform/ui/components/chat/ConversationsListGrouped";
import { RevenueOSProvider } from "@/platform/ui/context/RevenueOSProvider";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { PipelineProvider } from "@/products/pipeline/context/PipelineContext";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";
import { SettingsPopupProvider } from "@/platform/ui/components/SettingsPopupContext";
import { SpeedrunDataProvider } from "@/platform/services/speedrun-data-context";
import { ProfilePanel } from "@/platform/ui/components/ProfilePanel";
import { ProfilePanelProvider, useProfilePanel } from "@/platform/ui/components/ProfilePanelContext";
import { FeatureAccessProvider } from "@/platform/ui/context/FeatureAccessProvider";
import { OSProvider } from "@/platform/context/OSContext";

interface ExpansionOSLayoutProps {
  children: React.ReactNode;
}

function ExpansionOSLayoutInner({ 
  children, 
  currentSection,
  onSectionChange,
}: {
  children: React.ReactNode;
  currentSection: string;
  onSectionChange: (section: string) => void;
}) {
  const { ui } = useProfilePanel();

  return (
    <PanelLayout
      leftPanel={
        <LeftPanel
          currentSection={currentSection}
          onSectionChange={onSectionChange}
          osType="expansion"
        />
      }
      rightPanel={
        <RightPanel>
          <ConversationsListGrouped />
        </RightPanel>
      }
      showRightPanel={ui.showRightPanel}
      showLeftPanel={ui.showLeftPanel}
    >
      {children}
      <ProfilePanel />
    </PanelLayout>
  );
}

export default function ExpansionOSLayout({ children }: ExpansionOSLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Extract the current section from the pathname
  const getCurrentSection = () => {
    const segments = pathname.split('/').filter(Boolean);
    
    // Handle routes like /[workspace]/expansion-os/prospects, etc.
    if (segments.length >= 3 && segments[1] === 'expansion-os') {
      const section = segments[2];
      const validSections = ['prospects', 'opportunities', 'people', 'companies'];
      if (validSections.includes(section)) {
        return section;
      }
    }
    
    return 'prospects'; // Default section
  };

  const currentSection = getCurrentSection();
  
  // Handle section changes with proper navigation
  const handleSectionChange = (section: string) => {
    const segments = pathname.split('/').filter(Boolean);
    const workspaceSlug = segments[0];
    
    if (workspaceSlug) {
      router.push(`/${workspaceSlug}/expansion-os/${section}`);
    }
  };

  return (
    <OSProvider osType="expansion">
      <RevenueOSProvider>
        <FeatureAccessProvider>
          <ZoomProvider>
            <PipelineProvider>
              <SpeedrunDataProvider>
                <ProfilePopupProvider>
                  <SettingsPopupProvider>
                    <ProfilePanelProvider>
                      <ExpansionOSLayoutInner
                        currentSection={currentSection}
                        onSectionChange={handleSectionChange}
                      >
                        {children}
                      </ExpansionOSLayoutInner>
                    </ProfilePanelProvider>
                  </SettingsPopupProvider>
                </ProfilePopupProvider>
              </SpeedrunDataProvider>
            </PipelineProvider>
          </ZoomProvider>
        </FeatureAccessProvider>
      </RevenueOSProvider>
    </OSProvider>
  );
}

