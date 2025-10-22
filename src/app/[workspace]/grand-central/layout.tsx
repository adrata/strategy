"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/platform/auth";
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
  activeTab: 'apis' | 'mcps' | 'atrium' | 'all-connectors';
  setActiveTab: (tab: 'apis' | 'mcps' | 'atrium' | 'all-connectors') => void;
  selectedConnection: any | null;
  setSelectedConnection: (connection: any | null) => void;
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
  const [activeTab, setActiveTab] = useState<'apis' | 'mcps' | 'atrium' | 'all-connectors'>('atrium');
  const [selectedConnection, setSelectedConnection] = useState<any | null>(null);
  const { user: authUser } = useUnifiedAuth();
  const router = useRouter();


  return (
    <QueryClientProvider client={queryClient}>
      <GrandCentralContext.Provider value={{ 
        selectedNode, 
        setSelectedNode, 
        activeTab, 
        setActiveTab,
        selectedConnection,
        setSelectedConnection
      }}>
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
  const { selectedNode, setSelectedNode, selectedConnection, setSelectedConnection } = useGrandCentral();
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

  // Handle connection selection
  if (selectedConnection) {
    return (
      <div className="h-full flex flex-col bg-[var(--background)] border-l border-[var(--border)]">
        {/* Header with X button */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div>
            <h2 className="font-semibold text-[var(--foreground)]">{selectedConnection.connectionName || selectedConnection.provider}</h2>
            <p className="text-sm text-[var(--muted)]">{selectedConnection.provider}</p>
          </div>
          <button
            onClick={() => setSelectedConnection(null)}
            className="p-1.5 hover:bg-[var(--hover)] rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Connection Details */}
        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          {/* Basic Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--foreground)] border-b border-[var(--border)] pb-2">
              Connection Details
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                selectedConnection.status === 'active' ? 'text-green-600 bg-green-100' :
                selectedConnection.status === 'pending' ? 'text-yellow-600 bg-yellow-100' :
                'text-red-600 bg-red-100'
              }`}>
                {selectedConnection.status.charAt(0).toUpperCase() + selectedConnection.status.slice(1)}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Connection ID
              </label>
              <input
                type="text"
                value={selectedConnection.nangoConnectionId}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--panel-background)] text-[var(--foreground)] font-mono text-sm"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Created
              </label>
              <input
                type="text"
                value={new Date(selectedConnection.createdAt).toLocaleString()}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--panel-background)] text-[var(--foreground)]"
                disabled
              />
            </div>

            {selectedConnection.lastSyncAt && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Sync
                </label>
                <input
                  type="text"
                  value={new Date(selectedConnection.lastSyncAt).toLocaleString()}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--panel-background)] text-[var(--foreground)]"
                  disabled
                />
              </div>
            )}
          </div>

          {/* Email Settings (if email provider) */}
          {['outlook', 'gmail'].includes(selectedConnection.provider) && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--foreground)] border-b border-[var(--border)] pb-2">
                Email Settings
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sync Frequency
                </label>
                <select className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="5">Every 5 minutes</option>
                  <option value="10">Every 10 minutes</option>
                  <option value="15">Every 15 minutes</option>
                  <option value="manual">Manual only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Auto-linking
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-[var(--border)] text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-[var(--foreground)]">Link emails to people and companies</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Folders
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-[var(--border)] text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-[var(--foreground)]">Inbox</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="rounded border-[var(--border)] text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-[var(--foreground)]">Sent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="rounded border-[var(--border)] text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-[var(--foreground)]">All folders</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Webhook Settings */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--foreground)] border-b border-[var(--border)] pb-2">
              Webhook Settings
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook URL
              </label>
              <input
                type="text"
                value={`${window.location.origin}/api/webhooks/nango/email`}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--panel-background)] text-[var(--foreground)] font-mono text-sm"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook Status
              </label>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-green-600 bg-green-100">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Active
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--foreground)] border-b border-[var(--border)] pb-2">
              Actions
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
              <button className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                Test Connection
              </button>
              <button className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--hover)] transition-colors">
                View Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle node selection (workflow nodes)
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
            className="p-1.5 hover:bg-[var(--hover)] rounded-lg transition-colors"
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
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
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
