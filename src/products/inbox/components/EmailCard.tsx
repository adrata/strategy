"use client";

import React from 'react';
import { EmailMessage } from '../context/InboxProvider';
import { formatEmailTimestamp, getSenderName, getEmailPreview } from '../utils/emailFormatting';

interface EmailCardProps {
  email: EmailMessage;
  isSelected: boolean;
  onClick: () => void;
}

export function EmailCard({ email, isSelected, onClick }: EmailCardProps) {
  const senderName = getSenderName(email.from);
  const preview = getEmailPreview(email.body, email.bodyHtml);
  const timestamp = formatEmailTimestamp(email.receivedAt);

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border relative ${
        isSelected
          ? 'bg-hover text-foreground border-border shadow-sm'
          : email.isRead
            ? 'bg-background hover:bg-panel-background border-gray-100 hover:border-border hover:shadow-sm'
            : 'bg-background hover:bg-panel-background border-gray-100 hover:border-border hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {!email.isRead && (
              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
            )}
            <h3 className={`text-sm font-semibold truncate ${
              isSelected ? 'text-foreground' : email.isRead ? 'text-foreground' : 'text-foreground font-bold'
            }`}>
              {senderName}
            </h3>
          </div>
          <h4 className={`text-sm font-semibold truncate mb-1 ${
            isSelected ? 'text-foreground' : email.isRead ? 'text-foreground' : 'text-foreground font-bold'
          }`}>
            {email.subject || '(No Subject)'}
          </h4>
          <p className={`text-xs truncate mb-1 ${
            isSelected ? 'text-muted' : 'text-muted'
          }`}>
            {preview}
          </p>
        </div>
        <div className="flex-shrink-0 text-xs text-muted whitespace-nowrap ml-2">
          {timestamp}
        </div>
      </div>
      {email.isImportant && (
        <div className="absolute top-2 right-2">
          <span className="text-yellow-500 text-xs">★</span>
        </div>
      )}
    </div>
  );
}

