"use client";

import React, { useState, useEffect } from "react";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  TrophyIcon,
  BoltIcon,
  MagnifyingGlassIcon,
  FireIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ClockIcon,
  DocumentTextIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import type { AdvancedRTPConfig } from "./RTPTypes";

interface CompetitiveIntelligenceProps {
  config: AdvancedRTPConfig;
  onConfigUpdate: (updates: Partial<AdvancedRTPConfig>) => void;
  isVisible: boolean;
}

interface PainQuantificationEngine {
  enabled: boolean;
  painIdentificationSources: {
    financialSignals: boolean;
    operationalMetrics: boolean;
    competitorMovements: boolean;
    industryBenchmarks: boolean;
    executiveStatements: boolean;
    jobPostings: boolean;
    technologyChanges: boolean;
    regulatoryChanges: boolean;
  };
  quantificationMethods: {
    revenueLossCalculation: boolean;
    costInefficiencyAnalysis: boolean;
    opportunityCostModeling: boolean;
    complianceRiskAssessment: boolean;
    competitiveDisadvantageImpact: boolean;
  };
  impactThresholds: {
    criticalPain: number; // $$ threshold for critical pain
    moderatePain: number; // $$ threshold for moderate pain
    minViablePain: number; // $$ threshold for minimum viable pain
  };
}

interface MEDDPICCFramework {
  enabled: boolean;
  dataPoints: {
    metrics: {
      tracked: boolean;
      weight: number;
      sources: string[];
    };
    economicBuyer: {
      identified: boolean;
      weight: number;
      verificationMethods: string[];
    };
    decisionCriteria: {
      mapped: boolean;
      weight: number;
      discoveryApproach: string[];
    };
    decisionProcess: {
      understood: boolean;
      weight: number;
      stakeholderMapping: boolean;
    };
    paperProcess: {
      documented: boolean;
      weight: number;
      legalRequirements: boolean;
    };
    implifyPain: {
      quantified: boolean;
      weight: number;
      urgencyFactors: string[];
    };
    champion: {
      identified: boolean;
      weight: number;
      strengthAssessment: boolean;
    };
    competition: {
      mapped: boolean;
      weight: number;
      battlecardGeneration: boolean;
    };
  };
  scoringMethod: "weighted" | "boolean" | "hybrid";
  minimumViableScore: number;
}

interface ProactivePainDetection {
  enabled: boolean;
  detectionMethods: {
    alternativeDataAnalysis: boolean;
    newsAndEventMonitoring: boolean;
    financialPerformanceTracking: boolean;
    executiveMovementTracking: boolean;
    technologyAdoptionPatterns: boolean;
    industryDisruptionSignals: boolean;
    regulatoryChangeImpacts: boolean;
    supplyChainDisruptions: boolean;
  };
  earlyWarningSystem: {
    enabled: boolean;
    alertThresholds: {
      budgetCycle: number; // days before budget planning
      executiveTurnover: number; // percentage threshold
      competitorActivity: number; // competitor engagement score
      industryDisruption: number; // disruption impact score
    };
  };
}

interface SellerAccountMatching {
  enabled: boolean;
  matchingCriteria: {
    industryExpertise: number;
    accountSize: number;
    productFit: number;
    geographicProximity: number;
    pastSuccessPatterns: number;
    personalityMatch: number;
    availableCapacity: number;
    competitiveAdvantage: number;
  };
  algorithmType: "ml_powered" | "rule_based" | "hybrid";
  performanceTracking: boolean;
}

