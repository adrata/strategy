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

export const UpdateBuyerGroupPipeline: React.FC = () => {
  const [inputMode, setInputMode] = useState<'one' | 'many' | 'prompt'>('one');
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [expandedSteps, setExpandedSteps] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);

  const pipelineSteps: BuyerGroupPipelineStep[] = [
    {
      id: 'data-freshness-verification',
      title: 'Data Freshness Verification',
      description: 'Verify and update data currency across all sources',
      status: 'pending',
      estimatedTime: '20s',
      estimatedCost: '$0.05',
      inputPreview: 'Existing buyer group data',
      outputPreview: 'Freshness scores and update recommendations'
    },
    {
      id: 'change-detection',
      title: 'Change Detection',
      description: 'Identify recent changes in roles, contacts, or structure',
      status: 'pending',
      estimatedTime: '25s',
      estimatedCost: '$0.06',
      inputPreview: 'Current and historical data',
      outputPreview: 'Change alerts and impact analysis'
    },
    {
      id: 'contact-validation',
      title: 'Contact Validation',
      description: 'Verify contact information accuracy and availability',
      status: 'pending',
      estimatedTime: '30s',
      estimatedCost: '$0.08',
      inputPreview: 'Contact details and verification sources',
      outputPreview: 'Validated contacts with accuracy scores'
    },
    {
      id: 'role-updates',
      title: 'Role Updates',
      description: 'Update role assignments and influence scores',
      status: 'pending',
      estimatedTime: '20s',
      estimatedCost: '$0.04',
      inputPreview: 'Current roles and organizational changes',
      outputPreview: 'Updated role assignments and influence mapping'
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

    // Simulate update results
    const mockResults = [
      {
        companyName: 'Brex',
        updateSummary: {
          dataFreshness: {
            overallScore: 92,
            lastUpdated: '2024-01-15',
            staleRecords: 2,
            updatedRecords: 10
          },
          changesDetected: [
            'Sarah Johnson promoted to VP Risk Analytics',
            'New contact: Alex Chen, Senior Data Scientist',
            'Michael Tannenbaum updated LinkedIn profile'
          ],
          contactValidation: {
            validatedContacts: 12,
            invalidContacts: 1,
            newContacts: 2,
            updatedContacts: 3
          },
          roleUpdates: {
            roleChanges: 3,
            influenceUpdates: 5,
            newInfluencers: 1
          }
        }
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
          <span className="text-foreground font-medium">Update</span>
        </nav>
      </div>

      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white border border-border rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Update Buyer Group</h1>
              <p className="text-sm text-foreground">Keep buyer group data current and accurate</p>
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

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Configuration */}
        <div className="w-1/3 border-r border-border bg-white overflow-y-auto overflow-x-hidden scrollbar-hide">
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">Configuration</h3>
              <p className="text-sm text-foreground">Set up your buyer group update parameters</p>
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
              <h3 className="text-lg font-semibold text-foreground mb-2">Update Progress</h3>
              <p className="text-sm text-foreground">Track the execution of your buyer group updates</p>
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
            Update Results
          </h3>
          <div className="space-y-6">
            {results.map((result, index) => (
              <div key={index} className="bg-hover border border-border rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-4">{result.companyName}</h4>
                
                {/* Data Freshness */}
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-medium text-green-900 mb-3">Data Freshness</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-green-800">Overall Score</div>
                      <div className="text-green-700">{result.updateSummary.dataFreshness.overallScore}/100</div>
                    </div>
                    <div>
                      <div className="font-medium text-green-800">Last Updated</div>
                      <div className="text-green-700">{result.updateSummary.dataFreshness.lastUpdated}</div>
                    </div>
                    <div>
                      <div className="font-medium text-green-800">Updated Records</div>
                      <div className="text-green-700">{result.updateSummary.dataFreshness.updatedRecords}</div>
                    </div>
                    <div>
                      <div className="font-medium text-green-800">Stale Records</div>
                      <div className="text-green-700">{result.updateSummary.dataFreshness.staleRecords}</div>
                    </div>
                  </div>
                </div>

                {/* Changes Detected */}
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-medium text-blue-900 mb-3">Changes Detected</h5>
                  <ul className="space-y-1 text-sm">
                    {result.updateSummary.changesDetected.map((change, idx) => (
                      <li key={idx} className="text-blue-700">• {change}</li>
                    ))}
                  </ul>
                </div>

                {/* Contact Validation */}
                <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h5 className="font-medium text-yellow-900 mb-3">Contact Validation</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-yellow-800">Validated</div>
                      <div className="text-yellow-700">{result.updateSummary.contactValidation.validatedContacts}</div>
                    </div>
                    <div>
                      <div className="font-medium text-yellow-800">Invalid</div>
                      <div className="text-yellow-700">{result.updateSummary.contactValidation.invalidContacts}</div>
                    </div>
                    <div>
                      <div className="font-medium text-yellow-800">New Contacts</div>
                      <div className="text-yellow-700">{result.updateSummary.contactValidation.newContacts}</div>
                    </div>
                    <div>
                      <div className="font-medium text-yellow-800">Updated</div>
                      <div className="text-yellow-700">{result.updateSummary.contactValidation.updatedContacts}</div>
                    </div>
                  </div>
                </div>

                {/* Role Updates */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h5 className="font-medium text-purple-900 mb-3">Role Updates</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-purple-800">Role Changes</div>
                      <div className="text-purple-700">{result.updateSummary.roleUpdates.roleChanges}</div>
                    </div>
                    <div>
                      <div className="font-medium text-purple-800">Influence Updates</div>
                      <div className="text-purple-700">{result.updateSummary.roleUpdates.influenceUpdates}</div>
                    </div>
                    <div>
                      <div className="font-medium text-purple-800">New Influencers</div>
                      <div className="text-purple-700">{result.updateSummary.roleUpdates.newInfluencers}</div>
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
