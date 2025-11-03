import { InlineEditField } from '../InlineEditField';

interface UniversalPersonalTabProps {
  record: any;
  recordType: string;
  onSave?: (field: string, value: any, recordId: string, recordType: string) => Promise<void>;
  onSuccess?: () => void;
}

export function UniversalPersonalTab({ record, recordType, onSave, onSuccess }: UniversalPersonalTabProps) {
  const formatEmptyValue = (value: any): string => {
    if (!value || value === '' || value === 'null' || value === 'undefined') {
      return '-';
    }
    return value;
  };

  const handleSuccess = (message: string) => {
    if (onSuccess) {
      onSuccess();
    }
  };
  return (
    <div className="p-6 space-y-8">
      {/* Personal Profile */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Personal Intelligence</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-primary/10 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-3">Personal Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Birthday:</span>
                <span className="font-medium text-foreground">
                  {record?.dateOfBirth ? new Date(record.dateOfBirth).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : '-'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-muted w-24">Location:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.city && record?.state ? `${record.city}, ${record.state}` : record?.city || record?.state)}
                  field="city"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-muted w-24">Time Zone:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.timezone)}
                  field="timezone"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-muted w-24">Preferred Language:</span>
                <InlineEditField
                  value={record?.preferredLanguage || 'English'}
                  field="preferredLanguage"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  placeholder="Enter preferred language"
                  className="font-medium text-foreground"
                />
              </div>
            </div>
          </div>

          <div className="bg-success/10 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-3">Professional Background</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <span className="text-muted w-24">Years of Experience:</span>
                <InlineEditField
                  value={record?.yearsExperience}
                  field="yearsExperience"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  placeholder="Enter years of experience"
                  className="font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-muted w-24">Education:</span>
                <InlineEditField
                  value={record?.education}
                  field="education"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  placeholder="Enter education"
                  className="font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-muted w-24">Certifications:</span>
                <InlineEditField
                  value={record?.certifications}
                  field="certifications"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  placeholder="Enter certifications"
                  className="font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-muted w-24">Previous Companies:</span>
                <InlineEditField
                  value={record?.previousCompanies}
                  field="previousCompanies"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  placeholder="Enter previous companies"
                  className="font-medium text-foreground"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interests & Hobbies */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Interests & Hobbies</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Personal Interests</label>
            <div className="space-y-2">
              {record?.interests?.length > 0 ? (
                record.interests.map((interest: string, index: number) => (
                  <div key={index} className="bg-info/10 border border-info rounded-lg p-3">
                    <p className="text-info text-sm">{interest}</p>
                  </div>
                ))
              ) : (
                <div className="bg-panel-background border border-border rounded-lg p-3">
                  <p className="text-muted text-sm">No interests recorded yet</p>
                  <p className="text-muted text-xs mt-1">Great conversation starters to discover</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hobbies & Activities</label>
            <div className="space-y-2">
              {record?.hobbies?.length > 0 ? (
                record.hobbies.map((hobby: string, index: number) => (
                  <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-blue-800 text-sm">{hobby}</p>
                  </div>
                ))
              ) : (
                <div className="bg-panel-background border border-border rounded-lg p-3">
                  <p className="text-muted text-sm">No hobbies recorded yet</p>
                  <p className="text-muted text-xs mt-1">Ask about weekend activities and interests</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Goals & Aspirations */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Goals & Aspirations</h3>
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Professional Goals</h4>
            <div className="space-y-2 text-sm text-gray-700">
              {record?.professionalGoals?.length > 0 ? (
                record.professionalGoals.map((goal: string, index: number) => (
                  <p key={index}>• {goal}</p>
                ))
              ) : (
                <div>
                  <p>• Career advancement and skill development</p>
                  <p>• Industry recognition and thought leadership</p>
                  <p>• Building high-performing teams</p>
                  <p className="text-muted italic mt-2">Ask about specific career aspirations</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Personal Goals</h4>
            <div className="space-y-2 text-sm text-gray-700">
              {record?.personalGoals?.length > 0 ? (
                record.personalGoals.map((goal: string, index: number) => (
                  <p key={index}>• {goal}</p>
                ))
              ) : (
                <div>
                  <p>• Work-life balance and family time</p>
                  <p>• Health and wellness priorities</p>
                  <p>• Travel and new experiences</p>
                  <p className="text-muted italic mt-2">Great topics for relationship building</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Communication Style */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Communication Intelligence</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-panel-background rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-3">Communication Style</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Decision Making:</span>
                <span className="font-medium text-foreground">{record?.decisionMakingStyle || 'Analytical'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Communication:</span>
                <span className="font-medium text-foreground">{record?.communicationStyle || 'Direct'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Meeting Style:</span>
                <span className="font-medium text-foreground">{record?.meetingStyle || 'Structured'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Information Processing:</span>
                <span className="font-medium text-foreground">{record?.processingStyle || 'Detail-oriented'}</span>
              </div>
            </div>
          </div>

          <div className="bg-panel-background rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-3">Relationship Building</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• Values personal connections and trust</p>
              <p>• Appreciates {record?.appreciatesStyle || 'authentic communication'}</p>
              <p>• Responds well to {record?.respondsTo || 'data-driven insights'}</p>
              <p>• Motivated by {record?.motivatedBy || 'business results'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Important Dates & Reminders */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Important Dates & Reminders</h3>
        <div className="space-y-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-warning">Birthday</p>
                <p className="text-warning text-sm">
                  {record?.dateOfBirth ? 
                    new Date(record.dateOfBirth).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric' 
                    }) : 
                    'Not recorded - ask during next conversation'
                  }
                </p>
              </div>
              <span className="text-warning text-sm">Annual</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-primary">Work Anniversary</p>
                <p className="text-primary text-sm">
                  {record?.workAnniversary ? 
                    new Date(record.workAnniversary).toLocaleDateString() : 
                    'Track when they joined current company'
                  }
                </p>
              </div>
              <span className="text-primary text-sm">Annual</span>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-success">Client Anniversary</p>
                <p className="text-success text-sm">
                  {record?.clientAnniversary || record?.createdAt ? 
                    new Date(record.clientAnniversary || record.createdAt).toLocaleDateString() : 
                    'When they became a client'
                  }
                </p>
              </div>
              <span className="text-success text-sm">Annual</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
