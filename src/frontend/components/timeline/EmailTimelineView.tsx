'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/platform/ui/components/ui/card';
import { Badge } from '@/platform/ui/components/ui/badge';
import { Button } from '@/platform/ui/components/ui/button';
import { 
  Mail, 
  Paperclip, 
  Clock, 
  User, 
  Building2, 
  ChevronDown, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface EmailTimelineViewProps {
  companyId?: string;
  personId?: string;
  workspaceId?: string;
  limit?: number;
}

interface EmailMessage {
  id: string;
  provider: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  from: string;
  to: string[];
  cc: string[];
  sentAt: string;
  receivedAt: string;
  isRead: boolean;
  isImportant: boolean;
  attachments: any[];
  labels: string[];
  person?: {
    id: string;
    fullName: string;
    email: string;
    jobTitle?: string;
  };
  company?: {
    id: string;
    name: string;
    domain?: string;
  };
}

export function EmailTimelineView({ 
  companyId, 
  personId, 
  workspaceId, 
  limit = 20 
}: EmailTimelineViewProps) {
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set());
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['emails', companyId, personId, workspaceId, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (companyId) params.append('companyId', companyId);
      if (personId) params.append('personId', personId);
      if (workspaceId) params.append('workspaceId', workspaceId);
      params.append('limit', limit.toString());
      params.append('sortBy', 'receivedAt');
      params.append('sortOrder', 'desc');
      
      const response = await fetch(`/api/v1/emails?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch emails');
      }
      return response.json();
    }
  });
  
  const toggleEmailExpansion = (emailId: string) => {
    const newExpanded = new Set(expandedEmails);
    if (newExpanded.has(emailId)) {
      newExpanded.delete(emailId);
    } else {
      newExpanded.add(emailId);
    }
    setExpandedEmails(newExpanded);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  
  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'outlook':
        return '📧';
      case 'gmail':
        return '📨';
      default:
        return '📧';
    }
  };
  
  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Failed to load emails: {error.message}</p>
        </CardContent>
      </Card>
    );
  }
  
  const emails: EmailMessage[] = data?.emails || [];
  
  if (emails.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No emails found</p>
          <p className="text-sm text-gray-500 mt-2">
            Connect your email account to start syncing emails
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Email Timeline</h3>
        <Badge variant="secondary">
          {emails.length} email{emails.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      
      {emails.map((email) => {
        const isExpanded = expandedEmails.has(email.id);
        const hasAttachments = email.attachments && email.attachments.length > 0;
        
        return (
          <Card key={email.id} className={`transition-all duration-200 ${!email.isRead ? 'border-l-4 border-l-blue-500' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="text-2xl">{getProviderIcon(email.provider)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <CardTitle className="text-base font-medium truncate">
                        {email.subject || '(No Subject)'}
                      </CardTitle>
                      {email.isImportant && (
                        <Badge variant="destructive" className="text-xs">
                          Important
                        </Badge>
                      )}
                      {!email.isRead && (
                        <Badge variant="default" className="text-xs">
                          Unread
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span className="truncate">{email.from}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(email.receivedAt)}</span>
                      </div>
                      {email.company && (
                        <div className="flex items-center space-x-1">
                          <Building2 className="h-3 w-3" />
                          <span className="truncate">{email.company.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {hasAttachments && (
                    <Paperclip className="h-4 w-4 text-gray-400" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleEmailExpansion(email.id)}
                    className="h-8 w-8 p-0"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {isExpanded && (
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Email Details */}
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="font-medium text-gray-700">To:</span>
                      <span className="ml-2 text-gray-600">{email.to.join(', ')}</span>
                    </div>
                    {email.cc.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-700">CC:</span>
                        <span className="ml-2 text-gray-600">{email.cc.join(', ')}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Email Body */}
                  <div className="border-t pt-4">
                    <div className="prose prose-sm max-w-none">
                      {email.bodyHtml ? (
                        <div 
                          dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
                          className="text-sm text-gray-700"
                        />
                      ) : (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {email.body}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Attachments */}
                  {hasAttachments && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments</h4>
                      <div className="space-y-1">
                        {email.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <Paperclip className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">{attachment.filename || attachment.name || `Attachment ${index + 1}`}</span>
                            {attachment.size && (
                              <span className="text-gray-500">
                                ({(attachment.size / 1024).toFixed(1)} KB)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Labels */}
                  {email.labels.length > 0 && (
                    <div className="border-t pt-4">
                      <div className="flex flex-wrap gap-1">
                        {email.labels.map((label, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
            
            {!isExpanded && email.body && (
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600">
                  {truncateText(email.body)}
                </p>
              </CardContent>
            )}
          </Card>
        );
      })}
      
      {data?.pagination?.hasMore && (
        <div className="text-center">
          <Button variant="outline" size="sm">
            Load More Emails
          </Button>
        </div>
      )}
    </div>
  );
}
