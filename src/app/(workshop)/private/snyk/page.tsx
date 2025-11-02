"use client";

import PasswordProtection from '../PasswordProtection';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PrivateSnykPage() {
  const router = useRouter();

  return (
    <PasswordProtection correctPassword="Fortune500Snyk!">
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-4">Private Message for Snyk</h1>
          <p className="text-muted mb-8">Access granted. Redirecting you to your confidential business case...</p>
          <div className="space-y-4">
            <button
              onClick={() => router.push('/private/snyk/snyk-bgi-case')}
              className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors font-medium"
            >
              View Business Case Report
            </button>
          </div>
        </div>
      </div>
    </PasswordProtection>
  );
} 