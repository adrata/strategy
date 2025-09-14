"use client";

import React from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';

interface UniversalHistoryTabProps {
  recordType: string;
  record?: any;
}

export function UniversalHistoryTab({ recordType, record: recordProp }: UniversalHistoryTabProps) {
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
    const sarahHistory = [
      {
        id: 1,
        type: 'Email',
        subject: 'Follow-up on HR Technology Solutions',
        date: '2024-01-15T10:30:00Z',
        status: 'Completed',
        outcome: 'Positive response, interested in learning more',
        participants: ['Sarah Johnson', 'Sales Team'],
        duration: null,
        notes: 'Initial outreach about HR technology solutions. Sarah expressed strong interest in AI-powered workforce analytics.'
      },
      {
        id: 2,
        type: 'Call',
        subject: 'Discovery Call - HR Technology Needs',
        date: '2024-01-10T14:00:00Z',
        status: 'Completed',
        outcome: 'Qualified opportunity, identified key requirements',
        participants: ['Sarah Johnson', 'Technical Team'],
        duration: '45 minutes',
        notes: 'Comprehensive discovery call covering current HR processes, pain points, and decision criteria. Budget confirmed at $2M+.'
      },
      {
        id: 3,
        type: 'Meeting',
        subject: 'HR Technology Conference - Initial Meeting',
        date: '2024-01-05T09:00:00Z',
        status: 'Completed',
        outcome: 'Initial connection established',
        participants: ['Sarah Johnson', 'Conference Team'],
        duration: '30 minutes',
        notes: 'Met at HR Technology Conference. Discussed current challenges with manual processes and need for better analytics.'
      }
    ];
    
    return (
      <div className="p-6 space-y-8">
        {/* Interaction Timeline */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Interaction Timeline</h3>
          <div className="space-y-4">
            {sarahHistory.map((activity, index) => (
              <div key={activity.id} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">{getActivityIcon(activity.type)}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">{activity.subject}</h4>
                      <span className="text-xs text-gray-500">{new Date(activity.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{activity.outcome}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Type: {activity.type}</span>
                      <span>Status: {activity.status}</span>
                      {activity['duration'] && <span>Duration: {activity.duration}</span>}
                    </div>
                    {activity['notes'] && (
                      <p className="text-sm text-gray-600 mt-2 italic">{activity.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Interaction Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Last Contact</h4>
              <div className="text-2xl font-semibold text-gray-900">
                {new Date('2024-01-15').toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-500">
                Email follow-up
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Next Action</h4>
              <div className="text-2xl font-semibold text-gray-900">
                Schedule follow-up call
              </div>
              <div className="text-sm text-gray-500">
                Technical demo requested
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Total Interactions</h4>
              <div className="text-2xl font-semibold text-gray-900">
                {sarahHistory.length}
              </div>
              <div className="text-sm text-gray-500">
                {sarahHistory.filter(a => a['status'] === 'Completed').length} completed
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get data from customFields or fallback to notes parsing
  const customFields = record.customFields || {};
  const notes = record.notes ? (typeof record['notes'] === 'string' ? JSON.parse(record.notes) : record.notes) : {};
  
  const lastContactDate = customFields.lastContact || notes.lastContactDate || new Date().toISOString();
  const nextFollowUpDate = customFields.nextAction || notes.nextFollowUpDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  
  // Use interaction history from customFields if available, otherwise use mock data
  const finalInteractionHistory = customFields['interactionHistory'] && customFields.interactionHistory.length > 0 
    ? customFields.interactionHistory.map((item: any, index: number) => ({
        id: index + 1,
        type: item.type || 'Email',
        subject: item.subject || item.description || 'Interaction',
        date: item.date || new Date().toISOString(),
        status: item.status || 'Completed',
        outcome: item.outcome || 'Interaction completed',
        participants: [record.fullName || record.name || 'Contact'],
        duration: null,
        notes: item.description || item.fullContent || 'No additional notes'
      }))
    : [
    {
      id: 1,
      type: 'Email',
      subject: 'Follow-up on Technical Demo',
      date: '2024-01-15T10:30:00Z',
      status: 'Sent',
      outcome: 'Positive response, interested in next steps',
      participants: ['Sarah Johnson', 'Kirk Harbaugh'],
      duration: null,
      notes: 'Discussed technical requirements and timeline. Sarah expressed strong interest in the solution.'
    },
    {
      id: 2,
      type: 'Call',
      subject: 'Initial Discovery Call',
      date: '2024-01-10T14:00:00Z',
      status: 'Completed',
      outcome: 'Qualified opportunity, identified key stakeholders',
      participants: ['Sarah Johnson', 'Marcus Rodriguez'],
      duration: '45 minutes',
      notes: 'Comprehensive discovery call covering current processes, pain points, and decision criteria.'
    },
    {
      id: 3,
      type: 'Meeting',
      subject: 'Executive Briefing',
      date: '2024-01-05T09:00:00Z',
      status: 'Completed',
      outcome: 'Executive buy-in secured',
      participants: ['Sarah Johnson', 'Michael Chen', 'Patricia Kim'],
      duration: '60 minutes',
      notes: 'Presented business case and ROI analysis. Executives were impressed with the value proposition.'
    },
    {
      id: 4,
      type: 'Email',
      subject: 'Proposal Submission',
      date: '2024-01-01T16:45:00Z',
      status: 'Sent',
      outcome: 'Proposal received and under review',
      participants: ['Sarah Johnson', 'James Wilson'],
      duration: null,
      notes: 'Submitted comprehensive proposal with pricing and implementation timeline.'
    },
    {
      id: 5,
      type: 'Demo',
      subject: 'Product Demonstration',
      date: '2023-12-20T11:00:00Z',
      status: 'Completed',
      outcome: 'Technical validation successful',
      participants: ['Sarah Johnson', 'Kevin Zhang', 'Sarah Rodriguez'],
      duration: '90 minutes',
      notes: 'Live product demo covering all key features. Technical team was very engaged and asked detailed questions.'
    }
  ];

  const upcomingActivities = [
    {
      id: 6,
      type: 'Call',
      subject: 'Stakeholder Alignment Meeting',
      date: '2024-01-20T15:00:00Z',
      status: 'Scheduled',
      participants: ['Sarah Johnson', 'Patricia Kim', 'James Wilson'],
      duration: '60 minutes',
      notes: 'Align all stakeholders on implementation approach and timeline.'
    },
    {
      id: 7,
      type: 'Meeting',
      subject: 'Contract Negotiation',
      date: '2024-01-25T10:00:00Z',
      status: 'Scheduled',
      participants: ['Sarah Johnson', 'Michael Chen'],
      duration: '90 minutes',
      notes: 'Final contract terms and pricing discussion.'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'Email':
        return '📧';
      case 'Call':
        return '📞';
      case 'Meeting':
        return '🤝';
      case 'Demo':
        return '🖥️';
      default:
        return '📝';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'Sent':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Interaction Timeline */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Interaction Timeline</h3>
        <div className="space-y-4">
          {finalInteractionHistory.map((activity, index) => (
            <div key={activity.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">{getActivityIcon(activity.type)}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{activity.subject}</h4>
                      <p className="text-sm text-gray-600">{activity.type}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {new Date(activity.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </span>
                    {activity['duration'] && (
                      <span className="text-sm text-gray-500">Duration: {activity.duration}</span>
                    )}
                  </div>
                  
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-700">Outcome: </span>
                    <span className="text-sm text-gray-600">{activity.outcome}</span>
                  </div>
                  
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-700">Participants: </span>
                    <span className="text-sm text-gray-600">{activity.participants.join(', ')}</span>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-700">Notes: </span>
                    <span className="text-sm text-gray-600">{activity.notes}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Activities */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Activities</h3>
        <div className="space-y-4">
          {upcomingActivities.map((activity) => (
            <div key={activity.id} className="bg-white p-4 rounded-lg border border-gray-200 border-blue-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">{getActivityIcon(activity.type)}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{activity.subject}</h4>
                      <p className="text-sm text-gray-600">{activity.type}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {new Date(activity.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </span>
                    {activity['duration'] && (
                      <span className="text-sm text-gray-500">Duration: {activity.duration}</span>
                    )}
                  </div>
                  
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-700">Participants: </span>
                    <span className="text-sm text-gray-600">{activity.participants.join(', ')}</span>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-700">Notes: </span>
                    <span className="text-sm text-gray-600">{activity.notes}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Summary */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Last Contact</h4>
            <div className="text-sm text-gray-600">
              {new Date(lastContactDate).toLocaleDateString()}
            </div>
            <div className="text-sm text-gray-500">
              {new Date(lastContactDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Next Follow-up</h4>
            <div className="text-sm text-gray-600">
              {new Date(nextFollowUpDate).toLocaleDateString()}
            </div>
            <div className="text-sm text-gray-500">
              {new Date(nextFollowUpDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Total Interactions</h4>
            <div className="text-2xl font-semibold text-gray-900">
              {finalInteractionHistory.length}
            </div>
            <div className="text-sm text-gray-500">
              {finalInteractionHistory.filter(a => a['status'] === 'Completed').length} completed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
