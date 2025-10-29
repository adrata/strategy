import React, { useState } from 'react';
import { InlineEditField } from '../InlineEditField';

interface UniversalBusinessTabProps {
  record: any;
  recordType: string;
  onSave?: (field: string, value: string, recordId?: string, recordType?: string) => Promise<void>;
}

export function UniversalBusinessTab({ record, recordType, onSave }: UniversalBusinessTabProps) {
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
      {/* Business Overview */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Business Intelligence</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Account Value</h4>
            <InlineEditField
              value={record?.accountValue ? `$${record.accountValue.toLocaleString()}` : record?.revenue ? `$${record.revenue.toLocaleString()}` : ''}
              field="accountValue"
              onSave={onSave}
              recordId={record.id}
              recordType={recordType}
              onSuccess={handleSuccess}
              placeholder="Enter account value"
              className="text-2xl font-bold text-blue-600"
            />
            <p className="text-sm text-[var(--muted)] mt-1">Annual contract value</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Growth Rate</h4>
            <InlineEditField
              value={record?.growthRate ? `${Math.round(record.growthRate)}%` : ''}
              field="growthRate"
              onSave={onSave}
              recordId={record.id}
              recordType={recordType}
              onSuccess={handleSuccess}
              placeholder="Enter growth rate"
              className="text-2xl font-bold text-green-600"
            />
            <p className="text-sm text-[var(--muted)] mt-1">Year over year</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Expansion Potential</h4>
            <InlineEditField
              value={record?.expansionPotential}
              field="expansionPotential"
              onSave={onSave}
              recordId={record.id}
              recordType={recordType}
              onSuccess={handleSuccess}
              placeholder="Enter expansion potential"
              className="text-lg font-bold text-purple-600"
            />
            <p className="text-sm text-[var(--muted)] mt-1">Upsell opportunity</p>
          </div>
        </div>
      </div>

      {/* Business Challenges */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Business Challenges & Priorities</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Challenges</label>
            <div className="space-y-2">
              {record?.businessChallenges?.length > 0 ? (
                record.businessChallenges.map((challenge: string, index: number) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-sm">{challenge}</p>
                  </div>
                ))
              ) : (
                <div className="space-y-2">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-sm">Operational Efficiency</p>
                    <p className="text-red-600 text-xs">Streamlining processes and reducing costs</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-sm">Market Competition</p>
                    <p className="text-red-600 text-xs">Staying competitive in evolving market</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-sm">Technology Adoption</p>
                    <p className="text-red-600 text-xs">Keeping pace with digital transformation</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Priorities</label>
            <div className="space-y-2">
              {record?.businessPriorities?.length > 0 ? (
                record.businessPriorities.map((priority: string, index: number) => (
                  <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-800 text-sm">{priority}</p>
                  </div>
                ))
              ) : (
                <div className="space-y-2">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-800 text-sm">Revenue Growth</p>
                    <p className="text-green-600 text-xs">Expanding market share and customer base</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-800 text-sm">Customer Experience</p>
                    <p className="text-green-600 text-xs">Improving customer satisfaction and retention</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-800 text-sm">Innovation</p>
                    <p className="text-green-600 text-xs">Developing new products and services</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Industry Context */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Industry Context</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--panel-background)] rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Company Profile</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Industry:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.industry || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Company Size:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.size || record?.companySize || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Revenue Range:</span>
                <span className="font-medium text-[var(--foreground)]">
                  {record?.revenue ? `$${record.revenue.toLocaleString()}` : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Market Position:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.marketPosition || 'Established'}</span>
              </div>
            </div>
          </div>

          <div className="bg-[var(--panel-background)] rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Decision Making</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Budget Cycle:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.budgetCycle || 'Annual'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Approval Process:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.approvalProcess || 'Committee'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Decision Timeline:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.decisionTimeline || '3-6 months'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Key Influencers:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.keyInfluencers || 'C-Level'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Initiatives */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Strategic Initiatives</h3>
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Current Initiatives</h4>
            <div className="space-y-2 text-sm text-gray-700">
              {record?.strategicInitiatives?.length > 0 ? (
                record.strategicInitiatives.map((initiative: string, index: number) => (
                  <p key={index}>• {initiative}</p>
                ))
              ) : (
                <div>
                  <p>• Digital transformation and automation</p>
                  <p>• Customer experience enhancement</p>
                  <p>• Market expansion and growth</p>
                  <p>• Operational efficiency improvements</p>
                  <p className="text-[var(--muted)] italic mt-2">Ask about current strategic projects</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Success Metrics</h4>
            <div className="space-y-2 text-sm text-gray-700">
              {record?.successMetrics?.length > 0 ? (
                record.successMetrics.map((metric: string, index: number) => (
                  <p key={index}>• {metric}</p>
                ))
              ) : (
                <div>
                  <p>• Revenue growth and profitability</p>
                  <p>• Customer satisfaction and retention</p>
                  <p>• Operational efficiency gains</p>
                  <p>• Market share expansion</p>
                  <p className="text-[var(--muted)] italic mt-2">Understand how they measure success</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Competitive Landscape */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Competitive Position</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Competitive Advantages</h4>
            <div className="space-y-1 text-sm text-green-700">
              <p>• {record?.competitiveAdvantages?.[0] || 'Market leadership'}</p>
              <p>• {record?.competitiveAdvantages?.[1] || 'Innovation capability'}</p>
              <p>• {record?.competitiveAdvantages?.[2] || 'Customer relationships'}</p>
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Market Threats</h4>
            <div className="space-y-1 text-sm text-yellow-700">
              <p>• {record?.marketThreats?.[0] || 'New market entrants'}</p>
              <p>• {record?.marketThreats?.[1] || 'Technology disruption'}</p>
              <p>• {record?.marketThreats?.[2] || 'Economic factors'}</p>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Growth Opportunities</h4>
            <div className="space-y-1 text-sm text-blue-700">
              <p>• {record?.growthOpportunities?.[0] || 'Market expansion'}</p>
              <p>• {record?.growthOpportunities?.[1] || 'Product innovation'}</p>
              <p>• {record?.growthOpportunities?.[2] || 'Strategic partnerships'}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
