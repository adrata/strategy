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

  // Hard-coded password validation - no external dependencies
  const validatePassword = (inputPassword: string): boolean => {
    return inputPassword === correctPassword;
  };

  // Check for existing authentication on component mount
  useEffect(() => {
    setMounted(true);
    
    // Check if already authenticated in this session
    const sessionAuth = sessionStorage.getItem('hardcoded_auth');
    if (sessionAuth === correctPassword) {
      setIsAuthenticated(true);
    }
  }, [correctPassword]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validatePassword(password)) {
      setIsAuthenticated(true);
      // Store in session storage for this session only
      sessionStorage.setItem('hardcoded_auth', correctPassword);
      setError('');
    } else {
      setError('Incorrect passcode');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('hardcoded_auth');
    setPassword('');
  };

  // Prevent hydration mismatch by showing consistent state until mounted
  if (!mounted) {
    return (
      <div className="h-screen bg-background flex items-center justify-center px-4" style={{ minHeight: '100vh' }}>
        <div className="max-w-md w-full" style={{ marginTop: '-10vh' }}>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-foreground mb-2">TOP Adrata</h1>
            <p className="text-muted">This content is private</p>
          </div>
          <form className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Passcode
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
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
        {/* Logout button */}
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={handleLogout}
            className="bg-gray-600 text-white px-3 py-1 rounded-md text-sm hover:bg-gray-700 transition-colors"
          >
            Logout
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex items-center justify-center px-4" style={{ minHeight: '100vh' }}>
      <div className="max-w-md w-full" style={{ marginTop: '-10vh' }}>
        <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-foreground mb-2">TOP Adrata</h1>
            <p className="text-muted">This content is private</p>
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
                className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
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