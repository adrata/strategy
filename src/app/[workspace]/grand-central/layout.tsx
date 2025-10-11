"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PanelLayout } from "@/platform/ui/components/layout/PanelLayout";
import { RightPanel } from "@/platform/ui/components/chat/RightPanel";
import { AcquisitionOSProvider, useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";
import { IntegrationNode } from "./types/integration";
import { GrandCentralLeftPanel } from "./components/GrandCentralLeftPanel";

const queryClient = new QueryClient();

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

interface GrandCentralContextType {
  selectedNode: IntegrationNode | null;
  setSelectedNode: (node: IntegrationNode | null) => void;
  activeTab: 'integrations' | 'data' | 'monitoring';
  setActiveTab: (tab: 'integrations' | 'data' | 'monitoring') => void;
}

const GrandCentralContext = createContext<GrandCentralContextType | undefined>(undefined);

export const useGrandCentral = () => {
  const context = useContext(GrandCentralContext);
  if (!context) {
    throw new Error('useGrandCentral must be used within GrandCentralProvider');
  }
  return context;
};

interface GrandCentralLayoutProps {
  children: React.ReactNode;
}

export default function GrandCentralLayout({ children }: GrandCentralLayoutProps) {
  const [selectedNode, setSelectedNode] = useState<IntegrationNode | null>(null);
  const [activeTab, setActiveTab] = useState<'integrations' | 'data' | 'monitoring'>('integrations');

  return (
    <QueryClientProvider client={queryClient}>
      <GrandCentralContext.Provider value={{ selectedNode, setSelectedNode, activeTab, setActiveTab }}>
        <AcquisitionOSProvider>
          <ZoomProvider>
            <ProfilePopupProvider>
              <GrandCentralLayoutContent>
                {children}
              </GrandCentralLayoutContent>
            </ProfilePopupProvider>
          </ZoomProvider>
        </AcquisitionOSProvider>
      </GrandCentralContext.Provider>
    </QueryClientProvider>
  );
}

// Custom Right Panel for Grand Central
function GrandCentralRightPanel() {
  const { selectedNode, setSelectedNode } = useGrandCentral();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    provider: '',
    operation: '',
  });

  // Update form data when selectedNode changes
  useEffect(() => {
    if (selectedNode) {
      setFormData({
        title: selectedNode.title,
        description: selectedNode.description,
        provider: selectedNode.provider,
        operation: selectedNode.operation,
      });
    }
  }, [selectedNode]);

  // Real-time save function
  const saveData = useCallback(async (data: any) => {
    try {
      console.log('Saving data:', data);
      // API call to save would go here
    } catch (error) {
      console.error('Failed to save:', error);
    }
  }, []);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce((data: any) => saveData(data), 500),
    [saveData]
  );

  // Save on form data change
  useEffect(() => {
    if (selectedNode) {
      debouncedSave({ ...selectedNode, ...formData });
    }
  }, [formData, selectedNode, debouncedSave]);

  if (selectedNode) {
    return (
      <div className="h-full flex flex-col bg-[var(--background)] border-l border-[var(--border)]">
        {/* Header with X button */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div>
            <h2 className="font-semibold text-[var(--foreground)]">{selectedNode.title}</h2>
            <p className="text-sm text-[var(--muted-foreground)]">{selectedNode.description}</p>
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Configuration Form */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provider
              </label>
              <input
                type="text"
                value={formData.provider}
                onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operation
              </label>
              <input
                type="text"
                value={formData.operation}
                onChange={(e) => setFormData(prev => ({ ...prev, operation: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <RightPanel />;
}

// Layout content component that can use context hooks
function GrandCentralLayoutContent({ children }: { children: React.ReactNode }) {
  const { ui } = useAcquisitionOS();

  return (
    <PanelLayout
      thinLeftPanel={null}
      leftPanel={<GrandCentralLeftPanel />}
      middlePanel={children}
      rightPanel={<GrandCentralRightPanel />}
      zoom={100}
      isLeftPanelVisible={ui.isLeftPanelVisible}
      isRightPanelVisible={ui.isRightPanelVisible}
      onToggleLeftPanel={ui.toggleLeftPanel}
      onToggleRightPanel={ui.toggleRightPanel}
    />
  );
}
