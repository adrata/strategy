"use client";

import React, { useState, useCallback } from 'react';
import { ContextSelector } from './shared/ContextSelector';
import { PipelineVisualization } from './shared/PipelineVisualization';

interface BuyerGroupPipelineStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  estimatedTime?: string;
  estimatedCost?: string;
  inputPreview?: string;
  outputPreview?: string;
}

export const FindBuyerGroupPipeline: React.FC = () => {
  const [inputMode, setInputMode] = useState<'one' | 'many' | 'prompt'>('one');
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [expandedSteps, setExpandedSteps] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);

  const pipelineSteps: BuyerGroupPipelineStep[] = [
    {
      id: 'company-resolution',
      title: 'Company Resolution',
      description: 'Resolve company name to standardized company record',
      status: 'pending',
      estimatedTime: '15s',
      estimatedCost: '$0.02',
      inputPreview: 'Company name or domain',
      outputPreview: 'Standardized company record with ID and attributes'
    },
    {
      id: 'people-discovery',
      title: 'People Discovery',
      description: 'Find all relevant people at the company',
      status: 'pending',
      estimatedTime: '45s',
      estimatedCost: '$0.15',
      inputPreview: 'Company ID and search criteria',
      outputPreview: 'List of people with titles and basic info'
    },
    {
      id: 'role-assignment',
      title: 'Role Assignment',
      description: 'Assign roles and influence scores to each person',
      status: 'pending',
      estimatedTime: '30s',
      estimatedCost: '$0.08',
      inputPreview: 'People list and company context',
      outputPreview: 'People with assigned roles and influence scores'
    },
    {
      id: 'buyer-group-formation',
      title: 'Buyer Group Formation',
      description: 'Group people into buying committees by decision type',
      status: 'pending',
      estimatedTime: '20s',
      estimatedCost: '$0.05',
      inputPreview: 'People with roles and influence scores',
      outputPreview: 'Buying committees with key stakeholders'
    },
    {
      id: 'influence-mapping',
      title: 'Influence Mapping',
      description: 'Map relationships and influence patterns within groups',
      status: 'pending',
      estimatedTime: '25s',
      estimatedCost: '$0.06',
      inputPreview: 'Buying committees and organizational data',
      outputPreview: 'Influence network with relationship strengths'
    },
    {
      id: 'decision-pathway-analysis',
      title: 'Decision Pathway Analysis',
      description: 'Analyze how decisions flow through the organization',
      status: 'pending',
      estimatedTime: '15s',
      estimatedCost: '$0.03',
      inputPreview: 'Influence network and role assignments',
      outputPreview: 'Decision pathways and approval flows'
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
        buyingCommittees: [
          {
            name: 'Marketing Technology Committee',
            members: [
              {
                name: 'Sarah Johnson',
                title: 'VP Marketing',
                role: 'Decision Maker',
                influenceScore: 95,
                email: 'sarah.johnson@salesforce.com'
              },
              {
                name: 'Mike Chen',
                title: 'Director of Marketing Operations',
                role: 'Champion',
                influenceScore: 78,
                email: 'mike.chen@salesforce.com'
              },
              {
                name: 'Lisa Rodriguez',
                title: 'CFO',
                role: 'Approver',
                influenceScore: 88,
                email: 'lisa.rodriguez@salesforce.com'
              }
            ]
          },
          {
            name: 'Sales Technology Committee',
            members: [
              {
                name: 'David Park',
                title: 'VP Sales',
                role: 'Decision Maker',
                influenceScore: 92,
                email: 'david.park@salesforce.com'
              },
              {
                name: 'Jennifer Lee',
                title: 'Sales Operations Manager',
                role: 'Evaluator',
                influenceScore: 65,
                email: 'jennifer.lee@salesforce.com'
              }
            ]
          }
        ]
      }
    ];

    setResults(mockResults);
    setIsExecuting(false);
    setCurrentStepIndex(-1);
  }, [pipelineSteps.length]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Breadcrumb Navigation */}
      <div className="flex-shrink-0 px-6 py-3 bg-white border-b border-border">
        <nav className="flex items-center space-x-2 text-sm">
          <span className="text-foreground">Olympus</span>
          <span className="text-foreground">/</span>
          <span className="text-foreground">Buyer Group</span>
          <span className="text-foreground">/</span>
          <span className="text-foreground font-medium">Find</span>
        </nav>
      </div>

      {/* Header - Lead Record Style */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white border border-border rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Find Buyer Groups</h1>
              <p className="text-sm text-foreground">Discover new buying committees and key stakeholders</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-foreground">Status</div>
              <div className="text-sm font-medium text-green-600">Ready</div>
            </div>
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-sm text-foreground hover:text-blue-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Buyer Group Actions
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Lead Record Style */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Configuration */}
        <div className="w-1/3 border-r border-border bg-white overflow-y-auto overflow-x-hidden scrollbar-hide">
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">Configuration</h3>
              <p className="text-sm text-foreground">Set up your buyer group discovery parameters</p>
            </div>
            <ContextSelector
              inputMode={inputMode}
              onInputModeChange={setInputMode}
              onFormSubmit={handleFormSubmit}
              pipelineType="buyer-group"
              isLoading={isExecuting}
            />
          </div>
        </div>

        {/* Right Panel - Pipeline Visualization */}
        <div className="flex-1 bg-white overflow-y-auto overflow-x-hidden scrollbar-hide">
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">Pipeline Progress</h3>
              <p className="text-sm text-foreground">Track the execution of your buyer group discovery</p>
            </div>
            <PipelineVisualization
              steps={pipelineSteps}
              isExecuting={isExecuting}
              currentStepIndex={currentStepIndex}
              onStepToggle={handleStepToggle}
              expandedSteps={expandedSteps}
            />
          </div>
        </div>
      </div>

      {/* Results Panel */}
      {results.length > 0 && (
        <div className="flex-shrink-0 border-t border-border bg-white p-6 max-h-96 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Buyer Group Results
          </h3>
          <div className="space-y-6">
            {results.map((result, index) => (
              <div key={index} className="bg-hover border border-border rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-4">{result.companyName}</h4>
                <div className="space-y-4">
                  {result.buyingCommittees.map((committee, committeeIndex) => (
                    <div key={committeeIndex} className="bg-background border border-border rounded-lg p-4">
                      <h5 className="font-medium text-foreground mb-3">{committee.name}</h5>
                      <div className="space-y-2">
                        {committee.members.map((member, memberIndex) => (
                          <div key={memberIndex} className="flex items-center justify-between p-3 bg-hover rounded">
                            <div className="flex-1">
                              <div className="font-medium text-foreground">{member.name}</div>
                              <div className="text-sm text-muted">{member.title}</div>
                              <div className="text-xs text-muted">{member.email}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-sm font-medium text-foreground">{member.role}</div>
                                <div className="text-xs text-muted">Influence: {member.influenceScore}</div>
                              </div>
                              <div className={`w-3 h-3 rounded-full ${
                                member.influenceScore >= 90 ? 'bg-green-500' :
                                member.influenceScore >= 70 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
