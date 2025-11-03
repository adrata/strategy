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

  // Listen for action creation events to refresh actions
  useEffect(() => {
    // Only add event listeners on client side
    if (typeof window === 'undefined') return;
    
    const handleActionCreated = (event: CustomEvent) => {
      const { recordId } = event.detail || {};
      if (recordId === record?.id) {
        console.log('🔄 [OVERVIEW] Action created event matches current record, refreshing actions');
        // Refresh actions immediately
        fetchActions();
      }
    };

    document.addEventListener('actionCreated', handleActionCreated as EventListener);
    
    return () => {
      document.removeEventListener('actionCreated', handleActionCreated as EventListener);
    };
  }, [record?.id, recordType, fetchActions]);

  // Show skeleton loader while data is loading
  if (!record) {
    return <CompanyDetailSkeleton message="Loading person details..." />;
  }

  // Safety check: ensure record is an object and not being rendered directly
  if (typeof record !== 'object' || record === null) {
    return <CompanyDetailSkeleton message="Invalid record data..." />;
  }

  // Debug logging removed for performance optimization

  // Utility function to standardize empty value display
  const formatEmptyValue = (value: any): string => {
    if (!value || value === '' || value === 'null' || value === 'undefined') {
      return '-';
    }
    return value;
  };

  // Helper component for displaying values with proper empty state
  const DisplayValue = ({ value, children, className = "text-sm font-medium text-foreground" }: { 
    value: any, 
    children?: React.ReactNode, 
    className?: string 
  }) => {
    if (value) {
      return <span className={className}>{children || value}</span>;
    }
    return <span className="text-sm text-muted">-</span>;
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
    bio: record?.bio || null,
    
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
    
    // CoreSignal intelligence - check top-level fields first, then customFields
    influenceLevel: record.influenceLevel ?? record.customFields?.influenceLevel ?? null,
    engagementStrategy: record.customFields?.engagementStrategy || null,
    isBuyerGroupMember: record.isBuyerGroupMember ?? record.customFields?.isBuyerGroupMember ?? false,
    buyerGroupOptimized: record.buyerGroupOptimized ?? record.customFields?.buyerGroupOptimized ?? false,
    buyerGroupRole: record.buyerGroupRole ?? record.customFields?.buyerGroupRole ?? null,
    
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
    status: record.status || 'LEAD',
    source: record.customFields?.source || 'Data Enrichment',
    seniority: record.seniority ?? record.customFields?.seniority ?? 'Mid-level'
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

  const formatFullDate = (dateString: string | Date | null | undefined): string => {
    if (!dateString || dateString === 'Never' || dateString === 'Invalid Date') return 'Never';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Never';
      
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
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
      type: action.type || null,
      date: formatRelativeDate(action.completedAt || action.scheduledAt || action.createdAt)
    }));
  };

  const lastActions = generateLastActions();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">Overview</h2>
      </div>

      {/* Who are they */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information Card */}
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Basic Information</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Name:</span>
                <InlineEditField
                  value={personData.name}
                  field="name"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Title:</span>
                <InlineEditField
                  value={personData.title}
                  field="title"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Company:</span>
                <InlineEditField
                  value={personData.company}
                  field="company"
                  variant="company"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  companyId={record.companyId || (typeof record.company === 'object' && record.company?.id) || null}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Department:</span>
                <InlineEditField
                  value={personData.department}
                  field="department"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Bio URL:</span>
                <InlineEditField
                  value={formatEmptyValue(personData.bio)}
                  field="bio"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Intelligence Data Card */}
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Intelligence Profile</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Influence Level:</span>
                <InlineEditField
                  value={personData.influenceLevel}
                  field="influenceLevel"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  inputType="select"
                  options={[
                    { value: 'High', label: 'High' },
                    { value: 'Medium', label: 'Medium' },
                    { value: 'Low', label: 'Low' }
                  ]}
                  className="text-sm font-medium text-foreground capitalize"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Engagement Strategy:</span>
                <InlineEditField
                  value={personData.engagementStrategy}
                  field="engagementStrategy"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground capitalize"
                />
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Buyer Group Member:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  personData.isBuyerGroupMember ? 'bg-success-bg text-success-text' : 'bg-hover text-foreground'
                }`}>
                  {personData.isBuyerGroupMember ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Buyer Group Optimized:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  personData.buyerGroupOptimized ? 'bg-success-bg text-success-text' : 'bg-hover text-foreground'
                }`}>
                  {personData.buyerGroupOptimized ? 'Yes' : 'No'}
                </span>
              </div>
              {personData.buyerGroupRole && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted">Buyer Group Role:</span>
                  <span className="text-sm font-medium text-foreground capitalize">{personData.buyerGroupRole}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-muted">Seniority:</span>
                <span className="text-sm font-medium text-foreground capitalize">{personData.seniority}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How do I reach them */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information Card */}
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Contact Information</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Email:</span>
                <InlineEditField
                  value={personData.email}
                  field="email"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="email"
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Phone:</span>
                <InlineEditField
                  value={personData.phone}
                  field="phone"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="text"
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">LinkedIn:</span>
                <InlineEditField
                  value={formatEmptyValue(personData.linkedin)}
                  field="linkedinUrl"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">LinkedIn Navigator:</span>
                <InlineEditField
                  value={personData.linkedinNavigatorUrl || null}
                  field="linkedinNavigatorUrl"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">LinkedIn Connection Date:</span>
                <InlineEditField
                  value={personData.linkedinConnectionDate}
                  field="linkedinConnectionDate"
                  variant="date"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Engagement History Card */}
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Engagement History</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted">Last Contact:</span>
                <span className="text-sm font-medium text-foreground">{formatRelativeDate(personData.lastContact)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Next Action:</span>
                <span className="text-sm font-medium text-foreground">{personData.nextAction}</span>
              </div>
            </div>
          </div>
        </div>
      </div>




      {/* What do they care about */}
      <div className="space-y-6">
        <div className="bg-background p-4 rounded-lg border border-border">
          <h4 className="font-medium text-foreground mb-3">
            Professional Insights: Based on their role as {personData.title} at {personData.company}, they likely care about:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-sm font-medium text-foreground mb-2">Wants</h5>
              <ul className="space-y-1">
                {wants.map((want, index) => (
                  <li key={index} className="text-sm text-muted flex items-start">
                    <span className="text-muted mr-2">•</span>
                    {want}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-medium text-foreground mb-2">Needs</h5>
              <ul className="space-y-1">
                {needs.map((need, index) => (
                  <li key={index} className="text-sm text-muted flex items-start">
                    <span className="text-muted mr-2">•</span>
                    {need}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

        {/* Last Actions */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">What did I last do</h3>
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Last Actions:</h4>
            {actionsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted">Loading actions...</p>
              </div>
            ) : actionsError ? (
              <div className="text-center py-4">
                <p className="text-sm text-error mb-3">Error loading actions</p>
                <p className="text-xs text-muted">{actionsError}</p>
              </div>
            ) : lastActions.length > 0 ? (
              <ul className="space-y-2">
                {lastActions.map((action, index) => (
                  <li key={index} className="text-sm text-muted flex items-center gap-2">
                    <span>•</span>
                    {action.type && (
                      <span className="px-2 py-1 bg-[var(--accent-bg)] text-[var(--accent-text)] text-xs font-medium rounded-full">
                        {action.type}
                      </span>
                    )}
                    <span>{action.action} - {action.date}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted mb-3">No actions logged yet</p>
                <p className="text-xs text-muted">Actions will appear here when logged through the Actions tab</p>
              </div>
            )}
          </div>
        </div>

      {/* Notes on them */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Notes on them</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Recent Notes Summary</h4>
            <div className="text-sm text-muted leading-relaxed">
              {personData.notes && personData.notes !== 'No notes available' && personData.notes.trim() !== '' ? personData.notes : 
                `—`
              }
            </div>
          </div>
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Engagement Strategy</h4>
            <div className="text-sm text-muted leading-relaxed">
              Focus on {(personData.engagementPriority || '').toLowerCase()} priority engagement. 
              Last contact was {formatRelativeDate(personData.lastContact)}. 
              Next action: {personData.nextAction}.
            </div>
          </div>
        </div>
      </div>

      {/* Record Information */}
      <div className="mt-8 pt-6 border-t border-border">
        <h3 className="text-sm font-medium text-muted uppercase tracking-wide mb-4">Record Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-xs text-muted uppercase tracking-wide w-28">Created:</span>
            <span className="text-sm text-foreground" title={formatFullDate(record?.createdAt)}>
              {(() => {
                console.log('🔍 [PERSON TAB] Date debugging for Created:', {
                  recordId: record?.id,
                  createdAt: record?.createdAt,
                  createdAtType: typeof record?.createdAt,
                  isNull: record?.createdAt === null,
                  isUndefined: record?.createdAt === undefined,
                  recordKeys: record ? Object.keys(record) : 'No record',
                  formattedRelative: formatRelativeDate(record?.createdAt),
                  formattedFull: formatFullDate(record?.createdAt)
                });
                return formatRelativeDate(record?.createdAt);
              })()}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-muted uppercase tracking-wide w-28">Last Updated:</span>
            <span className="text-sm text-foreground" title={formatFullDate(record?.updatedAt || record?.createdAt)}>
              {(() => {
                // Use createdAt as fallback if updatedAt is not available
                const dateToUse = record?.updatedAt || record?.createdAt;
                console.log('🔍 [PERSON TAB] Date debugging for Updated:', {
                  recordId: record?.id,
                  updatedAt: record?.updatedAt,
                  createdAt: record?.createdAt,
                  dateToUse: dateToUse,
                  updatedAtType: typeof record?.updatedAt,
                  createdAtType: typeof record?.createdAt,
                  isNull: record?.updatedAt === null,
                  isUndefined: record?.updatedAt === undefined,
                  recordKeys: record ? Object.keys(record) : 'No record',
                  formattedRelative: formatRelativeDate(dateToUse),
                  formattedFull: formatFullDate(dateToUse)
                });
                return formatRelativeDate(dateToUse);
              })()}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
