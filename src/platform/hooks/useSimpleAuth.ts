/**
 * Simple Authentication Hook
 * 
 * Provides unified authentication state management across web/desktop/mobile platforms.
 * Follows 2025 best practices for React hooks and authentication patterns.
 */

"use client";

import { useState, useEffect } from 'react';

// -------- Types & interfaces --------
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

// -------- Constants --------
const AUTH_STORAGE_KEYS = {
  TOKEN: 'adrata_auth_token',
  USER: 'adrata_user',
} as const;

const CACHE_KEYS = {
  SPEEDRUN_ENGINE: 'speedrun-engine-settings',
  WORKSPACE: 'workspace-cache',
  USER_PREFERENCES: 'user-preferences',
  DASHBOARD: 'dashboard-cache',
  PIPELINE: 'pipeline-cache',
} as const;

// Theme keys that should be preserved during sign-out to prevent theme flash
const THEME_KEYS_TO_PRESERVE = [
  'adrata-theme-preferences',
  'adrata-theme-mode',
  'adrata-light-theme',
  'adrata-dark-theme',
] as const;

// -------- Helpers --------
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function getStoredAuthData(): { token: string | null; userData: string | null } {
  if (!isBrowser()) return { token: null, userData: null };
  
  return {
    token: localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN),
    userData: localStorage.getItem(AUTH_STORAGE_KEYS.USER),
  };
}

function clearAuthStorage(): void {
  if (!isBrowser()) return;
  
  localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
  localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
  sessionStorage.clear();
}

function clearCacheStorage(): void {
  if (!isBrowser()) return;
  
  Object.values(CACHE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Clear browser caches
  if (window.caches) {
    caches.keys().then(names => {
      names.forEach(name => {
        if (name.includes('adrata') || name.includes('workspace')) {
          caches.delete(name);
        }
      });
    });
  }
}

// Helper function to clear all localStorage except theme preferences
function clearLocalStorageExceptTheme(): void {
  if (!isBrowser()) return;
  
  // Save theme preferences before clearing
  const themeData: Record<string, string | null> = {};
  THEME_KEYS_TO_PRESERVE.forEach(key => {
    themeData[key] = localStorage.getItem(key);
  });
  
  // Clear all localStorage
  localStorage.clear();
  
  // Restore theme preferences to prevent flash
  Object.entries(themeData).forEach(([key, value]) => {
    if (value !== null) {
      localStorage.setItem(key, value);
    }
  });
  
  console.log('🎨 [SIGN-OUT] Theme preferences preserved to prevent flash');
}

// -------- Main hook --------
export function useSimpleAuth() {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async (): Promise<void> => {
    try {
      const { token, userData } = getStoredAuthData();
      
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
        
        // Store authentication data
        if (isBrowser() && result.token) {
          localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, result.token);
          localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(result.user));
        }

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

  const signOut = async (): Promise<void> => {
    try {
      console.log('🚪 [SIGN-OUT] Starting optimized sign-out process...');
      
      // Clear state immediately for instant UI feedback
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear critical storage immediately
      clearAuthStorage();
      
      // Redirect immediately, clear cache storage in background
      if (isBrowser()) {
        window.location.replace('/sign-in');
        
        // Clear additional storage in background (non-blocking)
        setTimeout(() => {
          clearCacheStorage();
        }, 0);
      }
      
      console.log('✅ [SIGN-OUT] Critical storage cleared, redirecting immediately...');
      
    } catch (error) {
      console.error('❌ [SIGN-OUT] Error during sign-out:', error);
      // Fallback: force redirect even if there's an error
      if (isBrowser()) {
        window.location.href = '/sign-in';
      }
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
