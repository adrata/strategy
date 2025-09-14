"use client";

import React, { useState, useEffect } from 'react';
import { Check, Clock, AlertCircle, Database, Mail, Phone, User, Building } from 'lucide-react';

interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  icon: React.ReactNode;
  details?: string;
}

interface EnrichmentProgressTrackerProps {
  totalRecords: number;
  currentRecord: number;
  currentStep: string;
  steps: ProgressStep[];
  isComplete: boolean;
  onComplete?: () => void;
}

export function EnrichmentProgressTracker({
  totalRecords,
  currentRecord,
  currentStep,
  steps,
  isComplete,
  onComplete
}: EnrichmentProgressTrackerProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  const progress = totalRecords > 0 ? (currentRecord / totalRecords) * 100 : 0;
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);
  
  useEffect(() => {
    if (isComplete && onComplete) {
      const timer = setTimeout(onComplete, 1500);
      return () => clearTimeout(timer);
    }
  }, [isComplete, onComplete]);
  
  const getStatusIcon = (status: ProgressStep['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };
  
  const getStatusColor = (status: ProgressStep['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'in_progress':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'failed':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            Data Enrichment in Progress
          </h3>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {currentRecord}/{totalRecords} records
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
          <span>Progress</span>
          <span>{Math.round(animatedProgress)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${animatedProgress}%` }}
          />
        </div>
      </div>
      
      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center space-x-3 p-2 rounded-md border transition-all duration-200 ${getStatusColor(step.status)}`}
          >
            <div className="flex-shrink-0">
              {getStatusIcon(step.status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{step.label}</span>
                {step['status'] === 'in_progress' && (
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
              {step['details'] && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {step.details}
                </p>
              )}
            </div>
            <div className="flex-shrink-0">
              {step.icon}
            </div>
          </div>
        ))}
      </div>
      
      {/* Completion Message */}
      {isComplete && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <div className="flex items-center space-x-2">
            <Check className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              Enrichment completed successfully!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Default steps for CFO enrichment
export const createCFOEnrichmentSteps = (): ProgressStep[] => [
  {
    id: 'analyze',
    label: 'Analyzing company data',
    status: 'pending',
    icon: <Building className="h-4 w-4" />,
    details: 'Identifying companies and required roles'
  },
  {
    id: 'search',
    label: 'Searching executive database',
    status: 'pending',
    icon: <Database className="h-4 w-4" />,
    details: 'Finding CFO profiles in company database'
  },
  {
    id: 'verify_email',
    label: 'Verifying contact information',
    status: 'pending',
    icon: <Mail className="h-4 w-4" />,
    details: 'Validating email addresses and contact data'
  },
  {
    id: 'enrich_phone',
    label: 'Finding additional contact details',
    status: 'pending',
    icon: <Phone className="h-4 w-4" />,
    details: 'Searching for phone numbers and social profiles'
  },
  {
    id: 'validate',
    label: 'Quality assurance check',
    status: 'pending',
    icon: <User className="h-4 w-4" />,
    details: 'Ensuring data accuracy and completeness'
  }
];
