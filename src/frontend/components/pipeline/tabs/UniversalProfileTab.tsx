import React, { useState } from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';
import { InlineEditField } from '@/frontend/components/pipeline/InlineEditField';

interface UniversalProfileTabProps {
  recordType: string;
  record?: any;
  onSave?: (field: string, value: string, recordId?: string, recordType?: string) => Promise<void>;
}

export function UniversalProfileTab({ recordType, record: recordProp, onSave }: UniversalProfileTabProps) {
  const { currentRecord: contextRecord } = useRecordContext();
  const record = recordProp || contextRecord;
  
  // Success message state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  if (!record) {
    return (
      <div className="p-6">
        <div className="text-center text-[var(--muted)]">No record data available</div>
      </div>
    );
  }

  // Utility function to standardize empty value display
  const formatEmptyValue = (value: any): string => {
    if (!value || value === '' || value === 'null' || value === 'undefined') {
      return '-';
    }
    return value;
  };

  // Use real data from record
  const profileData = {
    personalInfo: {
      fullName: record?.fullName || record?.name || '-',
      title: record?.jobTitle || record?.title || '-',
      company: record?.company || record?.companyName || '-',
      email: record?.email || record?.workEmail || '-',
      phone: record?.phone || record?.workPhone || '-',
      linkedin: formatEmptyValue(record?.linkedinUrl || record?.linkedin),
      linkedinNavigatorUrl: formatEmptyValue(record?.linkedinNavigatorUrl),
      bio: formatEmptyValue(record?.bio),
      location: record?.city && record?.state ? `${record.city}, ${record.state}` : record?.address || '-'
    },
    professionalInfo: {
      department: record?.department || '-',
      seniority: record?.seniority || '-',
      industry: record?.industry || '-',
      experience: record?.experience || '-',
      education: record?.education || '-'
    },
    communication: {
      style: record?.communicationStyle || record?.customFields?.communicationStyle || 'Professional',
      decisionMaking: record?.decisionMakingStyle || record?.customFields?.decisionMakingStyle || 'Collaborative',
      preferredMethod: 'Email',
      responseTime: '24-48 hours'
    },
    contactHistory: {
      lastContact: record?.lastContactDate || record?.customFields?.lastContactDate || new Date().toISOString(),
      nextFollowUp: record?.nextFollowUpDate || record?.customFields?.nextFollowUpDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      totalInteractions: record?.totalInteractions || record?.customFields?.totalInteractions || 0,
      emailResponseRate: record?.emailResponseRate || record?.customFields?.emailResponseRate || 85,
      meetingAttendance: record?.meetingAttendance || record?.customFields?.meetingAttendance || 92,
      engagementScore: record?.engagementScore || record?.customFields?.engagementScore || 4.2
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--background)] p-6 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-4">Contact Details</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">Email</div>
                  <InlineEditField
                    value={profileData.personalInfo.email}
                    field="email"
                    onSave={onSave}
                    recordId={record.id}
                    recordType={recordType}
                    onSuccess={handleSuccess}
                    placeholder="Enter email address"
                    className="text-sm text-[var(--muted)]"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">Phone</div>
                  <InlineEditField
                    value={profileData.personalInfo.phone}
                    field="phone"
                    onSave={onSave}
                    recordId={record.id}
                    recordType={recordType}
                    onSuccess={handleSuccess}
                    placeholder="Enter phone number"
                    className="text-sm text-[var(--muted)]"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">LinkedIn</div>
                  <InlineEditField
                    value={profileData.personalInfo.linkedin}
                    field="linkedinUrl"
                    onSave={onSave}
                    recordId={record.id}
                    recordType={recordType}
                    onSuccess={handleSuccess}
                    placeholder="Enter LinkedIn URL"
                    className="text-sm text-[var(--muted)]"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">LinkedIn Navigator</div>
                  <InlineEditField
                    value={profileData.personalInfo.linkedinNavigatorUrl}
                    field="linkedinNavigatorUrl"
                    onSave={onSave}
                    recordId={record.id}
                    recordType={recordType}
                    onSuccess={handleSuccess}
                    placeholder="Enter LinkedIn Navigator URL"
                    className="text-sm text-[var(--muted)]"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">Bio URL</div>
                  <InlineEditField
                    value={profileData.personalInfo.bio}
                    field="bio"
                    onSave={onSave}
                    recordId={record.id}
                    recordType={recordType}
                    onSuccess={handleSuccess}
                    placeholder="Enter bio URL"
                    className="text-sm text-[var(--muted)]"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-[var(--background)] p-6 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-4">Location & Timezone</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">Location</div>
                  <InlineEditField
                    value={profileData.personalInfo.location}
                    field="location"
                    onSave={onSave}
                    recordId={record.id}
                    recordType={recordType}
                    onSuccess={handleSuccess}
                    placeholder="Enter location"
                    className="text-sm text-[var(--muted)]"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">Timezone</div>
                  <div className="text-sm text-[var(--muted)]">EST (UTC-5)</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">Preferred Contact Time</div>
                  <div className="text-sm text-[var(--muted)]">9:00 AM - 5:00 PM EST</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Professional Information */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Professional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--background)] p-6 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-4">Role & Responsibilities</h4>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-[var(--foreground)] mb-1">Job Title</div>
                <InlineEditField
                  value={profileData.personalInfo.title}
                  field="title"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  placeholder="Enter job title"
                  className="text-sm text-[var(--muted)]"
                />
              </div>
              
              <div>
                <div className="text-sm font-medium text-[var(--foreground)] mb-1">Department</div>
                <InlineEditField
                  value={profileData.professionalInfo.department}
                  field="department"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  placeholder="Enter department"
                  className="text-sm text-[var(--muted)]"
                />
              </div>
              
              <div>
                <div className="text-sm font-medium text-[var(--foreground)] mb-1">Seniority Level</div>
                <InlineEditField
                  value={profileData.professionalInfo.seniority}
                  field="seniority"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  placeholder="Enter seniority level"
                  className="text-sm text-[var(--muted)]"
                />
              </div>
              
              <div>
                <div className="text-sm font-medium text-[var(--foreground)] mb-1">Company</div>
                <InlineEditField
                  value={profileData.personalInfo.company}
                  field="company"
                  variant="company"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  placeholder="Enter company name"
                  className="text-sm text-[var(--muted)]"
                />
              </div>
            </div>
          </div>
          
          <div className="bg-[var(--background)] p-6 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-4">Communication Preferences</h4>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-[var(--foreground)] mb-1">Communication Style</div>
                <InlineEditField
                  value={profileData.communication.style}
                  field="communicationStyle"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  placeholder="Enter communication style"
                  className="text-sm text-[var(--muted)]"
                />
              </div>
              
              <div>
                <div className="text-sm font-medium text-[var(--foreground)] mb-1">Decision Making Style</div>
                <InlineEditField
                  value={profileData.communication.decisionMaking}
                  field="decisionMakingStyle"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  placeholder="Enter decision making style"
                  className="text-sm text-[var(--muted)]"
                />
              </div>
              
              <div>
                <div className="text-sm font-medium text-[var(--foreground)] mb-1">Preferred Communication Method</div>
                <div className="text-sm text-[var(--muted)]">{profileData.communication.preferredMethod}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-[var(--foreground)] mb-1">Response Time</div>
                <div className="text-sm text-[var(--muted)]">{profileData.communication.responseTime}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Contact History */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Contact History</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--background)] p-6 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-4">Recent Activity</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">Last Contact</div>
                  <div className="text-sm text-[var(--muted)]">
                    {new Date(profileData.contactHistory.lastContact).toLocaleDateString()} at {new Date(profileData.contactHistory.lastContact).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">Next Follow-up</div>
                  <div className="text-sm text-[var(--muted)]">
                    {new Date(profileData.contactHistory.nextFollowUp).toLocaleDateString()} at {new Date(profileData.contactHistory.nextFollowUp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">Total Interactions</div>
                  <div className="text-sm text-[var(--muted)]">{profileData.contactHistory.totalInteractions} interactions this quarter</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-[var(--background)] p-6 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-4">Engagement Metrics</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium text-[var(--foreground)]">Email Response Rate</div>
                  <div className="text-sm font-medium text-[var(--foreground)]">{profileData.contactHistory.emailResponseRate}%</div>
                </div>
                <div className="w-full bg-[var(--loading-bg)] rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: `${profileData.contactHistory.emailResponseRate}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium text-[var(--foreground)]">Meeting Attendance</div>
                  <div className="text-sm font-medium text-[var(--foreground)]">{profileData.contactHistory.meetingAttendance}%</div>
                </div>
                <div className="w-full bg-[var(--loading-bg)] rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${profileData.contactHistory.meetingAttendance}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium text-[var(--foreground)]">Engagement Score</div>
                  <div className="text-sm font-medium text-[var(--foreground)]">{profileData.contactHistory.engagementScore}/5</div>
                </div>
                <div className="w-full bg-[var(--loading-bg)] rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${(profileData.contactHistory.engagementScore / 5) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}