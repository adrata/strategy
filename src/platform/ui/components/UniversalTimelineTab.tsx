import React, { useState, useEffect } from "react";
import { PipelineSkeleton } from "@/platform/ui/components/Loader";
import { formatDistanceToNow, format } from 'date-fns';

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
      
      const response = await fetch(`/api/timeline/${entityType}/${entityId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch timeline data');
      }

      const data = await response.json();
      setTimelineEvents(data.timeline || []);

      const emailEvents = (data.timeline || []).filter((e: any) => e['type'] === 'email');
      const threads = groupEmailsIntoThreads(emailEvents);
      setEmailThreads(threads);

    } catch (error) {
      console.error('Error fetching timeline data:', error);
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

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'record_created': return '●';
      case 'activity': return '●';
      case 'email': return '●';
      case 'note': return '●';
      case 'status_change': return '●';
      case 'assignment_change': return '●';
      default: return '●';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'record_created': return 'bg-blue-500';
      case 'activity': return 'bg-green-500';
      case 'email': return 'bg-purple-500';
      case 'note': return 'bg-yellow-500';
      case 'status_change': return 'bg-orange-500';
      case 'assignment_change': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
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
              <div className={`w-2 h-2 rounded-full ${getEventColor(event.type)}`} />
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
