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
        setIntelligence(cachedIntelligence);
        setLoading(false);
        return;
      }

      // Generate new intelligence
      const response = await fetch(`/api/companies/${record.id}/intelligence`);
      const data = await response.json();

      if (data.success) {
        setIntelligence(data.intelligence);
      } else {
        setError(data.error || 'Failed to generate intelligence');
      }
    } catch (err) {
      console.error('Error loading intelligence:', err);
      setError('Failed to load intelligence');
    } finally {
      setLoading(false);
    }
  };

  const regenerateIntelligence = async () => {
    if (!record?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/companies/${record.id}/intelligence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceRegenerate: true })
      });
      
      const data = await response.json();

      if (data.success) {
        setIntelligence(data.intelligence);
      } else {
        setError(data.error || 'Failed to regenerate intelligence');
      }
    } catch (err) {
      console.error('Error regenerating intelligence:', err);
      setError('Failed to regenerate intelligence');
    } finally {
      setLoading(false);
    }
  };

  if (!record) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">No record data available</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Generating company intelligence...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">❌ {error}</div>
          <button
            onClick={regenerateIntelligence}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!intelligence) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No intelligence data available</p>
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
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Company Intelligence</h2>
          </div>

          {/* Strategic Intelligence (moved to top, sub-header removed) */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-900 leading-relaxed">
                {intelligence?.strategicIntelligence || 'Strategic intelligence not available.'}
              </div>
            </div>
          </div>

          {/* Company Wants & Needs Analysis */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Wants & Needs Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Strategic Wants</h4>
                <div className="space-y-2">
                  {(intelligence?.strategicWants || []).map((want, index) => (
                    <div key={index} className="text-sm text-gray-700 flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {want}
                    </div>
                  ))}
                  {(!intelligence?.strategicWants || intelligence.strategicWants.length === 0) && (
                    <div className="text-sm text-gray-500 italic">No strategic wants data available.</div>
                  )}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Critical Needs</h4>
                <div className="space-y-2">
                  {(intelligence?.criticalNeeds || []).map((need, index) => (
                    <div key={index} className="text-sm text-gray-700 flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      {need}
                    </div>
                  ))}
                  {(!intelligence?.criticalNeeds || intelligence.criticalNeeds.length === 0) && (
                    <div className="text-sm text-gray-500 italic">No critical needs data available.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Adrata Strategy */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Adrata Intelligence</h3>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-900 leading-relaxed">
                {intelligence?.adrataStrategy || 'Adrata intelligence not available.'}
              </div>
            </div>
          </div>

          {/* Business Units - Only show if we have data */}
          {intelligence?.businessUnits && intelligence.businessUnits.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Units</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {intelligence.businessUnits.map((unit, index) => (
                  <div key={index} className={`p-4 rounded-lg border-2 ${unit.color || 'bg-gray-100 border-gray-200'}`}>
                    <h4 className="font-medium text-gray-900 mb-3">{unit.name || 'Business Unit'}</h4>
                    <div className="space-y-1">
                      {(unit.functions || []).map((func, funcIndex) => (
                        <div key={funcIndex} className="text-xs text-gray-700">
                          {func}
                        </div>
                      ))}
                      {(!unit.functions || unit.functions.length === 0) && (
                        <div className="text-xs text-gray-500 italic">No functions listed.</div>
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