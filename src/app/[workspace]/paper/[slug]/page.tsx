"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PanelLayout } from '@/platform/ui/components/layout/PanelLayout';
import { PipelineLeftPanelStandalone } from '@/products/pipeline/components/PipelineLeftPanelStandalone';
import { AIRightPanel } from '@/platform/ui/components/chat/AIRightPanel';
import { AcquisitionOSProvider } from '@/platform/ui/context/AcquisitionOSProvider';
import { PipelineProvider } from '@/products/pipeline/context/PipelineContext';
import { SpeedrunDataProvider } from '@/platform/services/speedrun-data-context';
import { RecordContextProvider } from '@/platform/ui/context/RecordContextProvider';
import { ZoomProvider } from '@/platform/ui/components/ZoomProvider';
import { ProfilePopupProvider } from '@/platform/ui/components/ProfilePopupContext';
import { MiddlePanelSkeleton } from '@/platform/ui/components/skeletons/MiddlePanelSkeleton';
import { DocumentTextIcon, ArrowLeftIcon, ShareIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface ReportData {
  id: string;
  title: string;
  type: 'deep-value' | 'mini';
  category: 'competitive' | 'market' | 'buyer-group' | 'industry' | 'role' | 'company';
  description: string;
  content: string;
  metrics: {
    marketShare?: number;
    customerSatisfaction?: number;
    marketPosition?: number;
    [key: string]: any;
  };
  insights: string[];
  createdAt: string;
  url: string;
  personId?: string;
  companyId?: string;
}

export default function WorkspaceReportPage() {
  const params = useParams();
  const slug = params['slug'] as string;
  const workspace = params['workspace'] as string;
  
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true);
        setError(null);

        // For now, we'll generate a report based on the slug
        // In the future, this would fetch from a database or API
        const generatedReport: ReportData = {
          id: slug,
          title: `Deep Value Report - ${slug}`,
          type: 'deep-value',
          category: 'competitive',
          description: `AI-generated competitive intelligence report for ${slug}`,
          content: `
# Deep Value Report - ${slug}

This comprehensive competitive intelligence analysis represents extensive market research, competitive benchmarking, and strategic assessment.

## Executive Summary

### Key Metrics
- **Market Share**: 23% (Target: 35% by 2025)
- **Customer Satisfaction**: 8.9/10 (Industry Leader)
- **Market Position**: #1 (Leader)

## Critical Competitive Insights

- **Market Position Vulnerability**: Current leader position at risk due to emerging AI-native competitors capturing 23% of new business opportunities in last 6 months
- **Competitive Gap Analysis**: Primary competitors investing 2.3x more in R&D, creating technology advantage window that could close market leadership within 18 months

## Strategic Recommendations

1. **Accelerate AI Integration**: Implement AI-powered automation across all service lines to match competitor innovation pace
2. **Expand Market Presence**: Target underserved SMB segment with simplified solutions
3. **Strengthen Customer Retention**: Develop loyalty programs to reduce churn in competitive market

## Market Analysis

The market is experiencing rapid transformation with AI-native competitors disrupting traditional service models. Market leadership position, while strong, faces increasing pressure from emerging competitors.

### Competitive Landscape
- **Primary Competitor**: Strong in enterprise segment, 15% market share
- **Secondary Competitor**: Dominant in SMB space, 12% market share  
- **AI-First Platforms**: Emerging category, 8% market share and growing

## Financial Impact Projections

Based on our analysis, implementing the recommended strategies could result in:
- **Revenue Growth**: 15-20% increase over 18 months
- **Market Share**: Potential to reach 30% by end of 2025
- **Customer Retention**: Improve by 12% through enhanced service delivery
          `,
          metrics: {
            marketShare: 23,
            customerSatisfaction: 8.9,
            marketPosition: 1
          },
          insights: [
            'Market Position Vulnerability: Current leader position at risk due to emerging AI-native competitors capturing 23% of new business opportunities in last 6 months',
            'Competitive Gap Analysis: Primary competitors investing 2.3x more in R&D, creating technology advantage window that could close market leadership within 18 months'
          ],
          createdAt: new Date().toISOString(),
          url: `/${workspace}/paper/${slug}`
        };

        setReport(generatedReport);
      } catch (err) {
        console.error('Error loading report:', err);
        setError('Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [slug, workspace]);

  if (loading) {
    return (
      <AcquisitionOSProvider>
        <ZoomProvider>
          <PipelineProvider>
            <SpeedrunDataProvider>
              <RecordContextProvider>
                <ProfilePopupProvider>
                  <PanelLayout
                    leftPanel={
                      <PipelineLeftPanelStandalone
                        activeSection="companies"
                        onSectionChange={() => {}}
                        isOpportunitiesVisible={false}
                        isProspectsVisible={false}
                        isLeadsVisible={false}
                        isCustomersVisible={false}
                        isPartnersVisible={false}
                      />
                    }
                    middlePanel={<MiddlePanelSkeleton />}
                    rightPanel={<AIRightPanel />}
                    isLeftPanelVisible={true}
                    isRightPanelVisible={true}
                    onToggleLeftPanel={() => {}}
                    onToggleRightPanel={() => {}}
                  />
                </ProfilePopupProvider>
              </RecordContextProvider>
            </SpeedrunDataProvider>
          </PipelineProvider>
        </ZoomProvider>
      </AcquisitionOSProvider>
    );
  }

  if (error || !report) {
    return (
      <AcquisitionOSProvider>
        <ZoomProvider>
          <PipelineProvider>
            <SpeedrunDataProvider>
              <RecordContextProvider>
                <ProfilePopupProvider>
                  <PanelLayout
                    leftPanel={
                      <PipelineLeftPanelStandalone
                        activeSection="companies"
                        onSectionChange={() => {}}
                        isOpportunitiesVisible={false}
                        isProspectsVisible={false}
                        isLeadsVisible={false}
                        isCustomersVisible={false}
                        isPartnersVisible={false}
                      />
                    }
                    middlePanel={
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="text-red-500 text-6xl mb-4">⚠️</div>
                          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
                          <p className="text-gray-600 mb-6">{error}</p>
                        </div>
                      </div>
                    }
                    rightPanel={<AIRightPanel />}
                    isLeftPanelVisible={true}
                    isRightPanelVisible={true}
                    onToggleLeftPanel={() => {}}
                    onToggleRightPanel={() => {}}
                  />
                </ProfilePopupProvider>
              </RecordContextProvider>
            </SpeedrunDataProvider>
          </PipelineProvider>
        </ZoomProvider>
      </AcquisitionOSProvider>
    );
  }

  return (
    <AcquisitionOSProvider>
      <ZoomProvider>
        <PipelineProvider>
          <SpeedrunDataProvider>
            <RecordContextProvider>
              <ProfilePopupProvider>
                <PanelLayout
                  leftPanel={
                    <PipelineLeftPanelStandalone
                      activeSection="companies"
                      onSectionChange={() => {}}
                      isOpportunitiesVisible={false}
                      isProspectsVisible={false}
                      isLeadsVisible={false}
                      isCustomersVisible={false}
                      isPartnersVisible={false}
                    />
                  }
                  middlePanel={
                    <div className="h-full bg-white overflow-y-auto">
                      {/* Header */}
                      <div className="border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => window.history.back()}
                              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                            >
                              <ArrowLeftIcon className="w-4 h-4" />
                              ← Back to Reports
                            </button>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <DocumentTextIcon className="w-4 h-4" />
                              <span>{report.url}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                              <ShareIcon className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                            </button>
                            <button className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors text-sm font-medium">
                              PDF
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Report Content */}
                      <div className="px-6 py-8">
                        <div className="max-w-4xl mx-auto">
                          {/* Title */}
                          <h1 className="text-3xl font-bold text-gray-900 mb-4">{report.title}</h1>
                          
                          {/* Description */}
                          <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                            {report.description}
                          </p>

                          {/* Executive Summary */}
                          {report.metrics && Object.keys(report.metrics).length > 0 && (
                            <div className="mb-8">
                              <h2 className="text-xl font-semibold text-gray-900 mb-4">Executive Summary</h2>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                {report.metrics.marketShare && (
                                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                                    <div className="text-3xl font-bold text-orange-500 mb-2">{report.metrics.marketShare}%</div>
                                    <div className="text-sm text-gray-600">Market Share</div>
                                    <div className="text-xs text-gray-500 mt-1">Target: 35% by 2025</div>
                                  </div>
                                )}
                                {report.metrics.customerSatisfaction && (
                                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                                    <div className="text-3xl font-bold text-green-500 mb-2">{report.metrics.customerSatisfaction}/10</div>
                                    <div className="text-sm text-gray-600">Customer Satisfaction</div>
                                    <div className="text-xs text-gray-500 mt-1">Industry Leader</div>
                                  </div>
                                )}
                                {report.metrics.marketPosition && (
                                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                                    <div className="text-3xl font-bold text-blue-500 mb-2">#{report.metrics.marketPosition}</div>
                                    <div className="text-sm text-gray-600">Market Position</div>
                                    <div className="text-xs text-gray-500 mt-1">Leader</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Critical Insights */}
                          {report.insights && report.insights.length > 0 && (
                            <div className="mb-8">
                              <h2 className="text-xl font-semibold text-gray-900 mb-4">Critical Competitive Insights</h2>
                              <ul className="space-y-3">
                                {report.insights.map((insight, index) => (
                                  <li key={index} className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <span className="text-gray-700">{insight}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Report Content */}
                          <div className="prose prose-gray max-w-none text-gray-900">
                            <div 
                              className="text-gray-900 [&>*]:text-gray-900 [&>h1]:text-gray-900 [&>h2]:text-gray-900 [&>h3]:text-gray-900 [&>p]:text-gray-900 [&>li]:text-gray-900 [&>ul]:text-gray-900 [&>ol]:text-gray-900"
                              dangerouslySetInnerHTML={{ __html: report.content.replace(/\n/g, '<br>') }} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                  rightPanel={<AIRightPanel />}
                  isLeftPanelVisible={true}
                  isRightPanelVisible={true}
                  onToggleLeftPanel={() => {}}
                  onToggleRightPanel={() => {}}
                />
              </ProfilePopupProvider>
            </RecordContextProvider>
          </SpeedrunDataProvider>
        </PipelineProvider>
      </ZoomProvider>
    </AcquisitionOSProvider>
  );
}
