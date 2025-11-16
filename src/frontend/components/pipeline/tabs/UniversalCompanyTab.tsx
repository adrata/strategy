"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';
import { CompanyDetailSkeleton } from '@/platform/ui/components/Loader';
import { InlineEditField } from '@/frontend/components/pipeline/InlineEditField';
import { authFetch } from '@/platform/api-fetch';
import { useUnifiedAuth } from '@/platform/auth';

interface UniversalCompanyTabProps {
  recordType: string;
  record?: any;
  onSave?: (field: string, value: string, recordId?: string, recordType?: string) => Promise<void>;
}

export function UniversalCompanyTab({ recordType, record: recordProp, onSave }: UniversalCompanyTabProps) {
  const { currentRecord: contextRecord } = useRecordContext();
  const record = recordProp || contextRecord;
  const { user: authUser } = useUnifiedAuth();
  
  // Success message state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Check if this is Notary Everyday workspace
  const isNotaryEveryday = authUser?.workspaces?.some(
    (ws: any) => ws.name === 'Notary Everyday' || ws.slug === 'notary-everyday' || ws.slug === 'ne'
  ) && authUser?.activeWorkspaceId && authUser.workspaces.find((ws: any) => ws.id === authUser.activeWorkspaceId)?.name === 'Notary Everyday';
  
  // Company data fetching state
  const [fullCompanyData, setFullCompanyData] = useState<any>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);
  
  // Enrichment status state (silent - no UI)
  const [hasTriggeredEnrichment, setHasTriggeredEnrichment] = useState(false);
  
  // Local state for immediate UI updates
  const [website, setWebsite] = useState<string | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState<string | null>(null);
  const [linkedinNavigatorUrl, setLinkedinNavigatorUrl] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [state, setState] = useState<string | null>(null);
  
  // Determine the actual company ID
  const companyId = useMemo(() => {
    // If recordType is companies, use record.id directly
    if (recordType === 'companies') {
      return record?.id;
    }
    // If it's a person record, get companyId
    return record?.companyId || record?.company?.id;
  }, [record, recordType]);

  // Detect if we have partial company data that needs to be fetched
  const hasPartialCompanyData = useMemo(() => {
    if (!companyId) {
      return false; // No company ID
    }
    
    // For regular company records, check if we're missing critical fields like descriptionEnriched
    // Even though recordType is 'companies', the initial record might not have all fields loaded
    if (recordType === 'companies') {
      // Check if we have descriptionEnriched - if not, fetch full company data
      const hasDescriptionEnriched = record?.descriptionEnriched && record.descriptionEnriched.trim() !== '';
      return !hasDescriptionEnriched;
    }
    
    // For person/lead records, check if company object has detailed fields
    // The company include from people API only has: id, name, industry, size, globalRank, hqState
    // We need to check if we have more detailed fields beyond these basics
    const companyData = record?.company && typeof record.company === 'object' ? record.company : record;
    
    // Check if we have detailed company fields beyond the basic 6 from the people API
    const hasDetailedFields = companyData?.website || companyData?.linkedinUrl || 
                              companyData?.revenue || companyData?.employeeCount ||
                              companyData?.hqFullAddress || companyData?.foundedYear ||
                              companyData?.description || companyData?.descriptionEnriched ||
                              companyData?.legalName || companyData?.phone || companyData?.email;
    
    // If we don't have detailed fields, we need to fetch full company data
    return !hasDetailedFields;
  }, [companyId, record, recordType]);
  
  // Fetch full company data when we have partial data
  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!companyId || !hasPartialCompanyData) {
        return;
      }

      setIsLoadingCompany(true);
      setCompanyError(null);

      try {
        console.log(`🏢 [UniversalCompanyTab] Fetching full company data for companyId: ${companyId}`);
        
        // authFetch returns parsed JSON, not a Response object
        const result = await authFetch(`/api/v1/companies/${companyId}`);
        
        if (result?.success && result?.data) {
          console.log(`✅ [UniversalCompanyTab] Fetched company data:`, result.data);
          setFullCompanyData(result.data);
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
          
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error('❌ [UniversalCompanyTab] Error fetching company data:', error);
        
        // Extract meaningful error message
        let errorMessage = 'Failed to fetch company data';
        if (error instanceof Error) {
          errorMessage = error.message;
          // Handle "unknown" error messages specifically
          if (errorMessage === 'unknown' || errorMessage.toLowerCase().includes('unknown')) {
            errorMessage = 'Company not found or access denied. The company ID may be incorrect or the company may have been deleted.';
          }
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (error && typeof error === 'object' && 'message' in error) {
          const msg = String(error.message);
          errorMessage = msg === 'unknown' ? 'Company not found or access denied' : msg;
        }
        
        setCompanyError(errorMessage);
      } finally {
        setIsLoadingCompany(false);
      }
    };

    fetchCompanyData();
  }, [companyId, hasPartialCompanyData]);

  // Auto-trigger enrichment and intelligence generation if company has missing data
  useEffect(() => {
    const triggerEnrichmentAndIntelligence = async () => {
      // Only trigger if we have a company ID and haven't triggered yet
      if (!companyId || hasTriggeredEnrichment || isLoadingCompany) {
        return;
      }

      const companyData = fullCompanyData || record;
      
      // Check if enrichment is needed (missing key fields)
      const missingDescription = !companyData?.description && !companyData?.descriptionEnriched;
      const missingIndustry = !companyData?.industry;
      const missingEmployeeCount = !companyData?.employeeCount;
      const missingRevenue = !companyData?.revenue;
      const hasBeenEnriched = companyData?.customFields?.coresignalId || companyData?.lastVerified;
      
      // Check data staleness (only re-enrich if > 90 days old)
      const isStale = companyData?.lastVerified && 
        (Date.now() - new Date(companyData.lastVerified).getTime()) > 90 * 24 * 60 * 60 * 1000;
      
      // Only trigger if: missing critical data OR (has identifier and stale)
      const needsEnrichment = (missingDescription || missingIndustry || missingEmployeeCount || missingRevenue) && 
                               (!hasBeenEnriched || isStale);

      if (needsEnrichment && (companyData?.website || companyData?.linkedinUrl)) {
        console.log(`🤖 [UniversalCompanyTab] Auto-triggering enrichment for company: ${companyId}`);
        setHasTriggeredEnrichment(true);
        
        try {
          const enrichResult = await authFetch(`/api/v1/enrich`, {
            method: 'POST',
            body: JSON.stringify({
              type: 'company',
              entityId: companyId,
              options: {}
            })
          });
          
          console.log(`📊 [UniversalCompanyTab] Enrichment result:`, enrichResult);
          
          if (enrichResult?.status === 'completed') {
            console.log(`✅ [UniversalCompanyTab] Successfully enriched ${enrichResult.fieldsPopulated?.length || 0} fields`);
            
            // Trigger page refresh to show new data
            window.location.reload();
          } else if (enrichResult?.status === 'failed') {
            console.warn(`⚠️ [UniversalCompanyTab] Enrichment failed:`, enrichResult.message);
          }
        } catch (error) {
          console.error('❌ [UniversalCompanyTab] Error triggering enrichment:', error);
        }
      }
    };

    // Only trigger once when component mounts and we have company data
    if ((fullCompanyData || record) && !hasTriggeredEnrichment) {
      triggerEnrichmentAndIntelligence();
    }
  }, [companyId, fullCompanyData, record, hasTriggeredEnrichment, isLoadingCompany]);

  // Initialize local state from record data and sync with record updates
  useEffect(() => {
    if (record) {
      const newWebsite = record?.website || null;
      const newLinkedinUrl = record?.linkedinUrl || record?.linkedin || null;
      const newLinkedinNavigatorUrl = record?.linkedinNavigatorUrl || null;
      const newCity = record?.city || null;
      const newState = record?.state || null;
      
      console.log(`🔍 [UniversalCompanyTab] Syncing state from record:`, {
        recordId: record?.id,
        newWebsite,
        newLinkedinUrl,
        newLinkedinNavigatorUrl,
        newCity,
        newState
      });
      
      // Only update state if values have changed to avoid unnecessary re-renders
      if (newWebsite !== website) {
        setWebsite(newWebsite);
      }
      if (newLinkedinUrl !== linkedinUrl) {
        setLinkedinUrl(newLinkedinUrl);
      }
      if (newLinkedinNavigatorUrl !== linkedinNavigatorUrl) {
        setLinkedinNavigatorUrl(newLinkedinNavigatorUrl);
      }
      if (newCity !== city) {
        setCity(newCity);
      }
      if (newState !== state) {
        setState(newState);
      }
    }
  }, [record, website, linkedinUrl, linkedinNavigatorUrl, city, state]);

  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // Enhanced success handler that updates local state for specific fields
  const handleFieldSuccess = (field: string, value: string, message: string) => {
    console.log(`🔍 [UniversalCompanyTab] handleFieldSuccess called:`, { field, value, message });
    
    // Update local state for specific fields
    if (field === 'website') {
      setWebsite(value);
    } else if (field === 'linkedinUrl') {
      setLinkedinUrl(value);
    } else if (field === 'linkedinNavigatorUrl') {
      setLinkedinNavigatorUrl(value);
    } else if (field === 'city') {
      setCity(value);
    } else if (field === 'state') {
      setState(value);
    }
    
    handleSuccess(message);
  };

  const formatEmptyValue = (value: any): string => {
    if (!value || value === '' || value === 'null' || value === 'undefined') {
      return '-';
    }
    return value;
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

  // Merge record data with fetched company data
  // CRITICAL: Prioritize company fields over person fields to ensure company data is displayed
  const mergedRecord = useMemo(() => {
    if (!record) return null;
    
    // If we have full company data, merge it with the record
    if (fullCompanyData) {
      return {
        ...record, // Start with record (for ID, recordType, etc.)
        ...fullCompanyData, // Company fields override person fields
        // Ensure company-specific fields come from company data
        email: fullCompanyData.email ?? null,
        phone: fullCompanyData.phone ?? null,
        linkedinUrl: fullCompanyData.linkedinUrl ?? null,
        linkedinNavigatorUrl: fullCompanyData.linkedinNavigatorUrl ?? null,
        // Ensure we use the original record's ID and type
        id: record.id,
        recordType: record.recordType || recordType
      };
    }
    
    // If no full company data, prioritize company fields from record.company if available
    if (record?.company && typeof record.company === 'object') {
      return {
        ...record.company, // Start with company fields
        id: companyId || record.company.id,
        recordType: record.recordType || recordType
      };
    }
    
    return record;
  }, [record, fullCompanyData, recordType, companyId]);

  // Show skeleton loader while data is loading
  if (!record) {
    return <CompanyDetailSkeleton message="Loading company details..." />;
  }

  // Show loading state while fetching company data
  if (isLoadingCompany) {
    return <CompanyDetailSkeleton message="Loading company details..." />;
  }

  // Show error state if company data fetch failed
  if (companyError) {
    return (
      <div className="p-6">
        <div className="bg-error/10 border border-error rounded-lg p-4">
          <h3 className="text-error font-medium mb-2">Error Loading Company Data</h3>
          <p className="text-error text-sm mb-2">{companyError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-error/10 text-error border border-error text-xs rounded hover:bg-error/20"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Debug: Log the record structure to see what's available
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [Company Data Debug] Record structure:', {
      record: record,
      mergedRecord: mergedRecord,
      fullCompanyData: fullCompanyData,
      companyId: companyId,
      hasPartialCompanyData: hasPartialCompanyData,
      customFields: mergedRecord?.customFields,
      website: website || mergedRecord?.website,
      linkedinUrl: linkedinUrl || mergedRecord?.linkedinUrl,
      linkedin: mergedRecord?.linkedin,
      city: city || mergedRecord?.city,
      state: state || mergedRecord?.state
    });
  }

  // Helper function to get value or null (no fallback to '-')
  const getValue = (value: any) => value || null;
  
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
  
  // Use real company data from merged record with local state fallbacks - no fallback to '-'
  // CRITICAL: Prioritize fullCompanyData when available, as it contains the most up-to-date company information
  const companyData = {
    name: getValue(fullCompanyData?.name || mergedRecord?.name),
    industry: getValue(fullCompanyData?.industry || mergedRecord?.industry),
    size: getValue(fullCompanyData?.size || fullCompanyData?.employeeCount || mergedRecord?.size || mergedRecord?.employeeCount),
    revenue: (fullCompanyData?.revenue || mergedRecord?.revenue) ? `$${Number(fullCompanyData?.revenue || mergedRecord?.revenue).toLocaleString()}` : null,
    location: (city && state ? `${city}, ${state}` : null) || 
              (fullCompanyData?.city && fullCompanyData?.state ? `${fullCompanyData.city}, ${fullCompanyData.state}` : null) ||
              (mergedRecord?.city && mergedRecord?.state ? `${mergedRecord.city}, ${mergedRecord.state}` : null) || 
              getValue(fullCompanyData?.address || mergedRecord?.address),
    website: website || getValue(fullCompanyData?.website || mergedRecord?.website),
    linkedin: linkedinUrl || getValue(fullCompanyData?.linkedinUrl || 
              mergedRecord?.linkedinUrl || 
              mergedRecord?.customFields?.linkedinUrl || 
              mergedRecord?.customFields?.linkedin || 
              mergedRecord?.linkedin),
    founded: getValue(fullCompanyData?.foundedYear || mergedRecord?.foundedYear || mergedRecord?.founded),
    ceo: getValue(fullCompanyData?.ceo || mergedRecord?.ceo),
    description: (() => {
      // Prioritize fullCompanyData first, then mergedRecord
      const originalDesc = (fullCompanyData?.description || mergedRecord?.description) && (fullCompanyData?.description || mergedRecord?.description).trim() !== '' ? (fullCompanyData?.description || mergedRecord?.description).trim() : '';
      const enrichedDesc = (fullCompanyData?.descriptionEnriched || mergedRecord?.descriptionEnriched) && (fullCompanyData?.descriptionEnriched || mergedRecord?.descriptionEnriched).trim() !== '' ? (fullCompanyData?.descriptionEnriched || mergedRecord?.descriptionEnriched).trim() : '';
      
      // Use the longer description for better context, or enriched if original is not available
      if (originalDesc && enrichedDesc) {
        return originalDesc.length > enrichedDesc.length ? originalDesc : enrichedDesc;
      } else if (originalDesc) {
        return originalDesc;
      } else if (enrichedDesc) {
        return enrichedDesc;
      }
      
      // Return null instead of fallback text to let InlineEditField show its placeholder
      return null;
    })(),
    marketCap: getValue(mergedRecord?.marketCap),
    employees: getValue(mergedRecord?.employeeCount || mergedRecord?.size),
    headquarters: (() => {
      // Try enriched CoreSignal data first, prioritizing fullCompanyData
      const hqLocation = fullCompanyData?.hqLocation || mergedRecord?.hqLocation || '';
      const hqCity = fullCompanyData?.hqCity || mergedRecord?.hqCity || '';
      const hqState = fullCompanyData?.hqState || mergedRecord?.hqState || '';
      const hqFullAddress = fullCompanyData?.hqFullAddress || mergedRecord?.hqFullAddress || '';
      
      // Fallback to basic fields
      const address = fullCompanyData?.address || mergedRecord?.address || '';
      const recordCity = city || fullCompanyData?.city || mergedRecord?.city || '';
      const recordState = state || fullCompanyData?.state || mergedRecord?.state || '';
      
      // Use enriched data if available
      if (hqLocation) {
        return hqLocation;
      } else if (hqFullAddress) {
        return hqFullAddress;
      } else if (hqCity && hqState) {
        return `${hqCity}, ${hqState}`;
      } else if (address && recordCity && recordState) {
        return `${address}, ${recordCity}, ${recordState}`;
      } else if (recordCity && recordState) {
        return `${recordCity}, ${recordState}`;
      } else if (address) {
        return address;
      } else if (recordCity) {
        return recordCity;
      }
      return null;
    })(),
    businessModel: getValue(mergedRecord?.businessModel),
    keyProducts: mergedRecord?.keyProducts || [],
    competitors: mergedRecord?.competitors || [],
    recentNews: mergedRecord?.recentNews || [],
    financials: {
      revenue: mergedRecord?.revenue ? `$${Number(mergedRecord.revenue).toLocaleString()}` : null,
      growth: getValue(mergedRecord?.growth),
      profitMargin: getValue(mergedRecord?.profitMargin),
      debtToEquity: getValue(mergedRecord?.debtToEquity),
      peRatio: getValue(mergedRecord?.peRatio)
    },
    technology: {
      cloudAdoption: getValue(mergedRecord?.cloudAdoption),
      aiUsage: getValue(mergedRecord?.aiUsage),
      securityRating: getValue(mergedRecord?.securityRating),
      compliance: mergedRecord?.compliance || []
    }
  };

  // Generate engagement data from real CoreSignal data
  const generateEngagementData = () => {
    // Use real data from CoreSignal enrichment
    const linkedinFollowers = mergedRecord?.linkedinFollowers || 0;
    const twitterFollowers = mergedRecord?.twitterFollowers || 0;
    const owlerFollowers = mergedRecord?.owlerFollowers || 0;
    const activeJobPostings = mergedRecord?.activeJobPostings || 0;
    const companyUpdates = mergedRecord?.companyUpdates || [];
    const technologiesUsed = mergedRecord?.technologiesUsed || [];
    const competitors = mergedRecord?.competitors || [];
    const employeeCount = mergedRecord?.employeeCount || 0;
    
    // Calculate engagement based on real metrics
    const totalFollowers = linkedinFollowers + (twitterFollowers || 0) + (owlerFollowers || 0);
    const engagementLevel = totalFollowers > 100000 ? 'High' : totalFollowers > 10000 ? 'Medium' : 'Low';
    
    // Use real activity data
    const lastActivity = companyUpdates?.length > 0 ? 
      new Date(companyUpdates[0].date).toLocaleDateString() : null;
    
    // Use more realistic calculations based on actual company data
    const totalContacts = companyUpdates?.length > 0 ? Math.min(companyUpdates.length * 2, 50) : 0;
    const activeContacts = companyUpdates?.length > 0 ? Math.min(companyUpdates.length, 20) : 0;
    const decisionMakers = employeeCount > 1000 ? Math.min(Math.floor(employeeCount / 1000), 10) : 
                          employeeCount > 100 ? Math.min(Math.floor(employeeCount / 100), 5) : 1;
    const nextAction = activeJobPostings > 0 ? 'Review job postings' : 
                      companyUpdates?.length > 0 ? 'Follow up on recent updates' : 'Research company updates';
    const opportunityStage = mergedRecord?.isPublic ? 'Public Company' : 'Private Company';

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

  // Generate recent activity from real CoreSignal company updates
  const generateRecentActivity = () => {
    const companyUpdates = mergedRecord?.companyUpdates || [];
    
    if (companyUpdates.length === 0) {
      return [{
        type: 'No recent activity',
        contact: 'Company Updates',
        time: null,
        description: 'No recent company updates available',
        color: 'gray'
      }];
    }

    // Take the first 4 most recent company updates and format them
    return companyUpdates.slice(0, 4).map((update: any, index: number) => {
      const colors = ['blue', 'green', 'purple', 'orange'];
      const activityTypes = ['Company Update', 'LinkedIn Post', 'Company News', 'Industry Update'];
      
      // Use real follower count from the update or fallback to company data
      const followerCount = update.followers || mergedRecord?.linkedinFollowers || 0;
      
      return {
        type: activityTypes[index] || 'Company Update',
        contact: `${mergedRecord?.name || 'Company'} (${followerCount.toLocaleString()} followers)`,
        time: new Date(update.date).toLocaleDateString(),
        description: update.description?.substring(0, 100) + (update.description?.length > 100 ? '...' : ''),
        color: colors[index] || 'blue'
      };
    });
  };

  const recentActivity = generateRecentActivity();

  return (
    <div className="space-y-8">
      {/* Company Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">Company Summary</h3>
        <div className="bg-background p-4 rounded-lg border border-border">
          <InlineEditField
            value={
              (fullCompanyData?.descriptionEnriched && fullCompanyData.descriptionEnriched.trim()) 
                ? fullCompanyData.descriptionEnriched 
                : (fullCompanyData?.description && fullCompanyData.description.trim())
                  ? fullCompanyData.description
                  : (companyData.descriptionEnriched && companyData.descriptionEnriched.trim()) 
                    ? companyData.descriptionEnriched 
                    : (companyData.description && companyData.description.trim())
                      ? companyData.description
                      : ''
            }
            field="description"
            onSave={onSave}
            recordId={companyId || record.id}
            recordType={companyId ? 'companies' : recordType}
            onSuccess={handleSuccess}
            type="textarea"
            className="text-sm text-foreground leading-relaxed font-medium"
            placeholder="Enter company description..."
          />
        </div>
      </div>

      {/* Company Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">Company Information</h3>
        {isNotaryEveryday && (() => {
          const orders = (mergedRecord?.customFields as any)?.orders || (fullCompanyData?.customFields as any)?.orders;
          return (
            <div className="bg-background p-4 rounded-lg border border-border mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground mb-1">Orders</h4>
                  <p className="text-xs text-muted">Total number of orders</p>
                </div>
                <div className="text-3xl font-bold text-purple-600">
                  <InlineEditField
                    value={orders ? orders.toString() : '-'}
                    field="customFields.orders"
                    onSave={onSave || (async () => {})}
                    recordId={companyId || record?.id}
                    recordType={companyId ? 'companies' : recordType}
                    onSuccess={handleSuccess}
                    placeholder="Enter number of orders"
                    type="number"
                  />
                </div>
              </div>
            </div>
          );
        })()}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Basic Information</h4>
            <div className="space-y-2">
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
                      <span className="text-sm text-muted w-24">Type:</span>
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
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Company Name:</span>
                <InlineEditField
                  value={fullCompanyData?.name || companyData.name}
                  field="name"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Legal Name:</span>
                <InlineEditField
                  value={fullCompanyData?.legalName || mergedRecord?.legalName || record?.legalName || ''}
                  field="legalName"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Trading Name:</span>
                <InlineEditField
                  value={fullCompanyData?.tradingName || mergedRecord?.tradingName || record?.tradingName || ''}
                  field="tradingName"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Local Name:</span>
                <InlineEditField
                  value={fullCompanyData?.localName || mergedRecord?.localName || record?.localName || ''}
                  field="localName"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Total Employees:</span>
                <InlineEditField
                  value={fullCompanyData?.employeeCount || fullCompanyData?.size || companyData.size}
                  field="employeeCount"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">HQ Location:</span>
                <DisplayValue value={companyData.headquarters} />
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Founded:</span>
                <DisplayValue value={fullCompanyData?.foundedYear || mergedRecord?.foundedYear || record?.foundedYear}>
                  {(() => {
                    const foundedYear = fullCompanyData?.foundedYear || mergedRecord?.foundedYear || record?.foundedYear;
                    if (foundedYear) {
                      const currentYear = new Date().getFullYear();
                      const yearsInBusiness = currentYear - foundedYear;
                      return `${yearsInBusiness} years ago (${foundedYear})`;
                    }
                    return null;
                  })()}
                </DisplayValue>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Company Type:</span>
                <DisplayValue value={(fullCompanyData?.isPublic ?? mergedRecord?.isPublic ?? record?.isPublic) !== undefined}>
                  {(() => {
                    const isPublic = fullCompanyData?.isPublic ?? mergedRecord?.isPublic ?? record?.isPublic;
                    return isPublic ? 'Public Company' : isPublic === false ? 'Private Company' : null;
                  })()}
                </DisplayValue>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Phone:</span>
                <InlineEditField
                  value={fullCompanyData?.phone || mergedRecord?.phone || record?.phone || ''}
                  field="phone"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Contact & Market</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Email:</span>
                <InlineEditField
                  value={fullCompanyData?.email || mergedRecord?.email || record?.email || ''}
                  field="email"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  type="email"
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Fax:</span>
                <InlineEditField
                  value={fullCompanyData?.fax || mergedRecord?.fax || record?.fax || ''}
                  field="fax"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Website:</span>
                <InlineEditField
                  value={website || fullCompanyData?.website || companyData.website}
                  field="website"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={(message) => handleFieldSuccess('website', website || fullCompanyData?.website || companyData.website, message)}
                  type="text"
                  className="text-sm font-medium"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">LinkedIn:</span>
                <InlineEditField
                  value={linkedinUrl || fullCompanyData?.linkedinUrl || companyData.linkedin || ''}
                  field="linkedinUrl"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={(message) => handleFieldSuccess('linkedinUrl', linkedinUrl || fullCompanyData?.linkedinUrl || companyData.linkedin || '', message)}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">LinkedIn Navigator:</span>
                <InlineEditField
                  value={linkedinNavigatorUrl || fullCompanyData?.linkedinNavigatorUrl || mergedRecord?.linkedinNavigatorUrl || ''}
                  field="linkedinNavigatorUrl"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={(message) => handleFieldSuccess('linkedinNavigatorUrl', linkedinNavigatorUrl || fullCompanyData?.linkedinNavigatorUrl || mergedRecord?.linkedinNavigatorUrl || '', message)}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Market:</span>
                <DisplayValue value={fullCompanyData?.industry || mergedRecord?.industry || record?.industry} />
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Category:</span>
                <span className="text-sm font-medium text-foreground">
                  {(() => {
                    // AI-powered market category determination
                    const industry = (fullCompanyData?.industry || mergedRecord?.industry || record?.industry)?.toLowerCase() || '';
                    const naicsCodes = fullCompanyData?.naicsCodes || mergedRecord?.naicsCodes || record?.naicsCodes || [];
                    const sicCodes = fullCompanyData?.sicCodes || mergedRecord?.sicCodes || record?.sicCodes || [];
                    const description = (fullCompanyData?.description || mergedRecord?.description || record?.description)?.toLowerCase() || '';
                    const technologies = fullCompanyData?.technologiesUsed || mergedRecord?.technologiesUsed || record?.technologiesUsed || [];
                    
                    // Determine market category based on industry and codes
                    if (industry.includes('utility') || naicsCodes.includes('61') || sicCodes.includes('49')) {
                      return 'Energy & Utilities';
                    } else if (industry.includes('telecommunications') || industry.includes('technology')) {
                      return 'Technology & Communications';
                    } else if (industry.includes('construction') || industry.includes('engineering')) {
                      return 'Infrastructure & Construction';
                    } else if (industry.includes('healthcare') || industry.includes('medical')) {
                      return 'Healthcare & Life Sciences';
                    } else if (industry.includes('financial') || industry.includes('banking')) {
                      return 'Financial Services';
                    } else if (industry.includes('retail') || industry.includes('consumer')) {
                      return 'Consumer & Retail';
                    } else if (industry.includes('manufacturing') || industry.includes('industrial')) {
                      return 'Manufacturing & Industrial';
                    } else {
                      return 'Professional Services';
                    }
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Segment:</span>
                <span className="text-sm font-medium text-foreground">
                  {(() => {
                    // AI-powered market segment determination
                    const industry = (fullCompanyData?.industry || mergedRecord?.industry || record?.industry)?.toLowerCase() || '';
                    const employeeCount = fullCompanyData?.employeeCount || mergedRecord?.employeeCount || record?.employeeCount || 0;
                    const technologies = fullCompanyData?.technologiesUsed || mergedRecord?.technologiesUsed || record?.technologiesUsed || [];
                    const description = (fullCompanyData?.description || mergedRecord?.description || record?.description)?.toLowerCase() || '';
                    const isPublic = fullCompanyData?.isPublic ?? mergedRecord?.isPublic ?? record?.isPublic;
                    
                    // Determine market segment based on company characteristics
                    if (industry.includes('utility') || industry.includes('utilities')) {
                      if (employeeCount > 10000) {
                        return 'Large Regional Utilities';
                      } else if (employeeCount > 1000) {
                        return 'Mid-Market Utilities';
                      } else {
                        return 'Small Utilities & Co-ops';
                      }
                    } else if (industry.includes('telecommunications')) {
                      if (technologies.length > 200) {
                        return 'Enterprise Telecom';
                      } else {
                        return 'Mid-Market Telecom';
                      }
                    } else if (industry.includes('technology')) {
                      if (isPublic || employeeCount > 5000) {
                        return 'Enterprise Technology';
                      } else {
                        return 'Mid-Market Technology';
                      }
                    } else if (industry.includes('construction') || industry.includes('engineering')) {
                      if (employeeCount > 5000) {
                        return 'Large Infrastructure';
                      } else {
                        return 'Mid-Market Construction';
                      }
                    } else {
                      // Generic segmentation based on size
                      if (employeeCount > 10000) {
                        return 'Enterprise';
                      } else if (employeeCount > 1000) {
                        return 'Mid-Market';
                      } else {
                        return 'Small Business';
                      }
                    }
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Information - Headquarters */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">Headquarters Location</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Headquarters Address */}
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Address Details</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Street:</span>
                <InlineEditField
                  value={fullCompanyData?.hqStreet || fullCompanyData?.address || mergedRecord?.hqStreet || mergedRecord?.address || ''}
                  field="hqStreet"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">City:</span>
                <InlineEditField
                  value={fullCompanyData?.hqCity || fullCompanyData?.city || mergedRecord?.hqCity || city || mergedRecord?.city || ''}
                  field="hqCity"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">State:</span>
                <InlineEditField
                  value={fullCompanyData?.hqState || fullCompanyData?.state || mergedRecord?.hqState || state || mergedRecord?.state || ''}
                  field="hqState"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Zipcode:</span>
                <InlineEditField
                  value={fullCompanyData?.hqZipcode || fullCompanyData?.postalCode || mergedRecord?.hqZipcode || mergedRecord?.postalCode || ''}
                  field="hqZipcode"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Country:</span>
                <InlineEditField
                  value={fullCompanyData?.country || mergedRecord?.country || ''}
                  field="country"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Full Address */}
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Full Address</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Full Address:</span>
                <InlineEditField
                  value={fullCompanyData?.hqFullAddress || mergedRecord?.hqFullAddress || ''}
                  field="hqFullAddress"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  type="textarea"
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Location:</span>
                <InlineEditField
                  value={fullCompanyData?.hqLocation || mergedRecord?.hqLocation || ''}
                  field="hqLocation"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Profile */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">Business Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Business Details */}
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Business Details</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Industry:</span>
                <InlineEditField
                  value={fullCompanyData?.industry || mergedRecord?.industry || record?.industry || ''}
                  field="industry"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Target Industry:</span>
                <InlineEditField
                  value={fullCompanyData?.customFields?.targetIndustry || mergedRecord?.customFields?.targetIndustry || record?.customFields?.targetIndustry || ''}
                  field="targetIndustry"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                  placeholder="e.g., Title Companies, Healthcare Providers"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Sector:</span>
                <InlineEditField
                  value={fullCompanyData?.sector || mergedRecord?.sector || record?.sector || ''}
                  field="sector"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Revenue:</span>
                <InlineEditField
                  value={(fullCompanyData?.revenue || mergedRecord?.revenue || record?.revenue) ? (fullCompanyData?.revenue || mergedRecord?.revenue || record?.revenue).toString() : ''}
                  field="revenue"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  type="number"
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Currency:</span>
                <InlineEditField
                  value={fullCompanyData?.currency || mergedRecord?.currency || record?.currency || ''}
                  field="currency"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Founded:</span>
                <InlineEditField
                  value={(fullCompanyData?.foundedYear || mergedRecord?.foundedYear || record?.foundedYear) ? (fullCompanyData?.foundedYear || mergedRecord?.foundedYear || record?.foundedYear).toString() : ''}
                  field="foundedYear"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  type="number"
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Employees:</span>
                <InlineEditField
                  value={(fullCompanyData?.employeeCount || mergedRecord?.employeeCount || record?.employeeCount) ? (fullCompanyData?.employeeCount || mergedRecord?.employeeCount || record?.employeeCount).toString() : ''}
                  field="employeeCount"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  type="number"
                  className="text-sm font-medium text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Legal & Registration */}
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Legal & Registration</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Domain:</span>
                <InlineEditField
                  value={fullCompanyData?.domain || mergedRecord?.domain || record?.domain || ''}
                  field="domain"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Reg Number:</span>
                <InlineEditField
                  value={fullCompanyData?.registrationNumber || mergedRecord?.registrationNumber || record?.registrationNumber || ''}
                  field="registrationNumber"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Tax ID:</span>
                <InlineEditField
                  value={fullCompanyData?.taxId || mergedRecord?.taxId || record?.taxId || ''}
                  field="taxId"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">VAT Number:</span>
                <InlineEditField
                  value={fullCompanyData?.vatNumber || mergedRecord?.vatNumber || record?.vatNumber || ''}
                  field="vatNumber"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Logo URL:</span>
                <InlineEditField
                  value={formatEmptyValue(fullCompanyData?.logoUrl || mergedRecord?.logoUrl || record?.logoUrl)}
                  field="logoUrl"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Media & Online Presence */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">Social Media & Online Presence</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Social URLs */}
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Social Media URLs</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">LinkedIn:</span>
                <InlineEditField
                  value={formatEmptyValue(fullCompanyData?.linkedinUrl || mergedRecord?.linkedinUrl || record?.linkedinUrl)}
                  field="linkedinUrl"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">LinkedIn Navigator:</span>
                <InlineEditField
                  value={formatEmptyValue(fullCompanyData?.linkedinNavigatorUrl || mergedRecord?.linkedinNavigatorUrl || record?.linkedinNavigatorUrl)}
                  field="linkedinNavigatorUrl"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Twitter:</span>
                <InlineEditField
                  value={formatEmptyValue(fullCompanyData?.twitterUrl || mergedRecord?.twitterUrl || record?.twitterUrl)}
                  field="twitterUrl"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Facebook:</span>
                <InlineEditField
                  value={formatEmptyValue(fullCompanyData?.facebookUrl || mergedRecord?.facebookUrl || record?.facebookUrl)}
                  field="facebookUrl"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Instagram:</span>
                <InlineEditField
                  value={formatEmptyValue(fullCompanyData?.instagramUrl || mergedRecord?.instagramUrl || record?.instagramUrl)}
                  field="instagramUrl"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">GitHub:</span>
                <InlineEditField
                  value={formatEmptyValue(fullCompanyData?.githubUrl || mergedRecord?.githubUrl || record?.githubUrl)}
                  field="githubUrl"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">YouTube:</span>
                <InlineEditField
                  value={formatEmptyValue(fullCompanyData?.youtubeUrl || mergedRecord?.youtubeUrl || record?.youtubeUrl)}
                  field="youtubeUrl"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Follower Counts */}
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Follower Counts</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">LinkedIn:</span>
                <InlineEditField
                  value={(fullCompanyData?.linkedinFollowers || mergedRecord?.linkedinFollowers || record?.linkedinFollowers) ? (fullCompanyData?.linkedinFollowers || mergedRecord?.linkedinFollowers || record?.linkedinFollowers).toString() : ''}
                  field="linkedinFollowers"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  type="number"
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Twitter:</span>
                <InlineEditField
                  value={(fullCompanyData?.twitterFollowers || mergedRecord?.twitterFollowers || record?.twitterFollowers) ? (fullCompanyData?.twitterFollowers || mergedRecord?.twitterFollowers || record?.twitterFollowers).toString() : ''}
                  field="twitterFollowers"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  type="number"
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Job Postings:</span>
                <InlineEditField
                  value={(fullCompanyData?.activeJobPostings || mergedRecord?.activeJobPostings || record?.activeJobPostings) ? (fullCompanyData?.activeJobPostings || mergedRecord?.activeJobPostings || record?.activeJobPostings).toString() : ''}
                  field="activeJobPostings"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  type="number"
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Tech Count:</span>
                <InlineEditField
                  value={(fullCompanyData?.numTechnologiesUsed || mergedRecord?.numTechnologiesUsed || record?.numTechnologiesUsed) ? (fullCompanyData?.numTechnologiesUsed || mergedRecord?.numTechnologiesUsed || record?.numTechnologiesUsed).toString() : ''}
                  field="numTechnologiesUsed"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  type="number"
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Digital Maturity:</span>
                <InlineEditField
                  value={(fullCompanyData?.digitalMaturity || mergedRecord?.digitalMaturity || record?.digitalMaturity) ? (fullCompanyData?.digitalMaturity || mergedRecord?.digitalMaturity || record?.digitalMaturity).toString() : ''}
                  field="digitalMaturity"
                  onSave={onSave}
                  recordId={companyId || record.id}
                  recordType={companyId ? 'companies' : recordType}
                  onSuccess={handleSuccess}
                  type="number"
                  className="text-sm font-medium text-foreground"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seller Intelligence - Key Metrics */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">Seller Intelligence</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Technology Stack</h4>
            <div className="text-2xl font-bold text-green-600">{record?.technologiesUsed?.length || 0}</div>
            <div className="text-xs text-muted mt-1">Systems in use</div>
            <div className="text-xs text-muted mt-1">Complexity indicator</div>
          </div>
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Hiring Activity</h4>
            <div className="text-2xl font-bold text-purple-600">{record?.activeJobPostings || 0}</div>
            <div className="text-xs text-muted mt-1">Active job postings</div>
            <div className="text-xs text-muted mt-1">Growth indicator</div>
          </div>
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Social Reach</h4>
            <div className="text-2xl font-bold text-blue-600">
              {record?.linkedinFollowers ? `${(record.linkedinFollowers / 1000).toFixed(0)}K` : '-'}
            </div>
            <div className="text-xs text-muted mt-1">LinkedIn followers</div>
            <div className="text-xs text-muted mt-1">Brand strength</div>
          </div>
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Competitive Landscape</h4>
            <div className="text-2xl font-bold text-orange-600">{record?.competitors?.length || 0}</div>
            <div className="text-xs text-muted mt-1">Competitors identified</div>
            <div className="text-xs text-muted mt-1">Market positioning</div>
          </div>
        </div>
      </div>

      {/* Strategic Seller Insights */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">Strategic Seller Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Technology Complexity</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted">Total Technologies:</span>
                <span className="text-sm font-medium text-foreground">{record?.technologiesUsed?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Integration Complexity:</span>
                <span className="text-sm font-medium text-foreground">
                  {(record?.technologiesUsed?.length || 0) > 200 ? 'High' : (record?.technologiesUsed?.length || 0) > 50 ? 'Medium' : 'Low'}
                </span>
              </div>
              <div className="text-xs text-muted mt-2">
                {(record?.technologiesUsed?.length || 0) > 200 ? 'Complex integration challenges - TOP\'s expertise valuable' : 
                 (record?.technologiesUsed?.length || 0) > 50 ? 'Moderate complexity - strategic planning needed' : 
                 'Simple stack - focus on efficiency gains'}
              </div>
            </div>
          </div>
          
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Market Position</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted">Company Type:</span>
                <span className="text-sm font-medium text-foreground">
                  {record?.isPublic ? 'Public Company' : 'Private Company'}
                  {record?.stockSymbol && ` (${record.stockSymbol})`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Competitive Pressure:</span>
                <span className="text-sm font-medium text-foreground">
                  {(record?.competitors?.length || 0) > 15 ? 'High' : (record?.competitors?.length || 0) > 5 ? 'Medium' : 'Low'}
                </span>
              </div>
              <div className="text-xs text-muted mt-2">
                {(record?.competitors?.length || 0) > 15 ? 'Highly competitive market - differentiation key' : 
                 (record?.competitors?.length || 0) > 5 ? 'Moderate competition - value proposition important' : 
                 'Less competitive - relationship building crucial'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Position & Metadata */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">Market Position & Metadata</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Market Position */}
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Market Position</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Market Position:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.marketPosition)}
                  field="marketPosition"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Stock Symbol:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.stockSymbol)}
                  field="stockSymbol"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Public Company:</span>
                <InlineEditField
                  value={record?.isPublic !== undefined ? (record.isPublic ? 'Yes' : 'No') : ''}
                  field="isPublic"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  inputType="select"
                  options={[
                    { value: 'true', label: 'Yes' },
                    { value: 'false', label: 'No' }
                  ]}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Key Influencers:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.keyInfluencers)}
                  field="keyInfluencers"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Status & Priority */}
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Status & Priority</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Status:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.status)}
                  field="status"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  inputType="select"
                  options={[
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'INACTIVE', label: 'Inactive' },
                    { value: 'PROSPECT', label: 'Prospect' },
                    { value: 'CUSTOMER', label: 'Customer' }
                  ]}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Priority:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.priority)}
                  field="priority"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  inputType="select"
                  options={[
                    { value: 'HIGH', label: 'High' },
                    { value: 'MEDIUM', label: 'Medium' },
                    { value: 'LOW', label: 'Low' }
                  ]}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Tags:</span>
                <InlineEditField
                  value={record?.tags ? record.tags.join(', ') : ''}
                  field="tags"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                  placeholder="Enter tags separated by commas"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Notes:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.notes)}
                  field="notes"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="textarea"
                  className="text-sm font-medium text-foreground"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Company Activity */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Company Activity</h3>
        <div className="bg-background p-4 rounded-lg border border-border">
          <div className="space-y-3">
            {recentActivity.map((activity: any, index: number) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`w-3 h-3 rounded-full mt-1 ${
                  activity.color === 'blue' ? 'bg-primary' :
                  activity.color === 'green' ? 'bg-success' :
                  activity.color === 'purple' ? 'bg-info' :
                  'bg-warning'
                }`}></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">
                    {activity.type} from {activity.contact}
                  </div>
                  <div className="text-xs text-muted">
                    {activity.time} • {activity.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Tracking & Funding */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">Action Tracking & Funding</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Action Tracking */}
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Action Tracking</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Last Action:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.lastAction)}
                  field="lastAction"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Last Action Date:</span>
                <InlineEditField
                  value={record?.lastActionDate ? new Date(record.lastActionDate).toISOString().split('T')[0] : ''}
                  field="lastActionDate"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  variant="date"
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Next Action:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.nextAction)}
                  field="nextAction"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Next Action Date:</span>
                <InlineEditField
                  value={record?.nextActionDate ? new Date(record.nextActionDate).toISOString().split('T')[0] : ''}
                  field="nextActionDate"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  variant="date"
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Action Status:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.actionStatus)}
                  field="actionStatus"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Next Action Type:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.nextActionType)}
                  field="nextActionType"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Funding & Financial */}
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Funding & Financial</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Last Funding:</span>
                <InlineEditField
                  value={record?.lastFundingAmount ? record.lastFundingAmount.toString() : ''}
                  field="lastFundingAmount"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="number"
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Funding Date:</span>
                <InlineEditField
                  value={record?.lastFundingDate ? new Date(record.lastFundingDate).toISOString().split('T')[0] : ''}
                  field="lastFundingDate"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  variant="date"
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Opportunity Amount:</span>
                <InlineEditField
                  value={record?.opportunityAmount ? record.opportunityAmount.toString() : ''}
                  field="opportunityAmount"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="number"
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Opportunity Probability:</span>
                <InlineEditField
                  value={record?.opportunityProbability ? record.opportunityProbability.toString() : ''}
                  field="opportunityProbability"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="number"
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Opportunity Stage:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.opportunityStage)}
                  field="opportunityStage"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Decision Timeline:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.decisionTimeline)}
                  field="decisionTimeline"
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

      {/* Parent Company & Strategy */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">Parent Company & Strategy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Parent Company */}
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Parent Company</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Parent Name:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.parentCompanyName)}
                  field="parentCompanyName"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Parent Domain:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.parentCompanyDomain)}
                  field="parentCompanyDomain"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Business Challenges:</span>
                <InlineEditField
                  value={record?.businessChallenges ? record.businessChallenges.join(', ') : ''}
                  field="businessChallenges"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="textarea"
                  className="text-sm font-medium text-foreground"
                  placeholder="Enter challenges separated by commas"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Business Priorities:</span>
                <InlineEditField
                  value={record?.businessPriorities ? record.businessPriorities.join(', ') : ''}
                  field="businessPriorities"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="textarea"
                  className="text-sm font-medium text-foreground"
                  placeholder="Enter priorities separated by commas"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Strategy & Competitive */}
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Strategy & Competitive</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Competitive Advantages:</span>
                <InlineEditField
                  value={record?.competitiveAdvantages ? record.competitiveAdvantages.join(', ') : ''}
                  field="competitiveAdvantages"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="textarea"
                  className="text-sm font-medium text-foreground"
                  placeholder="Enter advantages separated by commas"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Strategic Initiatives:</span>
                <InlineEditField
                  value={record?.strategicInitiatives ? record.strategicInitiatives.join(', ') : ''}
                  field="strategicInitiatives"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="textarea"
                  className="text-sm font-medium text-foreground"
                  placeholder="Enter initiatives separated by commas"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Growth Opportunities:</span>
                <InlineEditField
                  value={record?.growthOpportunities ? record.growthOpportunities.join(', ') : ''}
                  field="growthOpportunities"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="textarea"
                  className="text-sm font-medium text-foreground"
                  placeholder="Enter opportunities separated by commas"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Success Metrics:</span>
                <InlineEditField
                  value={record?.successMetrics ? record.successMetrics.join(', ') : ''}
                  field="successMetrics"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="textarea"
                  className="text-sm font-medium text-foreground"
                  placeholder="Enter metrics separated by commas"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Classification Codes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">Classification Codes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Industry Codes */}
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Industry Codes</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">NAICS Codes:</span>
                <InlineEditField
                  value={record?.naicsCodes ? record.naicsCodes.join(', ') : ''}
                  field="naicsCodes"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                  placeholder="Enter NAICS codes separated by commas"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">SIC Codes:</span>
                <InlineEditField
                  value={record?.sicCodes ? record.sicCodes.join(', ') : ''}
                  field="sicCodes"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                  placeholder="Enter SIC codes separated by commas"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Sources:</span>
                <InlineEditField
                  value={record?.sources ? record.sources.join(', ') : ''}
                  field="sources"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                  placeholder="Enter sources separated by commas"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Competitors:</span>
                <InlineEditField
                  value={record?.competitors ? record.competitors.join(', ') : ''}
                  field="competitors"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="textarea"
                  className="text-sm font-medium text-foreground"
                  placeholder="Enter competitors separated by commas"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Technology & Additional */}
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Technology & Additional</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Tech Stack:</span>
                <InlineEditField
                  value={record?.techStack ? record.techStack.join(', ') : ''}
                  field="techStack"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="textarea"
                  className="text-sm font-medium text-foreground"
                  placeholder="Enter technologies separated by commas"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Technologies Used:</span>
                <InlineEditField
                  value={record?.technologiesUsed ? record.technologiesUsed.join(', ') : ''}
                  field="technologiesUsed"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="textarea"
                  className="text-sm font-medium text-foreground"
                  placeholder="Enter technologies separated by commas"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">Market Threats:</span>
                <InlineEditField
                  value={record?.marketThreats ? record.marketThreats.join(', ') : ''}
                  field="marketThreats"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="textarea"
                  className="text-sm font-medium text-foreground"
                  placeholder="Enter threats separated by commas"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted w-24">HQ Region:</span>
                <InlineEditField
                  value={record?.hqRegion ? record.hqRegion.join(', ') : ''}
                  field="hqRegion"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-foreground"
                  placeholder="Enter regions separated by commas"
                />
              </div>
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