"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';
import { CompanyDetailSkeleton, Skeleton } from '@/platform/ui/components/Loader';
import { InlineEditField } from '@/frontend/components/pipeline/InlineEditField';
import { authFetch } from '@/platform/api-fetch';
import { useUnifiedAuth } from '@/platform/auth';
import { formatUrlForDisplay, getUrlDisplayName } from '@/platform/utils/urlFormatter';

interface CompanyOverviewTabProps {
  recordType: string;
  record?: any;
  onSave?: (field: string, value: string, recordId?: string, recordType?: string) => Promise<void>;
}

export function CompanyOverviewTab({ recordType, record: recordProp, onSave }: CompanyOverviewTabProps) {
  const router = useRouter();
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

  // Company data fetching state
  const [fullCompanyData, setFullCompanyData] = useState<any>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);

  // Enrichment status state (silent - no UI)
  const [hasTriggeredEnrichment, setHasTriggeredEnrichment] = useState(false);

  // Determine the actual company ID
  const companyId = useMemo(() => {
    // If recordType is companies, use record.id directly
    if (recordType === 'companies') {
      const id = record?.id;
      if (id) {
        console.log(`🏢 [COMPANY OVERVIEW] Company ID from companies record:`, id);
      }
      return id;
    }
    
    // Check if this is a company-only record (including opportunities which are companies)
    const isCompanyOnlyRecord = recordType === 'companies' ||
                               recordType === 'opportunities' ||
                               (recordType === 'speedrun' && record?.recordType === 'company') ||
                               (recordType === 'leads' && record?.isCompanyLead === true) ||
                               (recordType === 'prospects' && record?.isCompanyLead === true);
    
    if (isCompanyOnlyRecord) {
      const id = record?.id; // The record itself is the company
      if (id) {
        console.log(`🏢 [COMPANY OVERVIEW] Company ID from company-only record:`, id);
      }
      return id;
    }
    
    // If it's a person record, get companyId
    // Try multiple ways to get the company ID
    const id = record?.companyId || 
               record?.company?.id || 
               (typeof record?.company === 'object' && record?.company?.id) ||
               null;
    
    console.log(`🏢 [COMPANY OVERVIEW] Company ID determination:`, {
      recordType,
      companyId: id,
      recordId: record?.id,
      recordCompanyId: record?.companyId,
      recordCompany: record?.company,
      companyIsObject: typeof record?.company === 'object',
      companyObjectId: typeof record?.company === 'object' ? record?.company?.id : null,
      companyName: typeof record?.company === 'object' ? record?.company?.name : null
    });
    
    // Validate company ID format if we have one
    if (id && (id.length < 20 || id.length > 26)) {
      console.warn(`⚠️ [COMPANY OVERVIEW] Invalid company ID format detected:`, {
        id,
        length: id.length,
        recordType,
        recordId: record?.id
      });
    }
    
    return id;
  }, [record, recordType]);

  // Detect if we have partial company data that needs to be fetched
  const hasPartialCompanyData = useMemo(() => {
    if (!companyId) {
      return false; // No company ID
    }
    
    // Check if this is a company-only record (including opportunities which are companies)
    const isCompanyOnlyRecord = recordType === 'companies' ||
                               recordType === 'opportunities' ||
                               (recordType === 'speedrun' && record?.recordType === 'company') ||
                               (recordType === 'leads' && record?.isCompanyLead === true) ||
                               (recordType === 'prospects' && record?.isCompanyLead === true);
    
    // For company-only records, check if the record has enriched intelligence fields
    if (isCompanyOnlyRecord) {
      // Check for enriched intelligence fields, not just basic contact info
      const hasEnrichedFields = record?.industry || record?.revenue || record?.employeeCount ||
                                record?.foundedYear || record?.descriptionEnriched ||
                                record?.customFields?.intelligence || record?.linkedinFollowers;
      // Always fetch if we're missing enriched intelligence (even if we have website/LinkedIn/address)
      return !hasEnrichedFields;
    }
    
    // For regular company records, check if we're missing critical fields like descriptionEnriched
    // Even though recordType is 'companies', the initial record might not have all fields loaded
    if (recordType === 'companies') {
      // Check if we have descriptionEnriched - if not, fetch full company data
      const hasDescriptionEnriched = record?.descriptionEnriched && record.descriptionEnriched.trim() !== '';
      return !hasDescriptionEnriched;
    }
    
    // For person records (leads, prospects, etc.) viewing their company, always fetch full company data
    // to ensure we get enriched intelligence fields (industry, revenue, employeeCount, etc.)
    // Don't rely on basic contact fields (website, LinkedIn, address) as indicators of full data
    
    // Check if company object has enriched intelligence
    const companyHasIntelligence = record?.company && typeof record.company === 'object' && (
      record.company.industry || record.company.revenue || record.company.employeeCount ||
      record.company.foundedYear || record.company.descriptionEnriched || 
      record.company.customFields?.intelligence || record.company.linkedinFollowers
    );
    
    // Check if record itself has enriched intelligence (for company-only records)
    const recordHasIntelligence = record?.industry || record?.revenue || record?.employeeCount ||
                                  record?.foundedYear || record?.descriptionEnriched ||
                                  record?.customFields?.intelligence || record?.linkedinFollowers;
    
    // Always fetch if we don't have enriched intelligence fields
    // This ensures lead/prospect records get full company intelligence even if they have basic contact info
    return !(companyHasIntelligence || recordHasIntelligence);
  }, [companyId, record, recordType]);

  // Fetch full company data when we have partial data
  const fetchFullCompanyData = useCallback(async () => {
    if (fullCompanyData) {
      return; // Already fetched
    }

    // Defensive guard: for speedrun person records with no linked company
    if (!companyId) {
      // Check if we have company data from the record itself
      if (record?.company && typeof record.company === 'object' && record.company.id) {
        console.log(`🏢 [COMPANY OVERVIEW] Using company data from record relation`);
        setFullCompanyData(record.company);
        return;
      }
      if (recordType === 'speedrun' && record?.recordType !== 'company') {
        setCompanyError('No linked company found for this person');
      }
      return;
    }

    if (!hasPartialCompanyData) {
      return; // Nothing to fetch
    }

    setIsLoadingCompany(true);
    setCompanyError(null);

    try {
      console.log(`🏢 [COMPANY OVERVIEW] Fetching full company data for companyId: ${companyId}`);
      
      const result = await authFetch(`/api/v1/companies/${companyId}`);
      
      if (result?.success && result?.data) {
        setFullCompanyData(result.data);
        console.log(`✅ [COMPANY OVERVIEW] Successfully fetched full company data:`, result.data.name);
      } else {
        // Extract error message with better handling
        let errorMessage = 'Failed to fetch company data';
        if (result) {
          if (result.error) {
            errorMessage = typeof result.error === 'string' ? result.error : 'Company not found';
          } else if (result.message) {
            errorMessage = typeof result.message === 'string' ? result.message : 'Company not found';
          }
        }
        
        // Handle "unknown" error messages
        if (errorMessage === 'unknown' || errorMessage.toLowerCase().includes('unknown')) {
          errorMessage = 'Company not found. The company ID may be incorrect or the company may have been deleted.';
        }
        
        // Fallback: Check if we have company data from the record relation
        if (record?.company && typeof record.company === 'object' && record.company.id === companyId) {
          console.log(`⚠️ [COMPANY OVERVIEW] API call failed, but using company data from record relation`);
          setFullCompanyData(record.company);
          setCompanyError(null); // Clear error since we have fallback data
        } else {
          throw new Error(errorMessage);
        }
      }
    } catch (error) {
      console.error('❌ [COMPANY OVERVIEW] Error fetching company data:', error);
      
      // Extract meaningful error message
      let errorMessage = 'Failed to fetch company data';
      if (error instanceof Error) {
        errorMessage = error.message;
        // Handle "unknown" error messages specifically - this happens when the error object has message="unknown"
        if (errorMessage === 'unknown' || errorMessage.toLowerCase().includes('unknown')) {
          errorMessage = 'Company not found or access denied. The company ID may be incorrect or the company may have been deleted.';
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        const msg = String(error.message);
        errorMessage = msg === 'unknown' ? 'Company not found or access denied' : msg;
      }
      
      // Fallback: Check if we have company data from the record relation
      if (record?.company && typeof record.company === 'object' && record.company.id === companyId) {
        console.log(`⚠️ [COMPANY OVERVIEW] API call failed, but using company data from record relation`);
        setFullCompanyData(record.company);
        setCompanyError(null); // Clear error since we have fallback data
      } else {
        setCompanyError(errorMessage);
      }
    } finally {
      setIsLoadingCompany(false);
    }
  }, [companyId, hasPartialCompanyData, fullCompanyData, record, recordType]);

  // Initialize with company data from record if available (before fetching)
  useEffect(() => {
    // If we don't have fullCompanyData yet, check if record has company data we can use
    if (!fullCompanyData && record?.company && typeof record.company === 'object' && record.company.id) {
      // Only use record company data if we have a matching companyId or if companyId is missing
      if (!companyId || record.company.id === companyId) {
        console.log(`🏢 [COMPANY OVERVIEW] Initializing with company data from record`);
        setFullCompanyData(record.company);
      }
    }
  }, [record, companyId, fullCompanyData]);

  // Fetch full company data when component mounts or dependencies change
  useEffect(() => {
    fetchFullCompanyData();
  }, [fetchFullCompanyData]);

  // Auto-trigger enrichment and intelligence generation if company has no data (SILENT - no UI)
  useEffect(() => {
    const triggerEnrichmentAndIntelligence = async () => {
      // Only trigger if we have a company ID and haven't triggered yet
      if (!companyId || isLoadingCompany || hasTriggeredEnrichment) {
        return;
      }

      const companyData = fullCompanyData || record;
      
      if (!companyData) {
        return; // Wait for data to load
      }

      // Check if company has a website or LinkedIn URL but missing enrichment data
      const hasContactInfo = companyData?.website || companyData?.linkedinUrl;
      const missingBasicData = !companyData?.industry || !companyData?.employeeCount || 
                                !companyData?.revenue || !companyData?.foundedYear ||
                                !companyData?.description;
      const hasBeenEnriched = companyData?.customFields?.coresignalId || companyData?.lastVerified;
      
      // Check data staleness (only re-enrich if > 90 days old)
      const isStale = companyData?.lastVerified && 
        (Date.now() - new Date(companyData.lastVerified).getTime()) > 90 * 24 * 60 * 60 * 1000;
      
      // Step 1: Trigger enrichment if:
      // - Has contact info (website/LinkedIn)
      // - Missing basic data (industry/employeeCount/revenue/foundedYear/description)
      // - NOT already enriched OR data is stale (>90 days)
      if (hasContactInfo && missingBasicData && (!hasBeenEnriched || isStale)) {
        console.log(`🤖 [COMPANY OVERVIEW] Auto-triggering silent enrichment for company: ${companyId}`);
        setHasTriggeredEnrichment(true);
        
        try {
          const enrichResult = await authFetch(`/api/v1/enrich`, {
            method: 'POST',
            body: JSON.stringify({
              type: 'company',
              entityId: companyId,
              options: {
                discoverContacts: true,
                verifyEmail: true,
                verifyPhone: true
              }
            })
          });
          
          console.log(`📊 [COMPANY OVERVIEW] Enrichment result:`, enrichResult);
          
          if (enrichResult?.status === 'completed') {
            console.log(`✅ [COMPANY OVERVIEW] Successfully enriched ${enrichResult.fieldsPopulated?.length || 0} fields`);
            
            // Clear all caches to ensure fresh data
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem(`cached-companies-${companyId}`);
              sessionStorage.removeItem(`current-record-companies`);
              sessionStorage.removeItem(`cached-${recordType}-${companyId}`);
              sessionStorage.removeItem(`current-record-${recordType}`);
              sessionStorage.setItem(`force-refresh-companies-${companyId}`, 'true');
              sessionStorage.setItem(`force-refresh-companies`, 'true');
            }
            
            // Refresh company data immediately
            await fetchFullCompanyData();
            
            // Generate intelligence after enrichment completes
            setTimeout(async () => {
              await generateIntelligence();
            }, 1000);
            
          } else if (enrichResult?.status === 'failed') {
            console.warn(`⚠️ [COMPANY OVERVIEW] Enrichment failed:`, enrichResult.message);
          }
        } catch (error) {
          console.error('❌ [COMPANY OVERVIEW] Error triggering enrichment:', error);
        }
      } else if (!hasContactInfo && missingBasicData) {
        // No website - just generate intelligence with available data
        await generateIntelligence();
      } else {
        // ALWAYS check if intelligence is needed, regardless of whether company has basic data
        // This ensures all companies get a summary populated
        const needsIntelligence = !companyData?.descriptionEnriched && 
                                  !companyData?.customFields?.intelligence;
        if (needsIntelligence) {
          console.log(`🤖 [COMPANY OVERVIEW] Company missing intelligence, triggering generation for: ${companyId}`);
          await generateIntelligence();
        }
      }
    };

    // Helper function to generate intelligence
    const generateIntelligence = async () => {
      const companyData = fullCompanyData || record;
      
      // Check if intelligence is needed
      const hasDescriptionEnriched = companyData?.descriptionEnriched && 
                                      companyData.descriptionEnriched.trim() !== '' &&
                                      companyData.descriptionEnriched !== 'No description available';
      const hasIntelligence = companyData?.customFields?.intelligence;
      
      // Always generate if missing either field
      if ((hasDescriptionEnriched || hasIntelligence) || !companyId) {
        // Already has intelligence, skip
        if (hasDescriptionEnriched || hasIntelligence) {
          console.log(`ℹ️ [COMPANY OVERVIEW] Company already has intelligence, skipping generation for: ${companyId}`);
        }
        return;
      }

      console.log(`🤖 [COMPANY OVERVIEW] Auto-triggering intelligence generation for company: ${companyId}`);

      try {
        const result = await authFetch(`/api/v1/companies/${companyId}/intelligence`);
        
        if (result?.success) {
          console.log(`✅ [COMPANY OVERVIEW] Successfully generated intelligence for company: ${companyId}`);
          
          // Refresh company data immediately to get the newly generated intelligence
          await fetchFullCompanyData();
        } else {
          console.warn('⚠️ [COMPANY OVERVIEW] Intelligence generation returned unsuccessful result:', result);
        }
      } catch (error) {
        console.error('❌ [COMPANY OVERVIEW] Error generating intelligence:', error);
      }
    };

    // Only trigger once when component mounts and we have full company data loaded
    if ((fullCompanyData || (record && recordType === 'companies')) && !hasTriggeredEnrichment) {
      triggerEnrichmentAndIntelligence();
    }
  }, [companyId, fullCompanyData, record, recordType, isLoadingCompany, hasTriggeredEnrichment, fetchFullCompanyData]);

  // Create merged record data that uses full company data when available
  // CRITICAL: Prioritize company fields over person fields to ensure company data is displayed
  const mergedRecord = useMemo(() => {
    if (!fullCompanyData) {
      // If no full company data, use record but prioritize company fields
      // If this is a person record viewing their company, extract company fields
      if (record?.company && typeof record.company === 'object') {
        return {
          ...record.company, // Start with company fields
          id: companyId || record.company.id, // Ensure we use company ID
          // Don't include person fields like email, phone, linkedinUrl from person record
        };
      }
      return record; // Use original record if no full company data
    }

    // CRITICAL: Prioritize company fields - spread fullCompanyData AFTER record
    // This ensures company email/phone/LinkedIn override any person fields
    return {
      ...record, // Start with record (for ID, recordType, etc.)
      ...fullCompanyData, // Company fields override person fields
      // Ensure company-specific fields come from company data
      email: fullCompanyData.email ?? null,
      phone: fullCompanyData.phone ?? null,
      linkedinUrl: fullCompanyData.linkedinUrl ?? null,
      linkedinNavigatorUrl: fullCompanyData.linkedinNavigatorUrl ?? null,
      // Preserve the original company object structure if it exists
      company: record?.company ? {
        ...record.company,
        ...fullCompanyData
      } : fullCompanyData
    };
  }, [record, fullCompanyData, companyId]);

  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
    
    // Trigger a data refresh after successful save
    if (hasPartialCompanyData && companyId) {
      fetchFullCompanyData();
    }
  };

  // Enhanced save handler that ensures data refresh
  const handleSave = async (field: string, value: string | null, recordId?: string, recordTypeParam?: string) => {
    try {
      // CRITICAL: For company fields, always use company API endpoint
      // Determine the correct company ID and ensure we're saving to companies API
      const targetCompanyId = companyId || recordId;
      const targetRecordType = 'companies'; // Always use companies API for company fields
      
      if (!targetCompanyId) {
        throw new Error('Company ID not found. Cannot save company field.');
      }
      
      console.log(`🏢 [COMPANY OVERVIEW] Saving ${field} = ${value} to company ${targetCompanyId}`);
      
      // Prepare update data - handle special cases
      let updateData: any = {
        [field]: value,
      };
      
      // Handle empty/null values - convert empty strings to null
      if (value === null || value === '' || value === '-') {
        updateData[field] = null;
      }
      
      // Handle foundedYear - convert to integer
      if (field === 'foundedYear' && value !== null && value !== '' && value !== '-') {
        const yearValue = parseInt(value as string);
        if (isNaN(yearValue)) {
          throw new Error('Founded Year must be a valid number');
        }
        updateData.foundedYear = yearValue;
      }
      
      // Handle isPublic field - convert string to boolean
      if (field === 'isPublic') {
        if (value === null || value === '' || value === '-') {
          updateData.isPublic = null;
        } else {
          updateData.isPublic = value === 'true' || value === true;
        }
      }
      
      // Handle numeric fields that might come as strings
      const numericFields = ['employeeCount', 'revenue'];
      if (numericFields.includes(field) && value !== null && value !== '' && value !== '-') {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (!isNaN(numValue)) {
          updateData[field] = numValue;
        }
      }
      
      // Make API call to update company
      const response = await fetch(`/api/v1/companies/${targetCompanyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update ${field}`);
      }
      
      const result = await response.json();
      console.log(`✅ [COMPANY OVERVIEW] Successfully updated ${field} for company:`, targetCompanyId, result.data);
      
      // CRITICAL: Update local state with API response data to ensure UI reflects changes immediately
      // CRITICAL FIX: When value is null (deleted), always set the field to null in local state
      if (result.data) {
        // Update fullCompanyData state if it exists, otherwise set it
        if (fullCompanyData) {
          setFullCompanyData((prev: any) => {
            const updated = {
              ...prev,
              ...result.data
            };
            // CRITICAL FIX: If field was deleted (value is null), ensure it's set to null
            // API response might not include the field, so we need to explicitly set it
            if (value === null) {
              updated[field] = null;
              console.log(`🔄 [COMPANY OVERVIEW] Field ${field} was deleted - setting to null in local state`);
            }
            return updated;
          });
        } else {
          // If we don't have fullCompanyData yet, set it with the response
          const initialData = { ...result.data };
          // CRITICAL FIX: If field was deleted (value is null), ensure it's set to null
          if (value === null) {
            initialData[field] = null;
            console.log(`🔄 [COMPANY OVERVIEW] Field ${field} was deleted - setting to null in initial data`);
          }
          setFullCompanyData(initialData);
        }
      } else if (value === null) {
        // CRITICAL FIX: Even if API response doesn't have data, if we deleted the field, update local state
        if (fullCompanyData) {
          setFullCompanyData((prev: any) => ({
            ...prev,
            [field]: null
          }));
          console.log(`🔄 [COMPANY OVERVIEW] Field ${field} was deleted - setting to null in local state (no API data)`);
        }
      }
      
      // Clear caches to ensure fresh data on next load
      if (typeof window !== 'undefined' && targetCompanyId) {
        // Clear sessionStorage cache for this company
        sessionStorage.removeItem(`cached-companies-${targetCompanyId}`);
        sessionStorage.removeItem(`current-record-companies`);
        // Also clear any record-specific cache
        if (record?.id) {
          sessionStorage.removeItem(`cached-${recordType}-${record.id}`);
          sessionStorage.removeItem(`current-record-${recordType}`);
        }
        
        // Set force refresh flag to ensure fresh data on next load
        sessionStorage.setItem(`force-refresh-companies-${targetCompanyId}`, Date.now().toString());
        
        // Dispatch cache invalidation event for other components
        window.dispatchEvent(new CustomEvent('cache-invalidated', {
          detail: {
            recordType: 'companies',
            recordId: targetCompanyId,
            field
          }
        }));
      }
      
      // Call the parent's onSave function if provided (for compatibility)
      if (onSave) {
        await onSave(field, value, targetCompanyId, targetRecordType);
      }
      
      // Always refresh full company data to ensure we have the latest from the server
      // This ensures data consistency even if we already have fullCompanyData
      if (companyId) {
        await fetchFullCompanyData();
      }
      
      // Trigger Next.js router refresh to invalidate client-side cache
      // This ensures fresh data is loaded when navigating back to the record
      try {
        router.refresh();
        console.log('🔄 [COMPANY OVERVIEW] Called router.refresh() to invalidate Next.js client-side cache');
      } catch (error) {
        console.warn('⚠️ [COMPANY OVERVIEW] Failed to call router.refresh():', error);
      }
      
      handleSuccess(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`);
    } catch (error) {
      console.error('❌ [COMPANY OVERVIEW] Error saving field:', error);
      throw error; // Re-throw to let InlineEditField handle the error
    }
  };

  // Fetch actions from API
  const fetchActions = useCallback(async () => {
    if (!companyId) {
      setActions([]);
      return;
    }

    setActionsLoading(true);
    setActionsError(null);

    try {
      // Always fetch company actions using the company ID
      const actionsQuery = `companyId=${companyId}`;

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
  }, [companyId]);

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
      // Match on company ID, not the person ID
      if (recordId === companyId) {
        console.log('🔄 [COMPANY OVERVIEW] Action created event matches current company, refreshing actions');
        // Refresh actions immediately
        fetchActions();
      }
    };

    document.addEventListener('actionCreated', handleActionCreated as EventListener);
    
    return () => {
      document.removeEventListener('actionCreated', handleActionCreated as EventListener);
    };
  }, [companyId, fetchActions]);

  // Show skeleton loader while data is loading
  if (!record) {
    return <CompanyDetailSkeleton message="Loading company details..." />;
  }

  // Show loading state while fetching full company data
  if (isLoadingCompany) {
    return <CompanyDetailSkeleton message="Loading full company details..." />;
  }

  // Show error state if company data fetch failed AND we don't have fallback data
  if (companyError && !fullCompanyData && !(record?.company && typeof record.company === 'object')) {
    return (
      <div className="p-8 text-center">
        <div className="bg-error/10 border border-error text-error px-4 py-3 rounded mb-4">
          <h3 className="text-lg font-semibold mb-2">Error Loading Company Data</h3>
          <p className="text-sm">{companyError}</p>
          <button 
            onClick={fetchFullCompanyData}
            className="mt-3 px-4 py-2 bg-error text-white rounded hover:bg-error/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // Show error if no company ID is available (for person records without a company)
  // But only if we also don't have company data from the record relation
  if (!companyId && recordType !== 'companies' && !(record?.company && typeof record.company === 'object')) {
    return (
      <div className="p-8 text-center">
        <div className="bg-warning/10 border border-warning text-warning px-4 py-3 rounded mb-4">
          <h3 className="text-lg font-semibold mb-2">No Company Linked</h3>
          <p className="text-sm">This person record doesn't have a company associated. Please add a company first.</p>
        </div>
      </div>
    );
  }

  const formatEmptyValue = (value: any): string => {
    if (!value || value === '' || value === 'null' || value === 'undefined' || (Array.isArray(value) && value.length === 0)) {
      return '-';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return value;
  };

  const formatRevenue = (revenue: any): string => {
    if (!revenue) return '-';
    
    // Parse string to number if needed
    const numericRevenue = typeof revenue === 'string' ? parseFloat(revenue.replace(/[^0-9.-]/g, '')) : revenue;
    
    // Check if we have a valid number
    if (typeof numericRevenue === 'number' && !isNaN(numericRevenue)) {
      return `$${numericRevenue.toLocaleString()}`;
    }
    
    // If it's a string that couldn't be parsed, return as-is (might be a range like "$1M-$5M")
    if (typeof revenue === 'string') return revenue;
    
    return '-';
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

  const generateEngagementData = () => {
    const linkedinFollowers = mergedRecord?.linkedinFollowers || 0;
    const twitterFollowers = mergedRecord?.twitterFollowers || 0;
    const activeJobPostings = mergedRecord?.activeJobPostings || 0;
    const companyUpdates = mergedRecord?.companyUpdates || [];
    const employeeCount = mergedRecord?.employeeCount || 0;

    const totalFollowers = linkedinFollowers + (twitterFollowers || 0);
    const engagementLevel = totalFollowers > 100000 ? 'High' : totalFollowers > 10000 ? 'Medium' : 'Low';

    const lastActivity = companyUpdates?.length > 0 ?
      new Date(companyUpdates[0].date).toLocaleDateString() : null;

    const totalContacts = companyUpdates?.length > 0 ? Math.min(companyUpdates.length * 2, 50) : 0;
    const activeContacts = companyUpdates?.length > 0 ? Math.min(companyUpdates.length, 20) : 0;
    const decisionMakers = employeeCount > 1000 ? Math.min(Math.floor(employeeCount / 1000), 10) :
                          employeeCount > 100 ? Math.min(Math.floor(employeeCount / 100), 5) : 1;
    const nextAction = activeJobPostings > 0 ? 'Review job postings' :
                      companyUpdates?.length > 0 ? 'Follow up on recent updates' : 'Research company updates';
    const opportunityStage = mergedRecord?.isPublic ? 'Public Company' : mergedRecord?.isPublic === false ? 'Private Company' : 'N/A';

    return {
      totalContacts,
      activeContacts,
      lastActivity,
      decisionMakers,
      nextAction: nextAction,
      engagementLevel,
      opportunityStage
    };
  };

  const engagementData = generateEngagementData();

  // Extract company name properly (handle both string and object)
  const companyName = mergedRecord?.name || 
                     (typeof mergedRecord?.company === 'string' ? mergedRecord.company : mergedRecord?.company?.name) || 
                     'Company';

  // Generate a fallback summary from available data if no description exists
  const getCompanySummary = (): string => {
    // Prioritize the longer, more detailed description for better seller context
    const originalDesc = mergedRecord?.description && mergedRecord.description.trim() !== '' ? mergedRecord.description : '';
    const enrichedDesc = mergedRecord?.descriptionEnriched && mergedRecord.descriptionEnriched.trim() !== '' ? mergedRecord.descriptionEnriched : '';
    
    // Use the longer description for better context, or enriched if original is not available
    if (originalDesc && enrichedDesc) {
      return originalDesc.length > enrichedDesc.length ? originalDesc : enrichedDesc;
    } else if (originalDesc) {
      return originalDesc;
    } else if (enrichedDesc) {
      return enrichedDesc;
    }
    
    // Generate a basic summary from available company data
    if (mergedRecord) {
      const parts: string[] = [];
      
      // Start with company name and type
      if (mergedRecord.name) {
        const companyType = mergedRecord.isPublic === true ? 'public' : 
                           mergedRecord.isPublic === false ? 'private' : '';
        parts.push(`${mergedRecord.name} is${companyType ? ` a ${companyType}` : ''}`);
      }
      
      // Add industry
      if (mergedRecord.industry) {
        parts.push(`${parts.length > 0 ? '' : 'This is a'} ${mergedRecord.industry.toLowerCase()} company`);
      }
      
      // Add location
      const location = mergedRecord.hqCity && mergedRecord.hqState 
        ? `${mergedRecord.hqCity}, ${mergedRecord.hqState}` 
        : mergedRecord.hqCity || mergedRecord.hqState || null;
      if (location) {
        parts.push(`based in ${location}`);
      }
      
      // Add employee count
      if (mergedRecord.employeeCount) {
        parts.push(`with approximately ${mergedRecord.employeeCount.toLocaleString()} employees`);
      }
      
      // Combine parts into a sentence
      if (parts.length > 0) {
        let summary = parts.join(' ');
        // Ensure proper sentence structure
        summary = summary.charAt(0).toUpperCase() + summary.slice(1);
        if (!summary.endsWith('.')) {
          summary += '.';
        }
        
        // Add website if available
        if (mergedRecord.website) {
          summary += ` Website: ${mergedRecord.website}`;
        }
        
        return summary;
      }
    }
    
    // Final fallback if no data available
    return 'No description available. Click to add company details.';
  };

  return (
    <div>
      <div className="space-y-6">
      {/* Company Overview */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-foreground">{companyName} Overview</h3>
        <div className="bg-background p-4 rounded-lg border border-border">
          <InlineEditField
            value={getCompanySummary()}
            field="description"
            onSave={handleSave}
            recordId={companyId}
            recordType="companies"
            onSuccess={handleSuccess}
            type="textarea"
            className="text-sm text-foreground leading-relaxed font-medium"
            placeholder="Enter company description..."
          />
        </div>
      </div>

      {/* Key Metrics Dashboard */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-foreground">Key Metrics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-background p-4 rounded-lg border border-border flex flex-col justify-between">
            <div>
              <h4 className="font-medium text-foreground mb-2">Revenue</h4>
              <div className="text-2xl font-bold text-green-600">{formatRevenue(mergedRecord?.revenue)}</div>
            </div>
            <div className="text-xs text-muted mt-2">Annual reported revenue</div>
          </div>
          <div className="bg-background p-4 rounded-lg border border-border flex flex-col justify-between">
            <div>
              <h4 className="font-medium text-foreground mb-2">Employees</h4>
              <div className="text-2xl font-bold text-blue-600">{formatEmptyValue(mergedRecord?.employeeCount)}</div>
            </div>
            <div className="text-xs text-muted mt-2">Total employee count</div>
          </div>
          <div className="bg-background p-4 rounded-lg border border-border flex flex-col justify-between">
            <div>
              <h4 className="font-medium text-foreground mb-2">LinkedIn Followers</h4>
              <div className="text-2xl font-bold text-purple-600">
                {mergedRecord?.linkedinFollowers ? `${(mergedRecord.linkedinFollowers).toLocaleString()}` : '-'}
              </div>
            </div>
            <div className="text-xs text-muted mt-2">Social media reach</div>
          </div>
          <div className="bg-background p-4 rounded-lg border border-border flex flex-col justify-between">
            <div>
              <h4 className="font-medium text-foreground mb-2">Tech Stack</h4>
              <div className="text-2xl font-bold text-orange-600">{mergedRecord?.numTechnologiesUsed || mergedRecord?.technologiesUsed?.length || 0}</div>
            </div>
            <div className="text-xs text-muted mt-2">Technologies identified</div>
          </div>
          {(() => {
            // Check if this is Notary Everyday workspace
            const isNotaryEveryday = currentUser?.workspaces?.some(
              (ws: any) => ws.name === 'Notary Everyday' || ws.slug === 'notary-everyday' || ws.slug === 'ne'
            ) && currentUser?.activeWorkspaceId && currentUser.workspaces.find((ws: any) => ws.id === currentUser.activeWorkspaceId)?.name === 'Notary Everyday';
            
            if (isNotaryEveryday) {
              const orders = (mergedRecord?.customFields as any)?.orders || (fullCompanyData?.customFields as any)?.orders;
              return (
                <div className="bg-background p-4 rounded-lg border border-border flex flex-col justify-between">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Orders</h4>
                    <div className="text-2xl font-bold text-purple-600">
                      <InlineEditField
                        value={orders ? orders.toString() : '-'}
                        field="customFields.orders"
                        onSave={handleSave}
                        recordId={companyId || record?.id}
                        recordType={companyId ? 'companies' : recordType}
                        onSuccess={handleSuccess}
                        placeholder="Enter number of orders"
                        type="number"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-muted mt-2">Total orders</div>
                </div>
              );
            }
            return null;
          })()}
        </div>
      </div>

      {/* Company Information & Contact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Company Details */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-foreground">Company Details</h3>
          <div className="bg-background p-4 rounded-lg border border-border space-y-3">
            {(() => {
              const isPartnerOS = typeof window !== 'undefined' && sessionStorage.getItem('activeSubApp') === 'partneros';
              const relationshipType = mergedRecord?.relationshipType;
              
              if (relationshipType === 'CLIENT' || relationshipType === 'FUTURE_CLIENT' || relationshipType === 'PARTNER' || relationshipType === 'FUTURE_PARTNER') {
                // Define options based on app type
                const typeOptions = isPartnerOS
                  ? [
                      { value: 'PARTNER', label: 'Partner' },
                      { value: 'FUTURE_PARTNER', label: 'Future Partner' }
                    ]
                  : [
                      { value: 'CLIENT', label: 'Client' },
                      { value: 'FUTURE_CLIENT', label: 'Future Client' }
                    ];
                
                return (
                  <div className="flex items-center">
                    <span className="text-sm text-muted w-32">Type:</span>
                    <InlineEditField
                      value={relationshipType}
                      field="relationshipType"
                      onSave={onSave}
                      recordId={record.id}
                      recordType={recordType}
                      onSuccess={handleSuccess}
                      inputType="select"
                      options={typeOptions}
                      className="text-sm font-medium text-foreground"
                    />
                  </div>
                );
              }
              return null;
            })()}
            
            {/* Stage Field - Inline editable with pill styling */}
            <div className="flex items-center">
              <span className="text-sm text-muted w-32">Stage:</span>
              <InlineEditField
                value={mergedRecord?.status || 'LEAD'}
                field="status"
                onSave={onSave}
                recordId={record.id}
                recordType={recordType}
                onSuccess={handleSuccess}
                inputType="select"
                options={(() => {
                  const isPartnerOS = typeof window !== 'undefined' && sessionStorage.getItem('activeSubApp') === 'partneros';
                  if (isPartnerOS) {
                    return [
                      { value: 'LEAD', label: 'Lead' },
                      { value: 'PROSPECT', label: 'Prospect' },
                      { value: 'CLIENT', label: 'Partner' }
                    ];
                  }
                  return [
                    { value: 'LEAD', label: 'Lead' },
                    { value: 'PROSPECT', label: 'Prospect' },
                    { value: 'OPPORTUNITY', label: 'Opportunity' },
                    { value: 'CLIENT', label: 'Client' }
                  ];
                })()}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                  mergedRecord?.status === 'LEAD' ? 'bg-warning/10 text-warning border-warning/20' :
                  mergedRecord?.status === 'PROSPECT' ? 'bg-info/10 text-info border-info/20' :
                  mergedRecord?.status === 'OPPORTUNITY' ? 'bg-primary/10 text-primary border-primary/20' :
                  mergedRecord?.status === 'CLIENT' ? 'bg-success/10 text-success border-success/20' :
                  'bg-hover/50 text-foreground border-border'
                }`}
              />
            </div>
            
            <div className="flex items-center">
              <span className="text-sm text-muted w-32">Legal Name:</span>
              <InlineEditField
                value={mergedRecord?.legalName || ''}
                field="legalName"
                onSave={handleSave}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                className="text-sm font-medium text-foreground"
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-muted w-32">Industry:</span>
              <InlineEditField
                value={mergedRecord?.industry || ''}
                field="industry"
                onSave={handleSave}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                className="text-sm font-medium text-foreground"
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-muted w-32">Sector:</span>
              <InlineEditField
                value={mergedRecord?.sector || ''}
                field="sector"
                onSave={handleSave}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                className="text-sm font-medium text-foreground"
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-muted w-32">Founded Year:</span>
              <InlineEditField
                value={mergedRecord?.foundedYear?.toString() || ''}
                field="foundedYear"
                onSave={handleSave}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                type="number"
                className="text-sm font-medium text-foreground"
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-muted w-32">Company Type:</span>
              <InlineEditField
                value={mergedRecord?.isPublic !== undefined ? (mergedRecord.isPublic ? 'Public' : 'Private') : ''}
                field="isPublic"
                onSave={handleSave}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                inputType="select"
                options={[
                  { value: 'true', label: 'Public' },
                  { value: 'false', label: 'Private' }
                ]}
                className="text-sm font-medium text-foreground"
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-muted w-32">Stage:</span>
              <InlineEditField
                value={mergedRecord?.status || ''}
                field="status"
                onSave={handleSave}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                inputType="select"
                options={[
                  { value: 'LEAD', label: 'Lead' },
                  { value: 'PROSPECT', label: 'Prospect' },
                  { value: 'OPPORTUNITY', label: 'Opportunity' },
                  { value: 'CLIENT', label: 'Client' },
                  { value: 'SUPERFAN', label: 'Superfan' },
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'INACTIVE', label: 'Inactive' }
                ]}
                className="text-sm font-medium text-foreground"
              />
            </div>
            {mergedRecord?.stockSymbol && (
              <div className="flex items-center">
                <span className="text-sm text-muted w-32">Stock Symbol:</span>
                <InlineEditField
                  value={mergedRecord.stockSymbol || ''}
                  field="stockSymbol"
                  onSave={handleSave}
                  recordId={companyId}
                  recordType="companies"
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
            )}
          </div>
        </div>

        {/* Contact & Location */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-foreground">Contact & Location</h3>
          <div className="bg-background p-4 rounded-lg border border-border space-y-3">
            <div className="flex items-center">
              <span className="text-sm text-muted w-32">Website:</span>
              <InlineEditField
                value={formatUrlForDisplay(mergedRecord?.website || '', { maxLength: 40, preserveEnding: 10 })}
                field="website"
                onSave={handleSave}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                type="text"
                className="text-sm font-medium text-[#2563EB] hover:underline"
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-muted w-32">Email:</span>
              <InlineEditField
                value={mergedRecord?.email || ''}
                field="email"
                onSave={handleSave}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                type="email"
                className="text-sm font-medium text-foreground"
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-muted w-32">Phone:</span>
              <InlineEditField
                value={mergedRecord?.phone || ''}
                field="phone"
                onSave={handleSave}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                type="text"
                className="text-sm font-medium text-foreground"
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-muted w-32">LinkedIn:</span>
              <InlineEditField
                value={formatUrlForDisplay(mergedRecord?.linkedinUrl || '', { maxLength: 40, preserveEnding: 10 })}
                field="linkedinUrl"
                onSave={handleSave}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                type="text"
                className="text-sm font-medium text-[#2563EB] hover:underline"
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-muted w-32">LinkedIn Navigator:</span>
              <InlineEditField
                value={formatUrlForDisplay(mergedRecord?.linkedinNavigatorUrl || '', { maxLength: 40, preserveEnding: 10 })}
                field="linkedinNavigatorUrl"
                onSave={handleSave}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                type="text"
                className="text-sm font-medium text-[#2563EB] hover:underline"
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-muted w-32">HQ City:</span>
              <InlineEditField
                value={mergedRecord?.hqCity || mergedRecord?.city || ''}
                field="hqCity"
                onSave={handleSave}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                className="text-sm font-medium text-foreground"
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-muted w-32">HQ State:</span>
              <InlineEditField
                value={mergedRecord?.hqState || mergedRecord?.state || ''}
                field="hqState"
                onSave={handleSave}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                className="text-sm font-medium text-foreground"
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-muted w-32">HQ Street:</span>
              <InlineEditField
                value={mergedRecord?.hqStreet || mergedRecord?.address || ''}
                field="hqStreet"
                onSave={handleSave}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                className="text-sm font-medium text-foreground"
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-muted w-32">HQ Zipcode:</span>
              <InlineEditField
                value={mergedRecord?.hqZipcode || mergedRecord?.postalCode || ''}
                field="hqZipcode"
                onSave={handleSave}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                className="text-sm font-medium text-foreground"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Seller Intelligence */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-foreground">Seller Intelligence</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-background p-4 rounded-lg border border-border space-y-3">
            <h4 className="font-medium text-foreground mb-2">Market & Growth</h4>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Market Position:</span>
              <InlineEditField
                value={mergedRecord?.marketPosition || ''}
                field="marketPosition"
                onSave={handleSave}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                className="text-sm font-medium text-foreground"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Competitive Pressure:</span>
              <span className="text-sm font-medium text-foreground">
                {(mergedRecord?.competitors?.length || 0) > 15 ? 'High' : (mergedRecord?.competitors?.length || 0) > 5 ? 'Medium' : 'Low'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Hiring Activity:</span>
              <InlineEditField
                value={mergedRecord?.activeJobPostings?.toString() || ''}
                field="activeJobPostings"
                onSave={handleSave}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                type="number"
                className="text-sm font-medium text-foreground"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Last Funding:</span>
              <InlineEditField
                value={mergedRecord?.lastFundingAmount?.toLocaleString() || ''}
                field="lastFundingAmount"
                onSave={handleSave}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                type="number"
                className="text-sm font-medium text-foreground"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Funding Date:</span>
              <InlineEditField
                value={mergedRecord?.lastFundingDate ? new Date(mergedRecord.lastFundingDate).toISOString().split('T')[0] : ''}
                field="lastFundingDate"
                onSave={handleSave}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                variant="date"
                className="text-sm font-medium text-foreground"
              />
            </div>
          </div>

          <div className="bg-background p-4 rounded-lg border border-border space-y-3">
            <h4 className="font-medium text-foreground mb-2">Engagement & Strategy</h4>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Engagement Level:</span>
              <span className="text-sm font-medium text-foreground">{engagementData.engagementLevel}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Decision Makers:</span>
              <span className="text-sm font-medium text-foreground">{engagementData.decisionMakers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Next Action:</span>
              <InlineEditField
                value={mergedRecord?.nextAction || engagementData.nextAction}
                field="nextAction"
                onSave={handleSave}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                className="text-sm font-medium text-foreground"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Next Action Date:</span>
              <InlineEditField
                value={mergedRecord?.nextActionDate ? new Date(mergedRecord.nextActionDate).toISOString().split('T')[0] : ''}
                field="nextActionDate"
                onSave={handleSave}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                variant="date"
                className="text-sm font-medium text-foreground"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Digital Maturity:</span>
              <InlineEditField
                value={mergedRecord?.digitalMaturity?.toString() || ''}
                field="digitalMaturity"
                onSave={handleSave}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                type="number"
                className="text-sm font-medium text-foreground"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Actions */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-foreground">Recent Actions</h3>
        <div className="bg-background p-4 rounded-lg border border-border">
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
          ) : actions.length > 0 ? (
            <ul className="space-y-2">
              {actions.map((action, index) => (
                <li key={index} className="text-sm text-muted flex items-center gap-2">
                  <span>•</span>
                  {action.type && (
                    <span className="px-2 py-1 bg-[var(--accent-bg)] text-[var(--accent-text)] text-xs font-medium rounded-full">
                      {action.type}
                    </span>
                  )}
                  <span>{action.action} - {formatRelativeDate(action.createdAt)}</span>
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

      {/* Notes & Tags */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-foreground">Notes & Tags</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Internal Notes</h4>
            <InlineEditField
              value={mergedRecord?.notes || ''}
              field="notes"
              onSave={handleSave}
              recordId={companyId}
              recordType="companies"
              onSuccess={handleSuccess}
              type="textarea"
              className="text-sm text-foreground leading-relaxed"
              placeholder="Add internal notes about this company..."
            />
          </div>
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Tags</h4>
            <InlineEditField
              value={mergedRecord?.tags?.join(', ') || ''}
              field="tags"
              onSave={handleSave}
              recordId={companyId}
              recordType="companies"
              onSuccess={handleSuccess}
              className="text-sm font-medium text-foreground"
              placeholder="Enter tags separated by commas"
            />
          </div>
        </div>
      </div>

      {/* Record Information */}
      <div className="mt-8 pt-6 border-t border-border">
        <h3 className="text-sm font-medium text-muted uppercase tracking-wide mb-4">Record Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-xs text-muted uppercase tracking-wide w-28">Created:</span>
            <span className="text-sm text-foreground" title={formatFullDate(mergedRecord?.createdAt)}>
              {formatRelativeDate(mergedRecord?.createdAt)}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-muted uppercase tracking-wide w-28">Last Updated:</span>
            <span className="text-sm text-foreground" title={formatFullDate(mergedRecord?.updatedAt)}>
              {formatRelativeDate(mergedRecord?.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      </div>
    </div>
  );
}