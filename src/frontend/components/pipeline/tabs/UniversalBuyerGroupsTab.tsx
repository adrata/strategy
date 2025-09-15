"use client";

import React, { useState, useEffect } from 'react';
import { BuildingOfficeIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { InlineEditField } from '../InlineEditField';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

  useEffect(() => {
    const fetchBuyerGroups = async () => {
      if (!record?.id) {
        setLoading(false);
        return;
      }
      
      try {
        // Instant loading - no spinner needed
        
        // Get the company name from the record
        const companyName = record.company || record.companyName;
        
        if (!companyName) {
          console.log('No company found for record, showing empty buyer group');
          setBuyerGroups([]);
          setLoading(false);
          return;
        }
        
        // ⚡ PERFORMANCE: Check if we already have people data in context
        // This avoids unnecessary API calls when data is already available
        const workspaceId = record.workspaceId || '01K1VBYXHD0J895XAN0HGFBKJP';
        const userId = '01K1VBYZG41K9QA0D9CF06KNRG';
        
        // Try to get people data from localStorage cache first
        const cacheKey = `people-${workspaceId}-${userId}`;
        const cachedData = localStorage.getItem(cacheKey);
        
        let peopleData = [];
        
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            if (parsed.timestamp && Date.now() - parsed.timestamp < 300000) { // 5 minute cache
              peopleData = parsed.data || [];
              console.log('⚡ [BUYER GROUPS] Using cached people data');
            }
          } catch (e) {
            console.log('Cache parse error, fetching fresh data');
          }
        }
        
        // Only fetch if no cache or cache is stale
        if (peopleData.length === 0) {
          console.log('🔍 [BUYER GROUPS] Fetching fresh people data');
          const response = await fetch(`/api/data/unified?type=people&action=get&workspaceId=${workspaceId}&userId=${userId}`);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            throw new Error(`Failed to fetch company people: ${response.status} ${errorText}`);
          }

          const result = await response.json();
          if (result.success) {
            peopleData = result.data || [];
            
            // Cache the data
            localStorage.setItem(cacheKey, JSON.stringify({
              data: peopleData,
              timestamp: Date.now()
            }));
          } else {
            console.error('Error fetching people data:', result.error);
            throw new Error('Failed to fetch people data');
          }
        }
        
        // Filter people by company name
        const companyPeople = peopleData.filter((person: any) => {
          const personCompanyName = person.company?.name || person.company;
          return personCompanyName === companyName;
        });
        
        // Transform people data to buyer group format
        const getBuyerGroupRole = (jobTitle: string) => {
          if (!jobTitle) return 'Team Member';
          
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
          
          // Influencers
          if (title.includes('manager') || title.includes('lead') || title.includes('senior')) {
            return 'Influencer';
          }
          if (title.includes('analyst') || title.includes('specialist') || title.includes('coordinator')) {
            return 'Influencer';
          }
          
          // Champions
          if (title.includes('sales') || title.includes('business development') || title.includes('partnership')) {
            return 'Champion';
          }
          
          // Blockers
          if (title.includes('legal') || title.includes('compliance') || title.includes('security') || title.includes('risk')) {
            return 'Blocker';
          }
          if (title.includes('procurement') || title.includes('purchasing') || title.includes('vendor')) {
            return 'Blocker';
          }
          
          // Introducers
          if (title.includes('marketing') || title.includes('communications') || title.includes('pr')) {
            return 'Introducer';
          }
          if (title.includes('events') || title.includes('conference') || title.includes('networking')) {
            return 'Introducer';
          }
          
          // Gatekeepers
          if (title.includes('admin') || title.includes('assistant') || title.includes('coordinator')) {
            return 'Gatekeeper';
          }
          
          return 'Team Member';
        };

        const buyerGroupMembers = companyPeople.map((person: any) => {
          // Check multiple possible ID matches
          const isPrimary = person.id === record.id || 
                           person.id === record.personId || 
                           person.fullName === record.fullName ||
                           (person.firstName === record.firstName && person.lastName === record.lastName);
          console.log(`Checking if ${person.fullName || person.firstName} (${person.id}) is primary against record.id (${record.id}), record.personId (${record.personId}), record.fullName (${record.fullName}): ${isPrimary}`);
          
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
            isPrimary: isPrimary, // Current person is primary
            company: companyName
          };
        });

        // Rank buyer groups: Decision Makers > Champions > Stakeholders > Introducers
        const rolePriority = {
          'Decision Maker': 1,
          'Champion': 2,
          'Influencer': 3,
          'Stakeholder': 4,
          'Introducer': 5,
          'Gatekeeper': 6,
          'Blocker': 7,
          'Team Member': 8
        };

        const sortedBuyerGroups = buyerGroupMembers.sort((a, b) => {
          const aPriority = rolePriority[a.role] || 8;
          const bPriority = rolePriority[b.role] || 8;
          
          // If same priority, sort by name
          if (aPriority === bPriority) {
            return a.name.localeCompare(b.name);
          }
          
          return aPriority - bPriority;
        });
        
        setBuyerGroups(sortedBuyerGroups);
        console.log(`Found ${sortedBuyerGroups.length} people from ${companyName}:`, sortedBuyerGroups);
      } catch (error) {
        console.error('Error fetching buyer groups:', error);
        setBuyerGroups([]);
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
      const workspaceId = record.workspaceId || '01K1VBYXHD0J895XAN0HGFBKJP';
      const userId = '01K1VBYZG41K9QA0D9CF06KNRG';
      
      // First, try to find a lead record for this person using GET request
      console.log('Looking for lead with personId:', member.id);
      const leadResponse = await fetch(`/api/data/unified?type=leads&action=get&workspaceId=${workspaceId}&userId=${userId}&filters=${encodeURIComponent(JSON.stringify({ personId: member.id }))}`);

      if (leadResponse.ok) {
        const leadResult = await leadResponse.json();
        console.log('Lead search result:', leadResult);
        if (leadResult['success'] && leadResult.data.length > 0) {
          const lead = leadResult['data'][0];
          console.log('Found lead, navigating to:', `/leads/${lead.id}`);
          router.push(`/leads/${lead.id}`);
          return;
        }
      }

      // If no lead found, try to find a prospect record using GET request
      console.log('Looking for prospect with personId:', member.id);
      const prospectResponse = await fetch(`/api/data/unified?type=prospects&action=get&workspaceId=${workspaceId}&userId=${userId}&filters=${encodeURIComponent(JSON.stringify({ personId: member.id }))}`);

      if (prospectResponse.ok) {
        const prospectResult = await prospectResponse.json();
        console.log('Prospect search result:', prospectResult);
        if (prospectResult['success'] && prospectResult.data.length > 0) {
          const prospect = prospectResult['data'][0];
          console.log('Found prospect, navigating to:', `/prospects/${prospect.id}`);
          router.push(`/prospects/${prospect.id}`);
          return;
        }
      }

      // If no lead or prospect found, navigate to people record
      console.log('No lead/prospect found, navigating to people record:', `/people/${member.id}`);
      router.push(`/people/${member.id}`);
    } catch (error) {
      console.error('Error navigating to member record:', error);
      // Fallback to people record
      console.log('Error occurred, fallback to people record:', `/people/${member.id}`);
      router.push(`/people/${member.id}`);
    }
  };


  // No loading spinner - instant display

  return (
    <div className="space-y-0">

      {/* Company People */}
      {buyerGroups['length'] === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="space-y-4">
            <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">No team members found</h3>
              <p className="text-sm text-gray-500">
                No people found for {record.company || record.companyName || 'this company'}.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {buyerGroups.map((person) => {
            const isCurrentPerson = person.isPrimary;
            return (
              <div 
                key={person.id} 
                className={`flex items-center p-4 rounded-lg cursor-pointer transition-colors ${
                  isCurrentPerson 
                    ? 'bg-blue-50 border-2 border-blue-500 shadow-sm' 
                    : 'bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
                onClick={() => handleMemberClick(person)}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex-shrink-0">
                    <div className={`w-7 h-7 rounded flex items-center justify-center border ${
                      isCurrentPerson ? 'bg-white border-gray-300' : 'bg-gray-300 border-gray-400'
                    }`}>
                      <span className={`font-semibold text-xs ${
                        isCurrentPerson ? 'text-gray-700' : 'text-white'
                      }`}>
                        {person.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className={`text-sm font-medium truncate ${
                        isCurrentPerson ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {person.name}
                      </p>
                      {isCurrentPerson && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Current
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${isCurrentPerson ? 'text-blue-700' : 'text-gray-600'}`}>
                      {person.title}
                    </p>
                    <p className={`text-xs ${isCurrentPerson ? 'text-blue-600' : 'text-gray-500'}`}>
                      {person.role}
                    </p>
                  </div>
                </div>
                {person.email && (
                  <div className="flex items-center text-xs text-gray-500">
                    <EnvelopeIcon className="w-3 h-3 mr-1" />
                    {person.email}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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