"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/platform/shared/components/ui/card';
import { Button } from '@/platform/shared/components/ui/button';
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  LightBulbIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export interface ReasoningData {
  contextAwareness?: {
    recordType?: string;
    recordName?: string;
    companyName?: string;
    workspaceContext?: string;
    dataPoints?: number;
  };
  dataSources?: Array<{
    type: 'record' | 'intelligence' | 'workspace' | 'history';
    name: string;
    description: string;
  }>;
  thinkingSteps?: Array<{
    step: number;
    description: string;
    confidence?: number;
  }>;
  confidence?: number;
  processingTime?: number;
  model?: string;
}

interface ReasoningWindowProps {
  reasoning?: ReasoningData;
  isVisible?: boolean;
  onToggle?: () => void;
}

export function ReasoningWindow({ reasoning, isVisible = false, onToggle }: ReasoningWindowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!reasoning) {
    return null;
  }

  const hasContent = 
    reasoning.contextAwareness || 
    (reasoning.dataSources && reasoning.dataSources.length > 0) ||
    (reasoning.thinkingSteps && reasoning.thinkingSteps.length > 0);

  if (!hasContent) {
    return null;
  }

  return (
    <Card className="mt-3 border-border/50 bg-muted/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LightBulbIcon className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">AI Reasoning</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {reasoning.confidence !== undefined && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircleIcon className="h-3 w-3 text-green-500" />
                <span>{Math.round(reasoning.confidence * 100)}% confidence</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Context Awareness */}
          {reasoning.contextAwareness && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <DocumentTextIcon className="h-3.5 w-3.5" />
                <span>Context Awareness</span>
              </div>
              <div className="pl-5 space-y-1 text-sm">
                {reasoning.contextAwareness.recordType && reasoning.contextAwareness.recordName && (
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground">Analyzing:</span>
                    <span className="font-medium">
                      {reasoning.contextAwareness.recordName}
                      {reasoning.contextAwareness.companyName && (
                        <span className="text-muted-foreground"> at {reasoning.contextAwareness.companyName}</span>
                      )}
                    </span>
                  </div>
                )}
                {reasoning.contextAwareness.workspaceContext && (
                  <div className="text-muted-foreground text-xs">
                    {reasoning.contextAwareness.workspaceContext}
                  </div>
                )}
                {reasoning.contextAwareness.dataPoints !== undefined && (
                  <div className="text-xs text-muted-foreground">
                    Considering {reasoning.contextAwareness.dataPoints} data points
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Data Sources */}
          {reasoning.dataSources && reasoning.dataSources.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <ChartBarIcon className="h-3.5 w-3.5" />
                <span>Data Sources</span>
              </div>
              <div className="pl-5 space-y-1.5">
                {reasoning.dataSources.map((source, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
                    <div>
                      <span className="font-medium">{source.name}</span>
                      <span className="text-muted-foreground text-xs ml-2">
                        {source.type === 'record' && '📄 Record'}
                        {source.type === 'intelligence' && '🧠 Intelligence'}
                        {source.type === 'workspace' && '🏢 Workspace'}
                        {source.type === 'history' && '💬 History'}
                      </span>
                      {source.description && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {source.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Thinking Steps */}
          {reasoning.thinkingSteps && reasoning.thinkingSteps.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <LightBulbIcon className="h-3.5 w-3.5" />
                <span>Thinking Process</span>
              </div>
              <div className="pl-5 space-y-2">
                {reasoning.thinkingSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 text-sm">
                    <div className="flex-shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <div className="text-foreground">{step.description}</div>
                      {step.confidence !== undefined && (
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-muted">
                            <div
                              className="h-1.5 rounded-full bg-primary"
                              style={{ width: `${step.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(step.confidence * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          {(reasoning.processingTime || reasoning.model) && (
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                {reasoning.model && (
                  <span>Model: {reasoning.model}</span>
                )}
                {reasoning.processingTime && (
                  <span>Processed in {(reasoning.processingTime / 1000).toFixed(1)}s</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

