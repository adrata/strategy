"use client";

/**
 * Inbox Middle Panel Component
 * 
 * Displays selected email content with header, body, and actions.
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
  StarIcon
} from '@heroicons/react/24/outline';

export function InboxMiddlePanel() {
  const { selectedEmail, markAsRead, loading } = useInbox();

  if (selectedEmail) {
    const fromParsed = parseEmailAddress(selectedEmail.from);
    const timestamp = formatEmailTimestamp(selectedEmail.receivedAt);
    const bodyContent = selectedEmail.bodyHtml 
      ? extractPlainText(selectedEmail.bodyHtml) 
      : selectedEmail.body;
    const attachments = selectedEmail.attachments as any[] | null;

    return (
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-border p-4">
          <div className="flex items-center gap-2 mb-2 text-sm text-muted">
            <span>Inbox</span>
            {selectedEmail.subject && (
              <>
                <span>&gt;</span>
                <span className="truncate max-w-md" title={selectedEmail.subject}>
                  {selectedEmail.subject || '(No Subject)'}
                </span>
              </>
            )}
          </div>
          
          {/* Email Header */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h1 className="text-xl font-semibold text-foreground">
                  {selectedEmail.subject || '(No Subject)'}
                </h1>
                {selectedEmail.isImportant && (
                  <StarIcon className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                )}
              </div>
            </div>
            
            <div className="space-y-1 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-muted w-16 flex-shrink-0">From:</span>
                <span className="text-foreground">
                  {fromParsed.name || fromParsed.email}
                  {fromParsed.name && (
                    <span className="text-muted"> &lt;{fromParsed.email}&gt;</span>
                  )}
                </span>
              </div>
              
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
              
              <div className="flex items-center gap-2">
                <span className="text-muted w-16 flex-shrink-0">Date:</span>
                <span className="text-foreground">{timestamp}</span>
              </div>
              
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

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <button
                onClick={() => markAsRead(selectedEmail.id, !selectedEmail.isRead)}
                className="px-3 py-1.5 text-sm bg-hover hover:bg-panel-background rounded transition-colors"
              >
                {selectedEmail.isRead ? 'Mark as Unread' : 'Mark as Read'}
              </button>
              <button className="px-3 py-1.5 text-sm bg-hover hover:bg-panel-background rounded transition-colors flex items-center gap-1">
                <ArrowUturnLeftIcon className="w-4 h-4" />
                Reply
              </button>
              <button className="px-3 py-1.5 text-sm bg-hover hover:bg-panel-background rounded transition-colors flex items-center gap-1">
                <ArrowUturnRightIcon className="w-4 h-4" />
                Forward
              </button>
              <button className="px-3 py-1.5 text-sm bg-hover hover:bg-panel-background rounded transition-colors flex items-center gap-1">
                <ArchiveBoxIcon className="w-4 h-4" />
                Archive
              </button>
              <button className="px-3 py-1.5 text-sm bg-hover hover:bg-panel-background rounded transition-colors flex items-center gap-1 text-red-600">
                <TrashIcon className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Email Body */}
        <div className="flex-1 overflow-y-auto p-4">
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
        <div className="flex-shrink-0 border-b border-border p-4">
          <div className="flex items-center gap-2 mb-2 text-sm text-muted">
            <span>Inbox</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
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
      <div className="flex-shrink-0 border-b border-border p-4">
        <div className="flex items-center gap-2 mb-2 text-sm text-muted">
          <span>Inbox</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted text-sm">Select an email to view its contents</p>
        </div>
      </div>
    </div>
  );
}

