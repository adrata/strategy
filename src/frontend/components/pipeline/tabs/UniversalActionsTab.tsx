import React, { useState, useEffect, useCallback } from "react";
import { authFetch } from '@/platform/api-fetch';
import { formatDistanceToNow, format } from 'date-fns';
import { ChevronDownIcon, ChevronRightIcon, EnvelopeIcon, DocumentTextIcon, PhoneIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';
import { useWorkspaceUsers } from '@/platform/hooks/useWorkspaceUsers';
import { InlineEditField } from '../InlineEditField';

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
  onSave?: (field: string, value: string, recordId?: string, recordType?: string) => Promise<void>;
}

export function UniversalActionsTab({ record, recordType, onSave }: UniversalActionsTabProps) {
  const [actionEvents, setActionEvents] = useState<ActionEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { users } = useWorkspaceUsers();
  
  // Success message state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

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
        return 'bg-[var(--info-bg)] text-[var(--info-text)] border-[var(--info-border)]';
      case 'call':
      case 'phone_call':
        return 'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]';
      case 'meeting':
      case 'appointment':
        return 'bg-[var(--panel-background)] text-[var(--foreground)] border-[var(--border)]';
      case 'note':
        return 'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]';
      case 'created':
        return 'bg-[var(--hover)] text-[var(--foreground)] border-[var(--border)]';
      case 'status_change':
        return 'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]';
      default:
        return 'bg-[var(--hover)] text-[var(--foreground)] border-[var(--border)]';
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
    
    console.log('🔍 [ACTIONS] Loading actions for record:', {
      id: record.id,
      type: recordType
    });
    
    // ⚡ CACHE-FIRST: Check cache BEFORE setting loading state
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
          
          // Set cached data immediately and return - NO LOADING STATE
          const combined = [...activityEvents, ...noteEvents];
          const uniqueEvents = combined.filter((event, index, self) => 
            index === self.findIndex(e => e.id === event.id)
          );
          const sortedEvents = uniqueEvents.sort((a, b) => {
            const dateA = a.date instanceof Date ? a.date : new Date(a.date || 0);
            const dateB = b.date instanceof Date ? b.date : new Date(b.date || 0);
            return dateB.getTime() - dateA.getTime();
          });
          
          console.log('⚡ [ACTIONS] Setting cached data immediately:', {
            count: sortedEvents.length,
            events: sortedEvents.map(e => ({ id: e.id, title: e.title, date: e.date }))
          });
          
          setActionEvents(sortedEvents);
          setLoading(false);
          return; // Skip loading entirely when cache exists
        }
      } catch (e) {
        console.log('Actions cache parse error, fetching fresh data');
      }
    }
    
    // Only reach here if no valid cache - now set loading state
    setLoading(true);
    try {
      // Fetch fresh data since no valid cache exists
      console.log('🔍 [ACTIONS] Fetching fresh actions data');
      
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
      
      // 🚀 OPTIMIZED API CALLS: Only fetch what we need based on record type
      const apiCalls: Promise<any>[] = [
        authFetch(`/api/v1/actions?${actionsQuery}`)
      ];
      
      // Only fetch people for company records
      if (recordType === 'companies') {
        apiCalls.push(authFetch(`/api/v1/people?companyId=${record.id}`));
      }
      
      const responses = await Promise.allSettled(apiCalls);
      
      const [actionsResponse] = responses;
      const peopleResponse = responses[1];
      
      console.log('🔍 [ACTIONS] API responses received:', {
        actionsStatus: actionsResponse.status,
        peopleStatus: peopleResponse?.status,
        actionsData: actionsResponse.status === 'fulfilled' ? actionsResponse.value : null
      });
      
      const allActivities: any[] = [];
      
      // Process actions - handle both fulfilled and rejected promises
      if (actionsResponse.status === 'fulfilled' && actionsResponse.value?.success && Array.isArray(actionsResponse.value.data)) {
        console.log('📅 [ACTIONS] Found actions:', actionsResponse.value.data.length);
        allActivities.push(...actionsResponse.value.data.map((action: any) => ({
          ...action,
          type: 'action',
          timestamp: action.completedAt || action.createdAt || action.scheduledAt
        })));
      } else {
        console.log('📅 [ACTIONS] No actions found or API error:', {
          status: actionsResponse.status,
          reason: actionsResponse.status === 'rejected' ? actionsResponse.reason : 'No data'
        });
      }
      
      // Process people (if this is a company record and call succeeded)
      if (peopleResponse?.status === 'fulfilled' && peopleResponse.value?.success && Array.isArray(peopleResponse.value.data) && recordType === 'companies') {
        console.log('📅 [ACTIONS] Found people:', peopleResponse.value.data.length);
        allActivities.push(...peopleResponse.value.data.map((person: any) => ({
          ...person,
          type: 'person',
          timestamp: person.createdAt
        })));
      }
      
      console.log('📅 [ACTIONS] Total activities found:', allActivities.length);
      
      // 🎯 SIMPLIFIED FILTERING: Only check relevant IDs based on record type
      const recordActivities = allActivities.filter((activity: any) => {
        if (recordType === 'companies') {
          return activity.companyId === record.id || activity.id === record.id;
        } else {
          return activity.personId === record.id || activity.id === record.id;
        }
      });
      
      console.log('📅 [ACTIONS] Filtered activities for record:', {
        total: allActivities.length,
        filtered: recordActivities.length,
        recordType,
        recordId: record.id
      });

      // Convert activities to action events
      activityEvents = recordActivities.map((activity: any) => ({
        id: activity.id,
        type: 'activity' as const,
        date: new Date(activity.completedAt || activity.createdAt || Date.now()),
        title: activity.subject || activity.type || 'Activity',
        description: activity.description ? activity.description.substring(0, 100) + (activity.description.length > 100 ? '...' : '') : '',
        content: activity.description || activity.outcome || '',
        user: getUserName(activity.userId || 'System'),
        metadata: {
          type: activity.type,
          status: activity.status,
          priority: activity.priority
        }
      }));

      // Filter to core action types only
      const CORE_ACTION_TYPES = [
        'LinkedIn Connection',
        'LinkedIn InMail', 
        'LinkedIn Message',
        'Phone',
        'Email',
        'Meeting'
      ];

      activityEvents = activityEvents.filter(event => 
        event.metadata?.type && CORE_ACTION_TYPES.includes(event.metadata.type)
      );
      
      // Cache the data
      localStorage.setItem(cacheKey, JSON.stringify({
        activities: activityEvents,
        notes: noteEvents,
        timestamp: Date.now()
      }));

      // Update state with fresh data from API
      const combined = [...activityEvents, ...noteEvents];
      
      // Remove duplicates based on ID
      const uniqueEvents = combined.filter((event, index, self) => 
        index === self.findIndex(e => e.id === event.id)
      );
      
      const sortedEvents = uniqueEvents.sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date || 0);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      console.log('🔄 [ACTIONS] Final actions events from API:', {
        count: sortedEvents.length,
        events: sortedEvents.map(e => ({ id: e.id, title: e.title, date: e.date }))
      });
      
      setActionEvents(sortedEvents);
    } catch (error) {
      console.error('❌ [ACTIONS] Error loading actions from API:', error);
    } finally {
      setLoading(false);
    }
  }, [record?.id, recordType, getUserName]);


  // Listen for action creation events to refresh actions
  useEffect(() => {
    const handleActionCreated = (event: CustomEvent) => {
      const { recordId, recordType: eventRecordType } = event.detail || {};
      if (recordId === record?.id && eventRecordType === recordType) {
        console.log('🔄 [ACTIONS] Action created event matches current record, refreshing actions');
        // Clear cache and reload
        const cacheKey = `actions-${record.id}`;
        localStorage.removeItem(cacheKey);
        loadActionsFromAPI();
      }
    };

    document.addEventListener('actionCreated', handleActionCreated as EventListener);
    
    return () => {
      document.removeEventListener('actionCreated', handleActionCreated as EventListener);
    };
  }, [record?.id, recordType, loadActionsFromAPI]);

  useEffect(() => {
    if (record?.id) {
      // Load actions from API (cache-first approach handles initial state)
      loadActionsFromAPI();
    }
  }, [record?.id, recordType, refreshTrigger, loadActionsFromAPI]);

  const isPastEvent = (date: Date) => date <= new Date();

  // Group actions by type
  const groupedActions = actionEvents.reduce((groups, event) => {
    const type = event.metadata?.type || 'Other';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(event);
    return groups;
  }, {} as Record<string, ActionEvent[]>);

  // Sort action types by count (most common first)
  const sortedActionTypes = Object.keys(groupedActions).sort((a, b) => 
    groupedActions[b].length - groupedActions[a].length
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div className="text-lg font-medium text-[var(--foreground)]">
            All Actions
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-[var(--hover)] text-gray-700 rounded-full flex items-center justify-center text-sm font-medium">
              {actionEvents.length}
            </span>
            <span className="text-sm text-[var(--muted)]">
              {actionEvents.length === 1 ? 'Action' : 'Actions'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Type Summary */}
      {!loading && actionEvents.length > 0 && (
        <div className="bg-[var(--panel-background)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Action Breakdown</h4>
          <div className="flex flex-wrap gap-2">
            {sortedActionTypes.map((actionType) => (
              <div key={actionType} className="flex items-center gap-2 px-3 py-2 bg-[var(--background)] rounded-lg border border-[var(--border)]">
                <span className="text-sm font-medium text-[var(--foreground)]">{actionType}</span>
                <span className="px-2 py-1 bg-[var(--accent-bg)] text-[var(--accent-text)] text-xs font-medium rounded-full">
                  {groupedActions[actionType].length}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-[var(--loading-bg)] rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--loading-bg)] rounded w-3/4"></div>
                <div className="h-3 bg-[var(--loading-bg)] rounded w-1/2"></div>
                <div className="h-3 bg-[var(--loading-bg)] rounded w-1/4"></div>
              </div>
            </div>
            <div className="flex items-start gap-4 mt-4">
              <div className="w-8 h-8 bg-[var(--loading-bg)] rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--loading-bg)] rounded w-2/3"></div>
                <div className="h-3 bg-[var(--loading-bg)] rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      ) : actionEvents.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No actions yet</h3>
          <p className="text-[var(--muted)]">Actions and activities will appear here when logged</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedActionTypes.map((actionType, typeIndex) => (
            <div key={actionType} className="space-y-4">
              {/* Action Type Header */}
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">
                  {actionType}
                </h3>
                <span className="px-3 py-1 bg-[var(--accent-bg)] text-[var(--accent-text)] text-sm font-medium rounded-full">
                  {groupedActions[actionType].length}
                </span>
              </div>
              
              {/* Actions for this type */}
              <div className="space-y-4">
                {groupedActions[actionType].map((event, index) => (
                  <div key={event.id} className="flex items-start gap-4">
                    {/* Action indicator */}
                    <div className="flex flex-col items-center pt-1">
                      <div className="w-8 h-8 rounded bg-[var(--background)] border-2 border-[var(--border)] flex items-center justify-center">
                        {getEventIcon(event.type)}
                      </div>
                      {index < groupedActions[actionType].length - 1 && (
                        <div className="w-px h-12 bg-[var(--loading-bg)] mt-2" />
                      )}
                    </div>

                    {/* Event content */}
                    <div className="flex-1 min-w-0 pb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {/* Action Type Badge - Show prominently */}
                      {event.metadata?.type && (
                        <span className="px-3 py-1 bg-[var(--accent-bg)] text-[var(--accent-text)] text-xs font-medium rounded-full whitespace-nowrap border border-[var(--accent-border)]">
                          {event.metadata.type}
                        </span>
                      )}
                      <InlineEditField
                        value={event.title}
                        field="title"
                        onSave={onSave || (() => Promise.resolve())}
                        recordId={event.id}
                        recordType="action"
                        onSuccess={handleSuccess}
                        placeholder="Enter action title"
                        className="text-sm font-medium text-[var(--foreground)]"
                      />
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
                    <InlineEditField
                      value={event.description}
                      field="description"
                      onSave={onSave || (() => Promise.resolve())}
                      recordId={event.id}
                      recordType="action"
                      onSuccess={handleSuccess}
                      placeholder="Enter action description"
                      type="textarea"
                      className="text-sm text-[var(--muted)] mb-2"
                    />
                    
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
                    {event.metadata && (event.metadata.priority || (event.metadata.status && event.metadata.status !== 'completed')) && (
                      <div className="bg-[var(--panel-background)] rounded-lg p-3 mb-2">
                        <div className="grid grid-cols-2 gap-4 text-xs">
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
                      {event.user && <span>by {event.user}</span>}
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
            </div>
          ))}
        </div>
      )}


      {/* Success Toast */}
      {showSuccessMessage && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="px-4 py-2 rounded-lg shadow-lg bg-green-50 border border-green-200 text-green-800">
            <div className="flex items-center space-x-2">
              <span>✓</span>
              <span className="text-sm font-medium">{successMessage}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}