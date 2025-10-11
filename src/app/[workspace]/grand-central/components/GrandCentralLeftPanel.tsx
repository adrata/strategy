"use client";

import React from "react";
import { useGrandCentral } from "../layout";
import { useConnections } from "../hooks/useConnections";
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

export function GrandCentralLeftPanel() {
  const { activeTab, setActiveTab } = useGrandCentral();
  const { connections, isLoading } = useConnections();

  const tabs = [
    { id: 'integrations', name: 'Integrations', icon: LinkIcon },
    { id: 'data', name: 'Data Flow', icon: CloudIcon },
    { id: 'monitoring', name: 'Monitoring', icon: ChartBarIcon },
  ];

  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-blue-600 font-bold text-sm">GC</span>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">Grand Central</h2>
            <p className="text-xs text-gray-500">Integration Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex-shrink-0 p-2">
        <div className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex-shrink-0 p-2 border-t border-gray-200">
        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <PlusIcon className="w-4 h-4" />
            Add Integration
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <Cog6ToothIcon className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Integration Status */}
      <div className="flex-1 p-2">
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide px-3">
            Connected Integrations
          </h3>
          
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
              {connections.slice(0, 5).map((connection) => (
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

      {/* Footer */}
      <div className="flex-shrink-0 p-2 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <div className="font-medium">500+ Integrations</div>
          <div>via Nango</div>
        </div>
      </div>
    </div>
  );
}
