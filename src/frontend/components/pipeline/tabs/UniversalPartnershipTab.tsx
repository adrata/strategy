interface UniversalPartnershipTabProps {
  record: any;
  recordType: string;
}

export function UniversalPartnershipTab({ record, recordType }: UniversalPartnershipTabProps) {
  return (
    <div className="p-6 space-y-8">
      {/* Partnership Overview */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Partnership Intelligence</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Partnership Type</h4>
            <div className="text-lg font-bold text-blue-600">
              {record?.partnershipType || 'Strategic'}
            </div>
            <p className="text-sm text-[var(--muted)] mt-1">Relationship category</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Partnership Since</h4>
            <div className="text-lg font-bold text-green-600">
              {record?.partnershipStartDate ? new Date(record.partnershipStartDate).toLocaleDateString() : record?.createdAt ? new Date(record.createdAt).toLocaleDateString() : '-'}
            </div>
            <p className="text-sm text-[var(--muted)] mt-1">Relationship duration</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Partnership Value</h4>
            <div className="text-lg font-bold text-purple-600">
              {record?.partnershipValue || 'High'}
            </div>
            <p className="text-sm text-[var(--muted)] mt-1">Strategic importance</p>
          </div>
        </div>
      </div>

      {/* Partnership Details */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Partnership Structure</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--panel-background)] rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Partner Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Company:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.company || record?.name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Industry:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.industry || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Size:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.size || record?.companySize || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Location:</span>
                <span className="font-medium text-[var(--foreground)]">
                  {record?.city && record?.state ? `${record.city}, ${record.state}` : record?.country || '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[var(--panel-background)] rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Partnership Model</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Model Type:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.partnershipModel || 'Channel Partner'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Revenue Share:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.revenueShare || '20%'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Territory:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.territory || 'Regional'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Exclusivity:</span>
                <span className="font-medium text-[var(--foreground)]">{record?.exclusivity || 'Non-exclusive'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Contacts */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Key Partner Contacts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Primary Contacts</label>
            <div className="space-y-2">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm font-medium">
                  {record?.primaryContact || 'Partner Manager'}
                </p>
                <p className="text-blue-600 text-xs">Main point of contact</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm font-medium">
                  {record?.salesLead || 'Sales Director'}
                </p>
                <p className="text-blue-600 text-xs">Sales relationship owner</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm font-medium">
                  {record?.technicalContact || 'Technical Lead'}
                </p>
                <p className="text-blue-600 text-xs">Technical integration contact</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Executive Relationships</label>
            <div className="space-y-2">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm font-medium">
                  {record?.executiveSponsor || 'VP of Partnerships'}
                </p>
                <p className="text-green-600 text-xs">Executive sponsor</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm font-medium">
                  {record?.ceoContact || 'CEO/Founder'}
                </p>
                <p className="text-green-600 text-xs">C-level relationship</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Partnership Capabilities */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Partner Capabilities</h3>
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Core Competencies</h4>
            <div className="space-y-2 text-sm text-gray-700">
              {record?.coreCompetencies?.length > 0 ? (
                record.coreCompetencies.map((competency: string, index: number) => (
                  <p key={index}>• {competency}</p>
                ))
              ) : (
                <div>
                  <p>• {record?.industry || 'Industry'} expertise and market knowledge</p>
                  <p>• Sales and business development capabilities</p>
                  <p>• Technical implementation and support</p>
                  <p>• Customer relationship management</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Service Offerings</h4>
            <div className="space-y-2 text-sm text-gray-700">
              {record?.serviceOfferings?.length > 0 ? (
                record.serviceOfferings.map((service: string, index: number) => (
                  <p key={index}>• {service}</p>
                ))
              ) : (
                <div>
                  <p>• Solution consulting and design</p>
                  <p>• Implementation and integration services</p>
                  <p>• Training and change management</p>
                  <p>• Ongoing support and maintenance</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Market Reach */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Market Reach & Influence</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[var(--panel-background)] rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Geographic Reach</h4>
            <div className="space-y-1 text-sm text-[var(--muted)]">
              <p>Coverage: {record?.geographicReach || 'National'}</p>
              <p>Markets: {record?.marketCount || '15+'} key markets</p>
              <p>Presence: {record?.officeLocations || 'Multi-city'}</p>
            </div>
          </div>
          
          <div className="bg-[var(--panel-background)] rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Customer Base</h4>
            <div className="space-y-1 text-sm text-[var(--muted)]">
              <p>Customers: {record?.customerCount || '500+'} active</p>
              <p>Industries: {record?.industryFocus || 'Multi-vertical'}</p>
              <p>Segments: {record?.customerSegments || 'Enterprise & SMB'}</p>
            </div>
          </div>
          
          <div className="bg-[var(--panel-background)] rounded-lg p-4">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Market Position</h4>
            <div className="space-y-1 text-sm text-[var(--muted)]">
              <p>Ranking: {record?.marketRanking || 'Top 10'} in region</p>
              <p>Reputation: {record?.marketReputation || 'Strong'}</p>
              <p>Growth: {record?.growthRate || '25%'} YoY</p>
            </div>
          </div>
        </div>
      </div>

      {/* Partnership Benefits */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Mutual Benefits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">What We Provide</label>
            <div className="space-y-2">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm">Technology Platform & Solutions</p>
                <p className="text-green-600 text-xs">Best-in-class products and innovation</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm">Sales & Marketing Support</p>
                <p className="text-green-600 text-xs">Lead generation and co-marketing</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm">Training & Certification</p>
                <p className="text-green-600 text-xs">Technical and sales enablement</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">What They Provide</label>
            <div className="space-y-2">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">Market Access & Relationships</p>
                <p className="text-blue-600 text-xs">Customer connections and trust</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">Local Expertise & Implementation</p>
                <p className="text-blue-600 text-xs">On-ground delivery capabilities</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">Industry Knowledge & Credibility</p>
                <p className="text-blue-600 text-xs">Domain expertise and reputation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
