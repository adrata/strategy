import React, { useState, useEffect, useCallback } from "react";
import { authFetch } from '@/platform/api-fetch';
import { formatDistanceToNow, format } from 'date-fns';
import { ChevronDownIcon, ChevronRightIcon, EnvelopeIcon, DocumentTextIcon, PhoneIcon, CalendarIcon, UserIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useWorkspaceUsers } from '@/platform/hooks/useWorkspaceUsers';
import { InlineEditField } from '../InlineEditField';
import { isMeaningfulAction } from '@/platform/utils/meaningfulActions';

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
  
  // Success and error message state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteActionId, setDeleteActionId] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 4000);
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
    setShowErrorMessage(true);
    setTimeout(() => setShowErrorMessage(false), 4000);
  };

  const handleDeleteClick = (actionId: string) => {
    setDeleteActionId(actionId);
    setShowDeleteConfirm(true);
    setDeleteConfirmText('');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteActionId || deleteConfirmText.toLowerCase() !== 'delete') {
      return;
    }

    try {
      const response = await authFetch(`/api/v1/actions/${deleteActionId}`, {
        method: 'DELETE',
      });

      if (response && response.success) {
        handleSuccess('Action deleted successfully');
        // Clear cached actions data
        const cacheKey = `actions-${record.id}`;
        localStorage.removeItem(cacheKey);
        // Refresh the actions list immediately
        loadActionsFromAPI(true);
      } else {
        throw new Error(response?.error || 'Failed to delete action');
      }
    } catch (error) {
      console.error('Error deleting action:', error);
      handleError('Failed to delete action');
    } finally {
      setShowDeleteConfirm(false);
      setDeleteActionId(null);
      setDeleteConfirmText('');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setDeleteActionId(null);
    setDeleteConfirmText('');
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

  // Optimistic onSave handler for inline edits
  const handleOptimisticSave = useCallback(async (field: string, value: string, recordId?: string, recordTypeParam?: string) => {
    if (!onSave) return;
    
    try {
      // 1. Optimistically update the local state immediately
      if (recordId && recordTypeParam === 'action') {
        setActionEvents(prevEvents => 
          prevEvents.map(event => 
            event.id === recordId 
              ? { ...event, [field]: value, metadata: { ...event.metadata, [field]: value } }
              : event
          )
        );
        console.log('🔄 [ACTIONS] Optimistically updated action in local state:', { recordId, field, value });
      }
      
      // 2. Call the original onSave function
      await onSave(field, value, recordId, recordTypeParam);
      
      // 3. Show success message
      handleSuccess(`Updated successfully`);
      
      // Note: We don't refresh from API immediately after save because:
      // - The optimistic update (above) already shows the correct value in the UI
      // - The API call in onSave persists the change to the database
      // - Immediate refresh can cause stale data to overwrite the optimistic update
      // - Cache will naturally expire after 1 second and reload fresh data
      
      console.log('✅ [ACTIONS] Inline edit completed with optimistic update');
      
    } catch (error) {
      console.error('❌ [ACTIONS] Error in optimistic save:', error);
      handleError('Failed to update action');
      
      // Revert optimistic update on error
      if (recordId && recordTypeParam === 'action') {
        setActionEvents(prevEvents => 
          prevEvents.map(event => 
            event.id === recordId 
              ? { ...event, [field]: event[field], metadata: { ...event.metadata, [field]: event[field] } }
              : event
          )
        );
      }
      throw error; // Re-throw to let the UI handle the error
    }
  }, [onSave, record.id]);

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
      case 'MEETING':
      case 'Meeting':
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
        return 'bg-info-bg text-info-text border-info-border';
      case 'call':
      case 'phone_call':
        return 'bg-success-bg text-success-text border-success-border';
      case 'meeting':
      case 'MEETING':
      case 'Meeting':
      case 'appointment':
        return 'bg-panel-background text-foreground border-border';
      case 'note':
        return 'bg-warning-bg text-warning-text border-warning-border';
      case 'created':
        return 'bg-hover text-foreground border-border';
      case 'status_change':
        return 'bg-warning-bg text-warning-text border-warning-border';
      default:
        return 'bg-hover text-foreground border-border';
    }
  };

  const hasExpandableContent = (event: ActionEvent) => {
    return event.content && event.content.length > 150;
  };

  const loadActionsFromAPI = useCallback(async (forceRefresh: boolean = false) => {
    if (!record?.id) {
      console.log('🚨 [ACTIONS] No record ID, skipping API load');
      setLoading(false);
      return;
    }
    
    console.log('🔍 [ACTIONS] Loading actions for record:', {
      id: record.id,
      type: recordType,
      forceRefresh
    });
    
    // ⚡ CACHE-FIRST: Check cache BEFORE setting loading state (unless force refresh)
    const cacheKey = `actions-${record.id}`;
    const cacheVersionKey = `actions-version-${record.id}`;
    const currentCacheVersion = '2.0'; // Increment to clear old cache with incorrect format
    
    // Check if cache version is outdated and clear it
    const storedVersion = localStorage.getItem(cacheVersionKey);
    if (storedVersion !== currentCacheVersion) {
      console.log('🔄 [ACTIONS] Cache version outdated, clearing cache');
      localStorage.removeItem(cacheKey);
      localStorage.setItem(cacheVersionKey, currentCacheVersion);
    }
    
    const cachedData = localStorage.getItem(cacheKey);
    
    let activityEvents: ActionEvent[] = [];
    let noteEvents: ActionEvent[] = [];
    
    // Skip cache if force refresh is requested OR if cache is older than 500ms (very short cache for immediate updates)
    if (!forceRefresh && cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        // Reduced cache TTL to 500ms to ensure new actions appear quickly
        if (parsed.timestamp && Date.now() - parsed.timestamp < 500 && parsed.version === currentCacheVersion) {
          activityEvents = parsed.activities || [];
          noteEvents = parsed.notes || [];
          console.log('⚡ [ACTIONS] Using cached actions data (cache age:', Date.now() - parsed.timestamp, 'ms)');
          
          // Add "First Action" (record creation) if record has createdAt and it's not already in cache
          if (record?.createdAt) {
            const createdAt = new Date(record.createdAt);
            const hasCreationAction = activityEvents.some(event => {
              const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
              const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
              const creationDay = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate());
              return eventDay.getTime() === creationDay.getTime() || event.id === `first-action-${record.id}`;
            });
            
            if (!hasCreationAction) {
              // Try to get the creator user - use mainSellerId if available, otherwise fall back to System
              const creatorUserId = record.mainSellerId || record.createdBy || null;
              const creatorUserName = creatorUserId ? getUserName(creatorUserId) : 'System';
              
              const firstActionEvent: ActionEvent = {
                id: `first-action-${record.id}`,
                type: 'created',
                date: createdAt,
                title: 'Record Created',
                description: 'Record was created in the system',
                user: creatorUserName,
                metadata: {
                  type: 'Record Created',
                  status: 'COMPLETED',
                  isFirstAction: true,
                  createdBy: creatorUserId
                }
              };
              
              activityEvents.push(firstActionEvent);
            }
          }
          
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
        } else {
          console.log('🔄 [ACTIONS] Cache expired or invalid, fetching fresh data', {
            cacheAge: parsed.timestamp ? Date.now() - parsed.timestamp : 'unknown',
            versionMatch: parsed.version === currentCacheVersion
          });
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
        // For person records, query by personId (actions linked to this person will be returned)
        actionsQuery = `personId=${record.id}`;
      } else if (recordType === 'companies') {
        actionsQuery = `companyId=${record.id}`;
      } else {
        // For other types, try both
        actionsQuery = `personId=${record.id}&companyId=${record.id}`;
      }
      
      // Add cache-busting parameter if force refresh is requested
      if (forceRefresh) {
        actionsQuery += `&t=${Date.now()}`;
      }
      
      console.log('🔍 [ACTIONS] Actions query:', actionsQuery);
      
      // 🚀 OPTIMIZED API CALLS: Only fetch what we need based on record type
      // Add fallback response to prevent 401 errors from crashing the UI
      const emptyActionsFallback = { success: true, data: [] };
      const apiCalls: Promise<any>[] = [
        authFetch(`/api/v1/actions?${actionsQuery}`, {}, emptyActionsFallback)
      ];
      
      // Only fetch people for company records
      if (recordType === 'companies') {
        const peopleQuery = `companyId=${record.id}${forceRefresh ? `&t=${Date.now()}` : ''}`;
        const emptyPeopleFallback = { success: true, data: [] };
        apiCalls.push(authFetch(`/api/v1/people?${peopleQuery}`, {}, emptyPeopleFallback));
      }
      
      const responses = await Promise.allSettled(apiCalls);
      
      const [actionsResponse] = responses;
      const peopleResponse = responses[1];
      
      console.log('🔍 [ACTIONS] API responses received:', {
        actionsStatus: actionsResponse.status,
        peopleStatus: peopleResponse?.status,
        actionsData: actionsResponse.status === 'fulfilled' ? actionsResponse.value : null,
        actionsRejected: actionsResponse.status === 'rejected' ? actionsResponse.reason : null
      });
      
      const allActivities: any[] = [];
      
      // Process actions - handle both fulfilled and rejected promises
      if (actionsResponse.status === 'fulfilled' && actionsResponse.value?.success && Array.isArray(actionsResponse.value.data)) {
        console.log('📅 [ACTIONS] Found actions:', actionsResponse.value.data.length);
        allActivities.push(...actionsResponse.value.data.map((action: any) => ({
          ...action,
          activityType: 'action',  // Use different field name to avoid overwriting action.type
          timestamp: action.completedAt || action.createdAt || action.scheduledAt
        })));
      } else {
        // Enhanced error handling for authentication and other errors
        if (actionsResponse.status === 'rejected') {
          const error = actionsResponse.reason;
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          // Check if it's an authentication error
          if (errorMessage.includes('401') || errorMessage.includes('Authentication')) {
            console.warn('🔐 [ACTIONS] Authentication failed, using empty fallback:', errorMessage);
            // Fallback response was already used by apiFetch, but log the issue
            handleError('Authentication required. Please refresh the page or log in again.');
          } else {
            console.error('❌ [ACTIONS] API error:', errorMessage);
            handleError('Failed to load actions. Please try again.');
          }
        } else {
          console.log('📅 [ACTIONS] No actions found:', {
            status: actionsResponse.status,
            hasValue: !!actionsResponse.value,
            valueStructure: actionsResponse.status === 'fulfilled' ? Object.keys(actionsResponse.value || {}) : 'N/A'
          });
        }
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
        title: activity.type || 'Activity',
        description: activity.subject || (activity.description ? activity.description.substring(0, 100) + (activity.description.length > 100 ? '...' : '') : ''),
        content: activity.description || activity.outcome || '',
        user: getUserName(activity.userId || 'System'),
        metadata: {
          type: activity.type,
          status: activity.status,
          priority: activity.priority
        }
      }));

      // Filter to meaningful action types only (matches Last Action column filtering)
      // This filters out system actions like "record created", "record updated", etc.
      console.log('🔍 [ACTIONS] Before filtering:', {
        totalEvents: activityEvents.length,
        eventTypes: activityEvents.map(e => e.metadata?.type),
        sampleEvent: activityEvents[0]
      });

      activityEvents = activityEvents.filter(event => {
        // Check both metadata.type and direct type field
        const eventType = event.metadata?.type || event.type;
        const isMeaningful = eventType && isMeaningfulAction(eventType);
        
        if (!isMeaningful) {
          console.log('🔍 [ACTIONS] Filtering out non-meaningful action:', {
            eventType: eventType,
            title: event.title,
            id: event.id
          });
        }
        
        return isMeaningful;
      });

      console.log('🔍 [ACTIONS] After filtering to meaningful actions:', {
        filteredEvents: activityEvents.length,
        filteredTypes: activityEvents.map(e => e.metadata?.type)
      });
      
      // Add "First Action" (record creation) if record has createdAt
      // This shows when the record was first created/imported into the system
      if (record?.createdAt) {
        const createdAt = new Date(record.createdAt);
        // Check if we already have an action on the creation date (to avoid duplicates)
        const hasCreationAction = activityEvents.some(event => {
          const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
          const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
          const creationDay = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate());
          return eventDay.getTime() === creationDay.getTime();
        });
        
        if (!hasCreationAction) {
          // Try to get the creator user - use mainSellerId if available, otherwise fall back to System
          const creatorUserId = record.mainSellerId || record.createdBy || null;
          const creatorUserName = creatorUserId ? getUserName(creatorUserId) : 'System';
          
          const firstActionEvent: ActionEvent = {
            id: `first-action-${record.id}`,
            type: 'created',
            date: createdAt,
            title: 'Record Created',
            description: 'Record was created in the system',
            user: creatorUserName,
            metadata: {
              type: 'Record Created',
              status: 'COMPLETED',
              isFirstAction: true,
              createdBy: creatorUserId
            }
          };
          
          activityEvents.push(firstActionEvent);
          console.log('📅 [ACTIONS] Added first action event:', {
            date: createdAt,
            recordId: record.id,
            createdBy: creatorUserId,
            creatorName: creatorUserName
          });
        }
      }
      
      // Cache the data
      localStorage.setItem(cacheKey, JSON.stringify({
        activities: activityEvents,
        notes: noteEvents,
        timestamp: Date.now(),
        version: currentCacheVersion
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


  // Listen for action creation and update events to refresh actions
  useEffect(() => {
    const handleActionCreated = (event: CustomEvent) => {
      const { recordId, actionId, actionData } = event.detail || {};
      const recordCompanyId = record?.companyId || record?.company?.id;
      
      console.log('🔍 [ACTIONS] actionCreated event received:', {
        eventRecordId: recordId,
        currentRecordId: record?.id,
        actionId: actionId,
        recordCompanyId: recordCompanyId,
        actionPersonId: actionData?.personId,
        actionCompanyId: actionData?.companyId,
        matchesRecordId: recordId === record?.id,
        matchesPersonId: actionData?.personId === record?.id,
        matchesCompanyId: actionData?.companyId === recordCompanyId
      });
      
      // Match by recordId, or by personId/companyId from action data
      const matchesRecordId = recordId === record?.id;
      const matchesPersonId = actionData?.personId === record?.id;
      const matchesCompanyId = recordCompanyId && actionData?.companyId === recordCompanyId;
      
      if (matchesRecordId || matchesPersonId || matchesCompanyId) {
        console.log('🔄 [ACTIONS] Action created event matches current record, refreshing actions', {
          reason: matchesRecordId ? 'recordId' : matchesPersonId ? 'personId' : 'companyId'
        });
        // Clear cache and reload
        const cacheKey = `actions-${record.id}`;
        localStorage.removeItem(cacheKey);
        // Also clear company cache if applicable
        if (recordCompanyId) {
          const companyCacheKey = `actions-${recordCompanyId}`;
          localStorage.removeItem(companyCacheKey);
        }
        loadActionsFromAPI(true); // Force refresh
      }
    };

    const handleActionCreatedWithData = (event: CustomEvent) => {
      const { recordId, actionData } = event.detail || {};
      const recordCompanyId = record?.companyId || record?.company?.id;
      
      console.log('🔍 [ACTIONS] actionCreatedWithData event received:', {
        eventRecordId: recordId,
        currentRecordId: record?.id,
        recordCompanyId: recordCompanyId,
        hasActionData: !!actionData,
        actionPersonId: actionData?.personId,
        actionCompanyId: actionData?.companyId,
        matchesRecordId: recordId === record?.id,
        matchesPersonId: actionData?.personId === record?.id,
        matchesCompanyId: recordCompanyId && actionData?.companyId === recordCompanyId
      });
      
      // Match by recordId, or by personId/companyId from action data
      const matchesRecordId = recordId === record?.id;
      const matchesPersonId = actionData?.personId === record?.id;
      const matchesCompanyId = recordCompanyId && actionData?.companyId === recordCompanyId;
      
      if ((matchesRecordId || matchesPersonId || matchesCompanyId) && actionData) {
        console.log('⚡ [ACTIONS] Optimistically adding new action immediately:', {
          actionData,
          matchReason: matchesRecordId ? 'recordId' : matchesPersonId ? 'personId' : 'companyId'
        });
        
        // Optimistically add the new action to the list immediately
        const newEvent: ActionEvent = {
          id: actionData.id,
          type: 'activity' as const,
          date: new Date(actionData.completedAt || actionData.createdAt || Date.now()),
          title: actionData.type || 'Activity',
          description: actionData.subject || '',
          content: actionData.description || '',
          user: getUserName(actionData.userId || 'System'),
          metadata: {
            type: actionData.type,
            status: actionData.status,
            priority: actionData.priority
          }
        };
        
        // Add to state immediately
        setActionEvents(prev => {
          // Check if action already exists (avoid duplicates)
          const exists = prev.some(e => e.id === newEvent.id);
          if (exists) {
            console.log('⚠️ [ACTIONS] Action already exists, skipping optimistic add');
            return prev;
          }
          
          // Add new event and re-sort
          const updated = [newEvent, ...prev];
          const sorted = updated.sort((a, b) => {
            const dateA = a.date instanceof Date ? a.date : new Date(a.date || 0);
            const dateB = b.date instanceof Date ? b.date : new Date(b.date || 0);
            return dateB.getTime() - dateA.getTime();
          });
          
          console.log('✅ [ACTIONS] Added action optimistically, total count:', sorted.length);
          return sorted;
        });
        
        // Cache clearing and refresh are handled by the handleActionCreated event listener
        // No need for duplicate background refresh that causes race conditions
      }
    };

    const handleActionUpdated = (event: CustomEvent) => {
      const { recordId, actionId } = event.detail || {};
      // Match by recordId only - don't check recordType to avoid mismatches
      if (recordId === record?.id) {
        console.log('🔄 [ACTIONS] Action updated event matches current record, refreshing actions');
        // Clear cache and reload
        const cacheKey = `actions-${record.id}`;
        localStorage.removeItem(cacheKey);
        loadActionsFromAPI(true); // Force refresh
      }
    };

    console.log('👂 [ACTIONS] Attaching event listeners for record:', record?.id);
    document.addEventListener('actionCreated', handleActionCreated as EventListener);
    document.addEventListener('actionCreatedWithData', handleActionCreatedWithData as EventListener);
    document.addEventListener('actionUpdated', handleActionUpdated as EventListener);
    
    return () => {
      console.log('🧹 [ACTIONS] Cleaning up event listeners for record:', record?.id);
      document.removeEventListener('actionCreated', handleActionCreated as EventListener);
      document.removeEventListener('actionCreatedWithData', handleActionCreatedWithData as EventListener);
      document.removeEventListener('actionUpdated', handleActionUpdated as EventListener);
    };
  }, [record?.id, recordType, loadActionsFromAPI, getUserName]);

  useEffect(() => {
    if (record?.id) {
      // Load actions from API (cache-first approach handles initial state)
      loadActionsFromAPI();
    }
  }, [record?.id, recordType, refreshTrigger, loadActionsFromAPI]);

  const isPastEvent = (date: Date) => date <= new Date();

  // Group actions by time periods
  const groupActionsByTime = (events: ActionEvent[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const groups: Record<string, ActionEvent[]> = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'Last Week': [],
      'This Month': [],
      'Earlier': []
    };
    
    events.forEach(event => {
      const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
      const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      
      if (eventDay.getTime() === today.getTime()) {
        groups['Today'].push(event);
      } else if (eventDay.getTime() === yesterday.getTime()) {
        groups['Yesterday'].push(event);
      } else if (eventDate >= thisWeekStart && eventDate < today) {
        groups['This Week'].push(event);
      } else if (eventDate >= lastWeekStart && eventDate < thisWeekStart) {
        groups['Last Week'].push(event);
      } else if (eventDate >= thisMonthStart && eventDate < lastWeekStart) {
        groups['This Month'].push(event);
      } else {
        groups['Earlier'].push(event);
      }
    });
    
    // Sort events within each group by date (newest first)
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });
    });
    
    return groups;
  };

  const groupedActions = groupActionsByTime(actionEvents);
  
  // Get time periods that have actions
  const timePeriodsWithActions = Object.keys(groupedActions).filter(period => 
    groupedActions[period].length > 0
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div className="text-lg font-medium text-foreground">
            All Actions
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">
              {actionEvents.length} {actionEvents.length === 1 ? 'Action' : 'Actions'}
            </span>
            {!loading && actionEvents.length > 0 && (
              <div className="flex items-center gap-2">
                {timePeriodsWithActions.map((timePeriod, index) => (
                  <span key={timePeriod} className="text-xs text-muted">
                    {groupedActions[timePeriod].length} {timePeriod.toLowerCase()}
                    {index < timePeriodsWithActions.length - 1 && ', '}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>


      {loading ? (
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-loading-bg rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-loading-bg rounded w-3/4"></div>
                <div className="h-3 bg-loading-bg rounded w-1/2"></div>
                <div className="h-3 bg-loading-bg rounded w-1/4"></div>
              </div>
            </div>
            <div className="flex items-start gap-4 mt-4">
              <div className="w-8 h-8 bg-loading-bg rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-loading-bg rounded w-2/3"></div>
                <div className="h-3 bg-loading-bg rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      ) : actionEvents.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-foreground mb-2">No actions yet</h3>
          <p className="text-muted">Actions and activities will appear here when logged</p>
        </div>
      ) : (
        <div className="space-y-8">
          {timePeriodsWithActions.map((timePeriod, periodIndex) => (
            <div key={timePeriod} className="space-y-4">
              {/* Time Period Header */}
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-foreground">
                  {timePeriod}
                </h3>
                <span className="text-sm text-muted">
                  ({groupedActions[timePeriod].length} {groupedActions[timePeriod].length === 1 ? 'action' : 'actions'})
                </span>
              </div>
              
              {/* Actions for this time period */}
              <div className="space-y-4">
                {groupedActions[timePeriod].map((event, index) => (
                  <div key={event.id} className="flex items-start gap-4">
                    {/* Action indicator */}
                    <div className="flex flex-col items-center pt-1">
                      <div className="w-8 h-8 rounded bg-background border-2 border-border flex items-center justify-center">
                        {getEventIcon(event.metadata?.type || event.type || 'activity')}
                      </div>
                      {index < groupedActions[timePeriod].length - 1 && (
                        <div className="w-px h-12 bg-loading-bg mt-2" />
                      )}
                    </div>

                    {/* Event content */}
                    <div className="flex-1 min-w-0 pb-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {/* Action type badge - now first and bold */}
                          {event.metadata?.type === 'LinkedIn Connection' || event.type === 'LinkedIn Connection' ? (
                            <span className="text-base font-bold text-foreground">
                              {event.metadata?.type || event.type || 'Action'}
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-sm rounded-full bg-hover text-foreground font-semibold">
                              {event.metadata?.type || event.type || 'Action'}
                            </span>
                          )}
                          {!isPastEvent(event.date) && event.metadata?.status?.toUpperCase() !== 'COMPLETED' && (
                            <span className="px-4 py-1 bg-error/10 text-error text-xs rounded-full whitespace-nowrap">
                              Scheduled
                            </span>
                          )}
                          {event.metadata?.status && (
                            <span className={`px-4 py-1 text-xs rounded-full whitespace-nowrap ${
                              event.metadata.status.toUpperCase() === 'COMPLETED' ? 'bg-success/10 text-success' :
                              event.metadata.status.toUpperCase() === 'IN_PROGRESS' ? 'bg-primary/10 text-primary' :
                              'bg-hover text-foreground'
                            }`}>
                              {event.metadata.status.toUpperCase()}
                            </span>
                          )}
                        </div>
                    <InlineEditField
                      value={event.description}
                      field="description"
                      onSave={handleOptimisticSave}
                      recordId={event.id}
                      recordType="action"
                      onSuccess={handleSuccess}
                      placeholder="Enter action description"
                      type="textarea"
                      className="text-sm text-muted mb-2"
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
                          <div className="mt-2 p-3 bg-panel-background rounded-lg border">
                            <div className="text-sm text-foreground whitespace-pre-wrap">
                              {event.content}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Business Context */}
                    {event.metadata && (event.metadata.priority || (event.metadata.status && event.metadata.status !== 'completed')) && (
                      <div className="bg-panel-background rounded-lg p-3 mb-2">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          {event.metadata.priority && (
                            <div>
                              <span className="font-medium text-foreground">Priority:</span>
                              <span className={`ml-1 px-1 py-0.5 rounded text-xs ${
                                event.metadata.priority === 'high' ? 'bg-error/10 text-error' :
                                event.metadata.priority === 'medium' ? 'bg-warning/10 text-warning' :
                                'bg-success/10 text-success'
                              }`}>
                                {event.metadata.priority}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted">
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
                      <span>•</span>
                      <button
                        onClick={() => handleDeleteClick(event.id)}
                        className="flex items-center gap-1 text-error hover:text-error/80 transition-colors"
                      >
                        <TrashIcon className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
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



      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-success/10 border border-success rounded-lg shadow-lg px-4 py-3 max-w-sm">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-success mr-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-success font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {showErrorMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-error/10 border border-error rounded-lg shadow-lg px-4 py-3 max-w-sm">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-error mr-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-error font-medium">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-error/10 rounded-full flex items-center justify-center">
                <TrashIcon className="w-5 h-5 text-error" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Delete Action</h3>
                <p className="text-sm text-muted">This action cannot be undone.</p>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type "delete" to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Type 'delete' here"
                autoFocus
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteConfirmText.toLowerCase() !== 'delete'}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                Delete Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}