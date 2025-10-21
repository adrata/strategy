"use client";

import React from 'react';

interface SalesIntentGaugeProps {
  score: number;
  level: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SalesIntentGauge({ score, level, size = 'md' }: SalesIntentGaugeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm': return 'w-16 h-16';
      case 'lg': return 'w-24 h-24';
      default: return 'w-20 h-20';
    }
  };

  const circumference = 2 * Math.PI * 40; // radius of 40
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center gap-4">
      {/* Circular Progress */}
      <div className={`relative ${getSizeClasses(size)}`}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={`transition-all duration-300 ${getScoreColor(score)}`}
            strokeLinecap="round"
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${getScoreColor(score)}`}>
            {score}
          </span>
        </div>
      </div>

      {/* Level indicator */}
      <div className="flex flex-col gap-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getLevelColor(level)}`}>
          {level.toUpperCase()}
        </span>
        <span className="text-xs text-gray-600">Sales Intent</span>
      </div>
    </div>
  );
}
