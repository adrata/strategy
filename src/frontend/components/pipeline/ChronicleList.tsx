"use client";

import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { useAcquisitionOS } from '@/platform/ui/context/AcquisitionOSProvider';

interface ChronicleReport {
  id: string;
  title: string;
  reportType: 'MONDAY_PREP' | 'FRIDAY_RECAP';
  content: any;
  weekStart: string;
  weekEnd: string;
  createdAt: string;
  shares: Array<{
    id: string;
    shareToken: string;
    shareUrl: string;
    viewCount: number;
    createdAt: string;
  }>;
}

interface ChronicleListProps {
  onReportSelect?: (report: ChronicleReport) => void;
}

export function ChronicleList({ onReportSelect }: ChronicleListProps) {
  const { user } = useUnifiedAuth();
  const { data: acquisitionData } = useAcquisitionOS();
  const [reports, setReports] = useState<ChronicleReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = acquisitionData?.auth?.authUser?.activeWorkspaceId || user?.activeWorkspaceId;

  useEffect(() => {
    if (!workspaceId) return;

    const fetchReports = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/chronicle/reports?workspaceId=${workspaceId}&limit=20`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch reports');
        }

        const data = await response.json();
        setReports(data.reports || []);
      } catch (err) {
        console.error('Error fetching Chronicle reports:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch reports');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [workspaceId]);

  const generateReport = async (reportType: 'MONDAY_PREP' | 'FRIDAY_RECAP') => {
    if (!workspaceId) return;

    try {
      const response = await fetch('/api/chronicle/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType,
          workspaceId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const newReport = await response.json();
      setReports(prev => [newReport, ...prev]);
    } catch (err) {
      console.error('Error generating report:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    }
  };

  const getReportTypeLabel = (type: string) => {
    return type === 'MONDAY_PREP' ? 'Monday Prep' : 'Friday Recap';
  };

  const getReportTypeColor = (type: string) => {
    return type === 'MONDAY_PREP' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-green-100 text-green-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[var(--background)] rounded-lg border border-[var(--border)] p-6 animate-pulse">
              <div className="h-4 bg-[var(--loading-bg)] rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-[var(--loading-bg)] rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-[var(--loading-bg)] rounded w-full mb-2"></div>
              <div className="h-3 bg-[var(--loading-bg)] rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      {/* Header */}
      <div className="p-6 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Chronicle</h1>
            <p className="text-[var(--muted)] mt-1">Weekly reports and chronicles</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => generateReport('MONDAY_PREP')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Generate Monday Prep
            </button>
            <button
              onClick={() => generateReport('FRIDAY_RECAP')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Generate Friday Recap
            </button>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="p-6">
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-[var(--muted)] mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No reports yet</h3>
            <p className="text-[var(--muted)] mb-4">Generate your first weekly report to get started.</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => generateReport('MONDAY_PREP')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Generate Monday Prep
              </button>
              <button
                onClick={() => generateReport('FRIDAY_RECAP')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Generate Friday Recap
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                onClick={() => onReportSelect?.(report)}
                className="bg-[var(--background)] rounded-lg border border-[var(--border)] p-6 hover:border-[var(--border)] hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-[var(--foreground)]">{report.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReportTypeColor(report.reportType)}`}>
                        {getReportTypeLabel(report.reportType)}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--muted)] mb-3">
                      Generated on {formatDate(report.createdAt)}
                    </p>
                    <div className="text-sm text-gray-700">
                      {report.content?.content?.overview?.weekSummary || 
                       report.content?.content?.overview?.keyFocus || 
                       'Weekly report generated automatically'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {report.shares.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-[var(--muted)]">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                        {report.shares.reduce((sum, share) => sum + share.viewCount, 0)} views
                      </div>
                    )}
                    <svg className="h-5 w-5 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
