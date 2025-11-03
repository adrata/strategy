"use client";

import React from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';
import { CompanyDetailSkeleton } from '@/platform/ui/components/Loader';

interface UniversalEnablersTabProps {
  recordType: string;
  record?: any;
  onSave?: (field: string, value: any, recordId: string) => Promise<void>;
}

export function UniversalEnablersTab({ recordType, record: recordProp, onSave }: UniversalEnablersTabProps) {
  const { currentRecord: contextRecord } = useRecordContext();
  const record = recordProp || contextRecord;

  // Show skeleton loader while data is loading
  if (!record) {
    return <CompanyDetailSkeleton message="Loading enablers and reports..." />;
  }

  // Debug: Log the record structure to see what's available
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [Enablers Tab Debug] Record structure:', {
      record: record,
      customFields: record?.customFields,
      company: record?.company
    });
  }

  return (
    <div className="space-y-8">
      {/* Deep Value Reports Section */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Deep Value Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Competitive Reports */}
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Competitive Intelligence</h4>
            <div className="space-y-2">
              <a 
                href="/demo/zeropoint/paper/adp-competitive-deep-value-01K4VM894JE1BWD2TA3FZCNKCK"
                className="block p-3 bg-panel-background rounded-md hover:bg-hover transition-colors"
              >
                <div className="text-sm font-medium text-foreground">ADP Competitive Deep Value Report</div>
                <div className="text-xs text-muted mt-1">52-page competitive intelligence analysis</div>
              </a>
              <a 
                href="/demo/zeropoint/paper/workday-market-analysis-01K4VM894JE1BWD2TA3FZCNKCK"
                className="block p-3 bg-panel-background rounded-md hover:bg-hover transition-colors"
              >
                <div className="text-sm font-medium text-foreground">Workday Market Analysis Report</div>
                <div className="text-xs text-muted mt-1">Market positioning and growth opportunities</div>
              </a>
            </div>
          </div>

          {/* Market Reports */}
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Market Intelligence</h4>
            <div className="space-y-2">
              <a 
                href="/demo/zeropoint/paper/hr-tech-market-trends-01K4VM894JE1BWD2TA3FZCNKCK"
                className="block p-3 bg-panel-background rounded-md hover:bg-hover transition-colors"
              >
                <div className="text-sm font-medium text-foreground">HR Tech Market Trends</div>
                <div className="text-xs text-muted mt-1">Industry growth and emerging technologies</div>
              </a>
              <a 
                href="/demo/zeropoint/paper/enterprise-hr-landscape-01K4VM894JE1BWD2TA3FZCNKCK"
                className="block p-3 bg-panel-background rounded-md hover:bg-hover transition-colors"
              >
                <div className="text-sm font-medium text-foreground">Enterprise HR Landscape</div>
                <div className="text-xs text-muted mt-1">Market segmentation and opportunities</div>
              </a>
            </div>
          </div>

          {/* Buyer Group Reports */}
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Buyer Group Intelligence</h4>
            <div className="space-y-2">
              <a 
                href="/demo/zeropoint/paper/adp-buyer-group-intel-01K4VM894JE1BWD2TA3FZCNKCK"
                className="block p-3 bg-panel-background rounded-md hover:bg-hover transition-colors"
              >
                <div className="text-sm font-medium text-foreground">ADP Buyer Group Intelligence</div>
                <div className="text-xs text-muted mt-1">Key decision makers and influencers</div>
              </a>
              <a 
                href="/demo/zeropoint/paper/enterprise-procurement-process-01K4VM894JE1BWD2TA3FZCNKCK"
                className="block p-3 bg-panel-background rounded-md hover:bg-hover transition-colors"
              >
                <div className="text-sm font-medium text-foreground">Enterprise Procurement Process</div>
                <div className="text-xs text-muted mt-1">Decision-making workflow analysis</div>
              </a>
            </div>
          </div>

          {/* Industry Analysis */}
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Industry Analysis</h4>
            <div className="space-y-2">
              <a 
                href="/demo/zeropoint/paper/hr-technology-industry-trends-01K4VM894JE1BWD2TA3FZCNKCK"
                className="block p-3 bg-panel-background rounded-md hover:bg-hover transition-colors"
              >
                <div className="text-sm font-medium text-foreground">HR Technology Industry Trends</div>
                <div className="text-xs text-muted mt-1">Latest trends and developments</div>
              </a>
              <a 
                href="/demo/zeropoint/paper/ai-automation-impact-01K4VM894JE1BWD2TA3FZCNKCK"
                className="block p-3 bg-panel-background rounded-md hover:bg-hover transition-colors"
              >
                <div className="text-sm font-medium text-foreground">AI & Automation Impact</div>
                <div className="text-xs text-muted mt-1">Technology disruption analysis</div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Tools */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Engagement Tools</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Email Templates</h4>
            <div className="space-y-2">
              <button className="w-full text-left p-3 bg-primary/10 rounded-md hover:bg-primary/20 transition-colors">
                <div className="text-sm font-medium text-primary">Initial Outreach Template</div>
                <div className="text-xs text-primary/80 mt-1">Professional introduction and value proposition</div>
              </button>
              <button className="w-full text-left p-3 bg-primary/10 rounded-md hover:bg-primary/20 transition-colors">
                <div className="text-sm font-medium text-primary">Follow-up Template</div>
                <div className="text-xs text-primary/80 mt-1">Nurture relationship and provide value</div>
              </button>
              <button className="w-full text-left p-3 bg-primary/10 rounded-md hover:bg-primary/20 transition-colors">
                <div className="text-sm font-medium text-primary">Meeting Request Template</div>
                <div className="text-xs text-primary/80 mt-1">Schedule discovery or demo calls</div>
              </button>
            </div>
          </div>

          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Call Scripts</h4>
            <div className="space-y-2">
              <button className="w-full text-left p-3 bg-green-50 rounded-md hover:bg-green-100 transition-colors">
                <div className="text-sm font-medium text-green-900">Discovery Call Script</div>
                <div className="text-xs text-green-600 mt-1">Qualify needs and pain points</div>
              </button>
              <button className="w-full text-left p-3 bg-green-50 rounded-md hover:bg-green-100 transition-colors">
                <div className="text-sm font-medium text-green-900">Demo Call Script</div>
                <div className="text-xs text-green-600 mt-1">Present solution and benefits</div>
              </button>
              <button className="w-full text-left p-3 bg-green-50 rounded-md hover:bg-green-100 transition-colors">
                <div className="text-sm font-medium text-green-900">Objection Handling Script</div>
                <div className="text-xs text-green-600 mt-1">Address common concerns</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Value Propositions */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Value Propositions</h3>
        <div className="bg-background p-4 rounded-lg border border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">30%</div>
              <div className="text-sm font-medium text-blue-900">Faster Implementation</div>
              <div className="text-xs text-blue-600 mt-1">Reduce time-to-value</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-2">50%</div>
              <div className="text-sm font-medium text-green-900">Cost Reduction</div>
              <div className="text-xs text-green-600 mt-1">Lower operational costs</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-2">95%</div>
              <div className="text-sm font-medium text-purple-900">Customer Satisfaction</div>
              <div className="text-xs text-purple-600 mt-1">Proven track record</div>
            </div>
          </div>
        </div>
      </div>

      {/* Case Studies */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Case Studies</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-2">Enterprise Success Story</h4>
            <p className="text-sm text-muted mb-3">
              How we helped a Fortune 500 company reduce costs by 40% and improve efficiency.
            </p>
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Read Full Case Study →
            </button>
          </div>
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-2">Mid-Market Transformation</h4>
            <p className="text-sm text-muted mb-3">
              A mid-size company's journey to digital transformation and 60% productivity gains.
            </p>
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Read Full Case Study →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
