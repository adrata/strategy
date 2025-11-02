"use client";

import React, { useState, useCallback } from 'react';
import { ContextSelector } from './shared/ContextSelector';
import { PipelineVisualization } from './shared/PipelineVisualization';

interface CompanyPipelineStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  estimatedTime?: string;
  estimatedCost?: string;
  inputPreview?: string;
  outputPreview?: string;
}

export const FindCompanyPipeline: React.FC = () => {
  const [inputMode, setInputMode] = useState<'one' | 'many' | 'prompt'>('one');
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [expandedSteps, setExpandedSteps] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);

  const pipelineSteps: CompanyPipelineStep[] = [
    {
      id: 'data-collection',
      title: 'Data Collection',
      description: 'Gather company data from multiple sources',
      status: 'pending',
      estimatedTime: '30s',
      estimatedCost: '$0.05',
      inputPreview: 'Company criteria and search parameters',
      outputPreview: 'Raw company data from CoreSignal, LinkedIn, etc.'
    },
    {
      id: 'firmographics-analysis',
      title: 'Firmographics Analysis',
      description: 'Analyze company size, industry, and basic attributes',
      status: 'pending',
      estimatedTime: '15s',
      estimatedCost: '$0.02',
      inputPreview: 'Raw company data',
      outputPreview: 'Standardized firmographics (size, industry, location)'
    },
    {
      id: 'innovation-scoring',
      title: 'Innovation Profile Scoring',
      description: 'Score companies based on innovation adoption patterns',
      status: 'pending',
      estimatedTime: '45s',
      estimatedCost: '$0.10',
      inputPreview: 'Company data and technology adoption signals',
      outputPreview: 'Innovation segment classification (innovator, early adopter, etc.)'
    },
    {
      id: 'pain-signal-detection',
      title: 'Pain Signal Detection',
      description: 'Identify active pain points and buying signals',
      status: 'pending',
      estimatedTime: '30s',
      estimatedCost: '$0.08',
      inputPreview: 'Company data and hiring/technology signals',
      outputPreview: 'Pain indicators (hiring spikes, executive turnover, etc.)'
    },
    {
      id: 'buyer-group-quality',
      title: 'Buyer Group Quality Assessment',
      description: 'Evaluate the quality of potential buyer groups',
      status: 'pending',
      estimatedTime: '20s',
      estimatedCost: '$0.05',
      inputPreview: 'Company data and organizational structure',
      outputPreview: 'Buyer group quality score and key stakeholders'
    },
    {
      id: 'tci-scoring',
      title: 'Target Company Intelligence Scoring',
      description: 'Calculate final TCI score using weighted formula',
      status: 'pending',
      estimatedTime: '10s',
      estimatedCost: '$0.01',
      inputPreview: 'All previous analysis results',
      outputPreview: 'Final TCI score (0-100) with detailed breakdown'
    },
    {
      id: 'filtering-ranking',
      title: 'Filtering & Ranking',
      description: 'Filter and rank companies by score and criteria',
      status: 'pending',
      estimatedTime: '5s',
      estimatedCost: '$0.00',
      inputPreview: 'TCI scores and filtering criteria',
      outputPreview: 'Ranked list of target companies'
    }
  ];

  const handleStepToggle = useCallback((stepId: string) => {
    setExpandedSteps(prev => 
      prev.includes(stepId) 
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  }, []);

  const handleFormSubmit = useCallback(async (data: any) => {
    setIsExecuting(true);
    setCurrentStepIndex(0);
    setResults([]);

    // Simulate pipeline execution
    for (let i = 0; i < pipelineSteps.length; i++) {
      setCurrentStepIndex(i);
      
      // Simulate step execution time
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Simulate results
    const mockResults = [
      {
        companyName: 'Salesforce',
        domain: 'salesforce.com',
        tciScore: 87,
        industry: 'SaaS',
        employeeCount: 75000,
        innovationProfile: 'Early Adopter',
        painSignals: ['hiring_spike', 'executive_turnover'],
        buyerGroupQuality: 92,
        location: 'San Francisco, CA'
      },
      {
        companyName: 'HubSpot',
        domain: 'hubspot.com',
        tciScore: 82,
        industry: 'SaaS',
        employeeCount: 5000,
        innovationProfile: 'Innovator',
        painSignals: ['manual_processes', 'tool_sprawl'],
        buyerGroupQuality: 88,
        location: 'Cambridge, MA'
      }
    ];

    setResults(mockResults);
    setIsExecuting(false);
    setCurrentStepIndex(-1);
  }, [pipelineSteps.length]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Back Button */}
      <div className="flex-shrink-0 border-b border-border bg-background px-6 py-3">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Actions
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Configuration */}
        <div className="w-1/3 border-r border-border p-6">
          <ContextSelector
            inputMode={inputMode}
            onInputModeChange={setInputMode}
            onFormSubmit={handleFormSubmit}
            pipelineType="company"
            isLoading={isExecuting}
          />
        </div>

        {/* Right Panel - Pipeline Visualization */}
        <div className="flex-1 p-6">
          <PipelineVisualization
            steps={pipelineSteps}
            isExecuting={isExecuting}
            currentStepIndex={currentStepIndex}
            onStepToggle={handleStepToggle}
            expandedSteps={expandedSteps}
          />
        </div>
      </div>

      {/* Results Panel */}
      {results.length > 0 && (
        <div className="flex-shrink-0 border-t border-border bg-background p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Discovery Results ({results.length} companies found)
          </h3>
          <div className="grid gap-4">
            {results.map((company, index) => (
              <div key={index} className="bg-hover border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-foreground">{company.companyName}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted">TCI Score:</span>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      company.tciScore >= 80 ? 'bg-green-100 text-green-800' :
                      company.tciScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {company.tciScore}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted">Industry:</span> {company.industry}
                  </div>
                  <div>
                    <span className="text-muted">Employees:</span> {company.employeeCount.toLocaleString()}
                  </div>
                  <div>
                    <span className="text-muted">Innovation Profile:</span> {company.innovationProfile}
                  </div>
                  <div>
                    <span className="text-muted">Buyer Group Quality:</span> {company.buyerGroupQuality}%
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-muted text-sm">Pain Signals:</span>
                  <div className="flex gap-1 mt-1">
                    {company.painSignals.map((signal, idx) => (
                      <span key={idx} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                        {signal.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
