"use client";

import React, { useState } from "react";
import { ParticleExperiment, ParticleVariant } from "../types/experiment";
import { VariantComparison } from "./VariantComparison";

interface ExperimentDetailProps {
  experiment: ParticleExperiment;
}

export function ExperimentDetail({ experiment }: ExperimentDetailProps) {
  const [selectedVariant, setSelectedVariant] = useState<ParticleVariant | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'variants' | 'results' | 'settings'>('overview');

  // Mock variants data - will be replaced with API call
  const mockVariants: ParticleVariant[] = [
    {
      id: "variant-1",
      experimentId: experiment.id,
      name: "Control Group",
      description: "Current pipeline configuration",
      configuration: { parallel: false, batchSize: 100 },
      isControl: true,
      weight: 0.5,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "variant-2",
      experimentId: experiment.id,
      name: "Treatment A",
      description: "Parallel processing enabled",
      configuration: { parallel: true, batchSize: 50 },
      isControl: false,
      weight: 0.5,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ab_test': return '🧪';
      case 'multivariate': return '📊';
      case 'performance': return '⚡';
      case 'conversion': return '📈';
      case 'retention': return '🔄';
      default: return '🔬';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-[var(--border)]">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getTypeIcon(experiment.experimentType)}</span>
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">{experiment.name}</h1>
              <p className="text-[var(--muted-foreground)]">{experiment.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(experiment.status)}`}>
              {experiment.status}
            </span>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Run Test
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-[var(--border)]">
        <div className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'variants', label: 'Variants' },
            { id: 'results', label: 'Results' },
            { id: 'settings', label: 'Settings' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Hypothesis */}
            <div className="bg-[var(--card)] p-6 rounded-lg border border-[var(--border)]">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">Hypothesis</h3>
              <p className="text-[var(--muted-foreground)]">{experiment.hypothesis}</p>
            </div>

            {/* Experiment Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[var(--card)] p-6 rounded-lg border border-[var(--border)]">
                <h4 className="font-semibold text-[var(--foreground)] mb-2">Type</h4>
                <p className="text-[var(--muted-foreground)] capitalize">{experiment.experimentType.replace('_', ' ')}</p>
              </div>
              <div className="bg-[var(--card)] p-6 rounded-lg border border-[var(--border)]">
                <h4 className="font-semibold text-[var(--foreground)] mb-2">Confidence Level</h4>
                <p className="text-[var(--muted-foreground)]">{(experiment.confidenceLevel * 100).toFixed(0)}%</p>
              </div>
              <div className="bg-[var(--card)] p-6 rounded-lg border border-[var(--border)]">
                <h4 className="font-semibold text-[var(--foreground)] mb-2">Target Sample Size</h4>
                <p className="text-[var(--muted-foreground)]">{experiment.targetSampleSize || 'Not set'}</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[var(--card)] p-6 rounded-lg border border-[var(--border)]">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-[var(--foreground)]">Experiment started</span>
                  <span className="text-xs text-[var(--muted-foreground)]">2 hours ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-[var(--foreground)]">First test run completed</span>
                  <span className="text-xs text-[var(--muted-foreground)]">1 hour ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-[var(--foreground)]">Statistical analysis updated</span>
                  <span className="text-xs text-[var(--muted-foreground)]">30 minutes ago</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'variants' && (
          <VariantComparison
            variants={mockVariants}
            selectedVariant={selectedVariant}
            onSelectVariant={setSelectedVariant}
          />
        )}

        {activeTab === 'results' && (
          <div className="space-y-6">
            <div className="bg-[var(--card)] p-6 rounded-lg border border-[var(--border)]">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Statistical Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-[var(--foreground)] mb-2">P-Value</h4>
                  <p className="text-2xl font-bold text-blue-600">0.023</p>
                  <p className="text-sm text-[var(--muted-foreground)]">Statistically significant</p>
                </div>
                <div>
                  <h4 className="font-medium text-[var(--foreground)] mb-2">Confidence Interval</h4>
                  <p className="text-2xl font-bold text-green-600">95%</p>
                  <p className="text-sm text-[var(--muted-foreground)]">12.5% - 18.3% improvement</p>
                </div>
              </div>
            </div>

            <div className="bg-[var(--card)] p-6 rounded-lg border border-[var(--border)]">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Performance Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--foreground)]">Conversion Rate</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600 font-semibold">+15.2%</span>
                    <span className="text-sm text-[var(--muted-foreground)]">vs Control</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--foreground)]">Execution Time</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-red-600 font-semibold">-28.5%</span>
                    <span className="text-sm text-[var(--muted-foreground)]">vs Control</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--foreground)]">Cost per Conversion</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600 font-semibold">-12.3%</span>
                    <span className="text-sm text-[var(--muted-foreground)]">vs Control</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-[var(--card)] p-6 rounded-lg border border-[var(--border)]">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Experiment Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Name</label>
                  <input
                    type="text"
                    value={experiment.name}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)]"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Description</label>
                  <textarea
                    value={experiment.description || ''}
                    rows={3}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)]"
                    readOnly
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Confidence Level</label>
                    <input
                      type="number"
                      value={experiment.confidenceLevel}
                      min="0.8"
                      max="0.99"
                      step="0.01"
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Significance Level</label>
                    <input
                      type="number"
                      value={experiment.significanceLevel}
                      min="0.01"
                      max="0.2"
                      step="0.01"
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
