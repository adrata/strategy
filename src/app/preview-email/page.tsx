"use client";

import React, { useState, useMemo } from 'react';
import { generateInvitationEmailHTML } from '@/platform/services/InvitationEmailService';

export default function PreviewEmailPage() {
  const [workspaceName, setWorkspaceName] = useState('CloudCaddie');
  const [userName, setUserName] = useState('John');
  const [userEmail, setUserEmail] = useState('john@example.com');
  const [inviterName, setInviterName] = useState('Adrata Client Team');
  const [inviterEmail, setInviterEmail] = useState('noreply@adrata.com');
  const [invitationLink, setInvitationLink] = useState('https://adrata.com/setup-account?token=test-token-123');
  
  const expiresAt = useMemo(() => new Date(Date.now() + 48 * 60 * 60 * 1000), []); // 48 hours from now

  const emailHTML = useMemo(() => generateInvitationEmailHTML({
    to: userEmail,
    inviterName,
    inviterEmail,
    workspaceName,
    invitationLink,
    expiresAt,
    userEmail,
    userName,
  }), [workspaceName, userName, userEmail, inviterName, inviterEmail, invitationLink, expiresAt]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Email Preview</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Email Parameters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Workspace Name
              </label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Email
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inviter Name
              </label>
              <input
                type="text"
                value={inviterName}
                onChange={(e) => setInviterName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inviter Email
              </label>
              <input
                type="email"
                value={inviterEmail}
                onChange={(e) => setInviterEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invitation Link
              </label>
              <input
                type="text"
                value={invitationLink}
                onChange={(e) => setInvitationLink(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Email Preview</h2>
            <div className="border border-gray-300 rounded-md overflow-hidden">
              <iframe
                srcDoc={emailHTML}
                className="w-full h-[800px] border-0"
                title="Email Preview"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Email HTML</h2>
            <div className="border border-gray-300 rounded-md overflow-auto max-h-[800px]">
              <pre className="p-4 text-xs bg-gray-50 whitespace-pre-wrap break-words">
                {emailHTML}
              </pre>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(emailHTML);
                alert('HTML copied to clipboard!');
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Copy HTML
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
