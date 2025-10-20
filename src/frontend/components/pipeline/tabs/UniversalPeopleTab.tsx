"use client";

import React, { useState, useEffect, useRef } from 'react';
import { authFetch } from '@/platform/api-fetch';
import { BuildingOfficeIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { InlineEditField } from '../InlineEditField';
import { useRouter } from 'next/navigation';
import { safeSetItem, safeGetItem } from '@/platform/utils/storage/safeLocalStorage';
import { calculateRiskAssessment, getRiskPillStyles, generateRiskDescription, CareerData, RiskAssessment } from '@/platform/utils/riskAssessment';
import { generateSlug } from '@/platform/utils/url-utils';

interface UniversalPeopleTabProps {
  record: any;
  recordType: string;
  onSave?: (field: string, value: string) => Promise<void>;
}

interface Person {
  id: string;
  name: string;
  title: string;
  email: string;
  phone?: string;
  role: string;
  influence: string;
  isPrimary: boolean;
  company: string;
}

export function UniversalPeopleTab({ record, recordType, onSave }: UniversalPeopleTabProps) {
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [riskAssessments, setRiskAssessments] = useState<Record<string, RiskAssessment>>({});
  const [isFetching, setIsFetching] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const router = useRouter();
  
  // Track previous companyId to detect changes and invalidate cache
  const previousCompanyIdRef = useRef<string | null>(null);

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
      const personUrl = `/${workspaceSlug}/people/${personSlug}`;
      console.log(`🔗 [PEOPLE] Navigating to: ${personUrl}`);
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
      
      if (!record?.id) {
        console.log('🔍 [PEOPLE DEBUG] No record ID, clearing state and setting loading to false');
        setPeople([]);
        setLoading(false);
        return;
      }
      
      // Get the company name and ID from the record
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
      
      // Check if companyId changed
      const previousCompanyId = previousCompanyIdRef.current;
      const companyIdChanged = previousCompanyId !== null && previousCompanyId !== companyId;
      
      console.log('🔍 [PEOPLE DEBUG] Company change check:', {
        previousCompanyId,
        currentCompanyId: companyId,
        companyIdChanged,
        recordType
      });
      
      // If company changed, clear stale cache and reset state
      if (companyIdChanged) {
        console.log('🔄 [PEOPLE] Company changed, clearing state immediately and invalidating cache');
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
      
      // Update the ref with current companyId
      previousCompanyIdRef.current = companyId;
      
      // Prevent multiple fetches
      if (isFetching || (!companyIdChanged && lastFetchTime && Date.now() - lastFetchTime < 5000)) {
        console.log('🔍 [PEOPLE DEBUG] Already fetching or recently fetched, skipping');
        return;
      }
      
      setIsFetching(true);
      setLoading(true);
      setLastFetchTime(Date.now());
      
      try {
        const workspaceId = record.workspaceId || '01K7DNYR5VZ7JY36KGKKN76XZ1';
        const userId = record.assignedUserId || '01K1VBYXHD0J895XAN0HGFBKJP';
        
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
            const response = await authFetch(`/api/v1/people?companyId=${companyId}&limit=1000`);
            console.log('🔍 [PEOPLE] API response:', response);
            
            if (response && response.success && response.data) {
              peopleData = response.data;
              console.log('⚡ [PEOPLE] API returned:', peopleData.length, 'people');
              
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

        const sortedPeople = peopleList.sort((a, b) => {
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
        setIsFetching(false);
        console.log(`Found ${sortedPeople.length} people from ${companyName}:`, sortedPeople);
        
      } catch (error) {
        console.error('Error fetching people:', error);
        setPeople([]);
        setLoading(false);
        setIsFetching(false);
      }
    };

    fetchPeople();
    
    // Cleanup function to reset fetching state
    return () => {
      setIsFetching(false);
    };
  }, [record?.id, record, recordType]);

  const handleInlineSave = async (field: string, value: string, recordId?: string, recordTypeParam?: string) => {
    if (onSave) {
      await onSave(field, value);
    }
  };


  // Calculate stats from people
  const totalPeople = people.length;
  const decisionMakers = people.filter(p => p.role === 'Decision Maker').length;
  const champions = people.filter(p => p.role === 'Champion').length;
  const stakeholders = people.filter(p => p.role === 'Stakeholder').length;
  const blockers = people.filter(p => p.role === 'Blocker').length;
  const introducers = people.filter(p => p.role === 'Introducer').length;

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Overview</h3>
        <div className="grid grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--foreground)]">{totalPeople}</div>
            <div className="text-sm text-[var(--muted)]">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--foreground)]">{decisionMakers}</div>
            <div className="text-sm text-[var(--muted)]">Decision Makers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--foreground)]">{champions}</div>
            <div className="text-sm text-[var(--muted)]">Champions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--foreground)]">{stakeholders}</div>
            <div className="text-sm text-[var(--muted)]">Stakeholders</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--foreground)]">{blockers}</div>
            <div className="text-sm text-[var(--muted)]">Blockers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--foreground)]">{introducers}</div>
            <div className="text-sm text-[var(--muted)]">Introducers</div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-4 bg-[var(--loading-bg)] rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="w-10 h-10 bg-[var(--loading-bg)] rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[var(--loading-bg)] rounded w-1/3"></div>
                    <div className="h-3 bg-[var(--loading-bg)] rounded w-1/4"></div>
                  </div>
                  <div className="w-20 h-6 bg-[var(--loading-bg)] rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && people.length === 0 && (
        <div className="text-center py-12">
          <BuildingOfficeIcon className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
            No People Found
          </h3>
          <p className="text-[var(--muted)]">
            This company doesn&apos;t have any people associated with it yet.
          </p>
        </div>
      )}

      {/* People List */}
      {!loading && people.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">People</h3>
          <div className="space-y-3">
            {people.map((person, index) => {
              const riskAssessment = riskAssessments[person.id] || calculatePersonRisk(person);

              return (
                <div key={person.id || index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-[var(--panel-background)] cursor-pointer transition-colors" onClick={() => handlePersonClick(person)}>
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-[var(--loading-bg)] rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-[var(--muted)]">
                        {person.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-[var(--foreground)]">{person.name}</div>
                      <div className="text-sm text-[var(--muted)]">{person.title}</div>
                      <div className="text-xs text-[var(--muted)]">{person.email}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getRiskPillStyles(riskAssessment.level)}`}>
                      {riskAssessment.level}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      person.role === 'Decision Maker' ? 'bg-red-100 text-red-800' :
                      person.role === 'Champion' ? 'bg-green-100 text-green-800' :
                      person.role === 'Blocker' ? 'bg-yellow-100 text-yellow-800' :
                      person.role === 'Stakeholder' ? 'bg-blue-100 text-blue-800' :
                      'bg-[var(--hover)] text-gray-800'
                    }`}>
                      {person.role}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      person.influence === 'high' ? 'bg-purple-100 text-purple-800' :
                      person.influence === 'medium' ? 'bg-orange-100 text-orange-800' :
                      'bg-[var(--hover)] text-gray-800'
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
  );
}
