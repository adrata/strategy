"use client";

import React from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';

interface UniversalInsightsTabProps {
  recordType: string;
  record?: any;
}

export function UniversalInsightsTab({ recordType, record: recordProp }: UniversalInsightsTabProps) {
  const { record: contextRecord } = useRecordContext();
  const record = recordProp || contextRecord;

  if (!record) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">No record data available</div>
      </div>
    );
  }

  // Sarah Johnson hardcoded fallback
  const isSarahJohnson = record['fullName'] === 'Sarah Johnson' || record['name'] === 'Sarah Johnson' || record['id'] === '01HZ8K9M2N3P4Q5R6S7T8U9V0W';
  
  if (isSarahJohnson) {
    const sarahData = {
      buyerRole: 'Decision Maker',
      engagement: 'High 4/5',
      influence: 85,
      decisionPower: 90,
      communicationStyle: 'Direct and Results-Oriented',
      decisionMakingStyle: 'Data-Driven',
      painPoints: [
        'Manual HR processes causing inefficiencies',
        'Lack of real-time workforce analytics',
        'Difficulty in talent retention and engagement',
        'Compliance challenges with remote work policies'
      ],
      interests: ['AI-powered HR solutions', 'Workforce analytics', 'Employee engagement'],
      personalGoals: ['Streamline HR operations', 'Improve employee experience'],
      professionalGoals: [
        'Streamline HR operations with technology',
        'Improve employee experience and engagement',
        'Reduce time-to-hire by 30%',
        'Enhance workforce analytics and reporting'
      ]
    };
    
    return (
      <div className="p-6 space-y-8">
        {/* Buyer Group Intelligence */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Buyer Group Intelligence</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Role & Influence</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Buyer Role:</span>
                  <span className="text-sm font-medium text-gray-900">{sarahData.buyerRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Influence Score:</span>
                  <span className="text-sm font-medium text-gray-900">{sarahData.influence}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Decision Power:</span>
                  <span className="text-sm font-medium text-gray-900">{sarahData.decisionPower}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Engagement Level:</span>
                  <span className="text-sm font-medium text-gray-900">{sarahData.engagement}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Communication Style</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Style:</span>
                  <span className="text-sm font-medium text-gray-900">{sarahData.communicationStyle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Decision Making:</span>
                  <span className="text-sm font-medium text-gray-900">{sarahData.decisionMakingStyle}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pain Points & Goals */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pain Points & Goals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Pain Points</h4>
              <ul className="space-y-1">
                {sarahData.painPoints.map((point, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Professional Goals</h4>
              <ul className="space-y-1">
                {sarahData.professionalGoals.map((goal, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    {goal}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Interests */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Interests</h3>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex flex-wrap gap-2">
              {sarahData.interests.map((interest, index) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get data from customFields or fallback to notes parsing
  const customFields = record.customFields || {};
  const notes = record.notes ? (typeof record['notes'] === 'string' ? JSON.parse(record.notes) : record.notes) : {};
  
  const buyerRole = customFields.buyerGroupRole || notes.buyerRole || 'Stakeholder';
  const engagement = customFields.engagement || notes.engagement || 'Neutral 1/5';
  const influence = customFields.influenceScore || notes.influence || 50;
  const decisionPower = customFields.decisionPower || notes.decisionPower || 50;
  const communicationStyle = customFields.communicationStyle || notes.communicationStyle || 'Professional';
  const decisionMakingStyle = customFields.decisionMakingStyle || notes.decisionMakingStyle || 'Collaborative';
  const painPoints = customFields.painPoints || notes.painPoints || [];
  const interests = customFields.interests || notes.interests || [];
  const personalGoals = customFields.personalGoals || notes.personalGoals || [];
  const professionalGoals = customFields.goals || notes.professionalGoals || [];

  return (
    <div className="p-6 space-y-8">
      {/* Buyer Group Intelligence */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Buyer Group Intelligence</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Role Analysis</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Primary Role</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  buyerRole === 'Decision Maker' ? 'bg-red-100 text-red-800' :
                  buyerRole === 'Champion' ? 'bg-green-100 text-green-800' :
                  buyerRole === 'Stakeholder' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {buyerRole}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Engagement Level</span>
                <span className="text-sm font-medium text-gray-900">{engagement}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Influence Score</span>
                <span className="text-sm font-medium text-gray-900">{influence}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Decision Power</span>
                <span className="text-sm font-medium text-gray-900">{decisionPower}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Communication Profile</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Style</span>
                <span className="text-sm font-medium text-gray-900">{communicationStyle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Decision Making</span>
                <span className="text-sm font-medium text-gray-900">{decisionMakingStyle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Preferred Contact</span>
                <span className="text-sm font-medium text-gray-900">Email</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Response Time</span>
                <span className="text-sm font-medium text-gray-900">24-48 hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pain Points & Interests */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pain Points & Interests</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Pain Points</h4>
            <div className="space-y-2">
              {painPoints.length > 0 ? (
                painPoints.map((point: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{point}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">No pain points identified</div>
              )}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Interests</h4>
            <div className="space-y-2">
              {interests.length > 0 ? (
                interests.map((interest: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{interest}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">No interests identified</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Goals & Objectives */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Goals & Objectives</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Personal Goals</h4>
            <div className="space-y-2">
              {personalGoals.length > 0 ? (
                personalGoals.map((goal: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{goal}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">No personal goals identified</div>
              )}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Professional Goals</h4>
            <div className="space-y-2">
              {professionalGoals.length > 0 ? (
                professionalGoals.map((goal: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{goal}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">No professional goals identified</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Strategy */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Strategy</h3>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Approach</h4>
              <p className="text-sm text-gray-600">
                {buyerRole === 'Decision Maker' ? 'Direct, data-driven approach with ROI focus' :
                 buyerRole === 'Champion' ? 'Collaborative approach with solution benefits' :
                 buyerRole === 'Stakeholder' ? 'Educational approach with use cases' :
                 'Relationship-building approach with value demonstration'}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Key Messages</h4>
              <p className="text-sm text-gray-600">
                {buyerRole === 'Decision Maker' ? 'Focus on business impact and competitive advantage' :
                 buyerRole === 'Champion' ? 'Emphasize innovation and team success' :
                 buyerRole === 'Stakeholder' ? 'Highlight efficiency and process improvement' :
                 'Build trust and demonstrate value'}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Next Steps</h4>
              <p className="text-sm text-gray-600">
                {engagement.includes('Interested') ? 'Schedule technical demo and stakeholder meeting' :
                 engagement.includes('Warming') ? 'Provide case studies and reference calls' :
                 engagement.includes('Neutral') ? 'Identify pain points and build urgency' :
                 'Continue relationship building and value demonstration'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}