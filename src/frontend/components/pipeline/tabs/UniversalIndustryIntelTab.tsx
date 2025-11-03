interface UniversalIndustryIntelTabProps {
  record: any;
  recordType: string;
  onSave?: (field: string, value: string, recordId?: string, recordType?: string) => Promise<void>;
}

export function UniversalIndustryIntelTab({ record, recordType, onSave }: UniversalIndustryIntelTabProps) {
  return (
    <div className="space-y-6">
      {/* Industry Overview */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Industry Intelligence</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-primary/10 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-3">Industry Profile</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Industry:</span>
                <span className="font-medium text-foreground">{record?.industry || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Vertical:</span>
                <span className="font-medium text-foreground">{record?.vertical || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Company Size:</span>
                <span className="font-medium text-foreground">{record?.companySize || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Sector:</span>
                <span className="font-medium text-foreground">{record?.sector || '-'}</span>
              </div>
            </div>
          </div>

          <div className="bg-success/10 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-3">Market Position</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Revenue Range:</span>
                <span className="font-medium text-foreground">
                  {record?.revenue ? `$${record.revenue.toLocaleString()}` : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Market Tier:</span>
                <span className="font-medium text-foreground">{record?.tier || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Growth Stage:</span>
                <span className="font-medium text-foreground">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Competitive Position:</span>
                <span className="font-medium text-foreground">-</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Industry Challenges */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Industry Challenges & Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Common Industry Pain Points</label>
            <div className="space-y-2">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm font-medium">Operational Efficiency</p>
                <p className="text-red-600 text-xs">Manual processes and legacy systems</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm font-medium">Data Management</p>
                <p className="text-red-600 text-xs">Fragmented data across multiple systems</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm font-medium">Compliance & Security</p>
                <p className="text-red-600 text-xs">Increasing regulatory requirements</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Industry Trends</label>
            <div className="space-y-2">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm font-medium">Digital Transformation</p>
                <p className="text-blue-600 text-xs">Accelerated adoption of cloud solutions</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm font-medium">AI & Automation</p>
                <p className="text-blue-600 text-xs">Increasing investment in intelligent automation</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm font-medium">Customer Experience</p>
                <p className="text-blue-600 text-xs">Focus on omnichannel experiences</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conversation Starters */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Industry-Specific Conversation Starters</h3>
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
          <h4 className="font-medium text-foreground mb-3">Intelligent Talking Points</h4>
          <div className="space-y-2 text-sm text-gray-700">
            <p>• "How is {record?.company || 'your company'} handling the recent changes in {record?.industry || 'your industry'} regulations?"</p>
            <p>• "What's your biggest challenge with {record?.industry || 'industry'}-specific compliance requirements?"</p>
            <p>• "How are you managing data integration across your {record?.industry || 'industry'} systems?"</p>
            <p>• "What's driving digital transformation initiatives in your {record?.department || 'department'}?"</p>
            <p>• "How do you see AI impacting {record?.industry || 'your industry'} in the next 2-3 years?"</p>
          </div>
        </div>
      </div>

      {/* Competitive Landscape */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Competitive Landscape</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-panel-background rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Market Leaders</h4>
            <div className="space-y-1 text-sm text-muted">
              <p>Industry-specific leaders</p>
              <p>Based on {record?.industry || 'industry'} analysis</p>
            </div>
          </div>
          
          <div className="bg-panel-background rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Emerging Players</h4>
            <div className="space-y-1 text-sm text-muted">
              <p>Disruptive technologies</p>
              <p>New market entrants</p>
            </div>
          </div>
          
          <div className="bg-panel-background rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Solution Categories</h4>
            <div className="space-y-1 text-sm text-muted">
              <p>Technology stack</p>
              <p>Vendor ecosystem</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
