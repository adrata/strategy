import React, { useState, useEffect } from "react";
import { PipelineSkeleton } from "@/platform/ui/components/Loader";
import { formatDistanceToNow, format } from 'date-fns';
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  CalendarIcon, 
  DocumentTextIcon, 
  UserIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface TimelineEvent {
  id: string;
  type: 'record_created' | 'activity' | 'email' | 'note' | 'status_change' | 'assignment_change';
  date: Date;
  title: string;
  description?: string;
  user?: string;
  metadata?: any;
  source: 'system' | 'activity' | 'email' | 'note';
  priority?: 'low' | 'normal' | 'high';
  buyingSignal?: string;
  buyingSignalScore?: number;
}

interface EmailThread {
  threadId: string;
  subject: string;
  emails: TimelineEvent[];
  lastActivity: Date;
  participantCount: number;
  buyingSignals: number;
}

interface UniversalTimelineTabProps {
  entityType: 'lead' | 'prospect' | 'opportunity' | 'account' | 'contact';
  entityId: string;
  entityData: any;
}

export const UniversalTimelineTab: React.FC<UniversalTimelineTabProps> = ({
  entityType,
  entityId,
  entityData
}) => {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [emailThreads, setEmailThreads] = useState<EmailThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'unified' | 'threaded'>('unified');

  useEffect(() => {
    fetchTimelineData();
  }, [entityType, entityId]);

  const fetchTimelineData = async () => {
    try {
      setLoading(true);
      
      // Get workspace ID from entity data or use default
      const workspaceId = entityData?.workspaceId || '01K1VBYXHD0J895XAN0HGFBKJP';
      const userId = entityData?.assignedUserId || '01K1VBYZMWTCT09FWEKBDMCXZM';
      
      console.log('🔍 [PLATFORM TIMELINE] Fetching timeline for:', {
        entityType,
        entityId,
        workspaceId,
        userId
      });
      
      // Fetch activities and notes separately using unified API
      const activitiesUrl = `/api/data/unified?type=activities&action=get&workspaceId=${workspaceId}&userId=${userId}`;
      const notesUrl = `/api/data/unified?type=notes&action=get&workspaceId=${workspaceId}&userId=${userId}`;
      
      console.log('🔍 [PLATFORM TIMELINE] Fetching activities from:', activitiesUrl);
      console.log('🔍 [PLATFORM TIMELINE] Fetching notes from:', notesUrl);
      
      const [activitiesResponse, notesResponse] = await Promise.all([
        fetch(activitiesUrl),
        fetch(notesUrl)
      ]);
      
      console.log('📅 [PLATFORM TIMELINE] Activities response status:', activitiesResponse.status);
      console.log('📅 [PLATFORM TIMELINE] Notes response status:', notesResponse.status);
      
      const timelineEvents: any[] = [];
      
      // Process activities
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        console.log('📅 [PLATFORM TIMELINE] Activities data:', activitiesData);
        
        if (activitiesData.success && activitiesData.data) {
          console.log('📅 [PLATFORM TIMELINE] Found activities:', activitiesData.data.length);
          // Filter activities for this entity
          const entityActivities = activitiesData.data.filter((activity: any) => {
            return (
              activity.leadId === entityId ||
              activity.opportunityId === entityId ||
              activity.contactId === entityId ||
              activity.accountId === entityId ||
              activity.personId === entityId ||
              activity.companyId === entityId
            );
          });
          
          console.log('📅 [PLATFORM TIMELINE] Filtered activities for entity:', entityActivities.length);
          
          // Convert to timeline events
          const activityEvents = entityActivities.map((activity: any) => ({
            id: activity.id,
            type: 'activity',
            date: activity.createdAt,
            title: activity.subject || 'Activity',
            description: activity.description || '',
            user: activity.userId || 'System',
            source: 'activity',
            priority: activity.priority || 'normal',
            metadata: {
              type: activity.type,
              status: activity.status,
              scheduledAt: activity.scheduledAt
            }
          }));
          
          timelineEvents.push(...activityEvents);
        }
      }
      
      // Process notes
      if (notesResponse.ok) {
        const notesData = await notesResponse.json();
        console.log('📅 [PLATFORM TIMELINE] Notes data:', notesData);
        
        if (notesData.success && notesData.data) {
          console.log('📅 [PLATFORM TIMELINE] Found notes:', notesData.data.length);
          // Filter notes for this entity
          const entityNotes = notesData.data.filter((note: any) => {
            return (
              note.leadId === entityId ||
              note.opportunityId === entityId ||
              note.contactId === entityId ||
              note.accountId === entityId ||
              note.personId === entityId ||
              note.companyId === entityId
            );
          });
          
          console.log('📅 [PLATFORM TIMELINE] Filtered notes for entity:', entityNotes.length);
          
          // Convert to timeline events
          const noteEvents = entityNotes.map((note: any) => ({
            id: note.id,
            type: 'note',
            date: note.createdAt,
            title: note.title || 'Note added',
            description: note.content ? note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '') : '',
            user: note.authorId || 'System',
            source: 'note',
            priority: note.priority || 'normal',
            metadata: {
              content: note.content,
              type: note.type,
              isPrivate: note.isPrivate
            }
          }));
          
          timelineEvents.push(...noteEvents);
        }
      }
      
      // Add record creation event
      console.log('📅 [PLATFORM TIMELINE] Entity data for creation event:', {
        entityData,
        createdAt: entityData?.createdAt,
        entityType
      });
      
      if (entityData?.createdAt) {
        const entityName = entityType === 'account' ? 'company' : 
                          entityType.slice(0, -1);
        const creationEvent = {
          id: 'record_created',
          type: 'record_created',
          date: entityData.createdAt,
          title: `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} added to pipeline`,
          description: `New ${entityName} record created in system`,
          user: entityData.assignedUserId || entityData.createdBy || 'System',
          source: 'system',
          priority: 'normal'
        };
        timelineEvents.push(creationEvent);
        console.log('📅 [PLATFORM TIMELINE] Added creation event:', creationEvent);
      } else {
        console.log('📅 [PLATFORM TIMELINE] No createdAt found, skipping creation event');
      }
      
      // Sort by date (newest first)
      timelineEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // If no events found, add a fallback event to show the timeline is working
      if (timelineEvents.length === 0) {
        timelineEvents.push({
          id: 'no_events',
          type: 'record_created',
          date: new Date(),
          title: 'Timeline initialized',
          description: 'Timeline is working but no events found yet',
          user: 'System',
          source: 'system',
          priority: 'normal'
        });
        console.log('📅 [PLATFORM TIMELINE] No events found, added fallback event');
      }
      
      console.log('📅 [PLATFORM TIMELINE] Final timeline events:', timelineEvents.length, 'events');
      console.log('📅 [PLATFORM TIMELINE] Timeline events details:', timelineEvents);
      setTimelineEvents(timelineEvents);

      const emailEvents = timelineEvents.filter((e: any) => e['type'] === 'email');
      const threads = groupEmailsIntoThreads(emailEvents);
      setEmailThreads(threads);

    } catch (error) {
      console.error('❌ [PLATFORM TIMELINE] Error fetching timeline data:', error);
      setTimelineEvents([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const groupEmailsIntoThreads = (emailEvents: TimelineEvent[]): EmailThread[] => {
    const threadMap = new Map<string, EmailThread>();

    emailEvents.forEach(email => {
      const emailData = email.metadata;
      const threadId = emailData.threadId || emailData.subject?.replace(/^(Re:|Fwd?:)\s*/i, '') || email.id;
      
      if (!threadMap.has(threadId)) {
        threadMap.set(threadId, {
          threadId,
          subject: emailData.subject || '(No Subject)',
          emails: [],
          lastActivity: email.date,
          participantCount: 0,
          buyingSignals: 0
        });
      }

      const thread = threadMap.get(threadId)!;
      thread.emails.push(email);
      
      if (email.date > thread.lastActivity) {
        thread['lastActivity'] = email.date;
      }
      
      if (email.buyingSignal) {
        thread.buyingSignals++;
      }
    });

    threadMap.forEach(thread => {
      const participants = new Set<string>();
      thread.emails.forEach(email => {
        const emailData = email.metadata;
        participants.add(emailData.from);
        emailData.to?.forEach((to: string) => participants.add(to));
      });
      thread['participantCount'] = participants.size;
      thread.emails.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    return Array.from(threadMap.values()).sort((a, b) => 
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );
  };



  const formatEventTitle = (title: string) => {
    // Capitalize first letter of each word
    return title.replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatUserName = (user: string) => {
    // If it's a user ID, try to map to a name
    if (user && user.startsWith('01K1VBYX')) {
      // Map known user IDs to names
      const userMap: Record<string, string> = {
        '01K1VBYXHD0J895XAN0HGFBKJP': 'Dan',
        '01K1VBYV8ETM2RCQA4GNN9EG72': 'Dano',
        '01K1VBYZG41K9QA0D9CF06KNRG': 'Ross Sylvester'
      };
      return userMap[user] || user;
    }
    return user;
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
      case 'record_created':
      case 'created':
        return <UserIcon className="w-4 h-4" />;
      case 'status_change':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'assignment_change':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
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
      case 'record_created':
      case 'created':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'status_change':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'assignment_change':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderUnifiedTimeline = () => (
    <div className="space-y-4">
      {timelineEvents['length'] === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-sm">No timeline events yet</div>
        </div>
      ) : (
        timelineEvents.map((event, index) => (
          <div key={event.id} className="flex items-start gap-4">
            <div className="flex flex-col items-center pt-1">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${getEventColor(event.type)}`}>
                {getEventIcon(event.type)}
              </div>
              {index < timelineEvents.length - 1 && (
                <div className="w-px h-8 bg-gray-200 mt-2" />
              )}
            </div>

            <div className="flex-1 min-w-0 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {formatEventTitle(event.title)}
                    </span>
                    {event['buyingSignal'] && (
                      <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                        {Math.round((event.buyingSignalScore || 0) * 100)}%
                      </span>
                    )}
                  </div>
                  
                  {event['description'] && (
                    <p className="text-sm text-gray-600 mb-1">{event.description}</p>
                  )}
                  
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{formatDistanceToNow(event.date, { addSuffix: true })}</span>
                    {event['user'] && <span>• by {formatUserName(event.user)}</span>}
                  </div>
                </div>
                
                {event['type'] === 'email' && (
                  <button
                    onClick={() => setSelectedEmail(event.metadata)}
                    className="text-gray-500 hover:text-gray-700 text-xs px-2 py-1 rounded hover:bg-gray-100"
                  >
                    View
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderThreadedView = () => (
    <div className="space-y-4">
      {emailThreads['length'] === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-sm">No email threads yet</div>
        </div>
      ) : (
        emailThreads.map((thread, threadIndex) => (
          <div key={thread.threadId} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {thread.subject}
                </span>
                {thread.buyingSignals > 0 && (
                  <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                    {thread.buyingSignals}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {thread.emails.length} messages • {thread.participantCount} people
              </span>
            </div>

            <div className="space-y-2">
              {thread.emails.map((email, emailIndex) => (
                <div 
                  key={email.id} 
                  className="flex items-center gap-3 py-2 px-3 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedEmail(email.metadata)}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    email.metadata.from.includes('dano') ? 'bg-blue-500' : 'bg-green-500'
                  }`} />
                  
                  <span className="text-sm text-gray-900 min-w-0 flex-1">
                    {email.metadata.from.includes('dano') ? 'You' : email.metadata.from.split('@')[0]}
                  </span>
                  
                  <span className="text-xs text-gray-500 shrink-0">
                    {format(email.date, 'MMM d')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="py-8">
        <PipelineSkeleton message="Loading timeline..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-gray-900">Timeline</h3>
          <span className="text-xs text-gray-500">
            {timelineEvents.length} events • {timelineEvents.filter(e => e['type'] === 'email').length} emails
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('unified')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              viewMode === 'unified' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setViewMode('threaded')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              viewMode === 'threaded' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Threads
          </button>
        </div>
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        {viewMode === 'unified' ? renderUnifiedTimeline() : renderThreadedView()}
      </div>

      {selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedEmail(null)}>
          <div className="bg-white border border-gray-200 rounded-lg max-w-4xl max-h-[80vh] w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedEmail.subject || '(No Subject)'}
                </h3>
                <button 
                  onClick={() => setSelectedEmail(null)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ×
                </button>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="text-sm">
                  <span className="font-medium text-gray-900">From:</span>
                  <span className="ml-2 text-gray-600">{selectedEmail.from}</span>
                </div>
                
                <div className="text-sm">
                  <span className="font-medium text-gray-900">To:</span>
                  <span className="ml-2 text-gray-600">{selectedEmail.to?.join(', ')}</span>
                </div>
                
                <div className="text-sm">
                  <span className="font-medium text-gray-900">Date:</span>
                  <span className="ml-2 text-gray-600">
                    {format(new Date(selectedEmail.receivedAt), 'PPp')}
                  </span>
                </div>

                {selectedEmail['buyingSignal'] && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">Buying Signal:</span>
                    <span className="ml-2 px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                      {selectedEmail.buyingSignal.replace('_', ' ')} ({Math.round((selectedEmail.buyingSignalScore || 0) * 100)}%)
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              <div 
                className="text-gray-900 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: selectedEmail.body || selectedEmail.bodyHtml || 'No content available'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
