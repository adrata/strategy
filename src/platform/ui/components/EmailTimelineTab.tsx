import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from 'date-fns';

interface EmailMessage {
  id: string;
  subject: string;
  body: string;
  from: string;
  to: string[];
  cc?: string[];
  receivedAt: Date;
  sentAt: Date;
  buyingSignal?: string;
  buyingSignalScore?: number;
  threadId?: string;
}

interface EmailTimelineTabProps {
  entityType: 'lead' | 'prospect' | 'opportunity' | 'account' | 'contact';
  entityId: string;
  entityName?: string;
}

export const EmailTimelineTab: React.FC<EmailTimelineTabProps> = ({
  entityType,
  entityId,
  entityName
}) => {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [groupByThread, setGroupByThread] = useState(true);

  useEffect(() => {
    fetchEmails();
  }, [entityType, entityId]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/emails/${entityType}/${entityId}`);
      if (response.ok) {
        const emailData = await response.json();
        setEmails(emailData.emails || []);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupEmailsByThread = (emails: EmailMessage[]) => {
    const threads = new Map<string, EmailMessage[]>();
    
    emails.forEach(email => {
      const threadId = email.threadId || email.id;
      if (!threads.has(threadId)) {
        threads.set(threadId, []);
      }
      threads.get(threadId)!.push(email);
    });

    // Sort each thread by date
    threads.forEach(thread => {
      thread.sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime());
    });

    return Array.from(threads.values()).sort((a, b) => 
      new Date(b[b.length - 1].receivedAt).getTime() - new Date(a[a.length - 1].receivedAt).getTime()
    );
  };

  const truncateBody = (body: string, maxLength: number = 120) => {
    const plainText = body.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return plainText.length > maxLength ? plainText.substring(0, maxLength) + '...' : plainText;
  };

  const getBuyingSignalColor = (signal?: string) => {
    switch (signal) {
      case 'explicit_purchase_intent': return 'text-green-600 bg-green-50';
      case 'pricing_inquiry': return 'text-blue-600 bg-blue-50';
      case 'demo_request': return 'text-purple-600 bg-purple-50';
      case 'trial_request': return 'text-orange-600 bg-orange-50';
      default: return 'text-muted bg-panel-background';
    }
  };

  const renderEmailCard = (email: EmailMessage, isInThread: boolean = false) => (
    <div 
      key={email.id}
      className={`border border-border rounded-lg p-4 hover:bg-primary cursor-pointer transition-colors ${isInThread ? 'ml-6 mt-2' : 'mb-4'}`}
      onClick={() => setSelectedEmail(email)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-foreground">
              {email.subject || '(No Subject)'}
            </span>
            {email['buyingSignal'] && (
              <span className={`text-xs px-2 py-1 rounded-full ${getBuyingSignalColor(email.buyingSignal)}`}>
                {email.buyingSignal.replace('_', ' ')} ({Math.round((email.buyingSignalScore || 0) * 100)}%)
              </span>
            )}
          </div>
          
          <div className="text-sm text-muted mb-2">
            <span className="font-medium">From:</span> {email.from}
            {email.to.length > 0 && (
              <>
                <span className="mx-2">•</span>
                <span className="font-medium">To:</span> {email.to.slice(0, 2).join(', ')}
                {email.to.length > 2 && <span> +{email.to.length - 2} more</span>}
              </>
            )}
          </div>
          
          <div className="text-sm text-foreground mb-2">
            {truncateBody(email.body)}
          </div>
          
          <div className="text-xs text-muted">
            {formatDistanceToNow(new Date(email.receivedAt), { addSuffix: true })}
          </div>
        </div>
        
        <div className="ml-4 flex flex-col items-end">
          <div className={`w-3 h-3 rounded-full ${
            email.from.includes('dano') || email.from.includes('retail-products') 
              ? 'bg-blue-500' 
              : 'bg-green-500'
          }`} title={email.from.includes('dano') ? 'Outgoing' : 'Incoming'} />
        </div>
      </div>
    </div>
  );

  const renderEmailThreads = () => {
    if (!groupByThread) {
      return emails.map(email => renderEmailCard(email));
    }

    const threads = groupEmailsByThread(emails);
    
    return threads.map((thread, threadIndex) => (
      <div key={threadIndex} className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-muted">
            Thread {threadIndex + 1} ({thread.length} messages)
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>
        
        {thread.map((email, emailIndex) => (
          <div key={email.id}>
            {renderEmailCard(email, emailIndex > 0)}
          </div>
        ))}
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted">Loading email timeline...</span>
      </div>
    );
  }

  if (emails['length'] === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted mb-4">
          📧 No emails found for this {entityType}
        </div>
        <div className="text-sm text-muted">
          Emails will appear here when they are connected to this {entityType}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            📧 Email Timeline
          </h2>
          <p className="text-sm text-muted">
            {emails.length} email{emails.length !== 1 ? 's' : ''} connected to {entityName || 'this record'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setGroupByThread(!groupByThread)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              groupByThread 
                ? 'bg-primary text-[var(--accent-foreground)]' 
                : 'bg-background border border-border text-foreground'
            }`}
          >
            {groupByThread ? 'Show All' : 'Group Threads'}
          </button>
        </div>
      </div>

      {/* Email Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-background border border-border rounded-lg p-3">
          <div className="text-2xl font-bold text-foreground">{emails.length}</div>
          <div className="text-sm text-muted">Total Emails</div>
        </div>
        
        <div className="bg-background border border-border rounded-lg p-3">
          <div className="text-2xl font-bold text-green-600">
            {emails.filter(e => e.from.includes('dano') || e.from.includes('retail-products')).length}
          </div>
          <div className="text-sm text-muted">Outgoing</div>
        </div>
        
        <div className="bg-background border border-border rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-600">
            {emails.filter(e => !e.from.includes('dano') && !e.from.includes('retail-products')).length}
          </div>
          <div className="text-sm text-muted">Incoming</div>
        </div>
        
        <div className="bg-background border border-border rounded-lg p-3">
          <div className="text-2xl font-bold text-purple-600">
            {emails.filter(e => e.buyingSignal).length}
          </div>
          <div className="text-sm text-muted">Buying Signals</div>
        </div>
      </div>

      {/* Email Timeline */}
      <div className="max-h-96 overflow-y-auto">
        {renderEmailThreads()}
      </div>

      {/* Email Detail Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedEmail(null)}>
          <div className="bg-background border border-border rounded-lg max-w-4xl max-h-[80vh] w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  {selectedEmail.subject || '(No Subject)'}
                </h3>
                <button 
                  onClick={() => setSelectedEmail(null)}
                  className="text-muted hover:text-foreground text-xl"
                >
                  ×
                </button>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="text-sm">
                  <span className="font-medium text-foreground">From:</span>
                  <span className="ml-2 text-muted">{selectedEmail.from}</span>
                </div>
                
                <div className="text-sm">
                  <span className="font-medium text-foreground">To:</span>
                  <span className="ml-2 text-muted">{selectedEmail.to.join(', ')}</span>
                </div>
                
                {selectedEmail['cc'] && selectedEmail.cc.length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium text-foreground">CC:</span>
                    <span className="ml-2 text-muted">{selectedEmail.cc.join(', ')}</span>
                  </div>
                )}
                
                <div className="text-sm">
                  <span className="font-medium text-foreground">Date:</span>
                  <span className="ml-2 text-muted">
                    {new Date(selectedEmail.receivedAt).toLocaleString()}
                  </span>
                </div>

                {selectedEmail['buyingSignal'] && (
                  <div className="text-sm">
                    <span className="font-medium text-foreground">Buying Signal:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${getBuyingSignalColor(selectedEmail.buyingSignal)}`}>
                      {selectedEmail.buyingSignal.replace('_', ' ')} ({Math.round((selectedEmail.buyingSignalScore || 0) * 100)}%)
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              <div 
                className="text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: selectedEmail.body.replace(/\n/g, '<br>') 
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
