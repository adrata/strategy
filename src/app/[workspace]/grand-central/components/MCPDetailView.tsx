"use client";

import React from 'react';
import { MCPRegistryItem } from '../data/mcp-registry';
import { Breadcrumb } from './Breadcrumb';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  ClockIcon,
  LinkIcon,
  CodeBracketIcon,
  ShieldCheckIcon,
  ServerIcon
} from '@heroicons/react/24/outline';

interface MCPDetailViewProps {
  mcp: MCPRegistryItem;
  displayName?: string; // New prop for showing name with ULID
  onBack?: () => void;
  onBackToList?: () => void;
}

export function MCPDetailView({ mcp, displayName, onBack, onBackToList }: MCPDetailViewProps) {
  const getStatusIcon = () => {
    switch (mcp.status) {
      case 'configured':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'not-configured':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'inactive':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (mcp.status) {
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

  return (
    <div className="h-full bg-background text-foreground overflow-y-auto invisible-scrollbar">
      <Breadcrumb items={[
        { label: 'Grand Central', onClick: () => window.location.href = '/grand-central' },
        { label: 'MCPs', onClick: () => window.location.href = '/grand-central/mcps' },
        { label: displayName || mcp.name }
      ]} />
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <ServerIcon className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-foreground">{mcp.name}</h1>
              </div>
              <p className="text-muted text-lg">{mcp.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className={`font-medium ${getStatusColor()}`}>
                {mcp.status}
              </span>
            </div>
          </div>
        </div>

        {/* Status Information */}
        <div className="bg-panel-background rounded-lg p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <ShieldCheckIcon className="w-5 h-5" />
            MCP Server Status
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted">Status:</span>
              <span className={`font-medium ${getStatusColor()}`}>
                {mcp.status.charAt(0).toUpperCase() + mcp.status.slice(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Type:</span>
              <span className="font-medium">Model Context Protocol Server</span>
            </div>
          </div>
        </div>

        {/* Endpoints */}
        <div className="bg-panel-background rounded-lg p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <CodeBracketIcon className="w-5 h-5" />
            MCP Endpoints
          </h3>
          <div className="space-y-3">
            {mcp.endpoints.map((endpoint, index) => (
              <div key={index} className="border border-border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                    endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                    endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                    endpoint.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="text-sm font-mono text-foreground bg-background px-2 py-1 rounded">
                    {endpoint.path}
                  </code>
                </div>
                <p className="text-muted text-sm">{endpoint.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Authentication */}
        <div className="bg-panel-background rounded-lg p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <ShieldCheckIcon className="w-5 h-5" />
            Authentication
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted">Type:</span>
              <span className="font-medium">{mcp.authentication.type}</span>
            </div>
            {mcp.authentication.envVars.length > 0 && (
              <div>
                <span className="text-muted">Environment Variables:</span>
                <div className="mt-1 space-y-1">
                  {mcp.authentication.envVars.map((envVar, index) => (
                    <code key={index} className="block text-sm font-mono bg-background px-2 py-1 rounded">
                      {envVar}
                    </code>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Documentation */}
        <div className="bg-panel-background rounded-lg p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            Documentation
          </h3>
          <div className="space-y-3">
            <div>
              <a 
                href={mcp.documentation.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {mcp.documentation.url}
              </a>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Setup Guide:</h4>
              <p className="text-muted text-sm">{mcp.documentation.setupGuide}</p>
            </div>
          </div>
        </div>

        {/* Usage Locations */}
        {mcp.usageLocations.length > 0 && (
          <div className="bg-panel-background rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <CodeBracketIcon className="w-5 h-5" />
              Usage Locations
            </h3>
            <div className="space-y-1">
              {mcp.usageLocations.map((location, index) => (
                <code key={index} className="block text-sm font-mono text-muted bg-background px-2 py-1 rounded">
                  {location}
                </code>
              ))}
            </div>
          </div>
        )}

        {/* MCP Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">About Model Context Protocol (MCP)</h3>
          <p className="text-blue-800 text-sm">
            MCP is a protocol that enables AI assistants to securely connect to data sources and tools. 
            MCP servers provide standardized interfaces for AI models to interact with external systems 
            like databases, file systems, and APIs.
          </p>
        </div>
      </div>
    </div>
  );
}
