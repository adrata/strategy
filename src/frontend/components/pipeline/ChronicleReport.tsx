"use client";

import React, { useState } from 'react';

interface ChronicleReportProps {
  report: {
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
  };
  onBack?: () => void;
}

export function ChronicleReport({ report, onBack }: ChronicleReportProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    try {
      const response = await fetch('/api/chronicle/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId: report.id,
          allowedEmails: [],
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create share link');
      }

      const share = await response.json();
      
      // Copy to clipboard
      await navigator.clipboard.writeText(share.shareUrl);
      alert('Share link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing report:', error);
      alert('Failed to create share link');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderContent = () => {
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
              <h3 className="text-lg font-semibold text-foreground mb-4">This Week's Goals</h3>
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
              <h3 className="text-lg font-semibold text-foreground mb-4">Key Opportunities</h3>
              <div className="space-y-3">
                {content.keyOpportunities.map((opp: any, index: number) => (
                  <div key={index} className="bg-background border border-border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-foreground">{opp.name}</h4>
                        <p className="text-sm text-muted">Stage: {opp.stage}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-foreground">${opp.amount?.toLocaleString() || '0'}</div>
                        {opp.closeDate && (
                          <div className="text-sm text-muted">
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
              <h3 className="text-lg font-semibold text-foreground mb-4">Action Items</h3>
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
              <h3 className="text-lg font-semibold text-foreground mb-4">This Week's Achievements</h3>
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
              <h3 className="text-lg font-semibold text-foreground mb-4">Wins This Week</h3>
              <div className="space-y-3">
                {content.wins.map((win: any, index: number) => (
                  <div key={index} className="bg-background border border-border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-foreground">{win.name}</h4>
                        <p className="text-sm text-muted">Stage: {win.stage}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-foreground">${win.amount?.toLocaleString() || '0'}</div>
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
              <h3 className="text-lg font-semibold text-foreground mb-4">Next Week's Priorities</h3>
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
              <h3 className="text-lg font-semibold text-foreground mb-4">Activity Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-background border border-border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{content.metrics.callsCompleted || 0}</div>
                  <div className="text-sm text-muted">Calls Made</div>
                </div>
                <div className="bg-background border border-border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{content.metrics.emailsCompleted || 0}</div>
                  <div className="text-sm text-muted">Emails Sent</div>
                </div>
                <div className="bg-background border border-border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{content.metrics.meetingsCompleted || 0}</div>
                  <div className="text-sm text-muted">Meetings Scheduled</div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="h-full w-full">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-hover rounded-lg transition-colors"
              >
                <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-foreground">{report.title}</h1>
              <p className="text-muted mt-1">
                Generated on {formatDate(report.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {report.shares.length > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                {report.shares.reduce((sum, share) => sum + share.viewCount, 0)} views
              </div>
            )}
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}
