import React, { useState } from 'react';
import { InlineEditField } from '../InlineEditField';

interface UniversalPerformanceTabProps {
  record: any;
  recordType: string;
  onSave?: (field: string, value: string, recordId?: string, recordType?: string) => Promise<void>;
}

export function UniversalPerformanceTab({ record, recordType, onSave }: UniversalPerformanceTabProps) {
  // Success message state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  return (
    <div className="p-6 space-y-8">
      {/* Performance Overview */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Performance Dashboard</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-primary/10 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Overall Score</h4>
            <InlineEditField
              value={record?.performanceScore ? `${Math.round(record.performanceScore)}/100` : ''}
              field="performanceScore"
              onSave={onSave}
              recordId={record.id}
              recordType={recordType}
              onSuccess={handleSuccess}
              placeholder="Enter performance score"
              className="text-2xl font-bold text-primary"
            />
            <p className="text-sm text-muted mt-1">Partnership performance</p>
          </div>
          
          <div className="bg-success/10 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Revenue</h4>
            <InlineEditField
              value={record?.partnerRevenue ? `$${record.partnerRevenue.toLocaleString()}` : ''}
              field="partnerRevenue"
              onSave={onSave}
              recordId={record.id}
              recordType={recordType}
              onSuccess={handleSuccess}
              placeholder="Enter partner revenue"
              className="text-lg font-bold text-success"
            />
            <p className="text-sm text-muted mt-1">This year</p>
          </div>
          
          <div className="bg-info/10 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Growth</h4>
            <InlineEditField
              value={record?.revenueGrowth ? `${Math.round(record.revenueGrowth)}%` : ''}
              field="revenueGrowth"
              onSave={onSave}
              recordId={record.id}
              recordType={recordType}
              onSuccess={handleSuccess}
              placeholder="Enter revenue growth"
              className="text-lg font-bold text-purple-600"
            />
            <p className="text-sm text-muted mt-1">Year over year</p>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Opportunities Closed</h4>
            <InlineEditField
              value={record?.dealsClosed}
              field="dealsClosed"
              onSave={onSave}
              recordId={record.id}
              recordType={recordType}
              onSuccess={handleSuccess}
              placeholder="Enter deals closed"
              className="text-2xl font-bold text-orange-600"
            />
            <p className="text-sm text-muted mt-1">This year</p>
          </div>
        </div>
      </div>

      {/* Sales Performance */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Sales Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-panel-background rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-3">Sales Metrics</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Pipeline Value:</span>
                <span className="font-medium text-foreground">
                  {record?.pipelineValue ? `$${record.pipelineValue.toLocaleString()}` : '$12.5M'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Win Rate:</span>
                <span className="font-medium text-foreground">{record?.winRate || '38%'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Average Deal Size:</span>
                <span className="font-medium text-foreground">
                  {record?.avgDealSize ? `$${record.avgDealSize.toLocaleString()}` : '$67K'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Sales Cycle:</span>
                <span className="font-medium text-foreground">{record?.avgSalesCycle || '4.2 months'}</span>
              </div>
            </div>
          </div>

          <div className="bg-panel-background rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-3">Activity Metrics</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Leads Generated:</span>
                <span className="font-medium text-foreground">{record?.leadsGenerated || '156'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Qualified Leads:</span>
                <span className="font-medium text-foreground">{record?.qualifiedLeads || '89'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Conversion Rate:</span>
                <span className="font-medium text-foreground">{record?.conversionRate || '57%'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Customer Meetings:</span>
                <span className="font-medium text-foreground">{record?.customerMeetings || '78'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Trends */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Performance Trends</h3>
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Quarterly Performance</h4>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <p className="text-muted">Q1</p>
                <p className="font-medium text-foreground">$580K</p>
                <p className="text-success text-xs">+12%</p>
              </div>
              <div className="text-center">
                <p className="text-muted">Q2</p>
                <p className="font-medium text-foreground">$720K</p>
                <p className="text-success text-xs">+24%</p>
              </div>
              <div className="text-center">
                <p className="text-muted">Q3</p>
                <p className="font-medium text-foreground">$890K</p>
                <p className="text-success text-xs">+23%</p>
              </div>
              <div className="text-center">
                <p className="text-muted">Q4</p>
                <p className="font-medium text-foreground">$610K</p>
                <p className="text-primary text-xs">Projected</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Key Performance Indicators</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted">Revenue Attainment:</span>
                  <span className="ml-2 font-medium text-success">
                  {record?.revenueAttainment || '112%'} of target
                </span>
              </div>
              <div>
                <span className="text-muted">Deal Velocity:</span>
                  <span className="ml-2 font-medium text-primary">
                  {record?.dealVelocityTrend || '15%'} improvement
                </span>
              </div>
              <div>
                <span className="text-muted">Customer Satisfaction:</span>
                <span className="ml-2 font-medium text-purple-600">
                  {record?.partnerCsat || '4.6/5.0'}
                </span>
              </div>
              <div>
                <span className="text-muted">Certification Level:</span>
                <span className="ml-2 font-medium text-orange-600">
                  {record?.certificationLevel || 'Gold Partner'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strengths & Opportunities */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Performance Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Key Strengths</label>
            <div className="space-y-2">
              {record?.keyStrengths?.length > 0 ? (
                record.keyStrengths.map((strength: string, index: number) => (
                  <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-800 text-sm">{strength}</p>
                  </div>
                ))
              ) : (
                <div className="space-y-2">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-800 text-sm">Strong Customer Relationships</p>
                    <p className="text-success text-xs">High trust and repeat business</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-800 text-sm">Technical Expertise</p>
                    <p className="text-success text-xs">Deep product knowledge and skills</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-800 text-sm">Market Penetration</p>
                    <p className="text-success text-xs">Strong presence in target segments</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Growth Opportunities</label>
            <div className="space-y-2">
              {record?.growthOpportunities?.length > 0 ? (
                record.growthOpportunities.map((opportunity: string, index: number) => (
                  <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-yellow-800 text-sm">{opportunity}</p>
                  </div>
                ))
              ) : (
                <div className="space-y-2">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-warning text-sm">Expand Service Offerings</p>
                    <p className="text-warning/80 text-xs">Add consulting and managed services</p>
                  </div>
                  <div className="bg-warning/10 border border-warning rounded-lg p-3">
                    <p className="text-warning text-sm">New Market Segments</p>
                    <p className="text-warning/80 text-xs">Target mid-market and SMB</p>
                  </div>
                  <div className="bg-warning/10 border border-warning rounded-lg p-3">
                    <p className="text-warning text-sm">Digital Marketing</p>
                    <p className="text-warning/80 text-xs">Enhance online presence and lead gen</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Support & Development */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Partner Development</h3>
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Training & Certification Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted">Sales Certification:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  record?.salesCertified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {record?.salesCertified ? 'Certified' : 'In Progress'}
                </span>
              </div>
              <div>
                <span className="text-muted">Technical Certification:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  record?.techCertified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {record?.techCertified ? 'Certified' : 'In Progress'}
                </span>
              </div>
              <div>
                <span className="text-muted">Last Training:</span>
                <span className="ml-2 font-medium text-foreground">
                  {record?.lastTrainingDate ? new Date(record.lastTrainingDate).toLocaleDateString() : 'Q3 2024'}
                </span>
              </div>
              <div>
                <span className="text-muted">Next Training:</span>
                <span className="ml-2 font-medium text-foreground">
                  {record?.nextTrainingDate ? new Date(record.nextTrainingDate).toLocaleDateString() : 'Q1 2025'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Support & Resources</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• Dedicated partner success manager assigned</p>
              <p>• Access to partner portal and resources</p>
              <p>• Technical support and escalation channels</p>
              <p>• Marketing development fund allocation: {record?.mdfAllocation || '$25K'}</p>
              <p>• Co-marketing opportunities and joint events</p>
            </div>
          </div>
        </div>
      </div>

      {/* Goals & Targets */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Goals & Targets</h3>
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-foreground mb-2">Current Year Targets</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Revenue Target:</span>
                  <span className="font-medium text-foreground">
                    {record?.revenueTarget ? `$${record.revenueTarget.toLocaleString()}` : '$3.2M'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Opportunities Target:</span>
                  <span className="font-medium text-foreground">{record?.dealsTarget || '55 opportunities'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">New Customers:</span>
                  <span className="font-medium text-foreground">{record?.newCustomersTarget || '35'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Progress to Goal:</span>
                  <span className="font-medium text-success">{record?.progressToGoal || '87%'}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-2">Strategic Objectives</h4>
              <div className="space-y-1 text-sm text-gray-700">
                <p>• Achieve Gold Partner status by Q4</p>
                <p>• Expand into healthcare vertical</p>
                <p>• Complete advanced technical certification</p>
                <p>• Launch managed services offering</p>
                <p>• Establish customer advisory board</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
