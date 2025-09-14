import React, { useState, useEffect } from 'react';
import { XMarkIcon, BoltIcon, ChartBarIcon, UserGroupIcon, ClockIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, Cog8ToothIcon } from '@heroicons/react/24/outline';

interface SpeedrunEngineOptimizerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyChanges: (settings: SpeedrunOptimizationSettings) => void;
}

export interface SpeedrunOptimizationSettings {
  // Core Algorithm Weights (0-100)
  dealValueFocus: number;        // Deal Value vs Volume Play
  warmLeadPriority: number;      // Warm Leads vs New Prospects  
  decisionMakerFocus: number;    // Decision Makers vs Champions
  timeSensitivity: number;       // Recency weighting
  
  // MEDDPICC Integration (0-100)
  economicBuyerPriority: number; // Economic Buyer weighting
  championInfluence: number;     // Champion influence factor
  competitionMode: number;       // Defensive vs Aggressive (0=defensive, 100=aggressive)
  
  // Time Horizon Strategy
  timeHorizon: 'today' | 'week' | 'month' | 'quarter';
  
  // Sales Methodology Preset
  methodology: 'adaptive' | 'meddpicc' | 'sandler' | 'proactive' | 'custom';
  
  // Daily/Weekly Targets
  dailyTarget: number;          // Daily leads target
  weeklyTarget: number;         // Weekly leads target
  
  // Auto-progression Settings
  autoProgressToNextBatch: boolean;  // Auto-pull next 50 when target hit
  batchSize: number;                 // Number of leads per batch (default 50)
}

const DEFAULT_SETTINGS: SpeedrunOptimizationSettings = {
  dealValueFocus: 60,
  warmLeadPriority: 70,
  decisionMakerFocus: 75,
  timeSensitivity: 50,
  economicBuyerPriority: 80,
  championInfluence: 65,
  competitionMode: 60,
  timeHorizon: 'week',
  methodology: 'adaptive',
  dailyTarget: 50,
  weeklyTarget: 250,
  autoProgressToNextBatch: true,
  batchSize: 50,
};

const METHODOLOGY_PRESETS: Record<string, Partial<SpeedrunOptimizationSettings>> = {
  adaptive: {
    dealValueFocus: 60,
    warmLeadPriority: 70,
    decisionMakerFocus: 75,
    timeSensitivity: 50,
    economicBuyerPriority: 80,
    championInfluence: 65,
    competitionMode: 60,
  },
  meddpicc: {
    dealValueFocus: 85,
    warmLeadPriority: 60,
    decisionMakerFocus: 90,
    timeSensitivity: 40,
    economicBuyerPriority: 95,
    championInfluence: 85,
    competitionMode: 70,
  },
  sandler: {
    dealValueFocus: 70,
    warmLeadPriority: 85,
    decisionMakerFocus: 80,
    timeSensitivity: 60,
    economicBuyerPriority: 75,
    championInfluence: 90,
    competitionMode: 50,
  },
  proactive: {
    dealValueFocus: 75,
    warmLeadPriority: 60,
    decisionMakerFocus: 85,
    timeSensitivity: 70,
    economicBuyerPriority: 80,
    championInfluence: 70,
    competitionMode: 80,
  },
};

