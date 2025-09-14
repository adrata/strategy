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
  category: 'competitive' | 'market' | 'buyer-group' | 'industry';
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
}

// Mock report data
const mockReports: ReportData[] = [
  {
    id: 'adp-competitive-deep-value-01K4VM894JE1BWD2TA3FZCNKCK',
    title: 'ADP Competitive Deep Value Report',
    type: 'deep-value',
    category: 'competitive',
    description: 'This comprehensive 52-page competitive intelligence analysis represents 35+ hours of market research, competitive benchmarking, and strategic assessment.',
    content: `
# ADP Competitive Deep Value Report

This comprehensive 52-page competitive intelligence analysis represents 35+ hours of market research, competitive benchmarking, and strategic assessment. Our team analyzed 3,247 data points, conducted 31 executive interviews, and evaluated 203 competitive scenarios to deliver actionable insights that will accelerate your competitive advantage and market dominance.

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

The HR technology market is experiencing rapid transformation with AI-native competitors disrupting traditional service models. ADP's market leadership position, while strong, faces increasing pressure from companies like Workday, BambooHR, and emerging AI-first platforms.

### Competitive Landscape
- **Workday**: Strong in enterprise segment, 15% market share
- **BambooHR**: Dominant in SMB space, 12% market share  
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
    createdAt: '2025-01-15T10:00:00Z',
    url: 'https://action.adrata.com/paper/wbmxhj1bmx'
  },
  {
    id: 'workday-market-analysis-01K4VM894JE1BWD2TA3FZCNKCK',
    title: 'Workday Market Analysis Report',
    type: 'deep-value',
    category: 'market',
    description: 'Comprehensive market analysis of Workday\'s positioning and growth opportunities in the enterprise HR space.',
    content: `# Workday Market Analysis Report

## Executive Summary
Workday continues to dominate the enterprise HR technology market with strong growth in cloud-based solutions.

## Key Findings
- Strong enterprise adoption
- Growing AI capabilities
- Competitive pricing pressure

## Recommendations
- Focus on mid-market expansion
- Enhance AI features
- Improve integration capabilities`,
    metrics: {
      marketShare: 15,
      customerSatisfaction: 8.2,
      marketPosition: 2
    },
    insights: [
      'Strong enterprise adoption with 15% market share',
      'Growing AI capabilities positioning for future growth'
    ],
    createdAt: '2025-01-14T10:00:00Z',
    url: 'https://action.adrata.com/paper/workday-analysis'
  },
  {
    id: 'adp-buyer-group-intel-01K4VM894JE1BWD2TA3FZCNKCK',
    title: 'ADP Buyer Group Intelligence',
    type: 'mini',
    category: 'buyer-group',
    description: 'Key decision makers and influencers within ADP\'s procurement process.',
    content: `# ADP Buyer Group Intelligence

## Decision Makers
- Sarah Johnson: Chief Human Resources Officer
- Michael Chen: VP of HR Technology
- David Rodriguez: Chief Technology Officer

## Key Insights
- Technology-focused decision making
- Strong emphasis on ROI
- Security and compliance priorities`,
    metrics: {},
    insights: [
      'Technology-focused decision making process',
      'Strong emphasis on ROI and security'
    ],
    createdAt: '2025-01-13T10:00:00Z',
    url: 'https://action.adrata.com/paper/adp-buyer-group'
  },
  {
    id: 'hr-tech-industry-trends-01K4VM894JE1BWD2TA3FZCNKCK',
    title: 'HR Technology Industry Trends',
    type: 'mini',
    category: 'industry',
    description: 'Latest trends and developments in the HR technology industry.',
    content: `# HR Technology Industry Trends

## Key Trends
- AI and automation adoption
- Remote work solutions
- Employee experience focus
- Data analytics integration

## Market Growth
- 12% annual growth rate
- $15B market size
- Strong VC investment`,
    metrics: {},
    insights: [
      'AI and automation driving industry transformation',
      '12% annual growth rate with strong VC investment'
    ],
    createdAt: '2025-01-12T10:00:00Z',
    url: 'https://action.adrata.com/paper/hr-tech-trends'
  }
];

export default function ReportPage() {
  const params = useParams();
  const slug = params['slug'] as string;
  const scenarioSlug = params['scenarioSlug'] as string;
  
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true);
        setError(null);

        // Find report by slug
        const foundReport = mockReports.find(r => r['id'] === slug);
        if (foundReport) {
          setReport(foundReport);
        } else {
          setError('Report not found');
        }
      } catch (err) {
        console.error('Error loading report:', err);
        setError('Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [slug]);

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
                              Back to Profile
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
                          {report['metrics'] && Object.keys(report.metrics).length > 0 && (
                            <div className="mb-8">
                              <h2 className="text-xl font-semibold text-gray-900 mb-4">Executive Summary</h2>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                {report['metrics']['marketShare'] && (
                                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                                    <div className="text-3xl font-bold text-orange-500 mb-2">{report.metrics.marketShare}%</div>
                                    <div className="text-sm text-gray-600">Market Share</div>
                                    <div className="text-xs text-gray-500 mt-1">Target: 35% by 2025</div>
                                  </div>
                                )}
                                {report['metrics']['customerSatisfaction'] && (
                                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                                    <div className="text-3xl font-bold text-green-500 mb-2">{report.metrics.customerSatisfaction}/10</div>
                                    <div className="text-sm text-gray-600">Customer Satisfaction</div>
                                    <div className="text-xs text-gray-500 mt-1">Industry Leader</div>
                                  </div>
                                )}
                                {report['metrics']['marketPosition'] && (
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
                          {report['insights'] && report.insights.length > 0 && (
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
