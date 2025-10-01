import React, { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow, format } from 'date-fns';
import { ChevronDownIcon, ChevronRightIcon, EnvelopeIcon, DocumentTextIcon, PhoneIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';
import { useWorkspaceUsers } from '@/platform/hooks/useWorkspaceUsers';

interface TimelineEvent {
  id: string;
  type: 'created' | 'activity' | 'email' | 'note' | 'status_change' | 'updated' | 'field_update';
  date: Date;
  title: string;
  description?: string;
  content?: string; // Full content for emails/notes
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
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const { users } = useWorkspaceUsers();

  // Function to get user name from user ID
  const getUserName = useCallback((userId: string) => {
    if (!userId || userId === 'System') return 'System';
    const user = users.find(u => u['id'] === userId);
    if (user) {
      // Check if this is the current user
      const currentUser = users.find(u => u.isCurrentUser);
      if (currentUser && user.id === currentUser.id) {
        return 'Me';
      }
      return user.fullName || user.name || user.displayName || user.email || userId;
    }
    return userId;
  }, [users]);

  const toggleEventExpansion = (eventId: string) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'email':
      case 'email_conversation':
        return <EnvelopeIcon className="w-4 h-4" />;
      case 'call':
      case 'phone_call':
        return <PhoneIcon className="w-4 h-4" />;
      case 'meeting':
      case 'appointment':
        return <CalendarIcon className="w-4 h-4" />;
      case 'note':
        return <DocumentTextIcon className="w-4 h-4" />;
      case 'created':
        return <UserIcon className="w-4 h-4" />;
      default:
        return <DocumentTextIcon className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'email':
      case 'email_conversation':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'call':
      case 'phone_call':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'meeting':
      case 'appointment':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'note':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'created':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'status_change':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const hasExpandableContent = (event: TimelineEvent) => {
    return event.content && event.content.length > 150;
  };

  const generateTimelineFromRecord = useCallback(() => {
    const events: TimelineEvent[] = [];
    console.log('🔄 [TIMELINE] Generating timeline from record:', {
      record: record,
      recordType: recordType,
      createdAt: record?.createdAt
    });

    // Always add creation event - use createdAt if available, otherwise use current date
    const recordTypeName = recordType === 'companies' ? 'company' : 
                          recordType === 'people' ? 'person' : 
                          recordType.slice(0, -1); // Handle other plurals
    const creationDate = record?.createdAt ? new Date(record.createdAt) : new Date();
    
    const creationEvent = {
      id: 'created',
      type: 'created' as const,
      date: creationDate,
      title: `${recordTypeName.charAt(0).toUpperCase() + recordTypeName.slice(1)} added to pipeline`,
      description: record?.createdAt 
        ? `New ${recordTypeName} record created in system`
        : `${recordTypeName.charAt(0).toUpperCase() + recordTypeName.slice(1)} record loaded`,
      user: getUserName(record?.assignedUserId || record?.createdBy || 'System')
    };
    events.push(creationEvent);
    console.log('🔄 [TIMELINE] Added creation event:', creationEvent);

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
    console.log('🔄 [TIMELINE] Setting initial timeline events:', events);
    setTimelineEvents(events);
  }, [record, recordType, getUserName]);

  useEffect(() => {
    if (record) {
      generateTimelineFromRecord();
      loadTimelineFromAPI();
    }
  }, [record, users, generateTimelineFromRecord]);

  const loadTimelineFromAPI = useCallback(async () => {
    if (!record?.id) {
      console.log('🚨 [TIMELINE] No record ID, skipping API load');
      setLoading(false);
      return;
    }
    
    // Get workspace and user IDs with fallbacks
    const workspaceId = record.workspaceId || '01K5D01YCQJ9TJ7CT4DZDE79T1'; // TOP Engineering Plus workspace
    const userId = record.assignedUserId || '01K1VBYZG41K9QA0D9CF06KNRG'; // Ross Sylvester user ID
    
    console.log('🔍 [TIMELINE] Loading timeline for record:', {
      id: record.id,
      type: recordType,
      workspaceId: workspaceId,
      assignedUserId: userId,
      recordWorkspaceId: record.workspaceId,
      recordAssignedUserId: record.assignedUserId
    });
    
    setLoading(true);
    try {
      // ⚡ PERFORMANCE: Check cache first to avoid unnecessary API calls
      const cacheKey = `timeline-${record.id}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      let activityEvents: TimelineEvent[] = [];
      let noteEvents: TimelineEvent[] = [];
      
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          if (parsed.timestamp && Date.now() - parsed.timestamp < 180000) { // 3 minute cache
            activityEvents = parsed.activities || [];
            noteEvents = parsed.notes || [];
            console.log('⚡ [TIMELINE] Using cached timeline data');
          }
        } catch (e) {
          console.log('Timeline cache parse error, fetching fresh data');
        }
      }
      
      // Only fetch if no cache or cache is stale
      if (activityEvents.length === 0 && noteEvents.length === 0) {
        console.log('🔍 [TIMELINE] Fetching fresh timeline data');
        
        // Load activities for this specific record using unified API
        const activitiesResponse = await fetch(`/api/data/unified?type=activities&action=get&workspaceId=${workspaceId}&userId=${userId}`);
        
        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json();
          console.log('📅 [TIMELINE] Activities data:', activitiesData);
          
          if (activitiesData['success'] && activitiesData.data) {
            // Filter activities for this specific record
            const recordActivities = activitiesData.data.filter((activity: any) => {
              // Check if this activity is related to our record
              return (
                activity['leadId'] === record.id ||
                activity['prospectId'] === record.id ||
                activity['opportunityId'] === record.id ||
                activity['contactId'] === record.id ||
                activity['accountId'] === record.id ||
                activity['companyId'] === record.id
              );
            });
            
            console.log('📅 [TIMELINE] Filtered activities for record:', recordActivities.length);

            // Convert activities to timeline events
            activityEvents = recordActivities.map((activity: any) => ({
              id: activity.id,
              type: 'activity',
              date: new Date(activity.completedAt || activity.createdAt),
              title: activity.subject || activity.type || 'Activity',
              description: activity.description ? activity.description.substring(0, 100) + (activity.description.length > 100 ? '...' : '') : '',
              content: activity.description || activity.outcome || '', // Full content for expansion
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
        const notesUrl = `/api/data/unified?type=notes&action=get&workspaceId=${workspaceId}&userId=${userId}`;
        console.log('🔍 [TIMELINE] Fetching notes from:', notesUrl);
        
        const notesResponse = await fetch(notesUrl);
        console.log('📝 [TIMELINE] Notes response status:', notesResponse.status);
        
        if (notesResponse.ok) {
          const notesData = await notesResponse.json();
          console.log('📝 [TIMELINE] Notes data:', notesData);
          
          if (notesData['success'] && notesData.data) {
            // Filter notes for this specific record
            const recordNotes = notesData.data.filter((note: any) => {
              return (
                note['leadId'] === record.id ||
                note['opportunityId'] === record.id ||
                note['contactId'] === record.id ||
                note['accountId'] === record.id ||
                note['personId'] === record.id ||
                note['companyId'] === record.id
              );
            });

            // Convert notes to timeline events
            noteEvents = recordNotes.map((note: any) => ({
              id: note.id,
              type: 'note',
              date: new Date(note.createdAt),
              title: note.title || 'Note added',
              description: note.content ? note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '') : '',
              content: note.content || note.summary || '', // Full content for expansion
              user: getUserName(note.authorId || 'System'),
              metadata: {
                type: note.type,
                priority: note.priority,
                isPrivate: note.isPrivate
              }
            }));
            console.log('📝 [TIMELINE] Converted notes to events:', noteEvents);
          } else {
            console.log('📝 [TIMELINE] No notes found or API error:', notesData);
          }
        } else {
          console.error('📝 [TIMELINE] Notes API error:', notesResponse.status, notesResponse.statusText);
        }
        
        // Cache the data
        localStorage.setItem(cacheKey, JSON.stringify({
          activities: activityEvents,
          notes: noteEvents,
          timestamp: Date.now()
        }));
      }

      // Merge all events and sort by date
      setTimelineEvents(prev => {
        const combined = [...prev, ...activityEvents, ...noteEvents];
        console.log('🔄 [TIMELINE] Merging events:', {
          prev: prev.length,
          activities: activityEvents.length,
          notes: noteEvents.length,
          combined: combined.length
        });
        
        // Remove duplicates based on ID
        const uniqueEvents = combined.filter((event, index, self) => 
          index === self.findIndex(e => e['id'] === event.id)
        );
        
        const sortedEvents = uniqueEvents.sort((a, b) => b.date.getTime() - a.date.getTime());
        console.log('🔄 [TIMELINE] Final timeline events:', sortedEvents);
        
        return sortedEvents;
      });
    } catch (error) {
      console.error('Error loading timeline from API:', error);
    } finally {
      setLoading(false);
    }
  }, [record, getUserName]);


  const isPastEvent = (date: Date) => date <= new Date();

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between">
          <div className="text-lg font-medium text-gray-900">Timeline</div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-sm font-medium">
              {timelineEvents.length}
            </span>
            <span className="text-sm text-gray-500">
              {timelineEvents['length'] === 1 ? 'Action' : 'Actions'}
            </span>
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
                <div className="w-8 h-8 rounded bg-white border-2 border-gray-300 flex items-center justify-center">
                  {getEventIcon(event.type)}
                </div>
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
                        <span className="px-4 py-1 bg-red-100 text-red-800 text-xs rounded-full whitespace-nowrap">
                          Scheduled
                        </span>
                      )}
                      {event.metadata?.status && (
                        <span className={`px-4 py-1 text-xs rounded-full whitespace-nowrap ${
                          event.metadata.status === 'completed' ? 'bg-green-100 text-green-800' :
                          event.metadata.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {event.metadata.status}
                        </span>
                      )}
                    </div>
                    {event['description'] && (
                      <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                    )}
                    
                    {/* Expandable content for emails and notes */}
                    {hasExpandableContent(event) && (
                      <div className="mb-3">
                        <button
                          onClick={() => toggleEventExpansion(event.id)}
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {expandedEvents.has(event.id) ? (
                            <ChevronDownIcon className="w-4 h-4" />
                          ) : (
                            <ChevronRightIcon className="w-4 h-4" />
                          )}
                          {expandedEvents.has(event.id) ? 'Show less' : 'Show full content'}
                        </button>
                        
                        {expandedEvents.has(event.id) && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                            <div className="text-sm text-gray-700 whitespace-pre-wrap">
                              {event.content}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Business Context */}
                    {event.metadata && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-2">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          {event.metadata.type && (
                            <div>
                              <span className="font-medium text-gray-700">Type:</span>
                              <span className="ml-1 text-gray-600 capitalize">{event.metadata.type}</span>
                            </div>
                          )}
                          {event.metadata.priority && (
                            <div>
                              <span className="font-medium text-gray-700">Priority:</span>
                              <span className={`ml-1 px-1 py-0.5 rounded text-xs ${
                                event.metadata.priority === 'high' ? 'bg-red-100 text-red-800' :
                                event.metadata.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {event.metadata.priority}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{formatDistanceToNow(event.date, { addSuffix: true })}</span>
                      {event['user'] && <span>by {event.user}</span>}
                      <span>•</span>
                      <span>{format(event.date, 'MMM d, yyyy h:mm a')}</span>
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
