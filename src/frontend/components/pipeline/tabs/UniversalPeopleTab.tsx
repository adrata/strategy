"use client";

import React, { useState, useEffect, useRef } from 'react';
import { authFetch } from '@/platform/api-fetch';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { safeSetItem, safeGetItem } from '@/platform/utils/storage/safeLocalStorage';
import { calculateRiskAssessment, getRiskPillStyles, CareerData, RiskAssessment } from '@/platform/utils/riskAssessment';
import { generateSlug } from '@/platform/utils/url-utils';

interface UniversalPeopleTabProps {
  record: any;
  recordType: string;
  onSave?: (field: string, value: string) => Promise<void>;
}

export function UniversalPeopleTab({ record, recordType, onSave }: UniversalPeopleTabProps) {
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [riskAssessments, setRiskAssessments] = useState<Record<string, RiskAssessment>>({});
  const [isFetching, setIsFetching] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Track previous companyId and recordId to detect changes and invalidate cache
  const previousCompanyIdRef = useRef<string | null>(null);
  const previousRecordIdRef = useRef<string | null>(null);
  
  // 🚨 CRITICAL FIX: Extract companyId into a memo to track changes properly
  // This ensures the effect re-runs when companyId becomes available
  const companyId = React.useMemo(() => {
    if (!record) return '';
    
    if (recordType === 'people') {
      // For person records, get company from companyId field
      const id = record.companyId || '';
      console.log('🔍 [PEOPLE TAB] Extracted companyId for person record:', id);
      return id;
    } else {
      // For company records, the record ID is the company ID
      const id = record.id || '';
      console.log('🔍 [PEOPLE TAB] Using record.id as companyId for company record:', id);
      return id;
    }
  }, [record?.id, record?.companyId, recordType]);

  // Handle person click navigation
  const handlePersonClick = (person: any) => {
    console.log('🔗 [PEOPLE] Navigating to person:', person);
    
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
          
          if (recordType === 'people') {
            // For person records, get company from companyId or company object
            companyId = record.companyId;
            companyName = (typeof record.company === 'object' && record.company !== null ? record.company.name : record.company) || 
                         record.companyName || 'Company';
          } else {
            // For company records, use the record name as company name
            companyName = record.name || 
                         (typeof record.company === 'object' && record.company !== null ? record.company.name : record.company) || 
                         record.companyName ||
                         'Company';
            companyId = record.id; // For company records, the record ID is the company ID
          }
          
          // Generate company slug for opportunity navigation
          const companySlug = generateSlug(companyName, companyId);
          personUrl = `/${workspaceSlug}/opportunities/${companySlug}`;
          console.log(`🔗 [PEOPLE] OPPORTUNITY person - navigating to company opportunity: ${companyName} (${companyId})`);
          break;
        default:
          // CLIENT, SUPERFAN, or any other status
          personUrl = `/${workspaceSlug}/people/${personSlug}`;
          break;
      }
      
      console.log(`🔗 [PEOPLE] Navigating to ${status} record: ${personUrl}`);
      router.push(personUrl);
    } else {
      // Fallback to non-workspace URL
      const personUrl = `/people/${personSlug}`;
      console.log(`🔗 [PEOPLE] Navigating to: ${personUrl}`);
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

  // Calculate risk assessments when people change
  useEffect(() => {
    if (people.length > 0) {
      const assessments: Record<string, RiskAssessment> = {};
      people.forEach(person => {
        assessments[person.id] = calculatePersonRisk(person);
      });
      setRiskAssessments(assessments);
    }
  }, [people]);

  useEffect(() => {
    const fetchPeople = async () => {
      console.log('🔍 [PEOPLE DEBUG] Starting fetchPeople');
      console.log('🔍 [PEOPLE DEBUG] Record:', record);
      console.log('🔍 [PEOPLE DEBUG] Record ID:', record?.id);
      
      // 🔄 CRITICAL: Check if record ID changed first - this catches company switches
      const previousRecordId = previousRecordIdRef.current;
      const recordIdChanged = previousRecordId !== null && previousRecordId !== record?.id;
      
      if (!record?.id) {
        console.log('🔍 [PEOPLE DEBUG] No record ID, clearing state and showing loading while waiting for record');
        setPeople([]);
        setLoading(true); // Show loading while waiting for record
        setIsFetching(false);
        previousRecordIdRef.current = null;
        previousCompanyIdRef.current = null;
        return;
      }
      
      // Get the company name from the record (companyId is now from the memoized value)
      let companyName = '';
      
      if (recordType === 'people') {
        // For person records, get company name from company object
        // Handle case where company is null but companyId exists (soft-deleted company)
        companyName = (typeof record.company === 'object' && record.company !== null ? record.company.name : record.company) || 
                     record.companyName || 
                     (companyId ? 'Company' : 'Company');
      } else {
        // For company records, use the record name as company name
        companyName = record.name || 
                     (typeof record.company === 'object' && record.company !== null ? record.company.name : record.company) || 
                     record.companyName ||
                     'Company';
      }
      
      // 🚨 CRITICAL FIX: Validate companyId before proceeding
      // 🔧 ENHANCED VALIDATION: Check for invalid values including 'undefined' and 'null' strings
      if (!companyId || companyId.trim() === '' || companyId === 'undefined' || companyId === 'null') {
        console.warn('⚠️ [PEOPLE TAB] Invalid or missing companyId, cannot fetch people:', {
          recordType,
          recordId: record?.id,
          recordName: record?.name,
          companyId: companyId,
          hasCompanyId: !!companyId,
          companyIdType: typeof companyId
        });
        
        // If companyId is explicitly 'undefined' or 'null', show error instead of loading
        if (companyId === 'undefined' || companyId === 'null') {
          console.error('❌ [PEOPLE TAB] Invalid companyId value detected');
          setPeople([]);
          setLoading(false);
          setIsFetching(false);
          setError(`Unable to load people: Invalid company identifier (got: "${companyId}")`);
          return;
        }
        
        // Otherwise, show loading while waiting for companyId to become available
        setPeople([]);
        setLoading(true);
        setIsFetching(false);
        setError(null);
        return;
      }
      
      // 🔄 CACHE INVALIDATION: Check if recordId or companyId changed
      const previousCompanyId = previousCompanyIdRef.current;
      const companyIdChanged = previousCompanyId !== null && previousCompanyId !== companyId;
      
      console.log('🔍 [PEOPLE DEBUG] Change check:', {
        previousRecordId,
        currentRecordId: record?.id,
        recordIdChanged,
        previousCompanyId,
        currentCompanyId: companyId,
        companyIdChanged,
        recordType
      });
      
      // If record or company changed, clear stale cache and reset state IMMEDIATELY
      if (recordIdChanged || companyIdChanged) {
        console.log('🔄 [PEOPLE] Record or company changed, clearing state immediately and invalidating cache');
        setPeople([]);
        setLastFetchTime(null);
        setIsFetching(false);
        
        // Clear people specific cache for previous company
        if (previousCompanyId) {
          const workspaceId = record.workspaceId || '01K7DNYR5VZ7JY36KGKKN76XZ1';
          const previousCacheKey = `people-${previousCompanyId}-${workspaceId}`;
          localStorage.removeItem(previousCacheKey);
          console.log('🗑️ [PEOPLE] Cleared cache for previous company:', previousCacheKey);
        }
        
        // Also clear current company cache to force fresh fetch
        const workspaceId = record.workspaceId || '01K7DNYR5VZ7JY36KGKKN76XZ1';
        const currentCacheKey = `people-${companyId}-${workspaceId}`;
        localStorage.removeItem(currentCacheKey);
        console.log('🗑️ [PEOPLE] Cleared current company cache to force fresh fetch:', currentCacheKey);
      }
      
      // Update the refs with current values
      previousRecordIdRef.current = record?.id;
      previousCompanyIdRef.current = companyId;
      
      // Prevent multiple fetches (unless record or company changed)
      if (isFetching || ((!recordIdChanged && !companyIdChanged) && lastFetchTime && Date.now() - lastFetchTime < 5000)) {
        console.log('🔍 [PEOPLE DEBUG] Already fetching or recently fetched, skipping');
        return;
      }
      
      setIsFetching(true);
      setLoading(true);
      setLastFetchTime(Date.now());
      
      try {
        const workspaceId = record.workspaceId || '01K7DNYR5VZ7JY36KGKKN76XZ1';
        const userId = record.assignedUserId || '';
        
        const cacheKey = `people-${workspaceId}-${userId}`;
        const peopleCacheKey = `people-${companyId}-${workspaceId}`;
        let peopleData = [];
        
        // Check people specific cache first
        const peopleCachedData = safeGetItem(peopleCacheKey, 10 * 60 * 1000); // 10 minutes TTL
        if (peopleCachedData && Array.isArray(peopleCachedData) && peopleCachedData.length > 0) {
          const cacheIsValid = !companyIdChanged && peopleCachedData.every(person => 
            person.companyId === companyId || person.company === companyName
          );
          
          if (cacheIsValid) {
            console.log('📦 [PEOPLE] Using validated cached people data for company:', companyName);
            setPeople(peopleCachedData);
            setLoading(false);
            setIsFetching(false);
            return;
          } else {
            console.log('⚠️ [PEOPLE] Cache invalid for current company, will fetch fresh data');
          }
        }
        
        // Check general people cache
        const cachedData = safeGetItem(cacheKey, 2 * 60 * 1000); // 2 minutes TTL
        if (cachedData) {
          peopleData = cachedData;
          console.log('📦 [PEOPLE] Using cached people data');
        }
        
        // Only fetch if no cache or cache is stale
        if (peopleData.length === 0) {
          console.log('🔍 [PEOPLE] Fetching fresh people data for company:', companyName, 'ID:', companyId);
          
          try {
            // 🚀 PERFORMANCE FIX: Fetch only 200 people initially for faster load times
            // Users can paginate if needed
            // 🔧 FIX: Add includeAllUsers=true to bypass seller filtering issues
            const apiUrl = `/api/v1/people?companyId=${companyId}&limit=200&sortBy=updatedAt&sortOrder=desc&includeAllUsers=true`;
            console.log('🔍 [PEOPLE TAB] Making API call:', apiUrl);
            console.log('🔍 [PEOPLE TAB] CompanyId being sent:', companyId);
            console.log('🔍 [PEOPLE TAB] includeAllUsers flag: true');
            const response = await authFetch(apiUrl);
            console.log('🔍 [PEOPLE TAB] API response:', response);
            
            if (response && response.success && response.data) {
              peopleData = response.data;
              console.log('⚡ [PEOPLE] API returned:', peopleData.length, 'people');
              
              // Sync buyer group data for all people in the company (background, non-blocking)
              if (companyId) {
                authFetch(`/api/v1/companies/${companyId}/sync-buyer-group`, {
                  method: 'POST'
                }).catch(error => {
                  // Silently fail - sync is best effort
                  if (process.env.NODE_ENV === 'development') {
                    console.warn('⚠️ [PEOPLE] Failed to sync company buyer group data:', error);
                  }
                });
              }
              
              // Cache the data immediately
              // 🔧 ENHANCED CACHING: Include mainSellerId, status, and updatedAt for better cache accuracy
              const essentialData = peopleData.map(person => ({
                id: person.id,
                fullName: person.fullName,
                firstName: person.firstName,
                lastName: person.lastName,
                company: person.company,
                companyId: person.companyId,
                jobTitle: person.jobTitle,
                email: person.email,
                mainSellerId: person.mainSellerId, // For seller ownership validation
                status: person.status, // For status filtering
                updatedAt: person.updatedAt // For cache freshness checks
              }));
              
              safeSetItem(cacheKey, essentialData);
            } else {
              console.log('⚠️ [PEOPLE] API returned no data or failed:', response);
            }
          } catch (error) {
            console.log('⚠️ [PEOPLE] API failed:', error);
            console.error('❌ [PEOPLE] Error details:', {
              message: error.message,
              stack: error.stack,
              name: error.name
            });
          }
        }
        
        // Filter people for this company
        const companyPeople = peopleData.filter((person: any) => 
          person.companyId === companyId || person.company === companyName
        );
        
        // Remove duplicates based on person ID
        const uniqueCompanyPeople = companyPeople.filter((person: any, index: number, self: any[]) => 
          index === self.findIndex((p: any) => p.id === person.id)
        );
        
        if (uniqueCompanyPeople.length === 0) {
          console.log('🔍 [PEOPLE] No people found in database for this company:', companyName, 'ID:', companyId);
          setPeople([]);
          setLoading(false);
          setHasFetchedOnce(true); // Mark that we've attempted fetch
          return;
        }

        // Define role function
        const getPersonRole = (jobTitle: string) => {
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

        // Transform people data
        const allPeople = uniqueCompanyPeople;
        
        const peopleList = allPeople.map((person: any) => {
          const isPrimary = person.id === record.id || 
                           person.id === record.personId || 
                           person.fullName === record.fullName ||
                           (person.firstName === record.firstName && person.lastName === record.lastName);
          
          const jobTitle = person.title || person.jobTitle || '';
          const role = person.buyerGroupRole || getPersonRole(jobTitle);
          
          return {
            id: person.id,
            name: person.fullName || `${person.firstName} ${person.lastName}`,
            title: jobTitle,
            email: person.email || person.workEmail || '',
            phone: person.phone || person.mobilePhone || '',
            role: role,
            influence: role === 'Decision Maker' ? 'high' : role === 'Champion' ? 'high' : 'medium',
            isPrimary: isPrimary,
            company: companyName,
            isExternalData: person.customFields?.dataSource === 'External' || false,
            externalId: person.customFields?.coresignalId || null,
            rank: person.rank || 999
          };
        });

        // Filter out current person when showing co-workers (for person/lead/prospect records)
        const filteredPeopleList = peopleList.filter((person: any) => {
          // For co-workers view, exclude the current person
          if (['people', 'leads', 'prospects'].includes(recordType)) {
            return !person.isPrimary;
          }
          // For company view, show all people including the current person
          return true;
        });

        // Sort people: Decision Makers > Champions > Stakeholders > Introducers
        const rolePriority = {
          'Decision Maker': 1,
          'Champion': 2,
          'Blocker': 3,
          'Stakeholder': 4,
          'Introducer': 5
        };

        const influencePriority = {
          'high': 1,
          'medium': 2,
          'low': 3
        };

        const sortedPeople = filteredPeopleList.sort((a, b) => {
          // Primary sort: by rank
          const aRank = a.rank || 999;
          const bRank = b.rank || 999;
          
          if (aRank !== bRank) {
            return aRank - bRank;
          }
          
          // Secondary sort: by role priority
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
        
        console.log('🔍 [PEOPLE DEBUG] Final people before setting:', sortedPeople);
        setPeople(sortedPeople);
        setLoading(false);
        setHasFetchedOnce(true); // Mark that we've attempted fetch
        setIsFetching(false);
        console.log(`Found ${sortedPeople.length} people from ${companyName}:`, sortedPeople);
        
      } catch (error) {
        console.error('Error fetching people:', error);
        setPeople([]);
        setLoading(false);
        setHasFetchedOnce(true); // Mark that we've attempted fetch
        setIsFetching(false);
      }
    };

    fetchPeople();
    
    // Cleanup function to reset fetching state
    return () => {
      setIsFetching(false);
    };
  }, [record?.id, recordType, companyId]); // 🚨 CRITICAL FIX: Added companyId to dependencies to re-run when it becomes available

  const handleInlineSave = async (field: string, value: string, recordId?: string, recordTypeParam?: string) => {
    if (onSave) {
      await onSave(field, value);
    }
  };

  return (
    <div className="p-6">
      <div className="space-y-8">
      
      {/* 🔍 DEBUG PANEL - Visible diagnostics */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              🔍 Debug Panel - People Tab
            </h4>
            <span className="text-xs text-blue-600 dark:text-blue-300">
              {new Date().toLocaleTimeString()}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="font-medium text-blue-700 dark:text-blue-300">Record Type:</span>
              <span className="ml-2 text-blue-900 dark:text-blue-100">{recordType}</span>
            </div>
            <div>
              <span className="font-medium text-blue-700 dark:text-blue-300">Record ID:</span>
              <span className="ml-2 text-blue-900 dark:text-blue-100 font-mono text-[10px]">
                {record?.id?.substring(0, 20) || 'N/A'}...
              </span>
            </div>
            <div>
              <span className="font-medium text-blue-700 dark:text-blue-300">Company ID:</span>
              <span className="ml-2 text-blue-900 dark:text-blue-100 font-mono text-[10px]">
                {companyId?.substring(0, 20) || 'N/A'}...
              </span>
            </div>
            <div>
              <span className="font-medium text-blue-700 dark:text-blue-300">Loading:</span>
              <span className="ml-2 text-blue-900 dark:text-blue-100">
                {loading ? '⏳ Yes' : '✅ No'}
              </span>
            </div>
            <div>
              <span className="font-medium text-blue-700 dark:text-blue-300">Has Fetched:</span>
              <span className="ml-2 text-blue-900 dark:text-blue-100">
                {hasFetchedOnce ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            <div>
              <span className="font-medium text-blue-700 dark:text-blue-300">People Count:</span>
              <span className="ml-2 text-blue-900 dark:text-blue-100 font-semibold">
                {people.length}
              </span>
            </div>
            <div className="col-span-2">
              <span className="font-medium text-blue-700 dark:text-blue-300">Error:</span>
              <span className="ml-2 text-red-600 dark:text-red-400">
                {error || 'None'}
              </span>
            </div>
          </div>
        </div>
      )}
      
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
              Error Loading People
            </h3>
            <p className="text-sm text-muted mb-4">
              {error}
            </p>
            <div className="text-xs text-muted text-left bg-background p-3 rounded">
              <strong>Debug Info:</strong><br/>
              Record Type: {recordType}<br/>
              Record ID: {record?.id || 'N/A'}<br/>
              Company ID: {companyId || 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && people.length === 0 && hasFetchedOnce && (
        <div className="text-center py-12">
          <BuildingOfficeIcon className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {['people', 'leads', 'prospects'].includes(recordType) ? 'No Co-Workers Found' : 'No People (Employees) Found'}
          </h3>
          <p className="text-muted mb-4">
            {['people', 'leads', 'prospects'].includes(recordType) 
              ? 'This person doesn\'t have any co-workers at their company yet.'
              : 'This company does not have any associated employees yet.'
            }
          </p>
          <div className="text-xs text-muted bg-background border border-border p-3 rounded inline-block">
            <strong>Debug Info:</strong><br/>
            Company ID: {companyId || 'N/A'}<br/>
            Check browser console for detailed logs
          </div>
        </div>
      )}

      {/* People List */}
      {!loading && people.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            {['people', 'leads', 'prospects'].includes(recordType) ? 'Co-Workers' : 'People'}
          </h3>
          <div className="space-y-3">
            {people.map((person, index) => {
              const riskAssessment = riskAssessments[person.id] || calculatePersonRisk(person);

              return (
                <div key={person.id || index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-panel-background cursor-pointer transition-colors" onClick={() => handlePersonClick(person)}>
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-loading-bg rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-muted">
                        {person.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{person.name}</div>
                      <div className="text-sm text-muted">{person.title}</div>
                      <div className="text-xs text-muted">{person.email}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getRiskPillStyles(riskAssessment.level)}`}>
                      {riskAssessment.level}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      person.role === 'Decision Maker' ? 'bg-error/10 text-error border border-error' :
                      person.role === 'Champion' ? 'bg-success/10 text-success border border-success' :
                      person.role === 'Blocker' ? 'bg-warning/10 text-warning border border-warning' :
                      person.role === 'Stakeholder' ? 'bg-primary/10 text-primary border border-primary' :
                      'bg-hover text-foreground border border-border'
                    }`}>
                      {person.role}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      person.influence === 'high' ? 'bg-error/10 text-error border border-error' :
                      person.influence === 'medium' ? 'bg-warning/10 text-warning border border-warning' :
                      'bg-hover text-foreground border border-border'
                    }`}>
                      {person.influence} influence
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}