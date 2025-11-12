"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/platform/shared/components/ui/card';
import { Check } from 'lucide-react';
import type { TestDriveFormData, BuyerGroupResult, ProcessingStage } from '../types';

interface TestDriveProcessingProps {
  formData: TestDriveFormData;
  workspaceId: string;
  onComplete: (result: BuyerGroupResult) => void;
  onError: (error: string) => void;
}

const PROCESSING_STAGES: ProcessingStage[] = [
  { id: 'resolve-company', label: 'Resolving company information', completed: false, inProgress: false },
  { id: 'determine-size', label: 'Determining company size', completed: false, inProgress: false },
  { id: 'discover-employees', label: 'Discovering employees', completed: false, inProgress: false },
  { id: 'classify-roles', label: 'Classifying roles (multi-signal)', completed: false, inProgress: false },
  { id: 'filter-relevance', label: 'Filtering by relevance', completed: false, inProgress: false },
  { id: 'select-buyer-group', label: 'Selecting optimal buyer group', completed: false, inProgress: false },
  { id: 'enrich-contacts', label: 'Enriching contact data', completed: false, inProgress: false },
  { id: 'validate-accuracy', label: 'Validating accuracy', completed: false, inProgress: false },
];

export function TestDriveProcessing({
  formData,
  workspaceId,
  onComplete,
  onError,
}: TestDriveProcessingProps) {
  const [stages, setStages] = useState<ProcessingStage[]>(PROCESSING_STAGES);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  useEffect(() => {
    const processBuyerGroup = async () => {
      try {
        // Determine company identifier from target company
        const companyName = formData.targetCompany.name;
        const companyLinkedInUrl = formData.targetCompany.linkedinUrl;
        const website = formData.targetCompany.website;

        if (!companyName && !companyLinkedInUrl && !website) {
          onError('Target company information is required');
          return;
        }

        // Simulate progress through stages
        const updateStage = (index: number, updates: Partial<ProcessingStage>) => {
          setStages((prev) => {
            const newStages = [...prev];
            if (newStages[index]) {
              newStages[index] = { ...newStages[index], ...updates };
            }
            return newStages;
          });
        };

        // Stage 1: Resolve company
        setCurrentStageIndex(0);
        updateStage(0, { inProgress: true });
        await new Promise((resolve) => setTimeout(resolve, 800));
        updateStage(0, { completed: true, inProgress: false });

        // Stage 2: Determine size
        setCurrentStageIndex(1);
        updateStage(1, { inProgress: true });
        await new Promise((resolve) => setTimeout(resolve, 600));
        updateStage(1, { completed: true, inProgress: false });

        // Stage 3: Discover employees
        setCurrentStageIndex(2);
        updateStage(2, { inProgress: true });
        await new Promise((resolve) => setTimeout(resolve, 1200));
        updateStage(2, { completed: true, inProgress: false });

        // Stage 4: Classify roles
        setCurrentStageIndex(3);
        updateStage(3, { inProgress: true });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        updateStage(3, { completed: true, inProgress: false });

        // Stage 5: Filter relevance
        setCurrentStageIndex(4);
        updateStage(4, { inProgress: true });
        await new Promise((resolve) => setTimeout(resolve, 700));
        updateStage(4, { completed: true, inProgress: false });

        // Stage 6: Select buyer group
        setCurrentStageIndex(5);
        updateStage(5, { inProgress: true });
        await new Promise((resolve) => setTimeout(resolve, 800));
        updateStage(5, { completed: true, inProgress: false });

        // Stage 7: Enrich contacts
        setCurrentStageIndex(6);
        updateStage(6, { inProgress: true });
        
        // Make actual API call during enrichment stage
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
            saveToDatabase: false, // Don't save test drive results
          }),
        });

        if (!response || !response.ok) {
          const errorData = response ? await response.json().catch(() => ({ error: 'Unknown error' })) : { error: 'No response from server' };
          throw new Error(errorData.error || `API error: ${response?.status || 'Unknown'}`);
        }

        const data = await response.json();
        updateStage(6, { completed: true, inProgress: false });

        // Stage 8: Validate accuracy
        setCurrentStageIndex(7);
        updateStage(7, { inProgress: true });
        await new Promise((resolve) => setTimeout(resolve, 500));
        updateStage(7, { completed: true, inProgress: false });

        // Transform API response to our result format
        const result: BuyerGroupResult = {
          success: data.success,
          company: data.company,
          buyerGroup: data.buyerGroup,
          qualityMetrics: data.quality || data.qualityMetrics,
          processingTime: data.processingTime,
        };

        onComplete(result);
      } catch (error) {
        console.error('Buyer group discovery error:', error);
        onError(error instanceof Error ? error.message : 'Failed to discover buyer group');
      }
    };

    processBuyerGroup();
  }, [formData, workspaceId, onComplete, onError]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Processing Buyer Group Intelligence</CardTitle>
        <p className="text-sm text-muted mt-2">
          Analyzing {formData.targetCompany.name || 'target company'}...
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stages.map((stage, index) => (
            <div
              key={stage.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                stage.completed
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : stage.inProgress
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                  : 'bg-muted/50 border border-border'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  stage.completed
                    ? 'bg-green-500 text-white'
                    : stage.inProgress
                    ? 'bg-blue-500 text-white animate-pulse'
                    : 'bg-muted border-2 border-muted-foreground/30'
                }`}
              >
                {stage.completed && <Check className="w-3 h-3" />}
                {stage.inProgress && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                )}
              </div>
              <span
                className={`text-sm font-medium transition-colors ${
                  stage.completed
                    ? 'text-green-700 dark:text-green-300'
                    : stage.inProgress
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-muted-foreground'
                }`}
              >
                {stage.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

