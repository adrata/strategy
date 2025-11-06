"use client";

/**
 * Inbox Middle Panel Component
 * 
 * Displays selected email content with header, body, and actions.
 * Modeled after Speedrun Sprint view for consistency.
 */

import React from 'react';
import { useInbox } from '../context/InboxProvider';
import { formatEmailTimestamp, parseEmailAddress, extractPlainText } from '../utils/emailFormatting';
import { 
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  PaperClipIcon,
  ArchiveBoxIcon,
  TrashIcon,
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

export function InboxMiddlePanel() {
  const { selectedEmail, emails, selectEmail, markAsRead, loading } = useInbox();

  if (selectedEmail) {
    const fromParsed = parseEmailAddress(selectedEmail.from);
    const timestamp = formatEmailTimestamp(selectedEmail.receivedAt);
    const bodyContent = selectedEmail.bodyHtml 
      ? extractPlainText(selectedEmail.bodyHtml) 
      : selectedEmail.body;
    const attachments = selectedEmail.attachments as any[] | null;

    // Navigation helpers
    const currentIndex = emails.findIndex(e => e.id === selectedEmail.id);
    const canNavigatePrevious = currentIndex > 0;
    const canNavigateNext = currentIndex < emails.length - 1;

    const handleNavigatePrevious = () => {
      if (canNavigatePrevious && emails[currentIndex - 1]) {
        selectEmail(emails[currentIndex - 1]);
      }
    };

    const handleNavigateNext = () => {
      if (canNavigateNext && emails[currentIndex + 1]) {
        selectEmail(emails[currentIndex + 1]);
      }
    };

    // Get sender initials for avatar
    const getSenderInitials = () => {
      if (fromParsed.name) {
        const parts = fromParsed.name.split(' ');
        if (parts.length >= 2) {
          return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return fromParsed.name.substring(0, 2).toUpperCase();
      }
      return fromParsed.email.substring(0, 2).toUpperCase();
    };

    return (
      <div className="h-full flex flex-col bg-background">
        {/* Header - Modern shadcn style */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-border/50 bg-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Avatar with gradient */}
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-sm font-semibold text-white">
                  {getSenderInitials()}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-lg font-semibold text-foreground truncate">
                    {selectedEmail.subject || '(No Subject)'}
                  </h1>
                  {selectedEmail.isImportant && (
                    <StarIcon className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">{fromParsed.name || fromParsed.email}</span>
                  {fromParsed.name && (
                    <span className="text-muted-foreground/60">&lt;{fromParsed.email}&gt;</span>
                  )}
                  <span className="text-muted-foreground/40">•</span>
                  <span>{timestamp}</span>
                  {currentIndex >= 0 && (
                    <>
                      <span className="text-muted-foreground/40">•</span>
                      <span className="text-muted-foreground/60">{currentIndex + 1} of {emails.length}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons - shadcn style */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Navigation */}
              <div className="flex items-center gap-0.5 mr-2">
                <button
                  onClick={handleNavigatePrevious}
                  disabled={!canNavigatePrevious}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
                  title="Previous email"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNavigateNext}
                  disabled={!canNavigateNext}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
                  title="Next email"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
              
              {/* Email Actions */}
              <div className="flex items-center gap-1 border-l border-border/50 pl-2">
                <button
                  onClick={() => markAsRead(selectedEmail.id, !selectedEmail.isRead)}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent hover:text-accent-foreground h-9 px-3"
                  title={selectedEmail.isRead ? 'Mark as Unread' : 'Mark as Read'}
                >
                  <EnvelopeIcon className="w-4 h-4 mr-1.5" />
                  {selectedEmail.isRead ? 'Unread' : 'Read'}
                </button>
                <button 
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent hover:text-accent-foreground h-9 px-3"
                  title="Reply"
                >
                  <ArrowUturnLeftIcon className="w-4 h-4 mr-1.5" />
                  Reply
                </button>
                <button 
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent hover:text-accent-foreground h-9 w-9"
                  title="Forward"
                >
                  <ArrowUturnRightIcon className="w-4 h-4" />
                </button>
                <button 
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent hover:text-accent-foreground h-9 w-9"
                  title="Archive"
                >
                  <ArchiveBoxIcon className="w-4 h-4" />
                </button>
                <button 
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-destructive hover:text-destructive-foreground h-9 w-9"
                  title="Delete"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Email Metadata */}
          <div className="space-y-2 text-sm pt-3 border-t border-border">
            {selectedEmail.to && selectedEmail.to.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-muted w-16 flex-shrink-0">To:</span>
                <span className="text-foreground">
                  {selectedEmail.to.join(', ')}
                </span>
              </div>
            )}
            
            {selectedEmail.cc && selectedEmail.cc.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-muted w-16 flex-shrink-0">CC:</span>
                <span className="text-foreground">
                  {selectedEmail.cc.join(', ')}
                </span>
              </div>
            )}
            
            {selectedEmail.bcc && selectedEmail.bcc.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-muted w-16 flex-shrink-0">BCC:</span>
                <span className="text-foreground">
                  {selectedEmail.bcc.join(', ')}
                </span>
              </div>
            )}
            
            {selectedEmail.labels && selectedEmail.labels.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-muted w-16 flex-shrink-0">Labels:</span>
                <div className="flex gap-1 flex-wrap">
                  {selectedEmail.labels.map((label, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs bg-hover rounded text-foreground"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Email Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {attachments && attachments.length > 0 && (
            <div className="mb-4 pb-4 border-b border-border">
              <div className="flex items-center gap-2 mb-2">
                <PaperClipIcon className="w-4 h-4 text-muted" />
                <span className="text-sm font-medium text-foreground">
                  {attachments.length} attachment{attachments.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-1">
                {attachments.map((attachment: any, idx: number) => (
                  <div key={idx} className="text-sm text-muted">
                    {attachment.name || attachment.filename || 'Attachment'}
                    {attachment.size && (
                      <span className="ml-2">({(attachment.size / 1024).toFixed(1)} KB)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedEmail.bodyHtml ? (
            <div 
              className="prose prose-sm max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }}
            />
          ) : (
            <div className="whitespace-pre-wrap text-foreground">
              {bodyContent || 'No content'}
            </div>
          )}

          {/* Linked Person/Company Info */}
          {(selectedEmail.person || selectedEmail.company) && (
            <div className="mt-6 pt-4 border-t border-border">
              <div className="text-sm text-muted">
                {selectedEmail.person && (
                  <div className="mb-2">
                    <span className="font-medium">Linked to:</span> {selectedEmail.person.fullName || selectedEmail.person.email}
                  </div>
                )}
                {selectedEmail.company && (
                  <div>
                    <span className="font-medium">Company:</span> {selectedEmail.company.name}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Empty state - show loading skeleton only when actually loading
  if (loading) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="flex-shrink-0 px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-loading-bg rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="h-6 w-64 bg-loading-bg rounded animate-pulse mb-2"></div>
                <div className="h-4 w-48 bg-loading-bg rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-2">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-4 bg-loading-bg rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state - no email selected
  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-shrink-0 px-6 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-hover rounded-full flex items-center justify-center">
            <EnvelopeIcon className="w-6 h-6 text-muted" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Inbox</h1>
            <p className="text-sm text-muted">Select an email to view its contents</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-hover rounded-full flex items-center justify-center mx-auto mb-4">
            <EnvelopeIcon className="w-8 h-8 text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No Email Selected
          </h3>
          <p className="text-muted text-sm">
            Choose an email from the left panel to view its contents
          </p>
        </div>
      </div>
    </div>
  );
}

