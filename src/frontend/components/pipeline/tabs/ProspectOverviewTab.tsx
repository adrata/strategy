"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';
import { CompanyDetailSkeleton } from '@/platform/ui/components/Loader';
import { InlineEditField } from '@/frontend/components/pipeline/InlineEditField';
import { authFetch } from '@/platform/api-fetch';

interface ProspectOverviewTabProps {
  recordType: string;
  record?: any;
  onSave?: (field: string, value: string, recordId?: string, recordType?: string) => Promise<void>;
}

export function ProspectOverviewTab({ recordType, record: recordProp, onSave }: ProspectOverviewTabProps) {
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

  // Sync buyer group data when record loads
  useEffect(() => {
    const syncBuyerGroupData = async () => {
      if (!record?.id) return;
      
      try {
        // Sync buyer group data via API to ensure consistency
        const response = await authFetch(`/api/v1/people/${record.id}/sync-buyer-group`, {
          method: 'POST'
        });
        if (response?.success) {
          console.log('✅ [PROSPECT OVERVIEW] Synced buyer group data for person:', record.id);
        }
      } catch (error) {
        // Silently fail - sync is best effort
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ [PROSPECT OVERVIEW] Failed to sync buyer group data:', error);
        }
      }
    };

    syncBuyerGroupData();
  }, [record?.id]);

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
    return <CompanyDetailSkeleton message="Loading prospect details..." />;
  }

  // Debug: Log the record structure to see what's available
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [Prospect Data Debug] Record structure:', {
      record: record,
      customFields: record?.customFields,
      company: record?.company,
      companyData: record?.companyData,
      industry: record?.industry,
      buyerGroupRole: record?.customFields?.buyerGroupRole
    });
    
    // Enhanced debug logging for Shannon Hegland specifically
    if (record?.fullName?.includes('Shannon Hegland') || record?.name?.includes('Shannon Hegland')) {
      console.log('🔍 [SHANNON DEBUG] Full record data for Shannon Hegland:', {
        id: record.id,
        fullName: record.fullName,
        firstName: record.firstName,
        lastName: record.lastName,
        jobTitle: record.jobTitle,
        title: record.title,
        role: record.role,
        department: record.department,
        email: record.email,
        workEmail: record.workEmail,
        personalEmail: record.personalEmail,
        secondaryEmail: record.secondaryEmail,
        phone: record.phone,
        mobilePhone: record.mobilePhone,
        workPhone: record.workPhone,
        linkedinUrl: record.linkedinUrl,
        company: record.company,
        companyId: record.companyId,
        companyData: record.companyData,
        customFields: record.customFields,
        allKeys: Object.keys(record || {})
      });
      
      // Debug customFields structure
      if (record.customFields) {
        console.log('🔍 [SHANNON CUSTOM FIELDS] Custom fields structure:', {
          customFieldsKeys: Object.keys(record.customFields),
          customFields: record.customFields,
          enrichedData: record.customFields?.enrichedData,
          enrichedDataKeys: record.customFields?.enrichedData ? Object.keys(record.customFields.enrichedData) : null
        });
      }
      
      // Debug specific field mappings
      console.log('🔍 [SHANNON FIELD MAPPING] Field mapping analysis:', {
        title: {
          jobTitle: record.jobTitle,
          title: record.title,
          role: record.role,
          customFieldsTitle: record?.customFields?.title,
          customFieldsJobTitle: record?.customFields?.jobTitle,
          enrichedTitle: record?.customFields?.enrichedData?.overview?.title,
          enrichedJobTitle: record?.customFields?.enrichedData?.overview?.jobTitle
        },
        email: {
          email: record.email,
          workEmail: record.workEmail,
          personalEmail: record.personalEmail,
          secondaryEmail: record.secondaryEmail,
          customFieldsEmail: record?.customFields?.email,
          customFieldsWorkEmail: record?.customFields?.workEmail,
          enrichedEmail: record?.customFields?.enrichedData?.overview?.email,
          enrichedWorkEmail: record?.customFields?.enrichedData?.overview?.workEmail
        },
        phone: {
          phone: record.phone,
          mobilePhone: record.mobilePhone,
          workPhone: record.workPhone,
          customFieldsPhone: record?.customFields?.phone,
          customFieldsMobilePhone: record?.customFields?.mobilePhone,
          customFieldsWorkPhone: record?.customFields?.workPhone,
          enrichedPhone: record?.customFields?.enrichedData?.overview?.phone,
          enrichedMobilePhone: record?.customFields?.enrichedData?.overview?.mobilePhone
        },
        linkedin: {
          linkedinUrl: record.linkedinUrl,
          customFieldsLinkedinUrl: record?.customFields?.linkedinUrl,
          customFieldsLinkedin: record?.customFields?.linkedin,
          enrichedLinkedin: record?.customFields?.enrichedData?.overview?.linkedin,
          enrichedLinkedinUrl: record?.customFields?.enrichedData?.overview?.linkedinUrl
        }
      });
    }
  }

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

  // Extract CoreSignal data from the correct location (same as PersonOverviewTab)
  const coresignalData = record?.customFields?.coresignal || record?.customFields?.coresignalData || {};
  const coresignalProfile = record?.customFields?.coresignalProfile || {};
  const enrichedData = record?.customFields?.enrichedData || {};

  // Use database fields first, then CoreSignal fallback
  const prospectData = {
    // Basic Information - Database fields first, then CoreSignal fallback
    name: record?.fullName || record?.name || coresignalData.full_name || null,
    title: record?.jobTitle || record?.title || coresignalData.active_experience_title || coresignalData.experience?.find(exp => exp.active_experience === 1)?.position_title || coresignalData.experience?.[0]?.position_title || null,
    department: record?.department || coresignalData.active_experience_department || coresignalData.experience?.find(exp => exp.active_experience === 1)?.department || coresignalData.experience?.[0]?.department || null,
    
    // Contact Information - Database fields first, then CoreSignal fallback
    email: record?.email || coresignalData.primary_professional_email || null,
    phone: record?.phone || coresignalData.phone || null,
    linkedin: record?.linkedinUrl || record?.linkedin || coresignalData.linkedin_url || null,
    linkedinNavigatorUrl: record?.linkedinNavigatorUrl || null,
    bio: record?.bio || null,
    linkedinConnectionDate: record?.linkedinConnectionDate || null,
    
    // Company Information - Database fields first, then CoreSignal fallback
    company: (() => {
      // Handle both string and object company formats
      const coresignalCompany = coresignalData.experience?.find(exp => exp.active_experience === 1)?.company_name || coresignalData.experience?.[0]?.company_name;
      const recordCompany = typeof record?.company === 'string' 
        ? record.company 
        : (record?.company?.name || record?.companyName);
      return coresignalCompany || recordCompany || null;
    })(),
    companyId: record.companyId || null,
    industry: coresignalData.experience?.find(exp => exp.active_experience === 1)?.company_industry || coresignalData.experience?.[0]?.company_industry || record?.company?.industry || record?.industry || null,
    
    // Buyer Group and Influence (existing fields) - Enhanced mapping
    buyerGroupRole: record?.buyerGroupRole || record?.customFields?.buyerGroupRole || record?.customFields?.enrichedData?.overview?.buyerGroupRole || record?.customFields?.enrichedData?.overview?.role || null,
    // Calculate influence level from role FIRST (buyerGroupRole is source of truth)
    influenceLevel: (() => {
      // PRIORITY 1: Calculate from buyerGroupRole (source of truth)
      const role = record?.buyerGroupRole || record?.customFields?.buyerGroupRole || record?.customFields?.enrichedData?.overview?.buyerGroupRole || record?.customFields?.enrichedData?.overview?.role || null;
      if (role) {
        const normalizedRole = role.toLowerCase().trim();
        if (normalizedRole === 'decision maker' || normalizedRole === 'champion') return 'High';
        if (normalizedRole === 'blocker' || normalizedRole === 'stakeholder') return 'Medium';
        if (normalizedRole === 'introducer') return 'Low';
      }
      // PRIORITY 2: Use stored value as fallback
      const stored = record?.influenceLevel || record?.customFields?.influenceLevel || record?.customFields?.enrichedData?.overview?.influenceLevel || record?.customFields?.influence || null;
      return stored;
    })(),
    // Buyer group membership: check buyerGroupRole OR isBuyerGroupMember (consistent with Company views)
    isBuyerGroupMember: (() => {
      const hasRole = !!(record?.buyerGroupRole || record?.customFields?.buyerGroupRole || record?.customFields?.enrichedData?.overview?.buyerGroupRole || record?.customFields?.enrichedData?.overview?.role);
      const isMember = record?.isBuyerGroupMember ?? record?.customFields?.isBuyerGroupMember ?? false;
      return hasRole || isMember;
    })(),
    engagementPriority: record?.priority || record?.customFields?.priority || record?.customFields?.enrichedData?.overview?.priority || null,
    
    // Engagement History (existing fields) - Enhanced mapping
    lastContact: record.lastContactDate || record.lastContact || record.lastActionDate || record?.customFields?.lastContact || record?.customFields?.lastContactDate || null,
    nextAction: record.nextAction || record?.customFields?.nextAction || null,
    nextActionDate: record.nextActionDate || record?.customFields?.nextActionDate || null,
    
    // Status (existing fields) - Enhanced mapping
    status: record.status || record?.customFields?.status || null,
    priority: record.priority || record?.customFields?.priority || null,
    
    // Notes and Tags (existing fields) - Enhanced mapping
    notes: record.notes || record?.customFields?.notes || null,
    tags: record.tags || record?.customFields?.tags || [],
    
    // Intelligence and Insights (existing fields) - Enhanced mapping
    painIntelligence: record.painIntelligence || record?.customFields?.painIntelligence || null,
    wants: record.wants || record?.customFields?.wants || [],
    needs: record.needs || record?.customFields?.needs || [],
    psychographicProfile: record.psychographicProfile || record?.customFields?.psychographicProfile || null,
    communicationStyleRecommendations: record.communicationStyleRecommendations || record?.customFields?.communicationStyleRecommendations || null
  };

  // Debug: Log the final prospectData values for Shannon Hegland
  if (process.env.NODE_ENV === 'development' && (record?.fullName?.includes('Shannon Hegland') || record?.name?.includes('Shannon Hegland'))) {
    console.log('🔍 [SHANNON PROSPECT DATA] Final values being displayed:', {
      name: prospectData.name,
      title: prospectData.title,
      department: prospectData.department,
      email: prospectData.email,
      phone: prospectData.phone,
      linkedin: prospectData.linkedin,
      company: prospectData.company,
      buyerGroupRole: prospectData.buyerGroupRole,
      influenceLevel: prospectData.influenceLevel,
      engagementPriority: prospectData.engagementPriority,
      lastContact: prospectData.lastContact,
      nextAction: prospectData.nextAction,
      status: prospectData.status
    });
  }

  const formatRelativeDate = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    
    // Check if the date is invalid
    if (isNaN(date.getTime())) {
      return '-';
    }
    
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

  // Get real wants and needs from intelligence data - only show if we have real data
  const getRealWantsAndNeeds = () => {
    // Check for Monaco enrichment data (real intelligence)
    const monacoEnrichment = record?.customFields?.monacoEnrichment;
    const personIntel = monacoEnrichment?.personIntelligence;
    
    // Check for AI-generated intelligence
    const aiIntelligence = record?.customFields?.aiIntelligence;
    
    // Check for manually entered intelligence data
    const manualIntelligence = record?.customFields?.intelligence;
    
    const wants: string[] = [];
    const needs: string[] = [];
    
    // Priority 1: Monaco enrichment (most reliable)
    if (personIntel) {
      if (personIntel.motivations && Array.isArray(personIntel.motivations) && personIntel.motivations.length > 0) {
        wants.push(...personIntel.motivations.map((m: any) => typeof m === 'string' ? m : String(m)));
      }
      if (personIntel.painPoints && Array.isArray(personIntel.painPoints) && personIntel.painPoints.length > 0) {
        needs.push(...personIntel.painPoints.map((p: any) => typeof p === 'string' ? p : String(p)));
      }
    }
    
    // Priority 2: AI-generated intelligence
    if (aiIntelligence) {
      if (aiIntelligence.wants && Array.isArray(aiIntelligence.wants) && aiIntelligence.wants.length > 0) {
        wants.push(...aiIntelligence.wants);
      }
      if (aiIntelligence.needs && Array.isArray(aiIntelligence.needs) && aiIntelligence.needs.length > 0) {
        needs.push(...aiIntelligence.needs);
      }
    }
    
    // Priority 3: Manual intelligence data
    if (manualIntelligence) {
      if (manualIntelligence.wants && Array.isArray(manualIntelligence.wants) && manualIntelligence.wants.length > 0) {
        wants.push(...manualIntelligence.wants);
      }
      if (manualIntelligence.needs && Array.isArray(manualIntelligence.needs) && manualIntelligence.needs.length > 0) {
        needs.push(...manualIntelligence.needs);
      }
    }
    
    // Remove duplicates and return
    const uniqueWants = Array.from(new Set(wants));
    const uniqueNeeds = Array.from(new Set(needs));
    
    return { 
      wants: uniqueWants, 
      needs: uniqueNeeds,
      hasRealData: uniqueWants.length > 0 || uniqueNeeds.length > 0
    };
  };

  const { wants, needs, hasRealData } = getRealWantsAndNeeds();

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
    <div className="p-6 space-y-8">
      {/* Who are they */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information Card */}
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Basic Information</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Stage:</span>
                <InlineEditField
                  value={prospectData.status || prospectData.stage || 'LEAD'}
                  field="status"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  inputType="select"
                  options={[
                    { value: 'LEAD', label: 'Lead' },
                    { value: 'PROSPECT', label: 'Prospect' },
                    { value: 'OPPORTUNITY', label: 'Opportunity' },
                    { value: 'CLIENT', label: 'Client' },
                    { value: 'SUPERFAN', label: 'Superfan' }
                  ]}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    (prospectData.status || prospectData.stage) === 'LEAD' ? 'bg-warning/10 text-warning border border-warning' :
                    (prospectData.status || prospectData.stage) === 'PROSPECT' ? 'bg-primary/10 text-primary border border-primary' :
                    (prospectData.status || prospectData.stage) === 'OPPORTUNITY' ? 'bg-info/10 text-info border border-info' :
                    (prospectData.status || prospectData.stage) === 'CLIENT' ? 'bg-success/10 text-success border border-success' :
                    (prospectData.status || prospectData.stage) === 'SUPERFAN' ? 'bg-info/10 text-info border border-info' :
                    'bg-hover text-foreground border border-border'
                  }`}
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Name:</span>
                <InlineEditField
                  value={prospectData.name}
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
                  value={prospectData.title}
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
                  value={prospectData.company}
                  field="company"
                  variant="company"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Department:</span>
                <InlineEditField
                  value={prospectData.department}
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
                  value={formatEmptyValue(prospectData.bio)}
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

          {/* Role & Influence Card */}
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Role & Influence</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Buyer Group Role:</span>
                <InlineEditField
                  value={prospectData.buyerGroupRole}
                  field="buyerGroupRole"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  inputType="select"
                  options={[
                    { value: 'Decision Maker', label: 'Decision Maker' },
                    { value: 'Champion', label: 'Champion' },
                    { value: 'Blocker', label: 'Blocker' },
                    { value: 'Influencer', label: 'Influencer' },
                    { value: 'User', label: 'User' }
                  ]}
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    prospectData.buyerGroupRole === 'Decision Maker' ? 'bg-error/10 text-error border border-error' :
                    prospectData.buyerGroupRole === 'Champion' ? 'bg-success/10 text-success border border-success' :
                    prospectData.buyerGroupRole === 'Blocker' ? 'bg-warning/10 text-warning border border-warning' :
                    prospectData.buyerGroupRole === '-' ? 'bg-hover text-foreground border border-border' :
                    'bg-hover text-foreground border border-border'
                  }`}
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Influence Level:</span>
                <InlineEditField
                  value={prospectData.influenceLevel}
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
                <span className="text-sm text-muted w-24">Engagement Priority:</span>
                <InlineEditField
                  value={prospectData.engagementPriority}
                  field="engagementPriority"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  inputType="select"
                  options={[
                    { value: 'HIGH', label: 'HIGH' },
                    { value: 'MEDIUM', label: 'MEDIUM' },
                    { value: 'LOW', label: 'LOW' }
                  ]}
                  className="text-sm font-medium text-foreground capitalize"
                />
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
                  value={prospectData.email}
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
                  value={prospectData.phone}
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
                  value={formatEmptyValue(prospectData.linkedin)}
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
                  value={prospectData.linkedinNavigatorUrl || null}
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
                  value={prospectData.linkedinConnectionDate}
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
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Last Contact:</span>
                <span className="text-sm font-medium text-foreground">{formatRelativeDate(prospectData.lastContact)}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Next Action:</span>
                <InlineEditField
                  value={prospectData.nextAction}
                  field="nextAction"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What do they care about - Only show if we have real intelligence data */}
      {hasRealData && (
        <div className="space-y-6">
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">
              Professional Insights
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {wants.length > 0 && (
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
              )}
              {needs.length > 0 && (
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
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Show helpful message if no real intelligence data */}
      {!hasRealData && (
        <div className="space-y-6">
          <div className="bg-muted/30 p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-2">
              Professional Insights
            </h4>
            <p className="text-sm text-muted">
              Gather intelligence data to see wants and needs for this prospect. This information comes from enrichment services, AI analysis, or manual input.
            </p>
          </div>
        </div>
      )}

      {/* What did I last do */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">What did I last do</h3>
        <div className="bg-background p-4 rounded-lg border border-border">
          <h4 className="font-medium text-foreground mb-3">Last Actions:</h4>
          {actionsLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-muted">Loading actions...</p>
            </div>
          ) : actionsError ? (
            <div className="text-center py-4">
              <p className="text-sm text-red-600 mb-3">Error loading actions</p>
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
              {prospectData.notes && prospectData.notes !== 'No notes available' && prospectData.notes.trim() !== '' ? prospectData.notes : 
                `—`
              }
            </div>
          </div>
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Engagement Strategy</h4>
            <div className="text-sm text-muted leading-relaxed">
              Focus on {(prospectData.engagementPriority || '').toLowerCase()} priority engagement. 
              Last contact was {formatRelativeDate(prospectData.lastContact)}. 
              Next action: {prospectData.nextAction}.
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
              {formatRelativeDate(record?.createdAt)}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-muted uppercase tracking-wide w-28">Last Updated:</span>
            <span className="text-sm text-foreground" title={formatFullDate(record?.updatedAt)}>
              {formatRelativeDate(record?.updatedAt)}
            </span>
          </div>
        </div>
      </div>


    </div>
  );
}
