import React, { useState } from 'react';
import { InlineEditField } from '../InlineEditField';
import { PipelineProgress } from '../PipelineProgress';
import { DatePicker } from '@/platform/ui/components/DatePicker';
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  GlobeAltIcon, 
  BuildingOfficeIcon, 
  UsersIcon, 
  TagIcon, 
  UserIcon, 
  BuildingOffice2Icon, 
  MapPinIcon, 
  CurrencyDollarIcon, 
  CalendarIcon
} from '@heroicons/react/24/solid';

interface UniversalOverviewTabProps {
  record: any;
  recordType: string;
  onSave?: (field: string, value: string, recordId: string, recordType: string) => Promise<void>;
}

export function UniversalOverviewTab({ record, recordType, onSave }: UniversalOverviewTabProps) {
  const [isEditingLastAction, setIsEditingLastAction] = useState(false);
  const [isEditingNextAction, setIsEditingNextAction] = useState(false);

  const formatRelativeDate = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  console.log(`🏠 [OVERVIEW] Tab rendered with:`, { 
    recordId: record?.id, 
    recordType, 
    recordKeys: Object.keys(record || {}),
    recordData: {
      name: record?.name,
      stage: record?.stage,
      amount: record?.amount,
      account: record?.account,
      stakeholders: record?.stakeholders,
      contacts: record?.contacts
    }
  });

  // Validate record exists
  if (!record) {
    console.error(`🏠 [OVERVIEW] No record data provided`);
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-medium mb-2">No Record Data</h3>
          <p className="text-yellow-600 text-sm">
            Unable to load record information for the overview.
          </p>
          <div className="mt-4 text-xs text-gray-500">
            Record Type: {recordType} | Component: UniversalOverviewTab
          </div>
        </div>
      </div>
    );
  }

  const handleSave = onSave || (async (field: string, value: string, recordId: string, recordType: string) => {
    console.log(`🔄 [UNIVERSAL-OVERVIEW] Saving ${field} for ${recordType}:`, recordId, 'to:', value);
    // TODO: Implement actual save logic
  });

  // Create a wrapper function that adapts the signature for InlineEditField
  const handleInlineSave = async (field: string, value: string) => {
    return handleSave(field, value, record?.id || '', recordType);
  };

  // Handle date changes for actions
  const handleDateChange = async (field: string, date: Date | null) => {
    if (!date) return;
    
    const dateString = date.toISOString();
    await handleSave(field, dateString, record?.id || '', recordType);
    
    // Close editing mode
    if (field === 'lastActionDate') {
      setIsEditingLastAction(false);
    } else if (field === 'nextActionDate') {
      setIsEditingNextAction(false);
    }
  };

  const getDisplayName = () => {
    return record?.name || record?.fullName || record?.firstName || 'Record';
  };

  const getRecordFields = () => {
    switch (recordType) {
      case 'opportunities':
        return (
          <div className="space-y-8">
            {/* Key Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Opportunity Details</label>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Name:</span>
                    <InlineEditField
                      value={record?.name || ''}
                      field="name"
                      recordId={record?.id || ''}
                      recordType="universal"
                      placeholder="Enter opportunity name"
                      onSave={handleInlineSave}
                      className="ml-2 text-sm font-medium text-gray-900"
                    />
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Stage:</span>
                    <InlineEditField
                      value={record?.stage || 'Build Rapport'}
                      field="stage"
                      recordId={record?.id || ''}
                      recordType="universal"
                      inputType="select"
                      options={[
                        { value: 'Build Rapport', label: 'Build Rapport' },
                        { value: 'Discovery', label: 'Discovery' },
                        { value: 'Qualification', label: 'Qualification' },
                        { value: 'Proposal', label: 'Proposal' },
                        { value: 'Negotiation', label: 'Negotiation' },
                        { value: 'Closed Won', label: 'Closed Won' },
                        { value: 'Closed Lost', label: 'Closed Lost' }
                      ]}
                      onSave={handleInlineSave}
                      className="ml-2"
                    />
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Priority:</span>
                    <InlineEditField
                      value={record?.priority || 'medium'}
                      field="priority"
                      recordId={record?.id || ''}
                      recordType="universal"
                      inputType="select"
                      options={[
                        { value: 'high', label: 'High' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'low', label: 'Low' }
                      ]}
                      onSave={handleInlineSave}
                      className="ml-2"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Financial Details</label>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Amount:</span>
                    <InlineEditField
                      value={record?.amount?.toString() || ''}
                      field="amount"
                      recordId={record?.id || ''}
                      recordType="universal"
                      placeholder="Enter amount"
                      onSave={handleInlineSave}
                      className="ml-2 text-sm font-medium text-gray-900"
                    />
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Currency:</span>
                    <InlineEditField
                      value={record?.currency || 'USD'}
                      field="currency"
                      recordId={record?.id || ''}
                      recordType="universal"
                      inputType="select"
                      options={[
                        { value: 'USD', label: 'USD' },
                        { value: 'EUR', label: 'EUR' },
                        { value: 'GBP', label: 'GBP' },
                        { value: 'CAD', label: 'CAD' }
                      ]}
                      onSave={handleInlineSave}
                      className="ml-2"
                    />
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Probability:</span>
                    <InlineEditField
                      value={record?.probability?.toString() || '50'}
                      field="probability"
                      recordId={record?.id || ''}
                      recordType="universal"
                      placeholder="0-100"
                      onSave={handleInlineSave}
                      className="ml-2 text-sm font-medium text-gray-900"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Timeline & Source</label>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Expected Close:</span>
                    <InlineEditField
                      value={record?.expectedCloseDate ? new Date(record.expectedCloseDate).toLocaleDateString() : ''}
                      field="expectedCloseDate"
                      recordId={record?.id || ''}
                      recordType="universal"
                      placeholder="MM/DD/YYYY"
                      onSave={handleInlineSave}
                      className="ml-2 text-sm font-medium text-gray-900"
                    />
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Source:</span>
                    <InlineEditField
                      value={record?.source || ''}
                      field="source"
                      recordId={record?.id || ''}
                      recordType="universal"
                      placeholder="Enter source"
                      onSave={handleInlineSave}
                      className="ml-2 text-sm font-medium text-gray-900"
                    />
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Risk Score:</span>
                    <InlineEditField
                      value={record?.riskScore?.toString() || ''}
                      field="riskScore"
                      recordId={record?.id || ''}
                      recordType="universal"
                      placeholder="Enter risk score"
                      onSave={handleInlineSave}
                      className="ml-2 text-sm font-medium text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Description and Next Steps */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <InlineEditField
                      value={record?.description || ''}
                      field="description"
                      recordId={record?.id || ''}
                      recordType="universal"
                      inputType="textarea"
                      placeholder="Enter opportunity description"
                      onSave={handleInlineSave}
                      className="text-sm text-gray-900"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Next Steps</label>
                    <InlineEditField
                      value={record?.nextSteps || ''}
                      field="nextSteps"
                      recordId={record?.id || ''}
                      recordType="universal"
                      inputType="textarea"
                      placeholder="Enter next steps"
                      onSave={handleInlineSave}
                      className="text-sm text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Key Stakeholders and Decision Info */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Champion</label>
                    <InlineEditField
                      value={record?.champion || ''}
                      field="champion"
                      recordId={record?.id || ''}
                      recordType="universal"
                      placeholder="Enter champion name"
                      onSave={handleInlineSave}
                      className="text-sm text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Economic Buyer</label>
                    <InlineEditField
                      value={record?.economicBuyer || ''}
                      field="economicBuyer"
                      recordId={record?.id || ''}
                      recordType="universal"
                      placeholder="Enter economic buyer"
                      onSave={handleInlineSave}
                      className="text-sm text-gray-900"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Activity</label>
                    <div className="text-sm text-gray-600">
                      {record?.lastActivityDate ? new Date(record.lastActivityDate).toLocaleDateString() : 'No recent activity'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Next Activity</label>
                    <div className="text-sm text-gray-600">
                      {record?.nextActivityDate ? new Date(record.nextActivityDate).toLocaleDateString() : 'Not scheduled'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Intelligence Data */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Intelligence</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">LinkedIn Profile</label>
                    <div className="text-sm text-gray-600">
                      {record?.linkedinUrl ? (
                        <a href={record.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View LinkedIn Profile
                        </a>
                      ) : 'Not available'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Founded Year</label>
                    <div className="text-sm text-gray-600">
                      {record?.foundedYear || 'Not available'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Employee Count</label>
                    <div className="text-sm text-gray-600">
                      {record?.employeeCount ? record.employeeCount.toLocaleString() : 'Not available'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Active Job Postings</label>
                    <div className="text-sm text-gray-600">
                      {record?.activeJobPostings || 'Not available'}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">LinkedIn Followers</label>
                    <div className="text-sm text-gray-600">
                      {record?.linkedinFollowers ? record.linkedinFollowers.toLocaleString() : 'Not available'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">NAICS Codes</label>
                    <div className="text-sm text-gray-600">
                      {record?.naicsCodes?.length > 0 ? record.naicsCodes.join(', ') : 'Not available'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Technologies Used</label>
                    <div className="text-sm text-gray-600">
                      {record?.technologiesUsed?.length > 0 ? record.technologiesUsed.slice(0, 3).join(', ') + (record.technologiesUsed.length > 3 ? '...' : '') : 'Not available'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Competitors</label>
                    <div className="text-sm text-gray-600">
                      {record?.competitors?.length > 0 ? record.competitors.slice(0, 3).join(', ') + (record.competitors.length > 3 ? '...' : '') : 'Not available'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Information */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Created</label>
                    <div className="text-sm text-gray-600">
                      {record?.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stage Entry Date</label>
                    <div className="text-sm text-gray-600">
                      {record?.stageEntryDate ? new Date(record.stageEntryDate).toLocaleDateString() : 'Not set'}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Close Prediction Confidence</label>
                    <div className="text-sm text-gray-600">
                      {record?.closePredictionConfidence ? `${Math.round(record.closePredictionConfidence * 100)}%` : 'Not calculated'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                    <div className="text-sm text-gray-600">
                      {record?.updatedAt ? new Date(record.updatedAt).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'leads':
        return (
          <div className="space-y-8">
            {/* Pipeline Progress */}
            <PipelineProgress 
              record={record} 
              recordType={recordType}
            />
            
            {/* Lead Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                  <InlineEditField
                    value={record?.fullName || record?.name || ''}
                    field="fullName"
                    recordId={record?.id || ''}
                    recordType="universal"
                    placeholder="Enter full name"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
                  <InlineEditField
                    value={record?.email || record?.workEmail || ''}
                    field="email"
                    recordId={record?.id || ''}
                    recordType="universal"
                    inputType="email"
                    placeholder="Enter email address"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
                  <InlineEditField
                    value={record?.phone || record?.mobilePhone || ''}
                    field="phone"
                    recordId={record?.id || ''}
                    recordType="universal"
                    inputType="tel"
                    placeholder="Enter phone number"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">LinkedIn Profile</label>
                  <InlineEditField
                    value={record?.linkedinUrl || ''}
                    field="linkedinUrl"
                    recordId={record?.id || ''}
                    recordType="universal"
                    inputType="url"
                    placeholder="Enter LinkedIn URL"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Job Title</label>
                  <InlineEditField
                    value={record?.jobTitle || record?.title || ''}
                    field="jobTitle"
                    recordId={record?.id || ''}
                    recordType="universal"
                    placeholder="Enter job title"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Department</label>
                  <InlineEditField
                    value={record?.department || ''}
                    field="department"
                    recordId={record?.id || ''}
                    recordType="universal"
                    placeholder="Enter department"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Location</label>
                  <InlineEditField
                    value={record?.city || ''}
                    field="city"
                    recordId={record?.id || ''}
                    recordType="universal"
                    placeholder="Enter city"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Company Name</label>
                  <InlineEditField
                    value={record?.company || ''}
                    field="company"
                    recordId={record?.id || ''}
                    recordType="universal"
                    placeholder="Enter company name"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Industry</label>
                  <InlineEditField
                    value={record?.industry || ''}
                    field="industry"
                    recordId={record?.id || ''}
                    recordType="universal"
                    placeholder="Enter industry"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Company Website</label>
                  <InlineEditField
                    value={record?.companyDomain || ''}
                    field="companyDomain"
                    recordId={record?.id || ''}
                    recordType="universal"
                    placeholder="Enter company website"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Company Size</label>
                  <InlineEditField
                    value={record?.companySize || ''}
                    field="companySize"
                    recordId={record?.id || ''}
                    recordType="universal"
                    placeholder="Enter company size"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Lead Status & Metadata */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Status & Metadata</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                  <InlineEditField
                    value={record?.status || ''}
                    field="status"
                    recordId={record?.id || ''}
                    recordType="universal"
                    inputType="select"
                    options={[
                      { value: '', label: 'Select Status' },
                      { value: 'new', label: 'New' },
                      { value: 'contacted', label: 'Contacted' },
                      { value: 'qualified', label: 'Qualified' },
                      { value: 'unqualified', label: 'Unqualified' }
                    ]}
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Stage</label>
                  <InlineEditField
                    value={recordType || ''}
                    field="stage"
                    recordId={record?.id || ''}
                    recordType="universal"
                    inputType="select"
                    options={[
                      { value: 'lead', label: 'Lead' },
                      { value: 'prospect', label: 'Prospect' },
                      { value: 'opportunity', label: 'Opportunity' },
                      { value: 'client', label: 'Client' }
                    ]}
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Source</label>
                  <InlineEditField
                    value={record?.source || ''}
                    field="source"
                    recordId={record?.id || ''}
                    recordType="universal"
                    placeholder="Enter source"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Created</label>
                    <p className="text-sm text-gray-800 font-medium">{formatRelativeDate(record?.createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Updated</label>
                    <p className="text-sm text-gray-800 font-medium">{formatRelativeDate(record?.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'companies':
        return (
          <div className="space-y-8">
            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                  <InlineEditField
                    value={record?.name || ''}
                    field="name"
                    recordId={record?.id || ''}
                    recordType="universal"
                    placeholder="Enter company name"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Domain</label>
                  <InlineEditField
                    value={record?.domain || record?.companyDomain || ''}
                    field="domain"
                    recordId={record?.id || ''}
                    recordType="universal"
                    placeholder="Enter domain"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Website</label>
                  <InlineEditField
                    value={record?.website || ''}
                    field="website"
                    recordId={record?.id || ''}
                    recordType="universal"
                    inputType="url"
                    placeholder="Enter website URL"
                    onSave={handleInlineSave}
                    className="text-sm text-blue-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Industry</label>
                  <InlineEditField
                    value={record?.industry || ''}
                    field="industry"
                    recordId={record?.id || ''}
                    recordType="universal"
                    placeholder="Enter industry"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Vertical</label>
                  <InlineEditField
                    value={record?.vertical || ''}
                    field="vertical"
                    recordId={record?.id || ''}
                    recordType="universal"
                    placeholder="Enter vertical"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Size</label>
                  <InlineEditField
                    value={record?.companySize || record?.size || ''}
                    field="companySize"
                    recordId={record?.id || ''}
                    recordType="universal"
                    placeholder="Enter company size"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Type</label>
                  <InlineEditField
                    value={record?.accountType || ''}
                    field="accountType"
                    recordId={record?.id || ''}
                    recordType="universal"
                    placeholder="Enter account type"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                    />
                  </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Tier</label>
                  <InlineEditField
                    value={record?.tier || ''}
                    field="tier"
                    recordId={record?.id || ''}
                    recordType="universal"
                    placeholder="Enter tier"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Revenue</label>
                  <InlineEditField
                    value={record?.revenue?.toString() || ''}
                    field="revenue"
                    recordId={record?.id || ''}
                    recordType="universal"
                    placeholder="Enter revenue"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <InlineEditField
                      value={record?.address || ''}
                      field="address"
                      recordId={record?.id || ''}
                      recordType="universal"
                      placeholder="Enter address"
                      onSave={handleInlineSave}
                      className="text-sm text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <InlineEditField
                      value={record?.city || ''}
                      field="city"
                      recordId={record?.id || ''}
                      recordType="universal"
                      placeholder="Enter city"
                      onSave={handleInlineSave}
                      className="text-sm text-gray-900"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <InlineEditField
                      value={record?.state || ''}
                      field="state"
                      recordId={record?.id || ''}
                      recordType="universal"
                      placeholder="Enter state"
                      onSave={handleInlineSave}
                      className="text-sm text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <InlineEditField
                      value={record?.country || ''}
                      field="country"
                      recordId={record?.id || ''}
                      recordType="universal"
                      placeholder="Enter country"
                      onSave={handleInlineSave}
                      className="text-sm text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Company Intelligence Data */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Intelligence</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">LinkedIn Profile</label>
                    <div className="text-sm text-gray-600">
                      {record?.linkedinUrl ? (
                        <a href={record.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View LinkedIn Profile
                        </a>
                      ) : 'Not available'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Founded Year</label>
                    <div className="text-sm text-gray-600">
                      {record?.foundedYear || 'Not available'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Employee Count</label>
                    <div className="text-sm text-gray-600">
                      {record?.employeeCount ? record.employeeCount.toLocaleString() : 'Not available'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Active Job Postings</label>
                    <div className="text-sm text-gray-600">
                      {record?.activeJobPostings || 'Not available'}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">LinkedIn Followers</label>
                    <div className="text-sm text-gray-600">
                      {record?.linkedinFollowers ? record.linkedinFollowers.toLocaleString() : 'Not available'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">NAICS Codes</label>
                    <div className="text-sm text-gray-600">
                      {record?.naicsCodes?.length > 0 ? record.naicsCodes.join(', ') : 'Not available'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Technologies Used</label>
                    <div className="text-sm text-gray-600">
                      {record?.technologiesUsed?.length > 0 ? record.technologiesUsed.slice(0, 3).join(', ') + (record.technologiesUsed.length > 3 ? '...' : '') : 'Not available'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Competitors</label>
                    <div className="text-sm text-gray-600">
                      {record?.competitors?.length > 0 ? record.competitors.slice(0, 3).join(', ') + (record.competitors.length > 3 ? '...' : '') : 'Not available'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Information */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                    <div className="text-sm text-gray-600">
                      {record?.accountType || 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
                    <div className="text-sm text-gray-600">
                      {record?.tier || 'Not specified'}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Created</label>
                    <div className="text-sm text-gray-600">
                      {record?.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                    <div className="text-sm text-gray-600">
                      {record?.updatedAt ? new Date(record.updatedAt).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'prospects':
      return (
        <div className="space-y-8">
          {/* Pipeline Progress */}
          <PipelineProgress 
            record={record} 
            recordType={recordType}
          />
          
          {/* Prospect Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Prospect Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                  <InlineEditField
                    value={record?.fullName || record?.name || ''}
                    field="fullName"
                    recordId={record?.id || ''}
                    recordType="universal"
                    placeholder="Enter full name"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
                  <InlineEditField
                    value={record?.email || record?.workEmail || ''}
                    field="email"
                    recordId={record?.id || ''}
                    recordType="universal"
                    inputType="email"
                    placeholder="Enter email address"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
                  <InlineEditField
                    value={record?.phone || record?.mobilePhone || ''}
                    field="phone"
                    recordId={record?.id || ''}
                    recordType="universal"
                    inputType="tel"
                    placeholder="Enter phone number"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">LinkedIn Profile</label>
                  <InlineEditField
                    value={record?.linkedinUrl || ''}
                    field="linkedinUrl"
                    recordId={record?.id || ''}
                    recordType="universal"
                    inputType="url"
                    placeholder="Enter LinkedIn URL"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Job Title</label>
                  <InlineEditField
                    value={record?.jobTitle || record?.title || ''}
                    field="jobTitle"
                    recordId={record?.id || ''}
                    recordType="universal"
                    placeholder="Enter job title"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Department</label>
                  <InlineEditField
                    value={record?.department || ''}
                    field="department"
                    recordId={record?.id || ''}
                    recordType="universal"
                    placeholder="Enter department"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Location</label>
                  <InlineEditField
                    value={record?.city || ''}
                    field="city"
                    recordId={record?.id || ''}
                    recordType="universal"
                    placeholder="Enter city"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Company Name</label>
                  <InlineEditField
                    value={record?.company || ''}
                    field="company"
                    recordId={record?.id || ''}
                    recordType="universal"
                    placeholder="Enter company name"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Industry</label>
                  <InlineEditField
                    value={record?.industry || ''}
                    field="industry"
                    recordId={record?.id || ''}
                    recordType="universal"
                    placeholder="Enter industry"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Company Website</label>
                  <InlineEditField
                    value={record?.companyDomain || ''}
                    field="companyDomain"
                    recordId={record?.id || ''}
                    recordType="universal"
                    placeholder="Enter company website"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Company Size</label>
                  <InlineEditField
                    value={record?.companySize || ''}
                    field="companySize"
                    recordId={record?.id || ''}
                    recordType="universal"
                    placeholder="Enter company size"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Prospect Status & Metadata */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Prospect Status & Metadata</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                  <InlineEditField
                    value={record?.status || ''}
                    field="status"
                    recordId={record?.id || ''}
                    recordType="universal"
                    inputType="select"
                    options={[
                      { value: '', label: 'Select Status' },
                      { value: 'engaged', label: 'Engaged' },
                      { value: 'contacted', label: 'Contacted' },
                      { value: 'qualified', label: 'Qualified' },
                      { value: 'unqualified', label: 'Unqualified' }
                    ]}
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Priority</label>
                  <InlineEditField
                    value={record?.priority || ''}
                    field="priority"
                    recordId={record?.id || ''}
                    recordType="universal"
                    inputType="select"
                    options={[
                      { value: '', label: 'Select Priority' },
                      { value: 'high', label: 'High' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'low', label: 'Low' }
                    ]}
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Source</label>
                  <InlineEditField
                    value={record?.source || ''}
                    field="source"
                    recordId={record?.id || ''}
                    recordType="universal"
                    placeholder="Enter source"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Engagement Level</label>
                  <InlineEditField
                    value={record?.engagementLevel || ''}
                    field="engagementLevel"
                    recordId={record?.id || ''}
                    recordType="universal"
                    inputType="select"
                    options={[
                      { value: '', label: 'Select Level' },
                      { value: 'initial', label: 'Initial' },
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' }
                    ]}
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Communication Style</label>
                  <InlineEditField
                    value={record?.communicationStyle || ''}
                    field="communicationStyle"
                    recordId={record?.id || ''}
                    recordType="universal"
                    inputType="select"
                    options={[
                      { value: '', label: 'Select Style' },
                      { value: 'Professional', label: 'Professional' },
                      { value: 'Casual', label: 'Casual' },
                      { value: 'Formal', label: 'Formal' },
                      { value: 'Friendly', label: 'Friendly' }
                    ]}
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Last Contact</label>
                    <InlineEditField
                      value={record?.lastContactDate ? new Date(record.lastContactDate).toLocaleDateString() : ''}
                      field="lastContactDate"
                      recordId={record?.id || ''}
                      recordType="universal"
                      inputType="date"
                      placeholder="No recent contact"
                      onSave={handleInlineSave}
                      className="text-sm text-gray-800 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Next Follow-up</label>
                    <InlineEditField
                      value={record?.nextFollowUpDate ? new Date(record.nextFollowUpDate).toLocaleDateString() : ''}
                      field="nextFollowUpDate"
                      recordId={record?.id || ''}
                      recordType="universal"
                      inputType="date"
                      placeholder="Schedule follow-up"
                      onSave={handleInlineSave}
                      className="text-sm text-gray-800 font-medium"
                    />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Touch Points</label>
                    <p className="text-sm text-gray-800 font-medium">{record?.touchPointsCount || 0}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Response Rate</label>
                    <p className="text-sm text-gray-800 font-medium">{record?.responseRate ? `${Math.round(record.responseRate * 100)}%` : '0%'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Created</label>
                    <p className="text-sm text-gray-800 font-medium">{record?.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'Unknown'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'people':
        return (
          <div className="space-y-8">
            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                  <InlineEditField
                    value={record?.email || record?.workEmail || ''}
                    field="email"
                    recordId={record?.id || ''}
                    recordType="universal"
                    inputType="email"
                    placeholder="Enter email address"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                  <InlineEditField
                    value={record?.phone || record?.mobilePhone || ''}
                    field="phone"
                    recordId={record?.id || ''}
                    recordType="universal"
                    inputType="tel"
                    placeholder="Enter phone number"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">LinkedIn</label>
                  <InlineEditField
                    value={record?.linkedinUrl || ''}
                    field="linkedinUrl"
                    recordId={record?.id || ''}
                    recordType="universal"
                    inputType="url"
                    placeholder="Enter LinkedIn URL"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Job Title</label>
                  <InlineEditField
                    value={record?.jobTitle || record?.title || ''}
                    field="jobTitle"
                      recordId={record?.id || ''}
                      recordType="universal"
                      placeholder="Enter job title"
                      onSave={handleInlineSave}
                      className="text-sm text-gray-800 font-medium"
                    />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Department</label>
                  <InlineEditField
                    value={record?.department || ''}
                    field="department"
                    recordId={record?.id || ''}
                    recordType="universal"
                    placeholder="Enter department"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Company</label>
                  <p className="text-sm text-gray-800 font-medium">
                    {record?.company?.name || record?.company || record?.companyName || 'No company assigned'}
                  </p>
                </div>
              </div>
            </div>

            {/* Status & Priority */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status & Priority</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                  <InlineEditField
                    value={record?.status || 'active'}
                    field="status"
                    recordId={record?.id || ''}
                    recordType="universal"
                    inputType="select"
                    options={[
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                      { value: 'unqualified', label: 'Unqualified' }
                    ]}
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Priority</label>
                  <InlineEditField
                    value={record?.priority || 'medium'}
                    field="priority"
                    recordId={record?.id || ''}
                    recordType="universal"
                    inputType="select"
                    options={[
                      { value: 'high', label: 'High' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'low', label: 'Low' }
                    ]}
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Source</label>
                  <InlineEditField
                    value={record?.source || ''}
                    field="source"
                    recordId={record?.id || ''}
                    recordType="universal"
                    placeholder="Enter source"
                    onSave={handleInlineSave}
                    className="text-sm text-gray-800 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Deep Value Reports Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Deep Value Reports</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Competitive Reports */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Competitive Intelligence</h4>
                  <div className="space-y-2">
                    <a 
                      href="/demo/zeropoint/paper/adp-competitive-deep-value-01K4VM894JE1BWD2TA3FZCNKCK"
                      className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900">ADP Competitive Deep Value Report</div>
                      <div className="text-xs text-gray-500 mt-1">52-page competitive intelligence analysis</div>
                    </a>
                    <a 
                      href="/demo/zeropoint/paper/workday-market-analysis-01K4VM894JE1BWD2TA3FZCNKCK"
                      className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900">Workday Market Analysis Report</div>
                      <div className="text-xs text-gray-500 mt-1">Market positioning and growth opportunities</div>
                    </a>
                  </div>
                </div>

                {/* Market Reports */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Market Intelligence</h4>
                  <div className="space-y-2">
                    <a 
                      href="/demo/zeropoint/paper/hr-tech-market-trends-01K4VM894JE1BWD2TA3FZCNKCK"
                      className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900">HR Tech Market Trends</div>
                      <div className="text-xs text-gray-500 mt-1">Industry growth and emerging technologies</div>
                    </a>
                    <a 
                      href="/demo/zeropoint/paper/enterprise-hr-landscape-01K4VM894JE1BWD2TA3FZCNKCK"
                      className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900">Enterprise HR Landscape</div>
                      <div className="text-xs text-gray-500 mt-1">Market segmentation and opportunities</div>
                    </a>
                  </div>
                </div>

                {/* Buyer Group Reports */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Buyer Group Intelligence</h4>
                  <div className="space-y-2">
                    <a 
                      href="/demo/zeropoint/paper/adp-buyer-group-intel-01K4VM894JE1BWD2TA3FZCNKCK"
                      className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900">ADP Buyer Group Intelligence</div>
                      <div className="text-xs text-gray-500 mt-1">Key decision makers and influencers</div>
                    </a>
                    <a 
                      href="/demo/zeropoint/paper/enterprise-procurement-process-01K4VM894JE1BWD2TA3FZCNKCK"
                      className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900">Enterprise Procurement Process</div>
                      <div className="text-xs text-gray-500 mt-1">Decision-making workflow analysis</div>
                    </a>
                  </div>
                </div>

                {/* Industry Reports */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Industry Analysis</h4>
                  <div className="space-y-2">
                    <a 
                      href="/demo/zeropoint/paper/hr-tech-industry-trends-01K4VM894JE1BWD2TA3FZCNKCK"
                      className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900">HR Technology Industry Trends</div>
                      <div className="text-xs text-gray-500 mt-1">Latest trends and developments</div>
                    </a>
                    <a 
                      href="/demo/zeropoint/paper/ai-automation-impact-01K4VM894JE1BWD2TA3FZCNKCK"
                      className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900">AI & Automation Impact</div>
                      <div className="text-xs text-gray-500 mt-1">Technology disruption analysis</div>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags and Notes */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {record?.tags?.length > 0 ? (
                      record.tags.map((tag: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm">
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">No tags assigned</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes Preview</label>
                  <div className="bg-white p-4">
                    <p className="text-sm text-gray-700">
                      {record?.notes ? record.notes.substring(0, 150) + (record.notes.length > 150 ? '...' : '') : 'No notes added yet'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'people':
        return (
          <div className="space-y-8">
            {/* Key Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Information</label>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Email:</span>
                    <InlineEditField
                      value={record?.email || record?.workEmail || ''}
                      field="email"
                      recordId={record?.id || ''}
                      recordType="universal"
                      inputType="email"
                      placeholder="Enter email address"
                      onSave={handleInlineSave}
                      className="ml-2 text-sm font-medium text-gray-900"
                    />
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Phone:</span>
                    <InlineEditField
                      value={record?.phone || record?.mobilePhone || ''}
                      field="phone"
                      recordId={record?.id || ''}
                      recordType="universal"
                      inputType="tel"
                      placeholder="Enter phone number"
                      onSave={handleInlineSave}
                      className="ml-2 text-sm font-medium text-gray-900"
                    />
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">LinkedIn:</span>
                    <InlineEditField
                      value={record?.linkedinUrl || ''}
                      field="linkedinUrl"
                      recordId={record?.id || ''}
                      recordType="universal"
                      inputType="url"
                      placeholder="Enter LinkedIn URL"
                      onSave={handleInlineSave}
                      className="ml-2 text-sm font-medium text-blue-600"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Professional Details</label>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Title:</span>
                    <InlineEditField
                      value={record?.jobTitle || record?.title || ''}
                      field="jobTitle"
                      recordId={record?.id || ''}
                      recordType="universal"
                      placeholder="Enter job title"
                      onSave={handleInlineSave}
                      className="ml-2 text-sm font-medium text-gray-900"
                    />
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Department:</span>
                    <InlineEditField
                      value={record?.department || ''}
                      field="department"
                      recordId={record?.id || ''}
                      recordType="universal"
                      placeholder="Enter department"
                      onSave={handleInlineSave}
                      className="ml-2 text-sm font-medium text-gray-900"
                    />
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Seniority:</span>
                    <InlineEditField
                      value={record?.seniority || ''}
                      field="seniority"
                      recordId={record?.id || ''}
                      recordType="universal"
                      placeholder="Enter seniority level"
                      onSave={handleInlineSave}
                      className="ml-2 text-sm font-medium text-gray-900"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status & Priority</label>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Status:</span>
                    <InlineEditField
                      value={record?.status || 'new'}
                      field="status"
                      recordId={record?.id || ''}
                      recordType="universal"
                      inputType="select"
                      options={[
                        { value: 'new', label: 'New' },
                        { value: 'contacted', label: 'Contacted' },
                        { value: 'qualified', label: 'Qualified' },
                        { value: 'unqualified', label: 'Unqualified' }
                      ]}
                      onSave={handleInlineSave}
                      className="ml-2"
                    />
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Priority:</span>
                    <InlineEditField
                      value={record?.priority || 'medium'}
                      field="priority"
                      recordId={record?.id || ''}
                      recordType="universal"
                      inputType="select"
                      options={[
                        { value: 'high', label: 'High' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'low', label: 'Low' }
                      ]}
                      onSave={handleInlineSave}
                      className="ml-2"
                    />
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Source:</span>
                    <InlineEditField
                      value={record?.source || ''}
                      field="source"
                      recordId={record?.id || ''}
                      recordType="universal"
                      placeholder="Enter source"
                      onSave={handleInlineSave}
                      className="ml-2 text-sm font-medium text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                    <div className="text-lg text-gray-900">
                      {record?.account?.name || record?.accountName || 'No account assigned'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <InlineEditField
                      value={record?.industry || ''}
                      field="industry"
                      recordId={record?.id || ''}
                      recordType="universal"
                      placeholder="Enter industry"
                      onSave={handleInlineSave}
                      className="text-sm text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Domain</label>
                    <InlineEditField
                      value={record?.companyDomain || ''}
                      field="companyDomain"
                      recordId={record?.id || ''}
                      recordType="universal"
                      placeholder="Enter company domain"
                      onSave={handleInlineSave}
                      className="text-sm text-gray-900"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vertical</label>
                    <InlineEditField
                      value={record?.vertical || ''}
                      field="vertical"
                      recordId={record?.id || ''}
                      recordType="universal"
                      placeholder="Enter vertical"
                      onSave={handleInlineSave}
                      className="text-sm text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Location</label>
                    <InlineEditField
                      value={record?.city || ''}
                      field="city"
                      recordId={record?.id || ''}
                      recordType="universal"
                      placeholder="Enter city"
                      onSave={handleInlineSave}
                      className="text-sm text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tags and Notes */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <div className="text-sm text-gray-600">
                      {record?.tags?.length > 0 ? record.tags.join(', ') : 'No tags assigned'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes Preview</label>
                    <div className="text-sm text-gray-600">
                      {record?.notes ? record.notes.substring(0, 100) + '...' : 'No notes added yet'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-8">
            {/* Key Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Information</label>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {record?.email || record?.workEmail || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Phone:</span>
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {record?.phone || record?.mobilePhone || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">LinkedIn:</span>
                    <span className="ml-2 text-sm font-medium text-blue-600">
                      {record?.linkedinUrl ? (
                        <a href={record.linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          View Profile
                        </a>
                      ) : '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Professional Details</label>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Title:</span>
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {record?.jobTitle || record?.title || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Department:</span>
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {record?.department || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Seniority:</span>
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {record?.seniority || '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status & Priority</label>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      record?.status === 'qualified' ? 'bg-green-100 text-green-800' :
                      record?.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                      record?.status === 'new' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {record?.status || 'New'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Priority:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      record?.priority === 'high' ? 'bg-red-100 text-red-800' :
                      record?.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {record?.priority || 'Medium'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Source:</span>
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {record?.source || '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                    <div className="text-lg font-semibold text-gray-900">
                      {record?.company?.name || record?.company || '-'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <InlineEditField
                      value={record?.industry || ''}
                      field="industry"
                      recordId={record?.id || ''}
                      recordType={recordType}
                      placeholder="Enter industry"
                      onSave={onSave}
                      className="text-lg text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                    <InlineEditField
                      value={record?.companySize || ''}
                      field="companySize"
                      recordId={record?.id || ''}
                      recordType={recordType}
                      placeholder="Enter company size"
                      onSave={onSave}
                      className="text-lg text-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Domain</label>
                    <div className="text-lg text-gray-900">
                      {record?.companyDomain || '-'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vertical</label>
                    <div className="text-lg text-gray-900">
                      {record?.vertical || '-'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Location</label>
                    <div className="text-lg text-gray-900">
                      {[record?.city, record?.state, record?.country].filter(Boolean).join(', ') || '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* Tags and Notes */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {record?.tags?.length > 0 ? (
                      record.tags.map((tag: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm">
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">No tags assigned</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes Preview</label>
                  <div className="bg-white p-4">
                    <p className="text-sm text-gray-700">
                      {record?.notes ? record.notes.substring(0, 150) + (record.notes.length > 150 ? '...' : '') : 'No notes added yet'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      {getRecordFields()}
    </div>
  );
}
