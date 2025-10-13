"use client";

import React, { useState, useEffect } from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';

interface UniversalCompanyIntelTabProps {
  record: any;
  recordType: string;
}

interface CompanyIntelligence {
  strategicWants: string[];
  criticalNeeds: string[];
  businessUnits: Array<{
    name: string;
    functions: string[];
    color: string;
  }>;
  strategicIntelligence: string;
  adrataStrategy: string;
  generatedAt?: string;
  model?: string;
}

export function UniversalCompanyIntelTab({ record: recordProp, recordType }: UniversalCompanyIntelTabProps) {
  const { currentRecord: contextRecord } = useRecordContext();
  const record = recordProp || contextRecord;
  
  const [intelligence, setIntelligence] = useState<CompanyIntelligence | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (record?.id) {
      loadIntelligence();
    }
  }, [record?.id]);

  const loadIntelligence = async () => {
    if (!record?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Check for cached intelligence first
      const cachedIntelligence = record?.customFields?.intelligence;
      if (cachedIntelligence) {
        console.log('✅ [INTEL TAB] Using cached intelligence data');
        setIntelligence(cachedIntelligence);
        setLoading(false);
        return;
      }

      console.log(`🔄 [INTEL TAB] Fetching intelligence for company ID: ${record.id}`);
      // Generate new intelligence without timeout
      const response = await fetch(`/api/v1/companies/${record.id}/intelligence`);
      
      // Check if response is OK before parsing
      if (!response.ok) {
        console.error(`❌ [INTEL TAB] API returned status ${response.status}`);
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 [INTEL TAB] Received response:', data);

      if (data.success) {
        console.log('✅ [INTEL TAB] Successfully loaded intelligence');
        setIntelligence(data.intelligence);
      } else {
        console.error('❌ [INTEL TAB] API returned success:false', data);
        setError(data.error || 'Failed to generate intelligence');
      }
    } catch (err) {
      console.error('❌ [INTEL TAB] Error loading intelligence:', err);
      setError(err instanceof Error ? err.message : 'Failed to load intelligence');
    } finally {
      setLoading(false);
    }
  };

  const regenerateIntelligence = async () => {
    if (!record?.id) return;

    setLoading(true);
    setError(null);

    try {
      console.log(`🔄 [INTEL TAB] Regenerating intelligence for company ID: ${record.id}`);
      const response = await fetch(`/api/v1/companies/${record.id}/intelligence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceRegenerate: true })
      });
      
      // Check if response is OK before parsing
      if (!response.ok) {
        console.error(`❌ [INTEL TAB] Regenerate API returned status ${response.status}`);
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 [INTEL TAB] Regenerate response:', data);

      if (data.success) {
        console.log('✅ [INTEL TAB] Successfully regenerated intelligence');
        setIntelligence(data.intelligence);
      } else {
        console.error('❌ [INTEL TAB] Regenerate API returned success:false', data);
        setError(data.error || 'Failed to regenerate intelligence');
      }
    } catch (err) {
      console.error('❌ [INTEL TAB] Error regenerating intelligence:', err);
      setError(err instanceof Error ? err.message : 'Failed to regenerate intelligence');
    } finally {
      setLoading(false);
    }
  };

  if (!record) {
    return (
      <div className="p-6">
        <div className="text-center text-[var(--muted)]">No record data available</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-[var(--muted)]">Loading intelligence...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">❌ {error}</div>
          <div className="mb-4">
            <button
              onClick={regenerateIntelligence}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-2"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                setError(null);
                setIntelligence({
                  strategicWants: ['No strategic wants data available'],
                  criticalNeeds: ['No critical needs data available'],
                  businessUnits: [
                    { name: 'General', functions: ['Unable to determine business functions'], color: 'bg-gray-50 border-gray-200' }
                  ],
                  strategicIntelligence: record.description || 'No strategic intelligence available',
                  adrataStrategy: `For ${record.name}, focus on understanding their business needs and challenges.`
                });
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Show Basic Info
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!intelligence) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-[var(--muted)] mb-4">No intelligence data available</p>
          <button
            onClick={loadIntelligence}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Generate Intelligence
          </button>
        </div>
      </div>
    );
  }

      return (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Company Intelligence</h2>
          </div>

          {/* Strategic Intelligence (moved to top, sub-header removed) */}
          <div className="space-y-4">
            <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
              <div className="text-sm text-[var(--foreground)] leading-relaxed">
                {intelligence?.strategicIntelligence || 'Strategic intelligence not available.'}
              </div>
            </div>
          </div>

          {/* Company Wants & Needs Analysis */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Company Wants & Needs Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
                <h4 className="font-medium text-[var(--foreground)] mb-3">Strategic Wants</h4>
                <div className="space-y-2">
                  {(intelligence?.strategicWants || []).map((want, index) => (
                    <div key={index} className="text-sm text-gray-700 flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {want}
                    </div>
                  ))}
                  {(!intelligence?.strategicWants || intelligence.strategicWants.length === 0) && (
                    <div className="text-sm text-[var(--muted)] italic">No strategic wants data available.</div>
                  )}
                </div>
              </div>
              <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
                <h4 className="font-medium text-[var(--foreground)] mb-3">Critical Needs</h4>
                <div className="space-y-2">
                  {(intelligence?.criticalNeeds || []).map((need, index) => (
                    <div key={index} className="text-sm text-gray-700 flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      {need}
                    </div>
                  ))}
                  {(!intelligence?.criticalNeeds || intelligence.criticalNeeds.length === 0) && (
                    <div className="text-sm text-[var(--muted)] italic">No critical needs data available.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Adrata Strategy */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Adrata Intelligence</h3>
            <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
              <div className="text-sm text-[var(--foreground)] leading-relaxed">
                {intelligence?.adrataStrategy || 'Adrata intelligence not available.'}
              </div>
            </div>
          </div>

          {/* Business Units - Only show if we have data */}
          {intelligence?.businessUnits && intelligence.businessUnits.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Business Units</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {intelligence.businessUnits.map((unit, index) => (
                  <div key={index} className={`p-4 rounded-lg border-2 ${unit.color || 'bg-[var(--hover)] border-[var(--border)]'}`}>
                    <h4 className="font-medium text-[var(--foreground)] mb-3">{unit.name || 'Business Unit'}</h4>
                    <div className="space-y-1">
                      {(unit.functions || []).map((func, funcIndex) => (
                        <div key={funcIndex} className="text-xs text-gray-700">
                          {func}
                        </div>
                      ))}
                      {(!unit.functions || unit.functions.length === 0) && (
                        <div className="text-xs text-[var(--muted)] italic">No functions listed.</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      );
}