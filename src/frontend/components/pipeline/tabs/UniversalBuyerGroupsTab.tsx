"use client";

import React, { useState, useEffect, useRef } from 'react';
import { authFetch } from '@/platform/api-fetch';
import { BuildingOfficeIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { InlineEditField } from '../InlineEditField';
import { useRouter } from 'next/navigation';
import { safeSetItem, safeGetItem } from '@/platform/utils/storage/safeLocalStorage';
import { calculateRiskAssessment, getRiskPillStyles, generateRiskDescription, CareerData, RiskAssessment } from '@/platform/utils/riskAssessment';
import { generateSlug } from '@/platform/utils/url-utils';
import { BuyerGroupOptimizer } from '@/platform/services/buyer-group/buyer-group-optimizer';
import { getRoleLabel, getRoleColorClasses } from '@/platform/constants/buyer-group-roles';

interface UniversalBuyerGroupsTabProps {
  record: any;
  recordType: string;
  onSave?: (field: string, value: string) => Promise<void>;
}

interface BuyerGroupMember {
  id: string;
  name: string;
  title: string;
  email: string;
  phone?: string;
  role: string;
  buyerGroupStatus?: string;  // ADD THIS
  influence: string;
  isPrimary: boolean;
  company: string;
}

export function UniversalBuyerGroupsTab({ record, recordType, onSave }: UniversalBuyerGroupsTabProps) {
  const [buyerGroups, setBuyerGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // 🚨 CRITICAL FIX: Start with loading=true to prevent empty state flash
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [riskAssessments, setRiskAssessments] = useState<Record<string, RiskAssessment>>({});
  const [isFetching, setIsFetching] = useState(false); // Prevent multiple simultaneous fetches
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 🔧 FIX: Store fetched company name in state for cases where record.company is not loaded
  const [fetchedCompanyName, setFetchedCompanyName] = useState<string>('');
  const router = useRouter();
  
  // Track previous companyId, companyName, and recordId to detect changes and invalidate cache
  const previousCompanyIdRef = useRef<string | null>(null);
  const previousCompanyNameRef = useRef<string | null>(null);
  const previousRecordIdRef = useRef<string | null>(null);
  
  // 🔧 FIX: Store fetched companyId in state for cases where record.companyId is not loaded initially
  const [fetchedCompanyId, setFetchedCompanyId] = useState<string>('');
  
  // 🔧 SYNC TRACKING: Track if sync has been attempted for current companyId to prevent duplicate syncs
  const hasSyncedRef = useRef<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // 🚨 CRITICAL FIX: Extract companyId and companyName into memos to track changes properly
  // This ensures the effect re-runs when companyId/companyName become available
  const companyId = React.useMemo(() => {
    if (!record) return '';
    
    // Check if this is a company-only record (including opportunities which are companies)
    const isCompanyOnlyRecord = recordType === 'companies' ||
                               recordType === 'opportunities' ||
                               (recordType === 'speedrun' && record?.recordType === 'company') ||
                               (recordType === 'leads' && record?.isCompanyLead === true) ||
                               (recordType === 'prospects' && record?.isCompanyLead === true);
    
    if (isCompanyOnlyRecord) {
      // For company records, the record ID is the company ID
      const id = record.id || '';
      console.log('🔍 [BUYER GROUPS TAB] Using record.id as companyId for company record:', id);
      return id;
    } else {
      // For person records (people, leads, prospects that are NOT company leads), get company from companyId field
      // 🔧 FIX: Prioritize record.companyId (direct field) over company relation to handle cases where
      // company relation is null but companyId field exists (common on initial load)
      // 🔧 FIX: Also check fetchedCompanyId as fallback if record.companyId is not available
      const id = record.companyId || 
                 fetchedCompanyId ||
                 (record?.company && typeof record.company === 'object' && record.company !== null ? record.company.id : null) ||
                 (typeof record?.company === 'string' ? record.company : null) ||
                 '';
      console.log('🔍 [BUYER GROUPS TAB] Extracted companyId for person record:', id, {
        recordType,
        hasCompanyId: !!record.companyId,
        companyIdValue: record.companyId,
        hasFetchedCompanyId: !!fetchedCompanyId,
        fetchedCompanyIdValue: fetchedCompanyId,
        hasCompanyObject: !!record?.company,
        companyObjectType: typeof record?.company,
        companyObjectId: record?.company && typeof record.company === 'object' ? record.company.id : null,
        isCompanyLead: record?.isCompanyLead
      });
      return id;
    }
  }, [record?.id, record?.companyId, record?.company, record?.isCompanyLead, recordType, fetchedCompanyId]);
  
  const companyName = React.useMemo(() => {
    if (!record) return '';
    
    // Check if this is a company-only record (including opportunities which are companies)
    const isCompanyOnlyRecord = recordType === 'companies' ||
                               recordType === 'opportunities' ||
                               (recordType === 'speedrun' && record?.recordType === 'company') ||
                               (recordType === 'leads' && record?.isCompanyLead === true) ||
                               (recordType === 'prospects' && record?.isCompanyLead === true);
    
    let name = '';
    if (isCompanyOnlyRecord) {
      // For company records, use the record name as company name
      name = record.name || 
             (typeof record.company === 'object' && record.company !== null ? record.company.name : record.company) || 
             record.companyName || '';
    } else {
      // For person records (people, leads, prospects that are NOT company leads), get company name from company object
      name = (typeof record.company === 'object' && record.company !== null ? record.company.name : record.company) || 
             record.companyName || '';
    }
    
    // 🔧 FIX: Use fetched company name as fallback if record doesn't have company name
    return name || fetchedCompanyName;
  }, [record?.id, record?.name, record?.company, record?.companyName, record?.isCompanyLead, recordType, fetchedCompanyName]);

  // Handle person click navigation
  const handlePersonClick = (person: any) => {
    console.log('🔗 [BUYER GROUPS] Navigating to person:', person);
    
    // Generate proper slug with person's name
    const personName = person.name || person.fullName || 'person';
    const personSlug = generateSlug(personName, person.id);
    
    // Get current workspace from URL
    const currentPath = window.location.pathname;
    const workspaceMatch = currentPath.match(/^\/([^\/]+)\//);
    
    if (workspaceMatch) {
      const workspaceSlug = workspaceMatch[1];
      
      // Navigate to appropriate pipeline record based on person status
      let personUrl: string;
      const status = person.status;
      
      switch (status) {
        case 'LEAD':
          personUrl = `/${workspaceSlug}/leads/${personSlug}`;
          break;
        case 'PROSPECT':
          personUrl = `/${workspaceSlug}/prospects/${personSlug}`;
          break;
        case 'OPPORTUNITY':
          // For OPPORTUNITY status, navigate to the company's opportunity record
          // Get company information from the record prop
          let companyName = '';
          let companyId = '';
          
          // Check if this is a company-only record
          const isCompanyOnlyRecord = recordType === 'companies' ||
                                     (recordType === 'speedrun' && record?.recordType === 'company') ||
                                     (recordType === 'leads' && record?.isCompanyLead === true) ||
                                     (recordType === 'prospects' && record?.isCompanyLead === true);
          
          if (isCompanyOnlyRecord) {
            // For company records, use the record name as company name
            companyName = record.name || 
                         (typeof record.company === 'object' && record.company !== null ? record.company.name : record.company) || 
                         record.companyName ||
                         'Company';
            companyId = record.id; // For company records, the record ID is the company ID
          } else {
            // For person records (people, leads, prospects that are NOT company leads), get company from companyId or company object
            companyId = record.companyId || 
                       record?.company?.id || 
                       (typeof record?.company === 'object' && record?.company?.id) ||
                       '';
            companyName = (typeof record.company === 'object' && record.company !== null ? record.company.name : record.company) || 
                         record.companyName || 'Company';
          }
          
          // Generate company slug for opportunity navigation
          const companySlug = generateSlug(companyName, companyId);
          personUrl = `/${workspaceSlug}/opportunities/${companySlug}`;
          console.log(`🔗 [BUYER GROUPS] OPPORTUNITY person - navigating to company opportunity: ${companyName} (${companyId})`);
          break;
        default:
          // CLIENT, SUPERFAN, or any other status
          personUrl = `/${workspaceSlug}/people/${personSlug}`;
          break;
      }
      
      console.log(`🔗 [BUYER GROUPS] Navigating to ${status} record: ${personUrl}`);
      router.push(personUrl);
    } else {
      // Fallback to non-workspace URL
      const personUrl = `/people/${personSlug}`;
      console.log(`🔗 [BUYER GROUPS] Navigating to: ${personUrl}`);
      router.push(personUrl);
    }
  };

  // Calculate risk assessment for a person
  const calculatePersonRisk = (person: any): RiskAssessment => {
    // Use real career data from CoreSignal profile
    const coresignalData = person?.customFields?.coresignal || person?.customFields?.coresignalData || {};
    const experience = coresignalData.experience || [];
    
    // Extract real career data from CoreSignal experience
    const currentRole = experience.find((exp: any) => exp.active_experience === 1) || experience[0];
    const previousRoles = experience
      .filter((exp: any) => !exp.active_experience)
      .map((exp: any) => ({
        title: exp.position_title || exp.title || 'Unknown Role',
        startDate: exp.start_date || exp.startDate || 'Unknown',
        endDate: exp.end_date || exp.endDate || 'Unknown',
        duration: exp.duration_months || 0
      }));

    const careerData: CareerData = {
      currentRoleStartDate: currentRole?.start_date || currentRole?.startDate || person.currentRoleStartDate || null,
      previousRoles: previousRoles.length > 0 ? previousRoles : person.previousRoles || [],
      totalCareerDuration: coresignalData.total_experience_duration_months || person.totalCareerDuration || 0,
      averageRoleDuration: coresignalData.average_role_duration_months || person.averageRoleDuration || 0
    };

    return calculateRiskAssessment(careerData);
  };

  // Calculate risk assessments when buyer groups change
  useEffect(() => {
    if (buyerGroups.length > 0) {
      const assessments: Record<string, RiskAssessment> = {};
      buyerGroups.forEach(person => {
        assessments[person.id] = calculatePersonRisk(person);
      });
      setRiskAssessments(assessments);
    }
  }, [buyerGroups]);

  // 🔧 SYNC FUNCTION: Proactively sync buyer group data when companyId becomes available
  // This ensures buyer group roles are assigned even if API initially returns 0 results
  const syncBuyerGroupData = React.useCallback(async (companyIdToSync: string, signal: AbortSignal): Promise<boolean> => {
    // Check if we've already synced for this companyId
    if (hasSyncedRef.current === companyIdToSync) {
      console.log('🔄 [BUYER GROUPS SYNC] Already synced for companyId:', companyIdToSync);
      return false;
    }

    // Check if sync was aborted
    if (signal.aborted) {
      console.log('🚫 [BUYER GROUPS SYNC] Sync aborted');
      return false;
    }

    console.log('🔄 [BUYER GROUPS SYNC] Starting sync for companyId:', companyIdToSync);
    setIsSyncing(true);
    hasSyncedRef.current = companyIdToSync;

    try {
      const syncResponse = await authFetch(`/api/v1/companies/${companyIdToSync}/sync-buyer-group`, {
        method: 'POST'
      });

      // Check if sync was aborted after API call
      if (signal.aborted) {
        console.log('🚫 [BUYER GROUPS SYNC] Sync aborted after API call');
        setIsSyncing(false);
        return false;
      }

      if (syncResponse && syncResponse.success) {
        console.log('✅ [BUYER GROUPS SYNC] Sync completed:', {
          synced: syncResponse.synced,
          updated: syncResponse.updated,
          errors: syncResponse.errors
        });
        setIsSyncing(false);
        return syncResponse.updated > 0; // Return true if any records were updated
      } else {
        console.warn('⚠️ [BUYER GROUPS SYNC] Sync failed or returned no success:', syncResponse);
        setIsSyncing(false);
        return false;
      }
    } catch (error) {
      console.warn('⚠️ [BUYER GROUPS SYNC] Failed to sync company buyer group data:', error);
      setIsSyncing(false);
      return false;
    }
  }, []);

  useEffect(() => {
    // 🚨 CRITICAL: Use an abort controller to cancel stale fetches when record changes
    const abortController = new AbortController();
    const signal = abortController.signal;
    
    // 🚨 CRITICAL FIX: Check if record ID is available - if not, show loading and wait
    if (!record?.id) {
      console.log('🔍 [BUYER GROUPS DEBUG] No record ID, showing loading while waiting for record');
      setBuyerGroups([]);
      setLoading(true); // 🚨 CRITICAL FIX: Show loading while waiting for record
      setIsFetching(false);
      previousRecordIdRef.current = null;
      previousCompanyIdRef.current = null;
      previousCompanyNameRef.current = null;
      // 🔧 FIX: Clear fetched company name and companyId when record is not available
      setFetchedCompanyName('');
      setFetchedCompanyId('');
      return;
    }
    
    // 🚨 CRITICAL FIX: Check if companyId is available - if not, try to fetch it from API
    // 🔧 FIX: This check ensures we wait for companyId to become available when record prop updates
    // The effect will re-run when companyId changes from empty to a value (due to dependency on line 959)
    if (!companyId || companyId.trim() === '') {
      console.log('⚠️ [BUYER GROUPS] No valid companyId found, attempting to fetch from API:', {
        recordType,
        recordId: record?.id,
        recordName: record?.name || record?.fullName,
        hasCompanyId: !!record?.companyId,
        companyIdValue: record?.companyId,
        hasCompanyRelation: !!record?.company,
        companyRelationType: typeof record?.company,
        companyRelationId: record?.company && typeof record.company === 'object' ? record.company.id : null
      });
      
      // 🔧 FIX: Try to fetch companyId from API if missing from record
      // This handles cases where the record loads without companyId initially
      // Only fetch if we haven't already fetched for this record ID (prevents duplicate fetches)
      // Check previousRecordIdRef to ensure we're on a new record, not just a re-render
      const isNewRecord = previousRecordIdRef.current === null || previousRecordIdRef.current !== record.id;
      if (record?.id && !fetchedCompanyId && isNewRecord) {
        // Set ref immediately to prevent duplicate fetches if effect runs again before API completes
        previousRecordIdRef.current = record.id;
        
        const fetchCompanyIdFromAPI = async () => {
          try {
            console.log('🔍 [BUYER GROUPS] Fetching companyId from API for record:', record.id);
            const response = await authFetch(`/api/v1/people/${record.id}`);
            if (response && response.success && response.data) {
              const apiCompanyId = response.data.companyId || 
                                   (response.data.company && typeof response.data.company === 'object' ? response.data.company.id : null) ||
                                   (typeof response.data.company === 'string' ? response.data.company : null);
              
              if (apiCompanyId && apiCompanyId.trim() !== '') {
                console.log('✅ [BUYER GROUPS] Fetched companyId from API:', apiCompanyId);
                setFetchedCompanyId(apiCompanyId);
                
                // Also update fetchedCompanyName if company object is available
                if (response.data.company && typeof response.data.company === 'object' && response.data.company.name) {
                  setFetchedCompanyName(response.data.company.name);
                }
              } else {
                console.log('⚠️ [BUYER GROUPS] API response does not contain companyId');
              }
            }
          } catch (error) {
            console.warn('⚠️ [BUYER GROUPS] Failed to fetch companyId from API:', error);
            // Don't reset previousRecordIdRef on error - allow retry on next record change
          }
        };
        
        fetchCompanyIdFromAPI();
      }
      
      // Show loading while waiting for companyId to become available
      // When companyId becomes available, this effect will re-run and proceed with fetch
      setBuyerGroups([]);
      setLoading(true); // 🚨 CRITICAL FIX: Show loading while waiting for companyId
      setIsFetching(false);
      // 🔧 FIX: Clear previous refs to ensure fresh fetch when companyId becomes available
      previousRecordIdRef.current = record?.id || null;
      previousCompanyIdRef.current = null;
      previousCompanyNameRef.current = null;
      return;
    }
    
    // 🔧 FIX: Clear fetchedCompanyId if we now have companyId from record (to avoid stale state)
    if (fetchedCompanyId && record?.companyId) {
      console.log('🔄 [BUYER GROUPS] Clearing fetchedCompanyId since record.companyId is now available');
      setFetchedCompanyId('');
    }
    
    // 🔧 FIX: If companyId exists but companyName is missing, fetch company name
    // This handles cases where the company relation wasn't loaded initially
    if (companyId && (!companyName || companyName.trim() === '')) {
      console.log('🔍 [BUYER GROUPS] CompanyId exists but companyName is missing, fetching company name...');
      // Fetch company name asynchronously
      const fetchCompanyName = async () => {
        try {
          const response = await fetch(`/api/v1/companies/${companyId}`, {
            credentials: 'include'
          });
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data?.name) {
              console.log(`✅ [BUYER GROUPS] Fetched company name: ${result.data.name}`);
              // Update fetched company name state - this will trigger the companyName memo to update
              setFetchedCompanyName(result.data.name);
              // Don't return here - let the effect continue to fetch buyer groups
              // The effect will re-run when fetchedCompanyName updates
            }
          }
        } catch (error) {
          console.warn('⚠️ [BUYER GROUPS] Failed to fetch company name:', error);
          // Even if fetch fails, try to proceed with just companyId (some APIs might work with ID only)
          setFetchedCompanyName(''); // Clear any stale fetched name
        }
      };
      fetchCompanyName();
      // Show loading while fetching company name, but don't return - continue to try fetching buyer groups
      // The buyer groups API might work with just companyId
      setLoading(true);
    }
    
    // 🚨 STEP 1: SYNCHRONOUSLY check for company changes and clear state IMMEDIATELY (before any async work)
    const previousRecordId = previousRecordIdRef.current;
    const recordIdChanged = previousRecordId !== null && previousRecordId !== record?.id;
    
    const previousCompanyId = previousCompanyIdRef.current;
    const previousCompanyName = previousCompanyNameRef.current;
    const companyIdChanged = previousCompanyId !== null && previousCompanyId !== companyId;
    const companyNameChanged = previousCompanyName !== null && previousCompanyName !== companyName;
    
    // 🚨 CRITICAL: If company changed, clear state and cache IMMEDIATELY (synchronously, before async work)
    if (recordIdChanged || companyIdChanged || companyNameChanged) {
      console.log('🔄 [BUYER GROUPS] Company changed - clearing state immediately:', {
        previousRecordId,
        currentRecordId: record?.id,
        previousCompanyId,
        currentCompanyId: companyId,
        previousCompanyName,
        currentCompanyName: companyName
      });
      
      // Clear state IMMEDIATELY (synchronously, before any async operations)
      setBuyerGroups([]);
      setLoading(false);
      setIsFetching(false);
      setLastFetchTime(null);
      // 🔧 FIX: Clear fetched company name and companyId when record/company changes
      setFetchedCompanyName('');
      setFetchedCompanyId('');
      // 🔧 SYNC TRACKING: Reset sync tracking when company changes
      hasSyncedRef.current = null;
      
      // Clear cache for previous company (both ID and name-based keys)
      if (previousCompanyId || previousCompanyName) {
        const workspaceId = record?.workspaceId || '01K7DNYR5VZ7JY36KGKKN76XZ1';
        if (previousCompanyId) {
          const previousCacheKeyById = `buyer-groups-${previousCompanyId}-${workspaceId}`;
          localStorage.removeItem(previousCacheKeyById);
          safeGetItem(previousCacheKeyById, 0); // Force TTL expiration
          console.log('🗑️ [BUYER GROUPS] Cleared cache for previous company ID:', previousCacheKeyById);
        }
        if (previousCompanyName) {
          const previousCacheKeyByName = `buyer-groups-${previousCompanyName}-${workspaceId}`;
          localStorage.removeItem(previousCacheKeyByName);
          safeGetItem(previousCacheKeyByName, 0); // Force TTL expiration
          console.log('🗑️ [BUYER GROUPS] Cleared cache for previous company name:', previousCacheKeyByName);
        }
      }
      
      // Also clear current company cache to force fresh fetch
      if (companyId || companyName) {
        const workspaceId = record?.workspaceId || '01K7DNYR5VZ7JY36KGKKN76XZ1';
        if (companyId) {
          const currentCacheKeyById = `buyer-groups-${companyId}-${workspaceId}`;
          localStorage.removeItem(currentCacheKeyById);
          safeGetItem(currentCacheKeyById, 0); // Force TTL expiration
          console.log('🗑️ [BUYER GROUPS] Cleared current company cache (ID):', currentCacheKeyById);
        }
        if (companyName) {
          const currentCacheKeyByName = `buyer-groups-${companyName}-${workspaceId}`;
          localStorage.removeItem(currentCacheKeyByName);
          safeGetItem(currentCacheKeyByName, 0); // Force TTL expiration
          console.log('🗑️ [BUYER GROUPS] Cleared current company cache (name):', currentCacheKeyByName);
        }
      }
      
      // Update refs immediately
      previousRecordIdRef.current = record?.id || null;
      previousCompanyIdRef.current = companyId || null;
      previousCompanyNameRef.current = companyName || null;
    } else {
      // Update refs with current values if no change detected
      previousRecordIdRef.current = record?.id || null;
      previousCompanyIdRef.current = companyId || null;
      previousCompanyNameRef.current = companyName || null;
    }
    
    // 🔧 PROACTIVE SYNC: Trigger sync when companyId becomes available (before API call)
    // This ensures buyer group roles are assigned even if API initially returns 0 results
    if (companyId && companyId.trim() !== '' && hasSyncedRef.current !== companyId) {
      console.log('🔄 [BUYER GROUPS] Triggering proactive sync for companyId:', companyId);
      // Run sync in background - don't wait for it, but it will help populate data
      syncBuyerGroupData(companyId, signal).catch(error => {
        console.warn('⚠️ [BUYER GROUPS] Proactive sync failed:', error);
      });
    }
    
      // 🚨 STEP 2: Now proceed with async fetch (state is already cleared if company changed)
    const fetchBuyerGroups = async (retryAfterSync = false) => {
      console.log('🔍 [BUYER GROUPS DEBUG] Starting fetchBuyerGroups');
      console.log('🔍 [BUYER GROUPS DEBUG] Record ID:', record?.id);
      console.log('🔍 [BUYER GROUPS DEBUG] Company name:', companyName);
      console.log('🔍 [BUYER GROUPS DEBUG] Company ID:', companyId);
      
      // 🚫 PREVENT MULTIPLE FETCHES: Check if already fetching or recently fetched (unless record or company changed)
      // Skip this check if record/company changed to ensure fresh data
      if (!recordIdChanged && !companyIdChanged && !companyNameChanged) {
        if (isFetching || (lastFetchTime && Date.now() - lastFetchTime < 5000)) {
          console.log('🔍 [BUYER GROUPS DEBUG] Already fetching or recently fetched, skipping');
          return;
        }
      }
      
      // 🚀 FIX: Set loading state BEFORE any async operations to prevent empty state flash
      setIsFetching(true);
      setLoading(true);
      setLastFetchTime(Date.now());
      
      try {
        // ⚡ PERFORMANCE: Check if we already have people data in context
        // This avoids unnecessary API calls when data is already available
        const workspaceId = record.workspaceId || '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Use record's workspace or default to Notary Everyday
        
        console.log('🔍 [BUYER GROUPS DEBUG] Record type:', recordType);
        console.log('🔍 [BUYER GROUPS DEBUG] Company name:', companyName);
        console.log('🔍 [BUYER GROUPS DEBUG] Company ID:', companyId);
        console.log('🔍 [BUYER GROUPS DEBUG] Workspace ID:', workspaceId);
        
        // 🔍 DEFENSIVE CHECK: Ensure companyId is present before fetching
        // 🔧 FIX: companyName is optional - API can work with just companyId
        if (!companyId) {
          console.log('⚠️ [BUYER GROUPS] Missing companyId, cannot fetch buyer group data:', { companyId, companyName });
          setBuyerGroups([]);
          setLoading(false);
          setIsFetching(false);
          return;
        }
        
        // 🔧 FIX: If companyName is missing, log a warning but continue (API can work with just companyId)
        if (!companyName || companyName.trim() === '') {
          console.log('⚠️ [BUYER GROUPS] CompanyName is missing, but proceeding with companyId only:', { companyId });
          // Continue - the API endpoint uses companyId which is available
        }
        const userId = record.assignedUserId || ''; // Use record's assigned user
        
        const cacheKey = `people-${workspaceId}-${userId}`;
        const buyerGroupCacheKey = `buyer-groups-${companyId}-${workspaceId}`;
        let peopleData = [];
        
        // ⚡ PERFORMANCE: Check buyer group specific cache first (faster)
        // 🔍 DEFENSIVE CHECK: Only use cache if companyId is present (companyName is optional for cache lookup)
        if (companyId && !companyIdChanged && !companyNameChanged) {
          const buyerGroupCachedData = safeGetItem(buyerGroupCacheKey, 10 * 60 * 1000); // 10 minutes TTL for better performance
          if (buyerGroupCachedData && Array.isArray(buyerGroupCachedData) && buyerGroupCachedData.length > 0) {
            // 🔍 CACHE VALIDATION: Match by companyId (required), companyName (optional if missing)
            // If companyName is missing, only validate by companyId
            const cacheIsValid = companyName && companyName.trim() !== ''
              ? buyerGroupCachedData.every(member => 
                  (member.companyId === companyId) && (member.company === companyName)
                )
              : buyerGroupCachedData.every(member => 
                  member.companyId === companyId
                );
            
            if (cacheIsValid) {
              console.log('📦 [BUYER GROUPS] Using validated cached buyer group data for company:', companyName || 'Unknown', 'ID:', companyId);
              setBuyerGroups(buyerGroupCachedData);
              setLoading(false);
              setIsFetching(false);
              return;
            } else {
              console.log('⚠️ [BUYER GROUPS] Cache invalid for current company (ID or name mismatch), will fetch fresh data');
              // Clear invalid cache
              localStorage.removeItem(buyerGroupCacheKey);
            }
          }
        } else {
          console.log('🔍 [BUYER GROUPS] Skipping cache check - company changed or missing data:', { 
            companyId, 
            companyName, 
            companyIdChanged, 
            companyNameChanged 
          });
        }
        
        // 🚀 PRELOAD: Check for preloaded buyer group data using safeGetItem (respects TTL)
        // 🔍 DEFENSIVE CHECK: Only check preloaded data if companyId is present (companyName is optional)
        if (companyId && !companyIdChanged && !companyNameChanged) {
          const preloadedData = safeGetItem(`buyer-groups-${companyId}-${workspaceId}`, 5 * 60 * 1000); // Reduced from 10 to 5 minutes
          if (preloadedData && Array.isArray(preloadedData) && preloadedData.length > 0) {
            // 🔍 VALIDATION: Match by companyId (required), companyName (optional if missing)
            const preloadedIsValid = companyName && companyName.trim() !== ''
              ? preloadedData.every(member => 
                  (member.companyId === companyId) && (member.company === companyName)
                )
              : preloadedData.every(member => 
                  member.companyId === companyId
                );
            
            if (preloadedIsValid) {
              console.log('⚡ [BUYER GROUPS] Using validated preloaded buyer group data for company:', companyName || 'Unknown', 'ID:', companyId);
              setBuyerGroups(preloadedData);
              setLoading(false);
              setIsFetching(false);
              return;
            } else {
              console.log('⚠️ [BUYER GROUPS] Preloaded data invalid for current company (ID or name mismatch)');
              // Clear invalid preloaded data
              localStorage.removeItem(`buyer-groups-${companyId}-${workspaceId}`);
            }
          }
        }
        
        // Check general people cache
        const cachedData = safeGetItem(cacheKey, 2 * 60 * 1000); // 2 minutes TTL
        if (cachedData) {
          // 🚨 FIX: Filter cached people by companyId to prevent using people from wrong companies
          const filteredCachedData = cachedData.filter((person: any) => 
            person.companyId === companyId
          );
          if (filteredCachedData.length > 0) {
            peopleData = filteredCachedData;
            console.log(`📦 [BUYER GROUPS] Using cached people data (filtered to ${filteredCachedData.length} people for company ${companyId})`);
          } else {
            console.log('📦 [BUYER GROUPS] Cached people data exists but none match current companyId, will fetch fresh');
            peopleData = [];
          }
        }
        
        // Only fetch if no cache or cache is stale
        if (peopleData.length === 0) {
          // 🚨 Check if fetch was aborted before making API call
          if (signal.aborted) {
            console.log('🚫 [BUYER GROUPS] Fetch aborted, skipping API call');
            return;
          }
          
          console.log('🔍 [BUYER GROUPS] Fetching fresh buyer group data for company:', companyName, 'ID:', companyId);
          
          // 🚀 ULTRA-FAST: Use dedicated fast buyer group API with companyId (exact match, no fuzzy name matching)
          try {
            const apiUrl = `/api/data/buyer-groups/fast?companyId=${companyId}`;
            console.log('🔍 [BUYER GROUPS TAB] ========================================');
            console.log('🔍 [BUYER GROUPS TAB] Making API call to:', apiUrl);
            console.log('🔍 [BUYER GROUPS TAB] CompanyId being sent:', companyId);
            console.log('🔍 [BUYER GROUPS TAB] Company name:', companyName);
            console.log('🔍 [BUYER GROUPS TAB] Record type:', recordType);
            console.log('🔍 [BUYER GROUPS TAB] Record ID:', record?.id);
            const fastResult = await authFetch(apiUrl);
            
            // 🚨 Check if fetch was aborted after API call
            if (signal.aborted) {
              console.log('🚫 [BUYER GROUPS] Fetch aborted after API call, discarding results');
              return;
            }
            
            console.log('🔍 [BUYER GROUPS TAB] API response:', fastResult);
            console.log('🔍 [BUYER GROUPS TAB] API response success:', fastResult?.success);
            console.log('🔍 [BUYER GROUPS TAB] API response data length:', fastResult?.data?.length);
            console.log('🔍 [BUYER GROUPS TAB] ========================================');
            if (fastResult && fastResult.success && fastResult.data) {
              const members = fastResult.data;
              console.log('⚡ [BUYER GROUPS] Fast API returned:', members.length, 'members');
              console.log('⚡ [BUYER GROUPS] Performance:', fastResult.meta?.processingTime);
              console.log('⚡ [BUYER GROUPS] Members:', members);
              
              // 🚨 VALIDATION: Filter API response to only include members that match the current company
              // NOTE: This validation is now redundant since we use companyId exact matching, but kept as defense in depth
              const validatedMembers = members.filter((member: any) => {
                // Fast API should only return members with matching companyId, but validate anyway
                const memberCompanyMatches = 
                  (member.companyId && member.companyId === companyId) ||
                  (member.company && typeof member.company === 'string' && member.company === companyId);
                
                if (!memberCompanyMatches) {
                  console.warn('⚠️ [BUYER GROUPS] API returned member from wrong company, filtering out:', {
                    memberName: member.name,
                    memberCompany: member.company,
                    memberCompanyId: member.companyId,
                    expectedCompany: companyName,
                    expectedCompanyId: companyId
                  });
                }
                
                return memberCompanyMatches;
              });
              
              console.log(`🔍 [BUYER GROUPS] After validation: ${validatedMembers.length} members (was ${members.length})`);
              
              // 🔧 SYNC & RETRY: If API returned 0 results and we haven't synced yet, sync and retry
              if (validatedMembers.length === 0 && !retryAfterSync && companyId && hasSyncedRef.current !== companyId) {
                console.log('🔄 [BUYER GROUPS] API returned 0 results, triggering sync and retry...');
                const syncUpdated = await syncBuyerGroupData(companyId, signal);
                
                // Check if fetch was aborted after sync
                if (signal.aborted) {
                  console.log('🚫 [BUYER GROUPS] Fetch aborted after sync, discarding results');
                  return;
                }
                
                // If sync updated records, retry the API call
                if (syncUpdated) {
                  console.log('🔄 [BUYER GROUPS] Sync updated records, retrying API call...');
                  // Retry the fetch with retryAfterSync flag to prevent infinite loop
                  return fetchBuyerGroups(true);
                }
              }
              
              // Convert fast API response format to people format for compatibility
              // Fast API returns: { id, name, title, email, phone, linkedinUrl, role, buyerGroupStatus, influence, company }
              peopleData = validatedMembers.map((member: any) => ({
                id: member.id,
                fullName: member.name,
                firstName: member.name?.split(' ')[0] || '',
                lastName: member.name?.split(' ').slice(1).join(' ') || '',
                company: companyName, // Use current company name (fast API may return companyId in company field)
                companyId: companyId, // Always use current companyId
                jobTitle: member.title,
                email: member.email,
                phone: member.phone,
                linkedinUrl: member.linkedinUrl,
                buyerGroupRole: member.role,
                buyerGroupStatus: member.buyerGroupStatus, // Include buyer group status from fast API
                status: member.status // Include status if available
              }));
              
              // Cache the data immediately
              const essentialData = peopleData.map(person => ({
                id: person.id,
                fullName: person.fullName,
                firstName: person.firstName,
                lastName: person.lastName,
                company: person.company,
                companyId: person.companyId,
                jobTitle: person.jobTitle,
                email: person.email
              }));
              
              safeSetItem(cacheKey, essentialData);
              // console.log('📦 [BUYER GROUPS] Cached fast API data');
            } else {
              console.log('⚠️ [BUYER GROUPS] Fast API returned no data or failed:', fastResult);
            }
          } catch (fastError) {
            console.log('⚠️ [BUYER GROUPS] Fast API failed:', fastError);
            console.error('❌ [BUYER GROUPS] Error details:', {
              message: fastError.message,
              stack: fastError.stack,
              name: fastError.name
            });
          }
          
        }
        
        // 🚀 ULTRA-FAST: Fast API already returns filtered people, so use them directly
        const companyPeople = peopleData;
        
        // console.log(`⚡ [BUYER GROUPS] Using ${companyPeople.length} people from fast API for company ${companyName}`);

        // Remove duplicates based on person ID
        const uniqueCompanyPeople = companyPeople.filter((person: any, index: number, self: any[]) => 
          index === self.findIndex((p: any) => p.id === person.id)
        );
        
        // console.log(`🔍 [BUYER GROUPS] After deduplication: ${uniqueCompanyPeople.length} unique people (was ${companyPeople.length})`);
        
        // console.log(`🔍 [BUYER GROUPS] Filtered ${uniqueCompanyPeople.length} people for company ${companyName} (ID: ${companyId})`);
        // console.log(`🔍 [BUYER GROUPS] All people data:`, peopleData.slice(0, 3)); // Show first 3 people for debugging
        // console.log(`🔍 [BUYER GROUPS] Company name being searched: "${companyName}"`);
        // console.log(`🔍 [BUYER GROUPS] Record ID: "${record.id}"`);
        // console.log(`🔍 [BUYER GROUPS] Workspace ID: "${workspaceId}"`);
        // console.log(`🔍 [BUYER GROUPS] User ID: "${userId}"`);
        // console.log(`🔍 [BUYER GROUPS] Total people fetched: ${peopleData.length}`);
        
        // Debug: Show all people with their company IDs
        // peopleData.forEach((person, index) => {
        //   console.log(`🔍 [BUYER GROUPS] Person ${index + 1}: ${person.fullName}, Company ID: ${person.companyId}, Company Name: ${person.company?.name || person.company}`);
        // });

        // 🚨 Check if fetch was aborted before processing empty state
        if (signal.aborted) {
          console.log('🚫 [BUYER GROUPS] Fetch aborted before processing empty state');
          return;
        }
        
        // If no people found, show empty state (no hardcoded fallbacks)
        if (uniqueCompanyPeople.length === 0) {
          // 🚨 Validate we're still on the same company before setting empty state
          const currentRecordId = previousRecordIdRef.current;
          const currentCompanyId = previousCompanyIdRef.current;
          const currentCompanyName = previousCompanyNameRef.current;
          
          if (currentRecordId !== record?.id || currentCompanyId !== companyId || currentCompanyName !== companyName) {
            console.log('🚫 [BUYER GROUPS] Company changed, discarding empty state');
            return;
          }
          
          console.log('🔍 [BUYER GROUPS] No people found in database for this company:', companyName, 'ID:', companyId);
          console.log('🔍 [BUYER GROUPS] peopleData length:', peopleData.length);
          setBuyerGroups([]);
          setLoading(false);
          setIsFetching(false);
          return;
        }

        // Define buyer group role function
        const getBuyerGroupRole = (jobTitle: string) => {
          if (!jobTitle) return 'Stakeholder';
          
          const title = jobTitle.toLowerCase();
          
          // Decision makers
          if (title.includes('ceo') || title.includes('president') || title.includes('founder') || title.includes('owner')) {
            return 'Decision Maker';
          }
          if (title.includes('vp') || title.includes('vice president') || title.includes('director') || title.includes('head of')) {
            return 'Decision Maker';
          }
          if (title.includes('cfo') || title.includes('cto') || title.includes('cmo') || title.includes('coo')) {
            return 'Decision Maker';
          }
          
          // Champions
          if (title.includes('engineer') || title.includes('developer') || title.includes('architect')) {
            return 'Champion';
          }
          if (title.includes('consultant') || title.includes('advisor') || title.includes('expert')) {
            return 'Champion';
          }
          if (title.includes('project') && title.includes('director')) {
            return 'Champion';
          }
          
          // Blockers
          if (title.includes('legal') || title.includes('compliance') || title.includes('security')) {
            return 'Blocker';
          }
          if (title.includes('procurement') || title.includes('purchasing')) {
            return 'Blocker';
          }
          
          // Stakeholders
          if (title.includes('manager') || title.includes('lead') || title.includes('senior')) {
            return 'Stakeholder';
          }
          if (title.includes('analyst') || title.includes('specialist') || title.includes('coordinator')) {
            return 'Stakeholder';
          }
          if (title.includes('admin') || title.includes('assistant')) {
            return 'Stakeholder';
          }
          
          // Introducers
          if (title.includes('sales') || title.includes('marketing') || title.includes('business development')) {
            return 'Introducer';
          }
          if (title.includes('partner') || title.includes('alliance') || title.includes('networking')) {
            return 'Introducer';
          }
          
          return 'Stakeholder';
        };

        // Transform people data to buyer group format
        const allPeople = uniqueCompanyPeople;
        
        const buyerGroupMembers = allPeople.map((person: any) => {
          // Check multiple possible ID matches
          const isPrimary = person.id === record.id || 
                           person.id === record.personId || 
                           person.fullName === record.fullName ||
                           (person.firstName === record.firstName && person.lastName === record.lastName);
          
          const jobTitle = person.title || person.jobTitle || '';
          
          // Use stored role from fast API or infer from job title
          const storedRole = person.buyerGroupRole;
          const buyerRole = storedRole || getBuyerGroupRole(jobTitle);
          
          return {
            id: person.id,
            name: person.fullName || `${person.firstName} ${person.lastName}`,
            title: jobTitle,
            email: person.email || person.workEmail || '',
            phone: person.phone || person.mobilePhone || '',
            role: buyerRole,
            buyerGroupStatus: person.buyerGroupStatus,  // ADD THIS - capture from API
            status: person.status,  // Add status field for navigation
            companyId: companyId,  // 🚨 FIX: Always use current companyId, not person.companyId (prevents filtering out valid members)
            influence: buyerRole === 'Decision Maker' ? 'high' : buyerRole === 'Champion' ? 'high' : 'medium',
            isPrimary: isPrimary,
            company: companyName,
            isExternalData: person.customFields?.dataSource === 'External' || false,
            externalId: person.customFields?.coresignalId || null,
            rank: person.rank || 999
          };
        });

        // Rank buyer groups: Decision Makers > Champions > Blockers > Stakeholders > Introducers
        const rolePriority = {
          'Decision Maker': 1,
          'Champion': 2,
          'Blocker': 3,
          'Stakeholder': 4,
          'Introducer': 5
        };

        // Influence level priority for secondary sorting
        const influencePriority = {
          'high': 1,
          'medium': 2,
          'low': 3
        };

        const sortedBuyerGroups = buyerGroupMembers.sort((a, b) => {
          // Primary sort: by rank (like companies table)
          const aRank = a.rank || 999;
          const bRank = b.rank || 999;
          
          if (aRank !== bRank) {
            return aRank - bRank;
          }
          
          // Secondary sort: by role priority (fallback if no rank)
          const aRolePriority = rolePriority[a.role] || 8;
          const bRolePriority = rolePriority[b.role] || 8;
          
          if (aRolePriority !== bRolePriority) {
            return aRolePriority - bRolePriority;
          }
          
          // Tertiary sort: by influence level
          const aInfluencePriority = influencePriority[a.influence] || 4;
          const bInfluencePriority = influencePriority[b.influence] || 4;
          
          if (aInfluencePriority !== bInfluencePriority) {
            return aInfluencePriority - bInfluencePriority;
          }
          
          // Final sort: by name (alphabetical)
          return a.name.localeCompare(b.name);
        });
        
        console.log('🔍 [BUYER GROUPS DEBUG] Final buyer groups before setting:', sortedBuyerGroups);
        console.log('🔍 [BUYER GROUPS DEBUG] Setting buyer groups with length:', sortedBuyerGroups.length);
        
        // 🚨 CRITICAL: Check if fetch was aborted before setting state
        if (signal.aborted) {
          console.log('🚫 [BUYER GROUPS] Fetch aborted before setting state, discarding results');
          return;
        }
        
        // 🚨 CRITICAL: Validate that we're still on the same company before setting state
        // This prevents race conditions where a new company was loaded while fetch was in progress
        const currentRecordId = previousRecordIdRef.current;
        const currentCompanyId = previousCompanyIdRef.current;
        const currentCompanyName = previousCompanyNameRef.current;
        
        if (currentRecordId !== record?.id || currentCompanyId !== companyId || currentCompanyName !== companyName) {
          console.log('🚫 [BUYER GROUPS] Company changed during fetch, discarding stale results', {
            currentRecordId,
            recordId: record?.id,
            currentCompanyId,
            companyId,
            currentCompanyName,
            companyName
          });
          return;
        }
        
        // 🚨 STRICT VALIDATION: Filter out any members that don't match the current companyId
        // This prevents displaying buyer groups from wrong companies due to API name matching issues
        const companyValidatedBuyerGroups = sortedBuyerGroups.filter(member => {
          // Only include members that match the current companyId
          const memberCompanyId = member.companyId || (member as any).companyId;
          const matchesCompanyId = memberCompanyId === companyId;
          
          if (!matchesCompanyId) {
            console.warn('⚠️ [BUYER GROUPS] Filtering out member with mismatched companyId:', {
              memberName: member.name,
              memberCompanyId,
              expectedCompanyId: companyId,
              memberCompany: member.company
            });
          }
          
          return matchesCompanyId;
        });
        
        // 🔍 VALIDATION: Ensure all remaining members have correct companyId and company before caching
        const validatedBuyerGroups = companyValidatedBuyerGroups.map(member => ({
          ...member,
          companyId: companyId, // Ensure companyId is set
          company: companyName   // Ensure company name is set
        }));
        
        // 🚨 FINAL VALIDATION: Double-check that ALL members match before setting state
        const allMembersValid = validatedBuyerGroups.every(member => 
          member.companyId === companyId && member.company === companyName
        );
        
        if (!allMembersValid) {
          console.error('❌ [BUYER GROUPS] Validation failed - not all members match company:', {
            companyId,
            companyName,
            memberCount: validatedBuyerGroups.length,
            invalidMembers: validatedBuyerGroups.filter(m => 
              m.companyId !== companyId || m.company !== companyName
            ).map(m => ({ name: m.name, companyId: m.companyId, company: m.company }))
          });
          // Don't set state if validation fails
          setBuyerGroups([]);
          setLoading(false);
          setIsFetching(false);
          return;
        }
        
        // Cache the validated buyer group data with proper company scoping
        if (companyId && companyName && validatedBuyerGroups.length > 0) {
          safeSetItem(buyerGroupCacheKey, validatedBuyerGroups);
          console.log('📦 [BUYER GROUPS] Cached buyer group data for company:', companyName, 'ID:', companyId);
        }
        
        setBuyerGroups(validatedBuyerGroups);
        setLoading(false);
        setIsFetching(false);
        console.log(`✅ [BUYER GROUPS] Found ${validatedBuyerGroups.length} validated people from ${companyName} (ID: ${companyId})`);
        
      } catch (error) {
        // 🚨 Don't set error state if fetch was aborted (expected behavior)
        if (signal.aborted) {
          console.log('🚫 [BUYER GROUPS] Fetch aborted, ignoring error');
          return;
        }
        
        console.error('Error fetching buyer groups:', error);
        
        // 🚨 Validate we're still on the same company before setting error state
        const currentRecordId = previousRecordIdRef.current;
        const currentCompanyId = previousCompanyIdRef.current;
        const currentCompanyName = previousCompanyNameRef.current;
        
        if (currentRecordId !== record?.id || currentCompanyId !== companyId || currentCompanyName !== companyName) {
          console.log('🚫 [BUYER GROUPS] Company changed during error, discarding error state');
          return;
        }
        
        setBuyerGroups([]);
        setLoading(false);
        setIsFetching(false);
      }
    };

    fetchBuyerGroups();
    
    // 🚨 CRITICAL: Cleanup function to abort stale fetches and reset state
    return () => {
      abortController.abort(); // Cancel any in-flight fetches
      setIsFetching(false);
    };
  }, [record?.id, recordType, companyId, companyName, fetchedCompanyId]); // 🚨 CRITICAL FIX: Added companyId, companyName, and fetchedCompanyId to dependencies to re-run when they become available

  const handleInlineSave = async (field: string, value: string, recordId?: string, recordTypeParam?: string) => {
    if (onSave) {
      await onSave(field, value);
    }
  };


  const handleMemberClick = async (member: any) => {
    console.log('🔗 [BUYER GROUPS] Navigating to person:', member);
    
    // Generate proper slug with person's name
    const personName = member.name || member.fullName || 'person';
    const personSlug = generateSlug(personName, member.id);
    
    // Get current workspace from URL
    const currentPath = window.location.pathname;
    const workspaceMatch = currentPath.match(/^\/([^\/]+)\//);
    
    if (workspaceMatch) {
      const workspaceSlug = workspaceMatch[1];
      
      // Navigate to appropriate pipeline record based on person status
      let personUrl: string;
      const status = member.status;
      
      switch (status) {
        case 'LEAD':
          personUrl = `/${workspaceSlug}/leads/${personSlug}`;
          break;
        case 'PROSPECT':
          personUrl = `/${workspaceSlug}/prospects/${personSlug}`;
          break;
        case 'OPPORTUNITY':
          // For OPPORTUNITY status, navigate to the company's opportunity record
          // Get company information from the record prop
          let companyName = '';
          let companyId = '';
          
          // Check if this is a company-only record
          const isCompanyOnlyRecord = recordType === 'companies' ||
                                     (recordType === 'speedrun' && record?.recordType === 'company') ||
                                     (recordType === 'leads' && record?.isCompanyLead === true) ||
                                     (recordType === 'prospects' && record?.isCompanyLead === true);
          
          if (isCompanyOnlyRecord) {
            // For company records, use the record name as company name
            companyName = record.name || 
                         (typeof record.company === 'object' && record.company !== null ? record.company.name : record.company) || 
                         record.companyName ||
                         'Company';
            companyId = record.id; // For company records, the record ID is the company ID
          } else {
            // For person records (people, leads, prospects that are NOT company leads), get company from companyId or company object
            companyId = record.companyId || 
                       record?.company?.id || 
                       (typeof record?.company === 'object' && record?.company?.id) ||
                       '';
            companyName = (typeof record.company === 'object' && record.company !== null ? record.company.name : record.company) || 
                         record.companyName || 'Company';
          }
          
          // Generate company slug for opportunity navigation
          const companySlug = generateSlug(companyName, companyId);
          personUrl = `/${workspaceSlug}/opportunities/${companySlug}`;
          console.log(`🔗 [BUYER GROUPS] OPPORTUNITY person - navigating to company opportunity: ${companyName} (${companyId})`);
          break;
        default:
          // CLIENT, SUPERFAN, or any other status
          personUrl = `/${workspaceSlug}/people/${personSlug}`;
          break;
      }
      
      console.log(`🔗 [BUYER GROUPS] Navigating to ${status} record: ${personUrl}`);
      router.push(personUrl);
    } else {
      // Fallback to non-workspace URL
      const personUrl = `/people/${personSlug}`;
      console.log(`🔗 [BUYER GROUPS] Navigating to: ${personUrl}`);
      router.push(personUrl);
    }
  };

  // No loading spinner - instant display

  // Calculate stats from buyer groups
  const totalMembers = buyerGroups.length;
  const decisionMakers = buyerGroups.filter(p => p.role === 'Decision Maker').length;
  const champions = buyerGroups.filter(p => p.role === 'Champion').length;
  const stakeholders = buyerGroups.filter(p => p.role === 'Stakeholder').length;
  const blockers = buyerGroups.filter(p => p.role === 'Blocker').length;
  const introducers = buyerGroups.filter(p => p.role === 'Introducer').length;
  

  return (
    <div>
      <div className="space-y-8">

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-4 bg-loading-bg rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="w-10 h-10 bg-loading-bg rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-loading-bg rounded w-1/3"></div>
                    <div className="h-3 bg-loading-bg rounded w-1/4"></div>
                  </div>
                  <div className="w-20 h-6 bg-loading-bg rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="text-center py-12">
          <div className="bg-error/10 border border-error rounded-lg p-6 mx-auto max-w-md">
            <h3 className="text-lg font-medium text-error mb-2">
              Error Loading Buyer Group
            </h3>
            <p className="text-sm text-muted mb-4">
              {error}
            </p>
            <div className="text-xs text-muted text-left bg-background p-3 rounded">
              <strong>Debug Info:</strong><br/>
              Record Type: {recordType}<br/>
              Record ID: {record?.id || 'N/A'}<br/>
              Company ID: {companyId || 'N/A'}<br/>
              Company Name: {companyName || 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && buyerGroups.length === 0 && (
        <div className="text-center py-12">
          <BuildingOfficeIcon className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No Buyer Group Members Found
          </h3>
          <p className="text-muted mb-4">
            No people have been assigned buyer group roles for this company yet.
          </p>
          <div className="text-xs text-muted bg-background border border-border p-3 rounded inline-block">
            <strong>Debug Info:</strong><br/>
            Company ID: {companyId || 'N/A'}<br/>
            Company Name: {companyName || 'N/A'}<br/>
            Check browser console for detailed logs
          </div>
        </div>
      )}

      {/* Buyer Group Members */}
      {!loading && buyerGroups.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Buyer Group Members</h3>
          </div>
          <div className="space-y-3">
            {buyerGroups.map((member, index) => {
              const riskAssessment = riskAssessments[member.id] || calculatePersonRisk(member);

              return (
                <div key={member.id || index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-panel-background cursor-pointer transition-colors" onClick={() => handleMemberClick(member)}>
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-loading-bg rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-muted">
                        {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{member.name}</div>
                      <div className="text-sm text-muted">{member.title}</div>
                      <div className="text-xs text-muted">{member.email}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {member.status && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        member.status === 'LEAD' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                        member.status === 'PROSPECT' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                        member.status === 'OPPORTUNITY' ? 'bg-green-100 text-green-800 border border-green-300' :
                        member.status === 'CLIENT' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        'bg-gray-100 text-gray-800 border border-gray-300'
                      }`}>
                        {member.status}
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs rounded-full ${getRiskPillStyles(riskAssessment.level)}`}>
                      {riskAssessment.level}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getRoleColorClasses(member.role)}`}>
                      {getRoleLabel(member.role)}
                    </span>
                    {/* ADD THIS - Buyer Group Status Badge */}
                    {member.buyerGroupStatus && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        member.buyerGroupStatus === 'in' ? 'bg-success/10 text-success border border-success' :
                        member.buyerGroupStatus === 'out' ? 'bg-muted-light text-muted border border-border' :
                        member.buyerGroupStatus === 'pending' ? 'bg-warning/10 text-warning border border-warning' :
                        'bg-muted-light text-muted'
                      }`}>
                        {member.buyerGroupStatus === 'in' ? '✓ In Group' :
                         member.buyerGroupStatus === 'out' ? 'Out' :
                         member.buyerGroupStatus === 'pending' ? 'Pending' : 
                         member.buyerGroupStatus}
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      member.influence === 'high' ? 'bg-purple-100 text-purple-800' :
                      member.influence === 'medium' ? 'bg-orange-100 text-orange-800' :
                      'bg-hover text-gray-800'
                    }`}>
                      {member.influence} influence
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* Add Member Modal Placeholder */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-background">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-foreground">Add Member</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-muted">
                  This feature is coming soon. You'll be able to add new members to the buyer group.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button 
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 bg-panel-background0 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
