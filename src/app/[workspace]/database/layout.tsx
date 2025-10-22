"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { PanelLayout } from "@/platform/ui/components/layout/PanelLayout";
import { RightPanel } from "@/platform/ui/components/chat/RightPanel";
import { AcquisitionOSProvider, useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";
import { DatabaseLeftPanel } from "./components/DatabaseLeftPanel";
import { DatabaseContextType } from "./types";

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

interface DatabaseLayoutProps {
  children: React.ReactNode;
}

/**
 * Database Layout
 * 
 * Provides a layout with left navigation, middle content, and right AI panel.
 * Similar to Olympus and Tower but focused on database management.
 */
export default function DatabaseLayout({ children }: DatabaseLayoutProps) {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<Record<string, any> | null>(null);
  const [viewMode, setViewMode] = useState<'browser' | 'detail' | 'query' | 'schema' | 'tables' | 'objects' | 'model-detail'>('browser');
  const [activeSection, setActiveSection] = useState<string>('objects');
  const params = useParams();
  const workspaceId = params.workspace as string;

  const refreshData = () => {
    // This will trigger a refresh of all database data
    console.log('Refreshing database data...');
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    console.log(`Database section changed to: ${section}`);
  };

  return (
    <DatabaseContext.Provider value={{ 
      selectedTable, 
      setSelectedTable, 
      selectedRecord, 
      setSelectedRecord, 
      viewMode, 
      setViewMode, 
      refreshData 
    }}>
      <AcquisitionOSProvider>
        <ZoomProvider>
          <ProfilePopupProvider>
            <DatabaseLayoutContent 
              activeSection={activeSection}
              onSectionChange={handleSectionChange}
            >
              {children}
            </DatabaseLayoutContent>
          </ProfilePopupProvider>
        </ZoomProvider>
      </AcquisitionOSProvider>
    </DatabaseContext.Provider>
  );
}

// Custom Right Panel that shows database context
function DatabaseRightPanel() {
  const { selectedTable, selectedRecord, setSelectedRecord } = useDatabase();

  if (selectedRecord) {
    return (
      <div className="h-full flex flex-col bg-[var(--background)] border-l border-[var(--border)]">
        {/* Header with X button */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div>
            <h2 className="font-semibold text-[var(--foreground)]">Record Details</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              {selectedTable} - {selectedRecord.id || 'New Record'}
            </p>
          </div>
          <button
            onClick={() => setSelectedRecord(null)}
            className="p-1.5 hover:bg-[var(--hover)] rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Record Details */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div className="space-y-3">
            {Object.entries(selectedRecord).map(([key, value]) => (
              <div key={key} className="p-3 bg-[var(--panel-background)] rounded-lg">
                <h3 className="font-medium text-[var(--foreground)] mb-1">{key}</h3>
                <p className="text-sm text-[var(--muted)] break-all">
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <RightPanel />;
}

// Separate component that can use the context hooks
function DatabaseLayoutContent({ 
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
        <DatabaseLeftPanel 
          activeSection={activeSection}
          onSectionChange={onSectionChange}
        />
      }
      middlePanel={children}
      rightPanel={<DatabaseRightPanel />}
      zoom={100}
      isLeftPanelVisible={ui.isLeftPanelVisible}
      isRightPanelVisible={ui.isRightPanelVisible}
      onToggleLeftPanel={ui.toggleLeftPanel}
      onToggleRightPanel={ui.toggleRightPanel}
    />
  );
}
