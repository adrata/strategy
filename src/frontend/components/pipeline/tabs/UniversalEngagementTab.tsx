interface UniversalEngagementTabProps {
  record: any;
  recordType: string;
  onSave?: (field: string, value: string, recordId?: string, recordType?: string) => Promise<void>;
}

export function UniversalEngagementTab({ record, recordType, onSave }: UniversalEngagementTabProps) {
  return (
    <div className="p-6 space-y-8">
      {/* Engagement Overview */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Engagement Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-primary/10 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Engagement Level</h4>
            <div className={`text-2xl font-bold ${
              record?.engagementLevel === 'high' ? 'text-success' :
              record?.engagementLevel === 'medium' ? 'text-warning' :
              record?.engagementLevel === 'low' ? 'text-error' :
              'text-muted'
            }`}>
              {record?.engagementLevel || '-'}
            </div>
            <p className="text-sm text-muted mt-1">Current engagement status</p>
          </div>
          
          <div className="bg-success/10 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Response Rate</h4>
            <div className="text-2xl font-bold text-success">
              {record?.responseRate ? `${Math.round(record.responseRate * 100)}%` : '-'}
            </div>
            <p className="text-sm text-muted mt-1">Email/call response rate</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Touch Points</h4>
            <div className="text-2xl font-bold text-purple-600">
              {record?.touchPointsCount || 0}
            </div>
            <p className="text-sm text-muted mt-1">Total interactions</p>
          </div>
        </div>
      </div>

      {/* Communication Preferences */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Communication Intelligence</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-panel-background rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-3">Preferences</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Preferred Channel:</span>
                <span className="font-medium text-foreground">
                  {record?.email ? 'Email' : record?.phone ? 'Phone' : 'LinkedIn'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Response Time:</span>
                <span className="font-medium text-foreground">
                  {record?.avgResponseTime ? `${Math.round(record.avgResponseTime)} hours` : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Language:</span>
                <span className="font-medium text-foreground">
                  {record?.preferredLanguage || 'English'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Timezone:</span>
                <span className="font-medium text-foreground">
                  {record?.timezone || '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-panel-background rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-3">Engagement History</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Last Contact:</span>
                <span className="font-medium text-foreground">
                  {record?.lastContactDate ? new Date(record.lastContactDate).toLocaleDateString() : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Next Follow-up:</span>
                <span className="font-medium text-foreground">
                  {record?.nextFollowUpDate ? new Date(record.nextFollowUpDate).toLocaleDateString() : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Engagement Score:</span>
                <span className="font-medium text-foreground">
                  {record?.engagementScore || '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buying Signals */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Buying Signals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Detected Signals</label>
            <div className="space-y-2">
              {record?.buyingSignals?.length > 0 ? (
                record.buyingSignals.slice(0, 4).map((signal: string, index: number) => (
                  <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-800 text-sm">{signal}</p>
                  </div>
                ))
              ) : (
                <div className="bg-panel-background border border-border rounded-lg p-3">
                  <p className="text-muted text-sm">No buying signals detected yet</p>
                  <p className="text-muted text-xs mt-1">Continue engagement to identify signals</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pain Points</label>
            <div className="space-y-2">
              {record?.painPoints?.length > 0 ? (
                record.painPoints.slice(0, 4).map((pain: string, index: number) => (
                  <div key={index} className="bg-error/10 border border-error rounded-lg p-3">
                    <p className="text-error text-sm">{pain}</p>
                  </div>
                ))
              ) : (
                <div className="bg-panel-background border border-border rounded-lg p-3">
                  <p className="text-muted text-sm">No pain points identified yet</p>
                  <p className="text-muted text-xs mt-1">Discover through qualification</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Qualification Status */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Qualification Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-panel-background rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-3">BANT Qualification</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Budget:</span>
                <span className="font-medium text-foreground">
                  {record?.budget ? `$${record.budget.toLocaleString()}` : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Authority:</span>
                <span className="font-medium text-foreground">
                  {record?.authority || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Need:</span>
                <span className="font-medium text-foreground">
                  {record?.needUrgency || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Timeline:</span>
                <span className="font-medium text-foreground">
                  {record?.timeline || '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-panel-background rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-3">Qualification Status</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Marketing Qualified</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  record?.marketingQualified 
                    ? (recordType === 'speedrun' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800')
                    : 'bg-hover text-muted'
                }`}>
                  {record?.marketingQualified ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Sales Qualified</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  record?.salesQualified 
                    ? (recordType === 'speedrun' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800')
                    : 'bg-hover text-muted'
                }`}>
                  {record?.salesQualified ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
