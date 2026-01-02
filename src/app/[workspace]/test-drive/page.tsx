"use client";

import React, { useState } from 'react';
import { useWorkspaceId } from '@/frontend/components/stacks/utils/workspaceId';
import { ModeSelection } from './components/ModeSelection';
import { TestDriveInput } from './components/TestDriveInput';
import { TestDriveProcessing } from './components/TestDriveProcessing';
import { TestDriveResults } from './components/TestDriveResults';
import { RunManyInput } from './components/RunManyInput';
import { RunManyProcessing } from './components/RunManyProcessing';
import { RunManyResults } from './components/RunManyResults';
import { PullIntelligenceInput } from './components/PullIntelligenceInput';
import { PullIntelligenceProcessing } from './components/PullIntelligenceProcessing';
import { PullIntelligenceResults } from './components/PullIntelligenceResults';
import { IndustryRankingInput } from './components/IndustryRankingInput';
import { IndustryRankingProcessing } from './components/IndustryRankingProcessing';
import { IndustryRankingResults } from './components/IndustryRankingResults';
import { IndustryComparisonInput } from './components/IndustryComparisonInput';
import { IndustryComparisonProcessing } from './components/IndustryComparisonProcessing';
import { IndustryComparisonResults } from './components/IndustryComparisonResults';
import type { BuyerGroupResult, TestDriveFormData, TestDriveMode, RunManyFormData, RunManyResult, PullIntelligenceFormData, PullIntelligenceResult, IndustryRankingFormData, IndustryRankingResult, IndustryComparisonFormData, IndustryComparisonResult } from './types';

