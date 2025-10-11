"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/platform/auth";
import { PanelLayout } from "@/platform/ui/components/layout/PanelLayout";
import { RightPanel } from "@/platform/ui/components/chat/RightPanel";
import { AcquisitionOSProvider, useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";
import { DocsLeftPanel } from "./components/DocsLeftPanel";
import { DocsRightPanel } from "./components/DocsRightPanel";
import { DocsContextType, DocPage } from "./types/docs";

const DocsContext = createContext<DocsContextType | undefined>(undefined);

export const useDocs = () => {
  const context = useContext(DocsContext);
  if (!context) {
    throw new Error('useDocs must be used within a DocsProvider');
  }
  return context;
};

interface DocsLayoutProps {
  children: React.ReactNode;
}

export default function DocsLayout({ children }: DocsLayoutProps) {
  const [selectedPage, setSelectedPage] = useState<DocPage | null>(null);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { user: authUser } = useUnifiedAuth();
  const router = useRouter();

  // Access control - only ross@adrata.com can access docs
  useEffect(() => {
    if (authUser?.email && authUser.email !== 'ross@adrata.com') {
      console.log('🚫 Docs: Access denied for', authUser.email, '- redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [authUser?.email, router]);

  // Don't render if not authorized
  if (authUser?.email && authUser.email !== 'ross@adrata.com') {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">Access Restricted</h2>
          <p className="text-[var(--muted)]">This feature is currently in development.</p>
        </div>
      </div>
    );
  }

  return (
    <DocsContext.Provider value={{
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
            <DocsLayoutContent>
              {children}
            </DocsLayoutContent>
          </ProfilePopupProvider>
        </ZoomProvider>
      </AcquisitionOSProvider>
    </DocsContext.Provider>
  );
}

function DocsLayoutContent({ children }: { children: React.ReactNode }) {
  const { ui } = useAcquisitionOS();

  return (
    <PanelLayout
      thinLeftPanel={null}
      leftPanel={<DocsLeftPanel />}
      middlePanel={children}
      rightPanel={<DocsRightPanel />}
      zoom={100}
      isLeftPanelVisible={ui.isLeftPanelVisible}
      isRightPanelVisible={ui.isRightPanelVisible}
      onToggleLeftPanel={ui.toggleLeftPanel}
      onToggleRightPanel={ui.toggleRightPanel}
    />
  );
}