"use client";

import React from 'react';
import { APIRegistryItem } from '../data/api-registry';
import { APIStatus } from '../services/ApiStatusService';
import { Breadcrumb } from './Breadcrumb';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  ClockIcon,
  LinkIcon,
  CodeBracketIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface APIDetailViewProps {
  api: APIRegistryItem;
  status?: APIStatus;
  displayName?: string; // New prop for showing name with ULID
  onBack?: () => void;
  onBackToList?: () => void;
}

export function APIDetailView({ api, status, displayName, onBack, onBackToList }: APIDetailViewProps) {
  const getStatusIcon = () => {
    if (!status) return <ClockIcon className="w-5 h-5 text-gray-400" />;
    
    switch (status.status) {
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
    if (!status) return 'text-gray-500';
    
    switch (status.status) {
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

  const getCategoryColor = (category: string) => {
    const colors = {
      'data-enrichment': 'bg-blue-100 text-blue-800',
      'ai-llm': 'bg-purple-100 text-purple-800',
      'communication': 'bg-green-100 text-green-800',
      'integration': 'bg-orange-100 text-orange-800',
      'oauth': 'bg-pink-100 text-pink-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="h-full bg-background text-foreground overflow-y-auto invisible-scrollbar">
      <Breadcrumb items={[
        { label: 'Grand Central', onClick: () => window.location.href = window.location.pathname.split('/').slice(0, 3).join('/') },
        { label: 'APIs', onClick: () => window.location.href = window.location.pathname.split('/').slice(0, 3).join('/') + '/apis' },
        { label: displayName || api.name }
      ]} />
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground">{api.name}</h1>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(api.category)}`}>
                  {api.category.replace('-', ' ').toUpperCase()}
                </span>
              </div>
              <p className="text-muted text-lg">{api.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className={`font-medium ${getStatusColor()}`}>
                {status?.status || 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* Status Information */}
        {status && (
          <div className="bg-panel-background rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5" />
              Configuration Status
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted">Configured:</span>
                <span className={status.isConfigured ? 'text-green-600' : 'text-red-600'}>
                  {status.isConfigured ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Valid Keys:</span>
                <span className={status.hasValidKeys ? 'text-green-600' : 'text-red-600'}>
                  {status.hasValidKeys ? 'Yes' : 'No'}
                </span>
              </div>
              {status.errorMessage && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{status.errorMessage}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Endpoints */}
        <div className="bg-panel-background rounded-lg p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <CodeBracketIcon className="w-5 h-5" />
            API Endpoints
          </h3>
          <div className="space-y-3">
            {api.endpoints.map((endpoint, index) => (
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
              <span className="font-medium">{api.authentication.type}</span>
            </div>
            <div>
              <span className="text-muted">Environment Variables:</span>
              <div className="mt-1 space-y-1">
                {api.authentication.envVars.map((envVar, index) => (
                  <code key={index} className="block text-sm font-mono bg-background px-2 py-1 rounded">
                    {envVar}
                  </code>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-panel-background rounded-lg p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <CurrencyDollarIcon className="w-5 h-5" />
            Pricing
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted">Model:</span>
              <span className="font-medium">{api.pricing.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Cost:</span>
              <span className="font-medium">{api.pricing.cost}</span>
            </div>
            {api.pricing.rateLimit && (
              <div className="flex justify-between">
                <span className="text-muted">Rate Limit:</span>
                <span className="font-medium">{api.pricing.rateLimit}</span>
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
                href={api.documentation.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {api.documentation.url}
              </a>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Setup Guide:</h4>
              <p className="text-muted text-sm">{api.documentation.setupGuide}</p>
            </div>
          </div>
        </div>

        {/* Usage Locations */}
        <div className="bg-panel-background rounded-lg p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <CodeBracketIcon className="w-5 h-5" />
            Usage Locations
          </h3>
          <div className="space-y-1">
            {api.usageLocations.map((location, index) => (
              <code key={index} className="block text-sm font-mono text-muted bg-background px-2 py-1 rounded">
                {location}
              </code>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
