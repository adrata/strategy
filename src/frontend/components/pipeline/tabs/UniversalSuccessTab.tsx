import React, { useState } from 'react';
import { InlineEditField } from '../InlineEditField';

interface UniversalSuccessTabProps {
  record: any;
  recordType: string;
  onSave?: (field: string, value: string, recordId?: string, recordType?: string) => Promise<void>;
}

export function UniversalSuccessTab({ record, recordType, onSave }: UniversalSuccessTabProps) {
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
      {/* Success Metrics Overview */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Success Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Health Score</h4>
            <InlineEditField
              value={record?.healthScore ? `${Math.round(record.healthScore)}/100` : ''}
              field="healthScore"
              onSave={onSave || (() => Promise.resolve())}
              recordId={record.id}
              recordType={recordType}
              onSuccess={handleSuccess}
              placeholder="Enter health score"
              className="text-2xl font-bold text-green-600"
            />
            <p className="text-sm text-[var(--muted)] mt-1">Overall account health</p>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">ROI Achieved</h4>
            <InlineEditField
              value={record?.roiAchieved ? `${Math.round(record.roiAchieved)}%` : ''}
              field="roiAchieved"
              onSave={onSave || (() => Promise.resolve())}
              recordId={record.id}
              recordType={recordType}
              onSuccess={handleSuccess}
              placeholder="Enter ROI achieved"
              className="text-2xl font-bold text-blue-600"
            />
            <p className="text-sm text-[var(--muted)] mt-1">Return on investment</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Time to Value</h4>
            <InlineEditField
              value={record?.timeToValue ? `${record.timeToValue} days` : ''}
              field="timeToValue"
              onSave={onSave || (() => Promise.resolve())}
              recordId={record.id}
              recordType={recordType}
              onSuccess={handleSuccess}
              placeholder="Enter time to value"
              className="text-lg font-bold text-purple-600"
            />
            <p className="text-sm text-[var(--muted)] mt-1">Initial value realization</p>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Key Performance Indicators</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--panel-background)] rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Usage Metrics</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Daily Active Users:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.dailyActiveUsers || '127'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Feature Adoption:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.featureAdoption ? `${Math.round(record.featureAdoption)}%` : '78%'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Login Frequency:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.loginFrequency || 'Daily'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Support Tickets:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.supportTickets || '3/month'}</span>
              </div>
            </div>
          </div>

          <div className="bg-[var(--panel-background)] rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Business Impact</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Cost Savings:</span>
                <span className="font-medium text-green-600">
                  {record?.costSavings ? `$${record.costSavings.toLocaleString()}` : '$125,000'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Efficiency Gain:</span>
                <span className="font-medium text-blue-600">{record?.efficiencyGain ? `${Math.round(record.efficiencyGain)}%` : '35%'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Revenue Impact:</span>
                <span className="font-medium text-green-600">
                  {record?.revenueImpact ? `$${record.revenueImpact.toLocaleString()}` : '$450,000'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Time Saved:</span>
                <span className="font-medium text-purple-600">{record?.timeSaved || '20 hrs/week'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Milestones */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Success Milestones</h3>
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-green-800">Initial Implementation Complete</p>
                <p className="text-green-600 text-sm">Successfully deployed and configured</p>
              </div>
              <span className="text-green-600 text-sm">
                {record?.implementationDate ? new Date(record.implementationDate).toLocaleDateString() : 'Q1 2024'}
              </span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-blue-800">First Value Realization</p>
                <p className="text-blue-600 text-sm">Achieved measurable business impact</p>
              </div>
              <span className="text-blue-600 text-sm">
                {record?.firstValueDate ? new Date(record.firstValueDate).toLocaleDateString() : 'Q2 2024'}
              </span>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-purple-800">Full Adoption Achieved</p>
                <p className="text-purple-600 text-sm">All planned users actively engaged</p>
              </div>
              <span className="text-purple-600 text-sm">
                {record?.fullAdoptionDate ? new Date(record.fullAdoptionDate).toLocaleDateString() : 'Q3 2024'}
              </span>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-orange-800">Expansion Opportunity</p>
                <p className="text-orange-600 text-sm">Ready for additional modules or users</p>
              </div>
              <span className="text-orange-600 text-sm">
                {record?.expansionReadyDate ? new Date(record.expansionReadyDate).toLocaleDateString() : 'Q4 2024'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Plan */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Success Plan</h3>
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">90-Day Goals</h4>
            <div className="space-y-2 text-sm text-gray-700">
              {record?.ninetyDayGoals?.length > 0 ? (
                record.ninetyDayGoals.map((goal: string, index: number) => (
                  <p key={index}>• {goal}</p>
                ))
              ) : (
                <div>
                  <p>• Increase user adoption to 90%</p>
                  <p>• Complete advanced feature training</p>
                  <p>• Achieve target ROI metrics</p>
                  <p>• Identify expansion opportunities</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Annual Objectives</h4>
            <div className="space-y-2 text-sm text-gray-700">
              {record?.annualObjectives?.length > 0 ? (
                record.annualObjectives.map((objective: string, index: number) => (
                  <p key={index}>• {objective}</p>
                ))
              ) : (
                <div>
                  <p>• Achieve 300% ROI on investment</p>
                  <p>• Expand to additional departments</p>
                  <p>• Become a reference customer</p>
                  <p>• Integrate with additional systems</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Risk Assessment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Success Risks</label>
            <div className="space-y-2">
              {record?.successRisks?.length > 0 ? (
                record.successRisks.map((risk: string, index: number) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-sm">{risk}</p>
                  </div>
                ))
              ) : (
                <div className="bg-[var(--panel-background)] border border-[var(--border)] rounded-lg p-3">
                  <p className="text-[var(--muted)] text-sm">Low risk - strong adoption and engagement</p>
                  <p className="text-[var(--muted)] text-xs mt-1">Continue monitoring usage patterns</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mitigation Strategies</label>
            <div className="space-y-2">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm">Regular check-ins and training</p>
                <p className="text-green-600 text-xs">Proactive support and guidance</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm">Success metrics monitoring</p>
                <p className="text-green-600 text-xs">Track KPIs and intervene early</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm">Executive relationship building</p>
                <p className="text-green-600 text-xs">Maintain C-level engagement</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Renewal & Expansion */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Renewal & Expansion</h3>
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-[var(--foreground)] mb-2">Renewal Outlook</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Renewal Date:</span>
                  <span className="font-medium text-[var(--foreground)]">
                    {record?.renewalDate ? new Date(record.renewalDate).toLocaleDateString() : 'Dec 2024'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Renewal Probability:</span>
                  <span className="font-medium text-green-600">
                    {record?.renewalProbability ? `${Math.round(record.renewalProbability)}%` : '95%'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Contract Value:</span>
                  <span className="font-medium text-[var(--foreground)]">
                    {record?.contractValue ? `$${record.contractValue.toLocaleString()}` : '$180,000'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-[var(--foreground)] mb-2">Expansion Opportunities</h4>
              <div className="space-y-1 text-sm text-gray-700">
                <p>• Additional user licenses (50+ users)</p>
                <p>• Advanced analytics module</p>
                <p>• Professional services engagement</p>
                <p>• Integration with new systems</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
