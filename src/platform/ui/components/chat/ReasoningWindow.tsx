"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/platform/shared/components/ui/card';
import { Button } from '@/platform/shared/components/ui/button';
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  LightBulbIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CheckCircleIcon,
  BoltIcon,
  SparklesIcon
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
  const [animatedSteps, setAnimatedSteps] = useState<number[]>([]);
  const [animatedSources, setAnimatedSources] = useState<number[]>([]);
  const [isAnimating, setIsAnimating] = useState(true);

  // Animate thinking steps appearing one by one (magical effect)
  useEffect(() => {
    if (!isExpanded || !reasoning?.thinkingSteps) return;
    
    setIsAnimating(true);
    setAnimatedSteps([]);
    
    reasoning.thinkingSteps.forEach((_, index) => {
      setTimeout(() => {
        setAnimatedSteps(prev => [...prev, index]);
        if (index === reasoning.thinkingSteps!.length - 1) {
          setTimeout(() => setIsAnimating(false), 300);
        }
      }, index * 400); // Stagger appearance
    });
  }, [isExpanded, reasoning?.thinkingSteps]);

  // Animate data sources appearing
  useEffect(() => {
    if (!isExpanded || !reasoning?.dataSources) return;
    
    reasoning.dataSources.forEach((_, index) => {
      setTimeout(() => {
        setAnimatedSources(prev => [...prev, index]);
      }, index * 200);
    });
  }, [isExpanded, reasoning?.dataSources]);

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
    <Card className="mt-3 border border-border/50 bg-background animate-in fade-in slide-in-from-bottom-2 duration-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BoltIcon className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium text-foreground">
              AI Thinking Process
            </CardTitle>
            {isAnimating && (
              <span className="text-xs text-muted-foreground">Analyzing...</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {reasoning.processingTime && reasoning.processingTime < 3000 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                <span>{(reasoning.processingTime / 1000).toFixed(1)}s</span>
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

          {/* Data Sources - Animated */}
          {reasoning.dataSources && reasoning.dataSources.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <ChartBarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Data Sources</span>
              </div>
              <div className="pl-5 space-y-1.5">
                {reasoning.dataSources.map((source, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 text-sm transition-all duration-500 ${
                      animatedSources.includes(index)
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 -translate-x-4'
                    }`}
                  >
                    <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{source.name}</span>
                        {animatedSources.includes(index) && (
                          <CheckCircleIcon className="h-3 w-3 text-green-500 animate-in zoom-in duration-300" />
                        )}
                      </div>
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

          {/* Thinking Steps - Animated with magic effect */}
          {reasoning.thinkingSteps && reasoning.thinkingSteps.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <LightBulbIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Thinking Process</span>
              </div>
              <div className="pl-5 space-y-3">
                {reasoning.thinkingSteps.map((step, index) => {
                  const isVisible = animatedSteps.includes(index);
                  const isActive = isAnimating && index === animatedSteps.length;
                  
                  return (
                    <div
                      key={index}
                      className={`flex items-start gap-3 text-sm transition-all duration-500 ${
                        isVisible
                          ? 'opacity-100 translate-y-0'
                          : 'opacity-0 translate-y-4'
                      } ${isActive ? 'scale-105' : ''}`}
                    >
                      <div className={`flex-shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-all duration-300 ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : isVisible
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <div className="text-foreground">
                          {step.description}
                        </div>
                        {step.confidence !== undefined && isVisible && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-1.5 rounded-full bg-primary transition-all duration-1000 ease-out"
                                style={{ 
                                  width: isVisible ? `${step.confidence * 100}%` : '0%'
                                }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(step.confidence * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Metadata */}
          {(reasoning.processingTime || reasoning.model || reasoning.contextAwareness?.dataPoints) && (
            <div className="pt-3 border-t border-border/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  {reasoning.model && (
                    <span>{reasoning.model}</span>
                  )}
                  {reasoning.contextAwareness?.dataPoints && (
                    <span>
                      {reasoning.contextAwareness.dataPoints} data points
                    </span>
                  )}
                </div>
                {reasoning.processingTime && (
                  <span>{(reasoning.processingTime / 1000).toFixed(1)}s</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