export function SpeedrunEngineOptimizer({ isOpen, onClose, onApplyChanges }: SpeedrunEngineOptimizerProps) {
  // Add custom CSS for black slider thumbs
  React.useEffect(() => {
    const style = document.createElement('style');
    style['textContent'] = `
      .slider-black::-webkit-slider-thumb {
        appearance: none;
        height: 20px;
        width: 20px;
        border-radius: 50%;
        background: #000000;
        cursor: pointer;
        border: 2px solid #ffffff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
      
      .slider-black::-moz-range-thumb {
        height: 20px;
        width: 20px;
        border-radius: 50%;
        background: #000000;
        cursor: pointer;
        border: 2px solid #ffffff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
      
      .dark .slider-black::-webkit-slider-thumb {
        background: #ffffff;
        border: 2px solid #000000;
      }
      
      .dark .slider-black::-moz-range-thumb {
        background: #ffffff;
        border: 2px solid #000000;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [settings, setSettings] = useState<SpeedrunOptimizationSettings>(() => {
    // Load saved settings from localStorage on initialization
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('speedrun-engine-settings');
      if (saved) {
        try {
          const parsedSettings = JSON.parse(saved);
          console.log('🎯 SpeedrunEngineOptimizer: Loaded settings from localStorage', parsedSettings);
          return parsedSettings;
        } catch (error) {
          console.warn('Failed to parse saved speedrun engine settings:', error);
          // Clear invalid settings
          localStorage.removeItem('speedrun-engine-settings');
        }
      } else {
        console.log('🎯 SpeedrunEngineOptimizer: No saved settings found, using defaults');
      }
    }
    return DEFAULT_SETTINGS;
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Track changes
  useEffect(() => {
    const isChanged = JSON.stringify(settings) !== JSON.stringify(DEFAULT_SETTINGS);
    setHasChanges(isChanged);
  }, [settings]);

  const handleSliderChange = (key: keyof SpeedrunOptimizationSettings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleMethodologyChange = (methodology: string) => {
    const preset = METHODOLOGY_PRESETS[methodology];
    if (preset) {
      setSettings(prev => ({ ...prev, methodology: methodology as any, ...preset }));
    }
  };

  const handleApply = () => {
    // Save settings to localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('speedrun-engine-settings', JSON.stringify(settings));
      console.log('🎯 Speedrun Engine: Settings saved to localStorage', settings);
    }
    onApplyChanges(settings);
    onClose();
  };



  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    // Also clear from localStorage to ensure fresh start
    if (typeof window !== 'undefined') {
      localStorage.removeItem('speedrun-engine-settings');
      console.log('🎯 SpeedrunEngineOptimizer: Settings reset and cleared from localStorage');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full mx-4 overflow-auto transition-all duration-300 ${
        isExpanded ? 'max-w-6xl max-h-[95vh]' : 'max-w-4xl max-h-[90vh]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <BoltIcon className="w-6 h-6 text-gray-900 dark:text-white" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Speedrun Engine Optimizer
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isExpanded ? 'Advanced intelligence mode - Maximum control' : 'Fine-tune your lead prioritization algorithm'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title={isExpanded ? 'Collapse to core mode' : 'Expand to advanced mode'}
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isExpanded ? 'Core' : 'Advanced'}
              </span>
              {isExpanded ? (
                <ArrowsPointingInIcon className="w-5 h-5 text-gray-500" />
              ) : (
                <ArrowsPointingOutIcon className="w-5 h-5 text-gray-500" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex min-h-[600px]">
          {/* Left Panel - Controls */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Sales Methodology Preset */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Sales Methodology</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.keys(METHODOLOGY_PRESETS).map((method) => (
                  <button
                    key={method}
                    onClick={() => handleMethodologyChange(method)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      settings['methodology'] === method
                        ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white capitalize">
                      {method === 'meddpicc' ? 'MEDDPICC' : method}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {method === 'adaptive' && 'Smart approach that adapts to your market'}
                      {method === 'meddpicc' && 'Economic buyer & decision criteria focus'}
                      {method === 'sandler' && 'Champion-driven with qualification focus'}
                      {method === 'proactive' && 'Aggressive, time-sensitive approach'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Core Algorithm Weights */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Sales Prioritization Engine</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Fine-tune how your team prioritizes prospects. These settings determine which opportunities get ranked highest in your daily Speedrun.
              </p>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Revenue Strategy
                    </label>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {settings.dealValueFocus}% → {settings.dealValueFocus < 50 ? 'Volume Play' : 'Enterprise Focus'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.dealValueFocus}
                    onChange={(e) => handleSliderChange('dealValueFocus', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none slider slider-black"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>High Volume, Quick Wins</span>
                    <span>Enterprise Deals, Higher ACVs</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Prospecting vs. Nurturing Balance
                    </label>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {settings.warmLeadPriority}% → {settings.warmLeadPriority < 50 ? 'Prospecting Mode' : 'Nurturing Mode'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.warmLeadPriority}
                    onChange={(e) => handleSliderChange('warmLeadPriority', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none slider slider-black"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>New prospects, cold outbound</span>
                    <span>Engaged leads, warm follow-ups</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Buyer Engagement Strategy
                    </label>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {settings.decisionMakerFocus}% → {settings.decisionMakerFocus < 50 ? 'Champion Building' : 'Executive Access'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.decisionMakerFocus}
                    onChange={(e) => handleSliderChange('decisionMakerFocus', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none slider slider-black"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Build internal champions first</span>
                    <span>Go straight to economic buyer</span>
                  </div>
                </div>
              </div>
            </div>

            {/* MEDDPICC Integration */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Sales Methodology Tuning</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Adjust how aggressively you qualify and compete. Higher settings mean more selective targeting but stronger deal quality.
              </p>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Budget Authority Focus
                    </label>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {settings.economicBuyerPriority}% → {settings.economicBuyerPriority > 75 ? 'C-Suite Only' : settings.economicBuyerPriority > 50 ? 'Budget Holders' : 'All Stakeholders'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.economicBuyerPriority}
                    onChange={(e) => handleSliderChange('economicBuyerPriority', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none slider slider-black"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Any stakeholder, cast wide net</span>
                    <span>Only people who can sign checks</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Competitive Positioning
                    </label>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {settings.competitionMode < 50 ? 'Defensive Play' : 'Aggressive Displacement'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.competitionMode}
                    onChange={(e) => handleSliderChange('competitionMode', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none slider slider-black"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Avoid competitive deals</span>
                    <span>Target competitor accounts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pipeline Velocity Focus */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Pipeline Velocity Focus</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                How aggressive should we be with pipeline acceleration? Optimize for immediate wins vs. relationship building.
              </p>
              <div className="flex gap-2">
                {[
                  { key: 'today', label: 'Crisis Mode', subtitle: 'Need deals now' },
                  { key: 'week', label: 'Sprint Focus', subtitle: 'This week matters' },
                  { key: 'month', label: 'Growth Mode', subtitle: 'Building momentum' },
                  { key: 'quarter', label: 'Foundation', subtitle: 'Long-term strategy' }
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setSettings(prev => ({ ...prev, timeHorizon: option.key as any }))}
                    className={`px-4 py-3 rounded-lg border text-left transition-colors flex-1 ${
                      settings['timeHorizon'] === option.key
                        ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white text-sm">{option.label}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{option.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Daily & Weekly Targets */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Daily & Weekly Targets</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Set your personal targets for daily and weekly outreach. The engine will automatically pull the next batch when you hit your daily target.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Daily Target
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={settings.dailyTarget}
                    onChange={(e) => setSettings(prev => ({ ...prev, dailyTarget: parseInt(e.target.value) || 50 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leads to contact each day</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Weekly Target
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="1000"
                    value={settings.weeklyTarget}
                    onChange={(e) => setSettings(prev => ({ ...prev, weeklyTarget: parseInt(e.target.value) || 250 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leads to contact each week</p>
                </div>
              </div>
            </div>

            {/* Auto-Progression Settings */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Auto-Progression Settings</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Configure how the engine automatically loads new batches of leads when you complete your targets.
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Auto-pull Next Batch</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Automatically load next {settings.batchSize} leads when daily target is hit
                    </div>
                  </div>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, autoProgressToNextBatch: !prev.autoProgressToNextBatch }))}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-2 ${
                      settings.autoProgressToNextBatch ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-900 shadow ring-0 transition duration-200 ease-in-out ${
                        settings.autoProgressToNextBatch ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Batch Size
                  </label>
                  <select
                    value={settings.batchSize}
                    onChange={(e) => setSettings(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent"
                  >
                    <option value={25}>25 leads per batch</option>
                    <option value={50}>50 leads per batch</option>
                    <option value={75}>75 leads per batch</option>
                    <option value={100}>100 leads per batch</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Number of leads to load in each batch</p>
                </div>
              </div>
            </div>

            {/* Advanced Intelligence Features (Expanded Mode) */}
            {isExpanded && (
              <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Cog8ToothIcon className="w-5 h-5" />
                  Advanced Intelligence
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Market Pressure Sensitivity
                      </label>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {settings.timeSensitivity}% → {settings.timeSensitivity > 70 ? 'Urgent Market' : settings.timeSensitivity > 40 ? 'Standard' : 'Steady Growth'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.timeSensitivity}
                      onChange={(e) => handleSliderChange('timeSensitivity', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none slider slider-black"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Build Relationships</span>
                      <span>Strike Fast</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Champion Development Priority
                      </label>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{settings.championInfluence}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.championInfluence}
                      onChange={(e) => handleSliderChange('championInfluence', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none slider slider-black"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Direct Approach</span>
                      <span>Champion Network</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">AI Recommendations</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {settings.economicBuyerPriority > 85 ? 'Focus on C-Suite access patterns' :
                         settings.championInfluence > 80 ? 'Build internal network strength' :
                         settings.competitionMode > 70 ? 'Deploy competitive countermoves' :
                         'Optimize for adaptive growth'}
                      </div>
                    </div>
                    
                    <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">Pipeline Strategy</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {settings['timeHorizon'] === 'today' ? 'All hands on deck - close everything possible' :
                         settings['timeHorizon'] === 'week' ? 'Sprint to move deals forward this week' :
                         settings['timeHorizon'] === 'month' ? 'Strategic growth with relationship building' :
                         'Foundation building for sustained revenue growth'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Preview */}
          <div className="w-80 bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5" />
              Algorithm Impact
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">Primary Focus</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {settings.dealValueFocus > 70 ? 'High-Value Deals' :
                   settings.warmLeadPriority > 70 ? 'Warm Lead Nurturing' :
                   settings.decisionMakerFocus > 80 ? 'Decision Maker Access' :
                   'Adaptive Strategy'}
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">Daily Targets</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between mb-1">
                    <span>Daily:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{settings.dailyTarget} leads</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Weekly:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{settings.weeklyTarget} leads</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Batch Size:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{settings.batchSize} leads</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">Strategy</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {settings['methodology'] === 'meddpicc' ? 'Economic buyers first, qualify hard, close bigger deals' :
                   settings['methodology'] === 'sandler' ? 'Build champions, qualify pain, collaborative selling' :
                   settings['methodology'] === 'proactive' ? 'Time-sensitive, assertive approach, fast decisions' :
                   'Smart adaptation to market conditions and opportunity types'}
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">Auto-Progression</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {settings.autoProgressToNextBatch ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Enabled - Next batch loads automatically</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span>Disabled - Manual batch loading</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-3">Top Factors</div>
                <div className="space-y-2">
                  {[
                    { label: 'Deal Value', value: settings.dealValueFocus },
                    { label: 'Economic Buyer', value: settings.economicBuyerPriority },
                    { label: 'Decision Maker', value: settings.decisionMakerFocus },
                    { label: 'Warm Leads', value: settings.warmLeadPriority },
                  ]
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 3)
                    .map((factor) => (
                      <div key={factor.label} className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{factor.label}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{factor.value}%</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Reset to Default
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!hasChanges}
              className="px-6 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}