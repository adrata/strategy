interface UniversalCompetitiveTabProps {
  record: any;
  recordType: string;
}

export function UniversalCompetitiveTab({ record, recordType }: UniversalCompetitiveTabProps) {
  return (
    <div className="p-6 space-y-8">
      {/* Competitive Landscape */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Competitive Intelligence</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Known Competitors</label>
            <div className="space-y-2">
              {record?.competitorMentions?.length > 0 ? (
                record.competitorMentions.map((competitor: string, index: number) => (
                  <div key={index} className="bg-warning/10 border border-warning rounded-lg p-3">
                    <p className="text-warning text-sm font-medium">{competitor}</p>
                    <p className="text-warning/80 text-xs">Mentioned in conversations</p>
                  </div>
                ))
              ) : (
                <div className="bg-panel-background border border-border rounded-lg p-3">
                  <p className="text-muted text-sm">No competitors mentioned yet</p>
                  <p className="text-muted text-xs mt-1">Listen for competitive intelligence</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Competitive Threats</label>
            <div className="space-y-2">
              {record?.competitiveThreats ? (
                <div className="bg-error/10 border border-error rounded-lg p-3">
                  <div className="text-sm text-error">{JSON.stringify(record.competitiveThreats)}</div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="bg-error/10 border border-error rounded-lg p-3">
                    <p className="text-error text-sm font-medium">Incumbent Solutions</p>
                    <p className="text-error/80 text-xs">Existing vendor relationships</p>
                  </div>
                  <div className="bg-error/10 border border-error rounded-lg p-3">
                    <p className="text-error text-sm font-medium">Status Quo Bias</p>
                    <p className="text-error/80 text-xs">Resistance to change</p>
                  </div>
                  <div className="bg-error/10 border border-error rounded-lg p-3">
                    <p className="text-error text-sm font-medium">Budget Constraints</p>
                    <p className="text-error/80 text-xs">Competing priorities</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Competitive Positioning */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Our Competitive Position</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Our Strengths</h4>
            <div className="space-y-1 text-sm text-green-700">
              <p>• {record?.industry || 'Industry'}-specific expertise</p>
              <p>• Proven ROI and implementation success</p>
              <p>• Advanced AI and automation capabilities</p>
              <p>• Comprehensive support and training</p>
            </div>
          </div>
          
          <div className="bg-warning/10 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Competitive Gaps</h4>
            <div className="space-y-1 text-sm text-yellow-700">
              <p>• Market presence in {record?.industry || 'industry'}</p>
              <p>• Brand recognition vs incumbents</p>
              <p>• Existing customer references</p>
              <p>• Integration ecosystem</p>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Differentiation</h4>
            <div className="space-y-1 text-sm text-blue-700">
              <p>• AI-first approach and innovation</p>
              <p>• {record?.industry || 'Industry'}-specific solutions</p>
              <p>• Faster implementation timeline</p>
              <p>• Superior customer success model</p>
            </div>
          </div>
        </div>
      </div>

      {/* Battle Cards */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Battle Cards</h3>
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-red-50 to-yellow-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Common Objections & Responses</h4>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-red-800">Objection: "We're happy with our current solution"</p>
                <p className="text-gray-700 mt-1">Response: "That's great to hear. Many {record?.industry || 'industry'} leaders said the same thing before discovering the efficiency gains possible with modern solutions. What if I could show you how companies like yours are achieving 30% better results?"</p>
              </div>
              <div>
                <p className="font-medium text-red-800">Objection: "We don't have budget this year"</p>
                <p className="text-gray-700 mt-1">Response: "I understand budget constraints. That's exactly why timing might be perfect - our solution typically pays for itself within 6 months through efficiency gains. Would you like to see the ROI calculation?"</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Competitive Advantages</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• <strong>vs. Legacy Solutions:</strong> Modern architecture, faster performance, better user experience</p>
              <p>• <strong>vs. Competitors:</strong> {record?.industry || 'Industry'}-specific features, proven ROI, superior support</p>
              <p>• <strong>vs. Status Quo:</strong> Measurable efficiency gains, competitive advantage, future-proofing</p>
            </div>
          </div>
        </div>
      </div>

      {/* Win Strategy */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Win Strategy</h3>
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
          <h4 className="font-medium text-foreground mb-3">Strategic Approach</h4>
          <div className="space-y-2 text-sm text-gray-700">
            <p>1. <strong>Lead with Value:</strong> Focus on {record?.industry || 'industry'}-specific ROI and efficiency gains</p>
            <p>2. <strong>Build Champions:</strong> Identify and enable internal advocates</p>
            <p>3. <strong>Address Concerns:</strong> Proactively handle competitive and status quo objections</p>
            <p>4. <strong>Create Urgency:</strong> Highlight market trends and competitive pressures</p>
            <p>5. <strong>De-risk Decision:</strong> Provide references, trials, and implementation guarantees</p>
          </div>
        </div>
      </div>
    </div>
  );
}
