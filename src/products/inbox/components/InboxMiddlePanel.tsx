"use client";

/**
 * Inbox Middle Panel Component
 * 
 * Displays selected email content with header, body, and actions.
 * Modeled after Speedrun Sprint view for consistency.
 */

import React, { useState, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { useInbox } from '../context/InboxProvider';
import { formatEmailTimestamp, parseEmailAddress } from '../utils/emailFormatting';
import { 
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  PaperClipIcon,
  ArchiveBoxIcon,
  TrashIcon,
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

export function InboxMiddlePanel() {
  const { selectedEmail, emails, selectEmail, archiveEmail, deleteEmail, loading } = useInbox();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  // Sanitize HTML email content to prevent XSS attacks
  // Must be called unconditionally to follow Rules of Hooks
  const sanitizedHtml = useMemo(() => {
    if (selectedEmail?.bodyHtml) {
      return DOMPurify.sanitize(selectedEmail.bodyHtml, {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'pre', 'code', 'div', 'span',
          'table', 'thead', 'tbody', 'tr', 'td', 'th', 'hr'
        ],
        ALLOWED_ATTR: [
          'href', 'src', 'alt', 'title', 'class', 'style', 'width', 'height',
          'align', 'valign', 'colspan', 'rowspan', 'border', 'cellpadding', 'cellspacing'
        ],
        ALLOW_DATA_ATTR: false,
        // Allow safe email styling
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
      });
    }
    return null;
  }, [selectedEmail?.bodyHtml]);

  if (selectedEmail) {
    const fromParsed = parseEmailAddress(selectedEmail.from);
    const timestamp = formatEmailTimestamp(selectedEmail.receivedAt);
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
                  onClick={() => {
                    // TODO: Implement reply functionality
                    console.log('Reply to:', selectedEmail.from);
                  }}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 px-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Reply (Coming soon)"
                  disabled
                >
                  <ArrowUturnLeftIcon className="w-4 h-4 mr-1.5" />
                  Reply
                </button>
                <button 
                  onClick={() => {
                    // TODO: Implement forward functionality
                    console.log('Forward:', selectedEmail.subject);
                  }}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 w-9 text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Forward (Coming soon)"
                  disabled
                >
                  <ArrowUturnRightIcon className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setShowArchiveConfirm(true)}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 w-9 text-foreground hover:bg-accent hover:text-accent-foreground"
                  title="Archive"
                >
                  <ArchiveBoxIcon className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 w-9 text-foreground hover:bg-destructive hover:text-destructive-foreground"
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

          {sanitizedHtml ? (
            <div 
              className="prose prose-sm max-w-none text-foreground email-body"
              dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            />
          ) : (
            <div className="whitespace-pre-wrap text-foreground">
              {selectedEmail.body || 'No content'}
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

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div 
            className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[9999]" 
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div 
              className="bg-background border border-border rounded-lg shadow-xl p-6 max-w-sm mx-4 w-full" 
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Delete Email
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to delete this email? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-hover hover:bg-panel-background border border-border rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteEmail(selectedEmail.id);
                    setShowDeleteConfirm(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-destructive hover:bg-destructive/90 rounded-md transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Archive Confirmation Modal */}
        {showArchiveConfirm && (
          <div 
            className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[9999]" 
            onClick={() => setShowArchiveConfirm(false)}
          >
            <div 
              className="bg-background border border-border rounded-lg shadow-xl p-6 max-w-sm mx-4 w-full" 
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Archive Email
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to archive this email? You can find it in your archived emails later.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowArchiveConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-hover hover:bg-panel-background border border-border rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    archiveEmail(selectedEmail.id);
                    setShowArchiveConfirm(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors"
                >
                  Archive
                </button>
              </div>
            </div>
          </div>
        )}
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
            <PaperClipIcon className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Inbox</h1>
            <p className="text-sm text-muted-foreground">Select an email to view its contents</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-hover rounded-full flex items-center justify-center mx-auto mb-4">
            <PaperClipIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No Email Selected
          </h3>
          <p className="text-muted-foreground text-sm">
            Choose an email from the left panel to view its contents
          </p>
        </div>
      </div>
    </div>
  );
}

