"use client";

import React from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';

interface UniversalBuyerGroupTabProps {
  recordType: string;
}

export function UniversalBuyerGroupTab({ recordType }: UniversalBuyerGroupTabProps) {
  const { record } = useRecordContext();

  if (!record) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">No record data available</div>
      </div>
    );
  }

  // Parse notes for buyer group data
  const notes = record.notes ? JSON.parse(record.notes) : {};
  const buyerRole = notes.buyerRole || 'Stakeholder';
  const engagement = notes.engagement || 'Neutral 1/5';
  const influence = notes.influence || 50;
  const decisionPower = notes.decisionPower || 50;
  const riskStatus = notes.riskStatus || '';
  const fallbackRole = notes.fallbackRole || '';

  // Mock buyer group data for demo
  const buyerGroupData = {
    groupName: 'ADP Platform Architecture Team',
    company: 'ADP',
    totalMembers: 8,
    decisionMakers: 2,
    champions: 2,
    stakeholders: 4,
    blockers: 1,
    openers: 1,
    averageEngagement: 3.2,
    groupInfluence: 85,
    decisionTimeline: 'Q2 2025',
    budgetAuthority: '$2.5M',
    riskLevel: 'Medium',
    lastActivity: '2 days ago',
    nextMilestone: 'Technical Demo',
    members: [
      {
        name: 'James Wilson',
        role: 'Decision Maker',
        title: 'Director Platform Architecture',
        influence: 85,
        engagement: 'Interested 3/5',
        riskStatus: '',
        isChampion: false,
        isBlocker: false
      },
      {
        name: 'Sarah Rodriguez',
        role: 'Champion',
        title: 'VP of Engineering',
        influence: 75,
        engagement: 'Warming',
        riskStatus: 'At Risk of Leaving 3/5',
        isChampion: true,
        isBlocker: false
      },
      {
        name: 'Kevin Zhang',
        role: 'Champion',
        title: 'Sr. Manager Cloud Infrastructure',
        influence: 70,
        engagement: 'Interested 4/5',
        riskStatus: '',
        isChampion: true,
        isBlocker: false
      },
      {
        name: 'Patricia Kim',
        role: 'Stakeholder',
        title: 'Sr. Director Tech Procurement',
        influence: 60,
        engagement: 'Interested 4/5',
        riskStatus: '',
        isChampion: false,
        isBlocker: false
      },
      {
        name: 'Michael Chen',
        role: 'Decision Maker',
        title: 'CTO',
        influence: 95,
        engagement: 'Neutral 1/5',
        riskStatus: '',
        isChampion: false,
        isBlocker: false
      },
      {
        name: 'David Park',
        role: 'Blocker',
        title: 'Security Director',
        influence: 65,
        engagement: 'Cold 1/5',
        riskStatus: 'Security Concerns',
        isChampion: false,
        isBlocker: true
      },
      {
        name: 'Lisa Thompson',
        role: 'Stakeholder',
        title: 'IT Operations Manager',
        influence: 55,
        engagement: 'Neutral 2/5',
        riskStatus: '',
        isChampion: false,
        isBlocker: false
      },
      {
        name: 'Robert Martinez',
        role: 'Opener',
        title: 'Business Development Director',
        influence: 80,
        engagement: 'Very Interested 5/5',
        riskStatus: '',
        isChampion: false,
        isBlocker: false,
        isOpener: true
      }
    ]
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Decision Maker':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Champion':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Stakeholder':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Blocker':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Opener':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEngagementColor = (engagement: string) => {
    if (engagement.includes('Interested') || engagement.includes('Warming')) {
      return 'text-green-600';
    } else if (engagement.includes('Neutral')) {
      return 'text-yellow-600';
    } else if (engagement.includes('Cold')) {
      return 'text-red-600';
    }
    return 'text-gray-600';
  };

  return (
    <div className="p-6 space-y-8">
      {/* Buyer Group Overview */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Buyer Group Overview</h3>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Group Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Group Name</span>
                  <span className="text-sm font-medium text-gray-900">{buyerGroupData.groupName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Company</span>
                  <span className="text-sm font-medium text-gray-900">{buyerGroupData.company}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Members</span>
                  <span className="text-sm font-medium text-gray-900">{buyerGroupData.totalMembers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Decision Timeline</span>
                  <span className="text-sm font-medium text-gray-900">{buyerGroupData.decisionTimeline}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Financial Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Budget Authority</span>
                  <span className="text-sm font-medium text-gray-900">{buyerGroupData.budgetAuthority}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Risk Level</span>
                  <span className={`text-sm font-medium ${
                    buyerGroupData['riskLevel'] === 'Low' ? 'text-green-600' :
                    buyerGroupData['riskLevel'] === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {buyerGroupData.riskLevel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Group Influence</span>
                  <span className="text-sm font-medium text-gray-900">{buyerGroupData.groupInfluence}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Engagement</span>
                  <span className="text-sm font-medium text-gray-900">{buyerGroupData.averageEngagement}/5</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Activity Status</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Activity</span>
                  <span className="text-sm font-medium text-gray-900">{buyerGroupData.lastActivity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Next Milestone</span>
                  <span className="text-sm font-medium text-gray-900">{buyerGroupData.nextMilestone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Your Role</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(buyerRole)}`}>
                    {buyerRole}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Your Influence</span>
                  <span className="text-sm font-medium text-gray-900">{influence}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role Analysis */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Analysis</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-red-600">{buyerGroupData.decisionMakers}</div>
            <div className="text-sm text-gray-600">Decision Makers</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-green-600">{buyerGroupData.champions}</div>
            <div className="text-sm text-gray-600">Champions</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-blue-600">{buyerGroupData.stakeholders}</div>
            <div className="text-sm text-gray-600">Stakeholders</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-orange-600">{buyerGroupData.blockers}</div>
            <div className="text-sm text-gray-600">Blockers</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-purple-600">{buyerGroupData.openers}</div>
            <div className="text-sm text-gray-600">Openers</div>
          </div>
        </div>
      </div>

      {/* Buyer Group Members */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Buyer Group Members</h3>
        <div className="space-y-4">
          {buyerGroupData.members.map((member, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{member.name}</div>
                    <div className="text-sm text-gray-600">{member.title}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(member.role)}`}>
                      {member.role}
                    </div>
                    {member['fallbackRole'] && (
                      <div className="text-xs text-gray-500 mt-1">{member.fallbackRole}</div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{member.influence}%</div>
                    <div className="text-xs text-gray-500">Influence</div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getEngagementColor(member.engagement)}`}>
                      {member.engagement}
                    </div>
                    <div className="text-xs text-gray-500">Engagement</div>
                  </div>
                  
                  {member['riskStatus'] && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-orange-600">{member.riskStatus}</div>
                      <div className="text-xs text-gray-500">Risk</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Engagement Strategy */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Strategy</h3>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Recommended Approach</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Focus on Champions</div>
                    <div className="text-sm text-gray-600">Leverage Sarah Rodriguez and Kevin Zhang to build internal support</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Address Security Concerns</div>
                    <div className="text-sm text-gray-600">Schedule security review with David Park to address blockers</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Executive Engagement</div>
                    <div className="text-sm text-gray-600">Present business case to Michael Chen and James Wilson</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Next Steps</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Technical Demo</div>
                    <div className="text-sm text-gray-600">Schedule comprehensive demo for entire team</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Reference Calls</div>
                    <div className="text-sm text-gray-600">Arrange calls with similar enterprise customers</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Pilot Program</div>
                    <div className="text-sm text-gray-600">Propose limited pilot to reduce risk</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
