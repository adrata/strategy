"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PanelLayout } from "@/platform/ui/components/layout/PanelLayout";
import { LeftPanel } from "@/products/pipeline/components/LeftPanel";
import { RightPanel } from "@/platform/ui/components/chat/RightPanel";
import { AcquisitionOSProvider, useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { PipelineProvider } from "@/products/pipeline/context/PipelineContext";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";
import { StacksDetailPanel } from "@/products/stacks/components/StacksDetailPanel";

interface PipelineLayoutProps {
  children: React.ReactNode;
}

// Separate component that can use the context hooks
function PipelineLayoutContent({ 
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
  setIsPartnersVisible
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
}) {
  // Now we can use the context hooks since we're inside the providers
  const { ui } = useAcquisitionOS();
  const pathname = usePathname();

  // Determine which left panel to show based on the current route
  const getLeftPanel = () => {
    if (pathname.includes('/oasis')) {
      return null; // Oasis handles its own left panel
    } else if (pathname.includes('/stacks')) {
      // Stacks handles its own left panel
      return null;
    } else {
      // Default to Speedrun left panel for other routes
      return (
        <LeftPanel 
          key={`left-panel-${currentSection}`}
          activeSection={currentSection}
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
      return null; // Oasis handles its own right panel
    } else if (pathname.includes('/stacks')) {
      return null; // Stacks handles its own right panel
    } else {
      return <RightPanel />;
    }
  };

  return (
    <PanelLayout
      thinLeftPanel={null}
      leftPanel={getLeftPanel()}
      middlePanel={children}
      rightPanel={getRightPanel()}
      zoom={100}
      isLeftPanelVisible={ui.isLeftPanelVisible}
      isRightPanelVisible={ui.isRightPanelVisible}
      onToggleLeftPanel={ui.toggleLeftPanel}
      onToggleRightPanel={ui.toggleRightPanel}
    />
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
  
  // State for left panel visibility controls
  const [isSpeedrunVisible, setIsSpeedrunVisible] = useState(true);
  const [isOpportunitiesVisible, setIsOpportunitiesVisible] = useState(true);
  const [isProspectsVisible, setIsProspectsVisible] = useState(true);
  const [isLeadsVisible, setIsLeadsVisible] = useState(true);
  const [isCustomersVisible, setIsCustomersVisible] = useState(false);
  const [isPartnersVisible, setIsPartnersVisible] = useState(true);

  // Handle section changes with proper navigation
  const handleSectionChange = (section: string) => {
    console.log(`🔄 [PipelineLayout] Section change requested: ${section}`);
    
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
          <ProfilePopupProvider>
            <PipelineLayoutContent
              currentSection={currentSection}
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
            >
              {children}
            </PipelineLayoutContent>
          </ProfilePopupProvider>
        </PipelineProvider>
      </ZoomProvider>
    </AcquisitionOSProvider>
  );
}