export const RTPEngineCompetitiveIntelligence: React.FC<CompetitiveIntelligenceProps> = ({
  config,
  onConfigUpdate,
  isVisible,
}) => {
  // Initialize competitive intelligence features in config if not present
  const [painEngine, setPainEngine] = useState<PainQuantificationEngine>(
    (config as any).painQuantificationEngine || {
      enabled: true,
      painIdentificationSources: {
        financialSignals: true,
        operationalMetrics: true,
        competitorMovements: true,
        industryBenchmarks: true,
        executiveStatements: true,
        jobPostings: true,
        technologyChanges: true,
        regulatoryChanges: true,
      },
      quantificationMethods: {
        revenueLossCalculation: true,
        costInefficiencyAnalysis: true,
        opportunityCostModeling: true,
        complianceRiskAssessment: true,
        competitiveDisadvantageImpact: true,
      },
      impactThresholds: {
        criticalPain: 1000000,
        moderatePain: 250000,
        minViablePain: 50000,
      },
    }
  );

  const [meddpiccConfig, setMeddpiccConfig] = useState<MEDDPICCFramework>(
    (config as any).meddpiccFramework || {
      enabled: true,
      dataPoints: {
        metrics: {
          tracked: true,
          weight: 15,
          sources: ["Financial Reports", "Industry Benchmarks", "Monaco Pipeline"],
        },
        economicBuyer: {
          identified: true,
          weight: 20,
          verificationMethods: ["Org Chart Analysis", "Decision History", "Budget Authority"],
        },
        decisionCriteria: {
          mapped: true,
          weight: 15,
          discoveryApproach: ["Discovery Calls", "RFP Analysis", "Competitor Intel"],
        },
        decisionProcess: {
          understood: true,
          weight: 10,
          stakeholderMapping: true,
        },
        paperProcess: {
          documented: true,
          weight: 5,
          legalRequirements: true,
        },
        implifyPain: {
          quantified: true,
          weight: 20,
          urgencyFactors: ["Budget Pressure", "Competitive Threats", "Compliance Deadlines"],
        },
        champion: {
          identified: true,
          weight: 10,
          strengthAssessment: true,
        },
        competition: {
          mapped: true,
          weight: 5,
          battlecardGeneration: true,
        },
      },
      scoringMethod: "weighted",
      minimumViableScore: 70,
    }
  );

  const [proactivePain, setProactivePain] = useState<ProactivePainDetection>(
    (config as any).proactivePainDetection || {
      enabled: true,
      detectionMethods: {
        alternativeDataAnalysis: true,
        newsAndEventMonitoring: true,
        financialPerformanceTracking: true,
        executiveMovementTracking: true,
        technologyAdoptionPatterns: true,
        industryDisruptionSignals: true,
        regulatoryChangeImpacts: true,
        supplyChainDisruptions: true,
      },
      earlyWarningSystem: {
        enabled: true,
        alertThresholds: {
          budgetCycle: 90,
          executiveTurnover: 15,
          competitorActivity: 75,
          industryDisruption: 70,
        },
      },
    }
  );

  const [sellerMatching, setSellerMatching] = useState<SellerAccountMatching>(
    (config as any).sellerAccountMatching || {
      enabled: true,
      matchingCriteria: {
        industryExpertise: 25,
        accountSize: 20,
        productFit: 20,
        geographicProximity: 5,
        pastSuccessPatterns: 15,
        personalityMatch: 5,
        availableCapacity: 5,
        competitiveAdvantage: 5,
      },
      algorithmType: "ml_powered",
      performanceTracking: true,
    }
  );

  // Update parent config when competitive intelligence settings change
  useEffect(() => {
    onConfigUpdate({
      painQuantificationEngine: painEngine,
      meddpiccFramework: meddpiccConfig,
      proactivePainDetection: proactivePain,
      sellerAccountMatching: sellerMatching,
    } as any);
  }, [painEngine, meddpiccConfig, proactivePain, sellerMatching, onConfigUpdate]);

  if (!isVisible) return null;

  return (
    <div className="p-6 space-y-8">
      {/* Competitive Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <TrophyIcon className="w-8 h-8 text-yellow-600" />
          <h2 className="text-2xl font-bold text-[var(--foreground)]">Competitive Intelligence Engine</h2>
          <TrophyIcon className="w-8 h-8 text-yellow-600" />
        </div>
        <p className="text-[var(--muted)] max-w-4xl mx-auto">
          Advanced prioritization capabilities that outperform 6Sense and MadKudu through proactive pain identification, 
          quantified business impact, and integrated MEDDPICC methodology.
        </p>
      </div>

      {/* Competitive Advantage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-800">Pain Quantification</h3>
          </div>
          <p className="text-sm text-green-700">$2.3M avg pain identified vs 6Sense's qualitative scoring</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <BoltIcon className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">Proactive Detection</h3>
          </div>
          <p className="text-sm text-blue-700">90 days early warning vs MadKudu's reactive scoring</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <DocumentTextIcon className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-purple-800">MEDDPICC Native</h3>
          </div>
          <p className="text-sm text-purple-700">Built-in sales methodology vs generic lead scoring</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-red-100 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <UserGroupIcon className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-orange-800">Smart Matching</h3>
          </div>
          <p className="text-sm text-orange-700">AI-powered seller-account matching for 40% higher win rates</p>
        </div>
      </div>

      {/* Pain Quantification Engine */}
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <CurrencyDollarIcon className="w-7 h-7 text-green-600" />
          <div>
            <h3 className="text-xl font-semibold text-[var(--foreground)]">Pain Quantification Engine</h3>
            <p className="text-sm text-[var(--muted)]">Quantify prospect pain in dollars - not just qualitative scores like 6Sense</p>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => setPainEngine(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                painEngine.enabled ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-4 h-4 bg-[var(--background)] rounded-full absolute top-1 transition-transform ${
                  painEngine.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {painEngine['enabled'] && (
          <div className="space-y-6">
            {/* Pain Identification Sources */}
            <div>
              <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
                <MagnifyingGlassIcon className="w-5 h-5" />
                Pain Identification Sources
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(painEngine.painIdentificationSources).map(([source, enabled]) => (
                  <label key={source} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-[var(--panel-background)]">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => setPainEngine(prev => ({
                        ...prev,
                        painIdentificationSources: {
                          ...prev.painIdentificationSources,
                          [source]: e.target.checked
                        }
                      }))}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="text-sm font-medium">
                      {source.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Quantification Methods */}
            <div>
              <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5" />
                Quantification Methods
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(painEngine.quantificationMethods).map(([method, enabled]) => (
                  <div key={method} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">
                      {method.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                    <button
                      onClick={() => setPainEngine(prev => ({
                        ...prev,
                        quantificationMethods: {
                          ...prev.quantificationMethods,
                          [method]: !enabled
                        }
                      }))}
                      className={`w-11 h-6 rounded-full transition-colors relative ${
                        enabled ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-[var(--background)] rounded-full absolute top-1 transition-transform ${
                          enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Impact Thresholds */}
            <div>
              <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5" />
                Pain Impact Thresholds
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Critical Pain ($)</label>
                  <input
                    type="number"
                    value={painEngine.impactThresholds.criticalPain}
                    onChange={(e) => setPainEngine(prev => ({
                      ...prev,
                      impactThresholds: {
                        ...prev.impactThresholds,
                        criticalPain: parseInt(e.target.value)
                      }
                    }))}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Moderate Pain ($)</label>
                  <input
                    type="number"
                    value={painEngine.impactThresholds.moderatePain}
                    onChange={(e) => setPainEngine(prev => ({
                      ...prev,
                      impactThresholds: {
                        ...prev.impactThresholds,
                        moderatePain: parseInt(e.target.value)
                      }
                    }))}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Minimum Viable Pain ($)</label>
                  <input
                    type="number"
                    value={painEngine.impactThresholds.minViablePain}
                    onChange={(e) => setPainEngine(prev => ({
                      ...prev,
                      impactThresholds: {
                        ...prev.impactThresholds,
                        minViablePain: parseInt(e.target.value)
                      }
                    }))}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MEDDPICC Framework Integration */}
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <DocumentTextIcon className="w-7 h-7 text-purple-600" />
          <div>
            <h3 className="text-xl font-semibold text-[var(--foreground)]">MEDDPICC Framework Integration</h3>
            <p className="text-sm text-[var(--muted)]">Native sales methodology integration - not available in 6Sense or MadKudu</p>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => setMeddpiccConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                meddpiccConfig.enabled ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-4 h-4 bg-[var(--background)] rounded-full absolute top-1 transition-transform ${
                  meddpiccConfig.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {meddpiccConfig['enabled'] && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(meddpiccConfig.dataPoints).map(([key, dataPoint]) => (
                <div key={key} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-[var(--foreground)]">
                      {key.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <span className="text-sm text-[var(--muted)]">Weight: {dataPoint.weight}%</span>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={(() => {
                          const dp = dataPoint as any;
                          return dp.tracked || dp.identified || dp.mapped || dp.understood || dp.documented || dp.quantified || false;
                        })()}
                        onChange={(e) => {
                          const updateKey = key === 'metrics' ? 'tracked' :
                                          key === 'economicBuyer' || key === 'champion' ? 'identified' :
                                          key === 'decisionCriteria' || key === 'competition' ? 'mapped' :
                                          key === 'decisionProcess' ? 'understood' :
                                          key === 'paperProcess' ? 'documented' :
                                          'quantified';
                          
                          setMeddpiccConfig(prev => ({
                            ...prev,
                            dataPoints: {
                              ...prev.dataPoints,
                              [key]: {
                                ...prev['dataPoints'][key as keyof typeof prev.dataPoints],
                                [updateKey]: e.target.checked
                              }
                            }
                          }));
                        }}
                        className="w-4 h-4 text-purple-600"
                      />
                      <span className="text-sm">Enable {key} tracking</span>
                    </label>
                    
                    <div>
                      <label className="block text-xs text-[var(--muted)] mb-1">Priority Weight (%)</label>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        value={dataPoint.weight}
                        onChange={(e) => setMeddpiccConfig(prev => ({
                          ...prev,
                          dataPoints: {
                            ...prev.dataPoints,
                            [key]: {
                              ...prev['dataPoints'][key as keyof typeof prev.dataPoints],
                              weight: parseInt(e.target.value)
                            }
                          }
                        }))}
                        className="w-full h-2 bg-[var(--loading-bg)] rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Scoring Method</label>
                <select
                  value={meddpiccConfig.scoringMethod}
                  onChange={(e) => setMeddpiccConfig(prev => ({
                    ...prev,
                    scoringMethod: e.target.value as any
                  }))}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg"
                >
                  <option value="weighted">Weighted Scoring</option>
                  <option value="boolean">Boolean (Pass/Fail)</option>
                  <option value="hybrid">Hybrid Approach</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Minimum Viable Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={meddpiccConfig.minimumViableScore}
                  onChange={(e) => setMeddpiccConfig(prev => ({
                    ...prev,
                    minimumViableScore: parseInt(e.target.value)
                  }))}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg"
                />
              </div>
              <div className="flex items-end">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Object.values(meddpiccConfig.dataPoints).reduce((sum, dp) => sum + dp.weight, 0)}%
                  </div>
                  <div className="text-xs text-[var(--muted)]">Total Weight</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Proactive Pain Detection */}
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <FireIcon className="w-7 h-7 text-red-600" />
          <div>
            <h3 className="text-xl font-semibold text-[var(--foreground)]">Proactive Pain Detection</h3>
            <p className="text-sm text-[var(--muted)]">Identify pain 90 days before competitors - beyond reactive scoring</p>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => setProactivePain(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                proactivePain.enabled ? 'bg-red-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-4 h-4 bg-[var(--background)] rounded-full absolute top-1 transition-transform ${
                  proactivePain.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {proactivePain['enabled'] && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(proactivePain.detectionMethods).map(([method, enabled]) => (
                <label key={method} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-[var(--panel-background)]">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setProactivePain(prev => ({
                      ...prev,
                      detectionMethods: {
                        ...prev.detectionMethods,
                        [method]: e.target.checked
                      }
                    }))}
                    className="w-4 h-4 text-red-600"
                  />
                  <span className="text-sm font-medium">
                    {method.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                </label>
              ))}
            </div>

            {proactivePain['earlyWarningSystem']['enabled'] && (
              <div>
                <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <LightBulbIcon className="w-5 h-5" />
                  Early Warning Thresholds
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {Object.entries(proactivePain.earlyWarningSystem.alertThresholds).map(([threshold, value]) => (
                    <div key={threshold}>
                      <label className="block text-sm font-medium mb-2">
                        {threshold.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </label>
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => setProactivePain(prev => ({
                          ...prev,
                          earlyWarningSystem: {
                            ...prev.earlyWarningSystem,
                            alertThresholds: {
                              ...prev.earlyWarningSystem.alertThresholds,
                              [threshold]: parseInt(e.target.value)
                            }
                          }
                        }))}
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Seller-Account Matching */}
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <UserGroupIcon className="w-7 h-7 text-blue-600" />
          <div>
            <h3 className="text-xl font-semibold text-[var(--foreground)]">AI-Powered Seller-Account Matching</h3>
            <p className="text-sm text-[var(--muted)]">Match sellers to optimal accounts for 40% higher win rates</p>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => setSellerMatching(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                sellerMatching.enabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-4 h-4 bg-[var(--background)] rounded-full absolute top-1 transition-transform ${
                  sellerMatching.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {sellerMatching['enabled'] && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
                <ArrowTrendingUpIcon className="w-5 h-5" />
                Matching Criteria Weights
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(sellerMatching.matchingCriteria).map(([criteria, weight]) => (
                  <div key={criteria} className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium">
                        {criteria.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </label>
                      <span className="text-sm text-[var(--muted)]">{weight}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={weight}
                      onChange={(e) => setSellerMatching(prev => ({
                        ...prev,
                        matchingCriteria: {
                          ...prev.matchingCriteria,
                          [criteria]: parseInt(e.target.value)
                        }
                      }))}
                      className="w-full h-2 bg-[var(--loading-bg)] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Algorithm Type</label>
                <select
                  value={sellerMatching.algorithmType}
                  onChange={(e) => setSellerMatching(prev => ({
                    ...prev,
                    algorithmType: e.target.value as any
                  }))}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg"
                >
                  <option value="ml_powered">ML-Powered (Recommended)</option>
                  <option value="rule_based">Rule-Based</option>
                  <option value="hybrid">Hybrid Approach</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={sellerMatching.performanceTracking}
                  onChange={(e) => setSellerMatching(prev => ({
                    ...prev,
                    performanceTracking: e.target.checked
                  }))}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium">Enable Performance Tracking</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Competitive Summary */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <TrophyIcon className="w-6 h-6 text-yellow-600" />
          Competitive Advantage Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">vs. 6Sense</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Quantified pain ($2.3M avg) vs qualitative intent scores</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Native MEDDPICC integration vs generic lead scoring</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>90-day early warning vs reactive account intelligence</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-3">vs. MadKudu</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>AI seller-account matching vs basic fit scoring</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Proactive pain detection vs usage-based scoring</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Alternative data intelligence vs limited data sources</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}; 