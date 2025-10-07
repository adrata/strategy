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
      setError('Incorrect password. Please try again.');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">SBI Growth Access</h1>
            <p className="text-gray-600">Enter the access code to view the Flexera Buyer Group Intelligence Report</p>
          </div>
          <form className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Access Code
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter access code"
                disabled
              />
            </div>
            <button
              type="button"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md opacity-50 cursor-not-allowed"
              disabled
            >
              Loading...
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="relative" style={{ height: '100vh', overflow: 'auto' }}>
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">SBI Growth Access</h1>
          <p className="text-gray-600">Enter the access code to view the Flexera Buyer Group Intelligence Report</p>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
            Access Report
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            SBI Growth - Flexera Buyer Group Intelligence<br/>
            Confidential Report
          </p>
        </div>
      </div>
    </div>
  );
}
