"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useUnifiedAuth } from '@/platform/auth';

export interface EmailMessage {
  id: string;
  provider: string;
  messageId: string;
  threadId: string | null;
  subject: string;
  body: string;
  bodyHtml: string | null;
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  sentAt: Date | string;
  receivedAt: Date | string;
  isRead: boolean;
  isImportant: boolean;
  attachments: any;
  labels: string[];
  person: {
    id: string;
    fullName: string | null;
    email: string | null;
    jobTitle: string | null;
  } | null;
  company: {
    id: string;
    name: string;
    domain: string | null;
  } | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface InboxFilters {
  unreadOnly: boolean;
  provider: 'all' | 'outlook' | 'gmail';
  searchQuery: string;
}

interface InboxStats {
  total: number;
  unread: number;
  urgent: number;
}

interface InboxContextType {
  // State
  emails: EmailMessage[];
  selectedEmail: EmailMessage | null;
  stats: InboxStats;
  filters: InboxFilters;
  loading: boolean;
  refreshing: boolean;
  
  // Actions
  selectEmail: (email: EmailMessage | null) => void;
  setFilters: (filters: Partial<InboxFilters>) => void;
  markAsRead: (emailId: string, isRead: boolean) => Promise<void>;
  archiveEmail: (emailId: string) => Promise<void>;
  deleteEmail: (emailId: string) => Promise<void>;
  refreshEmails: () => Promise<void>;
}

const InboxContext = createContext<InboxContextType | undefined>(undefined);

interface InboxProviderProps {
  children: ReactNode;
}

export function InboxProvider({ children }: InboxProviderProps) {
  const { user } = useUnifiedAuth();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [stats, setStats] = useState<InboxStats>({
    total: 0,
    unread: 0,
    urgent: 0
  });
  const [filters, setFiltersState] = useState<InboxFilters>({
    unreadOnly: false,
    provider: 'all',
    searchQuery: ''
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEmails = useCallback(async () => {
    if (!user?.activeWorkspaceId) {
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({
        workspaceId: user.activeWorkspaceId,
        limit: '100',
        sortBy: 'receivedAt',
        sortOrder: 'desc'
      });

      if (filters.provider !== 'all') {
        params.append('provider', filters.provider);
      }

      const response = await fetch(`/api/v1/emails?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch emails');
      }

      const data = await response.json();
      // Handle both old format (direct) and new format (wrapped in data)
      const emailsData = data.data || data;
      let fetchedEmails: EmailMessage[] = emailsData.emails || [];

      // Apply filters
      if (filters.unreadOnly) {
        fetchedEmails = fetchedEmails.filter(email => !email.isRead);
      }

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        fetchedEmails = fetchedEmails.filter(email => 
          email.subject.toLowerCase().includes(query) ||
          email.body.toLowerCase().includes(query) ||
          email.from.toLowerCase().includes(query)
        );
      }

      setEmails(fetchedEmails);

      // Calculate stats
      const total = fetchedEmails.length;
      const unread = fetchedEmails.filter(e => !e.isRead).length;
      const urgent = fetchedEmails.filter(e => e.isImportant).length;

      setStats({
        total,
        unread,
        urgent
      });
    } catch (error) {
      console.error('❌ Error fetching emails:', error);
      setEmails([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.activeWorkspaceId, filters]);

  const markAsRead = useCallback(async (emailId: string, isRead: boolean) => {
    try {
      const response = await fetch(`/api/v1/emails/${emailId}/read`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isRead })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update email read status');
      }

      // Update local state immediately for better UX
      setEmails(prev => prev.map(email => 
        email.id === emailId ? { ...email, isRead } : email
      ));

      setSelectedEmail(prev => {
        if (prev?.id === emailId) {
          return { ...prev, isRead };
        }
        return prev;
      });

      // Update stats without full refetch
      setStats(prev => {
        const email = emails.find(e => e.id === emailId);
        if (!email) return prev;
        
        const wasUnread = !email.isRead;
        const nowUnread = !isRead;
        
        let unread = prev.unread;
        if (wasUnread && nowUnread) {
          // No change
        } else if (wasUnread && !nowUnread) {
          unread = Math.max(0, unread - 1);
        } else if (!wasUnread && nowUnread) {
          unread = unread + 1;
        }
        
        return { ...prev, unread };
      });
    } catch (error) {
      console.error('❌ Error marking email as read:', error);
      // Revert optimistic update on error
      setEmails(prev => prev.map(email => 
        email.id === emailId ? { ...email, isRead: !isRead } : email
      ));
    }
  }, [emails]);
  
  const selectEmail = useCallback((email: EmailMessage | null) => {
    setSelectedEmail(email);
    
    // Mark as read when selected (but don't wait for it)
    if (email && !email.isRead) {
      markAsRead(email.id, true).catch(console.error);
    }
  }, [markAsRead]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Auto-select first email when emails load
  useEffect(() => {
    if (emails.length > 0 && !selectedEmail) {
      selectEmail(emails[0]);
    }
  }, [emails, selectedEmail, selectEmail]);

  const setFilters = useCallback((newFilters: Partial<InboxFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const archiveEmail = useCallback(async (emailId: string) => {
    try {
      const response = await fetch(`/api/v1/emails/${emailId}/archive`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to archive email');
      }

      // Remove from list
      setEmails(prev => prev.filter(email => email.id !== emailId));
      
      // Clear selection if archived
      if (selectedEmail?.id === emailId) {
        const currentIndex = emails.findIndex(e => e.id === emailId);
        if (currentIndex > 0 && emails[currentIndex - 1]) {
          selectEmail(emails[currentIndex - 1]);
        } else if (emails[currentIndex + 1]) {
          selectEmail(emails[currentIndex + 1]);
        } else {
          selectEmail(null);
        }
      }

      // Update stats
      setStats(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1)
      }));
    } catch (error) {
      console.error('❌ Error archiving email:', error);
    }
  }, [emails, selectedEmail, selectEmail]);

  const deleteEmail = useCallback(async (emailId: string) => {
    try {
      const response = await fetch(`/api/v1/emails/${emailId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete email');
      }

      // Remove from list
      setEmails(prev => prev.filter(email => email.id !== emailId));
      
      // Clear selection if deleted
      if (selectedEmail?.id === emailId) {
        const currentIndex = emails.findIndex(e => e.id === emailId);
        if (currentIndex > 0 && emails[currentIndex - 1]) {
          selectEmail(emails[currentIndex - 1]);
        } else if (emails[currentIndex + 1]) {
          selectEmail(emails[currentIndex + 1]);
        } else {
          selectEmail(null);
        }
      }

      // Update stats
      setStats(prev => {
        const email = emails.find(e => e.id === emailId);
        return {
          total: Math.max(0, prev.total - 1),
          unread: email && !email.isRead ? Math.max(0, prev.unread - 1) : prev.unread,
          urgent: email && email.isImportant ? Math.max(0, prev.urgent - 1) : prev.urgent
        };
      });
    } catch (error) {
      console.error('❌ Error deleting email:', error);
    }
  }, [emails, selectedEmail, selectEmail]);

  const refreshEmails = useCallback(async () => {
    setRefreshing(true);
    await fetchEmails();
  }, [fetchEmails]);

  const value: InboxContextType = {
    emails,
    selectedEmail,
    stats,
    filters,
    loading,
    refreshing,
    selectEmail,
    setFilters,
    markAsRead,
    archiveEmail,
    deleteEmail,
    refreshEmails
  };

  return (
    <InboxContext.Provider value={value}>
      {children}
    </InboxContext.Provider>
  );
}

export function useInbox(): InboxContextType {
  const context = useContext(InboxContext);
  if (context === undefined) {
    throw new Error('useInbox must be used within an InboxProvider');
  }
  return context;
}

