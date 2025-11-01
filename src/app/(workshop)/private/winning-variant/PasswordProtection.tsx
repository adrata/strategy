"use client";

import React, { useState, useEffect } from 'react';

interface PasswordProtectionProps {
  children: React.ReactNode;
  correctPassword: string;
}

export default function PasswordProtection({ children, correctPassword }: PasswordProtectionProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
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
    const sessionAuth = sessionStorage.getItem('winning_variant_auth');
    if (sessionAuth === correctPassword) {
      setIsAuthenticated(true);
    }
  }, [correctPassword]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validatePassword(password)) {
      setIsAuthenticated(true);
      // Store in session storage for this session only
      sessionStorage.setItem('winning_variant_auth', correctPassword);
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };


  // Prevent hydration mismatch by returning null during SSR
  if (!mounted) {
    return null;
  }

  if (isAuthenticated) {
    return (
      <div className="relative" style={{ height: '100vh', overflow: 'auto' }}>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--panel-background)] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[var(--background)] rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Winning Variant Access</h1>
          <p className="text-[var(--muted)]">Enter the access code to view the Buyer Group Intelligence Reports</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Access Code
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter access code"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Access Reports
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-[var(--muted)]">
            Winning Variant - Buyer Group Intelligence<br/>
            Confidential Reports
          </p>
        </div>
      </div>
    </div>
  );
}
