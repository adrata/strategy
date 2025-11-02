"use client";

import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  LinkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { useUnifiedAuth } from "@/platform/auth";

interface GrandCentralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'expired' | 'disconnected' | 'error';
  lastSync?: Date;
  email?: string;
  isImplemented: boolean;
  connectUrl?: string;
  testEndpoint?: string;
}

export function GrandCentralModal({ isOpen, onClose }: GrandCentralModalProps) {
  const [activeTab, setActiveTab] = useState<'integrations' | 'sync' | 'settings'>('integrations');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingIntegration, setTestingIntegration] = useState<string | null>(null);
  const { user } = useUnifiedAuth();

  // Load actual integration status
  useEffect(() => {
    if (isOpen) {
      loadIntegrationStatus();
    }
  }, [isOpen]);

  const loadIntegrationStatus = async () => {
    setLoading(true);
    try {
      const workspaceId = user?.activeWorkspaceId || user?.workspaces?.[0]?.id;
      
      // Check email sync status
      const emailResponse = await fetch(`/api/email/sync?workspaceId=${workspaceId}`);
      const emailData = await emailResponse.json();
      
      // Check provider tokens
      const tokensResponse = await fetch(`/api/auth/providers/status?workspaceId=${workspaceId}`);
      const tokensData = await tokensResponse.json();
      
      // Check webhook status
      const webhookResponse = await fetch(`/api/webhooks/renew?workspaceId=${workspaceId}`);
      const webhookData = await webhookResponse.json();
      
      const integrationList: Integration[] = [
        {
          id: 'microsoft',
          name: 'Microsoft Outlook',
          description: `Email sync and calendar integration${webhookData?.webhooks?.find((w: any) => w['platform'] === 'outlook')?.needsRenewal ? ' (webhook expiring)' : ''}`,
          status: getIntegrationStatus(tokensData?.providers, 'microsoft'),
          lastSync: emailData?.accounts?.find((a: any) => a['platform'] === 'outlook')?.lastSyncAt,
          email: tokensData?.providers?.microsoft?.email,
          isImplemented: true,
          connectUrl: '/api/auth/microsoft/authorize',
          testEndpoint: '/api/sync/refresh-microsoft-token'
        },
        {
          id: 'zoho',
          name: 'Zoho CRM',
          description: 'CRM data sync and webhook integration',
          status: getIntegrationStatus(tokensData?.providers, 'zoho'),
          email: tokensData?.providers?.zoho?.email,
          isImplemented: true,
          connectUrl: '/api/auth/zoho/authorize',
          testEndpoint: '/api/webhooks/zoho'
        },
        {
          id: 'coresignal',
          name: 'CoreSignal',
          description: 'Company and people data enrichment',
          status: tokensData?.environment?.coresignal ? 'connected' : 'disconnected',
          isImplemented: true,
          testEndpoint: '/api/data/coresignal/test'
        },
        {
          id: 'twilio',
          name: 'Twilio',
          description: 'Phone number lookup and validation',
          status: tokensData?.environment?.twilio ? 'connected' : 'disconnected',
          isImplemented: true,
          testEndpoint: '/api/phone/lookup/test'
        },
        {
          id: 'resend',
          name: 'Resend',
          description: 'Email delivery service',
          status: tokensData?.environment?.resend ? 'connected' : 'disconnected',
          isImplemented: true,
          testEndpoint: '/api/email/send'
        },
        {
          id: 'pusher',
          name: 'Pusher Real-time',
          description: 'Real-time notifications and signals',
          status: tokensData?.environment?.pusher ? 'connected' : 'disconnected',
          isImplemented: true,
          testEndpoint: '/api/test/pusher'
        }
      ];

      // Only show implemented integrations
      setIntegrations(integrationList.filter(i => i.isImplemented));
      
    } catch (error) {
      console.error('Failed to load integration status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIntegrationStatus = (tokensData: any, provider: string): Integration['status'] => {
    const token = tokensData?.[provider];
    if (!token) return 'disconnected';
    if (token.expired) return 'expired';
    if (token.error) return 'error';
    return 'connected';
  };

  const handleConnect = async (integration: Integration) => {
    if (integration.connectUrl) {
      window.open(integration.connectUrl, '_blank');
    }
  };

  const handleTest = async (integration: Integration) => {
    if (!integration.testEndpoint) return;
    
    setTestingIntegration(integration.id);
    try {
      const response = await fetch(integration.testEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true, workspaceId: user?.activeWorkspaceId })
      });
      
      const result = await response.json();
      console.log(`Test result for ${integration.name}:`, result);
      
      // Refresh status after test
      await loadIntegrationStatus();
      
    } catch (error) {
      console.error(`Test failed for ${integration.name}:`, error);
    } finally {
      setTestingIntegration(null);
    }
  };

  const getStatusIcon = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'expired':
        return <ClockIcon className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      default:
        return <XMarkIcon className="w-5 h-5 text-muted" />;
    }
  };

  const getStatusColor = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'expired':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-muted bg-panel-background border-border';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <LinkIcon className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-foreground">Grand Central</h2>
              <p className="text-muted">Integration Hub & Data Connections</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-hover rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex space-x-8 px-6">
            {[
              { id: 'integrations', name: 'Integrations', icon: LinkIcon },
              { id: 'sync', name: 'Sync Status', icon: ArrowPathIcon },
              { id: 'settings', name: 'Settings', icon: CheckCircleIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-muted hover:text-gray-700 hover:border-border'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'integrations' && (
            <div className="space-y-4">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Active Integrations</h3>
                <p className="text-muted text-sm">
                  Connect your data sources to enable real-time sync and intelligence
                </p>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse border border-border rounded-lg p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-loading-bg rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-loading-bg rounded w-1/4"></div>
                          <div className="h-3 bg-loading-bg rounded w-3/4"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {integrations.map((integration) => (
                    <div
                      key={integration.id}
                      className="border border-border rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            {getStatusIcon(integration.status)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{integration.name}</h4>
                            <p className="text-sm text-muted">{integration.description}</p>
                            {integration['email'] && (
                              <p className="text-xs text-muted mt-1">Connected: {integration.email}</p>
                            )}
                            {integration['lastSync'] && (
                              <p className="text-xs text-muted">
                                Last sync: {new Date(integration.lastSync).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(integration.status)}`}>
                            {integration.status}
                          </span>
                          {integration['status'] === 'disconnected' || integration['status'] === 'expired' ? (
                            <button
                              onClick={() => handleConnect(integration)}
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              {integration['status'] === 'expired' ? 'Reconnect' : 'Connect'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleTest(integration)}
                              disabled={testingIntegration === integration.id}
                              className="px-4 py-2 bg-hover text-gray-700 text-sm rounded-lg hover:bg-loading-bg transition-colors disabled:opacity-50"
                            >
                              {testingIntegration === integration.id ? 'Testing...' : 'Test'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'sync' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Sync Status</h3>
                <p className="text-muted text-sm mb-4">
                  Monitor real-time data synchronization across all connected platforms
                </p>
              </div>

              {/* Email Sync Health Check */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-900 mb-2">Email Sync Health</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Microsoft Graph webhooks expire every 3 days and need renewal to maintain real-time sync
                </p>
                <button
                  onClick={async () => {
                    setTestingIntegration('webhook-renewal');
                    try {
                      const response = await fetch('/api/webhooks/renew', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          workspaceId: user?.activeWorkspaceId,
                          force: true 
                        })
                      });
                      const result = await response.json();
                      console.log('Webhook renewal result:', result);
                      await loadIntegrationStatus(); // Refresh
                    } catch (error) {
                      console.error('Webhook renewal failed:', error);
                    } finally {
                      setTestingIntegration(null);
                    }
                  }}
                  disabled={testingIntegration === 'webhook-renewal'}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {testingIntegration === 'webhook-renewal' ? 'Renewing...' : 'Renew All Webhooks'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations.filter(i => i['status'] === 'connected').map((integration) => (
                  <div key={integration.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-foreground">{integration.name}</h4>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          integration['status'] === 'connected' ? 'bg-green-500' : 
                          integration['status'] === 'expired' ? 'bg-yellow-500' : 'bg-gray-400'
                        }`}></div>
                        <span className="text-xs text-muted">
                          {integration['status'] === 'connected' ? 'Active' : 
                           integration['status'] === 'expired' ? 'Expired' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    
                    {integration['lastSync'] && (
                      <div className="text-sm text-muted">
                        Last sync: {new Date(integration.lastSync).toLocaleString()}
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleTest(integration)}
                      disabled={testingIntegration === integration.id}
                      className="mt-3 w-full px-3 py-2 bg-hover text-gray-700 text-sm rounded hover:bg-loading-bg transition-colors disabled:opacity-50"
                    >
                      {testingIntegration === integration.id ? 'Syncing...' : 'Sync Now'}
                    </button>
                  </div>
                ))}
              </div>

              {integrations.filter(i => i['status'] === 'connected').length === 0 && (
                <div className="text-center py-8">
                  <ExclamationTriangleIcon className="w-12 h-12 text-muted mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Active Integrations</h3>
                  <p className="text-muted">Connect your data sources to enable sync monitoring</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Integration Settings</h3>
                <p className="text-muted text-sm mb-4">
                  Configure sync frequency and data processing options
                </p>
              </div>

              <div className="space-y-4">
                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-2">Email Sync Frequency</h4>
                  <select className="w-full px-3 py-2 border border-border rounded-lg">
                    <option value="5">Every 5 minutes</option>
                    <option value="15" selected>Every 15 minutes</option>
                    <option value="30">Every 30 minutes</option>
                    <option value="60">Every hour</option>
                  </select>
                </div>

                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-2">Signal Detection</h4>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      <span className="text-sm text-gray-700">Enable buying signal detection</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      <span className="text-sm text-gray-700">Auto-add high-priority signals to Speedrun</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm text-gray-700">Send email notifications for critical signals</span>
                    </label>
                  </div>
                </div>

                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-2">Data Retention</h4>
                  <select className="w-full px-3 py-2 border border-border rounded-lg">
                    <option value="30">30 days</option>
                    <option value="90" selected>90 days</option>
                    <option value="365">1 year</option>
                    <option value="unlimited">Unlimited</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-panel-background">
          <div className="text-sm text-muted">
            {integrations.filter(i => i['status'] === 'connected').length} of {integrations.length} integrations active
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadIntegrationStatus}
              className="px-4 py-2 text-gray-700 bg-background border border-border rounded-lg hover:bg-panel-background transition-colors"
            >
              Refresh Status
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
