"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/platform/shared/components/ui/card';
import { Loader2, Check, Search, Database, Filter, Brain, BarChart3 } from 'lucide-react';
import type { IndustryRankingFormData, IndustryRankingResult, IndustryRankingProgress } from '../types';

interface ProcessingStage {
  id: string;
  label: string;
  icon: React.ReactNode;
  completed: boolean;
  inProgress: boolean;
  detail?: string;
}

interface IndustryRankingProcessingProps {
  formData: IndustryRankingFormData;
  workspaceId: string;
  onComplete: (result: IndustryRankingResult) => void;
  onError: (error: string) => void;
}

export function IndustryRankingProcessing({
  formData,
  workspaceId,
  onComplete,
  onError,
}: IndustryRankingProcessingProps) {
  const [stages, setStages] = useState<ProcessingStage[]>([
    { id: 'discovery', label: 'Discovering companies', icon: <Search className="w-4 h-4" />, completed: false, inProgress: true },
    { id: 'collection', label: 'Collecting profiles', icon: <Database className="w-4 h-4" />, completed: false, inProgress: false },
    { id: 'pre_screening', label: 'Pre-screening for tension signals', icon: <Filter className="w-4 h-4" />, completed: false, inProgress: false },
    { id: 'deep_analysis', label: 'Running deep OBP analysis', icon: <Brain className="w-4 h-4" />, completed: false, inProgress: false },
    { id: 'ranking', label: 'Compiling PULL rankings', icon: <BarChart3 className="w-4 h-4" />, completed: false, inProgress: false },
  ]);

  const [progress, setProgress] = useState<IndustryRankingProgress>({
    stage: 'discovery',
    totalCompanies: 0,
    scanned: 0,
    preScreened: 0,
    deepAnalyzed: 0,
    currentCompany: null,
  });

  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer for elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Run the scan
  useEffect(() => {
    let isCancelled = false;

    const runScan = async () => {
      try {
        const response = await fetch(`/api/v1/intelligence/pull/industry`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workspaceId,
            yourCompany: formData.yourCompany,
            industry: formData.industry,
            employeeRange: formData.employeeRange,
            location: formData.location,
            maxCompanies: formData.maxCompanies,
            deepAnalysisCount: formData.deepAnalysisCount,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Scan failed: ${response.status}`);
        }

        // Check if streaming response
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('text/event-stream')) {
          // Handle streaming response
          const reader = response.body?.getReader();
          if (!reader) throw new Error('No response body');

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.type === 'progress') {
                    setProgress(data.progress);
                    updateStages(data.progress.stage, data.progress);
                  } else if (data.type === 'complete') {
                    if (!isCancelled) {
                      onComplete(data.result);
                    }
                    return;
                  } else if (data.type === 'error') {
                    throw new Error(data.error);
                  }
                } catch {
                  // Skip invalid JSON lines
                }
              }
            }
          }
        } else {
          // Handle regular JSON response
          const result = await response.json();

          if (isCancelled) return;

          // Simulate stage completion for non-streaming response
          setStages((prev) =>
            prev.map((s) => ({ ...s, completed: true, inProgress: false }))
          );

          await new Promise((resolve) => setTimeout(resolve, 500));

          if (isCancelled) return;
          onComplete(result);
        }

      } catch (error) {
        if (isCancelled) return;
        console.error('Industry scan error:', error);
        onError(error instanceof Error ? error.message : 'Scan failed. Please try again.');
      }
    };

    // Start with simulated progress updates
    const simulateProgress = async () => {
      // Stage 1: Discovery
      await new Promise((resolve) => setTimeout(resolve, 2000));
      if (isCancelled) return;

      setStages((prev) =>
        prev.map((s) =>
          s.id === 'discovery' ? { ...s, completed: true, inProgress: false } :
          s.id === 'collection' ? { ...s, inProgress: true } : s
        )
      );
      setProgress(p => ({ ...p, stage: 'collection' }));

      // Stage 2: Collection
      for (let i = 1; i <= formData.maxCompanies; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (isCancelled) return;
        setProgress(p => ({ ...p, scanned: Math.min(i, formData.maxCompanies), totalCompanies: formData.maxCompanies }));
      }

      setStages((prev) =>
        prev.map((s) =>
          s.id === 'collection' ? { ...s, completed: true, inProgress: false } :
          s.id === 'pre_screening' ? { ...s, inProgress: true } : s
        )
      );
      setProgress(p => ({ ...p, stage: 'pre_screening' }));

      // Stage 3: Pre-screening
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (isCancelled) return;

      setStages((prev) =>
        prev.map((s) =>
          s.id === 'pre_screening' ? { ...s, completed: true, inProgress: false } :
          s.id === 'deep_analysis' ? { ...s, inProgress: true } : s
        )
      );
      setProgress(p => ({ ...p, stage: 'deep_analysis', preScreened: formData.maxCompanies }));

      // Stage 4: Deep analysis
      for (let i = 1; i <= formData.deepAnalysisCount; i++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        if (isCancelled) return;
        setProgress(p => ({ ...p, deepAnalyzed: i, currentCompany: `Company ${i}` }));
      }

      setStages((prev) =>
        prev.map((s) =>
          s.id === 'deep_analysis' ? { ...s, completed: true, inProgress: false } :
          s.id === 'ranking' ? { ...s, inProgress: true } : s
        )
      );
    };

    // Run simulation and API call in parallel
    simulateProgress();
    runScan();

    return () => {
      isCancelled = true;
    };
  }, [formData, workspaceId, onComplete, onError]);

  const updateStages = (currentStage: string, progress: IndustryRankingProgress) => {
    const stageOrder = ['discovery', 'collection', 'pre_screening', 'deep_analysis', 'ranking', 'complete'];
    const currentIndex = stageOrder.indexOf(currentStage);

    setStages((prev) =>
      prev.map((s, i) => {
        const stageIndex = stageOrder.indexOf(s.id);
        if (stageIndex < currentIndex) {
          return { ...s, completed: true, inProgress: false };
        } else if (stageIndex === currentIndex) {
          let detail = '';
          if (s.id === 'collection') detail = `${progress.scanned}/${progress.totalCompanies}`;
          if (s.id === 'deep_analysis') detail = `${progress.deepAnalyzed}/${formData.deepAnalysisCount}`;
          return { ...s, completed: false, inProgress: true, detail };
        }
        return { ...s, completed: false, inProgress: false };
      })
    );
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <Card className="overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 animate-pulse" />
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Scanning {formData.industry}
          </h2>
          <p className="text-muted">
            Finding companies with the highest PULL signals...
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
                  ? 'bg-emerald-500/10 border border-emerald-500/20'
                  : stage.inProgress
                  ? 'bg-teal-500/10 border border-teal-500/20'
                  : 'bg-muted/30 border border-transparent'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  stage.completed
                    ? 'bg-emerald-500/20 text-emerald-500'
                    : stage.inProgress
                    ? 'bg-teal-500/20 text-teal-400'
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
                      ? 'text-emerald-500'
                      : stage.inProgress
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {stage.label}
                </p>
                {stage.detail && stage.inProgress && (
                  <p className="text-sm text-teal-400">{stage.detail}</p>
                )}
              </div>
              {stage.completed && (
                <span className="text-xs text-emerald-500 font-medium">Done</span>
              )}
            </div>
          ))}
        </div>

        {/* Live Progress */}
        {progress.currentCompany && progress.stage === 'deep_analysis' && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted">
              Currently analyzing: <span className="text-foreground font-medium">{progress.currentCompany}</span>
            </p>
          </div>
        )}

        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full">
            <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
            <span className="text-sm text-muted">
              Scanning {formData.maxCompanies} companies, deep analysis on top {formData.deepAnalysisCount}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
