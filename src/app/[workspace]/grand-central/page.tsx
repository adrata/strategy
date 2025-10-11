"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useGrandCentral } from "./layout";
import { useConnections } from "./hooks/useConnections";
import { IntegrationLibrary } from "./components/IntegrationLibrary";
import { ConnectionDetail } from "./components/ConnectionDetail";
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

export default function GrandCentralPage() {
  const { activeTab, selectedNode, setSelectedNode } = useGrandCentral();
  const { connections, isLoading, error, refreshConnections } = useConnections();
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
                    placeholder="Search connections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="crm">CRM</option>
                  <option value="communication">Communication</option>
                  <option value="marketing">Marketing</option>
                  <option value="productivity">Productivity</option>
                  <option value="finance">Finance</option>
                  <option value="e-commerce">E-commerce</option>
                  <option value="support">Support</option>
                  <option value="analytics">Analytics</option>
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
                <button
                  onClick={refreshConnections}
                  className="mt-2 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  Retry
                </button>
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
                    <button
                      onClick={() => setShowLibrary(true)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Add Your First Integration
                    </button>
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
