"use client";

import React, { useState, useEffect } from "react";
import { useParticle } from "../layout";
import { ParticleExperiment } from "../types/experiment";

export function ParticleLeftPanel() {
  const { 
    activeTab, 
    setActiveTab, 
    selectedExperiment, 
    setSelectedExperiment,
    experimentType,
    setExperimentType,
    experimentStatus,
    setExperimentStatus,
    setIsCreateModalOpen
  } = useParticle();

  const [experiments, setExperiments] = useState<ParticleExperiment[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    avgConfidence: 0
  });

  // Mock data for now - will be replaced with API calls
  useEffect(() => {
    const mockExperiments: ParticleExperiment[] = [
      {
        id: "1",
        workspaceId: "workspace-1",
        name: "Pipeline Performance Test",
        description: "Testing different pipeline configurations for optimal performance",
        hypothesis: "Using parallel processing will reduce execution time by 30%",
        experimentType: "performance",
        status: "active",
        confidenceLevel: 0.95,
        significanceLevel: 0.05,
        createdById: "user-1",
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
        startedAt: new Date("2024-01-15")
      },
      {
        id: "2",
        workspaceId: "workspace-1",
        name: "Conversion Rate Optimization",
        description: "A/B testing different approaches to improve conversion rates",
        hypothesis: "Personalized messaging will increase conversion by 15%",
        experimentType: "conversion",
        status: "completed",
        confidenceLevel: 0.95,
        significanceLevel: 0.05,
        createdById: "user-1",
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-12"),
        startedAt: new Date("2024-01-10"),
        completedAt: new Date("2024-01-12")
      },
      {
        id: "3",
        workspaceId: "workspace-1",
        name: "Cost Optimization Study",
        description: "Analyzing cost per conversion across different strategies",
        hypothesis: "Batch processing will reduce costs by 25%",
        experimentType: "ab_test",
        status: "draft",
        confidenceLevel: 0.95,
        significanceLevel: 0.05,
        createdById: "user-1",
        createdAt: new Date("2024-01-20"),
        updatedAt: new Date("2024-01-20")
      }
    ];

    setExperiments(mockExperiments);
    setStats({
      total: mockExperiments.length,
      active: mockExperiments.filter(e => e.status === 'active').length,
      completed: mockExperiments.filter(e => e.status === 'completed').length,
      avgConfidence: 94.2
    });
  }, []);

  const filteredExperiments = experiments.filter(experiment => {
    if (experimentType && experiment.experimentType !== experimentType) return false;
    if (experimentStatus && experiment.status !== experimentStatus) return false;
    return true;
  });

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
    <div className="h-full flex flex-col bg-[var(--background)] border-r border-[var(--border)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Experiments</h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>


        {/* Filters */}
        <div className="space-y-2">
          <select
            value={experimentType || ''}
            onChange={(e) => setExperimentType(e.target.value || null)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="ab_test">A/B Test</option>
            <option value="multivariate">Multivariate</option>
            <option value="performance">Performance</option>
            <option value="conversion">Conversion</option>
            <option value="retention">Retention</option>
          </select>
          
          <select
            value={experimentStatus || ''}
            onChange={(e) => setExperimentStatus(e.target.value || null)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-[var(--foreground)]">{stats.total}</div>
            <div className="text-xs text-[var(--muted-foreground)]">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-[var(--foreground)]">{stats.active}</div>
            <div className="text-xs text-[var(--muted-foreground)]">Active</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-[var(--foreground)]">{stats.completed}</div>
            <div className="text-xs text-[var(--muted-foreground)]">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-[var(--foreground)]">{stats.avgConfidence}%</div>
            <div className="text-xs text-[var(--muted-foreground)]">Avg Confidence</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex space-x-1">
          {[
            { id: 'experiments', label: 'Experiments', icon: '🧪' },
            { id: 'results', label: 'Results', icon: '📊' },
            { id: 'analytics', label: 'Analytics', icon: '📈' },
            { id: 'templates', label: 'Templates', icon: '📋' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-800'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--hover)]'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Experiments List */}
      <div className="flex-1 overflow-y-auto">
        {filteredExperiments.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-[var(--muted-foreground)] text-sm">No experiments found</p>
          </div>
        ) : (
          <div className="p-2">
            {filteredExperiments.map((experiment) => (
              <div
                key={experiment.id}
                onClick={() => setSelectedExperiment(experiment)}
                className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                  selectedExperiment?.id === experiment.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-[var(--hover)]'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getTypeIcon(experiment.experimentType)}</span>
                    <h3 className="font-medium text-[var(--foreground)] text-sm truncate">
                      {experiment.name}
                    </h3>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(experiment.status)}`}>
                    {experiment.status}
                  </span>
                </div>
                
                {experiment.description && (
                  <p className="text-xs text-[var(--muted-foreground)] mb-2 line-clamp-2">
                    {experiment.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                  <span>{(experiment.confidenceLevel * 100).toFixed(0)}% confidence</span>
                  <span>{new Date(experiment.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
