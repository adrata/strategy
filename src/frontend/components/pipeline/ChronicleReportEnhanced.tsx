"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChartContainer, ChartTooltip } from '@/frontend/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChroniclePresentationView } from './ChroniclePresentationView';
import { Kbd, formatShortcutForDisplay } from '@/platform/utils/keyboard-shortcut-display';

interface ChronicleReportEnhancedProps {
  report: {
    id: string;
    title: string;
    reportDate: string;
    reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'PITCH';
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
  };
  onBack?: () => void;
}

export function ChronicleReportEnhanced({ report, onBack }: ChronicleReportEnhancedProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const router = useRouter();

  // Redirect PITCH reports to the pitch page
  useEffect(() => {
    if (report.reportType === 'PITCH') {
      router.push('/chronicle/pitch');
    }
  }, [report.reportType, router]);

  // Keyboard shortcut for Present (Cmd+Enter)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if not in input field
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      if (!isInput && (event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        handlePresent();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleShare = async () => {
    try {
      setIsSharing(true);
      const response = await fetch('/api/v1/chronicle/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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
      await navigator.clipboard.writeText(share.data.shareUrl);
      alert('Share link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing report:', error);
      alert('Failed to create share link');
    } finally {
      setIsSharing(false);
    }
  };

  const handlePresent = () => {
    setIsPresentationMode(true);
  };

  const handleClosePresentation = () => {
    setIsPresentationMode(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Chart configuration
  const chartConfig = {
    actual: {
      label: "Actual",
      color: "hsl(var(--chart-1))",
    },
    target: {
      label: "Target",
      color: "hsl(var(--chart-2))",
    },
  };

  // Performance vs targets data
  const performanceData = [
    {
      metric: 'Leads → Prospects',
      actual: report.content.performanceVsTargets.leadsToProspects.actual,
      target: report.content.performanceVsTargets.leadsToProspects.target,
      percentage: report.content.performanceVsTargets.leadsToProspects.percentage
    },
    {
      metric: 'Prospects → Opportunities',
      actual: report.content.performanceVsTargets.prospectsToOpportunities.actual,
      target: report.content.performanceVsTargets.prospectsToOpportunities.target,
      percentage: report.content.performanceVsTargets.prospectsToOpportunities.percentage
    },
    {
      metric: 'Opportunities → Clients',
      actual: report.content.performanceVsTargets.opportunitiesToClients.actual,
      target: report.content.performanceVsTargets.opportunitiesToClients.target,
      percentage: report.content.performanceVsTargets.opportunitiesToClients.percentage
    }
  ];

  // Show presentation mode if active
  if (isPresentationMode) {
    return (
      <ChroniclePresentationView 
        report={report} 
        onClose={handleClosePresentation}
      />
    );
  }

  return (
    <div className="h-full w-full bg-[var(--background)]">
      {/* Breadcrumb Header - Sticky */}
      <div className="sticky top-0 z-10 px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-[var(--hover)] rounded-lg transition-colors"
              >
                <svg className="h-5 w-5 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--muted)]">Chronicle</span>
              <svg className="h-4 w-4 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-[var(--foreground)] font-medium">{report.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {report.shares.length > 0 && (
              <div className="flex items-center gap-1 text-sm text-[var(--muted)]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                {report.shares.reduce((sum, share) => sum + share.viewCount, 0)} views
              </div>
            )}
            <button
              onClick={handlePresent}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors border border-blue-200 flex items-center gap-2"
            >
              Present
              <Kbd variant="blue" size="sm">{formatShortcutForDisplay(['⌘⏎', 'Ctrl+Enter'])}</Kbd>
            </button>
          </div>
        </div>
      </div>

      {/* Report Title - Sticky */}
      <div className="sticky top-[73px] z-10 px-6 py-6 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
            {report.title}
          </h1>
          <p className="text-[var(--muted)]">
            {formatDate(report.reportDate)} at {formatTime(report.createdAt)}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 overflow-y-auto invisible-scrollbar max-w-5xl mx-auto bg-[var(--background)]">
        <div className="space-y-8">
          {/* Purpose */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Purpose</h2>
            <div className="border border-[var(--border)] rounded-lg p-6">
              <p className="text-gray-700 leading-relaxed">
                {report.content.purpose}
              </p>
            </div>
          </section>

          {/* Executive Summary */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Executive Summary</h2>
            <div className="space-y-4">
              <div className="border border-[var(--border)] rounded-lg p-6">
                <h3 className="font-medium text-[var(--foreground)] mb-2">Week Progress</h3>
                <p className="text-[var(--muted)] leading-relaxed">
                  {report.content.summary.weekProgress}
                </p>
              </div>
              <div className="border border-[var(--border)] rounded-lg p-6">
                <h3 className="font-medium text-[var(--foreground)] mb-2">Summary</h3>
                <p className="text-[var(--muted)] leading-relaxed">
                  {report.content.summary.executiveSummary}
                </p>
              </div>
            </div>
          </section>

          {/* Performance vs Targets */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance vs Targets</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <ChartContainer config={chartConfig} className="h-[300px]">
                <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" />
                  <YAxis />
                  <ChartTooltip />
                  <Bar dataKey="actual" fill={chartConfig.actual.color} name="Actual" />
                  <Bar dataKey="target" fill={chartConfig.target.color} name="Target" />
                </BarChart>
              </ChartContainer>
              
              {/* Performance indicators */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {performanceData.map((item, index) => (
                  <div key={index} className="text-center">
                    <div className={`text-2xl font-bold ${
                      item.percentage >= 90 ? 'text-green-600' : 
                      item.percentage >= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {item.percentage}%
                    </div>
                    <div className="text-sm text-gray-600">{item.metric}</div>
                    <div className="text-xs text-gray-500">
                      {item.actual} / {item.target}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* This Month & Quarter */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">This Month & Quarter</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-[var(--border)] rounded-lg p-6">
                <h3 className="font-medium text-[var(--foreground)] mb-3">This Month</h3>
                <p className="text-[var(--muted)] leading-relaxed">
                  {report.content.thisMonth}
                </p>
              </div>
              <div className="border border-[var(--border)] rounded-lg p-6">
                <h3 className="font-medium text-[var(--foreground)] mb-3">This Quarter</h3>
                <p className="text-[var(--muted)] leading-relaxed">
                  {report.content.thisQuarter}
                </p>
              </div>
            </div>
          </section>

          {/* Key Wins & Highlights */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Wins & Highlights</h2>
            <div className="border border-[var(--border)] rounded-lg p-6">
              <ul className="space-y-3">
                {report.content.keyWins.map((win, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-[var(--muted)] leading-relaxed">{win}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Lowlights & Challenges */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Lowlights & Challenges</h2>
            <div className="border border-[var(--border)] rounded-lg p-6">
              <ul className="space-y-3">
                {report.content.lowlights.map((lowlight, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-[var(--muted)] leading-relaxed">{lowlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Activity Metrics */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity Metrics</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="border border-[var(--border)] rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-[var(--foreground)]">
                  {report.content.activityMetrics.callsCompleted}
                </div>
                <div className="text-sm text-[var(--muted)]">Calls Completed</div>
              </div>
              <div className="border border-[var(--border)] rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-[var(--foreground)]">
                  {report.content.activityMetrics.emailsCompleted}
                </div>
                <div className="text-sm text-[var(--muted)]">Emails Sent</div>
              </div>
              <div className="border border-[var(--border)] rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-[var(--foreground)]">
                  {report.content.activityMetrics.meetingsCompleted}
                </div>
                <div className="text-sm text-[var(--muted)]">Meetings Scheduled</div>
              </div>
              <div className="border border-[var(--border)] rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-[var(--foreground)]">
                  {report.content.activityMetrics.newLeads}
                </div>
                <div className="text-sm text-[var(--muted)]">New Leads</div>
              </div>
              <div className="border border-[var(--border)] rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-[var(--foreground)]">
                  {report.content.activityMetrics.newProspects}
                </div>
                <div className="text-sm text-[var(--muted)]">New Prospects</div>
              </div>
              <div className="border border-[var(--border)] rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-[var(--foreground)]">
                  {report.content.activityMetrics.newOpportunities}
                </div>
                <div className="text-sm text-[var(--muted)]">New Opportunities</div>
              </div>
            </div>
          </section>

          {/* Conversion Funnel */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Conversion Funnel</h2>
            <div className="border border-[var(--border)] rounded-lg p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {report.content.conversionFunnel.leads}
                  </div>
                  <div className="text-sm text-[var(--muted)]">Leads</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {report.content.conversionFunnel.prospects}
                  </div>
                  <div className="text-sm text-[var(--muted)]">Prospects</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {report.content.conversionFunnel.opportunities}
                  </div>
                  <div className="text-sm text-[var(--muted)]">Opportunities</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {report.content.conversionFunnel.clients}
                  </div>
                  <div className="text-sm text-[var(--muted)]">Clients</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
