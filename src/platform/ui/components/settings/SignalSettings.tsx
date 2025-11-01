/**
 * 🚨 SIGNAL SETTINGS COMPONENT
 * 
 * Manages user signal configuration from profile popup
 * Allows users to set up and customize their intelligence alerts
 */

"use client";

import React, { useState, useEffect } from 'react';
import { 
  BellIcon, 
  PlusIcon, 
  XMarkIcon, 
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  ClockIcon,
  GlobeAltIcon,
  BuildingOfficeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { useUnifiedAuth } from '@/platform/auth';
import { IntelligentSignalConfig, SIGNAL_TEMPLATES } from '@/platform/services/intelligent-signal-system';

interface SignalSettingsProps {
  isVisible: boolean;
  onClose: () => void;
}

interface SignalRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  config: {
    companies: string[];
    roles: string[];
    signalTypes: string[];
    priority: 'low' | 'medium' | 'high' | 'urgent';
    frequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
  };
  createdAt: string;
  lastTriggered?: string;
}

export function SignalSettings({ isVisible, onClose }: SignalSettingsProps) {
  const { user } = useUnifiedAuth();
  const [signalRules, setSignalRules] = useState<SignalRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRuleInput, setNewRuleInput] = useState('');
  const [isProcessingNL, setIsProcessingNL] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const workspaceId = user?.activeWorkspaceId || user?.workspaces?.[0]?.id;
  const userId = user?.id;

  // Load existing signal rules
  useEffect(() => {
    if (isVisible && userId && workspaceId) {
      loadSignalRules();
    }
  }, [isVisible, userId, workspaceId]);

  const loadSignalRules = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/signals/rules?userId=${userId}&workspaceId=${workspaceId}`);
      
      if (response.ok) {
        const data = await response.json();
        setSignalRules(data.rules || []);
      }
    } catch (error) {
      console.error('Failed to load signal rules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNaturalLanguageInput = async () => {
    if (!newRuleInput.trim() || !userId || !workspaceId) return;

    try {
      setIsProcessingNL(true);
      
      // Process natural language input
      const response = await fetch('/api/ai/process-signal-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: newRuleInput,
          userId,
          workspaceId,
          context: {
            currentPage: 'signal_settings'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const processed = data.processed;

        if (processed.confidence >= 70) {
          // Create signal rule from processed request
          await createSignalRule({
            name: processed.suggestedAction,
            description: newRuleInput,
            config: {
              companies: processed.parameters.companies || [],
              roles: processed.parameters.roles || [],
              signalTypes: processed.parameters.signalTypes || [],
              priority: 'medium',
              frequency: processed.parameters.timeframe || 'real_time'
            }
          });
          
          setNewRuleInput('');
          setShowAddRule(false);
        } else {
          // Show clarification needed
          alert(`I need more information: ${processed.clarificationNeeded?.join(', ')}`);
        }
      }
    } catch (error) {
      console.error('Failed to process natural language input:', error);
      alert('Failed to process your request. Please try again.');
    } finally {
      setIsProcessingNL(false);
    }
  };

  const createSignalRule = async (ruleData: Partial<SignalRule>) => {
    try {
      const response = await fetch('/api/signals/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ruleData,
          userId,
          workspaceId,
          isActive: true,
          createdAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        await loadSignalRules(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to create signal rule:', error);
    }
  };

  const toggleSignalRule = async (ruleId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/signals/rules/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });

      if (response.ok) {
        setSignalRules(prev => prev.map(rule => 
          rule['id'] === ruleId ? { ...rule, isActive } : rule
        ));
      }
    } catch (error) {
      console.error('Failed to toggle signal rule:', error);
    }
  };

  const deleteSignalRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this signal rule?')) return;

    try {
      const response = await fetch(`/api/signals/rules/${ruleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSignalRules(prev => prev.filter(rule => rule.id !== ruleId));
      }
    } catch (error) {
      console.error('Failed to delete signal rule:', error);
    }
  };

  const createFromTemplate = async (templateKey: string) => {
    const template = SIGNAL_TEMPLATES[templateKey as keyof typeof SIGNAL_TEMPLATES];
    if (!template) return;

    await createSignalRule({
      name: template.name,
      description: template.description,
      config: {
        companies: [],
        roles: template.roles || [],
        signalTypes: template.signalTypes,
        priority: template.priority as 'low' | 'medium' | 'high' | 'urgent',
        frequency: 'real_time'
      }
    });

    setSelectedTemplate(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--background)] rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)] dark:border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <BellIcon className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--foreground)] dark:text-white">
                Signal Settings
              </h2>
              <p className="text-sm text-[var(--muted)] dark:text-[var(--muted)]">
                Configure your intelligence alerts and monitoring
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--hover)] rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-[var(--muted)]" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Sidebar */}
          <div className="w-80 border-r border-[var(--border)] dark:border-[var(--border)] p-6">
            <div className="space-y-4">
              {/* Add New Signal */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowAddRule(!showAddRule)}
                  className="w-full flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  Add New Signal
                </button>

                {showAddRule && (
                  <div className="space-y-3 p-4 bg-[var(--panel-background)]/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-[var(--muted)] dark:text-[var(--muted)]">
                      <SparklesIcon className="w-4 h-4" />
                      Describe what you want to monitor
                    </div>
                    <textarea
                      value={newRuleInput}
                      onChange={(e) => setNewRuleInput(e.target.value)}
                      placeholder="e.g., Alert me when Nike hires a new CTO"
                      className="w-full p-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleNaturalLanguageInput}
                        disabled={isProcessingNL || !newRuleInput.trim()}
                        className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        {isProcessingNL ? 'Processing...' : 'Create Signal'}
                      </button>
                      <button
                        onClick={() => setShowAddRule(false)}
                        className="px-3 py-2 text-[var(--muted)] hover:text-gray-700 dark:text-[var(--muted)] dark:hover:text-gray-200 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Templates */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quick Templates
                </h3>
                <div className="space-y-2">
                  {Object.entries(SIGNAL_TEMPLATES).map(([key, template]) => (
                    <button
                      key={key}
                      onClick={() => createFromTemplate(key)}
                      className="w-full text-left p-3 bg-[var(--panel-background)]/50 rounded-lg hover:bg-[var(--hover)] transition-colors"
                    >
                      <div className="text-sm font-medium text-[var(--foreground)] dark:text-white">
                        {template.name}
                      </div>
                      <div className="text-xs text-[var(--muted)] dark:text-[var(--muted)] mt-1">
                        {template.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-[var(--muted)] dark:text-[var(--muted)]">Loading signal rules...</div>
              </div>
            ) : signalRules['length'] === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <BellIcon className="w-12 h-12 text-gray-300 dark:text-[var(--muted)] mb-4" />
                <h3 className="text-lg font-medium text-[var(--foreground)] dark:text-white mb-2">
                  No Signal Rules Yet
                </h3>
                <p className="text-[var(--muted)] dark:text-[var(--muted)] mb-4">
                  Create your first signal rule to start monitoring companies and opportunities
                </p>
                <button
                  onClick={() => setShowAddRule(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Create First Signal
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-[var(--foreground)] dark:text-white">
                    Active Signal Rules ({signalRules.filter(r => r.isActive).length})
                  </h3>
                  <div className="text-sm text-[var(--muted)] dark:text-[var(--muted)]">
                    {signalRules.length} total rules
                  </div>
                </div>

                <div className="grid gap-4">
                  {signalRules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        rule.isActive
                          ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
                          : 'border-[var(--border)] dark:border-[var(--border)] bg-[var(--panel-background)]/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-[var(--foreground)] dark:text-white">
                              {rule.name}
                            </h4>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                rule.isActive
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : 'bg-[var(--hover)] text-[var(--muted)] dark:text-[var(--muted)]'
                              }`}
                            >
                              {rule.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          
                          <p className="text-sm text-[var(--muted)] dark:text-[var(--muted)] mb-3">
                            {rule.description}
                          </p>

                          <div className="flex flex-wrap gap-4 text-xs text-[var(--muted)] dark:text-[var(--muted)]">
                            {rule.config.companies.length > 0 && (
                              <div className="flex items-center gap-1">
                                <BuildingOfficeIcon className="w-3 h-3" />
                                {rule.config.companies.length} companies
                              </div>
                            )}
                            {rule.config.roles.length > 0 && (
                              <div className="flex items-center gap-1">
                                <UserGroupIcon className="w-3 h-3" />
                                {rule.config.roles.length} roles
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <ClockIcon className="w-3 h-3" />
                              {rule.config.frequency}
                            </div>
                            {rule['lastTriggered'] && (
                              <div>
                                Last triggered: {new Date(rule.lastTriggered).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => toggleSignalRule(rule.id, !rule.isActive)}
                            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                              rule.isActive
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50'
                                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                            }`}
                          >
                            {rule.isActive ? 'Pause' : 'Activate'}
                          </button>
                          <button
                            onClick={() => deleteSignalRule(rule.id)}
                            className="p-1 text-[var(--muted)] hover:text-red-500 transition-colors"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
