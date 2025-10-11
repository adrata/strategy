interface UniversalPainValueTabProps {
  record: any;
  recordType: string;
}

export function UniversalPainValueTab({ record, recordType }: UniversalPainValueTabProps) {
  const getValueColor = (value: number | null) => {
    if (!value) return 'text-[var(--muted)]';
    if (value >= 100000) return 'text-green-600';
    if (value >= 50000) return 'text-blue-600';
    return 'text-orange-600';
  };

  return (
    <div className="p-6 space-y-8">
      {/* Pain Points & Buying Signals */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Pain Points & Buying Signals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Identified Pain Points</label>
            <div className="space-y-2">
              {record?.painPoints?.length > 0 ? (
                record.painPoints.slice(0, 3).map((pain: string, index: number) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-sm">{pain}</p>
                  </div>
                ))
              ) : (
                <div className="bg-[var(--panel-background)] border border-[var(--border)] rounded-lg p-3">
                  <p className="text-[var(--muted)] text-sm">No pain points identified yet</p>
                  <p className="text-[var(--muted)] text-xs mt-1">Discover through qualification</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buying Signals</label>
            <div className="space-y-2">
              {record?.buyingSignals?.length > 0 ? (
                record.buyingSignals.slice(0, 3).map((signal: string, index: number) => (
                  <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-800 text-sm">{signal}</p>
                  </div>
                ))
              ) : (
                <div className="bg-[var(--panel-background)] border border-[var(--border)] rounded-lg p-3">
                  <p className="text-[var(--muted)] text-sm">No buying signals detected</p>
                  <p className="text-[var(--muted)] text-xs mt-1">Monitor engagement for signals</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Value Proposition */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Value Proposition</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[var(--panel-background)] rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Estimated Value</h4>
            <div className={`text-2xl font-bold ${getValueColor(record?.estimatedValue)}`}>
              {record?.estimatedValue ? `$${record.estimatedValue.toLocaleString()}` : '-'}
            </div>
            <p className="text-sm text-[var(--muted)] mt-1">{record?.currency || 'USD'}</p>
          </div>
          
          <div className="bg-[var(--panel-background)] rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Qualification</h4>
            <div className="space-y-1">
              <div className={`text-xs px-2 py-1 rounded ${
                record?.marketingQualified ? 'bg-green-100 text-green-800' : 'bg-[var(--hover)] text-[var(--muted)]'
              }`}>
                MQL: {record?.marketingQualified ? 'Yes' : 'No'}
              </div>
              <div className={`text-xs px-2 py-1 rounded ${
                record?.salesQualified ? 'bg-green-100 text-green-800' : 'bg-[var(--hover)] text-[var(--muted)]'
              }`}>
                SQL: {record?.salesQualified ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
          
          <div className="bg-[var(--panel-background)] rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Decision Criteria</h4>
            <div className="space-y-1 text-xs">
              <div>Budget: {record?.budget ? `$${record.budget.toLocaleString()}` : '-'}</div>
              <div>Authority: {record?.authority || '-'}</div>
              <div>Need: {record?.needUrgency || '-'}</div>
              <div>Timeline: {record?.timeline || '-'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Impact */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Business Impact</h3>
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-medium text-[var(--foreground)] mb-3">Tailored Value Proposition</h4>
          <div className="space-y-2 text-sm text-gray-700">
            <p>• <strong>Role Impact:</strong> Help {record?.jobTitle || 'this role'} streamline operations and reduce manual work</p>
            <p>• <strong>Company Value:</strong> Enable {record?.company || 'the company'} to improve {record?.industry || 'industry'} competitiveness</p>
            <p>• <strong>Department Win:</strong> Position {record?.department || 'the team'} as efficiency leaders</p>
            <p>• <strong>Personal Success:</strong> Drive measurable results and career advancement</p>
          </div>
        </div>
      </div>

      {/* Interests & Competitor Intelligence */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Intelligence</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
            <div className="space-y-2">
              {record?.interests?.length > 0 ? (
                record.interests.slice(0, 3).map((interest: string, index: number) => (
                  <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <p className="text-purple-800 text-sm">{interest}</p>
                  </div>
                ))
              ) : (
                <div className="bg-[var(--panel-background)] border border-[var(--border)] rounded-lg p-3">
                  <p className="text-[var(--muted)] text-sm">No interests captured</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Competitor Mentions</label>
            <div className="space-y-2">
              {record?.competitorMentions?.length > 0 ? (
                record.competitorMentions.slice(0, 3).map((competitor: string, index: number) => (
                  <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-yellow-800 text-sm">{competitor}</p>
                  </div>
                ))
              ) : (
                <div className="bg-[var(--panel-background)] border border-[var(--border)] rounded-lg p-3">
                  <p className="text-[var(--muted)] text-sm">No competitors mentioned</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