export default function TestDrivePage() {
  const workspaceId = useWorkspaceId();
  
  const [mode, setMode] = useState<TestDriveMode | null>(null);
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2 | 3>(0);
  
  // Run 1 state
  const [formData, setFormData] = useState<TestDriveFormData | null>(null);
  const [result, setResult] = useState<BuyerGroupResult | null>(null);
  
  // Run Many state
  const [runManyFormData, setRunManyFormData] = useState<RunManyFormData | null>(null);
  const [runManyResults, setRunManyResults] = useState<RunManyResult[] | null>(null);

  // PULL Intelligence state
  const [pullFormData, setPullFormData] = useState<PullIntelligenceFormData | null>(null);
  const [pullResult, setPullResult] = useState<PullIntelligenceResult | null>(null);

  // Industry Ranking state
  const [industryFormData, setIndustryFormData] = useState<IndustryRankingFormData | null>(null);
  const [industryResult, setIndustryResult] = useState<IndustryRankingResult | null>(null);

  // Industry Comparison state
  const [comparisonFormData, setComparisonFormData] = useState<IndustryComparisonFormData | null>(null);
  const [comparisonResult, setComparisonResult] = useState<IndustryComparisonResult | null>(null);

  const [error, setError] = useState<string | null>(null);

  if (!workspaceId) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted">Loading workspace...</p>
        </div>
      </div>
    );
  }

  const handleModeSelect = (selectedMode: TestDriveMode) => {
    setMode(selectedMode);
    setError(null);
    setCurrentStep(1);
  };

  // Run 1 handlers
  const handleFormSubmit = (data: TestDriveFormData) => {
    setFormData(data);
    setError(null);
    setCurrentStep(2);
  };

  const handleProcessingComplete = (result: BuyerGroupResult) => {
    setResult(result);
    setCurrentStep(3);
  };

  const handleProcessingError = (errorMessage: string) => {
    setError(errorMessage);
    setCurrentStep(1);
  };

  const handleReset = () => {
    setFormData(null);
    setResult(null);
    setRunManyFormData(null);
    setRunManyResults(null);
    setPullFormData(null);
    setPullResult(null);
    setIndustryFormData(null);
    setIndustryResult(null);
    setComparisonFormData(null);
    setComparisonResult(null);
    setError(null);
    setMode(null);
    setCurrentStep(0);
  };

  // Run Many handlers
  const handleRunManyFormSubmit = (data: RunManyFormData) => {
    setRunManyFormData(data);
    setError(null);
    setCurrentStep(2);
  };

  const handleRunManyProcessingComplete = (results: RunManyResult[]) => {
    setRunManyResults(results);
    setCurrentStep(3);
  };

  const handleRunManyProcessingError = (errorMessage: string) => {
    setError(errorMessage);
    setCurrentStep(1);
  };

  // PULL Intelligence handlers
  const handlePullFormSubmit = (data: PullIntelligenceFormData) => {
    setPullFormData(data);
    setError(null);
    setCurrentStep(2);
  };

  const handlePullProcessingComplete = (result: PullIntelligenceResult) => {
    setPullResult(result);
    setCurrentStep(3);
  };

  const handlePullProcessingError = (errorMessage: string) => {
    setError(errorMessage);
    setCurrentStep(1);
  };

  // Industry Ranking handlers
  const handleIndustryFormSubmit = (data: IndustryRankingFormData) => {
    setIndustryFormData(data);
    setError(null);
    setCurrentStep(2);
  };

  const handleIndustryProcessingComplete = (result: IndustryRankingResult) => {
    setIndustryResult(result);
    setCurrentStep(3);
  };

  const handleIndustryProcessingError = (errorMessage: string) => {
    setError(errorMessage);
    setCurrentStep(1);
  };

  // Industry Comparison handlers
  const handleComparisonFormSubmit = (data: IndustryComparisonFormData) => {
    setComparisonFormData(data);
    setError(null);
    setCurrentStep(2);
  };

  const handleComparisonProcessingComplete = (result: IndustryComparisonResult) => {
    setComparisonResult(result);
    setCurrentStep(3);
  };

  const handleComparisonProcessingError = (errorMessage: string) => {
    setError(errorMessage);
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Test Drive: Buyer Group Intelligence
          </h1>
          <p className="text-muted">
            Showcase the power of Adrata's buyer group intelligence to prospects
          </p>
        </div>

        {/* Step Indicator - Only show if mode is selected */}
        {mode && currentStep > 0 && (
          <div className="mb-8 flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-foreground' : 'text-muted'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {currentStep > 1 ? '✓' : '1'}
              </div>
              <span className="text-sm font-medium">Input</span>
            </div>
            <div className={`w-16 h-0.5 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-foreground' : 'text-muted'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {currentStep > 2 ? '✓' : '2'}
              </div>
              <span className="text-sm font-medium">Processing</span>
            </div>
            <div className={`w-16 h-0.5 ${currentStep >= 3 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-foreground' : 'text-muted'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                3
              </div>
              <span className="text-sm font-medium">Results</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Step Content */}
        <div className="transition-all duration-300">
          {currentStep === 0 && (
            <ModeSelection
              onSelectRun1={() => handleModeSelect('run-1')}
              onSelectRunMany={() => handleModeSelect('run-many')}
              onSelectPullIntelligence={() => handleModeSelect('pull-intelligence')}
              onSelectIndustryRanking={() => handleModeSelect('industry-ranking')}
              onSelectIndustryComparison={() => handleModeSelect('industry-comparison')}
            />
          )}
          
          {/* Run 1 Flow */}
          {mode === 'run-1' && currentStep === 1 && (
            <TestDriveInput
              onSubmit={handleFormSubmit}
              initialData={formData}
            />
          )}
          {mode === 'run-1' && currentStep === 2 && formData && workspaceId && (
            <TestDriveProcessing
              formData={formData}
              workspaceId={workspaceId}
              onComplete={handleProcessingComplete}
              onError={handleProcessingError}
            />
          )}
          {mode === 'run-1' && currentStep === 3 && result && (
            <TestDriveResults
              result={result}
              onReset={handleReset}
            />
          )}

          {/* Run Many Flow */}
          {mode === 'run-many' && currentStep === 1 && (
            <RunManyInput
              onSubmit={handleRunManyFormSubmit}
              initialData={runManyFormData}
            />
          )}
          {mode === 'run-many' && currentStep === 2 && runManyFormData && workspaceId && (
            <RunManyProcessing
              formData={runManyFormData}
              workspaceId={workspaceId}
              onComplete={handleRunManyProcessingComplete}
              onError={handleRunManyProcessingError}
            />
          )}
          {mode === 'run-many' && currentStep === 3 && runManyResults && runManyFormData && (
            <RunManyResults
              yourCompany={runManyFormData.yourCompany}
              results={runManyResults}
              onReset={handleReset}
            />
          )}

          {/* PULL Intelligence Flow */}
          {mode === 'pull-intelligence' && currentStep === 1 && (
            <PullIntelligenceInput
              onSubmit={handlePullFormSubmit}
              initialData={pullFormData}
            />
          )}
          {mode === 'pull-intelligence' && currentStep === 2 && pullFormData && workspaceId && (
            <PullIntelligenceProcessing
              formData={pullFormData}
              workspaceId={workspaceId}
              onComplete={handlePullProcessingComplete}
              onError={handlePullProcessingError}
            />
          )}
          {mode === 'pull-intelligence' && currentStep === 3 && pullResult && (
            <PullIntelligenceResults
              result={pullResult}
              onReset={handleReset}
            />
          )}

          {/* Industry Ranking Flow */}
          {mode === 'industry-ranking' && currentStep === 1 && (
            <IndustryRankingInput
              onSubmit={handleIndustryFormSubmit}
              initialData={industryFormData}
            />
          )}
          {mode === 'industry-ranking' && currentStep === 2 && industryFormData && workspaceId && (
            <IndustryRankingProcessing
              formData={industryFormData}
              workspaceId={workspaceId}
              onComplete={handleIndustryProcessingComplete}
              onError={handleIndustryProcessingError}
            />
          )}
          {mode === 'industry-ranking' && currentStep === 3 && industryResult && (
            <IndustryRankingResults
              result={industryResult}
              onReset={handleReset}
            />
          )}

          {/* Industry Comparison Flow */}
          {mode === 'industry-comparison' && currentStep === 1 && (
            <IndustryComparisonInput
              onSubmit={handleComparisonFormSubmit}
              initialData={comparisonFormData}
            />
          )}
          {mode === 'industry-comparison' && currentStep === 2 && comparisonFormData && workspaceId && (
            <IndustryComparisonProcessing
              formData={comparisonFormData}
              workspaceId={workspaceId}
              onComplete={handleComparisonProcessingComplete}
              onError={handleComparisonProcessingError}
            />
          )}
          {mode === 'industry-comparison' && currentStep === 3 && comparisonResult && (
            <IndustryComparisonResults
              result={comparisonResult}
              onReset={handleReset}
            />
          )}
        </div>
      </div>
    </div>
  );
}

