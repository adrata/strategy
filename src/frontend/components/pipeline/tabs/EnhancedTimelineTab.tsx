import React, { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/platform/api-fetch';
import { format, formatDistanceToNow } from 'date-fns';
import { ChevronDownIcon, ChevronRightIcon, EnvelopeIcon, DocumentTextIcon, PhoneIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';

interface TimelineEvent {
  id: string;
  type: 'action' | 'note' | 'email' | 'call' | 'meeting' | 'created' | 'status_change' | 'field_update';
  date: Date;
  title: string;
  description?: string;
  content?: string; // Full content for emails/notes
  user?: string;
  status?: string;
  priority?: string;
  metadata?: any;
  actionType?: string;
  actionOutcome?: string;
  duration?: number;
  relatedEntities?: {
    personId?: string;
    companyId?: string;
    leadId?: string;
    prospectId?: string;
    opportunityId?: string;
  };
}

interface EnhancedTimelineTabProps {
  record: any;
  recordType: string;
}

export function EnhancedTimelineTab({ record, recordType }: EnhancedTimelineTabProps) {
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
      return user.fullName || user.name || userId;
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

  const generateTimelineFromRecord = useCallback(() => {
    // Only show real actions from the database - no fallback data
    console.log('🔄 [ENHANCED ACTIONS] Initializing actions tab for record:', {
      record: record,
      recordType: recordType,
      createdAt: record?.createdAt
    });
    
    // Start with empty events - only real actions will be loaded from API
    setTimelineEvents([]);
  }, [record, recordType]);

  const loadTimelineFromAPI = useCallback(async () => {
    if (!record?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const cacheKey = `timeline-${recordType}-${record.id}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const { timestamp, activities, notes } = JSON.parse(cached);
        // Use cache if less than 5 minutes old
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setTimelineEvents(prev => {
            const combined = [...prev, ...activities, ...notes];
            const uniqueEvents = combined.filter((event, index, self) => 
              index === self.findIndex(e => e['id'] === event.id)
            );
            return uniqueEvents.sort((a, b) => b.date.getTime() - a.date.getTime());
          });
          setLoading(false);
          return;
        }
      }

      let activityEvents: TimelineEvent[] = [];
      let noteEvents: TimelineEvent[] = [];

      // Fetch activities/actions using v1 API
      const activitiesData = await authFetch(`/api/v1/actions?personId=${record.id}&limit=50`);
      
      if (activitiesData.success) {
        if (activitiesData['success'] && activitiesData.data) {
          // Handle dashboard data structure - extract activities from all sections
          const allActivities: any[] = [];
          const sections = ['leads', 'prospects', 'opportunities', 'companies', 'people', 'clients', 'partners', 'sellers'];
          sections.forEach(section => {
            if (activitiesData.data[section] && Array.isArray(activitiesData.data[section])) {
              allActivities.push(...activitiesData.data[section]);
            }
          });
          
          // Filter activities for this specific record
          const recordActivities = allActivities.filter((activity: any) => {
            return (
              activity['leadId'] === record.id ||
              activity['opportunityId'] === record.id ||
              activity['contactId'] === record.id ||
              activity['accountId'] === record.id ||
              activity['personId'] === record.id ||
              activity['companyId'] === record.id
            );
          });

          // Convert activities to timeline events
          activityEvents = recordActivities.map((activity: any) => ({
            id: activity.id,
            type: activity.type || 'action',
            date: new Date(activity.createdAt || activity.completedAt),
            title: activity.subject || activity.type || 'Activity',
            description: activity.description || '',
            content: activity.description || activity.notes || '', // Full content for expansion
            user: getUserName(activity.userId || 'System'),
            status: activity.status,
            priority: activity.priority,
            metadata: {
              type: activity.type,
              priority: activity.priority,
              status: activity.status,
              outcome: activity.outcome,
              duration: activity.duration
            },
            actionType: activity.type,
            actionOutcome: activity.outcome,
            duration: activity.duration
          }));
        }
      }

      // Fetch notes using unified API
      const notesData = await authFetch(`/api/data/unified`);
      
      if (notesData.success) {
        if (notesData['success'] && notesData.data) {
          // Handle dashboard data structure - extract notes from all sections
          const allNotes: any[] = [];
          const sections = ['leads', 'prospects', 'opportunities', 'companies', 'people', 'clients', 'partners', 'sellers'];
          sections.forEach(section => {
            if (notesData.data[section] && Array.isArray(notesData.data[section])) {
              allNotes.push(...notesData.data[section]);
            }
          });
          
          // Filter notes for this specific record
          const recordNotes = allNotes.filter((note: any) => {
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
        }
      }
      
      // Cache the data
      localStorage.setItem(cacheKey, JSON.stringify({
        activities: activityEvents,
        notes: noteEvents,
        timestamp: Date.now()
      }));

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

  useEffect(() => {
    if (record) {
      generateTimelineFromRecord();
      loadTimelineFromAPI();
    }
  }, [record, users, generateTimelineFromRecord, loadTimelineFromAPI]);

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
        return 'bg-primary/10 text-primary border-primary/20';
      case 'call':
      case 'phone_call':
        return 'bg-success/10 text-success border-success';
      case 'meeting':
      case 'appointment':
        return 'bg-info/10 text-info border-info';
      case 'note':
        return 'bg-warning/10 text-warning border-warning';
      case 'created':
        return 'bg-hover text-foreground border-border';
      case 'status_change':
        return 'bg-warning/10 text-warning border-warning';
      default:
        return 'bg-hover text-foreground border-border';
    }
  };

  const isPastEvent = (date: Date) => {
    return date < new Date();
  };

  const hasExpandableContent = (event: TimelineEvent) => {
    return event.content && event.content.length > 150;
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Timeline</h3>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-hover text-gray-700 rounded-full flex items-center justify-center text-sm font-medium">
              {timelineEvents.length}
            </span>
            <span className="text-sm text-muted">
              {timelineEvents['length'] === 1 ? 'Action' : 'Actions'}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : timelineEvents['length'] === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-foreground mb-2">No timeline events yet</h3>
          <p className="text-muted">Activities and interactions will appear here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {timelineEvents.map((event, index) => (
            <div key={event.id} className="flex items-start gap-4">
              {/* Timeline indicator */}
              <div className="flex flex-col items-center pt-1">
                <div className="w-8 h-8 rounded bg-background border-2 border-border flex items-center justify-center">
                  {getEventIcon(event.type)}
                </div>
                {index < timelineEvents.length - 1 && (
                  <div className="w-px h-12 bg-loading-bg mt-2" />
                )}
              </div>

              {/* Event content */}
              <div className="flex-1 min-w-0 pb-6">
                <div className="bg-background rounded-lg border border-border p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-sm font-medium text-foreground">{event.title}</h4>
                        {!isPastEvent(event.date) && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            Scheduled
                          </span>
                        )}
                        {event.metadata?.status && (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            event.metadata.status === 'completed' ? 'bg-green-100 text-green-800' :
                            event.metadata.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-hover text-gray-800'
                          }`}>
                            {event.metadata.status}
                          </span>
                        )}
                      </div>
                      
                      {event['description'] && (
                        <p className="text-sm text-muted mb-3">{event.description}</p>
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
                            <div className="mt-2 p-3 bg-panel-background rounded-lg border">
                              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                {event.content}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Business Context */}
                      {event.metadata && (
                        <div className="bg-panel-background rounded-lg p-3 mb-3">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            {event.metadata.type && (
                              <div>
                                <span className="font-medium text-gray-700">Type:</span>
                                <span className="ml-1 text-muted capitalize">{event.metadata.type}</span>
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
                            {event.duration && (
                              <div>
                                <span className="font-medium text-gray-700">Duration:</span>
                                <span className="ml-1 text-muted">{event.duration} min</span>
                              </div>
                            )}
                            {event.actionOutcome && (
                              <div>
                                <span className="font-medium text-gray-700">Outcome:</span>
                                <span className="ml-1 text-muted">{event.actionOutcome}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted">
                        <span>{formatDistanceToNow(event.date, { addSuffix: true })}</span>
                        {event['user'] && <span>by {event.user}</span>}
                        <span>•</span>
                        <span>{format(event.date, 'MMM d, yyyy h:mm a')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Data Sources */}
      <div className="pt-6 border-t border-border">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Data Sources</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-panel-background rounded-lg p-3">
            <div className="font-medium text-foreground">System Records</div>
            <div className="text-muted">Created, Updated</div>
          </div>
          <div className="bg-panel-background rounded-lg p-3">
            <div className="font-medium text-foreground">Actions</div>
            <div className="text-muted">Calls, Emails, Meetings</div>
          </div>
          <div className="bg-panel-background rounded-lg p-3">
            <div className="font-medium text-foreground">Email Data</div>
            <div className="text-muted">Connected email threads</div>
          </div>
          <div className="bg-panel-background rounded-lg p-3">
            <div className="font-medium text-foreground">Notes</div>
            <div className="text-muted">Manual entries</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for workspace users (you may need to adjust this based on your existing implementation)
function useWorkspaceUsers() {
  const [users, setUsers] = useState<any[]>([]);
  
  useEffect(() => {
    // Fetch users logic here
    setUsers([]);
  }, []);
  
  return { users };
}
