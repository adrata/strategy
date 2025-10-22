"use client";

import React, { useState, useCallback } from 'react';
import { ContextSelector } from './shared/ContextSelector';
import { PipelineVisualization } from './shared/PipelineVisualization';

interface PersonPipelineStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  estimatedTime?: string;
  estimatedCost?: string;
  inputPreview?: string;
  outputPreview?: string;
}

export const FindPersonPipeline: React.FC = () => {
  const [inputMode, setInputMode] = useState<'one' | 'many' | 'prompt'>('one');
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [expandedSteps, setExpandedSteps] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);

  const pipelineSteps: PersonPipelineStep[] = [
    {
      id: 'person-identification',
      title: 'Person Identification',
      description: 'Locate and verify person identity across data sources',
      status: 'pending',
      estimatedTime: '20s',
      estimatedCost: '$0.05',
      inputPreview: 'Name, company, and basic identifiers',
      outputPreview: 'Verified person record with unique ID'
    },
    {
      id: 'contact-enrichment',
      title: 'Contact Enrichment',
      description: 'Gather email, phone, and social media profiles',
      status: 'pending',
      estimatedTime: '30s',
      estimatedCost: '$0.10',
      inputPreview: 'Person record and search criteria',
      outputPreview: 'Complete contact information (email, phone, LinkedIn)'
    },
    {
      id: 'innovation-profiling',
      title: 'Innovation Profile Analysis',
      description: 'Analyze innovation adoption patterns and technology adoption',
      status: 'pending',
      estimatedTime: '45s',
      estimatedCost: '$0.15',
      inputPreview: 'Person data and technology signals',
      outputPreview: 'Innovation segment classification and adoption patterns'
    },
    {
      id: 'pain-awareness-detection',
      title: 'Pain Awareness Detection',
      description: 'Identify active pain points and buying signals',
      status: 'pending',
      estimatedTime: '35s',
      estimatedCost: '$0.12',
      inputPreview: 'Person data and company context',
      outputPreview: 'Pain indicators and urgency scores'
    },
    {
      id: 'buying-authority-analysis',
      title: 'Buying Authority Analysis',
      description: 'Determine role in buying process and budget control',
      status: 'pending',
      estimatedTime: '25s',
      estimatedCost: '$0.08',
      inputPreview: 'Person data and organizational context',
      outputPreview: 'Buying authority level and estimated signing limit'
    },
    {
      id: 'influence-network-mapping',
      title: 'Influence Network Mapping',
      description: 'Map organizational relationships and influence patterns',
      status: 'pending',
      estimatedTime: '40s',
      estimatedCost: '$0.12',
      inputPreview: 'Person data and organizational structure',
      outputPreview: 'Influence network with relationship strengths'
    },
    {
      id: 'career-trajectory-analysis',
      title: 'Career Trajectory Analysis',
      description: 'Analyze career momentum and job change likelihood',
      status: 'pending',
      estimatedTime: '20s',
      estimatedCost: '$0.06',
      inputPreview: 'Career history and current role data',
      outputPreview: 'Career trajectory and promotion velocity'
    },
    {
      id: 'risk-profile-assessment',
      title: 'Risk Profile Assessment',
      description: 'Classify risk-taking propensity and decision style',
      status: 'pending',
      estimatedTime: '15s',
      estimatedCost: '$0.04',
      inputPreview: 'Person data and behavioral signals',
      outputPreview: 'Risk profile and decision-making style'
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
        name: 'Sarah Johnson',
        title: 'VP Marketing',
        company: 'Salesforce',
        email: 'sarah.johnson@salesforce.com',
        phone: '+1 (555) 123-4567',
        linkedin: 'linkedin.com/in/sarahjohnson',
        innovationProfile: {
          segment: 'Early Adopter',
          confidence: 0.87,
          signals: ['Early tech adoption', 'Conference speaking', 'Blog posts about innovation']
        },
        buyingAuthority: {
          role: 'Decision Maker',
          budgetControl: 'High',
          signingLimit: 250000,
          influenceScore: 92
        },
        painAwareness: {
          activePains: ['scaling_challenges', 'manual_processes'],
          urgencyScore: 0.78,
          keywords: ['automation', 'efficiency', 'scale']
        },
        influenceNetwork: {
          reportsTo: 'CMO',
          directReports: 12,
          keyRelationships: ['CFO', 'VP Sales', 'CTO'],
          externalInfluence: 'Conference speaker, thought leader'
        },
        careerTrajectory: {
          trend: 'Rising Star',
          promotionVelocity: 'Fast',
          jobChangeLikelihood: 'Low'
        },
        riskProfile: {
          type: 'Calculated Risk Taker',
          decisionStyle: 'Analytical Innovator'
        }
      }
    ];

    setResults(mockResults);
    setIsExecuting(false);
    setCurrentStepIndex(-1);
  }, [pipelineSteps.length]);

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Back Button */}
      <div className="flex-shrink-0 border-b border-[var(--border)] bg-[var(--background)] px-6 py-3">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
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
        <div className="w-1/3 border-r border-[var(--border)] p-6">
          <ContextSelector
            inputMode={inputMode}
            onInputModeChange={setInputMode}
            onFormSubmit={handleFormSubmit}
            pipelineType="person"
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
        <div className="flex-shrink-0 border-t border-[var(--border)] bg-[var(--background)] p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            Person Intelligence Results
          </h3>
          <div className="space-y-6">
            {results.map((person, index) => (
              <div key={index} className="bg-[var(--hover)] border border-[var(--border)] rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-semibold text-[var(--foreground)]">{person.name}</h4>
                    <p className="text-[var(--muted)]">{person.title} at {person.company}</p>
                    <div className="flex gap-4 mt-2 text-sm text-[var(--muted)]">
                      <span>{person.email}</span>
                      <span>{person.phone}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-[var(--muted)]">Influence Score</div>
                    <div className="text-2xl font-bold text-blue-600">{person.buyingAuthority.influenceScore}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Innovation Profile */}
                  <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                    <h5 className="font-medium text-[var(--foreground)] mb-2">Innovation Profile</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-[var(--muted)]">Segment:</span>
                        <span className="text-sm font-medium">{person.innovationProfile.segment}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-[var(--muted)]">Confidence:</span>
                        <span className="text-sm font-medium">{(person.innovationProfile.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Buying Authority */}
                  <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                    <h5 className="font-medium text-[var(--foreground)] mb-2">Buying Authority</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-[var(--muted)]">Role:</span>
                        <span className="text-sm font-medium">{person.buyingAuthority.role}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-[var(--muted)]">Signing Limit:</span>
                        <span className="text-sm font-medium">${person.buyingAuthority.signingLimit.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pain Awareness */}
                  <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                    <h5 className="font-medium text-[var(--foreground)] mb-2">Pain Awareness</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-[var(--muted)]">Urgency:</span>
                        <span className="text-sm font-medium">{(person.painAwareness.urgencyScore * 100).toFixed(0)}%</span>
                      </div>
                      <div className="text-sm text-[var(--muted)]">
                        Active Pains: {person.painAwareness.activePains.join(', ')}
                      </div>
                    </div>
                  </div>

                  {/* Career Trajectory */}
                  <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                    <h5 className="font-medium text-[var(--foreground)] mb-2">Career Trajectory</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-[var(--muted)]">Trend:</span>
                        <span className="text-sm font-medium">{person.careerTrajectory.trend}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-[var(--muted)]">Velocity:</span>
                        <span className="text-sm font-medium">{person.careerTrajectory.promotionVelocity}</span>
                      </div>
                    </div>
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
