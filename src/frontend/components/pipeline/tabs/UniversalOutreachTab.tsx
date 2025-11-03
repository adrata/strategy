interface UniversalOutreachTabProps {
  record: any;
  recordType: string;
  onSave?: (field: string, value: string, recordId?: string, recordType?: string) => Promise<void>;
}

export function UniversalOutreachTab({ record, recordType, onSave }: UniversalOutreachTabProps) {
  return (
    <div className="p-6 space-y-8">
      {/* Contact Strategy */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Contact Strategy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-primary/10 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-3">Recommended Approach</h4>
            <div className="space-y-2 text-sm text-foreground">
              <p><strong>Primary Channel:</strong> {record?.email ? 'Email' : record?.linkedinUrl ? 'LinkedIn' : 'Phone'}</p>
              <p><strong>Best Time:</strong> {record?.timezone ? 'Business hours in ' + record.timezone : 'Business hours'}</p>
              <p><strong>Tone:</strong> Professional, {record?.seniority === 'executive' ? 'executive-level' : 'collaborative'}</p>
              <p><strong>Value Focus:</strong> {record?.department || 'Department'}-specific efficiency gains</p>
            </div>
          </div>

          <div className="bg-success/10 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-3">Contact Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Email:</span>
                <span className={`font-medium ${record?.emailVerified ? 'text-success' : 'text-foreground'}`}>
                  {record?.email || record?.workEmail || '-'}
                  {record?.emailVerified && <span className="ml-1 text-success">✓</span>}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Phone:</span>
                <span className={`font-medium ${record?.phoneVerified ? 'text-green-700' : 'text-foreground'}`}>
                  {record?.phone || record?.mobilePhone || '-'}
                  {record?.phoneVerified && <span className="ml-1 text-success">✓</span>}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">LinkedIn:</span>
                <span className="font-medium text-primary">
                  {record?.linkedinUrl ? (
                    <a href={record.linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      Profile
                    </a>
                  ) : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Templates */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Personalized Message Templates</h3>
        
        <div className="space-y-4">
          <div className="bg-panel-background border border-border rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Email Template</h4>
            <div className="bg-background rounded border p-3 text-sm text-gray-700">
              <p className="mb-2"><strong>Subject:</strong> Quick question about {record?.industry || 'your industry'} operations</p>
              <p className="mb-2">Hi {record?.firstName || '[First Name]'},</p>
              <p className="mb-2">I noticed {record?.company || '[Company]'} is in the {record?.industry || '[Industry]'} space. Many {record?.industry || 'industry'} leaders I work with are facing challenges with operational efficiency and data management.</p>
              <p className="mb-2">I'd love to share how companies like yours are solving these challenges. Would you be open to a brief 15-minute conversation?</p>
              <p>Best regards,<br/>[Your Name]</p>
            </div>
          </div>

          <div className="bg-panel-background border border-border rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">LinkedIn Message</h4>
            <div className="bg-background rounded border p-3 text-sm text-gray-700">
              <p>Hi {record?.firstName || '[First Name]'}, I see you're leading {record?.department || 'operations'} at {record?.company || '[Company]'}. I work with {record?.industry || 'industry'} leaders on operational efficiency challenges. Would love to connect and share some insights that might be relevant to your role.</p>
            </div>
          </div>

          <div className="bg-panel-background border border-border rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Phone Script</h4>
            <div className="bg-background rounded border p-3 text-sm text-gray-700">
              <p className="mb-2"><strong>Opening:</strong> "Hi {record?.firstName || '[First Name]'}, this is [Your Name] from [Company]. I work specifically with {record?.industry || 'industry'} companies like {record?.company || '[Company]'}."</p>
              <p className="mb-2"><strong>Reason:</strong> "I'm calling because many {record?.jobTitle || 'professionals'} in your industry are dealing with [specific challenge]. I have some insights that might be valuable."</p>
              <p><strong>Ask:</strong> "Would you have 2 minutes for me to share what I'm seeing in the market?"</p>
            </div>
          </div>
        </div>
      </div>

      {/* Outreach Tracking */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Outreach Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-panel-background rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Email Status</h4>
            <div className="space-y-1 text-sm">
              <div>Sent: {record?.emailCount || 0}</div>
              <div>Opened: -</div>
              <div>Replied: -</div>
            </div>
          </div>
          
          <div className="bg-panel-background rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Call Status</h4>
            <div className="space-y-1 text-sm">
              <div>Attempts: {record?.callCount || 0}</div>
              <div>Connected: -</div>
              <div>Voicemails: -</div>
            </div>
          </div>
          
          <div className="bg-panel-background rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Social Status</h4>
            <div className="space-y-1 text-sm">
              <div>LinkedIn: {record?.linkedinUrl ? 'Available' : 'Not found'}</div>
              <div>Connected: -</div>
              <div>Engaged: -</div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Best Actions */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Next Best Actions</h3>
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
          <h4 className="font-medium text-foreground mb-3">Recommended Next Steps</h4>
          <div className="space-y-2 text-sm text-gray-700">
            <p>1. <strong>Research:</strong> Review {record?.company || 'company'} website and recent news</p>
            <p>2. <strong>LinkedIn:</strong> Connect with {record?.firstName || 'contact'} and engage with their content</p>
            <p>3. <strong>Email:</strong> Send personalized {record?.industry || 'industry'}-specific message</p>
            <p>4. <strong>Follow-up:</strong> Schedule follow-up based on response pattern</p>
            <p>5. <strong>Qualify:</strong> Discover specific pain points and budget</p>
          </div>
        </div>
      </div>
    </div>
  );
}
