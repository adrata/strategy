interface UniversalRelationshipTabProps {
  record: any;
  recordType: string;
}

export function UniversalRelationshipTab({ record, recordType }: UniversalRelationshipTabProps) {
  return (
    <div className="p-6 space-y-8">
      {/* Relationship Overview */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Relationship Intelligence</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Relationship Strength</h4>
            <div className="text-2xl font-bold text-blue-600">
              {record?.relationshipStrength || '-'}
            </div>
            <p className="text-sm text-[var(--muted)] mt-1">Current relationship level</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Client Since</h4>
            <div className="text-lg font-bold text-green-600">
              {record?.clientSince ? new Date(record.clientSince).toLocaleDateString() : record?.createdAt ? new Date(record.createdAt).toLocaleDateString() : '-'}
            </div>
            <p className="text-sm text-[var(--muted)] mt-1">Relationship duration</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Satisfaction Score</h4>
            <div className="text-2xl font-bold text-purple-600">
              {record?.satisfactionScore ? `${Math.round(record.satisfactionScore)}/10` : '-'}
            </div>
            <p className="text-sm text-[var(--muted)] mt-1">Overall satisfaction</p>
          </div>
        </div>
      </div>

      {/* Key Contacts */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Key Relationships</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--panel-background)] rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Primary Contacts</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Primary Contact:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.primaryContact || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Account Manager:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.accountManager || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Success Manager:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.successManager || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Executive Sponsor:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.executiveSponsor || '-'}</span>
              </div>
            </div>
          </div>

          <div className="bg-[var(--panel-background)] rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Communication Preferences</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Preferred Channel:</span>
                <span className="font-medium text-[var(--foreground)]">
                  {record?.email ? 'Email' : record?.phone ? 'Phone' : 'In-person'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Meeting Frequency:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.meetingFrequency || 'Monthly'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Communication Style:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.communicationStyle || 'Professional'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Response Time:</span>
                <span className="font-medium text-[var(--foreground)]">
                  {record?.avgResponseTime ? `${Math.round(record.avgResponseTime)} hours` : 'Same day'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Relationship History */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Relationship Milestones</h3>
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-green-800">Client Onboarding Complete</p>
                <p className="text-green-600 text-sm">Successfully implemented and launched</p>
              </div>
              <span className="text-green-600 text-sm">
                {record?.onboardingDate ? new Date(record.onboardingDate).toLocaleDateString() : '-'}
              </span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-blue-800">First Success Milestone</p>
                <p className="text-blue-600 text-sm">Achieved initial business objectives</p>
              </div>
              <span className="text-blue-600 text-sm">
                {record?.firstSuccessDate ? new Date(record.firstSuccessDate).toLocaleDateString() : '-'}
              </span>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-purple-800">Expansion Opportunity</p>
                <p className="text-purple-600 text-sm">Additional services or departments</p>
              </div>
              <span className="text-purple-600 text-sm">
                {record?.expansionDate ? new Date(record.expansionDate).toLocaleDateString() : 'Identified'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trust & Advocacy */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Trust & Advocacy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trust Indicators</label>
            <div className="space-y-2">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm font-medium">Regular Check-ins</p>
                <p className="text-green-600 text-xs">Proactive communication and updates</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm font-medium">Strategic Discussions</p>
                <p className="text-green-600 text-xs">Involved in long-term planning</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm font-medium">Reference Willingness</p>
                <p className="text-green-600 text-xs">
                  {record?.referenceWillingness ? 'Willing to provide references' : 'Open to case studies'}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Advocacy Level</label>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--muted)]">Net Promoter Score</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  (record?.nps || 0) >= 9 ? 'bg-green-100 text-green-800' :
                  (record?.nps || 0) >= 7 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {record?.nps || '-'}/10
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--muted)]">Referral Activity</span>
                <span className="font-medium text-[var(--foreground)]">{record?.referralsProvided || 0} referrals</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--muted)]">Case Study Participation</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  record?.caseStudyParticipation 
                    ? (recordType === 'speedrun' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800')
                    : 'bg-[var(--hover)] text-[var(--muted)]'
                }`}>
                  {record?.caseStudyParticipation ? 'Yes' : 'Potential'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
