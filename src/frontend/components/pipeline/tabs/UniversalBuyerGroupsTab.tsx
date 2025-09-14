"use client";

import React, { useState, useEffect } from 'react';
import { PlusIcon, UserIcon, BuildingOfficeIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';
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
  const [loading, setLoading] = useState(true);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchBuyerGroups = async () => {
      if (!record?.id) return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/data/unified', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: recordType,
            action: 'get_buyer_groups',
            id: record.id,
            workspaceId: record.workspaceId || '01K1VBYXHD0J895XAN0HGFBKJP',
            userId: '01K1VBYZG41K9QA0D9CF06KNRG'
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch buyer groups');
        }

        const result = await response.json();
        if (result.success) {
          setBuyerGroups(result.data || []);
        } else {
          console.error('Error fetching buyer groups:', result.error);
          setBuyerGroups([]);
        }
      } catch (error) {
        console.error('Error fetching buyer groups:', error);
        setBuyerGroups([]);
      } finally {
        setLoading(false);
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
    try {
      // First, try to find a lead record for this person
      const leadResponse = await fetch('/api/data/unified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'leads',
          action: 'get',
          filters: { personId: member.id },
          workspaceId: record.workspaceId || '01K1VBYXHD0J895XAN0HGFBKJP',
          userId: '01K1VBYZG41K9QA0D9CF06KNRG'
        }),
      });

      if (leadResponse.ok) {
        const leadResult = await leadResponse.json();
        if (leadResult['success'] && leadResult.data.length > 0) {
          const lead = leadResult['data'][0];
          router.push(`/leads/${lead.id}`);
          return;
        }
      }

      // If no lead found, try to find a prospect record
      const prospectResponse = await fetch('/api/data/unified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'prospects',
          action: 'get',
          filters: { personId: member.id },
          workspaceId: record.workspaceId || '01K1VBYXHD0J895XAN0HGFBKJP',
          userId: '01K1VBYZG41K9QA0D9CF06KNRG'
        }),
      });

      if (prospectResponse.ok) {
        const prospectResult = await prospectResponse.json();
        if (prospectResult['success'] && prospectResult.data.length > 0) {
          const prospect = prospectResult['data'][0];
          router.push(`/prospects/${prospect.id}`);
          return;
        }
      }

      // If no lead or prospect found, navigate to people record
      router.push(`/people/${member.id}`);
    } catch (error) {
      console.error('Error navigating to member record:', error);
      // Fallback to people record
      router.push(`/people/${member.id}`);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'decision maker':
      case 'co-decision maker':
        return 'bg-red-100 text-red-800';
      case 'champion':
        return 'bg-green-100 text-green-800';
      case 'stakeholder':
        return 'bg-blue-100 text-blue-800';
      case 'blocker':
        return 'bg-yellow-100 text-yellow-800';
      case 'introducer':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInfluenceColor = (influence: string) => {
    switch (influence.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Buyer Group</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage decision-making groups and stakeholders for this opportunity
          </p>
        </div>
        <button
          onClick={() => setShowAddMemberModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Member
        </button>
      </div>

      {/* Buyer Groups */}
      {buyerGroups['length'] === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="space-y-4">
            <BuildingOfficeIcon className="mx-auto h-8 w-8 text-gray-400" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">No buyer group yet</h3>
              <p className="text-sm text-gray-500 mt-1">
                Add members to create a buyer group for this record.
              </p>
            </div>
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Member
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {buyerGroups.map((group) => (
            <div key={group.id} className="bg-white border border-gray-200 rounded-lg p-6">
              {/* Group Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{group.name}</h4>
                  <p className="text-sm text-gray-600">{group.description}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    group['status'] === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {group.status}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    group['priority'] === 'high' ? 'bg-red-100 text-red-800' :
                    group['priority'] === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {group.priority} priority
                  </span>
                </div>
              </div>

              {/* Group Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                  <p className="text-sm text-gray-900">{group.purpose}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Value</label>
                  <p className="text-sm text-gray-900">${group.estimatedValue?.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Members</label>
                  <p className="text-sm text-gray-900">{group.people?.length || 0} people</p>
                </div>
              </div>

              {/* Members */}
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-3">Group Members</h5>
                <div className="space-y-3">
                  {group.people?.map((memberRelation: any) => {
                    const member = memberRelation.person;
                    const memberData = memberRelation;
                    return (
                      <div 
                        key={member.id} 
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleMemberClick(member)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <UserIcon className="w-5 h-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {member.fullName}
                                {memberData['isPrimary'] && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    Primary
                                  </span>
                                )}
                              </p>
                            </div>
                            <p className="text-sm text-gray-600">{member.jobTitle || 'No title'}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="flex items-center text-xs text-gray-500">
                                <EnvelopeIcon className="w-3 h-3 mr-1" />
                                {member.email || member.workEmail || 'No email'}
                              </div>
                              {(member.phone || member.mobilePhone) && (
                                <div className="flex items-center text-xs text-gray-500">
                                  <PhoneIcon className="w-3 h-3 mr-1" />
                                  {member.phone || member.mobilePhone}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(memberData.role || 'Unknown')}`}>
                            {memberData.role || 'Unknown'}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInfluenceColor(memberData.influence || 'medium')}`}>
                            {memberData.influence || 'medium'} influence
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Member Modal Placeholder */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Member to Buyer Group</h3>
              <p className="text-sm text-gray-600 mb-4">
                This would open a form to add new members to the buyer group.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
