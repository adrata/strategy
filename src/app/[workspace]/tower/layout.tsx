"use client";

import React, { createContext, useContext, useState } from "react";
import { PanelLayout } from "@/platform/ui/components/layout/PanelLayout";
import { RightPanel } from "@/platform/ui/components/chat/RightPanel";
import { AcquisitionOSProvider, useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";
import { TowerLeftPanel } from "./components/TowerLeftPanel";

interface TowerContextType {
  selectedMetric: string | null;
  setSelectedMetric: (metric: string | null) => void;
  refreshMetrics: () => void;
}

const TowerContext = createContext<TowerContextType | undefined>(undefined);

export const useTower = () => {
  const context = useContext(TowerContext);
  if (!context) {
    throw new Error('useTower must be used within a TowerProvider');
  }
  return context;
};

interface TowerLayoutProps {
  children: React.ReactNode;
}

/**
 * Tower Layout
 * 
 * Provides a layout with middle and right panels only (no left panel).
 * Uses the same middle and right panel components from the pipeline product.
 */
export default function TowerLayout({ children }: TowerLayoutProps) {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('overview');

  const refreshMetrics = () => {
    // This will be implemented to refresh all metrics
    console.log('Refreshing Tower metrics...');
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    console.log(`Tower section changed to: ${section}`);
  };

  return (
    <TowerContext.Provider value={{ selectedMetric, setSelectedMetric, refreshMetrics }}>
      <AcquisitionOSProvider>
        <ZoomProvider>
          <ProfilePopupProvider>
            <TowerLayoutContent 
              activeSection={activeSection}
              onSectionChange={handleSectionChange}
            >
              {children}
            </TowerLayoutContent>
          </ProfilePopupProvider>
        </ZoomProvider>
      </AcquisitionOSProvider>
    </TowerContext.Provider>
  );
}

// Custom Right Panel that shows metric details
function TowerRightPanel() {
  const { selectedMetric, setSelectedMetric } = useTower();

  if (selectedMetric) {
    return (
      <div className="h-full flex flex-col bg-[var(--background)] border-l border-[var(--border)]">
        {/* Header with X button */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div>
            <h2 className="font-semibold text-[var(--foreground)]">Metric Details</h2>
            <p className="text-sm text-[var(--muted-foreground)]">{selectedMetric}</p>
          </div>
          <button
            onClick={() => setSelectedMetric(null)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Metric Details */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div className="space-y-3">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Status</h3>
              <p className="text-sm text-gray-600">Detailed information about {selectedMetric} will be displayed here.</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">History</h3>
              <p className="text-sm text-gray-600">Historical data and trends for this metric.</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Alerts</h3>
              <p className="text-sm text-gray-600">Configure alerts and thresholds for this metric.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <RightPanel />;
}

// Separate component that can use the context hooks
function TowerLayoutContent({ 
  children, 
  activeSection, 
  onSectionChange 
}: { 
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
}) {
  // Now we can use the context hooks since we're inside the providers
  const { ui } = useAcquisitionOS();

  return (
    <PanelLayout
      thinLeftPanel={null}
      leftPanel={
        <TowerLeftPanel 
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />
      }
      middlePanel={children}
      rightPanel={<TowerRightPanel />}
      zoom={100}
      isLeftPanelVisible={ui.isLeftPanelVisible}
      isRightPanelVisible={ui.isRightPanelVisible}
      onToggleLeftPanel={ui.toggleLeftPanel}
      onToggleRightPanel={ui.toggleRightPanel}
    />
  );
}
