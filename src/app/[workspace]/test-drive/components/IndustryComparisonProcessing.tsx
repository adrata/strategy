"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/platform/shared/components/ui/card';
import { Button } from '@/platform/shared/components/ui/button';
import { BarChart3, Building2, CheckCircle2, Loader2, AlertCircle, XCircle } from 'lucide-react';
import type { IndustryComparisonFormData, IndustryComparisonResult } from '../types';

interface IndustryComparisonProcessingProps {
  formData: IndustryComparisonFormData;
  workspaceId: string;
  onComplete: (result: IndustryComparisonResult) => void;
  onError: (error: string) => void;
}

interface IndustryProgress {
  industry: string;
  status: 'pending' | 'scanning' | 'analyzing' | 'complete' | 'error';
  companiesScanned: number;
  companiesWithPull: number;
  error?: string;
}

const TIER_LABELS = {
  pulse: 'Quick Pulse',
  scan: 'Industry Scan',
  deep: 'Deep Market Study'
};

export function IndustryComparisonProcessing({
  formData,
  workspaceId,
  onComplete,
  onError
}: IndustryComparisonProcessingProps) {
  const [currentStage, setCurrentStage] = useState<'initializing' | 'scanning' | 'analyzing' | 'ranking' | 'complete'>('initializing');
  const [industryProgress, setIndustryProgress] = useState<IndustryProgress[]>(
    formData.industries.map(industry => ({
      industry,
      status: 'pending',
      companiesScanned: 0,
      companiesWithPull: 0
    }))
  );
  const [currentIndustryIndex, setCurrentIndustryIndex] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  useEffect(() => {
    runComparison();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const runComparison = async () => {
    abortControllerRef.current = new AbortController();

    try {
      setCurrentStage('scanning');

      const response = await fetch('/api/v1/intelligence/pull/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          yourCompany: formData.yourCompany,
          industries: formData.industries,
          tier: formData.tier,
          employeeRange: formData.employeeRange,
          location: formData.location,
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to compare industries');
      }

      // Check if streaming response
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('text/event-stream')) {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response body');
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                handleProgressUpdate(data);
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      } else {
        // Handle non-streaming response
        const result = await response.json();

        if (result.success) {
          // Simulate progress for non-streaming
          for (let i = 0; i < formData.industries.length; i++) {
            setCurrentIndustryIndex(i);
            setIndustryProgress(prev => prev.map((p, idx) =>
              idx === i ? { ...p, status: 'complete', companiesScanned: 50 } : p
            ));
            setOverallProgress(((i + 1) / formData.industries.length) * 100);
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          setCurrentStage('complete');
          onComplete(result);
        } else {
          throw new Error(result.error || 'Comparison failed');
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Industry comparison error:', error);
      onError(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  const handleProgressUpdate = (data: {
    type: string;
    industry?: string;
    industryIndex?: number;
    progress?: number;
    companiesScanned?: number;
    companiesWithPull?: number;
    result?: IndustryComparisonResult;
    error?: string;
  }) => {
    switch (data.type) {
      case 'industry_start':
        if (typeof data.industryIndex === 'number') {
          setCurrentIndustryIndex(data.industryIndex);
          setIndustryProgress(prev => prev.map((p, idx) =>
            idx === data.industryIndex ? { ...p, status: 'scanning' } : p
          ));
        }
        break;

      case 'industry_progress':
        if (typeof data.industryIndex === 'number') {
          setIndustryProgress(prev => prev.map((p, idx) =>
            idx === data.industryIndex ? {
              ...p,
              status: 'analyzing',
              companiesScanned: data.companiesScanned || p.companiesScanned,
              companiesWithPull: data.companiesWithPull || p.companiesWithPull
            } : p
          ));
        }
        break;

      case 'industry_complete':
        if (typeof data.industryIndex === 'number') {
          setIndustryProgress(prev => prev.map((p, idx) =>
            idx === data.industryIndex ? {
              ...p,
              status: 'complete',
              companiesScanned: data.companiesScanned || p.companiesScanned,
              companiesWithPull: data.companiesWithPull || p.companiesWithPull
            } : p
          ));
          setOverallProgress(((data.industryIndex + 1) / formData.industries.length) * 100);
        }
        break;

      case 'industry_error':
        if (typeof data.industryIndex === 'number') {
          setIndustryProgress(prev => prev.map((p, idx) =>
            idx === data.industryIndex ? { ...p, status: 'error', error: data.error } : p
          ));
        }
        break;

      case 'ranking':
        setCurrentStage('ranking');
        break;

      case 'complete':
        setCurrentStage('complete');
        if (data.result) {
          onComplete(data.result);
        }
        break;

      case 'error':
        onError(data.error || 'Comparison failed');
        break;
    }
  };

  const getStatusIcon = (status: IndustryProgress['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-5 h-5 rounded-full border-2 border-muted" />;
      case 'scanning':
      case 'analyzing':
        return <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />;
      case 'complete':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-destructive" />;
    }
  };

  const getStatusText = (progress: IndustryProgress) => {
    switch (progress.status) {
      case 'pending':
        return 'Waiting...';
      case 'scanning':
        return 'Discovering companies...';
      case 'analyzing':
        return `Analyzing ${progress.companiesScanned} companies...`;
      case 'complete':
        return `${progress.companiesScanned} scanned, ${progress.companiesWithPull} with PULL`;
      case 'error':
        return progress.error || 'Failed';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 mb-4">
          <BarChart3 className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Comparing Industries
        </h2>
        <p className="text-muted">
          {TIER_LABELS[formData.tier]} • {formData.industries.length} industries
        </p>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Overall Progress</span>
              <span className="text-foreground font-medium">{Math.round(overallProgress)}%</span>
            </div>
            <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted">
              <span>Elapsed: {formatTime(elapsedTime)}</span>
              <span>
                {currentStage === 'scanning' && 'Scanning industries...'}
                {currentStage === 'analyzing' && 'Running PULL analysis...'}
                {currentStage === 'ranking' && 'Calculating rankings...'}
                {currentStage === 'complete' && 'Complete!'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Industry Progress List */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {industryProgress.map((progress, index) => (
              <div
                key={progress.industry}
                className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                  index === currentIndustryIndex && progress.status !== 'complete' && progress.status !== 'error'
                    ? 'bg-amber-500/10 border border-amber-500/20'
                    : 'bg-muted/20'
                }`}
              >
                {getStatusIcon(progress.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted" />
                    <span className="font-medium text-foreground">{progress.industry}</span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    {getStatusText(progress)}
                  </p>
                </div>
                {progress.status === 'complete' && progress.companiesWithPull > 0 && (
                  <div className="text-right">
                    <span className="text-sm font-medium text-amber-400">
                      {Math.round((progress.companiesWithPull / progress.companiesScanned) * 100)}%
                    </span>
                    <p className="text-xs text-muted">PULL rate</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Banner */}
      <div className="bg-muted/20 rounded-lg p-4 border border-border">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-muted mt-0.5" />
          <div className="text-sm text-muted">
            <p className="mb-2">
              We're scanning each industry to find companies with organizational tension signals.
              This includes analyzing growth rates, leadership changes, and staffing ratios.
            </p>
            <p>
              The {TIER_LABELS[formData.tier].toLowerCase()} tier analyzes{' '}
              {formData.tier === 'pulse' ? '10' : formData.tier === 'scan' ? '50' : '100'} companies
              per industry to calculate PULL concentration scores.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
