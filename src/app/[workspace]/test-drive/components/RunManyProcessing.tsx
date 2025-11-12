"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/platform/shared/components/ui/card';
import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';
import type { RunManyFormData, BuyerGroupResult, RunManyResult } from '../types';

interface RunManyProcessingProps {
  formData: RunManyFormData;
  workspaceId: string;
  onComplete: (results: RunManyResult[]) => void;
  onError: (error: string) => void;
}

type CompanyStatus = 'pending' | 'processing' | 'completed' | 'error';

interface CompanyProcessingState {
  company: typeof formData.targetCompanies[0];
  status: CompanyStatus;
  result: BuyerGroupResult | null;
  error?: string;
  currentStageIndex: number;
}

const PROCESSING_STAGES = [
  'Resolving company information',
  'Determining company size',
  'Discovering employees',
  'Classifying roles (multi-signal)',
  'Filtering by relevance',
  'Selecting optimal buyer group',
  'Enriching contact data',
  'Validating accuracy',
];

export function RunManyProcessing({
  formData,
  workspaceId,
  onComplete,
  onError,
}: RunManyProcessingProps) {
  const [companies, setCompanies] = useState<CompanyProcessingState[]>(
    formData.targetCompanies.map(company => ({
      company,
      status: 'pending' as CompanyStatus,
      result: null,
      currentStageIndex: 0,
    }))
  );

  const [currentProcessingIndex, setCurrentProcessingIndex] = useState<number>(-1);

  useEffect(() => {
    const processAllCompanies = async () => {
      const results: RunManyResult[] = [];

      for (let i = 0; i < companies.length; i++) {
        setCurrentProcessingIndex(i);
        
        // Update company status to processing
        setCompanies(prev => {
          const newCompanies = [...prev];
          newCompanies[i] = { ...newCompanies[i], status: 'processing' };
          return newCompanies;
        });

        try {
          const company = companies[i].company;
          const companyName = company.name;
          const companyLinkedInUrl = company.linkedinUrl;
          const website = company.website;

          if (!companyName && !companyLinkedInUrl && !website) {
            throw new Error('Company information is required');
          }

          // Simulate stage progression
          for (let stageIndex = 0; stageIndex < PROCESSING_STAGES.length; stageIndex++) {
            setCompanies(prev => {
              const newCompanies = [...prev];
              newCompanies[i] = { ...newCompanies[i], currentStageIndex: stageIndex };
              return newCompanies;
            });
            await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 200));
          }

          // Make API call
          const response = await fetch('/api/intelligence/buyer-group-v2', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              companyName,
              companyLinkedInUrl,
              website,
              workspaceId,
              enrichmentLevel: 'enrich',
              saveToDatabase: false,
            }),
          });

          if (!response || !response.ok) {
            const errorData = response ? await response.json().catch(() => ({ error: 'Unknown error' })) : { error: 'No response from server' };
            throw new Error(errorData.error || `API error: ${response?.status || 'Unknown'}`);
          }

          const data = await response.json();

          const result: BuyerGroupResult = {
            success: data.success,
            company: data.company,
            buyerGroup: data.buyerGroup,
            qualityMetrics: data.quality || data.qualityMetrics,
            processingTime: data.processingTime,
          };

          // Update company status to completed
          setCompanies(prev => {
            const newCompanies = [...prev];
            newCompanies[i] = {
              ...newCompanies[i],
              status: 'completed',
              result,
              currentStageIndex: PROCESSING_STAGES.length - 1,
            };
            return newCompanies;
          });

          results.push({
            company,
            result,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to discover buyer group';
          
          setCompanies(prev => {
            const newCompanies = [...prev];
            newCompanies[i] = {
              ...newCompanies[i],
              status: 'error',
              error: errorMessage,
            };
            return newCompanies;
          });

          results.push({
            company,
            result: null,
            error: errorMessage,
          });
        }
      }

      setCurrentProcessingIndex(-1);
      onComplete(results);
    };

    processAllCompanies();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const completedCount = companies.filter(c => c.status === 'completed').length;
  const errorCount = companies.filter(c => c.status === 'error').length;
  const totalCount = companies.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Processing Buyer Group Intelligence</CardTitle>
        <p className="text-sm text-muted mt-2">
          Processing {totalCount} {totalCount === 1 ? 'company' : 'companies'}...
        </p>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Overall Progress</span>
            <span className="text-sm text-muted">
              {completedCount + errorCount} / {totalCount} completed
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((completedCount + errorCount) / totalCount) * 100}%` }}
            />
          </div>
          <div className="flex gap-4 mt-3 text-xs text-muted">
            <span>Successful: {completedCount}</span>
            <span>Failed: {errorCount}</span>
          </div>
        </div>

        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {companies.map((companyState, index) => {
            const isProcessing = index === currentProcessingIndex;
            const companyName = companyState.company.name || 
                               companyState.company.website || 
                               companyState.company.linkedinUrl || 
                               `Company ${index + 1}`;

            return (
              <div
                key={index}
                className={`p-4 border rounded-lg ${
                  companyState.status === 'completed'
                    ? 'border-green-200 bg-green-50/50'
                    : companyState.status === 'error'
                    ? 'border-destructive/20 bg-destructive/5'
                    : isProcessing
                    ? 'border-primary/20 bg-primary/5'
                    : 'border-border bg-background'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {companyState.status === 'completed' && (
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    )}
                    {companyState.status === 'error' && (
                      <XCircleIcon className="w-5 h-5 text-destructive" />
                    )}
                    {companyState.status === 'processing' && (
                      <ClockIcon className="w-5 h-5 text-primary animate-pulse" />
                    )}
                    {companyState.status === 'pending' && (
                      <ClockIcon className="w-5 h-5 text-muted" />
                    )}
                    <span className="font-medium text-foreground">{companyName}</span>
                  </div>
                  <span className="text-xs text-muted">
                    {companyState.status === 'completed' && 'Completed'}
                    {companyState.status === 'error' && 'Failed'}
                    {companyState.status === 'processing' && `Stage ${companyState.currentStageIndex + 1}/${PROCESSING_STAGES.length}`}
                    {companyState.status === 'pending' && 'Pending'}
                  </span>
                </div>

                {companyState.status === 'processing' && (
                  <div className="space-y-2 mt-3">
                    {PROCESSING_STAGES.map((stage, stageIndex) => (
                      <div key={stageIndex} className="flex items-center gap-2 text-sm">
                        {stageIndex <= companyState.currentStageIndex ? (
                          <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-muted flex-shrink-0" />
                        )}
                        <span
                          className={
                            stageIndex < companyState.currentStageIndex
                              ? 'text-foreground'
                              : stageIndex === companyState.currentStageIndex
                              ? 'text-primary font-medium'
                              : 'text-muted'
                          }
                        >
                          {stage}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {companyState.status === 'error' && companyState.error && (
                  <p className="text-sm text-destructive mt-2">{companyState.error}</p>
                )}

                {companyState.status === 'completed' && companyState.result && (
                  <div className="mt-3 text-sm text-muted">
                    Found {companyState.result.buyerGroup?.totalMembers || 0} buyer group members
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

