"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ChronicleReportEnhanced } from './ChronicleReportEnhanced';

interface ChronicleReport {
  id: string;
  title: string;
  reportDate: string;
  reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  content: {
    purpose: string;
    summary: {
      weekProgress: string;
      executiveSummary: string;
    };
    performanceVsTargets: {
      leadsToProspects: { actual: number; target: number; percentage: number };
      prospectsToOpportunities: { actual: number; target: number; percentage: number };
      opportunitiesToClients: { actual: number; target: number; percentage: number };
    };
    thisMonth: string;
    thisQuarter: string;
    keyWins: string[];
    lowlights: string[];
    activityMetrics: {
      callsCompleted: number;
      emailsCompleted: number;
      meetingsCompleted: number;
      newLeads: number;
      newProspects: number;
      newOpportunities: number;
    };
    conversionFunnel: {
      leads: number;
      prospects: number;
      opportunities: number;
      clients: number;
    };
  };
  createdAt: string;
  shares: Array<{
    id: string;
    shareToken: string;
    shareUrl: string;
    viewCount: number;
    createdAt: string;
  }>;
}

export function ChronicleSharedView() {
  const params = useParams();
  const [report, setReport] = useState<ChronicleReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = params.token as string;

  useEffect(() => {
    if (!token) return;

    const fetchSharedReport = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/chronicle/shared/${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Shared report not found or expired');
          }
          throw new Error('Failed to fetch shared report');
        }
        
        const data = await response.json();
        if (data.success) {
          setReport(data.data);
        } else {
          throw new Error(data.error || 'Failed to load shared report');
        }
      } catch (err) {
        console.error('Error fetching shared chronicle report:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch shared report');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedReport();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Report Not Available</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">
              This shared report may have expired or the link may be invalid.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
              <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Report Not Found</h3>
            <p className="text-gray-600">
              The requested shared report could not be found.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Public header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Shared Chronicle Report</h1>
              <p className="text-sm text-gray-600">This is a publicly shared report</p>
            </div>
            <div className="text-sm text-gray-500">
              Shared via Adrata
            </div>
          </div>
        </div>
      </div>

      {/* Report content */}
      <div className="max-w-4xl mx-auto">
        <ChronicleReportEnhanced 
          report={report} 
          onBack={undefined} // No back button for shared view
        />
      </div>
    </div>
  );
}