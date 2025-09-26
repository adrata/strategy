"use client";

import React, { useState, useEffect } from 'react';
import { BuildingOfficeIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { InlineEditField } from '../InlineEditField';
import { useRouter } from 'next/navigation';
import { safeSetItem, safeGetItem } from '@/platform/utils/storage/safeLocalStorage';
import { calculateRiskAssessment, getRiskPillStyles, generateRiskDescription, CareerData, RiskAssessment } from '@/platform/utils/riskAssessment';
import { generateSlug } from '@/platform/utils/url-utils';

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
  influence: string;
  isPrimary: boolean;
  company: string;
}

export function UniversalBuyerGroupsTab({ record, recordType, onSave }: UniversalBuyerGroupsTabProps) {
  const [buyerGroups, setBuyerGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [riskAssessments, setRiskAssessments] = useState<Record<string, RiskAssessment>>({});
  const router = useRouter();

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
      console.log('🔍 [BUYER GROUPS DEBUG] Record customFields:', record?.customFields);
      console.log('🔍 [BUYER GROUPS DEBUG] CoreSignal data:', record?.customFields?.coresignalData);
      console.log('🔍 [BUYER GROUPS DEBUG] Key executives:', record?.customFields?.coresignalData?.key_executives);
      
      if (!record?.id) {
        console.log('🔍 [BUYER GROUPS DEBUG] No record ID, setting loading to false');
        setLoading(false);
        return;
      }
      
      // ⚡ PERFORMANCE: Set loading to true but with shorter timeout for better UX
      setLoading(true);
      
      // ⚡ PERFORMANCE: Set a timeout to prevent infinite loading
      const loadingTimeout = setTimeout(() => {
        console.log('⚠️ [BUYER GROUPS] Loading timeout reached, showing empty state');
        setLoading(false);
        setBuyerGroups([]);
      }, 10000); // 10 second timeout
      
      try {
        
        // Get the company name from the record - try multiple sources
        // For person records, we need to get the company from companyId or company object
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
        
        console.log('🔍 [BUYER GROUPS DEBUG] Record type:', recordType);
        console.log('🔍 [BUYER GROUPS DEBUG] Company name:', companyName);
        console.log('🔍 [BUYER GROUPS DEBUG] Company ID:', companyId);
        console.log('🔍 [BUYER GROUPS DEBUG] Record name:', record.name);
        console.log('🔍 [BUYER GROUPS DEBUG] Record company:', record.company);
        console.log('🔍 [BUYER GROUPS DEBUG] Record companyName:', record.companyName);
        
        if (!companyName) {
          console.log('No company found for record, showing empty buyer group');
          setBuyerGroups([]);
          setLoading(false);
          return;
        }
        
        // ⚡ PERFORMANCE: Check if we already have people data in context
        // This avoids unnecessary API calls when data is already available
        const workspaceId = record.workspaceId || '01K5D01YCQJ9TJ7CT4DZDE79T1'; // Correct TOP workspace
        const userId = record.assignedUserId || '01K1VBYXHD0J895XAN0HGFBKJP'; // Use record's assigned user or workspace ID
        
        const cacheKey = `people-${workspaceId}-${userId}`;
        const buyerGroupCacheKey = `buyer-groups-${companyId}-${workspaceId}`;
        let peopleData = [];
        
        // ⚡ PERFORMANCE: Check buyer group specific cache first (faster)
        const buyerGroupCachedData = safeGetItem(buyerGroupCacheKey, 10 * 60 * 1000); // 10 minutes TTL for better performance
        if (buyerGroupCachedData && Array.isArray(buyerGroupCachedData) && buyerGroupCachedData.length > 0) {
          console.log('📦 [BUYER GROUPS] Using cached buyer group data');
          setBuyerGroups(buyerGroupCachedData);
          setLoading(false);
          clearTimeout(loadingTimeout);
          return;
        }
        
        // Check general people cache
        const cachedData = safeGetItem(cacheKey, 2 * 60 * 1000); // 2 minutes TTL
        if (cachedData) {
          peopleData = cachedData;
          console.log('📦 [BUYER GROUPS] Using cached people data');
        }
        
        // Only fetch if no cache or cache is stale
        if (peopleData.length === 0) {
          console.log('🔍 [BUYER GROUPS] Fetching fresh people data');
          
          // ⚡ PERFORMANCE: Try lightweight section API first (faster)
          try {
            const sectionResponse = await fetch(`/api/data/section?section=people&limit=100&workspaceId=${workspaceId}&userId=${userId}`);
            if (sectionResponse.ok) {
              const sectionResult = await sectionResponse.json();
              if (sectionResult.success && sectionResult.data) {
                peopleData = Array.isArray(sectionResult.data) ? sectionResult.data : [];
                console.log('📊 [BUYER GROUPS] Section API returned:', peopleData.length, 'people');
                console.log('⚡ [BUYER GROUPS] Using fast section API');
                
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
                console.log('📦 [BUYER GROUPS] Cached section API data');
              }
            }
          } catch (sectionError) {
            console.log('⚠️ [BUYER GROUPS] Section API failed, falling back to unified API');
          }
          
          // Fallback to unified API if section API failed or returned no data
          if (peopleData.length === 0) {
            const response = await fetch(`/api/data/unified?type=people&action=get&workspaceId=${workspaceId}&userId=${userId}&forceRefresh=true&timestamp=${Date.now()}`);

            if (!response.ok) {
              const errorText = await response.text();
              console.error('API Error:', errorText);
              throw new Error(`Failed to fetch company people: ${response.status} ${errorText}`);
            }

            const result = await response.json();
            if (result.success) {
              peopleData = Array.isArray(result.data) ? result.data : [];
              console.log('📊 [BUYER GROUPS] Unified API returned:', peopleData.length, 'people');
              
              // Cache essential data using safe localStorage
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
              
              const cacheSuccess = safeSetItem(cacheKey, essentialData);
              if (!cacheSuccess) {
                console.warn('Failed to cache people data, continuing without cache');
              }
            } else {
              console.error('Error fetching people data:', result.error);
              throw new Error('Failed to fetch people data');
            }
          }
        }
        
        // Ensure peopleData is an array before filtering
        if (!Array.isArray(peopleData)) {
          console.error('❌ [BUYER GROUPS] peopleData is not an array:', typeof peopleData, peopleData);
          peopleData = [];
        }
        
        // Filter people by company ID or company name
        const companyPeople = peopleData.filter((person: any) => {
          const personCompanyName = person.company?.name || person.company;
          const personCompanyId = person.companyId;
          
          // Match by company ID (most reliable) or company name
          const matches = personCompanyId === companyId || personCompanyName === companyName;
          
          if (matches) {
            console.log(`🔍 [BUYER GROUPS] Found matching person: ${person.fullName} (Company ID: ${personCompanyId}, Company Name: ${personCompanyName})`);
          }
          
          return matches;
        });

        // Remove duplicates based on person ID
        const uniqueCompanyPeople = companyPeople.filter((person: any, index: number, self: any[]) => 
          index === self.findIndex((p: any) => p.id === person.id)
        );
        
        console.log(`🔍 [BUYER GROUPS] After deduplication: ${uniqueCompanyPeople.length} unique people (was ${companyPeople.length})`);
        
        console.log(`🔍 [BUYER GROUPS] Filtered ${uniqueCompanyPeople.length} people for company ${companyName} (ID: ${companyId})`);
        console.log(`🔍 [BUYER GROUPS] All people data:`, peopleData.slice(0, 3)); // Show first 3 people for debugging
        console.log(`🔍 [BUYER GROUPS] Company name being searched: "${companyName}"`);
        console.log(`🔍 [BUYER GROUPS] Record ID: "${record.id}"`);
        console.log(`🔍 [BUYER GROUPS] Workspace ID: "${workspaceId}"`);
        console.log(`🔍 [BUYER GROUPS] User ID: "${userId}"`);
        console.log(`🔍 [BUYER GROUPS] Total people fetched: ${peopleData.length}`);
        
        // Debug: Show all people with their company IDs
        peopleData.forEach((person, index) => {
          console.log(`🔍 [BUYER GROUPS] Person ${index + 1}: ${person.fullName}, Company ID: ${person.companyId}, Company Name: ${person.company?.name || person.company}`);
        });

        // If no people found in database, check for CoreSignal people data
        let coresignalPeople = [];
        console.log('🔍 [BUYER GROUPS DEBUG] Checking CoreSignal data...');
        console.log('🔍 [BUYER GROUPS DEBUG] uniqueCompanyPeople.length:', uniqueCompanyPeople.length);
        console.log('🔍 [BUYER GROUPS DEBUG] record?.customFields?.coresignalData?.key_executives:', record?.customFields?.coresignalData?.key_executives);
        
        // Define buyer group role function early
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

        // If no people found, show empty state (no hardcoded fallbacks)
        if (uniqueCompanyPeople.length === 0) {
          console.log('🔍 [BUYER GROUPS] No people found in database for this company');
          setBuyerGroups([]);
          setLoading(false);
          return;
        }

        // Only use real database data - no fallback creation
        if (false && uniqueCompanyPeople.length === 0 && record?.customFields?.coresignalData?.key_executives) {
          console.log('🔍 [BUYER GROUPS] Still no people, checking CoreSignal data');
          
          // Create people and prospect records for CoreSignal executives
          const coresignalExecutives = record.customFields.coresignalData.key_executives;
          console.log(`🔍 [BUYER GROUPS] Creating records for ${coresignalExecutives.length} CoreSignal executives`);
          
          // Create real database records for CoreSignal executives
          console.log(`🔍 [BUYER GROUPS] Creating real database records for ${coresignalExecutives.length} executives`);
          
          for (const exec of coresignalExecutives) {
            try {
              // Create person record
              const personData = {
                firstName: exec.member_full_name.split(' ')[0] || 'Unknown',
                lastName: exec.member_full_name.split(' ').slice(1).join(' ') || 'Unknown',
                fullName: exec.member_full_name,
                title: exec.member_position_title,
                email: `${exec.member_full_name.toLowerCase().replace(/\s+/g, '.')}@5bars.net`, // Estimated email
                department: exec.member_position_title.includes('CEO') || exec.member_position_title.includes('President') ? 'Executive' : 'Operations',
                companyId: record.id,
                workspaceId: record.workspaceId || '01K5D01YCQJ9TJ7CT4DZDE79T1',
                tags: ['External Data Source', 'Buyer Group Member'],
                customFields: {
                  coresignalId: exec.parent_id,
                  buyerGroupRole: exec.member_position_title.includes('CEO') || exec.member_position_title.includes('President') ? 'Decision Maker' : 'Champion',
                  influenceLevel: 'High',
                  engagementPriority: 'High',
                  dataSource: 'External'
                }
              };

              const personResponse = await fetch('/api/data/unified', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'people',
                  action: 'create',
                  data: personData
                })
              });

              if (personResponse.ok) {
                const personResult = await personResponse.json();
                console.log(`✅ Created person record: ${exec.member_full_name} (ID: ${personResult.data?.id})`);
                
                // Create prospect record
                const prospectData = {
                  firstName: personData.firstName,
                  lastName: personData.lastName,
                  fullName: personData.fullName,
                  title: personData.title,
                  email: personData.email,
                  company: companyName,
                  companyId: companyId,
                  personId: personResult.data?.id,
                  workspaceId: record.workspaceId || '01K5D01YCQJ9TJ7CT4DZDE79T1',
                  tags: ['External Data Source', 'Buyer Group Member', 'Cold Relationship'],
                  customFields: {
                    coresignalId: exec.parent_id,
                    buyerGroupRole: personData.customFields.buyerGroupRole,
                    influenceLevel: 'High',
                    engagementPriority: 'High',
                    dataSource: 'External'
                  }
                };

                const prospectResponse = await fetch('/api/data/unified', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'prospects',
                    action: 'create',
                    data: prospectData
                  })
                });

                if (prospectResponse.ok) {
                  const prospectResult = await prospectResponse.json();
                  console.log(`✅ Created prospect record: ${exec.member_full_name} (ID: ${prospectResult.data?.id})`);
                } else {
                  console.log(`⚠️ Failed to create prospect record for: ${exec.member_full_name}`);
                }
              } else {
                console.log(`⚠️ Failed to create person record for: ${exec.member_full_name}`);
              }
            } catch (error) {
              console.error(`❌ Error creating records for ${exec.member_full_name}:`, error);
            }
          }

          // Now fetch the newly created people
          console.log('🔍 [BUYER GROUPS] Fetching newly created people records...');
          const newPeopleResponse = await fetch(`/api/data/unified?type=people&action=get&workspaceId=${record.workspaceId || '01K5D01YCQJ9TJ7CT4DZDE79T1'}&userId=${record.userId || '01K1VBYZG41K9QA0D9CF06KNRG'}`);
          
          if (newPeopleResponse.ok) {
            const newPeopleResult = await newPeopleResponse.json();
            if (newPeopleResult.success) {
              const newPeopleData = newPeopleResult.data || [];
              const newCompanyPeople = newPeopleData.filter((person: any) => person.companyId === companyId);
              console.log(`🔍 [BUYER GROUPS] Found ${newCompanyPeople.length} newly created people for this company`);
              
              // Update the uniqueCompanyPeople array to include the newly created people
              uniqueCompanyPeople.push(...newCompanyPeople);
              console.log(`🔍 [BUYER GROUPS] Total company people after creation: ${uniqueCompanyPeople.length}`);
            }
          }
          
          // Force a re-render by updating the state immediately
          if (uniqueCompanyPeople.length > 0) {
            console.log('🔍 [BUYER GROUPS] Setting buyer groups immediately with created people');
            const buyerGroupMembers = uniqueCompanyPeople.map((person: any) => {
              const jobTitle = person.title || person.jobTitle || '';
              const buyerRole = getBuyerGroupRole(jobTitle);
              
              return {
                id: person.id,
                name: person.fullName || `${person.firstName} ${person.lastName}`,
                title: jobTitle,
                email: person.email || person.workEmail || '',
                phone: person.phone || person.mobilePhone || '',
                role: buyerRole,
                influence: buyerRole === 'Decision Maker' ? 'high' : buyerRole === 'Influencer' ? 'medium' : 'low',
                isPrimary: false,
                company: companyName,
                isExternalData: person.customFields?.dataSource === 'External' || false,
                externalId: person.customFields?.coresignalId || null,
                rank: person.rank || 999 // Include rank field for sorting
              };
            });
            
            setBuyerGroups(buyerGroupMembers);
            setLoading(false);
            return; // Exit early since we've set the buyer groups
          }
        } else {
          console.log('🔍 [BUYER GROUPS DEBUG] Not using CoreSignal data - uniqueCompanyPeople.length:', uniqueCompanyPeople.length, 'key_executives exists:', !!record?.customFields?.coresignalData?.key_executives);
        }
        
        // Transform people data to buyer group format

        // Use the database people (which now includes newly created records)
        const allPeople = uniqueCompanyPeople;
        
        const buyerGroupMembers = allPeople.map((person: any) => {
          // Check multiple possible ID matches
          const isPrimary = person.id === record.id || 
                           person.id === record.personId || 
                           person.fullName === record.fullName ||
                           (person.firstName === record.firstName && person.lastName === record.lastName);
          console.log(`Checking if ${person.fullName || person.firstName} (${person.id}) is primary against record.id (${record.id}), record.personId (${record.personId}), record.fullName (${record.fullName}): ${isPrimary}`);
          
          const jobTitle = person.title || person.jobTitle || '';
          
          // Use database-stored role first, then fallback to client-side assignment
          const storedRole = person.customFields?.buyerGroupRole || person.buyerGroupRole;
          const buyerRole = storedRole || getBuyerGroupRole(jobTitle);
          
          return {
            id: person.id,
            name: person.fullName || `${person.firstName} ${person.lastName}`,
            title: jobTitle,
            email: person.email || person.workEmail || '',
            phone: person.phone || person.mobilePhone || '',
            role: buyerRole,
            influence: buyerRole === 'Decision Maker' ? 'high' : buyerRole === 'Influencer' ? 'medium' : 'low',
            isPrimary: isPrimary, // Current person is primary
            company: companyName,
            isExternalData: person.customFields?.dataSource === 'External' || false,
            externalId: person.customFields?.coresignalId || null,
            rank: person.rank || 999 // Include rank field for sorting
          };
        });

        // Ensure every company has at least one Decision Maker
        const hasDecisionMaker = buyerGroupMembers.some(member => member.role === 'Decision Maker');
        if (!hasDecisionMaker && buyerGroupMembers.length > 0) {
          console.log('🔍 [BUYER GROUPS] No Decision Maker found, assigning first person as Decision Maker');
          // Assign the first person (highest rank) as Decision Maker
          buyerGroupMembers[0].role = 'Decision Maker';
          buyerGroupMembers[0].influence = 'high';
        }

        // 🎯 IMPROVE BUYER GROUP STRUCTURE
        // Create proper buyer group hierarchy based on actual employment data and job titles
        const improvedBuyerGroups = createProperBuyerGroupStructure(buyerGroupMembers, companyName);
        
        // Update the buyer group members with improved structure
        buyerGroupMembers.splice(0, buyerGroupMembers.length, ...improvedBuyerGroups);

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
          // Primary sort: by role priority (Decision Maker first, then Champion, etc.)
          const aRolePriority = rolePriority[a.role] || 8;
          const bRolePriority = rolePriority[b.role] || 8;
          
          if (aRolePriority !== bRolePriority) {
            return aRolePriority - bRolePriority;
          }
          
          // Secondary sort: by rank (if roles are the same)
          const aRank = a.rank || 999;
          const bRank = b.rank || 999;
          
          if (aRank !== bRank) {
            return aRank - bRank;
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
        
        // ⚡ PERFORMANCE: Cache the processed buyer group data for faster future loads
        const cacheSuccess = safeSetItem(buyerGroupCacheKey, sortedBuyerGroups);
        if (!cacheSuccess) {
          console.warn('Failed to cache buyer group data, continuing without cache');
        }
        
        setBuyerGroups(sortedBuyerGroups);
        setLoading(false);
        clearTimeout(loadingTimeout); // Clear the timeout since we got data
        console.log(`Found ${sortedBuyerGroups.length} people from ${companyName}:`, sortedBuyerGroups);
      } catch (error) {
        console.error('Error fetching buyer groups:', error);
        setBuyerGroups([]);
        setLoading(false);
        clearTimeout(loadingTimeout); // Clear the timeout on error too
      } finally {
        // Loading complete
      }
    };

    fetchBuyerGroups();
  }, [record, recordType]);

  const handleInlineSave = async (field: string, value: string, recordId?: string, recordTypeParam?: string) => {
    if (onSave) {
      await onSave(field, value);
    }
  };

  const handleMemberClick = async (member: any) => {
    console.log('Clicking on member:', member);
    try {
      // Navigate directly to people record
      const peopleSlug = `${member.name.toLowerCase().replace(/\s+/g, '-')}-${member.id}`;
      console.log('Navigating directly to people record:', `/top/people/${peopleSlug}`);
      router.push(`/top/people/${peopleSlug}`);
    } catch (error) {
      console.error('Error navigating to member record:', error);
      // Fallback to people record with proper URL structure
      const peopleSlug = `${member.name.toLowerCase().replace(/\s+/g, '-')}-${member.id}`;
      console.log('Error occurred, fallback to people record:', `/top/people/${peopleSlug}`);
      router.push(`/top/people/${peopleSlug}`);
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

  /**
   * 🎯 CREATE PROPER BUYER GROUP STRUCTURE
   * 
   * Creates a proper buyer group hierarchy based on actual employment data and job titles
   */
  const createProperBuyerGroupStructure = (buyerGroupMembers: any[], companyName: string) => {
    console.log('🎯 [BUYER GROUPS] Creating proper buyer group structure for', companyName);
    
    const improvedMembers = [...buyerGroupMembers];
    
    // Step 1: Verify employment and filter out people who don't actually work at this company
    const verifiedMembers = improvedMembers.filter(member => {
      // Check if person actually works at the company based on employment data
      const actualCompany = member.customFields?.coresignalData?.active_experience_company_name || 
                           member.customFields?.enrichedData?.career?.currentCompany ||
                           member.company;
      
      const emailDomain = member.email?.split('@')[1];
      const companyEmailDomain = companyName.toLowerCase().replace(/\s+/g, '') + '.com';
      
      // Verify employment through multiple data points
      const isEmployedHere = actualCompany === companyName || 
                            emailDomain === companyEmailDomain ||
                            member.company === companyName;
      
      if (!isEmployedHere) {
        console.log('⚠️ [BUYER GROUPS] Removing person who does not work at', companyName, ':', {
          name: member.name,
          actualCompany: actualCompany,
          emailDomain: emailDomain,
          assignedCompany: member.company
        });
        return false;
      }
      
      return true;
    });
    
    console.log('✅ [BUYER GROUPS] Employment verification complete:', {
      originalCount: improvedMembers.length,
      verifiedCount: verifiedMembers.length,
      removedCount: improvedMembers.length - verifiedMembers.length
    });
    
    // Step 2: Identify Decision Makers (C-level, VPs, Directors) based on actual job titles
    const decisionMakers = verifiedMembers.filter(member => {
      const title = (member.title || member.customFields?.enrichedData?.career?.currentRole || '').toLowerCase();
      const managementLevel = member.customFields?.coresignalData?.active_experience_management_level || '';
      
      return title.includes('ceo') || title.includes('president') || 
             title.includes('vp') || title.includes('vice president') ||
             title.includes('director') || title.includes('head of') ||
             title.includes('cfo') || title.includes('cto') || 
             title.includes('cmo') || title.includes('coo') ||
             managementLevel.includes('executive') || managementLevel.includes('senior');
    });
    
    // Step 3: Identify Champions (Engineers, Technical roles) based on actual experience
    const champions = verifiedMembers.filter(member => {
      const title = (member.title || member.customFields?.enrichedData?.career?.currentRole || '').toLowerCase();
      const skills = member.customFields?.enrichedData?.career?.skills || [];
      const department = member.customFields?.enrichedData?.career?.department || '';
      
      return title.includes('engineer') || title.includes('developer') ||
             title.includes('architect') || title.includes('consultant') ||
             title.includes('advisor') || title.includes('expert') ||
             title.includes('technical') || title.includes('telecommunications') ||
             title.includes('electrician') || title.includes('technician') ||
             skills.some(skill => skill.includes('solar') || skill.includes('energy')) ||
             department.includes('trades') || department.includes('technical');
    });
    
    // Step 4: Identify Blockers (Legal, Compliance, Security) based on actual roles
    const blockers = verifiedMembers.filter(member => {
      const title = (member.title || member.customFields?.enrichedData?.career?.currentRole || '').toLowerCase();
      const department = member.customFields?.enrichedData?.career?.department || '';
      
      return title.includes('legal') || title.includes('compliance') ||
             title.includes('security') || title.includes('procurement') ||
             title.includes('purchasing') || title.includes('regulatory') ||
             department.includes('legal') || department.includes('compliance');
    });
    
    // Step 5: Identify Introducers (Sales, Marketing, Business Development) based on actual experience
    const introducers = verifiedMembers.filter(member => {
      const title = (member.title || member.customFields?.enrichedData?.career?.currentRole || '').toLowerCase();
      const department = member.customFields?.enrichedData?.career?.department || '';
      const experience = member.customFields?.coresignalData?.total_experience_duration_months_breakdown_department || [];
      
      return title.includes('sales') || title.includes('marketing') ||
             title.includes('business development') || title.includes('partnership') ||
             title.includes('account') || title.includes('relationship') ||
             department.includes('sales') || department.includes('marketing') ||
             experience.some(exp => exp.department === 'Sales');
    });
    
    // Step 6: Assign roles based on comprehensive analysis
    verifiedMembers.forEach(member => {
      if (decisionMakers.includes(member)) {
        member.role = 'Decision Maker';
        member.influence = 'high';
      } else if (champions.includes(member)) {
        member.role = 'Champion';
        member.influence = 'high';
      } else if (blockers.includes(member)) {
        member.role = 'Blocker';
        member.influence = 'medium';
      } else if (introducers.includes(member)) {
        member.role = 'Introducer';
        member.influence = 'medium';
      } else {
        // Default to Stakeholder for others
        member.role = 'Stakeholder';
        member.influence = 'low';
      }
    });
    
    // Step 7: Ensure at least one Decision Maker (promote highest-ranking person)
    const hasDecisionMaker = verifiedMembers.some(member => member.role === 'Decision Maker');
    if (!hasDecisionMaker && verifiedMembers.length > 0) {
      console.log('🎯 [BUYER GROUPS] No Decision Maker found, promoting highest-ranking person');
      const highestRanking = verifiedMembers.sort((a, b) => (a.rank || 999) - (b.rank || 999))[0];
      highestRanking.role = 'Decision Maker';
      highestRanking.influence = 'high';
    }
    
    // Step 8: Ensure at least one Champion (promote technical person)
    const hasChampion = verifiedMembers.some(member => member.role === 'Champion');
    if (!hasChampion && verifiedMembers.length > 1) {
      console.log('🎯 [BUYER GROUPS] No Champion found, promoting technical person');
      const technicalPerson = verifiedMembers.find(member => 
        member.role !== 'Decision Maker' && 
        (member.title?.toLowerCase().includes('engineer') || 
         member.title?.toLowerCase().includes('electrician') ||
         member.title?.toLowerCase().includes('technician'))
      );
      if (technicalPerson) {
        technicalPerson.role = 'Champion';
        technicalPerson.influence = 'high';
      }
    }
    
    console.log('🎯 [BUYER GROUPS] Final structure for', companyName, ':', {
      totalMembers: verifiedMembers.length,
      decisionMakers: verifiedMembers.filter(m => m.role === 'Decision Maker').length,
      champions: verifiedMembers.filter(m => m.role === 'Champion').length,
      stakeholders: verifiedMembers.filter(m => m.role === 'Stakeholder').length,
      blockers: verifiedMembers.filter(m => m.role === 'Blocker').length,
      introducers: verifiedMembers.filter(m => m.role === 'Introducer').length
    });
    
    return verifiedMembers;
  };

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overview</h3>
        <div className="grid grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalMembers}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{decisionMakers}</div>
            <div className="text-sm text-gray-600">Decision Makers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{champions}</div>
            <div className="text-sm text-gray-600">Champions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stakeholders}</div>
            <div className="text-sm text-gray-600">Stakeholders</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{blockers}</div>
            <div className="text-sm text-gray-600">Blockers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{introducers}</div>
            <div className="text-sm text-gray-600">Introducers</div>
          </div>
        </div>
      </div>

      {/* Buyer Group Members */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Buyer Group Members</h3>
        {loading ? (
          <div className="space-y-4">
            {/* Loading Skeleton for Buyer Group Members */}
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                    <div>
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                {/* Directional Intelligence Skeleton */}
                <div className="space-y-4">
                  <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="text-center">
                        <div className="h-3 w-12 bg-gray-200 rounded animate-pulse mx-auto mb-1"></div>
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mx-auto"></div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Risk Assessment Skeleton */}
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                    <div className="h-3 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  
                  {/* Pain Points and Interests Skeleton */}
                  <div className="space-y-3">
                    <div>
                      <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="h-6 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : buyerGroups['length'] === 0 ? (
          <div className="text-center py-8">
            <div className="text-sm text-gray-500">
              No people found for {(typeof record.company === 'object' && record.company !== null ? record.company.name : record.company) || record.companyName || 'this company'}.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {buyerGroups.map((person) => {
              const riskAssessment = riskAssessments[person.id];
              return (
                <div 
                  key={person.id} 
                  onClick={() => handlePersonClick(person)}
                  className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {person.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{person.name}</div>
                        <div className="text-sm text-gray-600">{person.title}</div>
                        {/* Buyer Group Role under the name */}
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                          person.role === 'Decision Maker' ? 'bg-gray-100 text-gray-800' :
                          person.role === 'Champion' ? 'bg-gray-100 text-gray-800' :
                          person.role === 'Blocker' ? 'bg-gray-100 text-gray-800' :
                          person.role === 'Stakeholder' ? 'bg-gray-100 text-gray-800' :
                          person.role === 'Introducer' ? 'bg-gray-100 text-gray-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {person.role}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Risk Assessment Pill */}
                      {riskAssessment && riskAssessment.riskLevel !== 'LOW' && (
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRiskPillStyles(riskAssessment.riskLevel)}`}>
                          {riskAssessment.riskLevel === 'CRITICAL' ? '🚨' : 
                           riskAssessment.riskLevel === 'HIGH' ? '⚠️' : 
                           riskAssessment.riskLevel === 'MEDIUM' ? '⚡' : ''}
                          {riskAssessment.riskLevel} Risk
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Directional Intelligence */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Directional Intelligence</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Engagement</div>
                        <div className="text-sm font-medium text-gray-600">High</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Influence</div>
                        <div className="text-sm font-medium text-gray-600">High</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Budget Authority</div>
                        <div className="text-sm font-medium text-gray-600">Medium</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Timeline</div>
                        <div className="text-sm font-medium text-gray-600">Immediate</div>
                      </div>
                    </div>

                    {/* Risk Assessment Details */}
                    {riskAssessment && riskAssessment.riskLevel !== 'LOW' && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-gray-700">Risk Assessment</span>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskPillStyles(riskAssessment.riskLevel)}`}>
                            {riskAssessment.riskLevel} Risk ({riskAssessment.riskScore}%)
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{riskAssessment.description}</p>
                        {riskAssessment.factors.length > 0 && (
                          <div className="text-xs text-gray-500">
                            <strong>Factors:</strong> {riskAssessment.factors.slice(0, 2).join(', ')}
                            {riskAssessment.factors.length > 2 && ` +${riskAssessment.factors.length - 2} more`}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pain Points */}
                    <div className="mb-4">
                      <div className="text-xs text-gray-600 mb-2">Pain Points</div>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Budget constraints</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">ROI justification</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Implementation timing</span>
                      </div>
                    </div>

                    {/* Interests */}
                    <div>
                      <div className="text-xs text-gray-600 mb-2">Interests</div>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Cost savings</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Efficiency gains</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Competitive advantage</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Member Modal Placeholder */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Add Member</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Add member functionality will be implemented here.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
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