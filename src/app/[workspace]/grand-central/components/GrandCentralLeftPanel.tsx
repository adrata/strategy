"use client";

import React, { useState, useEffect } from "react";
import { useGrandCentral } from "../layout";
import { useConnections } from "../hooks/useConnections";
import { useUnifiedAuth } from "@/platform/auth";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { 
  LinkIcon, 
  CloudIcon, 
  ChartBarIcon,
  Cog6ToothIcon,
  PlusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

interface NavigationTab {
  id: 'integrations' | 'data' | 'monitoring';
  name: string;
  icon: React.ComponentType<any>;
  description: string;
}

export function GrandCentralLeftPanel() {
  const { activeTab, setActiveTab } = useGrandCentral();
  const { connections, isLoading } = useConnections();
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const { data: acquisitionData } = useAcquisitionOS();

  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalConnections: 0,
    activeConnections: 0,
    lastSyncTime: 'Never',
  });

  const tabs: NavigationTab[] = [
    { 
      id: 'integrations', 
      name: 'Integrations', 
      icon: LinkIcon,
      description: 'Manage connections',
    },
    { 
      id: 'data', 
      name: 'Data Flow', 
      icon: CloudIcon,
      description: 'Visualize data flow',
    },
    { 
      id: 'monitoring', 
      name: 'Monitoring', 
      icon: ChartBarIcon,
      description: 'Track performance',
    },
  ];

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
      <div className="w-[13.335rem] min-w-[13.335rem] max-w-[13.335rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
        <div className="p-4 text-center">
          <div className="text-sm text-gray-500">Loading Grand Central...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[13.335rem] min-w-[13.335rem] max-w-[13.335rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
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

        {/* Search */}
        <div className="mx-2 mb-3">
          <input
            type="text"
            placeholder="Search integrations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Stats */}
        <div className="mx-2 mb-3 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 space-y-1">
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

      {/* Navigation Sections */}
      <div className="flex-1 space-y-1 p-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{tab.name}</span>
              </div>
              <div className="text-xs text-[var(--muted)] mt-1">
                {tab.description}
              </div>
            </button>
          );
        })}

        {/* Quick Actions */}
        <div className="mt-4 space-y-1">
          <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors">
            <div className="flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              <span className="font-medium text-sm">Add Integration</span>
            </div>
            <div className="text-xs text-[var(--muted)] mt-1">
              Connect new service
            </div>
          </button>
          <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors">
            <div className="flex items-center gap-2">
              <Cog6ToothIcon className="w-4 h-4" />
              <span className="font-medium text-sm">Settings</span>
            </div>
            <div className="text-xs text-[var(--muted)] mt-1">
              Configure platform
            </div>
          </button>
        </div>

        {/* Connected Integrations */}
        <div className="mt-4 space-y-2">
          <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
            Connected ({connections.length})
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          ) : connections.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <CloudIcon className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <div className="text-xs text-gray-500">No connections yet</div>
            </div>
          ) : (
            <div className="space-y-1">
              {connections
                .filter(connection => 
                  !searchTerm || 
                  connection.connectionName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  connection.provider.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .slice(0, 5)
                .map((connection) => (
                <div 
                  key={connection.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${
                    connection.status === 'active' 
                      ? 'bg-green-50 border-green-200' 
                      : connection.status === 'pending'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    connection.status === 'active' 
                      ? 'bg-green-500' 
                      : connection.status === 'pending'
                      ? 'bg-yellow-500 animate-pulse'
                      : 'bg-red-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {connection.connectionName || connection.provider}
                    </div>
                    <div className="text-xs text-gray-500">
                      {connection.status === 'active' && connection.lastSyncAt 
                        ? `Last sync: ${new Date(connection.lastSyncAt).toLocaleTimeString()}`
                        : connection.status === 'pending'
                        ? 'Connecting...'
                        : 'Error'
                      }
                    </div>
                  </div>
                  {connection.status === 'active' && <CheckCircleIcon className="w-4 h-4 text-green-600" />}
                  {connection.status === 'pending' && <ArrowPathIcon className="w-4 h-4 text-yellow-600 animate-spin" />}
                  {connection.status === 'error' && <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />}
                </div>
              ))}
              {connections.length > 5 && (
                <div className="px-3 py-1 text-xs text-gray-500 text-center">
                  +{connections.length - 5} more
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Section - Profile Button */}
      <div className="flex-shrink-0 p-2" style={{ paddingBottom: '15px' }}>
        <button
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Profile"
        >
          <div className="w-8 h-8 bg-gray-200 rounded-xl flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">
              {authUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-[var(--foreground)]">
              {authUser?.name || 'User'}
            </div>
            <div className="text-xs text-gray-400">
              {acquisitionData?.auth?.authUser?.activeWorkspaceName || 'Workspace'}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
