/**
 * Churn Risk Badge Component
 * 
 * Displays churn prediction with red/orange/green pill/badge
 * Can be used in tables, cards, or anywhere we show person info
 */

import React from 'react';

export interface ChurnPrediction {
  refreshColor?: 'red' | 'orange' | 'green';
  refreshFrequency?: 'daily' | 'weekly' | 'monthly';
  churnRiskScore?: number;
  churnRiskLevel?: 'high' | 'medium' | 'low';
  predictedDepartureMonths?: number | null;
  averageTimeInRoleMonths?: number;
  reasoning?: string;
}

interface ChurnRiskBadgeProps {
  churnPrediction: ChurnPrediction | null;
  variant?: 'compact' | 'detailed' | 'full';
  showTooltip?: boolean;
}

export function ChurnRiskBadge({ 
  churnPrediction, 
  variant = 'compact',
  showTooltip = true 
}: ChurnRiskBadgeProps) {
  if (!churnPrediction || !churnPrediction.refreshColor) {
    return null;
  }

  const color = churnPrediction.refreshColor;
  const score = churnPrediction.churnRiskScore || 0;
  
  // Color schemes using theme-aware colors
  const colors = {
    red: {
      classes: 'bg-error-bg text-error-text border-error-border',
      icon: '🔴',
      label: 'High Risk',
      description: 'Leaving this month'
    },
    orange: {
      classes: 'bg-warning-bg text-warning-text border-warning-border',
      icon: '🟠',
      label: 'Medium Risk',
      description: 'Leaving this quarter'
    },
    green: {
      classes: 'bg-success-bg text-success-text border-success-border',
      icon: '🟢',
      label: 'Low Risk',
      description: 'Stable role'
    }
  };

  const colorScheme = colors[color];

  // Compact variant - small pill for tables/lists
  if (variant === 'compact') {
    return (
      <div 
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border cursor-help ${colorScheme.classes}`}
        title={showTooltip ? `${colorScheme.label}: ${colorScheme.description}. Score: ${score}/100` : undefined}
      >
        <span>{colorScheme.icon}</span>
        <span>{score}</span>
      </div>
    );
  }

  // Detailed variant - medium pill with label
  if (variant === 'detailed') {
    return (
      <div 
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${colorScheme.classes}`}
      >
        <span className="text-base">{colorScheme.icon}</span>
        <span className="font-semibold">{score}</span>
        <span className="text-xs opacity-75">|</span>
        <span className="text-xs">{colorScheme.label}</span>
      </div>
    );
  }

  // Full variant - expanded card for detail views
  return (
    <div 
      className={`p-4 rounded-lg border ${colorScheme.classes}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{colorScheme.icon}</span>
          <div>
            <div className="font-semibold text-sm">
              {colorScheme.label}
            </div>
            <div className="text-xs text-muted">
              {colorScheme.description} - {churnPrediction.refreshFrequency} monitoring
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">
            {score}
          </div>
          <div className="text-xs text-muted">Risk Score</div>
        </div>
      </div>
      
      {(churnPrediction.predictedDepartureMonths !== null && 
        churnPrediction.predictedDepartureMonths !== undefined) && (
        <div className="flex justify-between text-sm">
          <span className="text-muted">Predicted departure:</span>
          <span className="font-medium">
            {churnPrediction.predictedDepartureMonths === 0 
              ? 'May leave anytime'
              : `~${churnPrediction.predictedDepartureMonths} month(s)`}
          </span>
        </div>
      )}
      
      {churnPrediction.averageTimeInRoleMonths && (
        <div className="flex justify-between text-sm mt-1">
          <span className="text-muted">Avg time in role:</span>
          <span>{churnPrediction.averageTimeInRoleMonths} months</span>
        </div>
      )}
      
      {churnPrediction.reasoning && (
        <div className={`mt-3 pt-3 border-t ${color === 'red' ? 'border-error-border' : color === 'orange' ? 'border-warning-border' : 'border-success-border'}`}>
          <p className="text-xs text-muted italic">{churnPrediction.reasoning}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Churn Risk Pill - Ultra compact for tables
 */
export function ChurnRiskPill({ churnPrediction }: { churnPrediction: ChurnPrediction | null }) {
  if (!churnPrediction || !churnPrediction.refreshColor) {
    return null;
  }

  const color = churnPrediction.refreshColor;
  const score = churnPrediction.churnRiskScore || 0;
  
  const colorClasses = {
    red: 'bg-error-bg text-error-text border-error-border',
    orange: 'bg-warning-bg text-warning-text border-warning-border',
    green: 'bg-success-bg text-success-text border-success-border'
  };

  const classes = colorClasses[color] || 'bg-hover/50 text-foreground border-border';

  return (
    <span 
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${classes}`}
      title={`Churn risk: ${score}/100`}
    >
      {color === 'red' ? '🔴' : color === 'orange' ? '🟠' : '🟢'}
      {score}
    </span>
  );
}

