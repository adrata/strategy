/**
 * MonitoringCard Component
 * 
 * Reusable card component for displaying monitoring metrics with status indicators
 */

"use client";

import React from 'react';
import { MonitoringCard as MonitoringCardType } from '../types';

interface MonitoringCardProps {
  card: MonitoringCardType;
  onClick?: () => void;
}

export function MonitoringCard({ card, onClick }: MonitoringCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unhealthy':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-hover text-gray-800 border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '🟢';
      case 'degraded':
        return '🟡';
      case 'unhealthy':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const getTrendIcon = (direction?: string) => {
    switch (direction) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      case 'stable':
        return '→';
      default:
        return '';
    }
  };

  const getTrendColor = (direction?: string) => {
    switch (direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'stable':
        return 'text-muted';
      default:
        return 'text-muted';
    }
  };

  return (
    <div 
      className={`
        p-4 rounded-lg border bg-background transition-all duration-200 hover:shadow-md cursor-pointer
        ${onClick ? 'hover:border-border' : ''}
      `}
      onClick={onClick}
    >
      {/* Header with status indicator */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-foreground mb-1">{card.title}</h3>
          {card.subtitle && (
            <p className="text-xs text-muted">{card.subtitle}</p>
          )}
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(card.status)}`}>
          <span className="text-xs">{getStatusIcon(card.status)}</span>
          <span className="capitalize">{card.status}</span>
        </div>
      </div>

      {/* Main value */}
      <div className="mb-3">
        <div className="text-2xl font-bold text-foreground">
          {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
        </div>
      </div>

      {/* Trend indicator */}
      {card.trend && (
        <div className={`flex items-center text-sm font-medium ${getTrendColor(card.trend.direction)}`}>
          <span className="mr-1">{getTrendIcon(card.trend.direction)}</span>
          {card.trend.value}
        </div>
      )}

      {/* Last updated */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-muted">
          Updated {new Date(card.lastUpdated).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
