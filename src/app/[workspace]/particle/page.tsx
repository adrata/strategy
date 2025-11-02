"use client";

import React, { useState, useEffect } from "react";
import { useParticle } from "./layout";
import { ParticleExperiment, ParticleVariant, ParticleTestRun } from "./types/experiment";
import { ExperimentBuilder } from "./components/ExperimentBuilder";
import { ResultsDashboard } from "./components/ResultsDashboard";
import { VariantComparison } from "./components/VariantComparison";
import { ExperimentDetail } from "./components/ExperimentDetail";
import { CreateExperimentModal } from "./components/CreateExperimentModal";
import { RunExperimentModal } from "./components/RunExperimentModal";

export default function ParticlePage() {
  const { 
    selectedExperiment, 
    activeTab, 
    isCreateModalOpen, 
    setIsCreateModalOpen,
    isRunModalOpen,
    setIsRunModalOpen 
  } = useParticle();

  // Set browser title
  useEffect(() => {
    document.title = 'Particle • Scientific Testing';
  }, []);

  const renderContent = () => {
    if (isCreateModalOpen) {
      return <CreateExperimentModal onClose={() => setIsCreateModalOpen(false)} />;
    }

    if (isRunModalOpen && selectedExperiment) {
      return <RunExperimentModal experiment={selectedExperiment} onClose={() => setIsRunModalOpen(false)} />;
    }

    if (selectedExperiment) {
      return <ExperimentDetail experiment={selectedExperiment} />;
    }

    // Default view - show experiment builder or welcome screen
    switch (activeTab) {
      case 'experiments':
        return <ExperimentBuilder />;
      case 'results':
        return <ResultsDashboard />;
      case 'analytics':
        return <AnalyticsView />;
      case 'templates':
        return <TemplatesView />;
      default:
        return <WelcomeView />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Particle</h1>
          <p className="text-sm text-muted">
            Scientific Testing Platform for Pipeline Validation
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsRunModalOpen(true)}
            disabled={!selectedExperiment}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Run Test
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Create Experiment
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}

// Welcome view for when no experiment is selected
function WelcomeView() {
  const { setIsCreateModalOpen } = useParticle();

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Welcome to Particle
        </h2>
        <p className="text-muted mb-6">
          Create scientific experiments to test and validate your pipeline performance. 
          Use A/B testing, multivariate analysis, and statistical significance to make data-driven decisions.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Experiment
          </button>
          <button className="w-full px-6 py-3 border border-border text-foreground rounded-lg hover:bg-hover transition-colors">
            Browse Templates
          </button>
        </div>
      </div>
    </div>
  );
}

// Analytics view
function AnalyticsView() {
  return (
    <div className="h-full p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-2">Analytics Dashboard</h2>
        <p className="text-muted">
          Comprehensive analytics across all your experiments
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[var(--card)] p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Total Experiments</p>
              <p className="text-2xl font-bold text-foreground">24</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-[var(--card)] p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Active Tests</p>
              <p className="text-2xl font-bold text-foreground">8</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-[var(--card)] p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Avg Confidence</p>
              <p className="text-2xl font-bold text-foreground">94.2%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-[var(--card)] p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Success Rate</p>
              <p className="text-2xl font-bold text-foreground">87.5%</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-[var(--card)] p-6 rounded-lg border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-foreground">Pipeline Performance Test completed</span>
            </div>
            <span className="text-xs text-muted">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-foreground">A/B Test started for conversion optimization</span>
            </div>
            <span className="text-xs text-muted">5 hours ago</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-foreground">Multivariate test results analyzed</span>
            </div>
            <span className="text-xs text-muted">1 day ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Templates view
function TemplatesView() {
  return (
    <div className="h-full p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-2">Experiment Templates</h2>
        <p className="text-muted">
          Pre-built experiment templates to get you started quickly
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-[var(--card)] p-6 rounded-lg border border-border hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Pipeline Performance</h3>
              <p className="text-sm text-muted">A/B Test</p>
            </div>
          </div>
          <p className="text-sm text-muted mb-4">
            Compare execution time, cost, and success rate between different pipeline configurations.
          </p>
          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Use Template
          </button>
        </div>
        
        <div className="bg-[var(--card)] p-6 rounded-lg border border-border hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Conversion Optimization</h3>
              <p className="text-sm text-muted">Multivariate</p>
            </div>
          </div>
          <p className="text-sm text-muted mb-4">
            Test multiple variables simultaneously to find the optimal combination for conversion rates.
          </p>
          <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Use Template
          </button>
        </div>
        
        <div className="bg-[var(--card)] p-6 rounded-lg border border-border hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Cost Analysis</h3>
              <p className="text-sm text-muted">Performance</p>
            </div>
          </div>
          <p className="text-sm text-muted mb-4">
            Analyze cost per conversion and identify opportunities for cost optimization.
          </p>
          <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            Use Template
          </button>
        </div>
      </div>
    </div>
  );
}
