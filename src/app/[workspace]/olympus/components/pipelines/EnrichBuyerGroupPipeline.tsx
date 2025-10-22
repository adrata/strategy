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

export const EnrichBuyerGroupPipeline: React.FC = () => {
  const [inputMode, setInputMode] = useState<'one' | 'many' | 'prompt'>('one');
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [expandedSteps, setExpandedSteps] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);

  const pipelineSteps: BuyerGroupPipelineStep[] = [
    {
      id: 'contact-enrichment',
      title: 'Contact Information Enrichment',
      description: 'Enrich contact details and communication preferences',
      status: 'pending',
      estimatedTime: '30s',
      estimatedCost: '$0.10',
      inputPreview: 'Basic contact information',
      outputPreview: 'Complete contact profiles with preferences'
    },
    {
      id: 'social-profile-discovery',
      title: 'Social Profile Discovery',
      description: 'Find and analyze social media profiles and activity',
      status: 'pending',
      estimatedTime: '40s',
      estimatedCost: '$0.12',
      inputPreview: 'Contact information and names',
      outputPreview: 'Social profiles with engagement metrics'
    },
    {
      id: 'engagement-history-analysis',
      title: 'Engagement History Analysis',
      description: 'Analyze past interactions and engagement patterns',
      status: 'pending',
      estimatedTime: '35s',
      estimatedCost: '$0.08',
      inputPreview: 'Contact data and interaction history',
      outputPreview: 'Engagement scores and communication preferences'
    },
    {
      id: 'company-intelligence-enhancement',
      title: 'Company Intelligence Enhancement',
      description: 'Add company context and industry insights',
      status: 'pending',
      estimatedTime: '25s',
      estimatedCost: '$0.06',
      inputPreview: 'Company data and industry context',
      outputPreview: 'Enhanced company profiles with market intelligence'
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

    // Simulate enrichment results
    const mockResults = [
      {
        companyName: 'Brex',
        enrichedData: {
          contactEnrichment: {
            totalContacts: 12,
            enrichedContacts: 12,
            newEmails: 3,
            newPhones: 2,
            socialProfiles: 8
          },
          engagementInsights: {
            averageEngagementScore: 78,
            topEngagementChannels: ['LinkedIn', 'Email', 'Phone'],
            preferredCommunicationTimes: ['Tuesday 10-11 AM', 'Thursday 2-3 PM']
          },
          companyIntelligence: {
            industryTrends: 'FinTech AI adoption accelerating',
            competitiveLandscape: 'Strong AI investment focus',
            marketPosition: 'Leading AI-driven financial services'
          }
        }
      }
    ];

    setResults(mockResults);
    setIsExecuting(false);
    setCurrentStepIndex(-1);
  }, [pipelineSteps.length]);

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Breadcrumb Navigation */}
      <div className="flex-shrink-0 px-6 py-3 bg-white border-b border-[var(--border)]">
        <nav className="flex items-center space-x-2 text-sm">
          <span className="text-[var(--foreground)]">Olympus</span>
          <span className="text-[var(--foreground)]">/</span>
          <span className="text-[var(--foreground)]">Buyer Group</span>
          <span className="text-[var(--foreground)]">/</span>
          <span className="text-[var(--foreground)] font-medium">Enrich</span>
        </nav>
      </div>

      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)] bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white border border-[var(--border)] rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">Enrich Buyer Group</h1>
              <p className="text-sm text-[var(--foreground)]">Add intelligence layers to existing buyer groups</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-[var(--foreground)]">Status</div>
              <div className="text-sm font-medium text-green-600">Ready</div>
            </div>
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-sm text-[var(--foreground)] hover:text-blue-600 transition-colors"
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
        <div className="w-1/3 border-r border-[var(--border)] bg-white overflow-y-auto overflow-x-hidden scrollbar-hide">
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Configuration</h3>
              <p className="text-sm text-[var(--foreground)]">Set up your buyer group enrichment parameters</p>
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
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Enrichment Progress</h3>
              <p className="text-sm text-[var(--foreground)]">Track the execution of your buyer group enrichment</p>
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
        <div className="flex-shrink-0 border-t border-[var(--border)] bg-white p-6 max-h-96 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            Enrichment Results
          </h3>
          <div className="space-y-6">
            {results.map((result, index) => (
              <div key={index} className="bg-[var(--hover)] border border-[var(--border)] rounded-lg p-4">
                <h4 className="font-semibold text-[var(--foreground)] mb-4">{result.companyName}</h4>
                
                {/* Contact Enrichment */}
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-medium text-green-900 mb-3">Contact Enrichment</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-green-800">Contacts Enriched</div>
                      <div className="text-green-700">{result.enrichedData.contactEnrichment.enrichedContacts}/{result.enrichedData.contactEnrichment.totalContacts}</div>
                    </div>
                    <div>
                      <div className="font-medium text-green-800">New Contact Info</div>
                      <div className="text-green-700">{result.enrichedData.contactEnrichment.newEmails} emails, {result.enrichedData.contactEnrichment.newPhones} phones</div>
                    </div>
                    <div>
                      <div className="font-medium text-green-800">Social Profiles</div>
                      <div className="text-green-700">{result.enrichedData.contactEnrichment.socialProfiles} profiles found</div>
                    </div>
                  </div>
                </div>

                {/* Engagement Insights */}
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-medium text-blue-900 mb-3">Engagement Insights</h5>
                  <div className="space-y-2 text-sm">
                    <div><strong>Average Engagement Score:</strong> {result.enrichedData.engagementInsights.averageEngagementScore}/100</div>
                    <div><strong>Top Channels:</strong> {result.enrichedData.engagementInsights.topEngagementChannels.join(', ')}</div>
                    <div><strong>Preferred Times:</strong> {result.enrichedData.engagementInsights.preferredCommunicationTimes.join(', ')}</div>
                  </div>
                </div>

                {/* Company Intelligence */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h5 className="font-medium text-purple-900 mb-3">Company Intelligence</h5>
                  <div className="space-y-2 text-sm">
                    <div><strong>Industry Trends:</strong> {result.enrichedData.companyIntelligence.industryTrends}</div>
                    <div><strong>Competitive Landscape:</strong> {result.enrichedData.companyIntelligence.competitiveLandscape}</div>
                    <div><strong>Market Position:</strong> {result.enrichedData.companyIntelligence.marketPosition}</div>
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
