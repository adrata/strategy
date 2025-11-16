"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PanelLayout } from "@/platform/ui/components/layout/PanelLayout";
import { LeftPanel } from "@/products/pipeline/components/LeftPanel";
import { RightPanel } from "@/platform/ui/components/chat/RightPanel";
import { ConversationsListGrouped } from "@/platform/ui/components/chat/ConversationsListGrouped";
import { SpeedrunSprintLeftPanel } from "@/frontend/components/pipeline/SpeedrunSprintLeftPanel";
import { SprintProvider, useSprint } from "@/frontend/components/pipeline/SprintContext";
import { RevenueOSProvider } from "@/platform/ui/context/RevenueOSProvider";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { PipelineProvider } from "@/products/pipeline/context/PipelineContext";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";
import { SettingsPopupProvider } from "@/platform/ui/components/SettingsPopupContext";
import { SpeedrunDataProvider } from "@/platform/services/speedrun-data-context";
import { useUnifiedAuth } from "@/platform/auth";
import { ProfilePanel } from "@/platform/ui/components/ProfilePanel";
import { ProfilePanelProvider, useProfilePanel } from "@/platform/ui/components/ProfilePanelContext";
import { FeatureAccessProvider } from "@/platform/ui/context/FeatureAccessProvider";
import { OSProvider } from "@/platform/context/OSContext";

interface AcquisitionOSLayoutProps {
  children: React.ReactNode;
}

function AcquisitionOSLayoutInner({ 
  children, 
  currentSection,
  onSectionChange,
}: {
  children: React.ReactNode;
  currentSection: string;
  onSectionChange: (section: string) => void;
}) {
  const { ui } = useProfilePanel();
  const pathname = usePathname();

  return (
    <PanelLayout
      leftPanel={
        <LeftPanel
          currentSection={currentSection}
          onSectionChange={onSectionChange}
          osType="acquisition"
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

export default function AcquisitionOSLayout({ children }: AcquisitionOSLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Extract the current section from the pathname
  const getCurrentSection = () => {
    const segments = pathname.split('/').filter(Boolean);
    
    // Handle routes like /[workspace]/acquisition-os/leads, etc.
    if (segments.length >= 3 && segments[1] === 'acquisition-os') {
      const section = segments[2];
      const validSections = ['leads', 'prospects', 'opportunities', 'people', 'companies'];
      if (validSections.includes(section)) {
        return section;
      }
    }
    
    return 'leads'; // Default section
  };

  const currentSection = getCurrentSection();
  
  // Handle section changes with proper navigation
  const handleSectionChange = (section: string) => {
    const segments = pathname.split('/').filter(Boolean);
    const workspaceSlug = segments[0];
    
    if (workspaceSlug) {
      router.push(`/${workspaceSlug}/acquisition-os/${section}`);
    }
  };

  return (
    <OSProvider osType="acquisition">
      <RevenueOSProvider>
        <FeatureAccessProvider>
          <ZoomProvider>
            <PipelineProvider>
              <SpeedrunDataProvider>
                <SprintProvider>
                  <ProfilePopupProvider>
                    <SettingsPopupProvider>
                      <ProfilePanelProvider>
                        <AcquisitionOSLayoutInner
                          currentSection={currentSection}
                          onSectionChange={handleSectionChange}
                        >
                          {children}
                        </AcquisitionOSLayoutInner>
                      </ProfilePanelProvider>
                    </SettingsPopupProvider>
                  </ProfilePopupProvider>
                </SprintProvider>
              </SpeedrunDataProvider>
            </PipelineProvider>
          </ZoomProvider>
        </FeatureAccessProvider>
      </RevenueOSProvider>
    </OSProvider>
  );
}

