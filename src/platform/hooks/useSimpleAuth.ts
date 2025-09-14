"use client";

import { useState, useEffect } from 'react';

export interface SimpleUser {
  id: string;
  name: string;
  email: string;
  activeWorkspaceId: string;
  workspaces: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export interface AuthResult {
  success: boolean;
  user?: SimpleUser;
  error?: string;
  redirectPath?: string;
}

export function useSimpleAuth() {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check if we have a token in localStorage (for non-web platforms)
      const token = localStorage.getItem('adrata_auth_token');
      const userData = localStorage.getItem('adrata_user');
      
      if (token && userData) {
        // For now, assume token is valid if it exists
        // In a real implementation, you'd verify the token
        setIsAuthenticated(true);
        setUser(JSON.parse(userData));
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth status check error:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          platform: 'web'
        }),
      });

      const result = await response.json();

      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
        
        // Store token for non-web platforms
        if (result.token) {
          localStorage.setItem('adrata_auth_token', result.token);
        }

        // Store user data in localStorage for workspace layout compatibility
        localStorage.setItem('adrata_user', JSON.stringify(result.user));

        return {
          success: true,
          user: result.user,
          redirectPath: result.redirectPath
        };
      } else {
        setIsAuthenticated(false);
        return {
          success: false,
          error: result.error || 'Authentication failed'
        };
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      setIsAuthenticated(false);
      return {
        success: false,
        error: 'Network error. Please try again.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('adrata_auth_token');
      localStorage.removeItem('adrata_user');
      
      // Clear state
      setUser(null);
      setIsAuthenticated(false);
      
      // Redirect to sign-in page
      if (typeof window !== 'undefined') {
        window['location']['href'] = '/sign-in';
      }
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    signIn,
    signOut,
    checkAuthStatus
  };
}
