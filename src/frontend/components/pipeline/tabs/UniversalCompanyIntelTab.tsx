"use client";

import React, { useState, useEffect } from 'react';
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

  // Load existing strategy data on component mount
  useEffect(() => {
    if (record?.id) {
      loadStrategyData();
    }
  }, [record?.id]);

  // Auto-generate strategy if no data exists
  useEffect(() => {
    if (record?.id && !strategyData && !isGeneratingStrategy) {
      const hasStrategy = record.customFields?.strategyData;
      if (!hasStrategy) {
        handleGenerateStrategy();
      }
    }
  }, [record?.id, strategyData, isGeneratingStrategy]);

  const loadStrategyData = async () => {
    if (!record?.id) return;
    
    try {
      // First check if strategy data exists in the record's customFields
      if (record.customFields?.strategyData) {
        console.log('✅ [COMPANY STRATEGY] Using cached strategy data from record');
        setStrategyData(record.customFields.strategyData);
        return;
      }

      // If no cached data, try to load from API
      const response = await fetch(`/api/v1/strategy/company/${record.id}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setStrategyData(data.data);
        console.log('✅ [COMPANY STRATEGY] Loaded existing strategy data from API');
      }
    } catch (error) {
      console.error('Failed to load strategy data:', error);
    }
  };

  const handleGenerateStrategy = async () => {
    setIsGeneratingStrategy(true);
    setStrategyError(null);
    
    try {
      const response = await fetch(`/api/v1/strategy/company/${record.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceRegenerate: false })
      });
      
      const data = await response.json();
      if (data.success && data.data) {
        setStrategyData(data.data);
      } else {
        setStrategyError(data.error || 'Failed to generate strategy');
      }
    } catch (error) {
      setStrategyError('Failed to generate strategy');
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

  return (
    <div className="space-y-6">
      {/* Strategy Summary Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Strategy Summary</h3>
        </div>
        
        {/* Strategy Summary Content */}
        {isGeneratingStrategy ? (
          <StrategySkeleton />
        ) : strategyData ? (
          <div className="bg-[var(--background)] p-6 rounded-lg border border-[var(--border)] shadow-sm">
            <div className="text-sm text-[var(--foreground)] leading-relaxed mb-4">
              {strategyData.strategySummary}
            </div>
            
            {/* Archetype Badge */}
            {strategyData.archetypeName && (
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
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
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                  📊 Data-Driven
                </span>
              </div>
            )}
            
            {/* Three Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Situation */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Situation
                </h4>
                <div className="text-sm text-[var(--muted)] leading-relaxed">
                  {strategyData.situation}
                </div>
              </div>
              
              {/* Complication */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  Complication
                </h4>
                <div className="text-sm text-[var(--muted)] leading-relaxed">
                  {strategyData.complication}
                </div>
              </div>
              
              {/* Future State */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Future State
                </h4>
                <div className="text-sm text-[var(--muted)] leading-relaxed">
                  {strategyData.futureState}
                </div>
              </div>
            </div>

            {/* Strategic Recommendations */}
            {strategyData.strategicRecommendations && strategyData.strategicRecommendations.length > 0 && (
              <div className="mt-6 pt-6 border-t border-[var(--border)]">
                <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">Strategic Recommendations</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {strategyData.strategicRecommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-blue-500 text-xs mt-1">•</span>
                      <span className="text-sm text-[var(--muted)]">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Competitive Positioning */}
            {strategyData.competitivePositioning && (
              <div className="mt-6 pt-6 border-t border-[var(--border)]">
                <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">Competitive Positioning</h4>
                <div className="text-sm text-[var(--muted)] leading-relaxed">
                  {strategyData.competitivePositioning}
                </div>
              </div>
            )}

            {/* Success Metrics */}
            {strategyData.successMetrics && strategyData.successMetrics.length > 0 && (
              <div className="mt-6 pt-6 border-t border-[var(--border)]">
                <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">Success Metrics</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {strategyData.successMetrics.map((metric, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-green-500 text-xs mt-1">•</span>
                      <span className="text-sm text-[var(--muted)]">{metric}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : strategyError ? (
          <div className="bg-[var(--background)] p-6 rounded-lg border border-[var(--border)] shadow-sm">
            <div className="text-center py-8">
              <div className="text-sm text-red-600 mb-4">
                Failed to generate strategy: {strategyError}
              </div>
              <button 
                onClick={handleGenerateStrategy}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[var(--background)] p-6 rounded-lg border border-[var(--border)] shadow-sm">
            <div className="text-center py-8">
              <div className="text-sm text-[var(--muted)] mb-4">
                No strategy summary available for this company.
              </div>
              <div className="text-xs text-[var(--muted)]">
                Strategy data should be automatically populated based on company information.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Success Toast */}
      {showSuccessMessage && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="px-4 py-2 rounded-lg shadow-lg bg-green-50 border border-green-200 text-green-800">
            <div className="flex items-center space-x-2">
              <span>✓</span>
              <span className="text-sm font-medium">{successMessage}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}