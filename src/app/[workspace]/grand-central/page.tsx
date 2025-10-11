"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useGrandCentral } from "./layout";
import { IntegrationProvider } from "./types/integration";
import { integrationCategories } from "./utils/integrationCategories";
import { 
  PlusIcon, 
  LinkIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  CloudIcon,
  MagnifyingGlassIcon
} from "@heroicons/react/24/outline";

interface ConnectedIntegration {
  id: string;
  provider: string;
  name: string;
  status: 'connected' | 'error' | 'syncing';
  lastSync?: Date;
  dataCount?: number;
  errorMessage?: string;
}

export default function GrandCentralPage() {
  const { activeTab } = useGrandCentral();
  const [showLibrary, setShowLibrary] = useState(false);
  const [connectedIntegrations, setConnectedIntegrations] = useState<ConnectedIntegration[]>([
    {
      id: '1',
      provider: 'salesforce',
      name: 'Salesforce CRM',
      status: 'connected',
      lastSync: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      dataCount: 1247,
    },
    {
      id: '2',
      provider: 'hubspot',
      name: 'HubSpot Marketing',
      status: 'syncing',
      lastSync: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      dataCount: 892,
    },
    {
      id: '3',
      provider: 'slack',
      name: 'Slack Workspace',
      status: 'error',
      lastSync: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      dataCount: 0,
      errorMessage: 'Token expired',
    },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleConnectIntegration = useCallback((provider: string) => {
    // Simulate connection process
    const newIntegration: ConnectedIntegration = {
      id: Date.now().toString(),
      provider,
      name: provider.charAt(0).toUpperCase() + provider.slice(1),
      status: 'syncing',
      dataCount: 0,
    };
    setConnectedIntegrations(prev => [...prev, newIntegration]);
    setShowLibrary(false);
    
    // Simulate successful connection after 2 seconds
    setTimeout(() => {
      setConnectedIntegrations(prev => 
        prev.map(integration => 
          integration.id === newIntegration.id 
            ? { ...integration, status: 'connected' as const, dataCount: Math.floor(Math.random() * 1000) }
            : integration
        )
      );
    }, 2000);
  }, []);

  const handleReconnect = useCallback((integrationId: string) => {
    setConnectedIntegrations(prev => 
      prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, status: 'syncing' as const }
          : integration
      )
    );
    
    // Simulate reconnection
    setTimeout(() => {
      setConnectedIntegrations(prev => 
        prev.map(integration => 
          integration.id === integrationId 
            ? { ...integration, status: 'connected' as const, errorMessage: undefined }
            : integration
        )
      );
    }, 2000);
  }, []);

  const filteredCategories = integrationCategories.filter(category => 
    selectedCategory === 'all' || category.category === selectedCategory
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'syncing': return 'text-blue-600 bg-blue-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircleIcon className="w-4 h-4" />;
      case 'syncing': return <ArrowPathIcon className="w-4 h-4 animate-spin" />;
      case 'error': return <ExclamationTriangleIcon className="w-4 h-4" />;
      default: return <CloudIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'integrations' && (
          <div className="p-6">
            {/* Search and Filter */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search integrations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {integrationCategories.map(category => (
                    <option key={category.category} value={category.category}>
                      {category.category}
                    </option>
                  ))}
                </select>
              </div>
                  <button
                    onClick={() => setShowLibrary(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Integration
                  </button>
            </div>

            {/* Connected Integrations */}
            <div className="space-y-3">
              {connectedIntegrations.map((integration) => (
                <div
                  key={integration.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        integration.status === 'connected' ? 'bg-green-500' :
                        integration.status === 'syncing' ? 'bg-blue-500 animate-pulse' :
                        'bg-red-500'
                      }`}></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-sm font-medium text-gray-900">{integration.name}</div>
                          <div className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(integration.status)}`}>
                            {integration.status}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {integration.lastSync && (
                            <span>Last sync: {integration.lastSync.toLocaleTimeString()}</span>
                          )}
                          {integration.dataCount !== undefined && (
                            <span className="ml-2">{integration.dataCount.toLocaleString()} records</span>
                          )}
                          {integration.errorMessage && (
                            <span className="ml-2 text-red-600">{integration.errorMessage}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors">
                        <Cog6ToothIcon className="w-3 h-3 inline mr-1" />
                        Configure
                      </button>
                      {integration.status === 'error' && (
                        <button
                          onClick={() => handleReconnect(integration.id)}
                          className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                        >
                          Reconnect
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="p-6">
            <div className="text-center py-12">
              <CloudIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Data Flow</h3>
              <p className="text-gray-500">Visualize how data flows between your connected integrations</p>
            </div>
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="p-6">
            <div className="text-center py-12">
              <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Monitoring</h3>
              <p className="text-gray-500">Track integration health, sync status, and performance metrics</p>
            </div>
          </div>
        )}
      </div>

      {/* Integration Library Popup */}
      {showLibrary && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Integration Library</h2>
                <button
                  onClick={() => setShowLibrary(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mt-1">Browse 500+ integrations via Nango</p>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCategories.map((category) => (
                  <div key={category.category} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">{category.category}</h3>
                    <div className="space-y-2">
                      {category.providers.slice(0, 4).map((provider) => (
                            <button
                              key={provider.id}
                              onClick={() => handleConnectIntegration(provider.id)}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors border border-gray-100 hover:border-blue-200"
                            >
                              <div className="font-medium text-sm text-gray-900">{provider.name}</div>
                              <div className="text-xs text-gray-500">{provider.description}</div>
                            </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
