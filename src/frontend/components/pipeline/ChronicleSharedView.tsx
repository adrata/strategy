"use client";

import React, { useState, useEffect } from 'react';

interface ChronicleSharedViewProps {
  token: string;
}

interface SharedReport {
  id: string;
  title: string;
  reportType: 'MONDAY_PREP' | 'FRIDAY_RECAP';
  content: any;
  weekStart: string;
  weekEnd: string;
  createdAt: string;
}

interface ShareInfo {
  id: string;
  shareToken: string;
  viewCount: number;
  createdAt: string;
}

export function ChronicleSharedView({ token }: ChronicleSharedViewProps) {
  const [report, setReport] = useState<SharedReport | null>(null);
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedReport = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/chronicle/share/${token}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Report not found or link has expired');
          } else if (response.status === 410) {
            throw new Error('This shared report has expired');
          } else {
            throw new Error('Failed to load shared report');
          }
        }

        const data = await response.json();
        setReport(data.report);
        setShareInfo(data.share);
      } catch (err) {
        console.error('Error fetching shared report:', err);
        setError(err instanceof Error ? err.message : 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedReport();
  }, [token]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderContent = () => {
    if (!report) return null;

    const content = report.content?.content;
    if (!content) return null;

    if (report.reportType === 'MONDAY_PREP') {
      return (
        <div className="space-y-6">
          {/* Overview */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Week Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">{content.overview?.totalPipelineValue || '$0.0M'}</div>
                <div className="text-sm text-blue-700">Pipeline Value</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">{content.overview?.openOpportunities || 0}</div>
                <div className="text-sm text-blue-700">Open Opportunities</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">{content.overview?.keyFocus || 'Drive Revenue'}</div>
                <div className="text-sm text-blue-700">Key Focus</div>
              </div>
            </div>
          </div>

          {/* Goals */}
          {content.thisWeekGoals && (
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">This Week's Goals</h3>
              <ul className="space-y-2">
                {content.thisWeekGoals.map((goal: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{goal}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Opportunities */}
          {content.keyOpportunities && content.keyOpportunities.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Key Opportunities</h3>
              <div className="space-y-3">
                {content.keyOpportunities.map((opp: any, index: number) => (
                  <div key={index} className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-[var(--foreground)]">{opp.name}</h4>
                        <p className="text-sm text-[var(--muted)]">Stage: {opp.stage}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-[var(--foreground)]">${opp.amount?.toLocaleString() || '0'}</div>
                        {opp.closeDate && (
                          <div className="text-sm text-[var(--muted)]">
                            Close: {new Date(opp.closeDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Items */}
          {content.actionItems && (
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Action Items</h3>
              <ul className="space-y-2">
                {content.actionItems.map((item: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    } else {
      // FRIDAY_RECAP
      return (
        <div className="space-y-6">
          {/* Overview */}
          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-4">Week Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900">{content.overview?.totalPipelineValue || '$0.0M'}</div>
                <div className="text-sm text-green-700">Pipeline Value</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900">{content.overview?.openOpportunities || 0}</div>
                <div className="text-sm text-green-700">Open Opportunities</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900">{content.overview?.weekSummary || 'Week Completed'}</div>
                <div className="text-sm text-green-700">Summary</div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          {content.achievements && (
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">This Week's Achievements</h3>
              <ul className="space-y-2">
                {content.achievements.map((achievement: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{achievement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Wins */}
          {content.wins && content.wins.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Wins This Week</h3>
              <div className="space-y-3">
                {content.wins.map((win: any, index: number) => (
                  <div key={index} className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-[var(--foreground)]">{win.name}</h4>
                        <p className="text-sm text-[var(--muted)]">Stage: {win.stage}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-[var(--foreground)]">${win.amount?.toLocaleString() || '0'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Week Priorities */}
          {content.nextWeekPriorities && (
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Next Week's Priorities</h3>
              <ul className="space-y-2">
                {content.nextWeekPriorities.map((priority: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{priority}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Metrics */}
          {content.metrics && (
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Activity Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-[var(--foreground)]">{content.metrics.callsCompleted || 0}</div>
                  <div className="text-sm text-[var(--muted)]">Calls Made</div>
                </div>
                <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-[var(--foreground)]">{content.metrics.emailsCompleted || 0}</div>
                  <div className="text-sm text-[var(--muted)]">Emails Sent</div>
                </div>
                <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-[var(--foreground)]">{content.metrics.meetingsCompleted || 0}</div>
                  <div className="text-sm text-[var(--muted)]">Meetings Scheduled</div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--panel-background)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-[var(--muted)]">Loading shared report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--panel-background)] flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-900 mb-2">Unable to load report</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[var(--panel-background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--muted)]">Report not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--panel-background)]">
      {/* Header */}
      <div className="bg-[var(--background)] border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">{report.title}</h1>
              <p className="text-[var(--muted)] mt-1">
                Generated on {formatDate(report.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              {shareInfo?.viewCount || 0} views
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {renderContent()}
      </div>
    </div>
  );
}
