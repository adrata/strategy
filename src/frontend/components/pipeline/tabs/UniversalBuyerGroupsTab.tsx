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
  const [loading, setLoading] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [riskAssessments, setRiskAssessments] = useState<Record<string, RiskAssessment>>({});
  const [isFetching, setIsFetching] = useState(false); // Prevent multiple simultaneous fetches
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const router = useRouter();
  
  // Track previous companyId to detect changes and invalidate cache
  const previousCompanyIdRef = useRef<string | null>(null);

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
      const personUrl = `/${workspaceSlug}/people/${personSlug}`;
      console.log(`🔗 [BUYER GROUPS] Navigating to: ${personUrl}`);
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
    // Mock career data - in real implementation, this would come from the person's profile
    const careerData: CareerData = {
      currentRoleStartDate: person.currentRoleStartDate || '2023-01-01',
      previousRoles: person.previousRoles || [
        { title: 'Senior Manager', startDate: '2021-06-01', endDate: '2022-12-31', duration: 18 },
        { title: 'Manager', startDate: '2020-01-01', endDate: '2021-05-31', duration: 17 },
        { title: 'Senior Analyst', startDate: '2018-03-01', endDate: '2019-12-31', duration: 22 }
      ],
      totalCareerDuration: person.totalCareerDuration || 60,
      averageRoleDuration: person.averageRoleDuration || 19
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

  useEffect(() => {
    const fetchBuyerGroups = async () => {
      console.log('🔍 [BUYER GROUPS DEBUG] Starting fetchBuyerGroups');
      console.log('🔍 [BUYER GROUPS DEBUG] Record:', record);
      console.log('🔍 [BUYER GROUPS DEBUG] Record ID:', record?.id);
      
      if (!record?.id) {
        // console.log('🔍 [BUYER GROUPS DEBUG] No record ID, setting loading to false');
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
      
      // 🔄 CACHE INVALIDATION: Check if companyId changed
      const previousCompanyId = previousCompanyIdRef.current;
      const companyIdChanged = previousCompanyId !== null && previousCompanyId !== companyId;
      
      console.log('🔍 [BUYER GROUPS DEBUG] Company change check:', {
        previousCompanyId,
        currentCompanyId: companyId,
        companyIdChanged,
        recordType
      });
      
      // If company changed, clear stale cache and reset state
      if (companyIdChanged) {
        console.log('🔄 [BUYER GROUPS] Company changed, clearing stale cache and resetting state');
        setBuyerGroups([]);
        setLastFetchTime(null); // Reset fetch throttle to allow immediate re-fetch
        setIsFetching(false);
        
        // Clear buyer group specific cache for previous company
        if (previousCompanyId) {
          const workspaceId = record.workspaceId || '01K7DNYR5VZ7JY36KGKKN76XZ1';
          const previousCacheKey = `buyer-groups-${previousCompanyId}-${workspaceId}`;
          localStorage.removeItem(previousCacheKey);
          console.log('🗑️ [BUYER GROUPS] Cleared cache for previous company:', previousCacheKey);
        }
      }
      
      // Update the ref with current companyId
      previousCompanyIdRef.current = companyId;
      
      // 🚫 PREVENT MULTIPLE FETCHES: Check if already fetching or recently fetched (unless company changed)
      if (isFetching || (!companyIdChanged && lastFetchTime && Date.now() - lastFetchTime < 5000)) {
        console.log('🔍 [BUYER GROUPS DEBUG] Already fetching or recently fetched, skipping');
        return;
      }
      
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
        // console.log('🔍 [BUYER GROUPS DEBUG] Record name:', record.name);
        // console.log('🔍 [BUYER GROUPS DEBUG] Record company:', record.company);
        // console.log('🔍 [BUYER GROUPS DEBUG] Record companyName:', record.companyName);
        
        if (!companyName) {
          // console.log('No company found for record, showing empty buyer group');
          setBuyerGroups([]);
          setLoading(false);
          return;
        }
        const userId = record.assignedUserId || '01K1VBYXHD0J895XAN0HGFBKJP'; // Use record's assigned user or workspace ID
        
        const cacheKey = `people-${workspaceId}-${userId}`;
        const buyerGroupCacheKey = `buyer-groups-${companyId}-${workspaceId}`;
        let peopleData = [];
        
        // ⚡ PERFORMANCE: Check buyer group specific cache first (faster)
        const buyerGroupCachedData = safeGetItem(buyerGroupCacheKey, 10 * 60 * 1000); // 10 minutes TTL for better performance
        if (buyerGroupCachedData && Array.isArray(buyerGroupCachedData) && buyerGroupCachedData.length > 0) {
          // 🔍 CACHE VALIDATION: Verify cache is for current company
          const cacheIsValid = !companyIdChanged && buyerGroupCachedData.every(member => 
            member.companyId === companyId || member.company === companyName
          );
          
          if (cacheIsValid) {
            console.log('📦 [BUYER GROUPS] Using validated cached buyer group data for company:', companyName);
            setBuyerGroups(buyerGroupCachedData);
            setLoading(false);
            setIsFetching(false);
            return;
          } else {
            console.log('⚠️ [BUYER GROUPS] Cache invalid for current company, will fetch fresh data');
          }
        }
        
        // 🚀 PRELOAD: Check for preloaded buyer group data
        const preloadedData = localStorage.getItem(`buyer-groups-${companyId}-${workspaceId}`);
        if (preloadedData && !companyIdChanged) {
          try {
            const preloadedMembers = JSON.parse(preloadedData);
            if (Array.isArray(preloadedMembers) && preloadedMembers.length > 0) {
              // 🔍 VALIDATE: Ensure preloaded data is for current company
              const preloadedIsValid = preloadedMembers.every(member => 
                member.companyId === companyId || member.company === companyName
              );
              
              if (preloadedIsValid) {
                console.log('⚡ [BUYER GROUPS] Using validated preloaded buyer group data for company:', companyName);
                setBuyerGroups(preloadedMembers);
                setLoading(false);
                setIsFetching(false);
                return;
              } else {
                console.log('⚠️ [BUYER GROUPS] Preloaded data invalid for current company');
              }
            }
          } catch (error) {
            console.log('⚠️ [BUYER GROUPS] Failed to parse preloaded data:', error);
          }
        }
        
        // Check general people cache
        const cachedData = safeGetItem(cacheKey, 2 * 60 * 1000); // 2 minutes TTL
        if (cachedData) {
          peopleData = cachedData;
          console.log('📦 [BUYER GROUPS] Using cached people data');
        }
        
        // Only fetch if no cache or cache is stale
        if (peopleData.length === 0) {
          console.log('🔍 [BUYER GROUPS] Fetching fresh buyer group data for company:', companyName, 'ID:', companyId);
          
          // 🚀 ULTRA-FAST: Use dedicated fast buyer group API
          try {
            console.log('🔍 [BUYER GROUPS] Making API call to:', `/api/data/buyer-groups/fast?companyId=${companyId}`);
            console.log('🔍 [BUYER GROUPS] authFetch function:', typeof authFetch);
            const fastResult = await authFetch(`/api/data/buyer-groups/fast?companyId=${companyId}`);
            console.log('🔍 [BUYER GROUPS] API response:', fastResult);
            console.log('🔍 [BUYER GROUPS] API response success:', fastResult?.success);
            console.log('🔍 [BUYER GROUPS] API response data length:', fastResult?.data?.length);
            if (fastResult && fastResult.success && fastResult.data) {
              const members = fastResult.data;
              console.log('⚡ [BUYER GROUPS] Fast API returned:', members.length, 'members');
              console.log('⚡ [BUYER GROUPS] Performance:', fastResult.meta?.processingTime);
              console.log('⚡ [BUYER GROUPS] Members:', members);
              
              // Convert to people format for compatibility
              peopleData = members.map(member => ({
                id: member.id,
                fullName: member.name,
                firstName: member.name.split(' ')[0],
                lastName: member.name.split(' ').slice(1).join(' '),
                company: member.company,
                companyId: companyId,
                jobTitle: member.title,
                email: member.email,
                phone: member.phone,
                linkedinUrl: member.linkedinUrl,
                buyerGroupRole: member.role
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

        // If no people found, show empty state (no hardcoded fallbacks)
        if (uniqueCompanyPeople.length === 0) {
          console.log('🔍 [BUYER GROUPS] No people found in database for this company:', companyName, 'ID:', companyId);
          console.log('🔍 [BUYER GROUPS] peopleData length:', peopleData.length);
          setBuyerGroups([]);
          setLoading(false);
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
        setBuyerGroups(sortedBuyerGroups);
        setLoading(false);
        setIsFetching(false);
        console.log(`Found ${sortedBuyerGroups.length} people from ${companyName}:`, sortedBuyerGroups);
        
      } catch (error) {
        console.error('Error fetching buyer groups:', error);
        setBuyerGroups([]);
        setLoading(false);
        setIsFetching(false);
      }
    };

    fetchBuyerGroups();
    
    // Cleanup function to reset fetching state
    return () => {
      setIsFetching(false);
    };
  }, [record?.id, recordType]); // Depend on both record ID and record type to ensure proper re-fetching

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
      const personUrl = `/${workspaceSlug}/people/${personSlug}`;
      console.log(`🔗 [BUYER GROUPS] Navigating to: ${personUrl}`);
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
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Overview</h3>
        <div className="grid grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--foreground)]">{totalMembers}</div>
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

      {/* Buyer Group Members */}
      {!loading && buyerGroups.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Buyer Group Members</h3>
          <div className="space-y-3">
            {buyerGroups.map((member, index) => {
              const riskAssessment = riskAssessments[member.id] || calculateRiskAssessment({
                name: member.name,
                title: member.title,
                company: member.company,
                tenure: '2-5 years', // Placeholder
                jobChanges: 2, // Placeholder
                industryExperience: '5-10 years', // Placeholder
                education: 'Bachelor\'s', // Placeholder
                location: 'San Francisco, CA' // Placeholder
              } as CareerData);

              return (
                <div key={member.id || index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-[var(--panel-background)] cursor-pointer transition-colors" onClick={() => handleMemberClick(member)}>
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-[var(--loading-bg)] rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-[var(--muted)]">
                        {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-[var(--foreground)]">{member.name}</div>
                      <div className="text-sm text-[var(--muted)]">{member.title}</div>
                      <div className="text-xs text-[var(--muted)]">{member.email}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getRiskPillStyles(riskAssessment.level)}`}>
                      {riskAssessment.level}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      member.role === 'Decision Maker' ? 'bg-red-100 text-red-800' :
                      member.role === 'Champion' ? 'bg-green-100 text-green-800' :
                      member.role === 'Blocker' ? 'bg-yellow-100 text-yellow-800' :
                      member.role === 'Stakeholder' ? 'bg-blue-100 text-blue-800' :
                      'bg-[var(--hover)] text-gray-800'
                    }`}>
                      {member.role}
                    </span>
                    {/* ADD THIS - Buyer Group Status Badge */}
                    {member.buyerGroupStatus && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        member.buyerGroupStatus === 'in' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        member.buyerGroupStatus === 'out' ? 'bg-gray-100 text-gray-600 border border-gray-200' :
                        member.buyerGroupStatus === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-gray-100 text-gray-600'
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
                      'bg-[var(--hover)] text-gray-800'
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
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-[var(--background)]">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-[var(--foreground)]">Add Member</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-[var(--muted)]">
                  This feature is coming soon. You'll be able to add new members to the buyer group.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button 
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 bg-[var(--panel-background)]0 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
