"use client";

import { useState, useEffect } from 'react';
import { Loader } from '@/platform/ui/components/Loader';

interface PasswordProtectionProps {
  children: React.ReactNode;
  correctPassword: string;
}

export default function PasswordProtection({ children, correctPassword }: PasswordProtectionProps) {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  // Simple hash function for cookie security
  const hashPassword = (pwd: string): string => {
    let hash = 0;
    for (let i = 0; i < pwd.length; i++) {
      const char = pwd.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  };

  // Cookie management functions
  const setAuthCookie = () => {
    const hashedPassword = hashPassword(correctPassword);
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + 7); // 7 days expiration
    document['cookie'] = `snyk_auth=${hashedPassword}; expires=${expireDate.toUTCString()}; path=/; secure; samesite=strict`;
  };

  const getAuthCookie = (): string | null => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'snyk_auth') {
        return value || null;
      }
    }
    return null;
  };

  const clearAuthCookie = () => {
    document['cookie'] = 'snyk_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  };

  // Check for existing authentication on component mount
  useEffect(() => {
    setMounted(true);
    
    // Only check cookies after mounting to prevent hydration mismatch
    const authCookie = getAuthCookie();
    const expectedHash = hashPassword(correctPassword);
    
    if (authCookie === expectedHash) {
      setIsAuthenticated(true);
    }
  }, [correctPassword]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === correctPassword) {
      setIsAuthenticated(true);
      setAuthCookie(); // Set cookie on successful auth
      setError('');
    } else {
      setError('Incorrect passcode');
      setPassword('');
      clearAuthCookie(); // Clear any existing cookie on failed auth
    }
  };

  // Prevent hydration mismatch by showing consistent state until mounted
  if (!mounted) {
    return (
      <div className="h-screen bg-white flex items-center justify-center px-4" style={{ minHeight: '100vh' }}>
        <div className="max-w-md w-full" style={{ marginTop: '-10vh' }}>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">TOP Adrata</h1>
            <p className="text-gray-600">This content is private</p>
          </div>
          <form className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Passcode
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                placeholder="Enter passcode"
                disabled
              />
            </div>
            <button
              type="button"
              className="w-full bg-black text-white py-2 px-4 rounded-md font-medium opacity-50 flex items-center justify-center gap-2"
              disabled
            >
              <Loader size="sm" />
              Loading...
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="relative min-h-screen">
        {children}
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex items-center justify-center px-4" style={{ minHeight: '100vh' }}>
      <div className="max-w-md w-full" style={{ marginTop: '-10vh' }}>
        <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">TOP Adrata</h1>
            <p className="text-gray-600">This content is private</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Passcode
            </label>
              <input
                type="password"
                id="password"
                value={password || ''}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                placeholder="Enter passcode"
                required
              />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>
          
          <button
            type="submit"
            className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors font-medium"
          >
            Access Content
          </button>
        </form>
      </div>
    </div>
  );
} 