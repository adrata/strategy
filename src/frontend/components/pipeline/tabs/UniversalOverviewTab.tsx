"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';
import { CompanyDetailSkeleton, Skeleton } from '@/platform/ui/components/Loader';
import { InlineEditField } from '@/frontend/components/pipeline/InlineEditField';
import { authFetch } from '@/platform/api-fetch';
import { useUnifiedAuth } from '@/platform/auth';
import { formatUrlForDisplay, getUrlDisplayName } from '@/platform/utils/urlFormatter';

interface UniversalOverviewTabProps {
  recordType: string;
  record?: any;
  onSave?: (field: string, value: string, recordId?: string, recordType?: string) => Promise<void>;
}

export function UniversalOverviewTab({ recordType, record: recordProp, onSave }: UniversalOverviewTabProps) {
  const { currentRecord: contextRecord } = useRecordContext();
  const { user: currentUser } = useUnifiedAuth();
  const record = recordProp || contextRecord;
  
  // Success message state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Actions state
  const [actions, setActions] = useState<any[]>([]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [actionsError, setActionsError] = useState<string | null>(null);
  
  // Timestamp refresh state
  const [timestampRefresh, setTimestampRefresh] = useState(0);
  
  // LinkedIn fields state for persistence
  const [linkedinUrl, setLinkedinUrl] = useState<string | null>(null);
  const [linkedinNavigatorUrl, setLinkedinNavigatorUrl] = useState<string | null>(null);
  
  // Initialize LinkedIn fields from record data and sync with record updates
  useEffect(() => {
    if (record) {
      const newLinkedinUrl = record?.linkedin || record?.linkedinUrl || null;
      const newLinkedinNavigatorUrl = record?.linkedinNavigatorUrl || null;
      
      console.log(`🔍 [LINKEDIN STATE SYNC] Syncing LinkedIn fields from record:`, {
        recordId: record?.id,
        newLinkedinUrl,
        currentLinkedinUrl: linkedinUrl,
        newLinkedinNavigatorUrl,
        currentLinkedinNavigatorUrl: linkedinNavigatorUrl,
        recordLinkedinNavigatorUrl: record?.linkedinNavigatorUrl,
        willUpdateLinkedin: newLinkedinUrl !== linkedinUrl,
        willUpdateNavigator: newLinkedinNavigatorUrl !== linkedinNavigatorUrl
      });
      
      // Only update state if values have changed to avoid unnecessary re-renders
      if (newLinkedinUrl !== linkedinUrl) {
        console.log(`🔄 [LINKEDIN STATE SYNC] Updating LinkedIn URL state: ${linkedinUrl} -> ${newLinkedinUrl}`);
        setLinkedinUrl(newLinkedinUrl);
      }
      if (newLinkedinNavigatorUrl !== linkedinNavigatorUrl) {
        console.log(`🔄 [LINKEDIN STATE SYNC] Updating LinkedIn Navigator URL state: ${linkedinNavigatorUrl} -> ${newLinkedinNavigatorUrl}`);
        setLinkedinNavigatorUrl(newLinkedinNavigatorUrl);
      }
    }
  }, [record]);

  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // Enhanced success handler that updates local state for specific fields
  const handleFieldSuccess = (field: string, value: string, message: string) => {
    console.log(`🔍 [FIELD SUCCESS] handleFieldSuccess called:`, { field, value, message });
    
    // Update local state for LinkedIn fields
    if (field === 'linkedinUrl') {
      console.log(`🔄 [FIELD SUCCESS] Updating linkedinUrl state: ${linkedinUrl} -> ${value}`);
      setLinkedinUrl(value);
    } else if (field === 'linkedinNavigatorUrl') {
      console.log(`🔄 [FIELD SUCCESS] Updating linkedinNavigatorUrl state: ${linkedinNavigatorUrl} -> ${value}`);
      setLinkedinNavigatorUrl(value);
    }
    
    handleSuccess(message);
  };

  // Create field-specific success handlers
  const handleLinkedinSuccess = (message: string) => {
    // The value will be updated by the parent component's onSave handler
    // We'll update our local state when the record prop changes
    console.log(`🔍 [LINKEDIN SUCCESS] LinkedIn URL save success:`, { message, recordId: record?.id });
    handleSuccess(message);
  };

  const handleLinkedinNavigatorSuccess = (message: string) => {
    // The value will be updated by the parent component's onSave handler
    // We'll update our local state when the record prop changes
    console.log(`🔍 [LINKEDIN NAVIGATOR SUCCESS] LinkedIn Navigator URL save success:`, { 
      message, 
      recordId: record?.id,
      currentState: linkedinNavigatorUrl,
      recordValue: record?.linkedinNavigatorUrl
    });
    handleSuccess(message);
  };

  // Create a custom onSave handler that updates local state immediately
  const handleLinkedinNavigatorSave = async (field: string, value: string, recordId?: string, recordType?: string) => {
    console.log(`🔍 [LINKEDIN NAVIGATOR SAVE] Custom save handler called:`, { field, value, recordId, recordType });
    
    // Call the parent's onSave handler
    if (onSave) {
      await onSave(field, value, recordId, recordType);
    }
    
    // Update local state immediately for better UX
    if (field === 'linkedinNavigatorUrl') {
      console.log(`🔄 [LINKEDIN NAVIGATOR SAVE] Updating local state immediately: ${linkedinNavigatorUrl} -> ${value}`);
      setLinkedinNavigatorUrl(value);
    }
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

  // Auto-refresh timestamps every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTimestampRefresh(prev => prev + 1);
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, []);

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

  // Extract comprehensive record data from CoreSignal with database fallback
  // This needs to be reactive to actions state
  const recordData = React.useMemo(() => ({
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
    linkedin: (() => {
      const linkedinValue = linkedinUrl || record?.linkedin || record?.linkedinUrl || coresignalData.linkedin_url || null;
      console.log(`🔍 [LINKEDIN COMPUTATION] Computing linkedin value:`, {
        recordId: record?.id,
        linkedinUrl,
        recordLinkedin: record?.linkedin,
        recordLinkedinUrl: record?.linkedinUrl,
        coresignalLinkedinUrl: coresignalData.linkedin_url,
        finalValue: linkedinValue
      });
      return linkedinValue;
    })(),
    linkedinNavigatorUrl: (() => {
      const navigatorValue = linkedinNavigatorUrl || record?.linkedinNavigatorUrl || null;
      console.log(`🔍 [LINKEDIN NAVIGATOR COMPUTATION] Computing linkedinNavigatorUrl value:`, {
        recordId: record?.id,
        linkedinNavigatorUrl,
        recordLinkedinNavigatorUrl: record?.linkedinNavigatorUrl,
        finalValue: navigatorValue
      });
      return navigatorValue;
    })(),
    linkedinConnectionDate: record?.linkedinConnectionDate || null,
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
    
    // State information
    state: record?.state || record?.company?.state || null,
    hqState: record?.hqState || record?.company?.hqState || null,
    
    // CoreSignal intelligence - check top-level fields first, then customFields
    influenceLevel: record.influenceLevel ?? record.customFields?.influenceLevel ?? null,
    engagementStrategy: record.customFields?.engagementStrategy || null,
    isBuyerGroupMember: record.isBuyerGroupMember ?? record.customFields?.isBuyerGroupMember ?? !!record.buyerGroupRole ?? false,
    buyerGroupOptimized: record.buyerGroupOptimized ?? record.customFields?.buyerGroupOptimized ?? false,
    buyerGroupRole: record.buyerGroupRole ?? record.customFields?.buyerGroupRole ?? null,
    
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
    
    // Contact history - use fetched actions data if available, otherwise fall back to record fields
    lastContact: actions.length > 0 ? (actions[0]?.completedAt || actions[0]?.createdAt) : (record.lastActionDate || record.updatedAt || '-'),
    lastAction: actions.length > 0 ? (actions[0]?.subject || actions[0]?.title) : (record.lastAction || '-'),
    nextAction: record.nextAction || 'Schedule follow-up call',
    nextActionDate: record.nextActionDate || '-',
    
    // Notes
    notes: record.notes || '-',
    
    // Metadata
    lastEnrichedAt: record.customFields?.lastEnrichedAt || record.updatedAt || new Date().toISOString(),
    totalFields: record.customFields?.totalFields || 13,
    status: record.status || 'active',
    source: record.customFields?.source || 'Data Enrichment',
    seniority: record.seniority ?? record.customFields?.seniority ?? 'Mid-level'
  }), [record, coresignalData, actions]);

  const formatRelativeDate = (dateString: string | Date | null | undefined): string => {
    console.log('🔍 [FORMAT DEBUG] formatRelativeDate called with:', {
      dateString,
      type: typeof dateString,
      isNull: dateString === null,
      isUndefined: dateString === undefined,
      isNever: dateString === 'Never',
      isInvalidDate: dateString === 'Invalid Date'
    });
    
    if (!dateString || dateString === 'Never' || dateString === 'Invalid Date') {
      console.log('🔍 [FORMAT DEBUG] Returning "Never" due to invalid input');
      return 'Never';
    }
    
    try {
      let date: Date;
      
      // Handle different date formats
      if (dateString instanceof Date) {
        date = dateString;
      } else if (typeof dateString === 'string') {
        // Handle Prisma DateTime strings and ISO strings
        if (dateString.includes('T') && dateString.includes('Z')) {
          // ISO string with timezone
          date = new Date(dateString);
        } else if (dateString.includes('T')) {
          // ISO string without timezone - assume UTC
          date = new Date(dateString + 'Z');
        } else {
          // Try parsing as regular date string
          date = new Date(dateString);
        }
      } else {
        console.log('🔍 [FORMAT DEBUG] Unsupported date type, returning "Never"');
        return 'Never';
      }
      
      console.log('🔍 [FORMAT DEBUG] Parsed date:', {
        original: dateString,
        parsed: date,
        isValid: !isNaN(date.getTime()),
        timestamp: date.getTime()
      });
      
      if (isNaN(date.getTime())) {
        console.log('🔍 [FORMAT DEBUG] Invalid date, returning "Never"');
        return 'Never';
      }
      
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      
      console.log('🔍 [FORMAT DEBUG] Time calculations:', {
        now: now.getTime(),
        date: date.getTime(),
        diffInMs,
        diffInMinutes,
        diffInHours,
        diffInDays
      });
      
      let result = '';
      if (diffInMinutes < 1) {
        result = 'Just now';
      } else if (diffInMinutes < 60) {
        result = `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
      } else if (diffInHours < 24) {
        result = `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
      } else if (diffInDays === 1) {
        result = 'Yesterday';
      } else if (diffInDays < 7) {
        result = `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
      } else if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        result = `${weeks} week${weeks > 1 ? 's' : ''} ago`;
      } else {
        result = date.toLocaleDateString();
      }
      
      console.log('🔍 [FORMAT DEBUG] Final result:', result);
      return result;
    } catch (error) {
      console.log('🔍 [FORMAT DEBUG] Error in formatRelativeDate:', error);
      return 'Never';
    }
  };

  const formatFullDate = (dateString: string | Date | null | undefined): string => {
    console.log('🔍 [FORMAT DEBUG] formatFullDate called with:', {
      dateString,
      type: typeof dateString,
      isNull: dateString === null,
      isUndefined: dateString === undefined
    });
    
    if (!dateString || dateString === 'Never' || dateString === 'Invalid Date') {
      console.log('🔍 [FORMAT DEBUG] formatFullDate returning "Never" due to invalid input');
      return 'Never';
    }
    
    try {
      let date: Date;
      
      // Handle different date formats
      if (dateString instanceof Date) {
        date = dateString;
      } else if (typeof dateString === 'string') {
        // Handle Prisma DateTime strings and ISO strings
        if (dateString.includes('T') && dateString.includes('Z')) {
          // ISO string with timezone
          date = new Date(dateString);
        } else if (dateString.includes('T')) {
          // ISO string without timezone - assume UTC
          date = new Date(dateString + 'Z');
        } else {
          // Try parsing as regular date string
          date = new Date(dateString);
        }
      } else {
        console.log('🔍 [FORMAT DEBUG] formatFullDate unsupported date type, returning "Never"');
        return 'Never';
      }
      
      console.log('🔍 [FORMAT DEBUG] formatFullDate parsed date:', {
        original: dateString,
        parsed: date,
        isValid: !isNaN(date.getTime())
      });
      
      if (isNaN(date.getTime())) {
        console.log('🔍 [FORMAT DEBUG] formatFullDate invalid date, returning "Never"');
        return 'Never';
      }
      
      const result = date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      console.log('🔍 [FORMAT DEBUG] formatFullDate result:', result);
      return result;
    } catch (error) {
      console.log('🔍 [FORMAT DEBUG] formatFullDate error:', error);
      return 'Never';
    }
  };

  // Helper function to get timing label for date pills (matching list view format)
  const getTimingLabel = (dateString: string | Date | null | undefined): string => {
    if (!dateString || dateString === 'Never' || dateString === 'Invalid Date') return 'Never';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Never';
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const actionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      // Check if it's today
      if (actionDate.getTime() === today.getTime()) {
        return 'Today';
      }
      
      // Check if it's yesterday
      if (actionDate.getTime() === yesterday.getTime()) {
        return 'Yesterday';
      }
      
      // Check if it's within the last week
      if (diffDays <= 7) {
        return `${diffDays} days ago`;
      }
      
      // Check if it's within the last month
      if (diffDays <= 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
      }
      
      // For future dates (next actions)
      if (diffMs < 0) {
        const futureDiffDays = Math.ceil(-diffMs / (1000 * 60 * 60 * 24));
        if (futureDiffDays === 1) {
          return 'Tomorrow';
        } else if (futureDiffDays <= 7) {
          return 'This week';
        } else if (futureDiffDays <= 14) {
          return 'Next week';
        } else if (futureDiffDays <= 30) {
          return 'This month';
        } else {
          return 'Future';
        }
      }
      
      // For older dates
      return date.toLocaleDateString();
    } catch (error) {
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


  // Generate last actions from fetched API data with timestamp refresh dependency
  const lastActions = React.useMemo(() => {
    if (actionsLoading) {
      return [];
    }
    
    if (actionsError) {
      return [];
    }
    
    // Map fetched actions to display format
    return actions.map(action => {
      // Get user display name - always show the actual name
      const userDisplayName = action.user?.name || action.user?.email || 'Unknown User';
      
      return {
        action: action.subject || action.title || 'Action',
        user: userDisplayName,
        date: formatRelativeDate(action.completedAt || action.scheduledAt || action.createdAt)
      };
    });
  }, [actions, actionsLoading, actionsError, timestampRefresh]);

        return (
          <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">Overview</h2>
      </div>

      {/* Overview Summary */}
      <div className="space-y-6">
        <div className="bg-background p-4 rounded-lg border border-border">
          <div className="text-sm text-foreground">
            {generateBioText()}
          </div>
        </div>
      </div>

      {/* Who are they */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information Card */}
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Basic Information</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Stage:</span>
                <InlineEditField
                  value={recordData.status || recordData.stage || 'LEAD'}
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
                    (recordData.status || recordData.stage) === 'LEAD' ? 'bg-blue-100 text-blue-800' :
                    (recordData.status || recordData.stage) === 'PROSPECT' ? 'bg-purple-100 text-purple-800' :
                    (recordData.status || recordData.stage) === 'OPPORTUNITY' ? 'bg-yellow-100 text-yellow-800' :
                    (recordData.status || recordData.stage) === 'CLIENT' ? 'bg-green-100 text-green-800' :
                    (recordData.status || recordData.stage) === 'SUPERFAN' ? 'bg-pink-100 text-pink-800' :
                    'bg-gray-100 text-gray-800'
                  }`}
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Name:</span>
                <InlineEditField
                  value={recordData.name}
                  field="name"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              {recordType !== 'companies' && (
                <div className="flex items-center">
                  <span className="text-sm text-muted w-24">Title:</span>
                  <InlineEditField
                    value={recordData.title}
                    field="title"
                    onSave={onSave}
                    recordId={record.id}
                    recordType={recordType}
                    onSuccess={handleSuccess}
                    className="text-sm font-medium text-foreground"
                  />
                </div>
              )}
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Company:</span>
                <InlineEditField
                  value={recordData.company}
                  field="company"
                  variant="company"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              {recordType !== 'companies' && (
                <div className="flex items-center">
                  <span className="text-sm text-muted w-24">Department:</span>
                  <InlineEditField
                    value={recordData.department}
                    field="department"
                    onSave={onSave}
                    recordId={record.id}
                    recordType={recordType}
                    onSuccess={handleSuccess}
                    className="text-sm font-medium text-foreground"
                  />
                </div>
              )}
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">State:</span>
                <InlineEditField
                  value={recordData.hqState || recordData.state}
                  field="state"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              {recordType !== 'companies' && (
                <div className="flex items-center">
                  <span className="text-sm text-muted w-24">Bio URL:</span>
                  <InlineEditField
                    value={recordData.bio || null}
                    field="bio"
                    onSave={onSave}
                    recordId={record.id}
                    recordType={recordType}
                    onSuccess={handleSuccess}
                    className="text-sm font-medium text-foreground"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Intelligence Snapshot Card */}
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Intelligence Snapshot</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Buyer Group Member:</span>
                <InlineEditField
                  value={recordData.isBuyerGroupMember ? 'Yes' : 'No'}
                  field="isBuyerGroupMember"
                  inputType="select"
                  options={[
                    { value: 'Yes', label: 'Yes' },
                    { value: 'No', label: 'No' }
                  ]}
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              {recordType !== 'companies' && (
                <>
                  <div className="flex items-center">
                    <span className="text-sm text-muted w-24">Role:</span>
                    <InlineEditField
                      value={record.buyerGroupRole || 'Stakeholder'}
                      field="buyerGroupRole"
                      onSave={onSave}
                      recordId={record.id}
                      recordType={recordType}
                      onSuccess={handleSuccess}
                      className="text-sm font-medium text-foreground"
                    />
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-muted w-24">Influence Level:</span>
                    <InlineEditField
                      value={recordData.influenceLevel || null}
                      field="influenceLevel"
                      onSave={onSave}
                      recordId={record.id}
                      recordType={recordType}
                      onSuccess={handleSuccess}
                      className="text-sm font-medium text-foreground"
                    />
                  </div>
                </>
              )}
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Decision Power:</span>
                <InlineEditField
                  value={record.customFields?.decisionPower || '70'}
                  field="decisionPower"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Engagement Level:</span>
                <InlineEditField
                  value={record.customFields?.engagementLevel || 'Medium'}
                  field="engagementLevel"
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
                  value={recordData.email || null}
                  field="email"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Phone:</span>
                <InlineEditField
                  value={recordData.phone || null}
                  field="phone"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">LinkedIn:</span>
                <InlineEditField
                  value={recordData.linkedin || null}
                  field="linkedinUrl"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={(message) => handleFieldSuccess('linkedinUrl', recordData.linkedin || '', message)}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">LinkedIn Navigator:</span>
                <InlineEditField
                  value={recordData.linkedinNavigatorUrl || null}
                  field="linkedinNavigatorUrl"
                  onSave={handleLinkedinNavigatorSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleLinkedinNavigatorSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">LinkedIn Connection Date:</span>
                <InlineEditField
                  value={recordData.linkedinConnectionDate}
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
                <span className="text-sm text-muted w-24">Last Action:</span>
                <div className="flex items-center gap-2">
                  <span className="px-4 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-hover text-gray-800">
                    {getTimingLabel(recordData.lastContact)}
                  </span>
                  <InlineEditField
                    value={recordData.lastAction || '-'}
                    field="lastAction"
                    onSave={onSave}
                    recordId={record.id}
                    recordType={recordType}
                    onSuccess={handleSuccess}
                    className="text-sm font-medium text-foreground"
                  />
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Next Action:</span>
                <div className="flex items-center gap-2">
                  <span className="px-4 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-hover text-gray-800">
                    {getTimingLabel(recordData.nextActionDate)}
                  </span>
                  <InlineEditField
                    value={recordData.nextAction || null}
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
            </div>


      {/* Last Actions */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Top Recent Actions</h3>
        <div className="bg-background p-4 rounded-lg border border-border">
          {actionsLoading ? (
            <Skeleton lines={3} className="py-4" />
          ) : actionsError ? (
            <div className="text-center py-4">
              <p className="text-sm text-error mb-3">Error loading actions</p>
              <p className="text-xs text-muted">{actionsError}</p>
            </div>
          ) : lastActions.length > 0 ? (
            <ul className="space-y-2">
              {lastActions.map((action, index) => (
                <li key={index} className="text-sm text-foreground flex items-center gap-2">
                  <span>•</span>
                  <span className="px-2 py-1 bg-[var(--accent-bg)] text-[var(--accent-text)] text-xs font-medium rounded-full">
                    {action.user}
                  </span>
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
            <InlineEditField
              value={record.notes && record.notes !== 'No notes available' && record.notes.trim() !== '' ? record.notes : ''}
              field="notes"
              type="textarea"
              onSave={onSave}
              recordId={record.id}
              recordType={recordType}
              onSuccess={handleSuccess}
              className="text-sm text-foreground leading-relaxed"
              placeholder="Add notes about this contact..."
            />
                </div>
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Engagement Strategy</h4>
            <div className="text-sm text-foreground leading-relaxed">
              Focus on {(recordData.engagementPriority || '').toLowerCase()} priority engagement. 
              Last contact was {formatRelativeDate(recordData.lastContact)}. 
              Next action: {recordData.nextAction}.
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
                      console.log('🔍 [DATE DEBUG] Created date values:', {
                        recordId: record?.id,
                        recordKeys: Object.keys(record || {}),
                        createdAt: record?.createdAt,
                        createdAtType: typeof record?.createdAt,
                        createdAtValue: record?.createdAt,
                        isNull: record?.createdAt === null,
                        isUndefined: record?.createdAt === undefined,
                        formattedRelative: formatRelativeDate(record?.createdAt),
                        formattedFull: formatFullDate(record?.createdAt)
                      });
                      return formatRelativeDate(record?.createdAt);
                    })()}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-muted uppercase tracking-wide w-28">Last Updated:</span>
                  <span className="text-sm text-foreground" title={formatFullDate(record?.updatedAt)}>
                    {(() => {
                      console.log('🔍 [DATE DEBUG] Updated date values:', {
                        recordId: record?.id,
                        recordKeys: Object.keys(record || {}),
                        updatedAt: record?.updatedAt,
                        updatedAtType: typeof record?.updatedAt,
                        updatedAtValue: record?.updatedAt,
                        isNull: record?.updatedAt === null,
                        isUndefined: record?.updatedAt === undefined,
                        formattedRelative: formatRelativeDate(record?.updatedAt),
                        formattedFull: formatFullDate(record?.updatedAt)
                      });
                      return formatRelativeDate(record?.updatedAt);
                    })()}
                  </span>
                </div>
              </div>
            </div>

          </div>
        );
    }
