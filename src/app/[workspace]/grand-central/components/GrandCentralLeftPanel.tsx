"use client";

import React, { useState, useEffect } from "react";
import { useGrandCentral } from "../layout";
import { useConnections } from "../hooks/useConnections";
import { useUnifiedAuth } from "@/platform/auth";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { IntegrationLibrary } from "./IntegrationLibrary";
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";


export function GrandCentralLeftPanel() {
  const { activeTab, setActiveTab } = useGrandCentral();
  const { connections, isLoading } = useConnections();
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const { data: acquisitionData } = useAcquisitionOS();
  const [showLibrary, setShowLibrary] = useState(false);

  const [stats, setStats] = useState({
    totalConnections: 0,
    activeConnections: 0,
    lastSyncTime: 'Never',
  });


  // Update stats when connections change
  useEffect(() => {
    if (connections.length > 0) {
      const activeConnections = connections.filter(c => c.status === 'active').length;
      const lastSyncTime = connections
        .filter(c => c.lastSyncAt)
        .sort((a, b) => new Date(b.lastSyncAt).getTime() - new Date(a.lastSyncAt).getTime())[0]?.lastSyncAt;
      
      setStats({
        totalConnections: connections.length,
        activeConnections,
        lastSyncTime: lastSyncTime 
          ? new Date(lastSyncTime).toLocaleTimeString()
          : 'Never',
      });
    }
  }, [connections]);

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
        <div className="p-4 text-center">
          <div className="text-sm text-[var(--muted)]">Loading Grand Central...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 pt-0 pr-2 pl-2">
        {/* Header */}
        <div className="mx-2 mt-4 mb-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl overflow-hidden" style={{ backgroundColor: '#fed7aa', color: '#c2410c' }}>
              <span className="text-lg font-bold">G</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)]">Grand Central</h2>
              <p className="text-xs text-[var(--muted)]">Integration Platform</p>
            </div>
          </div>
        </div>


        {/* Stats */}
        <div className="mx-2 mb-3 p-3 bg-[var(--panel-background)] rounded-lg">
          <div className="text-xs text-[var(--muted)] space-y-1">
            <div className="flex justify-between">
              <span>Connections:</span>
              <span className="font-medium">{stats.totalConnections}</span>
            </div>
            <div className="flex justify-between">
              <span>Active:</span>
              <span className="font-medium">{stats.activeConnections}</span>
            </div>
            <div className="flex justify-between">
              <span>Last Sync:</span>
              <span className="font-medium">{stats.lastSyncTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-4 space-y-1">
        <button 
          onClick={() => setActiveTab('apis')}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
            activeTab === 'apis'
              ? 'bg-[var(--hover)] text-[var(--foreground)]'
              : 'hover:bg-[var(--panel-background)] text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">APIs</span>
          </div>
          <div className="text-xs text-[var(--muted)] mt-1">
            REST and GraphQL endpoints
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('mcps')}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
            activeTab === 'mcps'
              ? 'bg-[var(--hover)] text-[var(--foreground)]'
              : 'hover:bg-[var(--panel-background)] text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">MCPs</span>
          </div>
          <div className="text-xs text-[var(--muted)] mt-1">
            Model Context Protocol servers
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('all-connectors')}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
            activeTab === 'all-connectors'
              ? 'bg-[var(--hover)] text-[var(--foreground)]'
              : 'hover:bg-[var(--panel-background)] text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">All Connectors</span>
          </div>
          <div className="text-xs text-[var(--muted)] mt-1">
            Browse and manage integrations
          </div>
        </button>
      </div>


      {/* Fixed Bottom Section - Profile Button */}
      <div className="flex-shrink-0 p-2" style={{ paddingBottom: '15px' }}>
        <button
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--hover)] transition-colors"
          title="Profile"
        >
          <div className="w-8 h-8 bg-[var(--loading-bg)] rounded-xl flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">
              {authUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-[var(--foreground)]">
              {authUser?.name || 'User'}
            </div>
            <div className="text-xs text-[var(--muted)]">
              {acquisitionData?.auth?.authUser?.activeWorkspaceName || 'Workspace'}
            </div>
          </div>
        </button>
      </div>

      {/* Integration Library Modal */}
      <IntegrationLibrary 
        isOpen={showLibrary} 
        onClose={() => setShowLibrary(false)} 
      />
    </div>
  );
}
