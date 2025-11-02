"use client";

import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  BoltIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  StarIcon,
  AdjustmentsHorizontalIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  SparklesIcon,
  TrophyIcon,
  UserGroupIcon,
  LightBulbIcon,
  FireIcon,
  ShieldCheckIcon,
  CogIcon,
  EyeIcon,
  BeakerIcon,
  RocketLaunchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { RTPConfig } from "./RTPEnginePopup";
import type { AdvancedRTPConfig } from "./RTPTypes";

// Import RTPEngineCompetitiveIntelligence after types to prevent circular dependency
import { RTPEngineCompetitiveIntelligence } from "./RTPEngineCompetitiveIntelligence";

interface RTPEngineAdvancedProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AdvancedRTPConfig) => void;
  initialConfig?: AdvancedRTPConfig;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export interface AdvancedRTPConfig extends RTPConfig {
  // Advanced AI-powered features
  aiPredictiveScoring: boolean;
  behavioralTriggers: {
    emailEngagement: number;
    websiteActivity: number;
    contentDownloads: number;
    socialMediaActivity: number;
    meetingRequests: number;
  };
  
  // Product-specific strategies
  productStrategies: {
    [productId: string]: {
      name: string;
      priorityMultiplier: number;
      dealSizeRange: { min: number; max: number };
      targetPersonas: string[];
      salesCycleWeight: number;
    };
  };
  
  // Market intelligence
  marketFactors: {
    industryTrends: number;
    competitorMoves: number;
    seasonalFactors: number;
    budgetCycles: number;
    economicIndicators: number;
  };
  
  // Dynamic thresholds
  dynamicAdjustments: {
    pipelineHealthBoost: boolean;
    quotaAttainmentFactor: boolean;
    territoryPerformance: boolean;
    historicalWinRate: boolean;
  };
  
  // Risk assessment
  riskFactors: {
    competitiveThreat: number;
    championStrength: number;
    budgetConfirmation: number;
    decisionTimeframe: number;
    implementationComplexity: number;
  };
  
  // Seller personalization
  sellerProfile: {
    experience: "junior" | "mid" | "senior" | "expert";
    strengths: string[];
    preferredDealSize: { min: number; max: number };
    industryExpertise: string[];
    quotaAttainment: number;
  };
  
  // Advanced settings
  realTimeUpdates: {
    frequency: number; // seconds
    dataSourcePriority: string[];
    alertThresholds: {
      hotLead: number;
      coldLead: number;
      urgentAction: number;
    };
  };
}

