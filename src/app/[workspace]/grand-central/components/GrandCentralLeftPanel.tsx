"use client";

import React from "react";
import { useGrandCentral } from "../layout";
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
          
          <div className="space-y-1">
            {/* Salesforce */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Salesforce</div>
                <div className="text-xs text-gray-500">1,247 records</div>
              </div>
              <CheckCircleIcon className="w-4 h-4 text-green-600" />
            </div>

            {/* HubSpot */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">HubSpot</div>
                <div className="text-xs text-gray-500">892 records</div>
              </div>
              <ArrowPathIcon className="w-4 h-4 text-blue-600 animate-spin" />
            </div>

            {/* Slack */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Slack</div>
                <div className="text-xs text-gray-500">Token expired</div>
              </div>
              <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
            </div>
          </div>
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
