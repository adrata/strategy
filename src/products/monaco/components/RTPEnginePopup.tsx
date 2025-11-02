"use client";

import React, { useState } from "react";
import {
  XMarkIcon,
  BoltIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  StarIcon,
  AdjustmentsHorizontalIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/24/outline";

interface RTPEnginePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: RTPConfig) => void;
  initialConfig?: RTPConfig;
  onExpandToAdvanced?: () => void;
}

export interface RTPConfig {
  strategy: "close_quickly" | "sell_faster" | "maximize_value" | "balanced";
  weightings: {
    dealSize: number;
    closeProb: number;
    urgency: number;
    relationshipStrength: number;
    competitiveRisk: number;
  };
  priorities: {
    newLeads: boolean;
    hotProspects: boolean;
    renewals: boolean;
    expansions: boolean;
  };
  thresholds: {
    minDealSize: number;
    minCloseProb: number;
    maxDaysToClose: number;
  };
  aiInsights: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // minutes
}

const DEFAULT_CONFIG: RTPConfig = {
  strategy: "balanced",
  weightings: {
    dealSize: 30,
    closeProb: 25,
    urgency: 20,
    relationshipStrength: 15,
    competitiveRisk: 10,
  },
  priorities: {
    newLeads: true,
    hotProspects: true,
    renewals: true,
    expansions: true,
  },
  thresholds: {
    minDealSize: 50000,
    minCloseProb: 20,
    maxDaysToClose: 90,
  },
  aiInsights: true,
  autoRefresh: true,
  refreshInterval: 15,
};

const STRATEGY_PRESETS: Record<string, Partial<RTPConfig>> = {
  close_quickly: {
    strategy: "close_quickly",
    weightings: {
      dealSize: 15,
      closeProb: 40,
      urgency: 30,
      relationshipStrength: 10,
      competitiveRisk: 5,
    },
    thresholds: {
      minDealSize: 25000,
      minCloseProb: 50,
      maxDaysToClose: 30,
    },
  },
  sell_faster: {
    strategy: "sell_faster",
    weightings: {
      dealSize: 20,
      closeProb: 30,
      urgency: 25,
      relationshipStrength: 20,
      competitiveRisk: 5,
    },
    thresholds: {
      minDealSize: 30000,
      minCloseProb: 30,
      maxDaysToClose: 60,
    },
  },
  maximize_value: {
    strategy: "maximize_value",
    weightings: {
      dealSize: 45,
      closeProb: 20,
      urgency: 10,
      relationshipStrength: 15,
      competitiveRisk: 10,
    },
    thresholds: {
      minDealSize: 100000,
      minCloseProb: 15,
      maxDaysToClose: 180,
    },
  },
  balanced: {
    strategy: "balanced",
    weightings: {
      dealSize: 30,
      closeProb: 25,
      urgency: 20,
      relationshipStrength: 15,
      competitiveRisk: 10,
    },
    thresholds: {
      minDealSize: 50000,
      minCloseProb: 20,
      maxDaysToClose: 90,
    },
  },
};

