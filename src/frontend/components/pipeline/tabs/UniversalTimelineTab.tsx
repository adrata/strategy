import React, { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow, format } from 'date-fns';
import { useWorkspaceUsers } from '@/platform/hooks/useWorkspaceUsers';

interface TimelineEvent {
  id: string;
  type: 'created' | 'activity' | 'email' | 'note' | 'status_change' | 'updated' | 'field_update';
  date: Date;
  title: string;
  description?: string;
  user?: string;
  metadata?: any;
}

interface UniversalTimelineTabProps {
  record: any;
  recordType: string;
}

export function UniversalTimelineTab({ record, recordType }: UniversalTimelineTabProps) {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const { users } = useWorkspaceUsers();

  // Function to get user name from user ID
  const getUserName = useCallback((userId: string) => {
    if (!userId || userId === 'System') return 'System';
    const user = users.find(u => u['id'] === userId);
    if (user) {
      const fullName = user.name || user.displayName || user.email;
      const username = user.email?.split('@')[0] || '';
      return `${fullName} (@${username})`;
    }
    return userId;
  }, [users]);

  const generateTimelineFromRecord = useCallback(() => {
    const events: TimelineEvent[] = [];

    // Always add creation event if we have created date
    if (record?.createdAt) {
      const recordTypeName = recordType.slice(0, -1); // Remove 's' from 'leads' -> 'lead'
      events.push({
        id: 'created',
        type: 'created',
        date: new Date(record.createdAt),
        title: `${recordTypeName.charAt(0).toUpperCase() + recordTypeName.slice(1)} added to pipeline`,
        description: `New ${recordTypeName} record created in system`,
        user: getUserName(record?.assignedUserId || record?.createdBy || 'System')
      });
    }

    // Add last action if available
    if (record?.lastActionDate) {
      events.push({
        id: 'last-action',
        type: 'field_update',
        date: new Date(record.lastActionDate),
        title: record?.lastAction || 'Activity',
        description: 'Last recorded activity',
        user: getUserName(record?.assignedUserId || record?.lastActionBy || 'User')
      });
    }

    // Add status changes if we can infer them
    if (record?.status && record?.status !== 'new') {
      events.push({
        id: 'status-change',
        type: 'status_change',
        date: new Date(record?.updatedAt || record?.createdAt),
        title: `Status changed to ${record.status}`,
        description: `${recordType.slice(0, -1)} status updated to ${record.status}`,
        user: getUserName(record?.assignedUserId || record?.updatedBy || 'System')
      });
    }

    // Add next action if scheduled
    if (record?.nextActionDate && new Date(record.nextActionDate) > new Date()) {
      events.push({
        id: 'next-action',
        type: 'activity',
        date: new Date(record.nextActionDate),
        title: record?.nextAction || 'Scheduled activity',
        description: 'Planned next action',
        user: getUserName(record?.assignedUserId || record?.nextActionBy || 'User')
      });
    }

    // Sort events by date (newest first)
    events.sort((a, b) => b.date.getTime() - a.date.getTime());
    setTimelineEvents(events);
  }, [record, recordType, getUserName]);

  useEffect(() => {
    if (record) {
      generateTimelineFromRecord();
      loadTimelineFromAPI();
    }
  }, [record, users, generateTimelineFromRecord]);

  const loadTimelineFromAPI = useCallback(async () => {
    if (!record?.id) return;
    
    setLoading(true);
    try {
      // Load activities for this specific record
      const activitiesResponse = await fetch(`/api/activities?workspaceId=${record.workspaceId}&userId=${record.assignedUserId}&limit=100`);
      let activityEvents: TimelineEvent[] = [];
      
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        if (activitiesData['success'] && activitiesData.activities) {
          // Filter activities for this specific record
          const recordActivities = activitiesData.activities.filter((activity: any) => {
            // Check if this activity is related to our record
            return (
              activity['leadId'] === record.id ||
              activity['prospectId'] === record.id ||
              activity['opportunityId'] === record.id ||
              activity['contactId'] === record.id ||
              activity['accountId'] === record.id
            );
          });

          // Convert activities to timeline events
          activityEvents = recordActivities.map((activity: any) => ({
            id: activity.id,
            type: 'activity',
            date: new Date(activity.completedAt || activity.createdAt),
            title: activity.subject || activity.type || 'Activity',
            description: activity.description || activity.outcome || '',
            user: getUserName(activity.userId || 'System'),
            metadata: {
              type: activity.type,
              status: activity.status,
              priority: activity.priority
            }
          }));
        }
      }

      // Load notes for this specific record using unified API
      const notesResponse = await fetch(`/api/data/unified?type=notes&action=get&workspaceId=${record.workspaceId}&userId=${record.assignedUserId}`);
      let noteEvents: TimelineEvent[] = [];
      
      if (notesResponse.ok) {
        const notesData = await notesResponse.json();
        if (notesData['success'] && notesData.data) {
          // Filter notes for this specific record
          const recordNotes = notesData.data.filter((note: any) => {
            return (
              note['leadId'] === record.id ||
              note['opportunityId'] === record.id ||
              note['contactId'] === record.id ||
              note['accountId'] === record.id
            );
          });

          // Convert notes to timeline events
          noteEvents = recordNotes.map((note: any) => ({
            id: note.id,
            type: 'note',
            date: new Date(note.createdAt),
            title: note.title || 'Note added',
            description: note.content || note.summary || '',
            user: getUserName(note.authorId || 'System'),
            metadata: {
              type: note.type,
              priority: note.priority,
              isPrivate: note.isPrivate
            }
          }));
        }
      }

      // Merge all events and sort by date
      setTimelineEvents(prev => {
        const combined = [...prev, ...activityEvents, ...noteEvents];
        // Remove duplicates based on ID
        const uniqueEvents = combined.filter((event, index, self) => 
          index === self.findIndex(e => e['id'] === event.id)
        );
        return uniqueEvents.sort((a, b) => b.date.getTime() - a.date.getTime());
      });
    } catch (error) {
      console.error('Error loading timeline from API:', error);
    } finally {
      setLoading(false);
    }
  }, [record, getUserName]);

  const getEventColor = (type: string) => {
    switch (type) {
      case 'created': return 'bg-gray-500';
      case 'activity': return 'bg-green-500';
      case 'email': return 'bg-purple-500';
      case 'note': return 'bg-yellow-500';
      case 'status_change': return 'bg-orange-500';
      case 'field_update': return 'bg-blue-500';
      case 'updated': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const isPastEvent = (date: Date) => date <= new Date();

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
          <div className="text-sm text-gray-500">
            {timelineEvents.length} {timelineEvents['length'] === 1 ? 'activity' : 'activities'}
          </div>
        </div>
      </div>

      {timelineEvents['length'] === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No timeline events yet</h3>
          <p className="text-gray-600">Activities and interactions will appear here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {timelineEvents.map((event, index) => (
            <div key={event.id} className="flex items-start gap-4">
              {/* Timeline indicator */}
              <div className="flex flex-col items-center pt-1">
                <div className={`w-3 h-3 rounded-full ${getEventColor(event.type)} ${!isPastEvent(event.date) ? 'opacity-50' : ''}`} />
                {index < timelineEvents.length - 1 && (
                  <div className="w-px h-12 bg-gray-200 mt-2" />
                )}
              </div>

              {/* Event content */}
              <div className="flex-1 min-w-0 pb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                      {!isPastEvent(event.date) && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Scheduled
                        </span>
                      )}
                    </div>
                    {event['description'] && (
                      <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{formatDistanceToNow(event.date, { addSuffix: true })}</span>
                      {event['user'] && <span>by {event.user}</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Data Sources */}
      <div className="pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Data Sources</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="font-medium text-gray-900">System Records</div>
            <div className="text-gray-600">Created, Updated</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="font-medium text-gray-900">Activities</div>
            <div className="text-gray-600">Calls, Emails, Meetings</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="font-medium text-gray-900">Email Data</div>
            <div className="text-gray-600">Connected email threads</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="font-medium text-gray-900">Notes</div>
            <div className="text-gray-600">Manual entries</div>
          </div>
        </div>
      </div>
    </div>
  );
}