const DEFAULT_ADVANCED_CONFIG: AdvancedRTPConfig = {
  // Base config
  strategy: "balanced",
  weightings: {
    dealSize: 25,
    closeProb: 20,
    urgency: 15,
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
  
  // Advanced features
  aiPredictiveScoring: true,
  behavioralTriggers: {
    emailEngagement: 20,
    websiteActivity: 15,
    contentDownloads: 25,
    socialMediaActivity: 10,
    meetingRequests: 30,
  },
  
  productStrategies: {
    "enterprise-security": {
      name: "Enterprise Security",
      priorityMultiplier: 1.5,
      dealSizeRange: { min: 100000, max: 2000000 },
      targetPersonas: ["CISO", "CTO", "VP Security"],
      salesCycleWeight: 0.8,
    },
    "cloud-infrastructure": {
      name: "Cloud Infrastructure", 
      priorityMultiplier: 1.3,
      dealSizeRange: { min: 50000, max: 1000000 },
      targetPersonas: ["CTO", "VP Engineering", "Cloud Architect"],
      salesCycleWeight: 1.0,
    },
    "data-analytics": {
      name: "Data Analytics",
      priorityMultiplier: 1.2,
      dealSizeRange: { min: 75000, max: 500000 },
      targetPersonas: ["CDO", "VP Data", "Analytics Director"],
      salesCycleWeight: 1.1,
    },
  },
  
  marketFactors: {
    industryTrends: 15,
    competitorMoves: 20,
    seasonalFactors: 10,
    budgetCycles: 25,
    economicIndicators: 10,
  },
  
  dynamicAdjustments: {
    pipelineHealthBoost: true,
    quotaAttainmentFactor: true,
    territoryPerformance: true,
    historicalWinRate: true,
  },
  
  riskFactors: {
    competitiveThreat: 25,
    championStrength: 20,
    budgetConfirmation: 20,
    decisionTimeframe: 15,
    implementationComplexity: 10,
  },
  
  sellerProfile: {
    experience: "mid",
    strengths: ["Technical Selling", "Relationship Building"],
    preferredDealSize: { min: 50000, max: 500000 },
    industryExpertise: ["Technology", "Financial Services"],
    quotaAttainment: 85,
  },
  
  realTimeUpdates: {
    frequency: 300, // 5 minutes
    dataSourcePriority: ["CRM", "BrightData", "Email", "Website", "Social"],
    alertThresholds: {
      hotLead: 85,
      coldLead: 25,
      urgentAction: 95,
    },
  },
};

export const RTPEngineAdvanced: React.FC<RTPEngineAdvancedProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConfig = DEFAULT_ADVANCED_CONFIG,
  isExpanded,
  onToggleExpanded,
}) => {
  const [config, setConfig] = useState<AdvancedRTPConfig>(initialConfig || DEFAULT_ADVANCED_CONFIG);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [activeSubTab, setActiveSubTab] = useState<string>("");
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [previewMode, setPreviewMode] = useState(false);

  // Sync with initialConfig prop changes
  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  // Generate AI recommendations based on current config
  useEffect(() => {
    const generateRecommendations = () => {
      const recommendations = [
        {
          type: "optimization",
          title: "Increase Email Engagement Weight",
          description: "Your email engagement weight is below industry average. Consider increasing to 25% for better lead scoring.",
          impact: "high",
          currentValue: config.behavioralTriggers.emailEngagement,
          suggestedValue: 25,
        },
        {
          type: "risk",
          title: "Competitive Threat Monitoring",
          description: "Enable real-time competitive threat detection for deals above $200K.",
          impact: "medium",
          enabled: config.riskFactors.competitiveThreat > 20,
        },
        {
          type: "performance",
          title: "Quota Attainment Boost",
          description: "You're at 85% quota attainment. Prioritize quick-win opportunities in Q4.",
          impact: "high",
          suggestion: "Increase urgency weight to 25% for remaining quarter",
        },
      ];
      setAiRecommendations(recommendations);
    };

    generateRecommendations();
  }, [
    config.behavioralTriggers.emailEngagement,
    config.riskFactors.competitiveThreat
  ]);

  if (!isOpen) return null;

  const tabs = [
    { id: "overview", label: "Overview", icon: ChartBarIcon },
    { id: "competitive", label: "Competitive Edge", icon: TrophyIcon },
    { id: "ai-engine", label: "AI Engine", icon: SparklesIcon },
    { id: "products", label: "Products", icon: RocketLaunchIcon },
    { id: "behavioral", label: "Behavioral", icon: UserGroupIcon },
    { id: "market", label: "Market Intel", icon: MagnifyingGlassIcon },
    { id: "risk", label: "Risk Analysis", icon: ShieldCheckIcon },
    { id: "personalization", label: "Seller Profile", icon: UserGroupIcon },
    { id: "analytics", label: "Analytics", icon: BeakerIcon },
  ];

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const handleConfigChange = (path: string, value: any) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current = newConfig as any;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (key && current[key] !== undefined) {
          current = current[key];
        }
      }
      const finalKey = keys[keys.length - 1];
      if (finalKey && current) {
        current[finalKey] = value;
      }
      
      return newConfig;
    });
  };

  const containerClass = isExpanded 
    ? "fixed inset-0 bg-background z-50"
    : "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4";

  const contentClass = isExpanded
    ? "w-full h-full flex flex-col"
    : "bg-background rounded-2xl border border-border shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden";

  return (
    <div className={containerClass}>
      <div className={contentClass}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <BoltIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {isExpanded ? "RTP Engine - Advanced Configuration" : "RTP Engine Configuration"}
              </h1>
              <p className="text-muted mt-1">
                World-class real-time prioritization with AI-powered insights
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-hover transition-colors"
            >
              <EyeIcon className="w-4 h-4" />
              {previewMode ? "Exit Preview" : "Preview"}
            </button>
            
            <button
              onClick={onToggleExpanded}
              className="p-2 hover:bg-hover rounded-lg transition-colors"
              title={isExpanded ? "Minimize" : "Expand"}
            >
              {isExpanded ? (
                <ArrowsPointingInIcon className="w-5 h-5 text-muted" />
              ) : (
                <ArrowsPointingOutIcon className="w-5 h-5 text-muted" />
              )}
            </button>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-hover rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-muted" />
            </button>
          </div>
        </div>

        {/* AI Recommendations Bar */}
        {aiRecommendations.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-border">
            <div className="flex items-center gap-3">
              <LightBulbIcon className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                AI Recommendations Available
              </span>
              <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                {aiRecommendations.filter(r => r['impact'] === 'high').length} High Impact
              </span>
              <button className="text-xs text-amber-700 underline hover:text-amber-900">
                View All →
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex border-b border-border overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors whitespace-nowrap ${
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

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "overview" && (
            <div className="p-6 h-full overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Performance */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <TrophyIcon className="w-5 h-5 text-blue-600" />
                    Performance Metrics
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted">Pipeline Quality Score</span>
                      <span className="text-2xl font-bold text-blue-600">94.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted">Avg Deal Velocity</span>
                      <span className="text-2xl font-bold text-green-600">47 days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted">Win Rate</span>
                      <span className="text-2xl font-bold text-purple-600">68%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted">Quota Attainment</span>
                      <span className="text-2xl font-bold text-orange-600">{config.sellerProfile.quotaAttainment}%</span>
                    </div>
                  </div>
                </div>

                {/* Real-time Insights */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <FireIcon className="w-5 h-5 text-green-600" />
                    Live Priority Updates
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm">ZeroPoint raised priority (+25 points)</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm">Microsoft engagement spike detected</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm">3 new decision makers identified</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Quick Configuration</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                      onClick={() => setActiveTab("ai-engine")}
                      className="p-4 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors text-center"
                    >
                      <SparklesIcon className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                      <span className="text-sm font-medium">AI Engine</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("products")}
                      className="p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors text-center"
                    >
                      <RocketLaunchIcon className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <span className="text-sm font-medium">Products</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("behavioral")}
                      className="p-4 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors text-center"
                    >
                      <UserGroupIcon className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <span className="text-sm font-medium">Behavioral</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("personalization")}
                      className="p-4 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 transition-colors text-center"
                    >
                      <UserGroupIcon className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                      <span className="text-sm font-medium">Personalize</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "competitive" && (
            <RTPEngineCompetitiveIntelligence
              config={config}
              onConfigUpdate={(updates) => setConfig(prev => ({ ...prev, ...updates }))}
              isVisible={true}
            />
          )}

          {activeTab === "ai-engine" && (
            <div className="p-6 h-full overflow-y-auto">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-2">AI-Powered Prioritization Engine</h2>
                  <p className="text-muted">Advanced machine learning algorithms optimize your sales priorities in real-time</p>
                </div>

                {/* AI Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-xl p-6 border border-purple-200">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <SparklesIcon className="w-5 h-5 text-purple-600" />
                      Predictive Scoring
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Enable AI Predictive Scoring</span>
                        <button
                          onClick={() => handleConfigChange('aiPredictiveScoring', !config.aiPredictiveScoring)}
                          className={`w-11 h-6 rounded-full transition-colors relative ${
                            config.aiPredictiveScoring ? 'bg-purple-600' : 'bg-gray-300'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 bg-background rounded-full absolute top-1 transition-transform ${
                              config.aiPredictiveScoring ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <p className="text-sm text-muted">
                        Uses historical data and buyer behavior patterns to predict deal closure probability with 94.2% accuracy.
                      </p>
                      {config['aiPredictiveScoring'] && (
                        <div className="mt-4 p-3 bg-background/50 rounded-lg">
                          <div className="text-xs text-muted mb-1">Current Model Performance:</div>
                          <div className="flex justify-between text-sm">
                            <span>Accuracy:</span>
                            <span className="font-semibold text-purple-600">94.2%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Predictions/Hour:</span>
                            <span className="font-semibold text-purple-600">1,247</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <BeakerIcon className="w-5 h-5 text-green-600" />
                      Dynamic Adjustments
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(config.dynamicAdjustments).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                          <button
                            onClick={() => handleConfigChange(`dynamicAdjustments.${key}`, !value)}
                            className={`w-11 h-6 rounded-full transition-colors relative ${
                              value ? 'bg-green-600' : 'bg-gray-300'
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
                </div>

                {/* AI Recommendations */}
                <div className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-xl p-6 border border-amber-200">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <LightBulbIcon className="w-5 h-5 text-amber-600" />
                    AI Recommendations
                  </h3>
                  <div className="space-y-3">
                    {aiRecommendations.map((rec, index) => (
                      <div key={index} className="p-4 bg-background/50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-foreground">{rec.title}</h4>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                rec['impact'] === 'high' ? 'bg-red-100 text-red-800' :
                                rec['impact'] === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {rec.impact} impact
                              </span>
                            </div>
                            <p className="text-sm text-muted">{rec.description}</p>
                          </div>
                          <button className="ml-4 px-3 py-1 text-xs bg-amber-600 text-white rounded-lg hover:bg-amber-700">
                            Apply
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <div className="p-6 h-full overflow-y-auto">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Product-Specific Strategies</h2>
                  <p className="text-muted">Customize prioritization for different products and solutions</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {Object.entries(config.productStrategies).map(([id, strategy]) => (
                    <div key={id} className="bg-background border border-border rounded-xl p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <RocketLaunchIcon className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">{strategy.name}</h3>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Priority Multiplier
                          </label>
                          <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={strategy.priorityMultiplier}
                            onChange={(e) => handleConfigChange(`productStrategies.${id}.priorityMultiplier`, parseFloat(e.target.value))}
                            className="w-full h-2 bg-loading-bg rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-sm text-muted mt-1">
                            <span>0.5x</span>
                            <span className="font-semibold">{strategy.priorityMultiplier}x</span>
                            <span>2.0x</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Deal Size Range
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              placeholder="Min"
                              value={strategy.dealSizeRange.min}
                              onChange={(e) => handleConfigChange(`productStrategies.${id}.dealSizeRange.min`, parseInt(e.target.value))}
                              className="px-3 py-2 border border-border rounded-lg text-sm"
                            />
                            <input
                              type="number"
                              placeholder="Max"
                              value={strategy.dealSizeRange.max}
                              onChange={(e) => handleConfigChange(`productStrategies.${id}.dealSizeRange.max`, parseInt(e.target.value))}
                              className="px-3 py-2 border border-border rounded-lg text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Target Personas
                          </label>
                          <div className="flex flex-wrap gap-1">
                            {strategy.targetPersonas.map((persona, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {persona}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Sales Cycle Weight
                          </label>
                          <input
                            type="range"
                            min="0.5"
                            max="1.5"
                            step="0.1"
                            value={strategy.salesCycleWeight}
                            onChange={(e) => handleConfigChange(`productStrategies.${id}.salesCycleWeight`, parseFloat(e.target.value))}
                            className="w-full h-2 bg-loading-bg rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="text-center text-sm text-muted mt-1">
                            {strategy.salesCycleWeight}x
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add New Product Strategy */}
                <div className="mt-8 text-center">
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto">
                    <RocketLaunchIcon className="w-4 h-4" />
                    Add Product Strategy
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "behavioral" && (
            <div className="p-6 h-full overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Behavioral Triggers</h2>
                  <p className="text-muted">Configure how prospect behaviors impact their priority scores</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(config.behavioralTriggers).map(([trigger, value]) => (
                    <div key={trigger} className="bg-background border border-border rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4">
                        {trigger.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Priority Impact: {value}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="50"
                            value={value}
                            onChange={(e) => handleConfigChange(`behavioralTriggers.${trigger}`, parseInt(e.target.value))}
                            className="w-full h-2 bg-loading-bg rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-sm text-muted mt-1">
                            <span>0%</span>
                            <span>50%</span>
                          </div>
                        </div>

                        <div className="p-3 bg-panel-background rounded-lg">
                          <div className="text-sm text-muted">
                            {trigger === 'emailEngagement' && 'Opens, clicks, and replies to your emails'}
                            {trigger === 'websiteActivity' && 'Page views, time on site, and content consumption'}
                            {trigger === 'contentDownloads' && 'Whitepapers, case studies, and resource downloads'}
                            {trigger === 'socialMediaActivity' && 'LinkedIn engagement and social interactions'}
                            {trigger === 'meetingRequests' && 'Calendar bookings and meeting acceptance'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "risk" && (
            <div className="p-6 h-full overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Risk Assessment</h2>
                  <p className="text-muted">Configure risk factors that impact deal prioritization</p>
                </div>

                <div className="space-y-6">
                  {Object.entries(config.riskFactors).map(([factor, value]) => (
                    <div key={factor} className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">
                          {factor.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </h3>
                        <div className="text-2xl font-bold text-red-600">{value}%</div>
                      </div>
                      
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={value}
                        onChange={(e) => handleConfigChange(`riskFactors.${factor}`, parseInt(e.target.value))}
                        className="w-full h-2 bg-loading-bg rounded-lg appearance-none cursor-pointer mb-3"
                      />
                      
                      <div className="text-sm text-muted">
                        {factor === 'competitiveThreat' && 'Presence of competitors in the deal'}
                        {factor === 'championStrength' && 'Quality and influence of your internal champion'}
                        {factor === 'budgetConfirmation' && 'Clarity and confirmation of available budget'}
                        {factor === 'decisionTimeframe' && 'Urgency and timeline for decision making'}
                        {factor === 'implementationComplexity' && 'Technical and organizational complexity'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "personalization" && (
            <div className="p-6 h-full overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Seller Profile & Personalization</h2>
                  <p className="text-muted">Customize the RTP engine based on your selling style and expertise</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Experience Level</h3>
                    <div className="space-y-2">
                      {(['junior', 'mid', 'senior', 'expert'] as const).map((level) => (
                        <label key={level} className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="experience"
                            value={level}
                            checked={config['sellerProfile']['experience'] === level}
                            onChange={() => handleConfigChange('sellerProfile.experience', level)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm font-medium text-foreground">
                            {level.charAt(0).toUpperCase() + level.slice(1)} ({level === 'junior' ? '0-2 years' : level === 'mid' ? '3-5 years' : level === 'senior' ? '6-10 years' : '10+ years'})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Quota Attainment</h3>
                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold text-green-600">{config.sellerProfile.quotaAttainment}%</div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={config.sellerProfile.quotaAttainment}
                      onChange={(e) => handleConfigChange('sellerProfile.quotaAttainment', parseInt(e.target.value))}
                      className="w-full h-2 bg-loading-bg rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-sm text-muted mt-1">
                      <span>0%</span>
                      <span>200%</span>
                    </div>
                  </div>

                  <div className="md:col-span-2 bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-6 border border-purple-200">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Preferred Deal Size Range</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Minimum</label>
                        <input
                          type="number"
                          value={config.sellerProfile.preferredDealSize.min}
                          onChange={(e) => handleConfigChange('sellerProfile.preferredDealSize.min', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Maximum</label>
                        <input
                          type="number"
                          value={config.sellerProfile.preferredDealSize.max}
                          onChange={(e) => handleConfigChange('sellerProfile.preferredDealSize.max', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-border rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="p-6 h-full overflow-y-auto">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-2">RTP Analytics & Performance</h2>
                  <p className="text-muted">Real-time insights into your prioritization engine performance</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center gap-3 mb-4">
                      <TrophyIcon className="w-8 h-8 text-green-600" />
                      <h3 className="text-lg font-semibold">Priority Accuracy</h3>
                    </div>
                    <div className="text-3xl font-bold text-green-600 mb-2">94.2%</div>
                    <div className="text-sm text-muted">Predictions match actual outcomes</div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center gap-3 mb-4">
                      <ClockIcon className="w-8 h-8 text-blue-600" />
                      <h3 className="text-lg font-semibold">Avg Response Time</h3>
                    </div>
                    <div className="text-3xl font-bold text-blue-600 mb-2">1.2s</div>
                    <div className="text-sm text-muted">Real-time priority updates</div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center gap-3 mb-4">
                      <FireIcon className="w-8 h-8 text-purple-600" />
                      <h3 className="text-lg font-semibold">Hot Leads Today</h3>
                    </div>
                    <div className="text-3xl font-bold text-purple-600 mb-2">23</div>
                    <div className="text-sm text-muted">Above 85% priority threshold</div>
                  </div>
                </div>

                <div className="mt-8 bg-background border border-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Recent Priority Changes</h3>
                  <div className="space-y-3">
                    {[
                      { company: "ZeroPoint", change: "+25", reason: "Budget approved", time: "2 min ago" },
                      { company: "Microsoft", change: "+15", reason: "Champion identified", time: "5 min ago" },
                      { company: "Apple", change: "-8", reason: "Competitor activity", time: "12 min ago" },
                      { company: "Nike", change: "+12", reason: "Website engagement", time: "18 min ago" },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-panel-background rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${item.change.startsWith('+') ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="font-medium">{item.company}</span>
                          <span className="text-sm text-muted">{item.reason}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${item.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                            {item.change}
                          </span>
                          <span className="text-sm text-muted">{item.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-panel-background dark:bg-foreground/20">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600">Live updates active</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setConfig(DEFAULT_ADVANCED_CONFIG)}
              className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              Reset to Defaults
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors shadow-lg"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 