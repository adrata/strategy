interface UniversalCollaborationTabProps {
  record: any;
  recordType: string;
}

export function UniversalCollaborationTab({ record, recordType }: UniversalCollaborationTabProps) {
  return (
    <div className="p-6 space-y-8">
      {/* Active Collaborations */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Active Collaborations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Joint Opportunities</h4>
            <div className="text-2xl font-bold text-blue-600">
              {record?.activeOpportunities || '12'}
            </div>
            <p className="text-sm text-[var(--muted)] mt-1">In pipeline</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Joint Revenue</h4>
            <div className="text-lg font-bold text-green-600">
              {record?.jointRevenue ? `$${record.jointRevenue.toLocaleString()}` : '$2.4M'}
            </div>
            <p className="text-sm text-[var(--muted)] mt-1">This year</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Projects</h4>
            <div className="text-2xl font-bold text-purple-600">
              {record?.activeProjects || '8'}
            </div>
            <p className="text-sm text-[var(--muted)] mt-1">In progress</p>
          </div>
        </div>
      </div>

      {/* Collaboration Areas */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Collaboration Focus Areas</h3>
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Go-to-Market Collaboration</h4>
            <div className="space-y-2 text-sm text-gray-700">
              {record?.goToMarketAreas?.length > 0 ? (
                record.goToMarketAreas.map((area: string, index: number) => (
                  <p key={index}>• {area}</p>
                ))
              ) : (
                <div>
                  <p>• Joint sales campaigns and lead generation</p>
                  <p>• Co-marketing initiatives and events</p>
                  <p>• Shared customer success programs</p>
                  <p>• Market expansion into new territories</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Technical Collaboration</h4>
            <div className="space-y-2 text-sm text-gray-700">
              {record?.technicalAreas?.length > 0 ? (
                record.technicalAreas.map((area: string, index: number) => (
                  <p key={index}>• {area}</p>
                ))
              ) : (
                <div>
                  <p>• Product integration and API development</p>
                  <p>• Joint solution architecture and design</p>
                  <p>• Technical training and certification</p>
                  <p>• Innovation labs and proof of concepts</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Joint Initiatives */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Joint Initiatives</h3>
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-green-800">Q4 Enterprise Campaign</p>
                <p className="text-green-600 text-sm">Joint outreach to Fortune 500 accounts</p>
                <p className="text-green-500 text-xs mt-1">Target: $5M pipeline</p>
              </div>
              <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-blue-800">Product Integration Project</p>
                <p className="text-blue-600 text-sm">Native API integration development</p>
                <p className="text-blue-500 text-xs mt-1">Timeline: 6 months</p>
              </div>
              <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                In Progress
              </span>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-purple-800">Industry Summit Co-Sponsorship</p>
                <p className="text-purple-600 text-sm">Joint presence at major industry event</p>
                <p className="text-purple-500 text-xs mt-1">Investment: $150K shared</p>
              </div>
              <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                Planning
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Communication & Meetings */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Communication Cadence</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--panel-background)] rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Regular Meetings</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Executive Reviews:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.executiveReviewFreq || 'Quarterly'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Business Reviews:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.businessReviewFreq || 'Monthly'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Technical Sync:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.technicalSyncFreq || 'Bi-weekly'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Sales Alignment:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.salesAlignmentFreq || 'Weekly'}</span>
              </div>
            </div>
          </div>

          <div className="bg-[var(--panel-background)] rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Communication Channels</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Primary Channel:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.primaryCommChannel || 'Slack/Teams'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Project Management:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.projectMgmtTool || 'Asana'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Document Sharing:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.documentSharing || 'Google Drive'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">CRM Integration:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.crmIntegration || 'Salesforce'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shared Resources */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Shared Resources & Assets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Marketing Assets</label>
            <div className="space-y-2">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">Joint Solution Briefs</p>
                <p className="text-blue-600 text-xs">Co-branded marketing materials</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">Case Studies & References</p>
                <p className="text-blue-600 text-xs">Shared customer success stories</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">Demo Environments</p>
                <p className="text-blue-600 text-xs">Joint solution demonstrations</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sales Resources</label>
            <div className="space-y-2">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm">Joint Playbooks</p>
                <p className="text-green-600 text-xs">Shared sales methodologies</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm">Competitive Battle Cards</p>
                <p className="text-green-600 text-xs">Combined competitive intelligence</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm">Pricing & Packaging</p>
                <p className="text-green-600 text-xs">Joint offering structures</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Collaboration Success Metrics</h3>
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-[var(--foreground)] mb-2">Performance Indicators</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Joint Pipeline:</span>
                  <span className="font-medium text-green-600">
                    {record?.jointPipeline ? `$${record.jointPipeline.toLocaleString()}` : '$8.5M'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Win Rate:</span>
                  <span className="font-medium text-green-600">{record?.jointWinRate || '45%'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Deal Velocity:</span>
                  <span className="font-medium text-blue-600">{record?.dealVelocity || '15% faster'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Customer Satisfaction:</span>
                  <span className="font-medium text-blue-600">{record?.jointCsat || '4.7/5'}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-[var(--foreground)] mb-2">Growth Targets</h4>
              <div className="space-y-1 text-sm text-gray-700">
                <p>• Increase joint revenue by 40% YoY</p>
                <p>• Expand into 3 new market segments</p>
                <p>• Launch 2 new joint solutions</p>
                <p>• Achieve 50+ joint customer wins</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
