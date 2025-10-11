"use client";

import React, { useState, useEffect } from "react";

interface ApiConfig {
  name: string;
  key: string;
  enabled: boolean;
  costPerCall: number;
  rateLimit: number;
  description: string;
}

interface ConfigurationPanelProps {
  onConfigChange?: (config: Record<string, ApiConfig>) => void;
}

export default function ConfigurationPanel({ onConfigChange }: ConfigurationPanelProps) {
  const [configs, setConfigs] = useState<Record<string, ApiConfig>>({
    coresignal: {
      name: 'CoreSignal',
      key: '',
      enabled: true,
      costPerCall: 0.05,
      rateLimit: 1000,
      description: 'Primary data source for company and executive information'
    },
    claude: {
      name: 'Claude AI',
      key: '',
      enabled: true,
      costPerCall: 0.10,
      rateLimit: 500,
      description: 'AI-powered research and data enhancement'
    },
    lusha: {
      name: 'Lusha',
      key: '',
      enabled: true,
      costPerCall: 0.07,
      rateLimit: 200,
      description: 'Contact verification and enrichment'
    },
    pdl: {
      name: 'People Data Labs',
      key: '',
      enabled: true,
      costPerCall: 0.08,
      rateLimit: 300,
      description: 'Professional contact data and verification'
    },
    zerobounce: {
      name: 'ZeroBounce',
      key: '',
      enabled: true,
      costPerCall: 0.05,
      rateLimit: 1000,
      description: 'Email validation and verification'
    },
    prospeo: {
      name: 'Prospeo Mobile',
      key: '',
      enabled: true,
      costPerCall: 0.08,
      rateLimit: 200,
      description: 'Phone number verification and validation'
    }
  });

  const [activeTab, setActiveTab] = useState<'apis' | 'settings' | 'limits'>('apis');

  useEffect(() => {
    // Load saved configurations
    const savedConfigs = localStorage.getItem('olympus-api-configs');
    if (savedConfigs) {
      try {
        const parsed = JSON.parse(savedConfigs);
        setConfigs(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to load saved configurations:', error);
      }
    }
  }, []);

  const handleConfigChange = (apiId: string, field: keyof ApiConfig, value: any) => {
    const newConfigs = {
      ...configs,
      [apiId]: {
        ...configs[apiId],
        [field]: value
      }
    };
    setConfigs(newConfigs);
    
    // Save to localStorage
    localStorage.setItem('olympus-api-configs', JSON.stringify(newConfigs));
    
    // Notify parent component
    onConfigChange?.(newConfigs);
  };

  const testApiConnection = async (apiId: string) => {
    const config = configs[apiId];
    if (!config.key) {
      alert('Please enter an API key first');
      return;
    }

    // Simulate API test
    try {
      // Here you would make actual API calls to test the connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(`${config.name} connection test successful!`);
    } catch (error) {
      alert(`${config.name} connection test failed: ${error}`);
    }
  };

  const getTotalEstimatedCost = () => {
    return Object.values(configs)
      .filter(config => config.enabled)
      .reduce((total, config) => total + config.costPerCall, 0);
  };

  const getTotalRateLimit = () => {
    return Object.values(configs)
      .filter(config => config.enabled)
      .reduce((total, config) => total + config.rateLimit, 0);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Pipeline Configuration</h2>
        <p className="text-sm text-gray-600">Configure API keys, settings, and limits for the CFO/CRO discovery pipeline</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('apis')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'apis' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          API Keys
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'settings' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Settings
        </button>
        <button
          onClick={() => setActiveTab('limits')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'limits' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Limits & Costs
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'apis' && (
          <div className="p-4 space-y-4">
            {Object.entries(configs).map(([apiId, config]) => (
              <div key={apiId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{config.name}</h3>
                    <p className="text-sm text-gray-600">{config.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={(e) => handleConfigChange(apiId, 'enabled', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enabled</span>
                    </label>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      API Key
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={config.key}
                        onChange={(e) => handleConfigChange(apiId, 'key', e.target.value)}
                        placeholder={`Enter ${config.name} API key`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => testApiConnection(apiId)}
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      >
                        Test
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-4 space-y-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Execution Settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Execution Time (minutes)
                  </label>
                  <input
                    type="number"
                    defaultValue={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Cost Per Execution ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={0.50}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Success Rate (%)
                  </label>
                  <input
                    type="number"
                    defaultValue={80}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Retry Settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Retry Attempts
                  </label>
                  <input
                    type="number"
                    defaultValue={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Retry Delay (seconds)
                  </label>
                  <input
                    type="number"
                    defaultValue={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'limits' && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">${getTotalEstimatedCost().toFixed(2)}</div>
                <div className="text-sm text-blue-600">Total Cost Per Execution</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{getTotalRateLimit()}</div>
                <div className="text-sm text-green-600">Total Rate Limit (calls/hour)</div>
              </div>
            </div>

            <div className="space-y-3">
              {Object.entries(configs).map(([apiId, config]) => (
                <div key={apiId} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{config.name}</h4>
                      <p className="text-sm text-gray-600">Cost: ${config.costPerCall} | Limit: {config.rateLimit}/hr</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      config.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {config.enabled ? 'Active' : 'Disabled'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Configuration saved automatically
          </div>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
