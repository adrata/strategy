"use client";

import React, { useState, useEffect } from "react";
import { useNangoAuth } from "../hooks/useNangoAuth";
import { useConnections } from "../hooks/useConnections";
import { 
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CloudIcon
} from "@heroicons/react/24/outline";

interface IntegrationCategory {
  category: string;
  color: string;
  providers: IntegrationProvider[];
}

interface IntegrationProvider {
  id: string;
  name: string;
  description: string;
  category: string;
  authType: 'oauth2' | 'api_key' | 'basic';
  isConnected: boolean;
  isAvailable?: boolean;
  connectionId?: string;
  operations: any[];
}

interface IntegrationLibraryProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IntegrationLibrary({ isOpen, onClose }: IntegrationLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<IntegrationCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { initiateConnection, isConnecting, error } = useNangoAuth();
  const { connections } = useConnections();

  // Fetch integration categories and providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/grand-central/nango/providers');
        
        if (!response.ok) {
          throw new Error('Failed to fetch providers');
        }
        
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching providers:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchProviders();
    }
  }, [isOpen]);

  // Update provider connection status based on actual connections
  useEffect(() => {
    if (connections.length > 0 && categories.length > 0) {
      setCategories(prevCategories => 
        prevCategories.map(category => ({
          ...category,
          providers: category.providers.map(provider => {
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

  const handleConnect = async (provider: IntegrationProvider) => {
    if (provider.isConnected) {
      return; // Already connected
    }

    try {
      await initiateConnection(provider.id);
    } catch (err) {
      console.error('Error connecting provider:', err);
    }
  };

  const filteredCategories = categories.filter(category => 
    selectedCategory === 'all' || category.category === selectedCategory
  );

  const filteredProviders = filteredCategories.map(category => ({
    ...category,
    providers: category.providers.filter(provider =>
      searchQuery === '' || 
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.providers.length > 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--background)] rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[var(--foreground)]">Integration Library</h2>
              <p className="text-[var(--muted)] mt-1">Connect to 500+ integrations via Nango</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--hover)] rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <MagnifyingGlassIcon className="w-4 h-4 text-[var(--muted)] absolute left-3 top-2.5" />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
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
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-[var(--muted)]">Loading integrations...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Error Loading Integrations</h3>
              <p className="text-[var(--muted)]">{error}</p>
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="text-center py-12">
              <CloudIcon className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No Integrations Found</h3>
              <p className="text-[var(--muted)]">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProviders.map((category) => (
                <div key={category.category} className="space-y-4">
                  <h3 className="font-semibold text-[var(--foreground)] text-lg border-b border-[var(--border)] pb-2">
                    {category.category}
                  </h3>
                  <div className="space-y-3">
                    {category.providers.map((provider) => (
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
                              <h4 className="font-medium text-[var(--foreground)]">{provider.name}</h4>
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
          )}
        </div>
      </div>
    </div>
  );
}
