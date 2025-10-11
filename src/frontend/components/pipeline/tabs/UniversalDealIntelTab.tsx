interface UniversalDealIntelTabProps {
  record: any;
  recordType: string;
}

export function UniversalDealIntelTab({ record, recordType }: UniversalDealIntelTabProps) {
  const getStageColor = (stage: string) => {
    const stageLower = stage?.toLowerCase() || '';
    if (stageLower.includes('closed') && stageLower.includes('won')) return 'text-green-600';
    if (stageLower.includes('closed') && stageLower.includes('lost')) return 'text-red-600';
    if (stageLower.includes('negotiation') || stageLower.includes('proposal')) return 'text-blue-600';
    if (stageLower.includes('discovery') || stageLower.includes('qualification')) return 'text-yellow-600';
    return 'text-[var(--muted)]';
  };

  return (
    <div className="space-y-6">
      {/* Deal Overview */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Deal Intelligence</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Deal Value</h4>
            <div className="text-2xl font-bold text-blue-600">
              {record?.amount ? `$${record.amount.toLocaleString()}` : '-'}
            </div>
            <p className="text-sm text-[var(--muted)] mt-1">{record?.currency || 'USD'}</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Probability</h4>
            <div className="text-2xl font-bold text-green-600">
              {record?.probability ? `${Math.round(record.probability * 100)}%` : '-'}
            </div>
            <p className="text-sm text-[var(--muted)] mt-1">Close probability</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Stage</h4>
            <div className={`text-lg font-bold ${getStageColor(record?.stage)}`}>
              {record?.stage || '-'}
            </div>
            <p className="text-sm text-[var(--muted)] mt-1">Current deal stage</p>
          </div>
        </div>
      </div>

      {/* Timeline & Milestones */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Deal Timeline</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--panel-background)] rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Key Dates</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Created:</span>
                <span className="font-medium text-[var(--foreground)]">
                  {record?.createdAt ? new Date(record.createdAt).toLocaleDateString() : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Stage Entry:</span>
                <span className="font-medium text-[var(--foreground)]">
                  {record?.stageEntryDate ? new Date(record.stageEntryDate).toLocaleDateString() : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Expected Close:</span>
                <span className="font-medium text-[var(--foreground)]">
                  {record?.expectedCloseDate ? new Date(record.expectedCloseDate).toLocaleDateString() : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Predicted Close:</span>
                <span className="font-medium text-[var(--foreground)]">
                  {record?.predictedCloseDate ? new Date(record.predictedCloseDate).toLocaleDateString() : '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[var(--panel-background)] rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Activity Tracking</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Last Activity:</span>
                <span className="font-medium text-[var(--foreground)]">
                  {record?.lastActivityDate ? new Date(record.lastActivityDate).toLocaleDateString() : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Next Activity:</span>
                <span className="font-medium text-[var(--foreground)]">
                  {record?.nextActivityDate ? new Date(record.nextActivityDate).toLocaleDateString() : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Risk Score:</span>
                <span className="font-medium text-[var(--foreground)]">
                  {record?.riskScore ? `${Math.round(record.riskScore)}/100` : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Intelligence Analysis */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">AI-Powered Analysis</h3>
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Deal Analysis</h4>
            <p className="text-sm text-gray-700">
              {record?.dealAnalysis || 'AI analysis will be generated based on deal progression and stakeholder engagement patterns.'}
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Close Prediction</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-[var(--muted)]">Confidence:</span>
                <span className="ml-2 font-medium text-[var(--foreground)]">
                  {record?.closePredictionConfidence ? `${Math.round(record.closePredictionConfidence * 100)}%` : '-'}
                </span>
              </div>
              <div>
                <span className="text-sm text-[var(--muted)]">Reasoning:</span>
                <p className="text-sm text-gray-700 mt-1">
                  {record?.closePredictionReasoning || 'Prediction analysis will be generated based on deal progression.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Acceleration Opportunities */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Acceleration Opportunities</h3>
        <div className="space-y-2">
          {record?.accelerationOpportunities?.length > 0 ? (
            record.accelerationOpportunities.map((opportunity: string, index: number) => (
              <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-sm">{opportunity}</p>
              </div>
            ))
          ) : (
            <div className="bg-[var(--panel-background)] border border-[var(--border)] rounded-lg p-3">
              <p className="text-[var(--muted)] text-sm">No acceleration opportunities identified yet</p>
              <p className="text-[var(--muted)] text-xs mt-1">AI will identify opportunities as deal progresses</p>
            </div>
          )}
        </div>
      </div>

      {/* Next Steps */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Next Steps</h3>
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
          <div className="space-y-2 text-sm text-gray-700">
            <p><strong>Immediate:</strong> {record?.nextSteps || 'Follow up on proposal status'}</p>
            <p><strong>This Week:</strong> Schedule stakeholder alignment meeting</p>
            <p><strong>This Month:</strong> Complete technical evaluation and pricing</p>
            <p><strong>Strategic:</strong> Build champion coalition and address competitive threats</p>
          </div>
        </div>
      </div>
    </div>
  );
}
