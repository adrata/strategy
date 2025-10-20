"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';
import { CompanyDetailSkeleton, Skeleton } from '@/platform/ui/components/Loader';
import { InlineEditField } from '@/frontend/components/pipeline/InlineEditField';
import { authFetch } from '@/platform/api-fetch';

interface UniversalOverviewTabProps {
  recordType: string;
  record?: any;
  onSave?: (field: string, value: string, recordId?: string, recordType?: string) => Promise<void>;
}

export function UniversalOverviewTab({ recordType, record: recordProp, onSave }: UniversalOverviewTabProps) {
  const { currentRecord: contextRecord } = useRecordContext();
  const record = recordProp || contextRecord;
  
  // Success message state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Actions state
  const [actions, setActions] = useState<any[]>([]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [actionsError, setActionsError] = useState<string | null>(null);
  
  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // Fetch actions from API
  const fetchActions = useCallback(async () => {
    if (!record?.id) {
      setActions([]);
      return;
    }

    setActionsLoading(true);
    setActionsError(null);

    try {
      // Build the correct query parameters based on record type
      let actionsQuery = '';
      if (recordType === 'leads' || recordType === 'people' || recordType === 'prospects' || recordType === 'speedrun' || recordType === 'actions') {
        actionsQuery = `personId=${record.id}`;
      } else if (recordType === 'companies') {
        actionsQuery = `companyId=${record.id}`;
      } else {
        // For other types, try both
        actionsQuery = `personId=${record.id}&companyId=${record.id}`;
      }

      const response = await authFetch(`/api/v1/actions?${actionsQuery}&limit=5&sortBy=createdAt&sortOrder=desc`);
      
      if (response && response.success && Array.isArray(response.data)) {
        setActions(response.data);
      } else {
        setActions([]);
        setActionsError('Failed to fetch actions');
      }
    } catch (error) {
      console.error('Error fetching actions:', error);
      setActions([]);
      setActionsError('Error loading actions');
    } finally {
      setActionsLoading(false);
    }
  }, [record?.id, recordType]);

  // Fetch actions when component mounts or record changes
  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  // Show skeleton loader while data is loading
  if (!record) {
    return <CompanyDetailSkeleton message="Loading record details..." />;
  }

  // Safety check: ensure record is an object and not being rendered directly
  if (typeof record !== 'object' || record === null) {
    return <CompanyDetailSkeleton message="Invalid record data..." />;
  }

  // Debug: Log the record structure to see what's available
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [Universal Overview Debug] Record structure:', {
      recordKeys: Object.keys(record || {}),
      customFields: record?.customFields,
      company: record?.company,
      buyerGroupRole: record?.customFields?.buyerGroupRole,
      coresignal: record?.customFields?.coresignal,
      coresignalData: record?.customFields?.coresignalData,
      coresignalProfile: record?.customFields?.coresignalProfile,
      // Debug the actual values
      influenceLevel: record?.customFields?.influenceLevel,
      engagementStrategy: record?.customFields?.engagementStrategy,
      employeeId: record?.customFields?.coresignal?.employeeId,
      followersCount: record?.customFields?.coresignal?.followersCount,
      connectionsCount: record?.customFields?.coresignal?.connectionsCount,
      totalFields: record?.customFields?.totalFields
    });
  }

  // Extract CoreSignal data from the correct location
  const coresignalData = record?.customFields?.coresignal || record?.customFields?.coresignalData || {};
  const coresignalProfile = record?.customFields?.coresignalProfile || {};
  const enrichedData = record?.customFields?.enrichedData || {};
  
  // Debug: Log the extracted Coresignal data
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [Universal Overview] Extracted Coresignal data:', {
      coresignalData: coresignalData,
      full_name: coresignalData.full_name,
      active_experience_title: coresignalData.active_experience_title,
      primary_professional_email: coresignalData.primary_professional_email,
      active_experience_company: coresignalData.active_experience_company,
      experience: coresignalData.experience,
      // Debug the actual values we're extracting
      extractedCompany: coresignalData.active_experience_company || coresignalData.experience?.find(exp => exp.active_experience === 1)?.company_name || coresignalData.experience?.[0]?.company_name,
      extractedTitle: coresignalData.active_experience_title,
      extractedEmail: coresignalData.primary_professional_email
    });
  }
  
  // Helper component for displaying values with proper empty state
  const DisplayValue = ({ value, children, className = "text-sm font-medium text-[var(--foreground)]" }: { 
    value: any, 
    children?: React.ReactNode, 
    className?: string 
  }) => {
    if (value) {
      return <span className={className}>{children || value}</span>;
    }
    return <span className="text-sm text-[var(--muted)]">-</span>;
  };

  // Extract comprehensive record data from CoreSignal with database fallback
  const recordData = {
    // Basic info - Database fields first, then CoreSignal fallback - no fallback to '-'
    name: record?.fullName || record?.name || coresignalData.full_name || null,
    title: record?.jobTitle || record?.title || coresignalData.active_experience_title || coresignalData.experience?.find(exp => exp.active_experience === 1)?.position_title || coresignalData.experience?.[0]?.position_title || null,
    email: (() => {
      const emailValue = record?.email || record?.workEmail || coresignalData.primary_professional_email || null;
      console.log(`🔍 [OVERVIEW TAB] Email extraction:`, {
        recordId: record?.id,
        recordEmail: record?.email,
        recordWorkEmail: record?.workEmail,
        coresignalEmail: coresignalData.primary_professional_email,
        finalEmail: emailValue
      });
      return emailValue;
    })(),
    phone: record?.phone || coresignalData.phone || null,
    linkedin: record?.linkedin || record?.linkedinUrl || coresignalData.linkedin_url || null,
    linkedinNavigatorUrl: record?.linkedinNavigatorUrl || null,
    bio: record?.bio || null,
    
    // Company info - Coresignal data with database fallback
    company: (() => {
      // Handle both string and object company formats
      const coresignalCompany = coresignalData.experience?.find(exp => exp.active_experience === 1)?.company_name || coresignalData.experience?.[0]?.company_name;
      const recordCompany = typeof record?.company === 'string' 
        ? record.company 
        : (record?.company?.name || record?.companyName);
      return coresignalCompany || recordCompany || null;
    })(),
    industry: coresignalData.experience?.find(exp => exp.active_experience === 1)?.company_industry || coresignalData.experience?.[0]?.company_industry || record?.company?.industry || record?.industry || null,
    department: coresignalData.active_experience_department || coresignalData.experience?.find(exp => exp.active_experience === 1)?.department || coresignalData.experience?.[0]?.department || record?.department || null,
    
    // CoreSignal intelligence - use customFields directly
    influenceLevel: record.customFields?.influenceLevel || null,
    engagementStrategy: record.customFields?.engagementStrategy || null,
    isBuyerGroupMember: record.isBuyerGroupMember || !!record.buyerGroupRole, // Defensive: show Yes if has role, even if flag is false
    buyerGroupOptimized: record.customFields?.buyerGroupOptimized || false,
    
    // Experience and skills - use CoreSignal data
    totalExperience: coresignalData.total_experience_duration_months || coresignalData.totalExperienceMonths || 0,
    skills: coresignalData.inferred_skills || coresignalData.skills || [],
    experience: coresignalData.experience || [],
    education: coresignalData.education || [],
    
    // CoreSignal profile data
    employeeId: coresignalData.id || coresignalData.employeeId || '379066666',
    followersCount: coresignalData.followers_count || coresignalData.followersCount || 2,
    connectionsCount: coresignalData.connections_count || coresignalData.connectionsCount || 2,
    isDecisionMaker: coresignalData.is_decision_maker || coresignalData.isDecisionMaker || 0,
    enrichedAt: coresignalData.lastEnrichedAt || coresignalData.enrichedAt || new Date().toISOString(),
    
    // Contact history
    lastContact: record.lastActionDate || record.updatedAt || '-',
    lastAction: record.lastAction || '-',
    nextAction: record.nextAction || 'Schedule follow-up call',
    nextActionDate: record.nextActionDate || '-',
    
    // Notes
    notes: record.notes || '-',
    
    // Metadata
    lastEnrichedAt: record.customFields?.lastEnrichedAt || record.updatedAt || new Date().toISOString(),
    totalFields: record.customFields?.totalFields || 13,
    status: record.status || 'active',
    source: record.customFields?.source || 'Data Enrichment',
    seniority: record.customFields?.seniority || 'Mid-level'
  };

  const formatRelativeDate = (dateString: string | Date | null | undefined): string => {
    if (!dateString || dateString === 'Never' || dateString === 'Invalid Date') return 'Never';
    
    try {
    const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Never';
      
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
    } catch {
      return 'Never';
    }
  };

  // Helper function to check if a value is meaningful (not blank, null, undefined, or "-")
  const hasValue = (value: any): boolean => {
    return value && value !== '-' && value !== '--' && String(value).trim() !== '';
  };

  // Utility function to standardize empty value display
  const formatEmptyValue = (value: any): string => {
    if (!value || value === '' || value === 'null' || value === 'undefined') {
      return '-';
    }
    return value;
  };

  // Generate natural bio text that gracefully handles missing data
  const generateBioText = (): string => {
    const sentences: string[] = [];
    
    // Build the main identity sentence
    const name = hasValue(recordData.name) ? recordData.name : 'This contact';
    const title = hasValue(recordData.title) ? recordData.title : null;
    const company = hasValue(recordData.company) ? recordData.company : null;
    
    if (title && company) {
      sentences.push(`${name} is a ${title}${company ? ` at ${company}` : ''}.`);
    } else if (title) {
      sentences.push(`${name} is a ${title}.`);
    } else if (company) {
      sentences.push(`${name} works${company ? ` at ${company}` : ''}.`);
    } else {
      sentences.push(`${name} is a professional contact.`);
    }
    
    // Add buyer group status
    if (recordData.isBuyerGroupMember) {
      const influenceLevel = hasValue(recordData.influenceLevel) ? recordData.influenceLevel : 'moderate';
      sentences.push(`They are an active member of the buyer group with ${influenceLevel} influence level.`);
    } else {
      sentences.push('They are not currently part of the buyer group.');
    }
    
    // Add engagement and contact information
    const lastContact = hasValue(recordData.lastContact) && recordData.lastContact !== 'Never' 
      ? formatRelativeDate(recordData.lastContact) 
      : null;
    
    if (lastContact && lastContact !== 'Never') {
      sentences.push(`Last contact was ${lastContact}.`);
    } else {
      sentences.push('No recent contact recorded.');
    }
    
    return sentences.join(' ');
  };


  // Generate last actions from fetched API data
  const generateLastActions = () => {
    if (actionsLoading) {
      return [];
    }
    
    if (actionsError) {
      return [];
    }
    
    // Map fetched actions to display format
    return actions.map(action => ({
      action: action.subject || action.title || 'Action',
      date: formatRelativeDate(action.completedAt || action.scheduledAt || action.createdAt)
    }));
  };

  const lastActions = generateLastActions();

        return (
          <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-[var(--foreground)]">Overview</h2>
      </div>

      {/* Overview Summary */}
      <div className="space-y-4">
        <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
          <div className="text-sm text-[var(--foreground)]">
            {generateBioText()}
          </div>
        </div>
      </div>

      {/* Who are they */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information Card */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Basic Information</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Name:</span>
                <InlineEditField
                  value={recordData.name}
                  field="name"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Title:</span>
                <InlineEditField
                  value={recordData.title}
                  field="title"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Company:</span>
                <InlineEditField
                  value={recordData.company}
                  field="company"
                  variant="company"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Department:</span>
                <InlineEditField
                  value={recordData.department}
                  field="department"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">State:</span>
                <InlineEditField
                  value={record.state || record.company?.hqState || ''}
                  field="state"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Bio URL:</span>
                <InlineEditField
                  value={formatEmptyValue(recordData.bio)}
                  field="bio"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
            </div>
          </div>

          {/* Intelligence Snapshot Card */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Intelligence Snapshot</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Buyer Group Member:</span>
                <InlineEditField
                  value={recordData.isBuyerGroupMember ? 'Yes' : 'No'}
                  field="isBuyerGroupMember"
                  inputType="select"
                  options={[
                    { value: 'Yes', label: 'Yes' },
                    { value: 'No', label: 'No' }
                  ]}
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Role:</span>
                <InlineEditField
                  value={formatEmptyValue(record.buyerGroupRole || 'Stakeholder')}
                  field="buyerGroupRole"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Influence Level:</span>
                <InlineEditField
                  value={formatEmptyValue(recordData.influenceLevel)}
                  field="influenceLevel"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Decision Power:</span>
                <InlineEditField
                  value={formatEmptyValue(record.customFields?.decisionPower || '70')}
                  field="decisionPower"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Engagement Level:</span>
                <InlineEditField
                  value={formatEmptyValue(record.customFields?.engagementLevel || 'Medium')}
                  field="engagementLevel"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How do I reach them */}
                <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information Card */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Contact Information</h4>
                <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Email:</span>
                <InlineEditField
                  value={formatEmptyValue(recordData.email)}
                  field="email"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Phone:</span>
                <InlineEditField
                  value={formatEmptyValue(recordData.phone)}
                  field="phone"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">LinkedIn:</span>
                <InlineEditField
                  value={formatEmptyValue(recordData.linkedin)}
                  field="linkedinUrl"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">LinkedIn Navigator:</span>
                <InlineEditField
                  value={formatEmptyValue(recordData.linkedinNavigatorUrl)}
                  field="linkedinNavigatorUrl"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
                </div>
              </div>

          {/* Engagement History Card */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Engagement History</h4>
                <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Last Contact:</span>
                <InlineEditField
                  value={recordData.lastContact}
                  field="lastActionDate"
                  variant="date"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Next Action:</span>
                <InlineEditField
                  value={formatEmptyValue(recordData.nextAction)}
                  field="nextAction"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Status:</span>
                <InlineEditField
                  value={formatEmptyValue(recordData.status)}
                  field="status"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
                  </div>
                </div>
              </div>
            </div>


      {/* Last Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Last Actions</h3>
        <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
          {actionsLoading ? (
            <Skeleton lines={3} className="py-4" />
          ) : actionsError ? (
            <div className="text-center py-4">
              <p className="text-sm text-[var(--error)] mb-3">Error loading actions</p>
              <p className="text-xs text-[var(--muted)]">{actionsError}</p>
            </div>
          ) : lastActions.length > 0 ? (
            <ul className="space-y-2">
              {lastActions.map((action, index) => (
                <li key={index} className="text-sm text-[var(--foreground)]">
                  • {action.action} - {action.date}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-[var(--muted)] mb-3">No actions logged yet</p>
              <p className="text-xs text-[var(--muted)]">Actions will appear here when logged through the Actions tab</p>
            </div>
          )}
        </div>
      </div>

      {/* Notes on them */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Notes on them</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Recent Notes Summary</h4>
            <InlineEditField
              value={record.notes && record.notes !== 'No notes available' && record.notes.trim() !== '' ? record.notes : ''}
              field="notes"
              type="textarea"
              onSave={onSave || (() => Promise.resolve())}
              recordId={record.id}
              recordType={recordType}
              onSuccess={handleSuccess}
              className="text-sm text-[var(--foreground)] leading-relaxed"
              placeholder="Add notes about this contact..."
            />
                </div>
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Engagement Strategy</h4>
            <div className="text-sm text-[var(--foreground)] leading-relaxed">
              Focus on {(recordData.engagementPriority || '').toLowerCase()} priority engagement. 
              Last contact was {formatRelativeDate(recordData.lastContact)}. 
              Next action: {recordData.nextAction}.
                  </div>
                </div>
              </div>
            </div>

            {/* Success Toast */}
            {showSuccessMessage && (
              <div className="fixed bottom-4 right-4 z-50">
                <div className="px-4 py-2 rounded-lg shadow-lg bg-green-50 border border-green-200 text-green-800">
                  <div className="flex items-center space-x-2">
                    <span>✓</span>
                    <span className="text-sm font-medium">{successMessage}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
    }
