"use client";

import React, { useState, useEffect } from 'react';
import { API_REGISTRY } from '../data/api-registry';
import { MCP_REGISTRY } from '../data/mcp-registry';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  LinkIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';

interface ConnectorItem {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'active' | 'inactive' | 'configured' | 'not-configured';
  type: 'api' | 'mcp' | 'nango';
  provider?: string;
}

export function AllConnectorsView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [connectors, setConnectors] = useState<ConnectorItem[]>([]);

  // Combine all connectors
  useEffect(() => {
    const allConnectors: ConnectorItem[] = [
      // Internal APIs
      ...API_REGISTRY.map(api => ({
        id: api.id,
        name: api.name,
        category: api.category,
        description: api.description,
        status: api.status,
        type: 'api' as const
      })),
      // MCPs
      ...MCP_REGISTRY.map(mcp => ({
        id: mcp.id,
        name: mcp.name,
        category: 'mcp',
        description: mcp.description,
        status: mcp.status,
        type: 'mcp' as const
      })),
      // Nango integrations (sample)
      {
        id: 'salesforce',
        name: 'Salesforce',
        category: 'crm',
        description: 'Customer relationship management platform',
        status: 'not-configured',
        type: 'nango',
        provider: 'salesforce'
      },
      {
        id: 'hubspot',
        name: 'HubSpot',
        category: 'crm',
        description: 'Inbound marketing and sales platform',
        status: 'not-configured',
        type: 'nango',
        provider: 'hubspot'
      },
      {
        id: 'slack',
        name: 'Slack',
        category: 'communication',
        description: 'Team communication and collaboration',
        status: 'not-configured',
        type: 'nango',
        provider: 'slack'
      },
      {
        id: 'stripe',
        name: 'Stripe',
        category: 'finance',
        description: 'Payment processing and financial services',
        status: 'not-configured',
        type: 'nango',
        provider: 'stripe'
      },
      {
        id: 'google-workspace',
        name: 'Google Workspace',
        category: 'productivity',
        description: 'Google productivity suite',
        status: 'not-configured',
        type: 'nango',
        provider: 'google-workspace'
      },
      {
        id: 'notion',
        name: 'Notion',
        category: 'productivity',
        description: 'All-in-one workspace for notes and collaboration',
        status: 'not-configured',
        type: 'nango',
        provider: 'notion'
      }
    ];

    setConnectors(allConnectors);
  }, []);

  const categories = [
    { id: 'all', name: 'All', count: connectors.length },
    { id: 'data-enrichment', name: 'Data Enrichment', count: connectors.filter(c => c.category === 'data-enrichment').length },
    { id: 'ai-llm', name: 'AI & LLM', count: connectors.filter(c => c.category === 'ai-llm').length },
    { id: 'communication', name: 'Communication', count: connectors.filter(c => c.category === 'communication').length },
    { id: 'integration', name: 'Integration', count: connectors.filter(c => c.category === 'integration').length },
    { id: 'oauth', name: 'OAuth', count: connectors.filter(c => c.category === 'oauth').length },
    { id: 'crm', name: 'CRM', count: connectors.filter(c => c.category === 'crm').length },
    { id: 'productivity', name: 'Productivity', count: connectors.filter(c => c.category === 'productivity').length },
    { id: 'finance', name: 'Finance', count: connectors.filter(c => c.category === 'finance').length },
    { id: 'mcp', name: 'MCP', count: connectors.filter(c => c.category === 'mcp').length }
  ];

  const filteredConnectors = connectors.filter(connector => {
    const matchesSearch = connector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         connector.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || connector.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'configured':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'not-configured':
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
      case 'inactive':
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'configured':
        return 'text-green-600';
      case 'not-configured':
        return 'text-yellow-600';
      case 'inactive':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTypeBadge = (type: string) => {
    const badges = {
      'api': 'bg-blue-100 text-blue-800',
      'mcp': 'bg-purple-100 text-purple-800',
      'nango': 'bg-green-100 text-green-800'
    };
    return badges[type as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="h-full bg-[var(--background)] text-[var(--foreground)] overflow-y-auto invisible-scrollbar">
      <div className="p-6 space-y-6">

        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search connectors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-[var(--panel-background)] text-[var(--muted)] hover:bg-[var(--hover)]'
                }`}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>
        </div>

        {/* Connectors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConnectors.map(connector => (
            <div
              key={connector.id}
              className="bg-[var(--panel-background)] border border-[var(--border)] rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[var(--foreground)]">{connector.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeBadge(connector.type)}`}>
                      {connector.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[var(--muted)] text-sm">{connector.description}</p>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(connector.status)}
                  <span className={`text-xs font-medium ${getStatusColor(connector.status)}`}>
                    {connector.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--muted)] capitalize">
                  {connector.category.replace('-', ' ')}
                </span>
                <div className="flex gap-2">
                  {connector.status === 'not-configured' && (
                    <button className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors">
                      Configure
                    </button>
                  )}
                  {connector.status === 'configured' && (
                    <button className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors">
                      Manage
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredConnectors.length === 0 && (
          <div className="text-center py-12">
            <FunnelIcon className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">No connectors found</h3>
            <p className="text-[var(--muted)]">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="bg-[var(--panel-background)] rounded-lg p-4">
          <h3 className="font-semibold text-[var(--foreground)] mb-3">Integration Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--foreground)]">
                {connectors.filter(c => c.status === 'configured').length}
              </div>
              <div className="text-sm text-[var(--muted)]">Configured</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--foreground)]">
                {connectors.filter(c => c.status === 'not-configured').length}
              </div>
              <div className="text-sm text-[var(--muted)]">Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--foreground)]">
                {connectors.filter(c => c.type === 'api').length}
              </div>
              <div className="text-sm text-[var(--muted)]">APIs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--foreground)]">
                {connectors.filter(c => c.type === 'nango').length}
              </div>
              <div className="text-sm text-[var(--muted)]">Nango</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
