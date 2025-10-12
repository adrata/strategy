"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useGrandCentral } from "./layout";
import { useConnections } from "./hooks/useConnections";
import { IntegrationLibrary } from "./components/IntegrationLibrary";
import { ConnectionDetail } from "./components/ConnectionDetail";
import { StandardHeader } from "@/platform/ui/components/layout/StandardHeader";
import { useNangoAuth } from "./hooks/useNangoAuth";
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
  const { activeTab, selectedNode, setSelectedNode } = useGrandCentral();
  const { connections, isLoading, error, refreshConnections } = useConnections();
  const { initiateConnection, isConnecting } = useNangoAuth();
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  
  // Integration library state
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(true);
  const [integrationSelectedCategory, setIntegrationSelectedCategory] = useState<string>('all');

  // Fetch integration categories and providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setIsLoadingIntegrations(true);
        const response = await fetch('/api/grand-central/nango/providers');
        
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        } else {
          // If API fails, still try to parse the response in case it contains static data
          try {
            const errorData = await response.json();
            if (errorData && Array.isArray(errorData)) {
              setCategories(errorData);
            } else {
              console.warn('API returned error, but no fallback data available');
            }
          } catch (parseError) {
            console.warn('Could not parse error response, using empty categories');
          }
        }
      } catch (err) {
        console.error('Error fetching providers:', err);
        // Don't throw - just log the error and continue with empty categories
      } finally {
        setIsLoadingIntegrations(false);
      }
    };

    fetchProviders();
  }, []);

  // Update provider connection status based on actual connections
  useEffect(() => {
    if (connections.length > 0 && categories.length > 0) {
      setCategories(prevCategories => 
        prevCategories.map(category => ({
          ...category,
          providers: category.providers.map((provider: any) => {
            const connection = connections.find(conn => 
              conn.provider === provider.id && conn.status === 'active'
            );
            return {
              ...provider,
              isConnected: !!connection,
              connectionId: connection?.id
            };
          })
        }))
      );
    }
  }, [connections, categories]);

  const handleConnectionClick = useCallback((connection: any) => {
    setSelectedConnection(connection);
    setSelectedNode(null); // Clear any selected node
  }, [setSelectedNode]);

  const handleCloseConnectionDetail = useCallback(() => {
    setSelectedConnection(null);
  }, []);

  const handleConnect = async (provider: any) => {
    if (provider.isConnected) {
      return; // Already connected
    }

    try {
      await initiateConnection(provider.id);
    } catch (err) {
      console.error('Error connecting provider:', err);
    }
  };

  // Filter connections based on search and category
  const filteredConnections = connections.filter(connection => {
    const matchesSearch = searchQuery === '' || 
      connection.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (connection.connectionName && connection.connectionName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
      connection.provider.toLowerCase().includes(selectedCategory.toLowerCase());
    
    return matchesSearch && matchesCategory;
  });

  // Filter integrations based on search and category
  const filteredCategories = categories.filter(category => 
    integrationSelectedCategory === 'all' || category.category === integrationSelectedCategory
  );

  const filteredProviders = filteredCategories.map(category => ({
    ...category,
    providers: category.providers.filter((provider: any) =>
      searchQuery === '' || 
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.providers.length > 0);

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
      default: return 'text-[var(--muted)] bg-[var(--hover)]';
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

  // Integration Library Content Component
  const IntegrationLibraryContent = () => {
    if (isLoadingIntegrations) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-[var(--muted)]">Loading integrations...</span>
        </div>
      );
    }

    if (filteredProviders.length === 0) {
      return (
        <div className="text-center py-12">
          <CloudIcon className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No Integrations Found</h3>
          <p className="text-[var(--muted)]">Try adjusting your search or filter criteria</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Category Filter */}
        <div className="flex items-center gap-4">
          <select
            value={integrationSelectedCategory}
            onChange={(e) => setIntegrationSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.category} value={category.category}>
                {category.category}
              </option>
            ))}
          </select>
        </div>

        {/* Integration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map((category) => (
            <div key={category.category} className="space-y-4">
              <h4 className="font-semibold text-[var(--foreground)] text-lg border-b border-[var(--border)] pb-2">
                {category.category}
              </h4>
              <div className="space-y-3">
                {category.providers.map((provider: any) => (
                  <div
                    key={provider.id}
                    className={`p-4 rounded-lg border transition-all ${
                      provider.isConnected
                        ? 'bg-green-50 border-green-200'
                        : 'bg-[var(--background)] border-[var(--border)] hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium text-[var(--foreground)]">{provider.name}</h5>
                          {provider.isConnected ? (
                            <CheckCircleIcon className="w-4 h-4 text-green-600" />
                          ) : (
                            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-[var(--muted)] mb-3">{provider.description}</p>
                        
                        {provider.isConnected ? (
                          <div className="text-xs text-green-600 font-medium">
                            ✓ Connected
                          </div>
                        ) : (
                          <button
                            onClick={() => handleConnect(provider)}
                            disabled={isConnecting || !provider.isAvailable}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                              isConnecting || !provider.isAvailable
                                ? 'bg-[var(--hover)] text-[var(--muted)] cursor-not-allowed'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                          >
                            {isConnecting ? 'Connecting...' : 'Connect'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
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
      <div className="flex items-center gap-4 py-2 w-full bg-[var(--background)] px-6">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search connections and integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-4 pr-10 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors w-full bg-[var(--background)]"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-[var(--muted)]" />
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="relative min-w-32">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="relative w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-left text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors flex items-center gap-2"
          >
            <FunnelIcon className="w-4 h-4 text-[var(--muted)]" />
            <span className="block truncate text-[var(--foreground)]">Filter</span>
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="relative min-w-32">
          <button
            type="button"
            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
            className="relative w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-left text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors flex items-center gap-2"
          >
            <ArrowsUpDownIcon className="w-4 h-4 text-[var(--muted)]" />
            <span className="block truncate text-[var(--foreground)]">Sort</span>
          </button>
        </div>

        {/* Columns Dropdown */}
        <div className="relative min-w-32">
          <button
            type="button"
            onClick={() => setIsColumnsDropdownOpen(!isColumnsDropdownOpen)}
            className="relative w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-left text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <span className="block truncate text-[var(--foreground)]">Columns</span>
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
                <span className="ml-3 text-[var(--muted)]">Loading connections...</span>
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

            {/* Integration Library - Always Show */}
            {!isLoading && !error && (
              <div className="space-y-6">
                {/* Connected Integrations Section */}
                {filteredConnections.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-[var(--foreground)] border-b border-[var(--border)] pb-2">
                      Connected Integrations ({filteredConnections.length})
                    </h3>
                    {filteredConnections.map((connection) => (
                      <div
                        key={connection.id}
                        onClick={() => handleConnectionClick(connection)}
                        className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
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
                                <div className="text-sm font-medium text-[var(--foreground)]">
                                  {connection.connectionName || connection.provider}
                                </div>
                                <div className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(connection.status)}`}>
                                  {connection.status}
                                </div>
                              </div>
                              <div className="text-xs text-[var(--muted)]">
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
                              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-[var(--hover)] rounded hover:bg-[var(--loading-bg)] transition-colors"
                            >
                              <Cog6ToothIcon className="w-3 h-3 inline mr-1" />
                              Configure
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Available Integrations Section */}
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)] border-b border-[var(--border)] pb-2 mb-4">
                    Available Integrations (500+)
                  </h3>
                  <IntegrationLibraryContent />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'data' && (
          <div className="p-6">
            <div className="text-center py-12">
              <CloudIcon className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Data Flow</h3>
              <p className="text-[var(--muted)]">Visualize how data flows between your connected integrations</p>
            </div>
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="p-6">
            <div className="text-center py-12">
              <ChartBarIcon className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Monitoring</h3>
              <p className="text-[var(--muted)]">Track integration health, sync status, and performance metrics</p>
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
