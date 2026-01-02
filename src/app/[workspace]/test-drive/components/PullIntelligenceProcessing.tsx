"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/platform/shared/components/ui/card';
import { Loader2, Check, Building2, Users, TrendingUp, Brain, MessageSquare } from 'lucide-react';
import type { PullIntelligenceFormData, PullIntelligenceResult } from '../types';

interface ProcessingStage {
  id: string;
  label: string;
  icon: React.ReactNode;
  completed: boolean;
  inProgress: boolean;
}

interface PullIntelligenceProcessingProps {
  formData: PullIntelligenceFormData;
  workspaceId: string;
  onComplete: (result: PullIntelligenceResult) => void;
  onError: (error: string) => void;
}

export function PullIntelligenceProcessing({
  formData,
  workspaceId,
  onComplete,
  onError,
}: PullIntelligenceProcessingProps) {
  const [stages, setStages] = useState<ProcessingStage[]>([
    { id: 'company', label: 'Fetching company data', icon: <Building2 className="w-4 h-4" />, completed: false, inProgress: true },
    { id: 'org', label: 'Analyzing org structure', icon: <Users className="w-4 h-4" />, completed: false, inProgress: false },
    { id: 'tensions', label: 'Calculating organizational tensions', icon: <TrendingUp className="w-4 h-4" />, completed: false, inProgress: false },
    { id: 'behavior', label: 'Modeling behavioral physics', icon: <Brain className="w-4 h-4" />, completed: false, inProgress: false },
    { id: 'dialogue', label: 'Simulating internal dialogue', icon: <MessageSquare className="w-4 h-4" />, completed: false, inProgress: false },
  ]);

  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer for elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Run the analysis
  useEffect(() => {
    let isCancelled = false;

    const runAnalysis = async () => {
      try {
        // Stage 1: Fetching company data (simulate progress)
        await new Promise((resolve) => setTimeout(resolve, 1500));
        if (isCancelled) return;

        setStages((prev) =>
          prev.map((s) =>
            s.id === 'company' ? { ...s, completed: true, inProgress: false } :
            s.id === 'org' ? { ...s, inProgress: true } : s
          )
        );

        // Stage 2: Analyzing org structure
        await new Promise((resolve) => setTimeout(resolve, 2000));
        if (isCancelled) return;

        setStages((prev) =>
          prev.map((s) =>
            s.id === 'org' ? { ...s, completed: true, inProgress: false } :
            s.id === 'tensions' ? { ...s, inProgress: true } : s
          )
        );

        // Stage 3: Calculating tensions
        await new Promise((resolve) => setTimeout(resolve, 1500));
        if (isCancelled) return;

        setStages((prev) =>
          prev.map((s) =>
            s.id === 'tensions' ? { ...s, completed: true, inProgress: false } :
            s.id === 'behavior' ? { ...s, inProgress: true } : s
          )
        );

        // Stage 4: Modeling behavior
        await new Promise((resolve) => setTimeout(resolve, 1500));
        if (isCancelled) return;

        setStages((prev) =>
          prev.map((s) =>
            s.id === 'behavior' ? { ...s, completed: true, inProgress: false } :
            s.id === 'dialogue' ? { ...s, inProgress: true } : s
          )
        );

        // Make actual API call to OBP endpoint
        const response = await fetch(`/api/v1/intelligence/pull/obp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workspaceId,
            yourCompany: formData.yourCompany,
            targetCompany: formData.targetCompany,
            productContext: formData.productContext,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Analysis failed: ${response.status}`);
        }

        const result = await response.json();

        if (isCancelled) return;

        // Stage 5: Complete
        setStages((prev) =>
          prev.map((s) => ({ ...s, completed: true, inProgress: false }))
        );

        // Small delay before showing results
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (isCancelled) return;
        onComplete(result);

      } catch (error) {
        if (isCancelled) return;
        console.error('PULL Intelligence error:', error);
        onError(error instanceof Error ? error.message : 'Analysis failed. Please try again.');
      }
    };

    runAnalysis();

    return () => {
      isCancelled = true;
    };
  }, [formData, workspaceId, onComplete, onError]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <Card className="overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse" />
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Analyzing {formData.targetCompany.name || 'Target Company'}
          </h2>
          <p className="text-muted">
            Running Organizational Behavioral Physics analysis...
          </p>
          <p className="text-sm text-muted mt-2">
            Elapsed: {formatTime(elapsedTime)}
          </p>
        </div>

        <div className="max-w-md mx-auto space-y-4">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                stage.completed
                  ? 'bg-green-500/10 border border-green-500/20'
                  : stage.inProgress
                  ? 'bg-indigo-500/10 border border-indigo-500/20'
                  : 'bg-muted/30 border border-transparent'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  stage.completed
                    ? 'bg-green-500/20 text-green-500'
                    : stage.inProgress
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {stage.completed ? (
                  <Check className="w-5 h-5" />
                ) : stage.inProgress ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  stage.icon
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`font-medium ${
                    stage.completed
                      ? 'text-green-500'
                      : stage.inProgress
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {stage.label}
                </p>
              </div>
              {stage.completed && (
                <span className="text-xs text-green-500 font-medium">Done</span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            <span className="text-sm text-muted">
              This may take 30-60 seconds for comprehensive analysis
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
