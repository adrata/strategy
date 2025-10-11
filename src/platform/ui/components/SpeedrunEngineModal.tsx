"use client";
import React, { useState } from "react";
import {
  XMarkIcon,
  BoltIcon,
  ChartBarIcon,
  EnvelopeIcon,
  ClockIcon,
  StarIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/platform/shared/components/ui/card";
import { Button } from "@/platform/shared/components/ui/button";
import { SpeedrunEngineOptimizer } from './SpeedrunEngineOptimizer';
import { useSpeedrunDataContext } from '@/platform/services/speedrun-data-context';
import { SpeedrunEngineSettingsService } from '@/platform/services/speedrun-engine-settings-service';

interface SpeedrunEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SpeedrunEngineModal({ isOpen, onClose }: SpeedrunEngineModalProps) {
  // Start directly with optimizer view instead of overview
  const [activeTab, setActiveTab] = useState<'overview' | 'algorithm' | 'signals' | 'optimizer'>('optimizer');
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(true); // Open optimizer by default
  
  // Use the dedicated settings service for applying changes
  const applySpeedrunEngineSettings = async (settings: any) => {
    try {
      console.log('🎯 SpeedrunEngineModal: Applying settings via service:', settings);
      await SpeedrunEngineSettingsService.applyOptimizationSettings(settings);
      
      // Context updates are handled by the service
      console.log('Settings applied via service, context will be updated automatically');
      
    } catch (error) {
      console.error('Failed to apply speedrun engine settings:', error);
      // Fallback to simple localStorage storage
      if (typeof window !== 'undefined') {
        localStorage.setItem('speedrun-engine-settings', JSON.stringify(settings));
        setTimeout(() => window.location.reload(), 500);
      }
    }
  };

  if (!isOpen) return null;

  // Show optimizer directly instead of the tabbed interface
  return (
    <>
      {/* Speedrun Engine Optimizer - Direct Access */}
      <SpeedrunEngineOptimizer
        isOpen={isOptimizerOpen}
        onClose={() => {
          setIsOptimizerOpen(false);
          onClose();
        }}
        onApplyChanges={async (settings) => {
          console.log('🎯 Applying speedrun engine settings:', settings);
          await applySpeedrunEngineSettings(settings);
          setIsOptimizerOpen(false);
          onClose();
        }}
      />
    </>
  );

  // Keep the old tabbed interface as fallback (unreachable code for now)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--background)] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <BoltIcon className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-[var(--foreground)]">Speedrun Engine</h2>
              <p className="text-[var(--muted)]">Intelligent Daily Prospect Prioritization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--hover)] rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-[var(--border)]">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'How It Works' },
              { id: 'algorithm', label: 'Ranking Algorithm' },
              { id: 'signals', label: 'Real-Time Signals' },
              { id: 'optimizer', label: 'Engine Settings' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-[var(--muted)] hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">Daily Intelligent Prioritization</h3>
                <p className="text-[var(--muted)] mb-6">
                  Speedrun analyzes all your leads, opportunities, accounts, and contacts to surface the 
                  <strong> top 20 companies</strong> and <strong>50+ prospects</strong> you should focus on each day.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ChartBarIcon className="w-5 h-5 text-blue-600" />
                      Smart Company Ranking
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[var(--muted)] mb-3">
                      Companies are ranked 1, 2, 3... based on total business value and engagement signals.
                    </p>
                    <div className="space-y-2 text-sm">
                      <div>• <strong>1A, 1B, 1C</strong> - Top prospects at Company #1</div>
                      <div>• <strong>2A, 2B</strong> - Top prospects at Company #2</div>
                      <div>• Maximum <strong>20 companies per day</strong></div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <EnvelopeIcon className="w-5 h-5 text-green-600" />
                      Real-Time Signals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[var(--muted)] mb-3">
                      When someone emails "Hey! I want to buy!" they automatically jump to the top.
                    </p>
                    <div className="space-y-2 text-sm">
                      <div>• <strong>Instant priority boost</strong> for inbound interest</div>
                      <div>• <strong>Email engagement</strong> tracking</div>
                      <div>• <strong>Activity monitoring</strong> across all channels</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClockIcon className="w-5 h-5 text-purple-600" />
                      Urgency Detection
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[var(--muted)] mb-3">
                      AI analyzes timing signals to identify hot prospects who need immediate attention.
                    </p>
                    <div className="space-y-2 text-sm">
                      <div>• <strong>Days since last contact</strong></div>
                      <div>• <strong>Deal timing</strong> and close dates</div>
                      <div>• <strong>Buying signals</strong> strength</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <StarIcon className="w-5 h-5 text-yellow-600" />
                      Business Value
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[var(--muted)] mb-3">
                      Higher value opportunities and larger companies get priority in your daily list.
                    </p>
                    <div className="space-y-2 text-sm">
                      <div>• <strong>Deal size</strong> analysis</div>
                      <div>• <strong>Company revenue</strong> and size</div>
                      <div>• <strong>Strategic importance</strong></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'algorithm' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">How Daily Rankings Are Calculated</h3>
                <p className="text-[var(--muted)] mb-6">
                  The Speedrun algorithm combines multiple factors to create your optimal daily prospect list:
                </p>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-4">Final Score Formula:</h4>
                <div className="font-mono text-sm bg-[var(--background)] p-4 rounded border">
                  Final Score = Base Priority + (Recency × 30%) + (Value × 25%) + (Engagement × 20%) + (Strategic × 15%) + (Urgency × 10%)
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h5 className="font-semibold text-[var(--foreground)]">Recency Score (30%)</h5>
                    <p className="text-sm text-[var(--muted)]">
                      How recently you've interacted with this contact. Recent activity = higher priority.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-4">
                    <h5 className="font-semibold text-[var(--foreground)]">Business Value (25%)</h5>
                    <p className="text-sm text-[var(--muted)]">
                      Deal size, company revenue, and strategic importance to your business.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h5 className="font-semibold text-[var(--foreground)]">Engagement (20%)</h5>
                    <p className="text-sm text-[var(--muted)]">
                      Email opens, responses, meeting attendance, and other engagement signals.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h5 className="font-semibold text-[var(--foreground)]">Strategic Score (15%)</h5>
                    <p className="text-sm text-[var(--muted)]">
                      Company fit with your ideal customer profile and market position.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-red-500 pl-4">
                    <h5 className="font-semibold text-[var(--foreground)]">Urgency Score (10%)</h5>
                    <p className="text-sm text-[var(--muted)]">
                      Time-sensitive signals like close dates and buying timeline indicators.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--panel-background)] p-6 rounded-lg">
                <h4 className="font-semibold text-[var(--foreground)] mb-3">Company-Based Ranking System</h4>
                <div className="space-y-2 text-sm">
                  <div>1. <strong>Aggregate company scores</strong> from all contacts at each company</div>
                  <div>2. <strong>Sort companies by total potential</strong> (highest to lowest)</div>
                  <div>3. <strong>Limit to top 20 companies</strong> for focused daily execution</div>
                  <div>4. <strong>Rank prospects within companies</strong> as 1A, 1B, 1C, 2A, 2B, etc.</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'signals' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">Real-Time Signal Processing</h3>
                <p className="text-[var(--muted)] mb-6">
                  Speedrun continuously monitors activity across all channels and instantly adjusts priorities 
                  when buying signals are detected.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <TrophyIcon className="w-6 h-6 text-green-600" />
                  <h4 className="font-semibold text-green-900">Instant Priority Triggers</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Inbound Email Signals:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                      <li>"I want to buy"</li>
                      <li>"When can we meet?"</li>
                      <li>"Send me a quote"</li>
                      <li>"What's your pricing?"</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Engagement Signals:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                      <li>Email replies and forwards</li>
                      <li>Meeting acceptances</li>
                      <li>Website activity</li>
                      <li>Document downloads</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Email Monitoring</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[var(--muted)] mb-3">
                      Real-time scanning of all incoming emails for buying intent keywords.
                    </p>
                    <div className="text-xs space-y-1">
                      <div>• <strong>Intent scoring</strong></div>
                      <div>• <strong>Sentiment analysis</strong></div>
                      <div>• <strong>Urgency detection</strong></div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Activity Tracking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[var(--muted)] mb-3">
                      Monitors all touchpoints and interaction patterns with prospects.
                    </p>
                    <div className="text-xs space-y-1">
                      <div>• <strong>Last contact date</strong></div>
                      <div>• <strong>Response rates</strong></div>
                      <div>• <strong>Meeting history</strong></div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Smart Notifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[var(--muted)] mb-3">
                      Instant alerts when high-priority signals are detected.
                    </p>
                    <div className="text-xs space-y-1">
                      <div>• <strong>Hot prospect alerts</strong></div>
                      <div>• <strong>Follow-up reminders</strong></div>
                      <div>• <strong>Opportunity updates</strong></div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
                <h4 className="font-semibold text-yellow-900 mb-3">Example: Inbound Interest Detection</h4>
                <div className="bg-[var(--background)] p-4 rounded border text-sm">
                  <div className="mb-2"><strong>Scenario:</strong> Customer emails: "Hi! We're interested in your retail fixtures for our new store locations. Can we schedule a call this week?"</div>
                  <div className="mb-2"><strong>System Response:</strong></div>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Contact instantly moves to <strong>Rank 1A</strong> (top of list)</li>
                    <li>Next action updates to <strong>"Schedule Discovery Call"</strong></li>
                    <li>Urgency score increases to <strong>95/100</strong></li>
                    <li>Real-time notification sent to user</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Engine Settings Tab */}
          {activeTab === 'optimizer' && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">Engine Configuration</h3>
                <p className="text-[var(--muted)]">
                  Customize how the Speedrun Engine prioritizes and ranks your prospects. 
                  Changes will immediately re-rank your current list.
                </p>
              </div>

              <button
                onClick={() => setIsOptimizerOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
              >
                <BoltIcon className="w-5 h-5" />
                Open Speedrun Engine Settings
              </button>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">What you can configure:</h4>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Sales methodology (Challenger, Relationship, Hunter)</li>
                  <li>• Deal value focus and buying signal weights</li>
                  <li>• Urgency and champion influence factors</li>
                  <li>• Competition mode and timing preferences</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