export const RTPEnginePopup: React.FC<RTPEnginePopupProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConfig = DEFAULT_CONFIG,
  onExpandToAdvanced,
}) => {
  const [config, setConfig] = useState<RTPConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState<"strategy" | "weightings" | "filters" | "automation">("strategy");

  if (!isOpen) return null;

  const handleStrategyChange = (strategy: RTPConfig["strategy"]) => {
    const preset = STRATEGY_PRESETS[strategy];
    setConfig(prev => ({
      ...prev,
      ...preset,
    }));
  };

  const handleWeightingChange = (key: keyof RTPConfig["weightings"], value: number) => {
    setConfig(prev => ({
      ...prev,
      weightings: {
        ...prev.weightings,
        [key]: value,
      },
    }));
  };

  const handleThresholdChange = (key: keyof RTPConfig["thresholds"], value: number) => {
    setConfig(prev => ({
      ...prev,
      thresholds: {
        ...prev.thresholds,
        [key]: value,
      },
    }));
  };

  const handlePriorityChange = (key: keyof RTPConfig["priorities"], value: boolean) => {
    setConfig(prev => ({
      ...prev,
      priorities: {
        ...prev.priorities,
        [key]: value,
      },
    }));
  };

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const getStrategyDescription = (strategy: string) => {
    switch (strategy) {
      case "close_quickly":
        return "Prioritize deals with highest close probability and shortest timeline. Focus on quick wins.";
      case "sell_faster":
        return "Balance speed and value. Emphasize relationships and moderate deal sizes with good velocity.";
      case "maximize_value":
        return "Target largest deals regardless of timeline. Focus on high-value, strategic opportunities.";
      case "balanced":
        return "Balanced approach considering all factors equally. Optimal for most selling situations.";
      default:
        return "";
    }
  };

  const totalWeighting = Object.values(config.weightings).reduce((sum, weight) => sum + weight, 0);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl border border-border shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <BoltIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">RTP Engine Configuration</h2>
              <p className="text-sm text-muted">Fine-tune your Real-Time Prioritization algorithm</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {onExpandToAdvanced && (
              <button
                onClick={onExpandToAdvanced}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-hover transition-colors"
                title="Open Advanced Configuration"
              >
                <ArrowsPointingOutIcon className="w-4 h-4" />
                Advanced
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-hover rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-muted" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {[
            { id: "strategy", label: "Strategy", icon: ChartBarIcon },
            { id: "weightings", label: "Weightings", icon: AdjustmentsHorizontalIcon },
            { id: "filters", label: "Filters", icon: StarIcon },
            { id: "automation", label: "Automation", icon: ClockIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                  : "text-muted hover:text-foreground hover:bg-hover"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === "strategy" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Choose Your Sales Strategy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.keys(STRATEGY_PRESETS).map((strategy) => (
                    <div
                      key={strategy}
                      onClick={() => handleStrategyChange(strategy as RTPConfig["strategy"])}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        config['strategy'] === strategy
                          ? "border-blue-500 bg-blue-50/50"
                          : "border-border hover:border-blue-300 hover:bg-hover"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-3 h-3 rounded-full ${
                          config['strategy'] === strategy ? "bg-blue-500" : "bg-gray-300"
                        }`} />
                        <h4 className="font-semibold text-foreground">
                          {strategy.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </h4>
                      </div>
                      <p className="text-sm text-muted leading-relaxed">
                        {getStrategyDescription(strategy)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "weightings" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Algorithm Weightings</h3>
                <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  totalWeighting === 100 
                    ? "bg-green-100 text-green-800" 
                    : "bg-yellow-100 text-yellow-800"
                }`}>
                  Total: {totalWeighting}%
                </div>
              </div>
              
              <div className="space-y-4">
                {Object.entries(config.weightings).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </label>
                      <span className="text-sm text-muted">{value}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={value}
                      onChange={(e) => handleWeightingChange(key as keyof RTPConfig["weightings"], parseInt(e.target.value))}
                      className="w-full h-2 bg-loading-bg rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                ))}
              </div>
              
              {totalWeighting !== 100 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Weightings should total 100% for optimal algorithm performance.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "filters" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Priority Filters</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(config.priorities).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <label className="text-sm font-medium text-foreground">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </label>
                      <button
                        onClick={() => handlePriorityChange(key as keyof RTPConfig["priorities"], !value)}
                        className={`w-11 h-6 rounded-full transition-colors relative ${
                          value ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 bg-background rounded-full absolute top-1 transition-transform ${
                            value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Opportunity Thresholds</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Minimum Deal Size
                    </label>
                    <div className="flex items-center gap-2">
                      <CurrencyDollarIcon className="w-5 h-5 text-muted" />
                      <input
                        type="number"
                        value={config.thresholds.minDealSize}
                        onChange={(e) => handleThresholdChange("minDealSize", parseInt(e.target.value))}
                        className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="50000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Minimum Close Probability (%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={config.thresholds.minCloseProb}
                      onChange={(e) => handleThresholdChange("minCloseProb", parseInt(e.target.value))}
                      className="w-full h-2 bg-loading-bg rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-sm text-muted mt-1">
                      <span>0%</span>
                      <span>{config.thresholds.minCloseProb}%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Maximum Days to Close
                    </label>
                    <input
                      type="number"
                      value={config.thresholds.maxDaysToClose}
                      onChange={(e) => handleThresholdChange("maxDaysToClose", parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="90"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "automation" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground">Automation Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h4 className="font-medium text-foreground">AI-Powered Insights</h4>
                    <p className="text-sm text-muted">Enable AI to provide dynamic priority adjustments</p>
                  </div>
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, aiInsights: !prev.aiInsights }))}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      config.aiInsights ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-background rounded-full absolute top-1 transition-transform ${
                        config.aiInsights ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h4 className="font-medium text-foreground">Auto-Refresh</h4>
                    <p className="text-sm text-muted">Automatically update priorities in real-time</p>
                  </div>
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, autoRefresh: !prev.autoRefresh }))}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      config.autoRefresh ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-background rounded-full absolute top-1 transition-transform ${
                        config.autoRefresh ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {config['autoRefresh'] && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Refresh Interval (minutes)
                    </label>
                    <select
                      value={config.refreshInterval}
                      onChange={(e) => setConfig(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={5}>5 minutes</option>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <div className="text-sm text-muted">
            Changes will apply to your RTP rankings immediately
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 