"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useGrandCentral } from "./layout";
import { useConnections } from "./hooks/useConnections";
import { IntegrationLibrary } from "./components/IntegrationLibrary";
import { ConnectionDetail } from "./components/ConnectionDetail";
import { StandardHeader } from "@/platform/ui/components/layout/StandardHeader";
import { 
  PlusIcon, 
  LinkIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  CloudIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon
} from "@heroicons/react/24/outline";

export default function GrandCentralPage() {
  // Set browser title
  useEffect(() => {
    document.title = 'Grand Central • Integrations';
  }, []);
  const { activeTab, selectedNode, setSelectedNode } = useGrandCentral();
  const { connections, isLoading, error, refreshConnections } = useConnections();
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState('name');

  const handleConnectionClick = useCallback((connection: any) => {
    setSelectedConnection(connection);
    setSelectedNode(null); // Clear any selected node
  }, [setSelectedNode]);

  const handleCloseConnectionDetail = useCallback(() => {
    setSelectedConnection(null);
  }, []);

  // Filter connections based on search and category
  const filteredConnections = connections.filter(connection => {
    const matchesSearch = searchQuery === '' || 
      connection.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (connection.connectionName && connection.connectionName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
      connection.provider.toLowerCase().includes(selectedCategory.toLowerCase());
    
    return matchesSearch && matchesCategory;
  });

  // Calculate connection stats
  const connectionStats = {
    active: connections.filter(c => c.status === 'active').length,
    pending: connections.filter(c => c.status === 'pending').length,
    error: connections.filter(c => c.status === 'error').length,
    total: connections.length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircleIcon className="w-4 h-4" />;
      case 'pending': return <ArrowPathIcon className="w-4 h-4 animate-spin" />;
      case 'error': return <ExclamationTriangleIcon className="w-4 h-4" />;
      default: return <CloudIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Standardized Header */}
      <StandardHeader
        title="Grand Central"
        subtitle="Manage your integrations and data connections"
        stats={[
          { label: "Active", value: connectionStats.active },
          { label: "Pending", value: connectionStats.pending },
          { label: "Total", value: connectionStats.total }
        ]}
        actions={
          <button
            onClick={() => setShowLibrary(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add Integration
          </button>
        }
      />

      {/* Sub-header with Search and Filter */}
      <div className="flex items-center gap-4 py-2 w-full bg-white px-6">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search connections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-4 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors w-full bg-white"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="relative min-w-32">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="relative w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-left text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors flex items-center gap-2"
          >
            <FunnelIcon className="w-4 h-4 text-gray-500" />
            <span className="block truncate text-gray-900">Filter</span>
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="relative min-w-32">
          <button
            type="button"
            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
            className="relative w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-left text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors flex items-center gap-2"
          >
            <ArrowsUpDownIcon className="w-4 h-4 text-gray-500" />
            <span className="block truncate text-gray-900">Sort</span>
          </button>
        </div>

        {/* Columns Dropdown */}
        <div className="relative min-w-32">
          <button
            type="button"
            onClick={() => setIsColumnsDropdownOpen(!isColumnsDropdownOpen)}
            className="relative w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-left text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <span className="block truncate text-gray-900">Columns</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'integrations' && (
          <div className="p-6">
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Loading connections...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                  <span className="text-red-800 font-medium">Error loading connections</span>
                </div>
                <p className="text-red-600 text-sm mt-1">{error}</p>
                <div className="mt-3 space-y-2">
                  <button
                    onClick={refreshConnections}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    Retry
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/grand-central/nango/config');
                        const config = await response.json();
                        console.log('Nango Configuration:', config);
                        alert(`Nango Config:\n- Secret Key: ${config.config.hasSecretKey ? 'Set' : 'Missing'}\n- Public Key: ${config.config.hasPublicKey ? 'Set' : 'Missing'}\n- Status: ${config.nangoStatus}\n- Error: ${config.nangoError || 'None'}`);
                      } catch (err) {
                        console.error('Failed to check config:', err);
                        alert('Failed to check Nango configuration');
                      }
                    }}
                    className="ml-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    Check Config
                  </button>
                </div>
              </div>
            )}

            {/* Connected Integrations */}
            {!isLoading && !error && (
              <div className="space-y-3">
                {filteredConnections.length === 0 ? (
                  <div className="text-center py-12">
                    <CloudIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Connections Found</h3>
                    <p className="text-gray-500 mb-4">
                      {connections.length === 0 
                        ? "You haven't connected any integrations yet."
                        : "No connections match your search criteria."
                      }
                    </p>
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowLibrary(true)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Add Your First Integration
                      </button>
                      <div className="text-sm text-gray-500">
                        <p>Need help setting up integrations?</p>
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/grand-central/nango/config');
                              const config = await response.json();
                              if (!config.config.hasSecretKey) {
                                alert('Nango is not configured. Please add NANGO_SECRET_KEY to your environment variables.\n\nSee docs/guides/GRAND_CENTRAL_NANGO_SETUP.md for setup instructions.');
                              } else if (config.nangoStatus === 'error') {
                                alert(`Nango configuration error: ${config.nangoError}\n\nPlease check your Nango credentials and try again.`);
                              } else {
                                alert('Nango is configured correctly. You can start adding integrations.');
                              }
                            } catch (err) {
                              console.error('Failed to check config:', err);
                              alert('Failed to check Nango configuration');
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          Check Setup Status
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  filteredConnections.map((connection) => (
                    <div
                      key={connection.id}
                      onClick={() => handleConnectionClick(connection)}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${
                            connection.status === 'active' ? 'bg-green-500' :
                            connection.status === 'pending' ? 'bg-yellow-500 animate-pulse' :
                            'bg-red-500'
                          }`}></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="text-sm font-medium text-gray-900">
                                {connection.connectionName || connection.provider}
                              </div>
                              <div className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(connection.status)}`}>
                                {connection.status}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {connection.lastSyncAt && (
                                <span>Last sync: {new Date(connection.lastSyncAt).toLocaleTimeString()}</span>
                              )}
                              {connection.metadata?.error && (
                                <span className="ml-2 text-red-600">{connection.metadata.error}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConnectionClick(connection);
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                          >
                            <Cog6ToothIcon className="w-3 h-3 inline mr-1" />
                            Configure
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
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

      {/* Integration Library Modal */}
      <IntegrationLibrary 
        isOpen={showLibrary} 
        onClose={() => setShowLibrary(false)} 
      />

      {/* Connection Detail Panel */}
      {selectedConnection && (
        <ConnectionDetail 
          connection={selectedConnection}
          onClose={handleCloseConnectionDetail}
        />
      )}
    </div>
  );
}
