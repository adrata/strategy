"use client";

import React, { useState, useEffect } from 'react';

export interface ThinkingStep {
  step: number;
  description: string;
  timestamp: number;
  confidence?: number;
}

interface ThinkingWidgetProps {
  thinkingSteps: ThinkingStep[];
}

export function ThinkingWidget({ thinkingSteps }: ThinkingWidgetProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);

  // Cycle through thinking steps smoothly (every 2 seconds - slower, more elegant)
  useEffect(() => {
    if (thinkingSteps.length === 0 || thinkingSteps.length === 1) return;

    const cycleInterval = setInterval(() => {
      // Smooth fade out
      setOpacity(0);
      
      // After fade completes, change step and fade in
      setTimeout(() => {
        setCurrentStepIndex((prev) => {
          const next = (prev + 1) % thinkingSteps.length;
          return next;
        });
        // Fade in smoothly
        setTimeout(() => setOpacity(1), 10);
      }, 300); // Wait for fade out to complete
    }, 2000); // Cycle every 2 seconds (slower, more elegant)

    return () => clearInterval(cycleInterval);
  }, [thinkingSteps.length]);

  if (!thinkingSteps || thinkingSteps.length === 0) {
    return null;
  }

  const currentStep = thinkingSteps[currentStepIndex];

  // Ultra-minimal: Just text + tiny dot, no box, no border, no background
  return (
    <div 
      className="flex items-center gap-2 text-sm text-muted-foreground"
      style={{ 
        opacity,
        transition: 'opacity 0.4s ease-in-out' // Smooth fade transitions
      }}
    >
      {/* Tiny, subtle pulsing dot */}
      <div className="flex-shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-pulse" />
      </div>
      
      {/* Current thinking step description */}
      <div className="flex-1">
        {currentStep.description}
      </div>
    </div>
  );
}
