"use client";

/**
 * Email Compose Modal Component
 * 
 * Modal dialog for composing and sending emails, similar to modern email clients
 * (Superhuman, Outlook, Gmail).
 */

import React, { useState, useEffect } from 'react';
import * as Dialog from "@radix-ui/react-dialog";
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEscapeKey } from '@/platform/hooks/useEscapeKey';

interface EmailComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  onSendSuccess?: () => void;
}

export function EmailComposeModal({
  isOpen,
  onClose,
  userEmail,
  onSendSuccess
}: EmailComposeModalProps) {
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showBcc, setShowBcc] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Use escape key hook
  useEscapeKey(isOpen, onClose);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Reset after a short delay to allow close animation
      setTimeout(() => {
        setTo('');
        setCc('');
        setBcc('');
        setSubject('');
        setBody('');
        setShowBcc(false);
        setError(null);
        setSuccess(false);
      }, 200);
    }
  }, [isOpen]);

  // Convert plain text to HTML (preserve line breaks)
  const convertTextToHtml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  };

  // Validate email format (simple validation)
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  // Parse email addresses (comma or semicolon separated)
  const parseEmailAddresses = (input: string): string[] => {
    if (!input.trim()) return [];
    return input
      .split(/[,;]/)
      .map(email => email.trim())
      .filter(email => email.length > 0);
  };

  const handleSend = async () => {
    // Reset error/success states
    setError(null);
    setSuccess(false);

    // Validation
    if (!to.trim()) {
      setError('Please enter a recipient email address');
      return;
    }

    if (!subject.trim()) {
      setError('Please enter a subject');
      return;
    }

    if (!body.trim()) {
      setError('Please enter an email body');
      return;
    }

    // Validate email addresses
    const toAddresses = parseEmailAddresses(to);
    const invalidToAddresses = toAddresses.filter(addr => !validateEmail(addr));
    if (invalidToAddresses.length > 0) {
      setError(`Invalid email address(es) in To field: ${invalidToAddresses.join(', ')}`);
      return;
    }

    const ccAddresses = parseEmailAddresses(cc);
    const invalidCcAddresses = ccAddresses.filter(addr => !validateEmail(addr));
    if (invalidCcAddresses.length > 0) {
      setError(`Invalid email address(es) in CC field: ${invalidCcAddresses.join(', ')}`);
      return;
    }

    const bccAddresses = parseEmailAddresses(bcc);
    const invalidBccAddresses = bccAddresses.filter(addr => !validateEmail(addr));
    if (invalidBccAddresses.length > 0) {
      setError(`Invalid email address(es) in BCC field: ${invalidBccAddresses.join(', ')}`);
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      // Convert body to HTML
      const htmlBody = convertTextToHtml(body);
      const textBody = body; // Plain text version

      // Prepare email data
      const emailData = {
        to: toAddresses.length === 1 ? toAddresses[0] : toAddresses,
        subject: subject.trim(),
        html: htmlBody,
        text: textBody,
        from: userEmail || undefined, // Use user's email if available, otherwise API will use default
        cc: ccAddresses.length > 0 ? (ccAddresses.length === 1 ? ccAddresses[0] : ccAddresses) : undefined,
        bcc: bccAddresses.length > 0 ? (bccAddresses.length === 1 ? bccAddresses[0] : bccAddresses) : undefined,
      };

      // Send email
      const response = await fetch('/api/v1/communications/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(emailData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to send email');
      }

      // Success
      setSuccess(true);
      
      // Call success callback if provided
      if (onSendSuccess) {
        onSendSuccess();
      }

      // Close modal after a brief delay
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (err) {
      console.error('Error sending email:', err);
      setError(err instanceof Error ? err.message : 'Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed bottom-4 right-4 bg-background border border-border rounded-xl shadow-2xl z-50 focus:outline-none w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              New Message
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="p-1 hover:bg-hover rounded transition-colors"
                aria-label="Close dialog"
                disabled={isSending}
              >
                <XMarkIcon className="w-5 h-5 text-muted" />
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* To Field */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                To
              </label>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Recipient email address"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                disabled={isSending || success}
                autoFocus
              />
            </div>

            {/* CC Field */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Cc
              </label>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="CC email address(es)"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                disabled={isSending || success}
              />
            </div>

            {/* BCC Field - Collapsible */}
            {showBcc ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-muted">
                    Bcc
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowBcc(false)}
                    className="text-xs text-muted hover:text-foreground"
                    disabled={isSending || success}
                  >
                    Hide
                  </button>
                </div>
                <input
                  type="text"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="BCC email address(es)"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  disabled={isSending || success}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowBcc(true)}
                className="text-xs text-muted hover:text-foreground"
                disabled={isSending || success}
              >
                + Bcc
              </button>
            )}

            {/* Subject Field */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                disabled={isSending || success}
              />
            </div>

            {/* Body Field */}
            <div className="flex-1 min-h-[300px]">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Compose your message..."
                className="w-full h-full min-h-[300px] px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                disabled={isSending || success}
              />
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
                Email sent successfully!
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-border">
            <div className="text-xs text-muted">
              {userEmail ? `From: ${userEmail}` : 'From: Adrata'}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-hover transition-colors"
                disabled={isSending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={isSending || success || !to.trim() || !subject.trim() || !body.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSending ? 'Sending...' : success ? 'Sent!' : 'Send'}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

