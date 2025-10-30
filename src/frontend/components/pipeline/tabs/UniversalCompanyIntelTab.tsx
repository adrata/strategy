"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';
import { InlineEditField } from '../InlineEditField';
import { StrategySkeleton } from '@/frontend/components/strategy/StrategySkeleton';

interface UniversalCompanyIntelTabProps {
  record: any;
  recordType: string;
  onSave?: (field: string, value: string, recordId?: string, recordType?: string) => Promise<void>;
}

interface CompanyStrategyData {
  // Strategy Content
  strategySummary: string;
  situation: string;
  complication: string;
  futureState: string;
  strategicRecommendations: string[];
  competitivePositioning: string;
  successMetrics: string[];
  
  // Company Archetype
  companyArchetype: string;
  archetypeName: string;
  archetypeRole: string;
  
  // Target Industry
  targetIndustry: string;
  targetIndustryCategory: string;
  
  // Metadata
  strategyGeneratedAt: string;
  strategyGeneratedBy: string;
  strategyVersion: string;
}

export function UniversalCompanyIntelTab({ record: recordProp, recordType, onSave }: UniversalCompanyIntelTabProps) {
  const { currentRecord: contextRecord } = useRecordContext();
  const record = recordProp || contextRecord;
  
  // Success message state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };
  
  // Strategy state
  const [strategyData, setStrategyData] = useState<CompanyStrategyData | null>(null);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [strategyError, setStrategyError] = useState<string | null>(null);
  
  // Track generation attempts to prevent duplicate calls
  const generationAttempted = useRef(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Load existing strategy data on component mount
  useEffect(() => {
    if (record?.id) {
      loadStrategyData();
    }
  }, [record?.id]);

  // Smart auto-generation logic
  useEffect(() => {
    if (record?.id && !strategyData && !isGeneratingStrategy && !generationAttempted.current) {
      const hasStrategy = record.customFields?.strategyData;
      if (hasStrategy) {
        console.log('🔄 [COMPANY STRATEGY] Loading existing strategy data for company:', record.id);
        setStrategyData(hasStrategy);
      } else {
        // No cached data, trigger auto-generation
        console.log('🚀 [COMPANY STRATEGY] No cached data found, triggering auto-generation for company:', record.id);
        generationAttempted.current = true;
        handleGenerateStrategy();
      }
    }
  }, [record?.id, strategyData, isGeneratingStrategy]);

  const loadStrategyData = async () => {
    if (!record?.id) return;
    
    try {
      // First check if strategy data exists in the record's customFields (instant load)
      if (record.customFields?.strategyData) {
        console.log('✅ [COMPANY STRATEGY] Using cached strategy data from record');
        setStrategyData(record.customFields.strategyData);
        return;
      }

      // If no cached data, try to load from API (fast check)
      const response = await fetch(`/api/v1/strategy/company/${record.id}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setStrategyData(data.data);
        console.log('✅ [COMPANY STRATEGY] Loaded existing strategy data from API');
      }
      // If no data found, auto-generation will be triggered by the useEffect above
    } catch (error) {
      console.error('Failed to load strategy data:', error);
    }
  };

  const handleGenerateStrategy = async (isRetry = false) => {
    if (isGeneratingStrategy) {
      console.log('⚠️ [COMPANY STRATEGY] Strategy generation already in progress, skipping');
      return;
    }
    
    if (isRetry && retryCount >= maxRetries) {
      console.log('❌ [COMPANY STRATEGY] Maximum retry attempts reached');
      setStrategyError('Maximum retry attempts reached. Please try again later.');
      return;
    }
    
    setIsGeneratingStrategy(true);
    setStrategyError(null);
    
    try {
      console.log('🚀 [COMPANY STRATEGY] Starting strategy generation for company:', record.id, isRetry ? `(retry ${retryCount + 1}/${maxRetries})` : '');
      const response = await fetch(`/api/v1/strategy/company/${record.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceRegenerate: false })
      });
      
      console.log('📤 [COMPANY STRATEGY] API response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      const data = await response.json();
      console.log('📊 [COMPANY STRATEGY] Response data:', {
        success: data.success,
        hasData: !!data.data,
        error: data.error,
        cached: data.cached
      });
      
      if (data.success && data.data) {
        console.log('✅ [COMPANY STRATEGY] Strategy generated successfully');
        setStrategyData(data.data);
        setRetryCount(0); // Reset retry count on success
      } else {
        const errorMessage = data.error || `API returned error: ${response.status} ${response.statusText}`;
        console.error('❌ [COMPANY STRATEGY] Strategy generation failed:', errorMessage);
        setStrategyError(errorMessage);
        
        // Auto-retry for certain types of errors
        if (!isRetry && (response.status >= 500 || response.status === 429)) {
          console.log('🔄 [COMPANY STRATEGY] Auto-retrying due to server error...');
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            handleGenerateStrategy(true);
          }, 2000);
          return;
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      console.error('❌ [COMPANY STRATEGY] Strategy generation error:', {
        error: error,
        message: errorMessage,
        companyId: record.id,
        retryCount: retryCount
      });
      setStrategyError(errorMessage);
      
      // Auto-retry for network errors
      if (!isRetry && retryCount < maxRetries - 1) {
        console.log('🔄 [COMPANY STRATEGY] Auto-retrying due to network error...');
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          handleGenerateStrategy(true);
        }, 2000);
        return;
      }
    } finally {
      setIsGeneratingStrategy(false);
    }
  };


  if (!record) {
    return (
      <div className="p-6">
        <div className="text-center text-[var(--muted)]">No record data available</div>
      </div>
    );
  }

  // Show loading state if we're generating strategy
  if (isGeneratingStrategy) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Intelligence Summary</h3>
          </div>
          <StrategySkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Intelligence Summary Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-[var(--foreground)]">Intelligence Summary</h3>
        </div>
        
        {/* Intelligence Summary Content */}
        {isGeneratingStrategy ? (
          <StrategySkeleton />
        ) : strategyData ? (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🧠</span>
                </div>
                <div className="flex-1">
                  <div className="text-base text-[var(--foreground)] leading-relaxed mb-4">
                    {strategyData.strategySummary}
                  </div>
                  
                  {/* Archetype Badge */}
                  {strategyData.archetypeName && (
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {strategyData.archetypeName}
                      </span>
                      <span className="text-sm text-[var(--muted)]">
                        {strategyData.archetypeRole}
                      </span>
                      {strategyData.targetIndustry && (
                        <span className="text-sm text-[var(--muted)]">
                          • Serving {strategyData.targetIndustry}
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        strategyData.strategyGeneratedBy === 'claude-3-sonnet' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {strategyData.strategyGeneratedBy === 'claude-3-sonnet' ? '🤖 AI-Powered' : '📊 Data-Driven'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Three Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Situation */}
              <div className="bg-white border border-[var(--border)] rounded-lg p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <h4 className="text-sm font-semibold text-[var(--foreground)]">Situation</h4>
                </div>
                <div className="text-sm text-[var(--muted)] leading-relaxed">
                  {strategyData.situation}
                </div>
              </div>
              
              {/* Complication */}
              <div className="bg-white border border-[var(--border)] rounded-lg p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <h4 className="text-sm font-semibold text-[var(--foreground)]">Complication</h4>
                </div>
                <div className="text-sm text-[var(--muted)] leading-relaxed">
                  {strategyData.complication}
                </div>
              </div>
              
              {/* Future State */}
              <div className="bg-white border border-[var(--border)] rounded-lg p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <h4 className="text-sm font-semibold text-[var(--foreground)]">Future State</h4>
                </div>
                <div className="text-sm text-[var(--muted)] leading-relaxed">
                  {strategyData.futureState}
                </div>
              </div>
            </div>
            
            {/* Strategic Recommendations */}
            {strategyData.strategicRecommendations && strategyData.strategicRecommendations.length > 0 && (
              <div className="bg-white border border-[var(--border)] rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <h4 className="text-sm font-semibold text-[var(--foreground)]">Strategic Recommendations</h4>
                </div>
                <ul className="space-y-3">
                  {strategyData.strategicRecommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-[var(--muted)] leading-relaxed flex items-start gap-3">
                      <span className="text-purple-500 mt-1.5 font-bold">•</span>
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Competitive Positioning */}
            {strategyData.competitivePositioning && (
              <div className="bg-white border border-[var(--border)] rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                  <h4 className="text-sm font-semibold text-[var(--foreground)]">Competitive Positioning</h4>
                </div>
                <div className="text-sm text-[var(--muted)] leading-relaxed">
                  {strategyData.competitivePositioning}
                </div>
              </div>
            )}
            
            {/* Success Metrics */}
            {strategyData.successMetrics && strategyData.successMetrics.length > 0 && (
              <div className="bg-white border border-[var(--border)] rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <h4 className="text-sm font-semibold text-[var(--foreground)]">Success Metrics</h4>
                </div>
                <ul className="space-y-3">
                  {strategyData.successMetrics.map((metric, index) => (
                    <li key={index} className="text-sm text-[var(--muted)] leading-relaxed flex items-start gap-3">
                      <span className="text-emerald-500 mt-1.5 font-bold">•</span>
                      <span>{metric}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : strategyError ? (
          <div className="bg-[var(--background)] p-6 rounded-lg border border-[var(--border)] shadow-sm">
            <div className="text-center py-8">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">⚠️</span>
                </div>
              </div>
              <h4 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                Intelligence Generation Failed
              </h4>
              <div className="text-sm text-red-600 mb-4 max-w-md mx-auto">
                {strategyError}
              </div>
              <div className="text-xs text-[var(--muted)] mb-4">
                {strategyError.includes('API key') ? 
                  'Claude AI API key is not configured. Please check your environment variables.' :
                  strategyError.includes('500') || strategyError.includes('Internal server error') ?
                  'Server error occurred. This may be due to API rate limits or temporary service issues.' :
                  strategyError.includes('Network error') ?
                  'Network connection issue. Please check your internet connection.' :
                  'This could be due to API rate limits, network issues, or insufficient company data.'
                }
              </div>
              {retryCount > 0 && (
                <div className="text-xs text-orange-600 mb-4">
                  Retry attempt {retryCount}/{maxRetries}
                </div>
              )}
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => handleGenerateStrategy(false)}
                  disabled={isGeneratingStrategy || retryCount >= maxRetries}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingStrategy ? 'Generating...' : 'Retry Generation'}
                </button>
                <button 
                  onClick={() => {
                    setRetryCount(0);
                    setStrategyError(null);
                    generationAttempted.current = false;
                  }}
                  className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Reset
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[var(--border)] rounded-lg p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🧠</span>
              </div>
              <h4 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                No Intelligence Data
              </h4>
              <p className="text-sm text-[var(--muted)] mb-6">
                Intelligence data will be generated automatically when available.
              </p>
              <button 
                onClick={handleGenerateStrategy}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Generate Intelligence
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}