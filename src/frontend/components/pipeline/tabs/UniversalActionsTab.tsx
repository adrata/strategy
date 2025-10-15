import React, { useState, useEffect, useCallback } from "react";
import { authFetch } from '@/platform/api-fetch';
import { formatDistanceToNow, format } from 'date-fns';
import { ChevronDownIcon, ChevronRightIcon, EnvelopeIcon, DocumentTextIcon, PhoneIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';
import { useWorkspaceUsers } from '@/platform/hooks/useWorkspaceUsers';

interface ActionEvent {
  id: string;
  type: 'created' | 'activity' | 'email' | 'note' | 'status_change' | 'updated' | 'field_update';
  date: Date;
  title: string;
  description?: string;
  content?: string; // Full content for emails/notes
  user?: string;
  metadata?: any;
}

interface UniversalActionsTabProps {
  record: any;
  recordType: string;
}

export function UniversalActionsTab({ record, recordType }: UniversalActionsTabProps) {
  const [actionEvents, setActionEvents] = useState<ActionEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { users } = useWorkspaceUsers();

  // Function to get user name from user ID
  const getUserName = useCallback((userId: string) => {
    if (!userId || userId === 'System') return 'System';
    const user = users.find(u => u['id'] === userId);
    if (user) {
      // Check if this is the current user (using available properties)
      const currentUser = users.find(u => (u as any).isCurrentUser);
      if (currentUser && user.id === currentUser.id) {
        return 'Me';
      }
      return (user as any).fullName || user.name || (user as any).displayName || user.email || userId;
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
        return 'bg-[var(--hover)] text-gray-800 border-[var(--border)]';
      case 'status_change':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-[var(--hover)] text-gray-800 border-[var(--border)]';
    }
  };

  const hasExpandableContent = (event: ActionEvent) => {
    return event.content && event.content.length > 150;
  };

  const loadActionsFromAPI = useCallback(async () => {
    if (!record?.id) {
      console.log('🚨 [ACTIONS] No record ID, skipping API load');
      setLoading(false);
      return;
    }
    
    // Get workspace and user IDs with fallbacks
    const workspaceId = record.workspaceId || '01K5D01YCQJ9TJ7CT4DZDE79T1'; // TOP Engineering Plus workspace
    const userId = record.assignedUserId || '01K1VBYZG41K9QA0D9CF06KNRG'; // Ross Sylvester user ID
    
    console.log('🔍 [ACTIONS] Loading actions for record:', {
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
      const cacheKey = `actions-${record.id}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      let activityEvents: ActionEvent[] = [];
      let noteEvents: ActionEvent[] = [];
      
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          if (parsed.timestamp && Date.now() - parsed.timestamp < 180000) { // 3 minute cache
            activityEvents = parsed.activities || [];
            noteEvents = parsed.notes || [];
            console.log('⚡ [ACTIONS] Using cached actions data');
          }
        } catch (e) {
          console.log('Actions cache parse error, fetching fresh data');
        }
      }
      
      // Only fetch if no cache or cache is stale
      if (activityEvents.length === 0 && noteEvents.length === 0) {
        console.log('🔍 [ACTIONS] Fetching fresh actions data');
        
        // Load activities for this specific record using v1 APIs
        console.log('🔍 [ACTIONS] Fetching actions for record:', {
          recordId: record.id,
          recordType: recordType,
          record: record,
          recordKeys: Object.keys(record || {}),
          recordWorkspaceId: record?.workspaceId,
          recordAssignedUserId: record?.assignedUserId
        });
        
        // Build the correct query parameters based on record type
        let actionsQuery = '';
        if (recordType === 'leads' || recordType === 'people' || recordType === 'prospects' || recordType === 'speedrun' || recordType === 'actions') {
          actionsQuery = `personId=${record.id}`;
        } else if (recordType === 'companies') {
          actionsQuery = `companyId=${record.id}`;
        } else {
          // For other types, try both
          actionsQuery = `personId=${record.id}&companyId=${record.id}`;
        }
        
        console.log('🔍 [ACTIONS] Actions query:', actionsQuery);
        console.log('🔍 [ACTIONS] Full API URL:', `/api/v1/actions?${actionsQuery}`);
        
        const [actionsResponse, peopleResponse, companiesResponse] = await Promise.all([
          authFetch(`/api/v1/actions?${actionsQuery}`),
          authFetch(`/api/v1/people?companyId=${record.id}`),
          authFetch(`/api/v1/companies?id=${record.id}`)
        ]);
        
        console.log('🔍 [ACTIONS] API responses received:', {
          actionsResponse: actionsResponse,
          peopleResponse: peopleResponse,
          companiesResponse: companiesResponse
        });
        
        // Debug the actions response in detail
        console.log('🔍 [ACTIONS] Actions response details:', {
          success: actionsResponse?.success,
          data: actionsResponse?.data,
          error: actionsResponse?.error,
          actionsCount: actionsResponse?.data?.length || 0,
          fullResponse: actionsResponse
        });
        
        if (actionsResponse) {
          console.log('🔍 [ACTIONS] Actions response details:', {
            success: actionsResponse.success,
            data: actionsResponse.data,
            dataType: typeof actionsResponse.data,
            dataLength: Array.isArray(actionsResponse.data) ? actionsResponse.data.length : 'not array',
            error: actionsResponse.error,
            message: actionsResponse.message
          });
        } else {
          console.log('❌ [ACTIONS] No actions response received');
        }
        
        const allActivities: any[] = [];
        
        // Process actions - authFetch returns parsed data directly
        if (actionsResponse && actionsResponse.success && Array.isArray(actionsResponse.data)) {
          console.log('📅 [ACTIONS] Found actions:', actionsResponse.data.length);
          allActivities.push(...actionsResponse.data.map((action: any) => ({
            ...action,
            type: 'action',
            timestamp: action.completedAt || action.createdAt || action.scheduledAt
          })));
        } else {
          console.log('📅 [ACTIONS] No actions found or invalid response:', actionsResponse);
        }
        
        // Process people (if this is a company record)
        if (peopleResponse && peopleResponse.success && Array.isArray(peopleResponse.data) && recordType === 'companies') {
          console.log('📅 [ACTIONS] Found people:', peopleResponse.data.length);
          allActivities.push(...peopleResponse.data.map((person: any) => ({
            ...person,
            type: 'person',
            timestamp: person.createdAt
          })));
        }
        
        console.log('📅 [ACTIONS] Total activities found:', allActivities.length);
        
        // Filter activities for this specific record
        const recordActivities = allActivities.filter((activity: any) => {
          // Check if this activity is related to our record
          return (
            activity['leadId'] === record.id ||
            activity['prospectId'] === record.id ||
            activity['opportunityId'] === record.id ||
            activity['contactId'] === record.id ||
            activity['accountId'] === record.id ||
            activity['companyId'] === record.id ||
            activity['personId'] === record.id || // For speedrun actions
            activity['id'] === record.id // Also check if the activity itself matches our record
          );
        });
        
        console.log('📅 [ACTIONS] Filtered activities for record:', recordActivities.length);

        // Only show real actions from the database - no fallback data
        if (recordActivities.length === 0) {
          console.log('📅 [ACTIONS] No real actions found for this record');
          activityEvents = [];
        } else {
          // Convert activities to action events
          activityEvents = recordActivities.map((activity: any) => ({
            id: activity.id,
            type: 'activity' as const,
            date: new Date(activity.completedAt || activity.createdAt || Date.now()),
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

        // TODO: Load notes for this specific record using v1 API when available
        // Notes functionality will be implemented when the notes API is ready
        
        // Cache the data
        localStorage.setItem(cacheKey, JSON.stringify({
          activities: activityEvents,
          notes: noteEvents,
          timestamp: Date.now()
        }));
      }

      // Only show real actions from the database
      setActionEvents(prev => {
        const combined = [...activityEvents, ...noteEvents];
        console.log('🔄 [ACTIONS] Setting real actions only:', {
          activities: activityEvents.length,
          notes: noteEvents.length,
          combined: combined.length
        });
        
        // Remove duplicates based on ID
        const uniqueEvents = combined.filter((event, index, self) => 
          index === self.findIndex(e => e['id'] === event.id)
        );
        
        const sortedEvents = uniqueEvents.sort((a, b) => {
          // Handle undefined dates safely
          const dateA = a.date instanceof Date ? a.date : new Date(a.date || 0);
          const dateB = b.date instanceof Date ? b.date : new Date(b.date || 0);
          return dateB.getTime() - dateA.getTime();
        });
        console.log('🔄 [ACTIONS] Final actions events:', sortedEvents);
        
        return sortedEvents;
      });
    } catch (error) {
      console.error('Error loading actions from API:', error);
    } finally {
      setLoading(false);
    }
  }, [record?.id, recordType, getUserName]);


  // Listen for action creation events to refresh actions
  useEffect(() => {
    const handleActionCreated = (event: CustomEvent) => {
      console.log('🔄 [ACTIONS] Action created event received:', {
        eventDetail: event.detail,
        currentRecordId: record?.id,
        currentRecordType: recordType,
        eventRecordId: event.detail?.recordId,
        eventRecordType: event.detail?.recordType
      });
      
      const { recordId, recordType: eventRecordType } = event.detail;
      if (recordId === record?.id && eventRecordType === recordType) {
        console.log('🔄 [ACTIONS] Action created event matches current record, refreshing actions');
        // Clear cache and reload
        const cacheKey = `actions-${record.id}`;
        localStorage.removeItem(cacheKey);
        console.log('🗑️ [ACTIONS] Cleared cache and calling loadActionsFromAPI');
        // Trigger refresh with both function call and state update
        loadActionsFromAPI();
        setRefreshTrigger(prev => prev + 1);
      } else {
        console.log('🔄 [ACTIONS] Action created event does not match current record, ignoring');
      }
    };

    console.log('🔄 [ACTIONS] Setting up actionCreated event listener for record:', {
      recordId: record?.id,
      recordType: recordType
    });

    document.addEventListener('actionCreated', handleActionCreated as EventListener);
    
    return () => {
      console.log('🔄 [ACTIONS] Removing actionCreated event listener');
      document.removeEventListener('actionCreated', handleActionCreated as EventListener);
    };
  }, [record?.id, recordType]);

  useEffect(() => {
    if (record?.id) {
      // Initialize with empty events
      setActionEvents([]);
      // Load actions from API
      loadActionsFromAPI();
    }
  }, [record?.id, recordType, refreshTrigger]);

  const isPastEvent = (date: Date) => date <= new Date();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div className="text-lg font-medium text-[var(--foreground)]">Actions</div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-[var(--hover)] text-gray-700 rounded-full flex items-center justify-center text-sm font-medium">
              {actionEvents.length}
            </span>
            <span className="text-sm text-[var(--muted)]">
              {actionEvents['length'] === 1 ? 'Action' : 'Actions'}
            </span>
          </div>
        </div>
      </div>

      {actionEvents['length'] === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No actions yet</h3>
          <p className="text-[var(--muted)]">Real actions and activities will appear here when logged</p>
        </div>
      ) : (
        <div className="space-y-6">
          {actionEvents.map((event, index) => (
            <div key={event.id} className="flex items-start gap-4">
              {/* Action indicator */}
              <div className="flex flex-col items-center pt-1">
                <div className="w-8 h-8 rounded bg-[var(--background)] border-2 border-[var(--border)] flex items-center justify-center">
                  {getEventIcon(event.type)}
                </div>
                {index < actionEvents.length - 1 && (
                  <div className="w-px h-12 bg-[var(--loading-bg)] mt-2" />
                )}
              </div>

              {/* Event content */}
              <div className="flex-1 min-w-0 pb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-[var(--foreground)]">{event.title}</h4>
                      {!isPastEvent(event.date) && (
                        <span className="px-4 py-1 bg-red-100 text-red-800 text-xs rounded-full whitespace-nowrap">
                          Scheduled
                        </span>
                      )}
                      {event.metadata?.status && (
                        <span className={`px-4 py-1 text-xs rounded-full whitespace-nowrap ${
                          event.metadata.status === 'completed' ? 'bg-green-100 text-green-800' :
                          event.metadata.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-[var(--hover)] text-gray-800'
                        }`}>
                          {event.metadata.status}
                        </span>
                      )}
                    </div>
                    {event['description'] && (
                      <p className="text-sm text-[var(--muted)] mb-2">{event.description}</p>
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
                          <div className="mt-2 p-3 bg-[var(--panel-background)] rounded-lg border">
                            <div className="text-sm text-gray-700 whitespace-pre-wrap">
                              {event.content}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Business Context */}
                    {event.metadata && (
                      <div className="bg-[var(--panel-background)] rounded-lg p-3 mb-2">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          {event.metadata.type && (
                            <div>
                              <span className="font-medium text-gray-700">Type:</span>
                              <span className="ml-1 text-[var(--muted)] capitalize">{event.metadata.type}</span>
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
                    
                    <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
                      <span>{(() => {
                        try {
                          const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
                          if (isNaN(eventDate.getTime())) {
                            return 'Unknown time';
                          }
                          return formatDistanceToNow(eventDate, { addSuffix: true });
                        } catch (error) {
                          return 'Unknown time';
                        }
                      })()}</span>
                      {event['user'] && <span>by {event.user}</span>}
                      <span>•</span>
                      <span>{(() => {
                        try {
                          const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
                          if (isNaN(eventDate.getTime())) {
                            return 'Unknown date';
                          }
                          return format(eventDate, 'MMM d, yyyy h:mm a');
                        } catch (error) {
                          return 'Unknown date';
                        }
                      })()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Data Sources */}
      <div className="pt-6 border-t border-[var(--border)]">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Data Sources</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-[var(--panel-background)] rounded-lg p-3">
            <div className="font-medium text-[var(--foreground)]">System Records</div>
            <div className="text-[var(--muted)]">Created, Updated</div>
          </div>
          <div className="bg-[var(--panel-background)] rounded-lg p-3">
            <div className="font-medium text-[var(--foreground)]">Activities</div>
            <div className="text-[var(--muted)]">Calls, Emails, Meetings</div>
          </div>
          <div className="bg-[var(--panel-background)] rounded-lg p-3">
            <div className="font-medium text-[var(--foreground)]">Email Data</div>
            <div className="text-[var(--muted)]">Connected email threads</div>
          </div>
          <div className="bg-[var(--panel-background)] rounded-lg p-3">
            <div className="font-medium text-[var(--foreground)]">Notes</div>
            <div className="text-[var(--muted)]">Manual entries</div>
          </div>
        </div>
      </div>
    </div>
  );
}
