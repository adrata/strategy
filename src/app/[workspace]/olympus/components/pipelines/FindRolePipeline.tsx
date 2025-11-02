"use client";

import React, { useState, useCallback } from 'react';
import { ContextSelector } from './shared/ContextSelector';
import { PipelineVisualization } from './shared/PipelineVisualization';

interface RolePipelineStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  estimatedTime?: string;
  estimatedCost?: string;
  inputPreview?: string;
  outputPreview?: string;
}

export const FindRolePipeline: React.FC = () => {
  const [inputMode, setInputMode] = useState<'one' | 'many' | 'prompt'>('one');
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [expandedSteps, setExpandedSteps] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);

  const pipelineSteps: RolePipelineStep[] = [
    {
      id: 'role-matching',
      title: 'Role Matching',
      description: 'Match role titles to standardized role categories',
      status: 'pending',
      estimatedTime: '15s',
      estimatedCost: '$0.03',
      inputPreview: 'Role titles and search criteria',
      outputPreview: 'Standardized role categories and seniority levels'
    },
    {
      id: 'people-discovery',
      title: 'People Discovery',
      description: 'Find people matching role criteria across companies',
      status: 'pending',
      estimatedTime: '60s',
      estimatedCost: '$0.20',
      inputPreview: 'Role criteria and company filters',
      outputPreview: 'List of people matching role requirements'
    },
    {
      id: 'contact-enrichment',
      title: 'Contact Enrichment',
      description: 'Gather email, phone, and social media profiles',
      status: 'pending',
      estimatedTime: '45s',
      estimatedCost: '$0.15',
      inputPreview: 'People list and enrichment criteria',
      outputPreview: 'Complete contact information for all matches'
    },
    {
      id: 'seniority-scoring',
      title: 'Seniority Scoring',
      description: 'Score people based on seniority and influence level',
      status: 'pending',
      estimatedTime: '25s',
      estimatedCost: '$0.08',
      inputPreview: 'People data and organizational context',
      outputPreview: 'Seniority scores and influence rankings'
    },
    {
      id: 'company-fit-analysis',
      title: 'Company Fit Analysis',
      description: 'Analyze company fit for each person based on company attributes',
      status: 'pending',
      estimatedTime: '30s',
      estimatedCost: '$0.10',
      inputPreview: 'People data and company attributes',
      outputPreview: 'Company fit scores and target company analysis'
    },
    {
      id: 'role-relevance-scoring',
      title: 'Role Relevance Scoring',
      description: 'Score how well each person matches the target role',
      status: 'pending',
      estimatedTime: '20s',
      estimatedCost: '$0.06',
      inputPreview: 'People data and role requirements',
      outputPreview: 'Role relevance scores and match quality'
    },
    {
      id: 'ranking-optimization',
      title: 'Ranking & Optimization',
      description: 'Rank people by combined scores and optimize for quality',
      status: 'pending',
      estimatedTime: '10s',
      estimatedCost: '$0.02',
      inputPreview: 'All scoring data and ranking criteria',
      outputPreview: 'Final ranked list with quality scores'
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
        seniorityScore: 92,
        companyFitScore: 88,
        roleRelevanceScore: 95,
        overallScore: 91,
        location: 'San Francisco, CA',
        companySize: '75,000 employees',
        industry: 'SaaS'
      },
      {
        name: 'Mike Chen',
        title: 'Director of Marketing',
        company: 'HubSpot',
        email: 'mike.chen@hubspot.com',
        phone: '+1 (555) 234-5678',
        linkedin: 'linkedin.com/in/mikechen',
        seniorityScore: 78,
        companyFitScore: 92,
        roleRelevanceScore: 88,
        overallScore: 86,
        location: 'Cambridge, MA',
        companySize: '5,000 employees',
        industry: 'SaaS'
      },
      {
        name: 'Lisa Rodriguez',
        title: 'CMO',
        company: 'Stripe',
        email: 'lisa.rodriguez@stripe.com',
        phone: '+1 (555) 345-6789',
        linkedin: 'linkedin.com/in/lisarodriguez',
        seniorityScore: 95,
        companyFitScore: 85,
        roleRelevanceScore: 90,
        overallScore: 90,
        location: 'San Francisco, CA',
        companySize: '8,000 employees',
        industry: 'FinTech'
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
            pipelineType="role"
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
            Role Discovery Results ({results.length} people found)
          </h3>
          <div className="space-y-4">
            {results.map((person, index) => (
              <div key={index} className="bg-hover border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{person.name}</h4>
                    <p className="text-sm text-muted">{person.title} at {person.company}</p>
                    <div className="flex gap-4 mt-1 text-xs text-muted">
                      <span>{person.email}</span>
                      <span>{person.phone}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{person.overallScore}</div>
                    <div className="text-xs text-muted">Overall Score</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-background border border-border rounded p-3">
                    <div className="text-muted text-xs">Seniority</div>
                    <div className="font-semibold text-foreground">{person.seniorityScore}</div>
                  </div>
                  <div className="bg-background border border-border rounded p-3">
                    <div className="text-muted text-xs">Company Fit</div>
                    <div className="font-semibold text-foreground">{person.companyFitScore}</div>
                  </div>
                  <div className="bg-background border border-border rounded p-3">
                    <div className="text-muted text-xs">Role Relevance</div>
                    <div className="font-semibold text-foreground">{person.roleRelevanceScore}</div>
                  </div>
                </div>

                <div className="mt-3 flex justify-between text-xs text-muted">
                  <span>{person.location}</span>
                  <span>{person.companySize}</span>
                  <span>{person.industry}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
