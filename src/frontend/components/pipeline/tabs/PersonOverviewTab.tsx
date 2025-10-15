"use client";

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';
import { CompanyDetailSkeleton } from '@/platform/ui/components/Loader';
import { getPhoneDisplayValue } from '@/platform/utils/phone-validator';
import { InlineEditField } from '@/frontend/components/pipeline/InlineEditField';
import { authFetch } from '@/platform/api-fetch';

interface PersonOverviewTabProps {
  recordType: string;
  record?: any;
  onSave?: (field: string, value: string, recordId?: string, recordType?: string) => Promise<void>;
}

export function PersonOverviewTab({ recordType, record: recordProp, onSave }: PersonOverviewTabProps) {
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
    return <CompanyDetailSkeleton message="Loading person details..." />;
  }

  // Safety check: ensure record is an object and not being rendered directly
  if (typeof record !== 'object' || record === null) {
    return <CompanyDetailSkeleton message="Invalid record data..." />;
  }

  // Debug logging removed for performance optimization

  // Helper component for displaying values with proper empty state
  const DisplayValue = ({ value, children, className = "text-sm font-medium text-[var(--foreground)]" }: { 
    value: any, 
    children?: React.ReactNode, 
    className?: string 
  }) => {
    if (value) {
      return <span className={className}>{children || value}</span>;
    }
    return <span className="text-sm italic text-[var(--muted)]">No data available</span>;
  };

  // Memoize data extraction to prevent expensive recalculations on every render
  const { coresignalData, coresignalProfile, enrichedData, personData } = useMemo(() => {
    // Extract CoreSignal data from the correct location
    const coresignalData = record?.customFields?.coresignal || record?.customFields?.coresignalData || {};
    const coresignalProfile = record?.customFields?.coresignalProfile || {};
    const enrichedData = record?.customFields?.enrichedData || {};
    
    // Extract comprehensive person data from database first, then CoreSignal fallback - no fallback to '-'
    const personData = {
    // Basic info - Database fields first, then CoreSignal fallback
    name: record?.fullName || record?.name || coresignalData.full_name || null,
    title: record?.jobTitle || record?.title || coresignalData.active_experience_title || coresignalData.experience?.find(exp => exp.active_experience === 1)?.position_title || coresignalData.experience?.[0]?.position_title || null,
    email: record?.email || coresignalData.primary_professional_email || null,
    phone: getPhoneDisplayValue(record?.phone || coresignalData.phone || coresignalData.mobile_phone || coresignalData.work_phone),
    linkedin: record?.linkedin || coresignalData.linkedin_url || null,
    linkedinNavigatorUrl: record?.linkedinNavigatorUrl || null,
    linkedinConnectionDate: record?.linkedinConnectionDate || null,
    
    // Company info - Database fields first, then CoreSignal fallback
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
    
    // Location info - Coresignal data only
    location: coresignalData.location_full || coresignalData.city || coresignalData.state || coresignalData.country || null,
    
    // CoreSignal intelligence - use customFields directly
    influenceLevel: record.customFields?.influenceLevel || null,
    engagementStrategy: record.customFields?.engagementStrategy || null,
    isBuyerGroupMember: record.customFields?.isBuyerGroupMember || false,
    buyerGroupOptimized: record.customFields?.buyerGroupOptimized || false,
    
    // Experience and skills - use CoreSignal data
    totalExperience: coresignalData.total_experience_duration_months || coresignalData.totalExperienceMonths || 0,
    skills: coresignalData.inferred_skills || coresignalData.skills || [],
    experience: coresignalData.experience || [],
    education: coresignalData.education || [],
    
    // Additional CoreSignal data
    followersCount: coresignalData.followers_count || coresignalData.followersCount || 0,
    connectionsCount: coresignalData.connections_count || coresignalData.connectionsCount || 0,
    isDecisionMaker: coresignalData.is_decision_maker || coresignalData.isDecisionMaker || 0,
    
    // CoreSignal profile data
    employeeId: coresignalData.id || coresignalData.employeeId || '379066666',
    enrichedAt: coresignalData.lastEnrichedAt || coresignalData.enrichedAt || new Date().toISOString(),
    
    // Contact history
    lastContact: record.lastActionDate || record.updatedAt || null,
    lastAction: record.lastAction || null,
    nextAction: record.nextAction || null,
    nextActionDate: record.nextActionDate || null,
    
    // Notes
    notes: record.notes || null,
    
    // Metadata
    lastEnrichedAt: record.customFields?.lastEnrichedAt || record.updatedAt || new Date().toISOString(),
    totalFields: record.customFields?.totalFields || 13,
    status: record.status || 'active',
    source: record.customFields?.source || 'Data Enrichment',
    seniority: record.customFields?.seniority || 'Mid-level'
  };

  return { coresignalData, coresignalProfile, enrichedData, personData };
  }, [record]);

  // Debug logging removed for cleaner console

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

  // Generate wants and needs based on role and industry
  const generateWantsAndNeeds = () => {
    const role = (personData.title || '').toLowerCase();
    const industry = (personData.industry || '').toLowerCase();
    const department = (personData.department || '').toLowerCase();
    
    const wants = [];
    const needs = [];
    
    // Role-based wants and needs
    if (role.includes('director') || role.includes('vp') || role.includes('vice president')) {
      wants.push('Strategic solutions that drive business growth');
      wants.push('ROI-focused technology investments');
      wants.push('Competitive advantage in their market');
      needs.push('Executive-level decision support');
      needs.push('Strategic planning tools');
    } else if (role.includes('manager') || role.includes('supervisor')) {
      wants.push('Operational efficiency improvements');
      wants.push('Team productivity tools');
      wants.push('Process automation solutions');
      needs.push('Management reporting capabilities');
      needs.push('Team collaboration tools');
    } else if (role.includes('safety') || role.includes('advisor')) {
      wants.push('Safety compliance tools');
      wants.push('Risk assessment capabilities');
      wants.push('Incident prevention systems');
      needs.push('Safety training resources');
      needs.push('Regulatory compliance support');
    } else {
      wants.push('User-friendly technology solutions');
      wants.push('Improved workflow efficiency');
      wants.push('Better integration with existing systems');
      needs.push('Training and support resources');
      needs.push('Reliable technical solutions');
    }
    
    // Industry-based wants and needs
    if (industry.includes('technology') || industry.includes('software')) {
      wants.push('Cutting-edge technology solutions');
      wants.push('Scalable and flexible platforms');
      needs.push('Technical expertise and support');
      needs.push('Integration capabilities');
    } else if (industry.includes('healthcare')) {
      wants.push('Compliance-focused solutions');
      wants.push('Patient data security');
      needs.push('HIPAA-compliant systems');
      needs.push('Regulatory compliance support');
    } else if (industry.includes('finance') || industry.includes('banking')) {
      wants.push('Financial data security');
      wants.push('Regulatory compliance');
      needs.push('Audit trail capabilities');
      needs.push('Risk management tools');
    } else if (industry.includes('food') || industry.includes('beverage') || industry.includes('manufacturing')) {
      wants.push('Food safety compliance tools');
      wants.push('Quality control systems');
      needs.push('HACCP compliance support');
      needs.push('Supply chain traceability');
    }
    
    return { wants, needs };
  };

  const { wants, needs } = generateWantsAndNeeds();

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
        <h2 className="text-xl font-semibold text-[var(--foreground)]">Bio</h2>
      </div>

      {/* Who are they */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information Card */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Basic Information</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Name:</span>
                <InlineEditField
                  value={personData.name}
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
                  value={personData.title}
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
                  value={personData.company}
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
                  value={personData.department}
                  field="department"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
            </div>
          </div>

          {/* Intelligence Data Card */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Intelligence Profile</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Influence Level:</span>
                <InlineEditField
                  value={personData.influenceLevel}
                  field="influenceLevel"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  inputType="select"
                  options={[
                    { value: 'High', label: 'High' },
                    { value: 'Medium', label: 'Medium' },
                    { value: 'Low', label: 'Low' }
                  ]}
                  className="text-sm font-medium text-[var(--foreground)] capitalize"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Engagement Strategy:</span>
                <InlineEditField
                  value={personData.engagementStrategy}
                  field="engagementStrategy"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)] capitalize"
                />
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Buyer Group Member:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  personData.isBuyerGroupMember ? 'bg-green-100 text-green-800' : 'bg-[var(--hover)] text-gray-800'
                }`}>
                  {personData.isBuyerGroupMember ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Buyer Group Optimized:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  personData.buyerGroupOptimized ? 'bg-green-100 text-green-800' : 'bg-[var(--hover)] text-gray-800'
                }`}>
                  {personData.buyerGroupOptimized ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Seniority:</span>
                <span className="text-sm font-medium text-[var(--foreground)] capitalize">{personData.seniority}</span>
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
                  value={personData.email}
                  field="email"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="email"
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Phone:</span>
                <InlineEditField
                  value={personData.phone}
                  field="phone"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="text"
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">LinkedIn:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {personData.linkedin && personData.linkedin !== '-' ? (
                    <a 
                      href={personData.linkedin.startsWith('http') ? personData.linkedin : `https://${personData.linkedin}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {personData.linkedin.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                    </a>
                  ) : (
                    personData.linkedin
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">LinkedIn Navigator:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {personData.linkedinNavigatorUrl && personData.linkedinNavigatorUrl !== '-' ? (
                    <a 
                      href={personData.linkedinNavigatorUrl.startsWith('http') ? personData.linkedinNavigatorUrl : `https://${personData.linkedinNavigatorUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {personData.linkedinNavigatorUrl.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                    </a>
                  ) : (
                    personData.linkedinNavigatorUrl || '-'
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">LinkedIn Connection Date:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {personData.linkedinConnectionDate ? 
                    new Date(personData.linkedinConnectionDate).toLocaleDateString() : 
                    '-'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Engagement History Card */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Engagement History</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Last Contact:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{formatRelativeDate(personData.lastContact)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Next Action:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{personData.nextAction}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Status:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  personData.status === 'active' ? 'bg-green-100 text-green-800' :
                  personData.status === 'inactive' ? 'bg-[var(--hover)] text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {personData.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>




      {/* What do they care about */}
      <div className="space-y-4">
        <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
          <h4 className="font-medium text-[var(--foreground)] mb-3">
            Professional Insights: Based on their role as {personData.title} at {personData.company}, they likely care about:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Wants</h5>
              <ul className="space-y-1">
                {wants.map((want, index) => (
                  <li key={index} className="text-sm text-[var(--muted)] flex items-start">
                    <span className="text-[var(--muted)] mr-2">•</span>
                    {want}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Needs</h5>
              <ul className="space-y-1">
                {needs.map((need, index) => (
                  <li key={index} className="text-sm text-[var(--muted)] flex items-start">
                    <span className="text-[var(--muted)] mr-2">•</span>
                    {need}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

        {/* Last Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">What did I last do</h3>
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Last Actions:</h4>
            {actionsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-[var(--muted)]">Loading actions...</p>
              </div>
            ) : actionsError ? (
              <div className="text-center py-4">
                <p className="text-sm text-red-600 mb-3">Error loading actions</p>
                <p className="text-xs text-[var(--muted)]">{actionsError}</p>
              </div>
            ) : lastActions.length > 0 ? (
              <ul className="space-y-2">
                {lastActions.map((action, index) => (
                  <li key={index} className="text-sm text-[var(--muted)]">
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
            <div className="text-sm text-[var(--muted)] leading-relaxed">
              {personData.notes && personData.notes !== 'No notes available' && personData.notes.trim() !== '' ? personData.notes : 
                `—`
              }
            </div>
          </div>
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Engagement Strategy</h4>
            <div className="text-sm text-[var(--muted)] leading-relaxed">
              Focus on {(personData.engagementPriority || '').toLowerCase()} priority engagement. 
              Last contact was {formatRelativeDate(personData.lastContact)}. 
              Next action: {personData.nextAction}.
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
